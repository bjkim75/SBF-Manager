# SBF 관리 시스템 설계

## 1. 아키텍처

MVP는 웹 프론트엔드, API 계층, 관계형 DB, 파일 처리 워커, 인앱 알림으로 구성한다. UI는 첨부 화면처럼 좌측 업무 메뉴·상단 컨텍스트 바·필터 가능한 고밀도 표를 사용한다. API는 권한 검증, 상태 전이, 충돌 검증을 한 서비스 계층에서 수행하며 DB 제약을 최종 방어선으로 둔다.

- **Frontend**: React/TypeScript, 반응형 관리 콘솔, 서버 페이지네이션
- **Application API**: REST/JSON, RBAC·상태머신·변경 diff
- **Database**: PostgreSQL 권장. 트랜잭션, JSONB 원본 스냅샷, 부분 인덱스 활용
- **Import worker**: Excel 스트리밍 파싱, staging 적재, 검증, 미리보기, 승인 반영
- **JiraAdapter**: MVP는 ManualJiraAdapter, 2단계에서 ApiJiraAdapter로 교체

## 2. 주요 컴포넌트

1. `MasterExplorer`: 계층형/표형 조회, 통합검색, 상세 drawer, Excel 내보내기. (SBF-01~05)
2. `ChangeRequestWorkspace`: 다중 변경항목, 전후 비교, 검토 의견, 상태 전이. (CR-01~08)
3. `MappingWorkbench`: IA-L3 N:N 연결과 유효기간 관리. (MAP-01~04)
4. `ImportPipeline`: `1. IA` 탐색, 열 매핑, 정규화, 차단 오류/경고, 미리보기. (IMP-01~08)
5. `RevisionService`: 변경 전후 스냅샷과 시점 복원. (HIS-01~02)
6. `NotificationCenter`: 인앱 이벤트와 읽음 상태. (NOTI-01)

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

### 제약과 인덱스

- 활성 SBF의 `(business_id, sub_id)` 유니크. 원본에서 업무ID 하나에 여러 SUB가 존재하므로 업무ID 단독 유니크 금지.
- 활성 매핑의 `(sbf_item_id, l3_task_id, valid_to IS NULL)` 유니크.
- `ChangeRequest.row_version`, `SbfItem.row_version`을 이용한 낙관적 잠금.
- 검색: business_id, domain, depth1~4, 담당 조직, 상태 B-tree; 업무명·L3명 full-text/trigram.

## 4. 상태 머신

`DRAFT → RECEIVED → IN_REVIEW ↔ NEEDS_SUPPLEMENT → APPROVED → IN_PROGRESS → WORK_DONE → JIRA_DONE`


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

원본 수식은 계산 결과와 수식 존재 여부를 별도 보존하며, 임의로 다른 시트와 결합하지 않는다. HTML과 Excel 충돌 시 Excel `1. IA`를 현재 후보값, HTML을 과거 요청·변경 근거로 표시한다.

## 7. 오류·보안·성능

- 오류 응답: `code`, `message`, `fieldErrors`, `correlationId`, `retryable`.
- 업로드는 격리 저장, 허용 MIME·용량 제한, 파일명 무해화, checksum 중복 검사를 적용한다.
- 조회는 projection·cursor pagination을 사용하고 대용량 export/import는 비동기 job으로 처리한다.
- DB 장애·Jira 실패는 지수 백오프와 운영자 재처리를 지원하되 상태 전이는 중복 실행되지 않게 한다.

## 8. 테스트 전략

- 단위: 정규화, 복합키, Depth, 상태 전이, 권한 matrix, diff
- 통합: 요청 승인-마스터 반영-Revision 원자성, Import rollback, 멱등성
- 계약: JiraAdapter와 API error schema
- E2E: 검색/필터, 상세, 변경요청 제출·보완·승인, 1. IA 미리보기, 오류 다운로드
- 접근성/성능: 키보드 dialog, 레이블, 색 대비, 1,172행 기준 페이지 응답 p95
- 마이그레이션: v2.5 전체 행 수·업무ID·복합키·Depth·L3 공백 결과를 원본과 대조

## 9. 선택 근거와 확장

