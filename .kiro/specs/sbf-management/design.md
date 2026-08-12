# SBF 관리 시스템 설계

## 1. 아키텍처

MVP는 웹 프론트엔드, API 계층, 관계형 DB, 파일 처리 워커, 인앱 알림으로 구성한다. UI는 첨부 화면처럼 좌측 업무 메뉴·상단 컨텍스트 바·필터 가능한 고밀도 표를 사용한다. API는 권한 검증, 상태 전이, 충돌 검증을 한 서비스 계층에서 수행하며 DB 제약을 최종 방어선으로 둔다.

- **Frontend**: React/TypeScript, 반응형 관리 콘솔, 서버 페이지네이션
- **Application API**: REST/JSON, RBAC·상태머신·변경 diff·감사 이벤트
- **Database**: PostgreSQL 권장. 트랜잭션, JSONB 원본 스냅샷, 부분 인덱스 활용
- **Import worker**: Excel 스트리밍 파싱, staging 적재, 검증, 미리보기, 승인 반영
- **JiraAdapter**: MVP는 ManualJiraAdapter, 2단계에서 ApiJiraAdapter로 교체

## 2. 주요 컴포넌트

1. `MasterExplorer`: 계층형/표형 조회, 통합검색, 상세 drawer, Excel 내보내기. (SBF-01~05)
2. `ChangeRequestWorkspace`: 다중 변경항목, 전후 비교, 검토 의견, 상태 전이. (CR-01~08)
3. `MappingWorkbench`: IA-L3 N:N 연결과 유효기간 관리. (MAP-01~04)
4. `ImportPipeline`: `1. IA` 탐색, 열 매핑, 정규화, 차단 오류/경고, 미리보기. (IMP-01~08)
5. `RevisionService`: 변경 전후 스냅샷과 시점 복원. (HIS-01~02)
6. `AuditService`: 사용자·역할·IP·상관 ID·변경 payload 기록. (AUTH-04)
7. `NotificationCenter`: 인앱 이벤트와 읽음 상태. (NOTI-01)

## 3. 데이터 모델

- `User(id, login_id, name, organization_id, active)` / `Organization(id, parent_id, name, code)`
- `Role(id, code, name)` / `Permission(id, resource, action)` / 역할-권한·사용자-역할 연결표
- `SbfItem(id, business_id, sub_id, sort_no, domain, squad, category, depth1..4, attributes_json, active, current_revision_id, row_version)`
- `SbfHierarchy(id, parent_item_id, child_item_id, depth_level, sort_no)`
- `L3Task(id, l3_id, name, organization_id, active)`
- `SbfL3Mapping(id, sbf_item_id, l3_task_id, basis, valid_from, valid_to, change_request_id)`
- `ChangeRequest(id, request_no, title, type, requester_id, reviewer_id, status, base_revision_no, reason, row_version)`
- `ChangeRequestItem(id, request_id, target_item_id, operation, field_name, before_json, after_json, reason)`
- `Review(id, request_id, reviewer_id, decision, opinion, created_at)` / `Comment`, `Assignment`
- `StatusHistory(id, request_id, from_status, to_status, actor_id, reason, created_at)`
- `SbfRevision(id, sbf_item_id, revision_no, snapshot_json, effective_at, request_id, actor_id)`
- `JiraReference(id, request_id, issue_key, url, sync_status, synced_at, error)`
- `Attachment(id, request_id, file_key, original_name, mime, size, checksum)`
- `Notification`, `CodeDefinition`, `ImportJob`, `ImportError`, `AuditLog`

### 제약과 인덱스

- 활성 SBF의 `(business_id, sub_id)` 유니크. 원본에서 업무ID 하나에 여러 SUB가 존재하므로 업무ID 단독 유니크 금지.
- 활성 매핑의 `(sbf_item_id, l3_task_id, valid_to IS NULL)` 유니크.
- `ChangeRequest.row_version`, `SbfItem.row_version`을 이용한 낙관적 잠금.
- 검색: business_id, domain, depth1~4, 담당 조직, 상태 B-tree; 업무명·L3명 full-text/trigram.
- 삭제는 `active=false`와 유효종료를 기본으로 하며 감사 대상 테이블은 물리 삭제 금지.

## 4. 상태 머신

`DRAFT → RECEIVED → IN_REVIEW ↔ NEEDS_SUPPLEMENT → APPROVED → IN_PROGRESS → WORK_DONE → JIRA_DONE`

