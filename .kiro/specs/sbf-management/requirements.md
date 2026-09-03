# Requirements Document

**SBF 관리 시스템 요구사항**

## Introduction

본 문서는 SBF 관리 시스템 MVP의 요구사항 문서이다. SBF 마스터 조회, 변경요청 작성과 상태 흐름, 검토, SBF 반영 및 배포(공식 버전 관리), 클라이언트 Excel 가져오기 등을 다룬다. 세부 범위와 근거는 아래 "범위와 근거"에 정의한다.

### 범위와 근거

본 MVP는 `SKT_Business_Framework_v2.5.xlsx`의 `1. IA` 시트를 현재 마스터로 사용한다. 다른 시트는 분석·모델링·초기 적재 대상에서 제외한다. `SBF 변경이력.html`은 과거 변경 및 Jira 반영 근거로, `Confluence page 260812101503.html` 등 개별 페이지는 신규·수정·삭제·보완 요청의 업무 흐름 근거로 사용한다. 원본에서 확인되지 않은 조직별 승인 단계와 Jira API 인증은 확정하지 않는다.

## Glossary

- **SBF 마스터**: `1. IA` 시트를 근거로 관리하는 업무 프레임워크 기준 데이터 집합.
- **업무ID**: 각 업무 레코드를 식별하는 기본 키 값.
- **SUB ID**: 동일 업무ID 내 서로 다른 레코드를 구분하는 하위 식별자. 미입력 시 기본값은 1.
- **IA(1. IA 시트)**: SBF 마스터의 원본 소스가 되는 Excel 시트.
- **iaHeaders**: 앱에서 IA 원본 표시 컬럼 계약을 정의하는 헤더명 목록.
- **변경요청(ChangeRequest)**: 사용자가 SBF 마스터 변경을 신청하는 요청 단위.
- **작업본/template**: 공식 버전을 직접 수정하지 않고 다음 배포 후보 변경값을 담는 편집 대상 데이터.
- **공식 버전 snapshot**: 특정 시점의 전체 마스터를 불변으로 저장한 공식 버전 데이터.
- **배포관리**: 작업본/template을 새 공식 버전 snapshot으로 확정·발행하고 배포 이력을 관리하는 기능.
- **데이터 가져오기**: 외부 Excel(`1. IA` 시트)을 파싱하여 SBF 마스터 데이터로 반영하는 기능.
- **ImportView**: 데이터 가져오기 메뉴 화면(클라이언트 Excel 가져오기 UI).

## Requirements

## 1. 인증과 권한

- **AUTH-01** WHERE 사용자가 조회 권한만 보유한 경우 THE SYSTEM SHALL SBF 마스터와 공개 변경이력만 표시하고 변경 UI를 제공하지 않아야 한다.
- **AUTH-02** WHEN 요청자가 변경요청을 작성하는 경우 THE SYSTEM SHALL 본인의 임시저장·제출·보완·취소 권한을 검증해야 한다.
- **AUTH-03** WHILE 요청이 `검토 중`인 경우 THE SYSTEM SHALL 지정 검토자에게만 보완요청·승인·반려 기능을 제공해야 한다.

## 2. SBF 마스터

- **SBF-01** WHEN 사용자가 마스터를 조회하면 THE SYSTEM SHALL 업무ID, SUB ID, 도메인, 담당 분과, 구분, 1~4Depth, L3명·ID, 대상사, 관리 속성과 상태를 표시해야 한다.
- **SBF-02** WHEN 검색어 또는 필터가 입력되면 THE SYSTEM SHALL 업무ID·업무명·L3 통합검색과 도메인·조직·Depth·담당자·마일스톤·SB 대상 필터를 조합해 결과를 2초 이내 반환해야 한다.
- **SBF-03** WHEN 동일 업무ID에 여러 행이 있으면 THE SYSTEM SHALL SUB ID와 원본 sort 순서로 서로 다른 레코드를 식별해야 한다.
- **SBF-04** WHEN 항목 상세를 조회하면 THE SYSTEM SHALL 연결 L3, 현재 처리 중 요청, 변경이력과 원본 추적정보를 함께 표시해야 한다.
- **SBF-05** THE SYSTEM SHALL 현재 상태와 시점별 SbfRevision을 분리하여 과거 시점의 전체 레코드를 재구성할 수 있어야 한다.

## 3. 변경요청과 상태 흐름