관계형 DB는 N:N 매핑, 상태이력, 트랜잭션과 시점 복원 요구에 적합하다. JSONB는 원본 스냅샷과 가변 관리속성에만 사용하고 검색·무결성 핵심 필드는 정규 컬럼으로 둔다. Jira·Teams·Confluence는 adapter 경계 뒤에 두어 MVP 수동 운영을 훼손하지 않고 2단계 연동을 추가한다.

## 10. SBF 마스터 탐색성 강화 UX

SBF 마스터는 Excel 원본을 업무자가 그대로 확인한다는 감각을 유지하되, 웹 관리 시스템에 필요한 필터·정렬·상태 표시를 덧붙인다. 화면의 기본 목적은 `원본 IA 확인 + 변경요청 상태 인지 + 변경요청 진입`이다.

### 10.1 필터와 보기 옵션

- 필터 영역은 `검색`, `도메인`, `담당분과`, `SKT 담당자`, `milestone`, `필터값 초기화` 순서로 배치한다.
- 각 필터는 독립 선택을 원칙으로 하며, `필터값 초기화`만 전체 필터를 기본값으로 되돌린다.
- SBF 마스터는 최신 공식 배포본 조회 전용이므로 보기 옵션(정렬, 고정 컬럼, 변경접수 보기)을 제공하지 않는다.
- 정렬 기본값은 업무ID 오름차순이다.

### 10.2 Excel식 컬럼 고정

- AX열까지 가로 스크롤하는 상황에서도 업무 식별성이 유지되도록 컬럼 고정 프리셋을 제공한다.
- 프리셋은 `고정 없음`, `업무ID까지`, `SUB ID까지`, `도메인까지`, `담당분과까지`, `4Depth까지`로 구성한다.
- 초기 기본값은 `업무ID까지 고정`을 권장한다.
- 구현은 CSS sticky column을 사용하되, 프리셋별 left offset은 고정 폭 기준으로 계산한다.

### 10.3 변경요청 상태 배지 (삭제됨)

- SBF 마스터는 최신 공식 배포본 조회 전용이므로 업무ID 옆 변경요청 상태 배지를 표시하지 않는다.
- 변경요청 상태 확인은 변경요청/내 요청 메뉴에서 수행한다.

## 11. 완료 결과 상세 UX

과제 ID 또는 요구사항 ID 변경요청이 작업 완료되면 별도 신규 메뉴를 만들지 않고 기존 `내 요청`과 `처리 업무` 목록에서 완료 결과 상세로 연결한다.

완료 결과 상세는 다음 정보를 포함한다.

- 요청번호, 요청 제목, 변경 유형, 요청자
- 업무ID, SUB ID
- 과제ID 변경 전·후
- 요구사항ID 변경 전·후
- SBF 반영결과와 반영일
- Jira 반영결과와 산출물 상태
- 처리자, 작업 완료일, 처리 이력

요청자 화면에서는 결과 확인을 중심으로, 검토자/관리자 화면에서는 처리 근거와 이력 추적을 중심으로 동일 데이터를 다르게 강조한다.

### 12. SBF 마스터-변경요청 연결 UX

- 변경요청 저장 시 첫 번째 표 편집 항목의 대상 업무ID를 변경요청 메타데이터로 보관한다.
- SBF 마스터 업무ID 옆 상태 배지는 workflowRequests.targetBusinessId와 IA 행의 업무ID를 비교하여 표시한다.
- 동일 업무ID에 복수 SUB ID가 있는 경우, SUB ID가 명시되지 않은 요청은 업무ID 전체에 적용되는 요청으로 간주한다.
- 삭제 대기, 검토 중 등 상태 배지는 등록된 변경요청이 있을 때만 표시하며 예시용 하드코딩은 사용하지 않는다.

### 13. SBF 반영 작업 전체 필드 편집 UX

- SBF 반영 작업 화면은 변경요청의 대상 업무ID를 기준으로 IA 원본 행을 조회한다.
- 변경 전 영역은 선택된 업무ID의 1. IA 전체 컬럼을 읽기 전용으로 표시한다.
- 변경 후 영역은 동일한 전체 컬럼을 입력 필드로 제공하여 관리자가 최종 SBF 반영값을 직접 수정할 수 있게 한다.
- 전체 필드가 많으므로 세로 스크롤 가능한 표 형태로 제공하고, 각 행은 컬럼명 / 변경 전 / 변경 후 구조로 보여준다.