예외 전이: DRAFT/RECEIVED/NEEDS_SUPPLEMENT에서 CANCELED, IN_REVIEW에서 REJECTED, APPROVED/IN_PROGRESS에서 SUSPENDED, WORK_DONE에서 JIRA_FAILED, JIRA_FAILED에서 IN_PROGRESS 또는 JIRA_DONE. 모든 전이는 허용 역할, 필수 의견, 현재 row_version을 검사하고 `StatusHistory`와 `AuditLog`를 같은 트랜잭션에 기록한다.

## 5. API 개요

- `GET /api/sbf-items` 검색·필터·정렬·cursor pagination
- `GET /api/sbf-items/{id}` 상세·현재 매핑·변경이력
- `GET /api/sbf-items/{id}/revisions?at=` 시점 복원
- `POST /api/change-requests`, `PATCH /api/change-requests/{id}` 임시저장
- `POST /api/change-requests/{id}/submit|supplement|approve|reject|apply`
- `GET/POST/PATCH /api/mappings`
- `POST /api/import-jobs` 업로드 등록, `POST /validate`, `GET /preview`, `POST /commit`
- `GET /api/import-jobs/{id}/errors.csv`
- `POST /api/jira-references` 수동 반영, 추후 adapter 호출로 대체
- 변경 API는 `Idempotency-Key`와 `If-Match`를 사용한다.

## 6. 가져오기 파이프라인

1. 파일 확장자·크기·magic byte·악성코드 검증
2. 시트 목록에서 정확한 `1. IA` 확인, 이외 시트 제외 목록 기록
3. 첫 행 헤더 탐지, 원문 헤더와 canonical field mapping 저장
4. staging에 원본 값·정규화 값·source_row_number·row_hash 적재
5. 공백/병합셀 상속, 날짜, Y/N/공백, 코드 정규화
6. 필수값·복합키·Depth·참조·매핑 검증
7. 현재 마스터와 행 해시/필드 diff 비교, 신규·일치·변경·오류·경고 분류
8. 관리자 미리보기 승인 후 SERIALIZABLE 트랜잭션으로 반영
9. SbfRevision·ImportJob 결과·AuditLog 생성. 실패 시 롤백

원본 수식은 계산 결과와 수식 존재 여부를 별도 보존하며, 임의로 다른 시트와 결합하지 않는다. HTML과 Excel 충돌 시 Excel `1. IA`를 현재 후보값, HTML을 과거 요청·변경 근거로 표시한다.

## 7. 오류·보안·성능

- 오류 응답: `code`, `message`, `fieldErrors`, `correlationId`, `retryable`.
- 업로드는 격리 저장, 허용 MIME·용량 제한, 파일명 무해화, checksum 중복 검사를 적용한다.
- 개인정보는 최소 수집, 조직·역할 범위 필터를 모든 쿼리에 강제하고 감사 로그 payload는 마스킹한다.
- 조회는 projection·cursor pagination을 사용하고 대용량 export/import는 비동기 job으로 처리한다.
- DB 장애·Jira 실패는 지수 백오프와 운영자 재처리를 지원하되 상태 전이는 중복 실행되지 않게 한다.

## 8. 테스트 전략

- 단위: 정규화, 복합키, Depth, 상태 전이, 권한 matrix, diff
- 통합: 요청 승인-마스터 반영-Revision-감사로그 원자성, Import rollback, 멱등성
- 계약: JiraAdapter와 API error schema
- E2E: 검색/필터, 상세, 변경요청 제출·보완·승인, 1. IA 미리보기, 오류 다운로드
- 접근성/성능: 키보드 dialog, 레이블, 색 대비, 1,172행 기준 페이지 응답 p95
- 마이그레이션: v2.5 전체 행 수·업무ID·복합키·Depth·L3 공백 결과를 원본과 대조

## 9. 선택 근거와 확장

관계형 DB는 N:N 매핑, 상태이력, 트랜잭션과 감사 복원 요구에 적합하다. JSONB는 원본 스냅샷과 가변 관리속성에만 사용하고 검색·무결성 핵심 필드는 정규 컬럼으로 둔다. Jira·Teams·Confluence는 adapter 경계 뒤에 두어 MVP 수동 운영을 훼손하지 않고 2단계 연동을 추가한다.