- **CR-01** WHEN 요청자가 제출하면 THE SYSTEM SHALL 필수 필드와 대상 충돌을 검증하고 상태를 `요청 접수`로 변경해야 한다.
- **CR-02** THE SYSTEM SHALL 신규 등록, 기존 업무 수정, 업무 삭제, IA-L3 매핑 변경, 기타를 요청 구분으로 지원해야 한다. "기타"는 정형화되지 않은 자유 작업 요청에 사용한다.
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
- **SBF-09** WHEN 사용자가 SBF 마스터를 조회하면 THE SYSTEM SHALL Excel `1. IA` 원본의 `milestone` 컬럼을 기본 필터로 제공해야 한다.
- **SBF-10** WHEN 사용자가 검색·필터를 적용한 후 정렬 기준과 방향을 선택하면 THE SYSTEM SHALL 필터 결과 집합에 대해 오름차순·내림차순 정렬을 적용해야 하며 기본값은 원본 `sort` 오름차순이어야 한다.
- **SBF-11** WHEN 사용자가 AX열까지의 가로 스크롤 표를 조회하면 THE SYSTEM SHALL Excel처럼 주요 컬럼을 고정할 수 있는 프리셋을 제공해야 한다. 고정 프리셋은 `고정 없음`, `업무ID까지`, `SUB ID까지`, `도메인까지`, `담당분과까지`, `4Depth까지`를 포함해야 한다.

## 8. 첨부 Kiro 보완 요구사항

- **SBF-07** WHEN 사용자가 계층 화면을 조회하면 THE SYSTEM SHALL Depth 1만 기본 펼침으로 표시하고 노드 토글과 표 동시 강조를 제공해야 한다.
- **SBF-08** THE SYSTEM SHALL 표시 열을 선택·해제·초기화할 수 있게 하고 결과 없음 상태에 검색 초기화 수단을 제공해야 한다.
- **CR-09** WHEN 검토자가 요청을 조회하면 THE SYSTEM SHALL 변경 전후 값을 병렬 표시하고 변경 필드 및 Depth 이동을 강조해야 한다.
- **CR-10** WHEN 편집이 시작되면 THE SYSTEM SHALL 사용자와 만료시각을 포함한 30분 편집 잠금을 설정하고 비활성 만료 후 해제해야 한다.
- **CR-11** WHEN 과제 ID 또는 요구사항 ID 변경요청이 `작업 완료` 상태가 되면 THE SYSTEM SHALL 요청자와 검토자 모두 완료 결과 상세 화면에서 변경 전·후 값, SBF 반영결과, Jira 반영결과, 처리자, 작업 완료일을 확인할 수 있어야 한다.
- **CR-12** WHEN 사용자가 완료된 변경요청을 클릭하면 THE SYSTEM SHALL 별도 목록 메뉴를 추가하지 않고 `내 요청` 또는 `처리 업무`의 해당 행에서 완료 결과 상세로 연결해야 한다.
- **HIS-03** WHEN Task ID 이력을 조회하면 THE SYSTEM SHALL 담당자 변경을 포함한 최근 50건을 시간순으로 표시해야 한다.
- **NOTI-02** THE SYSTEM SHALL 사용자별 알림의 읽음·안읽음 상태와 보완 내용을 저장하고 표시해야 한다.
- **VER-01** WHEN 관리자가 버전 발행을 실행하면 THE SYSTEM SHALL 전체 마스터를 불변 스냅샷으로 저장하고 직접 입력 또는 마이너 자동 증가 버전을 부여해야 한다.
- **VER-02** THE SYSTEM SHALL 발행일시, 발행자, 500자 이하 사유, 항목 수를 기록하고 발행일시 내림차순으로 표시해야 한다.
- **VER-03** IF 발행 후 마스터가 변경되면 THEN THE SYSTEM SHALL 현재 상태를 `미발행 Draft`로 표시해야 한다.
- **VER-04** WHEN 특정 버전을 다운로드하면 THE SYSTEM SHALL `SBF_v{버전번호}_{발행일}.csv` 파일명과 요구된 업무·담당·조직·Milestone·SB·L3 컬럼을 제공해야 한다.
- **JIRA-03** THE SYSTEM SHALL 미반영·반영·반영실패 목록과 실패 사유, 반영 일시를 관리해야 한다.



- **CR-13** WHEN 관리자가 SBF 반영 작업을 수행하면 THE SYSTEM SHALL 대상 업무ID의 IA 원본 전체 필드를 변경 전/변경 후로 병렬 표시하고, 변경 후 전체 필드를 직접 수정할 수 있어야 한다.



- **CR-14** WHEN 사용자가 변경요청 항목을 작성하면 THE SYSTEM SHALL 대상 업무ID와 함께 SUB ID를 입력받아 변경 대상 레코드를 (업무ID, SUB ID) 조합으로 식별해야 한다. SUB ID 미입력 시 기본값은 1이다.