### 14. 변경접수 건만 보기 필터 UX (삭제됨)

- SBF 마스터는 최신 공식 배포본 조회 전용이므로 변경접수 건만 보기 필터를 제공하지 않는다.

### 15. 업무ID/SUB ID 단위 변경 배지 매칭 (삭제됨)

- SBF 마스터 배지가 삭제되었으므로 본 섹션은 더 이상 적용되지 않는다.

### 16. 변경요청 항목 SUB ID 입력 UX

- 변경요청 모달의 표 편집 항목에 SUB ID 컬럼을 업무ID 오른쪽에 배치한다.
- SUB ID는 숫자 입력이며 기본값은 1이다.
- 제출 시 targetBusinessId와 targetSubId를 함께 저장하여 SBF 마스터/처리업무/SBF 반영작업 연결 기준으로 사용한다.
- 같은 업무ID가 여러 SUB ID를 가진 경우 사용자가 정확한 변경 대상 행을 지정할 수 있어야 한다.


### 17. 처리업무 검토 상세 모달 UX
- 처리 업무의 `검토 시작` 버튼은 즉시 최종 상태를 결정하지 않고 검토 상세 모달을 연다.
- 검토 상세 모달은 요청자가 입력한 요청번호, 제목, 요청자, 요청부서, 요청구분, 대상 도메인, 업무ID, SUB ID, 변경 전/후, 사유, 첨부/참조 정보를 한 화면에서 확인하게 한다.
- 요청 원문 영역은 확인 중심으로 표시하고, 검토 보정 영역은 업무ID, SUB ID, 요청 유형, 대상 도메인, 요청자, 요청부서를 입력 가능한 필드로 제공한다.
- 모달 하단의 결정 버튼은 `보완 요청`, `승인`, `반려`를 같은 검토 결정 영역으로 배치한다.
- `승인` 이후에는 처리 업무 카드/리스트에서 SBF 반영 작업 진입 버튼이 활성화되고, SBF 반영 완료 후 Jira 산출물 확인 단계로 이어진다.


### 18. SBF 마스터 sort 컬럼 숨김 및 기본 정렬 기준
- SBF 마스터 표는 Excel IA 원본의 내부 정렬용 `sort` 컬럼을 사용자 화면에 표시하지 않는다.
- `sort` 값은 내부 데이터 순서 참고용으로만 유지하고, 사용자가 보는 기본 정렬 기준은 `업무ID`로 둔다.
- 필터값 초기화 상태에서 정렬 방향을 바꾸면 `업무ID` 기준 오름차순/내림차순으로 결과가 정렬된다.
- 컬럼 고정 프리셋은 화면에 표시되는 첫 컬럼인 `업무ID`를 기준으로 다시 계산한다.

### 19. SBF 마스터 상태 배지 색상 일관성 (삭제됨)

- SBF 마스터 배지가 삭제되었으므로 본 섹션은 더 이상 적용되지 않는다.

### 20. 변경요청 전체 IA 필드 편집 UX
- 변경요청 모달의 표 편집 항목은 단순 변경 전/후 텍스트가 아니라 IA 전체 컬럼 편집 테이블로 구성한다.
- 요청구분이 `신규 등록`이면 전체 IA 컬럼의 현재 SBF 값은 `-`로 표시하고 요청 변경값 입력란은 빈 값으로 제공한다.
- 요청구분이 `기존 업무 수정`, `업무 삭제`, `IA-L3 매핑 변경`이면 업무ID와 SUB ID 입력 후 `기준값 불러오기`를 눌러 현재 SBF 행의 전체 필드를 로딩한다.
- 전체 필드 편집 테이블은 `컬럼`, `현재 SBF 값`, `요청 변경값` 구조를 사용하며, 요청 변경값은 사용자가 직접 수정할 수 있다.
- 변경 사유/근거는 전체 변경 항목 단위로 입력하고, 저장 payload에는 targetBusinessId, targetSubId, beforeRaw, afterRaw, reason을 포함한다.
- SBF 반영 작업 화면은 승인된 변경요청의 afterRaw를 초기 반영값으로 재사용할 수 있어야 한다.

