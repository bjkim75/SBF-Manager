# SBF 관리 시스템 요구사항

## 범위와 근거

본 MVP는 `SKT_Business_Framework_v2.5.xlsx`의 `1. IA` 시트를 현재 마스터로 사용한다. 다른 시트는 분석·모델링·초기 적재 대상에서 제외한다. `SBF 변경이력.html`은 과거 변경 및 Jira 반영 근거로, `Confluence page 260812101503.html` 등 개별 페이지는 신규·수정·삭제·보완 요청의 업무 흐름 근거로 사용한다. 원본에서 확인되지 않은 조직별 승인 단계와 Jira API 인증은 확정하지 않는다.

## 1. 인증과 권한

- **AUTH-01** WHERE 사용자가 조회 권한만 보유한 경우 THE SYSTEM SHALL SBF 마스터와 공개 변경이력만 표시하고 변경 UI를 제공하지 않아야 한다.
- **AUTH-02** WHEN 요청자가 변경요청을 작성하는 경우 THE SYSTEM SHALL 본인의 임시저장·제출·보완·취소 권한을 검증해야 한다.
- **AUTH-03** WHILE 요청이 `검토 중`인 경우 THE SYSTEM SHALL 지정 검토자에게만 보완요청·승인·반려 기능을 제공해야 한다.
- **AUTH-04** WHEN 관리자가 마스터 반영을 수행하는 경우 THE SYSTEM SHALL 행위자, 역할, 시각, 대상, 변경 전후 값을 감사 로그로 보존해야 한다.

## 2. SBF 마스터

- **SBF-01** WHEN 사용자가 마스터를 조회하면 THE SYSTEM SHALL 업무ID, SUB ID, 도메인, 담당 분과, 구분, 1~4Depth, L3명·ID, 대상사, 관리 속성과 상태를 표시해야 한다.
- **SBF-02** WHEN 검색어 또는 필터가 입력되면 THE SYSTEM SHALL 업무ID·업무명·L3 통합검색과 도메인·조직·Depth·담당자·마일스톤·SB 대상 필터를 조합해 결과를 2초 이내 반환해야 한다.
- **SBF-03** WHEN 동일 업무ID에 여러 행이 있으면 THE SYSTEM SHALL SUB ID와 원본 sort 순서로 서로 다른 레코드를 식별해야 한다.
- **SBF-04** WHEN 항목 상세를 조회하면 THE SYSTEM SHALL 연결 L3, 현재 처리 중 요청, 변경이력과 원본 추적정보를 함께 표시해야 한다.
- **SBF-05** THE SYSTEM SHALL 현재 상태와 시점별 SbfRevision을 분리하여 과거 시점의 전체 레코드를 재구성할 수 있어야 한다.

## 3. 변경요청과 상태 흐름

- **CR-01** WHEN 요청자가 제출하면 THE SYSTEM SHALL 필수 필드와 대상 충돌을 검증하고 상태를 `요청 접수`로 변경해야 한다.
- **CR-02** THE SYSTEM SHALL 신규 등록, 기존 업무 수정, 업무 삭제, 업무ID 변경, 업무명 변경, Depth 조정, 순서 변경, 담당자 변경, IA-L3 매핑 추가·변경·해제, 기타 보완 요청을 지원해야 한다.
- **CR-03** WHEN 요청에 복수 변경항목이 포함되면 THE SYSTEM SHALL 각 ChangeRequestItem에 대상, 필드, 변경 전 값, 변경 후 값, 사유를 별도로 저장해야 한다.
- **CR-04** WHEN 검토자가 보완을 요청하면 THE SYSTEM SHALL 요청을 `보완 요청`으로 전환하고 요청자 수정·재제출 이력을 보존해야 한다.
- **CR-05** WHEN 요청이 승인되면 THE SYSTEM SHALL 승인 시점의 마스터 버전을 고정하고 실제 마스터 반영 전 충돌을 다시 검사해야 한다.
- **CR-06** THE SYSTEM SHALL `임시 저장 → 요청 접수 → 검토 중 → 보완 요청 → 승인 → 작업 중 → 작업 완료 → Jira 반영 완료` 흐름과 반려·취소·중단·Jira 실패·재처리 예외를 지원해야 한다.
- **CR-07** IF 동일 대상에 처리 중 요청이 존재하면 THEN THE SYSTEM SHALL 중복 가능성을 경고하고 관리자 확인 전 자동 병합하지 않아야 한다.
- **CR-08** WHEN 현재 값이 승인 당시 기준 버전과 다르면 THE SYSTEM SHALL 충돌 필드를 강조하고 재검토 전 반영을 차단해야 한다.