### 처리업무 검토 상세 흐름 보완
- **REV-01** WHEN 검토자/관리자가 처리 업무에서 `검토 시작`을 누르면 THE SYSTEM SHALL 요청자가 입력한 변경요청 상세 내용을 확인할 수 있는 검토 상세 창을 표시해야 한다.
- **REV-02** WHEN 검토 상세 창에서 요청 기본정보가 부족하면 THE SYSTEM SHALL 검토자가 업무ID, SUB ID, 변경 유형, 대상 도메인, 요청자, 요청 부서 등 검토 기준 정보를 수기로 보정할 수 있어야 한다.
- **REV-03** WHEN 검토자가 요청 내용이 부족하다고 판단하면 THE SYSTEM SHALL 검토 상세 창에서 `보완 요청`을 선택하여 요청 상태를 보완 요청으로 전환해야 한다.
- **REV-04** WHEN 검토자가 요청 내용이 충분하다고 판단하면 THE SYSTEM SHALL 검토 상세 창에서 `승인` 또는 `반려`를 같은 레벨의 검토 결정으로 선택할 수 있어야 한다.
- **REV-05** WHEN 변경요청이 승인되면 THE SYSTEM SHALL SBF 반영 작업 버튼을 활성화하고, SBF 반영 작업 화면에서 최종 수정 작업을 진행하도록 연결해야 한다.
- **REV-11** WHEN 변경요청이 제출되면 THE SYSTEM SHALL 요청 제목/본문, 첨부 mock 메타데이터, 참조 링크, 전체 IA 필드 변경값(beforeRaw, afterRaw, reason)을 포함한 신청서 원문 payload를 검토 단계에서 다시 표시할 수 있도록 저장해야 한다.
- **REV-12** WHEN 검토자가 처리 업무의 검토 상세를 열면 THE SYSTEM SHALL 현재 SBF 마스터 행이나 제목/도메인 기반 추정값이 아니라 제출 시 저장된 신청서 원문 payload를 그대로 기준으로 표시해야 한다.
- **REV-13** WHEN 검토자가 검토 상세에서 기본정보 또는 SBF 변경값을 보정하면 THE SYSTEM SHALL 그 보정값을 검토용 변경값 세트로 즉시 반영하고, 검토 상세의 요청 변경값과 이후 SBF 반영 작업의 초기값에 동일하게 전달해야 한다.
- **REV-14** IF 현재 MVP seed 데이터처럼 신청서 원문 payload가 완전하지 않은 요청을 조회하는 경우 THEN THE SYSTEM SHALL 일부 요약값만 재현 중임을 명시하고, 실제 제출 원문이 모두 보이는 것처럼 오해를 주지 않아야 한다.

- **SBF-17** WHEN 사용자가 SBF 마스터의 IA 원본 표를 조회하면 THE SYSTEM SHALL 내부 정렬용 `sort` 컬럼을 화면에 표시하지 않아야 한다.
- **SBF-18** WHEN 필터값 초기화 상태에서 정렬 방향을 오름차순 또는 내림차순으로 선택하면 THE SYSTEM SHALL 화면에 표시되는 기본 정렬 기준을 `업무ID`로 적용해야 한다.


### 변경요청 전체 IA 필드 입력 흐름
- **CR-15** WHEN 사용자가 변경요청을 작성하면 THE SYSTEM SHALL 요청구분에 따라 SBF IA 전체 컬럼의 요청 변경값을 입력할 수 있어야 한다.
- **CR-16** WHEN 요청구분이 수정, 삭제, 매핑 변경이면 THE SYSTEM SHALL 업무ID와 SUB ID로 현재 SBF 기준 행을 불러와 전체 컬럼의 현재값과 요청 변경값을 함께 표시해야 한다.
- **CR-17** WHEN 요청구분이 신규이면 THE SYSTEM SHALL 기존값 없이 IA 전체 컬럼의 신규 요청값을 입력할 수 있는 빈 입력폼을 제공해야 한다.
- **CR-18** WHEN 변경요청이 제출되면 THE SYSTEM SHALL 업무ID, SUB ID, 요청구분, 전체 IA 필드 요청값, 변경 사유를 검토 상세 및 SBF 반영 작업의 초기 입력값으로 사용할 수 있게 저장해야 한다.