### 21. 변경요청 기준값 불러오기 데이터 연결
- `기준값 불러오기`는 고정 샘플이 아니라 최신 공식 SBF 마스터 데이터 배열을 기준으로 동작한다.
- 업무ID는 대소문자 입력 차이를 줄이기 위해 대문자로 정규화하고, SUB ID는 숫자로 비교한다.
- 조회 매칭은 파싱된 `id/sub` 필드와 원본 IA 행의 업무ID/SUB ID cell 값을 함께 확인하여, 데이터 변환 과정에서 필드 값이 누락되거나 형식이 달라도 원본 행을 찾을 수 있게 한다.
- 일치하는 행을 찾으면 IA 전체 cell 값을 beforeRaw와 afterRaw에 동시에 채워 요청자가 기존값을 기반으로 수정할 수 있게 한다.
- 일치하는 행이 없으면 현재값/요청값을 초기화하고 명확한 안내 메시지를 표시한다.

### 22. SBF 마스터 검색 input 포커스 유지
- SBF 마스터 화면은 검색어 입력 시 전체 화면 컴포넌트를 재마운트하지 않고 동일 input DOM을 유지한다.
- 검색 결과 테이블만 필터링/정렬 결과로 갱신되며, 사용자는 업무ID를 연속으로 타이핑할 수 있어야 한다.

### 23. 변경요청 업무ID 예시 표시
- 변경요청의 업무ID 입력란은 기본값을 넣지 않고 빈 값으로 둔다.
- 예시값은 placeholder로만 제공하며 ex: B2036처럼 예시임을 명확히 표시한다.

### 24. SBF 마스터 전체 열 상세 drawer
- 업무ID 클릭 시 오른쪽 drawer는 Depth 요약 카드가 아니라 선택한 IA 행의 전체 컬럼명과 값을 표 형태로 표시한다.
- 전체 열은 컬럼명, Excel 열 문자, 값 구조로 보여주며, 값이 긴 경우 줄바꿈을 허용한다.
- drawer 본문은 세로 스크롤을 지원하고, 표 영역은 필요 시 가로 스크롤을 지원한다.
- 변경요청 작성 버튼은 선택한 전체 IA 행을 확인한 뒤 변경요청으로 이어지는 진입점으로 유지한다.

### 25. SBF 마스터 상세 무의미 상태 배지 숨김
- SBF 마스터 상세 drawer는 원본 IA 전체 열 확인이 목적이므로, 원본 상태값이 ??처럼 의미가 정리되지 않은 placeholder이면 badge를 표시하지 않는다.
- 실제 관리 상태는 변경요청 상태 배지 또는 처리업무 상태로 별도 표현한다.

### 26. 처리업무 기본 리스트형 보기
- 처리업무는 요청번호, 상태, 담당자, SBF/Jira 반영 여부를 비교하는 화면이므로 기본 view는 리스트형으로 둔다.
- 사용자는 필요 시 카드형으로 전환해 Jira 산출물 상세 입력을 넓게 확인할 수 있다.

### 27. 변경요청/내 요청 데이터 범위 분리
- 변경요청 메뉴는 전체 변경요청 현황을 조회하는 공통 목록으로 유지한다.
- 내 요청 메뉴는 현재 로그인 사용자 이름과 요청자명이 일치하는 변경요청만 표시한다.
- 프로토타입의 현재 로그인 사용자는 topbar의 테스트 계정 김서현으로 간주한다.

### 28. 변경요청 대상 도메인 옵션
- 변경요청 모달의 대상 도메인은 정적 하드코딩 목록을 사용하지 않는다.
- 최신 공식 SBF 마스터 데이터에서 domain 값을 중복 제거해 옵션으로 제공한다.
- SBF 마스터의 도메인 필터와 변경요청 대상 도메인이 같은 데이터 출처를 사용하도록 맞춘다.