## 4. IA-L3 매핑

- **MAP-01** THE SYSTEM SHALL SBF IA와 L3Task를 N:N 관계로 관리해야 하며 문자열 결합만으로 저장하지 않아야 한다.
- **MAP-02** WHEN 매핑을 생성·변경·해제하면 THE SYSTEM SHALL 근거, 유효 시작·종료일, 요청 ID와 변경자를 저장해야 한다.
- **MAP-03** WHEN 사용자가 IA 또는 L3를 조회하면 THE SYSTEM SHALL 반대편의 모든 현재·과거 연결을 구분해 표시해야 한다.
- **MAP-04** IF 삭제 대상이 활성 매핑을 보유하면 THEN THE SYSTEM SHALL 물리 삭제 대신 논리 종료를 우선 적용하고 경고해야 한다.

## 5. 초기 데이터 가져오기와 품질

- **IMP-01** WHEN Excel을 업로드하면 THE SYSTEM SHALL 시트명이 정확히 `1. IA`인지 확인하고 다른 시트를 처리에서 제외해야 한다.
- **IMP-02** THE SYSTEM SHALL 원본 파일명, 시트명, source_row_number, 가져오기 시각, ImportJob ID와 원본 행 해시를 보존해야 한다.
- **IMP-03** WHEN 미리보기를 생성하면 THE SYSTEM SHALL 전체·신규·일치·변경·중복·오류·경고·제외 행 수를 표시해야 한다.
- **IMP-04** THE SYSTEM SHALL 업무ID 누락, `(업무ID, SUB ID)` 중복, 상위 Depth 없는 하위 Depth, 필수 담당자 누락을 차단 오류로 분류해야 한다.
- **IMP-05** THE SYSTEM SHALL L3명·ID 누락, 삭제 대상의 활성 연결, 대상사 공백과 HTML 불일치를 관리자 확인 경고로 분류해야 한다.
- **IMP-06** WHEN 대상사 값이 `Y`, `N`, 공백으로 표현되면 THE SYSTEM SHALL 각각 적용, 미적용, 미확인으로 정규화하고 공백을 `N`으로 간주하지 않아야 한다.
- **IMP-07** WHEN 동일 파일을 반복 실행하면 THE SYSTEM SHALL 파일 해시와 복합 업무키로 멱등성을 보장하고 중복 마스터를 생성하지 않아야 한다.
- **IMP-08** WHEN 관리자가 미리보기를 승인하면 THE SYSTEM SHALL 단일 트랜잭션으로 마스터·매핑·Revision을 반영하고 실패 시 전체 롤백해야 한다.

## 6. 변경이력, Jira, 알림

- **HIS-01** WHEN 마스터의 중요한 값이 변경되면 THE SYSTEM SHALL 필드 단위 변경 전후 값과 근거 요청을 복원 가능한 이력으로 저장해야 한다.
- **HIS-02** THE SYSTEM SHALL 과거 HTML의 일자, 변경 구분, 업무ID, Depth 1~4, 비고, Jira 반영 여부를 출처와 함께 이관해야 한다.
- **JIRA-01** WHEN Jira 반영 완료를 기록하면 THE SYSTEM SHALL Jira URL 또는 이슈 키와 반영자를 필수로 검증해야 한다.
- **JIRA-02** MVP에서 THE SYSTEM SHALL Jira 상태를 수동 관리하고 실제 API 연계는 교체 가능한 확장 인터페이스로 격리해야 한다.
- **NOTI-01** WHEN 접수·배정·보완·승인·반려·장기 미처리·작업 완료·Jira 완료/실패가 발생하면 THE SYSTEM SHALL 인앱 알림을 생성해야 한다.