- **CR-19** WHEN 사용자가 변경요청에서 `기준값 불러오기`를 누르면 THE SYSTEM SHALL 최신 공식 SBF 마스터 데이터에서 업무ID + SUB ID가 일치하는 IA 행의 전체 cell 값을 현재 SBF 값과 요청 변경값에 로딩해야 한다.
- **CR-20** WHEN 기준값을 조회할 때 THE SYSTEM SHALL 업무ID는 공백 제거 및 대문자 정규화, SUB ID는 숫자 비교를 적용하고, 구조화 필드와 원본 IA cell 값을 모두 기준으로 매칭해야 한다.
- **SBF-21** WHEN 사용자가 SBF 마스터 검색창에 문자를 입력하면 THE SYSTEM SHALL 결과가 갱신되는 동안에도 검색 input 포커스를 유지하여 연속 타이핑을 방해하지 않아야 한다.
- **CR-21** WHEN 변경요청 화면에서 업무ID 입력 예시를 표시하면 THE SYSTEM SHALL 실제 입력값으로 오해되지 않도록 placeholder에 ex: 접두어를 사용해야 한다.
- **SBF-22** WHEN 사용자가 SBF 마스터에서 업무ID를 선택하면 THE SYSTEM SHALL 요약 정보가 아니라 해당 IA 행의 전체 열 값을 상세 drawer에 표시하고, 열/값이 많을 경우 세로 및 가로 스크롤로 확인할 수 있어야 한다.
- **SBF-23** WHEN SBF 마스터 상세 drawer의 상태값이 미정 또는 의미 없는 placeholder 값이면 THE SYSTEM SHALL 해당 상태 배지를 표시하지 않아야 한다.
- **REV-06** WHEN 사용자가 처리업무 메뉴에 진입하면 THE SYSTEM SHALL 기본 보기 형태를 카드형이 아니라 리스트형으로 표시해야 한다.
- **CR-22** WHEN 사용자가 내 요청 메뉴에 진입하면 THE SYSTEM SHALL 현재 로그인 사용자 기준으로 요청자 필터를 적용하여 본인이 등록한 변경요청만 표시해야 한다. 변경요청 메뉴는 전체 변경요청 현황을 표시한다.
- **CR-23** WHEN 사용자가 SBF 변경요청의 대상 도메인을 선택하면 THE SYSTEM SHALL 하드코딩 목록이 아니라 최신 공식 SBF 마스터의 실제 도메인 목록을 옵션으로 제공해야 한다.
- **CR-24** WHEN 사용자가 SBF 마스터 업무ID 상세 drawer에서 변경요청 작성을 선택하면 THE SYSTEM SHALL 선택한 업무ID/SUB ID, 대상 도메인, 현재 IA 전체 cell 값을 기준값으로 미리 채운 SBF 변경요청 창을 표시해야 한다. 일반 + 변경요청 버튼은 빈 요청서로 시작해야 한다.
- **CR-25** WHEN 화면에서 일반 신규 변경요청을 여는 버튼을 표시하면 THE SYSTEM SHALL 메뉴와 위치에 관계없이 버튼명을 새 변경요청으로 통일해야 한다.

- **REV-07** WHEN 처리 업무 목록에서 변경요청 상태를 표시하면 THE SYSTEM SHALL 현재 상태에 해당하는 업무 단계만 강조하고 나머지 단계 버튼은 비활성화해야 한다. 요청 접수·검토 중·보완 요청은 `요청 검토`, 승인·SBF 반영 중은 `SBF 반영`, SBF 반영 완료는 `Jira 확인 후`, 작업 완료·반려는 종료 상태로 본다.
- **REV-08** WHEN 요청 검토 단계가 활성화되면 THE SYSTEM SHALL 상태에 따라 `검토 시작`, `검토 계속`, `재검토` 버튼명을 표시하고 SBF 반영·Jira 확인 후 단계는 잠금 상태로 표시해야 한다.
- **REV-09** WHEN SBF 반영 단계가 활성화되면 THE SYSTEM SHALL `SBF 반영 작업`만 선택 가능하게 하고 요청 검토와 Jira 확인 후 단계는 비활성화해야 한다. SBF 반영 완료 처리는 SBF 반영 작업 화면의 완료 버튼에서만 수행한다.
- **REV-10** WHEN Jira 확인 후 단계가 활성화되면 THE SYSTEM SHALL `작업 완료`만 선택 가능하게 하고 Jira 항목 미입력 시 확인 메시지를 표시해야 한다.
- **CR-26** WHEN 사용자가 `내 요청` 또는 `변경요청` 목록에서 요청번호를 선택하면 THE SYSTEM SHALL 상태와 관계없이 요청자가 제출한 변경요청 상세 정보를 오른쪽 drawer로 표시해야 한다. 이 상세에는 요청번호, 제목, 변경 유형, 요청자, 상태, 요청일, 대상 업무ID, SUB ID, SBF/Jira 반영결과, 처리 이력, 요청 내용/첨부 참조 요약이 포함되어야 한다.
- **CR-27** WHEN 선택한 요청이 작업 완료 상태이면 THE SYSTEM SHALL 요청 상세 drawer에서 완료 결과 상세로 이어지는 동선을 제공해야 한다.
- **CR-28** WHEN `내 요청`에서 반려 또는 보완 요청 상태의 요청번호를 선택하면 THE SYSTEM SHALL 요청 상세 drawer에서 "수정작업 진행" 버튼을 제공하고, 클릭 시 기존 변경요청 데이터(제목, 요청 내용, IA 필드값)를 prefill한 수정 화면을 열어야 한다. 수정 화면 상단에 보완/반려 사유를 표시하고, 하단에 보완/수정 요약 입력을 필수로 요구한 뒤 같은 요청번호로 재요청해야 한다.
- **CR-29** WHEN 요청자가 반려 또는 보완 요청 건을 재요청하면 THE SYSTEM SHALL 요청 상태를 `요청 접수`로 전환하고 반려/보완 후 수정 재요청 이력을 남겨 검토자가 다시 검토할 수 있게 해야 한다.