### 29. 변경요청 진입점별 초기값
- SBF 마스터 상단의 + 변경요청은 대상 업무를 아직 특정하지 않은 일반 요청으로 보고 빈 요청서를 연다.
- 업무ID 상세 drawer의 변경요청 작성은 사용자가 이미 대상 행을 선택한 상태이므로, 업무ID, SUB ID, 대상 도메인을 자동 입력한다.
- 선택한 IA 행의 전체 raw cell 값을 현재 SBF 값과 요청 변경값에 동시에 채워, 사용자가 변경할 cell만 수정할 수 있게 한다.
- 요청자는 필요 시 대상 도메인과 요청 변경값을 수정할 수 있다.

### 30. 신규 변경요청 버튼명 통일
- 일반 신규 변경요청을 여는 버튼은 SBF 마스터, 변경요청, 내 요청 메뉴에서 모두 새 변경요청으로 표시한다.
- 업무ID 상세 drawer의 변경요청 작성은 선택 업무 기반 prefill 진입점이므로 별도 문구를 유지한다.


### 31. 처리 업무 단계별 활성화 UX

처리 업무의 단계 영역은 `요청 검토 → SBF 반영 → Jira 확인 후` 순서로 보이되, 현재 상태에 해당하는 단계만 강조한다. 활성 단계는 연한 파란 배경과 파란 테두리로 표시하고, 비활성 단계는 회색 배경과 disabled 버튼으로 표시한다.

- 요청 접수: `요청 검토` 활성, 버튼명 `검토 시작`
- 검토 중: `요청 검토` 활성, 버튼명 `검토 계속`
- 보완 요청: `요청 검토` 활성, 버튼명 `재검토`
- 승인/SBF 반영 중: `SBF 반영` 활성, `SBF 반영 작업`만 가능
- SBF 반영 완료: `Jira 확인 후` 활성, `작업 완료`만 가능
- 작업 완료/반려: 모든 단계 비활성, 종료 상태로 표시

SBF 반영 완료 버튼은 목록에서 직접 노출하지 않고, SBF 반영 작업 화면에서 실제 변경 후 값을 수정한 다음 완료 처리한다.

### 32. 요청번호 상세 drawer UX

`내 요청`과 `변경요청` 목록의 요청번호는 단순 완료 결과 링크가 아니라 요청자가 입력한 작업 내용을 확인하는 기본 진입점이다. SBF 마스터의 업무ID 상세와 동일하게 우측 drawer 패턴을 사용한다.

- 요청번호 클릭 시 오른쪽 drawer를 연다.
- 상단에는 요청번호, 상태 Badge, 제목을 표시한다.
- 본문은 `요청 기본정보`, `요청 내용`, `처리/반영 결과` 섹션으로 나눈다.
- 요청 기본정보는 표 형태로 요청번호, 변경 유형, 요청자, 요청일, 대상 업무ID, SUB ID, 처리 담당을 표시한다.
- 요청 내용은 현재 MVP에 저장된 요청 제목/처리 메모/첨부 참조 요약을 표시하고, 실제 DB 도입 시 제출 payload 원문을 연결한다.
- 작업 완료 상태에서는 footer에 완료 결과 보기 버튼을 제공한다.

### 33. 반려/보완 요청 재요청 UX

반려와 보완 요청 상태는 요청자 관점에서 기존 요청 내용을 수정한 뒤 다시 접수할 수 있는 재처리 진입점이 필요하다.

- `내 요청` 목록에서 반려 또는 보완 요청 건의 요청번호를 클릭하면 요청 상세 drawer 하단에 "재요청 방법" 안내와 "수정작업 진행" 버튼을 표시한다.
- "수정작업 진행" 클릭 시 RequestModal을 편집 모드로 열어, 기존 변경요청 데이터(제목, 요청 내용, IA 필드 변경값)를 prefill한다.
- 편집 모드 상단에는 보완/반려 사유 배너를 표시하여 검토자가 왜 돌려보냈는지 요청자가 즉시 확인할 수 있게 한다.
- 모든 필드(제목, 요청 내용, IA 필드 변경값)를 수정할 수 있다.
- 하단에 "보완/수정 요약" textarea를 필수 입력으로 제공하여 이번 수정 내용을 기록한다.
- 제출 시 새 요청번호를 만들지 않고 기존 요청번호를 유지하며, 상태를 `요청 접수`로 전환하고 처리 이력에 수정 요약을 기록한다.
- 이 기능은 요청자 메뉴인 `내 요청`에서만 표시하고, 전체 현황인 `변경요청` 메뉴에서는 상세 확인만 제공한다.