## 7. 비기능 및 수용 기준

- **NFR-01** THE SYSTEM SHALL 데스크톱 우선으로 동작하고 768px 이하에서도 핵심 조회·요청 기능을 사용할 수 있어야 한다.
- **NFR-02** THE SYSTEM SHALL Asia/Seoul을 기준으로 저장·표시하고 화면 날짜를 `YYYY-MM-DD`로 표시해야 한다.
- **NFR-03** THE SYSTEM SHALL 키보드 포커스, 명시적 레이블, 4.5:1 이상의 본문 대비와 접근 가능한 dialog를 제공해야 한다.
- **NFR-04** THE SYSTEM SHALL 모든 입력을 서버에서 재검증하고 업로드 파일 확장자·크기·내용을 검사해야 한다.
- **NFR-05** THE SYSTEM SHALL 목록 조회 p95 2초, 상세 조회 p95 1초를 목표로 하고 대용량 표를 서버 페이지네이션해야 한다.

## MVP 제외 및 확인 필요

- 제외: Jira API 자동 연계, 이메일·Teams 알림, 자동 분류·담당자 추천, Confluence 양방향 동기화.
- 확인 필요: 조직별 최종 승인 단계, 개인정보 필드 범위, 보존기간, Jira 프로젝트·인증 방식, 실제 L3 기준 데이터의 권위 원천.

- **SBF-06** WHEN 사용자가 SBF 버전을 선택해 CSV 내보내기를 실행하면 THE SYSTEM SHALL 해당 버전 스냅샷과 현재 필터 결과만 UTF-8 CSV로 생성하고 버전·기준일을 파일명과 SBF 버전 컬럼에 포함해야 한다.

## 8. 첨부 Kiro 보완 요구사항

- **SBF-07** WHEN 사용자가 계층 화면을 조회하면 THE SYSTEM SHALL Depth 1만 기본 펼침으로 표시하고 노드 토글과 표 동시 강조를 제공해야 한다.
- **SBF-08** THE SYSTEM SHALL 표시 열을 선택·해제·초기화할 수 있게 하고 결과 없음 상태에 검색 초기화 수단을 제공해야 한다.
- **CR-09** WHEN 검토자가 요청을 조회하면 THE SYSTEM SHALL 변경 전후 값을 병렬 표시하고 변경 필드 및 Depth 이동을 강조해야 한다.
- **CR-10** WHEN 편집이 시작되면 THE SYSTEM SHALL 사용자와 만료시각을 포함한 30분 편집 잠금을 설정하고 비활성 만료 후 해제해야 한다.
- **HIS-03** WHEN Task ID 이력을 조회하면 THE SYSTEM SHALL 담당자 변경을 포함한 최근 50건을 시간순으로 표시해야 한다.
- **NOTI-02** THE SYSTEM SHALL 사용자별 알림의 읽음·안읽음 상태와 보완 내용을 저장하고 표시해야 한다.
- **VER-01** WHEN 관리자가 버전 발행을 실행하면 THE SYSTEM SHALL 전체 마스터를 불변 스냅샷으로 저장하고 직접 입력 또는 마이너 자동 증가 버전을 부여해야 한다.
- **VER-02** THE SYSTEM SHALL 발행일시, 발행자, 500자 이하 사유, 항목 수를 기록하고 발행일시 내림차순으로 표시해야 한다.
- **VER-03** IF 발행 후 마스터가 변경되면 THEN THE SYSTEM SHALL 현재 상태를 `미발행 Draft`로 표시해야 한다.
- **VER-04** WHEN 특정 버전을 다운로드하면 THE SYSTEM SHALL `SBF_v{버전번호}_{발행일}.csv` 파일명과 요구된 업무·담당·조직·Milestone·SB·L3 컬럼을 제공해야 한다.
- **JIRA-03** THE SYSTEM SHALL 미반영·반영·반영실패 목록과 실패 사유, 반영 일시를 관리해야 한다.
- **AUD-01** THE SYSTEM SHALL 모든 중요 행위에 대해 수행자, 역할, 일시, 대상, 결과와 상관 ID를 append-only 로그로 기록해야 한다.