## 배포 작업본 및 공식 버전 관리 보완

- **VER-05** WHEN 관리자가 SBF 반영 작업을 완료하면 THE SYSTEM SHALL 현재 공식 버전(v2.5)을 직접 수정하지 않고 다음 배포 후보인 작업본/template에 변경 후 IA 전체 필드 값을 저장해야 한다.
- **VER-06** WHEN 변경값이 작업본/template에 저장되면 THE SYSTEM SHALL 해당 변경요청 상태를 `배포 대기`로 전환하고 변경이력에 요청번호, 업무ID, SUB ID, 변경 전/후 snapshot을 남겨야 한다.
- **VER-07** WHEN 관리자가 배포관리에서 `새 배포`를 실행하면 THE SYSTEM SHALL 최신 공식 버전 번호를 기준으로 다음 minor 버전(v2.5 → v2.6)을 생성하고 작업본/template 전체를 불변 공식 스냅샷으로 저장해야 한다.
- **VER-08** WHEN 새 공식 버전이 생성되면 THE SYSTEM SHALL SBF 마스터의 기본 대상 버전을 새 버전(v2.6)으로 전환하고 이전 공식 버전(v2.5)은 수정하지 않은 읽기 전용 스냅샷으로 보존해야 한다.
- **VER-09** WHEN 사용자가 v2.5를 선택하면 THE SYSTEM SHALL 배포 전 v2.5 데이터를 그대로 표시하고, v2.6을 선택하면 작업본/template에서 확정된 새 공식 데이터를 표시해야 한다.
- **VER-10** IN MVP THE SYSTEM SHALL 공식 버전, 작업본/template, 배포 이력을 브라우저 메모리 상태로만 유지하며, DB/Turso 도입 후 이를 영속 저장소에 저장하도록 확장해야 한다.

- **VER-11** WHEN 관리자가 새 배포를 반복 실행하면 THE SYSTEM SHALL 현재 최신 공식 버전의 minor 번호를 기준으로 다음 버전을 계속 증가시켜야 한다. 예: v2.5 → v2.6 → v2.7 → v2.8.
- **VER-12** WHEN 다음 배포 버전을 계산하면 THE SYSTEM SHALL 하드코딩된 v2.6이 아니라 공식 버전 목록에서 가장 높은 major/minor 값을 가진 버전을 기준으로 산출해야 한다.

- **VER-13** WHEN 최신 공식 버전의 minor 번호가 9인 상태에서 새 배포를 실행하면 THE SYSTEM SHALL major 번호를 1 증가시키고 minor 번호를 0으로 초기화해야 한다. 예: v2.9 → v3.0 → v3.1 → v3.2.
- **VER-14** WHEN 배포관리 화면에 배포 준비 버튼 또는 배포 dialog를 표시하면 THE SYSTEM SHALL 하드코딩된 버전 문자열이 아니라 동일한 nextVersion 계산 규칙을 사용해 표시해야 한다.
- **VER-15** WHEN MVP가 초기 공식 버전 목록을 제공하면 THE SYSTEM SHALL v2.4와 v2.5를 동일한 mock 복사본으로 표시하지 않고, `SKT_Business_Framework_v2.4.xlsx`의 `1. IA` 시트에서 생성한 별도 v2.4 mock snapshot과 v2.5 snapshot을 분리해 제공해야 한다. v2.4 원본의 컬럼 구성이 v2.5와 다를 경우에는 단순 열 위치가 아니라 헤더명과 동일 헤더의 출현 순서 기준으로 AX열 표시용 필드에 매핑해야 한다.
- **VER-16** WHEN 사용자가 SBF 마스터를 조회하면 THE SYSTEM SHALL 버전 선택 기능을 제공하지 않고 항상 최신 공식 버전 snapshot을 기준으로 카드 통계, 필터 옵션, Sheet 행/열, 상세 drawer, 필터 결과 CSV를 표시해야 한다. 과거 버전 확인/다운로드는 배포관리에서 제공한다.
- **VER-17** IN MVP THE SYSTEM SHALL 로컬 Excel 파일을 Netlify 브라우저에서 직접 읽지 않고, 빌드 시점에 파싱해 생성한 mock data seed를 사용해야 한다. 운영/DB 단계에서는 데이터 가져오기 메뉴로 업로드한 Excel을 버전 snapshot으로 영속 저장한다.
- **CR-30** WHEN 사용자가 `변경요청` 또는 `내 요청` 목록에서 검색어, 전체 상태, 전체 유형을 변경하면 THE SYSTEM SHALL 요청번호/제목/요청자 검색, 상태 필터, 변경 유형 필터를 즉시 목록에 적용해야 한다. 기존 `필터` 버튼은 `필터 초기화` 버튼으로 제공되어 검색어와 필터 값을 기본값으로 되돌려야 한다.