### 34. 요청 상세 재요청 drawer 높이 UX
- 수정 후 재요청 화면의 요청 기본정보 영역은 drawer 화면 높이의 약 30%를 확보한다.
- 요청 상세 drawer 전체에는 세로 스크롤을 제공하여 요청 기본정보, 요청 내용, 처리 결과, 재요청 입력 영역을 순차적으로 확인하고 입력할 수 있게 한다.
- 요청 기본정보 표는 자체 스크롤을 유지하여 행 수가 늘어나도 drawer 하단의 재요청 입력 영역 접근성을 해치지 않는다.


### 35. 검토 시작 신청서 원문 재현 UX
- 검토 시작 화면은 변경요청자가 작성한 신청서를 읽기 전용으로 최대한 동일하게 재현하여 검토자가 보완 요청, 반려, 승인을 판단할 수 있게 한다.
- 요청 원문, 전체 IA 필드 변경요청, 첨부 이미지 영역, 첨부 파일 영역, 참조 링크, 검토 의견을 한 화면 흐름 안에서 확인한다.
- 현재 UI-Mockup 단계에서는 실제 첨부 바이너리를 보존하지 않으므로 첨부 이미지 영역에는 "현재는 UI-Mockup이기 때문에 첨부된 이미지는 보이지 않습니다." 문구를 표시한다.
- 첨부 파일 영역에는 "현재는 UI-Mockup이기 때문에 첨부된 파일은 보이지 않습니다." 문구를 표시한다.
- 검토 모달 본문은 세로 스크롤을 지원하고, 결정 버튼 footer는 하단에 고정해 긴 요청도 검토 후 바로 처리할 수 있게 한다.

### 35-1. 검토 상세 payload 재현 및 보정 데이터 흐름
- 변경요청 제출 시 workflowRequests 또는 후속 DB 엔터티에는 목록 표시용 얕은 메타데이터만 저장하지 않고, 검토 재현용 
equestPayload를 함께 저장한다.
- 
equestPayload는 최소 	itle, contentHtml, 
eferenceUrl, ttachments, items[]를 포함한다.
- items[] 각 항목은 	argetBusinessId, 	argetSubId, changeType, eforeRaw, fterRaw, 
eason을 보존한다.
- 검토 상세 모달은 현재 마스터 데이터에서 일부 값을 다시 추정해서 요청 변경값을 만들지 않고, 저장된 
equestPayload.items[].afterRaw를 그대로 렌더링한다.
- 검토자가 기본정보 또는 SBF 변경값을 보정하면 저장된 원문을 덮어쓰지 않고 
eviewDraft 또는 동등한 검토 단계 state를 별도로 만든다.
- 
eviewDraft는 
eviewBusinessId, 
eviewSubId, 
eviewDomain, 
eviewType, 
eviewAfterRaw, 
eviewMemo를 포함할 수 있다.
- 검토 상세 하단의 요청 변경값 표는 
equestPayload.afterRaw가 아니라 
eviewDraft.reviewAfterRaw를 우선 표시하여, 검토자가 수정한 값이 즉시 화면에 반영되게 한다.
- 승인 시 다음 단계인 SBF 반영 작업의 초기값은 
equestPayload.afterRaw가 아니라 검토 보정이 반영된 
eviewDraft.reviewAfterRaw를 사용한다.
- 과거 seed 데이터처럼 requestPayload가 비어 있는 샘플 요청은 요약 mock 데이터로 표시하고, 원문 재현 완전성을 보장하지 않는다.