## 9. 구현 반영 보완 요구사항

- **CR-31** WHEN 변경요청을 제출하면 THE SYSTEM SHALL 요청자가 입력한 변경 요청 내용(contentHtml)과 요청 부서(requesterOrganization)를 저장하고, REQUEST DETAIL 및 REVIEW DETAIL에서 해당 원문을 표시해야 한다.
- **CR-32** WHEN 요청 구분이 "기타"이면 THE SYSTEM SHALL 전체 IA 필드 변경 테이블을 선택적으로 사용할 수 있게 하고, 요청 내용 textarea에 자유 형식 작업을 기술할 수 있어야 한다.
- **UI-01** THE SYSTEM SHALL SBF 마스터 화면에서 변경요청 상태 배지와 변경접수 건만 보기 필터를 표시하지 않아야 한다. SBF 마스터는 최신 공식 배포본 조회 전용이다.
- **UI-02** THE SYSTEM SHALL SBF 반영 작업 메뉴를 사이드바에 표시하지 않되, 처리 업무의 SBF 반영 작업 버튼으로 진입하는 기능은 유지해야 한다.
- **UI-03** WHEN 수정 후 재요청이 완료되면 THE SYSTEM SHALL REVIEW DETAIL 요청 원문 섹션에 최근 재요청 사유를 표시해야 한다.

## 10. MVP 클라이언트 Excel 가져오기

본 그룹은 사용자가 선택한 옵션 A(클라이언트 전용 mock 가져오기)에 해당하며, 서버/DB 없이 브라우저에서 직접 .xlsx를 파싱해 현재 세션의 활성 공식 버전 SBF 마스터 데이터를 교체하는 MVP 한정 기능을 정의한다. 데이터 가져오기 메뉴(ImportView)의 기존 목업 동작을 실제 파일 입력·파싱·세션 반영으로 대체한다. 기존 IMP-01~08, VER-10, VER-16, VER-17은 삭제하지 않으며, 본 그룹은 그 관계를 참조한다.

- **IMP-C01** WHEN 사용자가 데이터 가져오기 화면에서 파일 선택 컨트롤을 활성화하면 THE SYSTEM SHALL `accept=".xlsx"` 속성을 가진 파일 선택 다이얼로그를 열어야 한다.
  - WHEN 사용자가 다이얼로그에서 파일 선택을 취소하면 THE SYSTEM SHALL 마스터 데이터와 화면 상태를 변경 없이 유지해야 한다.
- **IMP-C02** WHEN 선택된 통합문서에 이름이 정확히 `1. IA`(대소문자·공백·마침표 일치)인 시트가 존재하면 THE SYSTEM SHALL 해당 시트 1개만 파싱 대상으로 삼아야 한다.
  - WHILE 통합문서에 여러 시트가 존재하는 경우 THE SYSTEM SHALL `1. IA` 외의 모든 시트를 무시하고 파싱하지 않아야 한다.
- **IMP-C03** IF 선택된 통합문서에 이름이 정확히 `1. IA`인 시트가 없으면 THEN THE SYSTEM SHALL 해당 시트가 없음을 알리는 오류 메시지를 표시하고 세션 마스터 rows를 변경하지 않아야 한다.
- **IMP-C04** THE SYSTEM SHALL 파싱을 브라우저 클라이언트 내에서만 수행하고, 파일 원본 또는 파싱 결과를 서버/DB에 전송하거나 저장하지 않아야 한다.
- **IMP-C05** WHEN `1. IA` 시트 파싱이 성공하면 THE SYSTEM SHALL 현재 세션의 활성 공식 버전 SBF 마스터 rows를 파싱된 rows로 전량 교체해야 한다.
- **IMP-C06** THE SYSTEM SHALL 가져오기 결과를 현재 세션에만 유지해야 하며(비영구), WHEN 페이지가 새로고침되면 THE SYSTEM SHALL 초기 seed 데이터(`items`)로 복원해야 한다. (※ PER-05에 의해 대체됨: 영속 반영은 PER 그룹의 파일 기반 로딩을 따른다. IMP-C 자체는 발행 전 세션 미리보기 계층으로 유지된다.)
- **IMP-C07** WHEN 파싱된 시트의 헤더 행을 매핑하면 THE SYSTEM SHALL `iaHeaders`의 헤더명과 일치하는 열을 매핑하고, 동일한 헤더명이 2회 이상 출현하면 출현 순서대로 `iaHeaders`의 해당 위치에 순차 매핑해야 한다.
- **IMP-C08** WHEN 각 데이터 행을 변환하면 THE SYSTEM SHALL 업무ID 값의 영문을 대문자로 변환하고 앞뒤 공백을 제거하며, SUB ID 값을 정수로 변환하되 값이 비어있거나 숫자로 변환할 수 없으면 기본값 1을 사용해야 한다.
- **IMP-C09** WHEN 파싱이 성공하고 마스터 교체를 적용하기 전 THE SYSTEM SHALL 파일명, 시트명, 전체 데이터 행 수를 포함한 파싱 결과 요약을 표시해야 한다.
- **IMP-C10** WHEN 가져오기 시도가 종료되면(성공 또는 실패) THE SYSTEM SHALL "최근 가져오기 작업" 목록에 파일명, 시트명, 전체 행 수, 실행일시, 상태(성공/실패)를 포함한 행을 현재 세션 범위로 추가해야 한다.
- **IMP-C11** IF 선택 파일의 확장자가 `.xlsx`가 아니거나, 파일이 손상되어 파싱할 수 없거나, `1. IA` 시트에 헤더 행이 없거나, 헤더 행 아래 데이터 행이 0건이면 THEN THE SYSTEM SHALL 실패 원인을 구분해 알리는 오류 메시지를 표시하고 세션 마스터 rows를 변경하지 않아야 한다.
  - IF 선택 파일 크기가 10MB를 초과하면 THEN THE SYSTEM SHALL 크기 초과를 알리는 오류 메시지를 표시하고 파싱을 수행하지 않으며 세션 마스터 rows를 변경하지 않아야 한다.
- **IMP-C12** IF 유효성 검사(IMP-C03, IMP-C11)가 실패하면 THEN THE SYSTEM SHALL 기존 세션 마스터 rows를 원상 유지하고 화면의 조회 데이터를 실패 이전 상태로 보존해야 한다.
- **IMP-C13** THE SYSTEM SHALL 파싱 결과를 기존 데이터 계약(`Item`, `raw`, `iaHeaders`)에 맞춰 생성하여, 조회·검색·필터·정렬·상세·CSV 내보내기가 seed 데이터와 동일하게 동작하도록 해야 한다.
- **IMP-C14** THE SYSTEM SHALL 본 기능(IMP-C01~IMP-C13)을 MVP 클라이언트 전용 범위로 한정하며, 운영/DB 단계에서는 IMP-01~08 및 VER-17 서버 파이프라인(업로드 → validate → preview → commit, SbfVersion/SbfSnapshot 영속화)으로 대체·확장하는 것을 전제로 해야 한다.

## 11. 파일 기반 영속 SBF 마스터 (모든 기기 공유)

본 그룹은 SBF 마스터 기본값을 서버 설치 없이 리포지토리에 포함된 정적 JSON 파일(`public/sbf-master.json`)로 영속화하여, 어느 기기에서 접속하든 동일한 값을 보이게 하고 다음 접속에도 유지되게 하는 요구를 정의한다. 배포관리의 발행(PUBLISH VERSION) 흐름에서 스냅샷 JSON을 생성·다운로드하고, 담당자가 이를 고정 경로에 배치·커밋하면 정적 재배포로 모든 기기에 반영된다. 본 그룹은 브라우저 세션 한정·비영구였던 IMP-C 그룹을 확장하며, 특히 IMP-C06(새로고침 시 seed 복원)을 파일 기반 로딩(PER-05)으로 대체한다. 서버/DB는 사용하지 않는다.

- **PER-01** WHEN 사용자가 배포관리 화면에서 불변 스냅샷 배포(PUBLISH VERSION)를 실행하면 THE SYSTEM SHALL 현재 활성 공식 버전의 전체 SBF 마스터 데이터를 `sbf-master.json` 형식의 스냅샷으로 생성하여 브라우저에서 자동 다운로드해야 한다.
- **PER-02** THE SYSTEM SHALL 생성되는 스냅샷 파일명을 고정 문자열 `sbf-master.json`으로 지정해야 한다.
- **PER-03** THE SYSTEM SHALL 스냅샷 JSON에 버전 메타데이터(버전 번호, 발행일시, 발행자, 발행 사유, 항목 수, 원본 파일명, 원본 시트명), 헤더 정의(`iaHeaders`), 데이터 항목 목록(`raw` 배열을 포함한 items)을 포함하여 기존 데이터 계약(`Item`, `raw`, `iaHeaders`)과 호환되게 구성해야 한다.
- **PER-04** WHEN 애플리케이션이 시작되면 THE SYSTEM SHALL 고정 경로 `public/sbf-master.json`(배포 시 사이트 루트의 `/sbf-master.json`)을 조회하여 SBF 마스터 기본값으로 로딩하고, 조회·검색·필터·정렬·상세·CSV 내보내기가 해당 데이터로 동작하도록 해야 한다.
- **PER-05** THE SYSTEM SHALL SBF 마스터 기본값의 데이터 출처를 `sbf-master.json` 파일로 일원화해야 하며(IMP-C06의 세션 seed 복원 정책을 대체), 파일 로딩이 성공하면 그 값이 모든 기기에서 동일하게 표시되고 다음 접속에도 유지되어야 한다.
- **PER-06** IF `sbf-master.json` 파일이 존재하지 않거나 네트워크 조회에 실패하거나 JSON 파싱/스키마 검증에 실패하면 THEN THE SYSTEM SHALL seed로 조용히 폴백하지 않고, 데이터 파일을 불러올 수 없음을 알리는 명시적 오류 상태를 표시해야 한다.
  - WHEN 오류 상태를 표시하면 THE SYSTEM SHALL 담당자가 조치할 수 있도록 원인(파일 없음/조회 실패/형식 오류)과 조치 안내(배포관리에서 발행 후 `public/sbf-master.json` 배치·커밋·재배포)를 포함하고 재시도 수단을 제공해야 한다.