### 36. 공식 버전과 작업본/template 분리
- SBF 마스터는 공식 배포본만 표시한다. 별도의 `작업본 보기` 옵션은 제공하지 않는다.
- 공식 버전은 사용자가 선택 가능한 불변 스냅샷이다. 예: v2.4, v2.5, v2.6.
- 작업본/template은 승인된 변경요청이 SBF 반영 작업을 통해 누적되는 다음 배포 후보 데이터이다.
- SBF 반영 작업 완료 시 v2.5 공식 데이터를 직접 수정하지 않고, v2.5를 기준으로 복제된 작업본/template에 업무ID + SUB ID 단위로 변경 후 IA 전체 필드 값을 반영한다.
- 작업본/template에 저장되는 기본 데이터 구조는 `baseVersion`, `targetBusinessId`, `targetSubId`, `beforeRaw`, `afterRaw`, `requestId`, `appliedAt`, `appliedBy`를 포함한다.
- 작업본 반영 완료 후 요청 상태는 `배포 대기`가 되며, 변경이력에는 요청번호와 변경 전/후 snapshot을 남긴다.

### 37. 새 배포 생성 및 SBF 마스터 기본 버전 전환
- 배포관리의 `새 배포`는 작업본/template을 공식 버전으로 승격하는 기능이다.
- 새 배포 실행 시 최신 공식 버전의 minor 번호를 자동 증가한다. 예: v2.5 → v2.6.
- 새 버전(v2.6)은 작업본/template 전체 데이터의 불변 스냅샷으로 생성한다.
- 배포 완료 후 SBF 마스터의 기본 대상 버전은 v2.6으로 변경된다.
- 기존 v2.5는 변경하지 않고 읽기 전용 공식 스냅샷으로 보존한다.
- 배포 완료 후 배포 대기 건수는 0으로 초기화하고, 배포 대상 요청은 배포 완료 상태 또는 후속 Jira 확인 단계로 전환한다.
- MVP에서는 공식 버전 목록, 작업본/template, 배포 이력을 React state/브라우저 메모리로 관리한다. 새로고침하면 초기 seed로 돌아갈 수 있으며, DB/Turso 도입 후 영속 저장한다.

### 38. 반복 배포 버전 증가 규칙
- 새 배포 버전은 고정값 v2.6이 아니라 현재 공식 버전 목록의 최신 버전을 기준으로 계산한다.
- 버전 형식은 `v{major}.{minor}`를 기본으로 하며, MVP에서는 major는 유지하고 minor만 1씩 증가한다.
- 예: 최초 최신 공식 버전이 v2.5이면 첫 배포는 v2.6, 두 번째 배포는 v2.7, 세 번째 배포는 v2.8이 된다.
- 배포 완료 후 새 버전이 공식 버전 목록의 최신 버전이 되며, 다음 배포는 이 새 버전을 기준으로 다시 계산한다.
- 화면에 표시되는 `새 배포` dialog와 `배포 준비` 문구는 하드코딩된 v2.6이 아니라 계산된 nextVersion을 사용한다.
- 사용자가 테스트를 반복하더라도 이전 공식 버전은 읽기 전용으로 유지되고, SBF 마스터 기본 선택값은 매번 새로 생성된 최신 버전으로 전환된다.

### 39. minor 9 이후 major 증가 규칙
- 배포 버전은 `v{major}.{minor}` 형식을 사용한다.
- minor는 0부터 9까지만 사용한다.
- 최신 공식 버전이 v2.8이면 다음 배포는 v2.9이다.
- 최신 공식 버전이 v2.9이면 다음 배포는 v3.0이다.
- 이후 반복 배포는 v3.1, v3.2처럼 동일 규칙으로 계속 증가한다.
- 배포관리의 배포 준비 버튼, 배포 dialog, 배포 완료 후 SBF 마스터 기본 버전 전환은 모두 동일한 nextVersion 계산 결과를 사용한다.
- 화면에 `v2.6 배포 준비`처럼 하드코딩된 문구를 두지 않는다.

### 40. SBF 반영 작업 돌아가기 UX
- SBF 반영 작업 화면은 처리 업무에서 진입한 작업 화면이므로 `돌아가기` 버튼을 제공한다.
- `돌아가기`를 선택하면 현재 화면에서 수정한 변경 후 값은 저장되지 않는다는 확인 메시지를 표시한다.
- 확인 메시지 문구는 `현재 작업된 내용은 저장되지 않습니다. 처리 업무 화면으로 돌아가시겠습니까?`를 사용한다.
- 사용자가 확인하면 처리 업무 화면으로 돌아가고, 취소하면 SBF 반영 작업 화면에 머문다.