- **PER-07** THE SYSTEM SHALL 배포 반영 절차를 파일 기반 자동 배포 규칙으로 정형화해야 하며, 다운로드된 `sbf-master.json`을 리포지토리 고정 경로 `public/sbf-master.json`에 배치하고 커밋하면 정적 재배포를 통해 모든 기기에 반영되는 것으로 정의해야 한다(브라우저에서 원격 파일 직접 쓰기는 수행하지 않는다).
- **PER-08** THE SYSTEM SHALL IMP-C 브라우저 가져오기(세션 한정·비영구)를 발행 전 미리보기·검증 계층으로 유지하고, 영속 반영은 본 그룹(PER-01~PER-07)의 발행·배치·배포 흐름으로만 수행되도록 관계를 정의해야 한다.
- **PER-09** THE SYSTEM SHALL 서버/DB를 도입하지 않는 범위를 유지해야 하며, 완전 자동 커밋(예: GitHub API/서버리스 함수) 방식은 본 그룹 범위에서 제외하고 별도 확장 전제로만 참조해야 한다.

## 12. 발행 버전 통제 및 가져오기 연동 배포

본 그룹은 파일 기반 영속 SBF 마스터(PER 그룹)의 발행 흐름을 실사용에 맞게 보정한다. 데이터 가져오기(IMP-C)로 세션 활성 버전을 교체한 뒤 그 값을 발행·배포할 수 있어야 하며, 발행 버전 번호를 사용자가 직접 통제할 수 있어야 한다. 기존 VER-*·PER-* 규칙을 참조·확장한다.

- **VPUB-01** WHEN 사용자가 배포관리에서 발행(불변 스냅샷 배포)을 실행하면 THE SYSTEM SHALL 발행 대상 데이터로 현재 활성 공식 버전(officialVersions[0])의 rows를 사용해야 하며, 가져오기(IMP-C)로 교체된 세션 데이터가 그대로 스냅샷과 sbf-master.json에 반영되어야 한다.
- **VPUB-02** THE SYSTEM SHALL 발행 다이얼로그에서 버전 번호를 사용자가 직접 입력·수정할 수 있는 편집 가능한 입력 필드로 제공해야 한다.
- **VPUB-03** WHEN 발행 다이얼로그가 열리면 THE SYSTEM SHALL 버전 입력 필드에 유추한 기본값을 미리 채워야 한다. 기본값은 활성 버전 기준 자동 계산값(calculateNextVersion)을 사용하되, 가져오기 시 확보한 버전 힌트가 있으면 그 값을 우선 사용한다.
- **VPUB-04** THE SYSTEM SHALL 사용자가 입력한 버전 번호를 발행 결과의 공식 버전 및 sbf-master.json 메타(versionNo)에 그대로 사용해야 하며, 3단 버전(예: 2.7.1)을 포함한 자유 형식 버전 문자열을 허용해야 한다.
- **VPUB-05** IF 입력한 버전 번호가 비어 있거나 이미 존재하는 공식 버전과 중복되면 THEN THE SYSTEM SHALL 발행을 막고 오류 안내를 표시해야 한다.
- **VPUB-06** THE SYSTEM SHALL 발행 버튼 활성화 조건을 확대하여, 승인 워크플로우의 미발행 변경(pendingPublishCount>0)이 없더라도 현재 세션에서 가져오기(IMP-C)로 활성 버전이 교체된 이력이 있으면 발행을 허용해야 한다.
- **VPUB-07** THE SYSTEM SHALL 발행 시 다운로드되는 파일명은 PER-02에 따라 고정 sbf-master.json을 유지하되, 파일 내부 메타(versionNo)에는 사용자가 통제한 버전 번호를 기록해야 한다.