### 41. 버전별 Excel 기반 mock snapshot
- MVP라도 v2.4와 v2.5는 사용자가 버전 변경 효과를 검증할 수 있도록 서로 다른 snapshot rows를 사용한다.
- v2.4 seed는 `C:\Users\SKTelecom\Downloads\SBF 관리 업무\SKT_Business_Framework_v2.4.xlsx` 파일의 `1. IA` 시트를 기준으로 생성한다. 이때 v2.4와 v2.5 간 누락/추가 컬럼이 있어도 표시 열 의미가 밀리지 않도록 앱의 `iaHeaders`와 Excel 헤더명을 매칭하고, 중복 헤더는 같은 출현 순서끼리 매핑한다.
- 브라우저/Netlify 배포본은 사용자의 로컬 PC 경로를 직접 읽을 수 없으므로, 로컬 개발 시 Excel을 파싱해 `app/data.ts`의 정적 mock seed로 반영한다.
- SBF 마스터의 전체 IA 레코드 카드, 이번 달 변경 카드, 필터 옵션, Sheet table, 상세 drawer, CSV 다운로드는 모두 최신 공식 버전 snapshot rows를 단일 source of truth로 사용한다.
- `itemsV24 = items.map(...)`처럼 v2.5를 단순 복사한 mock은 버전 검증 목적을 흐리므로 제거하거나 실제 v2.4 원본 기반 seed로 대체한다.
- 운영/DB 단계에서는 데이터 가져오기 메뉴에서 업로드된 Excel을 파싱해 `SbfVersion`과 `SbfSnapshot`으로 저장한다. SBF 마스터는 항상 최신 공식 snapshot을 조회하고, 과거 공식 버전 조회/다운로드는 배포관리 화면에서 제공한다.
### 29.3 변경요청 목록 필터 UX

- `변경요청`과 `내 요청` 목록은 동일한 필터 로직을 사용한다.
- 검색어는 요청번호, 제목, 요청자, 변경 유형을 대상으로 즉시 필터링한다.
- `전체 상태` select는 요청의 `status` 값과 일치하는 항목만 표시한다.
- `전체 유형` select는 요청의 `type` 값과 일치하는 항목만 표시한다.
- 버튼은 조회 실행이 아니라 `필터 초기화`로 동작하며, 검색어·상태·유형을 초기값으로 되돌린다.

### 42. 변경요청 원문 저장 및 표시

- 변경요청 제출 시 요청자가 입력한 변경 요청 내용(contentHtml)과 요청 부서(requesterOrganization)를 workflowRequests에 저장한다.
- REQUEST DETAIL의 "요청 내용" 섹션과 REVIEW DETAIL의 "요청 원문" 섹션은 저장된 contentHtml을 표시한다.
- 하드코딩된 안내 문구 대신 실제 입력값을 보여주되, 값이 없으면 fallback 문구를 표시한다.

### 43. 요청 구분 "기타" 옵션

- 변경요청 모달의 요청 구분 select에 "기타" 옵션을 포함한다.
- "기타" 선택 시 전체 IA 필드 변경 테이블은 그대로 사용 가능하되, 요청 내용 textarea에 자유 형식으로 작업 내용을 기술한다.
- REVIEW DETAIL 검토자 보정 영역에도 동일하게 "기타" 옵션을 제공한다.
- 변경요청/내 요청 목록의 유형 필터는 실제 등록된 데이터에서 동적 생성되므로 "기타" 유형 요청이 있으면 자동으로 필터에 노출된다.

### 44. SBF 반영 작업 사이드바 숨김

- SBF 반영 작업은 사이드바 메뉴에서 표시하지 않는다.
- 처리 업무의 "SBF 반영 작업" 버튼을 통해서만 진입한다.
- view state와 ChangeCompare 컴포넌트 기능은 그대로 유지한다.
