# Implementation Plan: 상단 가로 탭 내비게이션 (horizontal-tab-navigation)

## Overview

기존 세로 사이드바(`app/page.tsx`의 `<aside className="sidebar">`)를 상단 가로 한 줄 탭(Top_Tab_Bar)으로 재구성한다. 구현은 "무엇을 보여줄지"를 결정하는 **순수 계산 계층**(부수효과 없음, 속성 테스트 대상)과 "어떻게 그릴지"를 담당하는 **표현 계층**(Top_Tab_Bar 컴포넌트)으로 분리한다. `Home`의 `view`/`setView` 상태와 콘텐츠 View 전환 체인은 변경하지 않아 재구성 전후 동일 View를 보장한다(Req 5.6).

작업은 데이터/타입 정의 → 순수 계산 함수(테스트 우선) → 표현 계층 → 기존 화면 배선 → 통합 테스트 순으로 점진적으로 진행한다. 속성 기반 테스트는 fast-check로 각 속성당 최소 100회 이상 반복하며, 태그 형식은 `Feature: horizontal-tab-navigation, Property N`을 사용한다.

## Tasks

- [x] 1. 데이터 모델과 노출 규칙, 테스트 환경 준비
  - `app/tabnav/` 디렉터리(또는 프로젝트 관례에 맞는 위치)를 만들고 계산 계층 파일 구조를 잡는다
  - `Tab`, `Menu_Group`, `Role_Exposure_Rule`, `VisibleGroup` 타입을 TypeScript로 정의한다 (설계 Data Models 표 기준)
  - `app/data.ts`의 `menus` 배열을 소스로 하여 그룹/탭 정의를 도출하는 어댑터와, 권한 미구현 "open" 상태의 `Role_Exposure_Rule`(전 역할에 세 그룹 허용)을 데이터로 정의한다
  - fast-check를 devDependency로 추가하고(`npm install --save-dev fast-check`), 프로젝트 테스트 러너 설정을 확인한다 (없으면 표준 러너를 단발 실행 모드로 구성)
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 3.3_

- [x] 2. 탭 노출 계산 (computeVisibleGroups)
  - [x] 2.1 computeVisibleGroups 순수 함수 구현
    - 입력: Menus_Data, Role_Exposure_Rule, 현재 User_Role → 출력: `VisibleGroup[]`
    - 현재 역할에 허용된 Menu_Group만 남기고, 규칙 미명시 그룹은 비노출 처리, open 상태는 세 그룹 전체 허용
    - 그룹/탭 순서는 항상 Menus_Data 정의 순서를 따르며, 'SBF 반영 작업'은 어떤 그룹의 탭 목록에도 포함하지 않는다
    - 역할 미정의/알 수 없음/허용 그룹 없음이면 빈 목록 반환
    - _Requirements: 1.4, 2.4, 3.1, 3.2, 3.3, 3.5, 4.4, 6.1_

  - [x]* 2.2 computeVisibleGroups 속성 테스트 — 순서 보존
    - **Property 1: Menus_Data 순서 보존** — 결과의 그룹 배치 순서와 각 그룹 내 탭 순서가 Menus_Data 정의 순서의 부분수열임을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 1`
    - **Validates: Requirements 1.4, 4.4**

  - [x]* 2.3 computeVisibleGroups 속성 테스트 — 역할 노출 정합성
    - **Property 2: 역할 기반 노출 정합성** — 결과의 모든 탭이 허용 그룹 소속이며, 비허용/미명시 그룹 탭이 하나도 포함되지 않음(역할 변경 후 재평가 포함)을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 2`
    - **Validates: Requirements 3.1, 3.3, 3.4**

  - [x]* 2.4 computeVisibleGroups 속성 테스트 — 'SBF 반영 작업' 상시 제외
    - **Property 9: 'SBF 반영 작업' 상시 제외** — 임의의 Menus_Data(open 포함)/역할에서 결과의 어떤 탭 목록에도 'SBF 반영 작업'이 없음을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 9`
    - **Validates: Requirements 6.1**

  - [x]* 2.5 computeVisibleGroups 예시/엣지 테스트
    - 공통('대시보드','SBF 마스터')/변경요청자('변경요청','내 요청')/검토자·관리자('처리 업무','변경이력','데이터 가져오기','배포관리') 구체 탭 순서 검증
    - 이미지 전용 메뉴('SBF 탐색기','1Depth검토','2Depth검토','D3-L3 매칭') 부재, 빈 Menus_Data/0개 노출, 미정의·알 수 없음·빈 허용 역할 엣지 케이스
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.6, 3.5_

- [x] 3. Group_Divider 삽입 계산과 그룹 인접 배치
  - [x] 3.1 Group_Divider 삽입 계산 및 렌더 순서 산출 함수 구현
    - `VisibleGroup[]`을 입력받아 렌더 순서의 항목 시퀀스(탭/구분자)를 산출하는 순수 함수 구현
    - 노출 그룹 수 N일 때 인접 그룹 사이에 정확히 max(0, N-1)개의 Group_Divider 삽입, 같은 그룹 탭은 연속 구간 유지
    - _Requirements: 4.1, 4.2, 4.3_

  - [x]* 3.2 Group_Divider 속성 테스트 — 인접 연속 배치
    - **Property 3: 그룹 인접 연속 배치** — 렌더 순서 탭 시퀀스를 소속 그룹으로 매핑 시 동일 그룹 탭이 하나의 연속 구간을 이룸을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 3`
    - **Validates: Requirements 4.2**

  - [x]* 3.3 Group_Divider 속성 테스트 — 구분자 개수
    - **Property 4: Group_Divider 개수** — 노출 그룹 수 N에 대해 삽입 구분자 수가 정확히 max(0, N-1)임을 검증(그룹 1개 시 0개 포함)
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 4`
    - **Validates: Requirements 4.1, 4.3**

- [x] 4. Tab → View 매핑과 재선택 함수
  - [x] 4.1 resolveViewForTab 순수 함수 구현
    - Tab 라벨을 기존 `view` 상태 문자열(View 식별자)로 매핑(현재 항등). 매핑 없는 탭은 View 식별자 부재를 나타내는 결과 반환(전환 미수행 신호)
    - _Requirements: 5.1, 5.5, 5.6_

  - [x]* 4.2 resolveViewForTab 속성 테스트 — 매핑 등가성
    - **Property 8: Tab → View 매핑 등가성** — resolveViewForTab 결과가 재구성 이전 View 전환 판정(매핑표 기준 항등)과 일치함을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 8`
    - **Validates: Requirements 5.6**

  - [x]* 4.3 resolveViewForTab 속성 테스트 — 재선택 멱등성
    - **Property 7: 재선택 멱등성** — 같은 Tab을 두 번 연속 선택한 View 식별자가 한 번 선택 결과와 동일함을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 7`
    - **Validates: Requirements 5.4**

  - [x] 4.4 Active_Tab 판정 함수 구현
    - 노출 Tab 집합과 현재 View 식별자를 입력받아 Active_Tab을 판정(매핑 View 존재 시 정확히 1개, 없으면 0개)
    - _Requirements: 5.2, 5.3_

  - [x]* 4.5 Active_Tab 판정 속성 테스트 — 유일성
    - **Property 5: Active_Tab 유일성** — 현재 View에 매핑되는 노출 탭이 있으면 Active_Tab 판정 개수 정확히 1개, 없으면 0개임을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 5`
    - **Validates: Requirements 5.2, 5.3**

  - [x] 4.6 역할 변경 후 Active_Tab 재선택 함수 구현
    - 이전 Active_Tab과 새 노출 결과를 입력받아, 이전 Active_Tab이 비노출이면 표시 Tab 중 첫 번째로 재선택, 표시 Tab이 없으면 미선택 반환
    - _Requirements: 3.6_

  - [x]* 4.7 재선택 함수 속성 테스트 — 재선택 후 정합성
    - **Property 6: 재선택 후 Active_Tab 정합성** — 재평가 후 Active_Tab은 표시 Tab이 있으면 표시 집합에 포함(비노출 시 첫 번째로 재선택), 없으면 미선택임을 검증
    - fast-check 100회+, 태그 `Feature: horizontal-tab-navigation, Property 6`
    - **Validates: Requirements 3.6**

- [x] 5. 체크포인트 — 계산 계층 테스트 통과 확인
  - 모든 속성/예시/엣지 테스트를 실행하고 `npm run build`로 타입 오류가 없는지 확인한다. 문제가 있으면 사용자에게 질문한다.

- [x] 6. Top_Tab_Bar 표현 계층 구현
  - [x] 6.1 Top_Tab_Bar 컴포넌트 구현
    - `visibleGroups`, `activeView`, `onSelectTab` props를 받아 렌더 순서(3.1 결과)대로 그룹별 탭을 왼쪽→오른쪽 연속 배치하고 인접 그룹 사이에 Group_Divider를 그린다
    - `activeView`와 일치하는 탭에 Active_Tab 스타일 적용, 노출 탭 0개면 빈 영역 유지, 역할 미정의/허용 그룹 없음이면 "사용 가능한 메뉴가 없음" 안내 표시
    - _Requirements: 1.3, 2.5, 4.1, 5.2, 1.6, 3.5_

  - [x] 6.2 상단 고정 및 단일 행 + 가로 스크롤 스타일 적용
    - `app/globals.css`에 Top_Tab_Bar를 뷰포트 상단 경계에 고정하고, 탭 총 너비가 가용 너비를 초과해도 줄바꿈 없이 단일 행 유지 + 가로 스크롤로 접근하도록 스타일 추가
    - _Requirements: 1.1, 1.3, 1.5_

- [x] 7. 기존 화면 배선 (사이드바 → Top_Tab_Bar 치환)
  - [x] 7.1 app/page.tsx의 세로 사이드바 제거 및 Top_Tab_Bar 연결
    - `<aside className="sidebar">`/`<nav aria-label="주 메뉴">` 세로 목록을 제거하고 Top_Tab_Bar를 상단에 렌더한다
    - computeVisibleGroups 결과를 `visibleGroups`로, `view`를 `activeView`로 전달하고 `onSelectTab`이 resolveViewForTab을 거쳐 `setView`를 호출하도록 배선한다
    - 기존 `view` 문자열 비교 기반 콘텐츠 View 전환 체인은 변경하지 않는다
    - _Requirements: 1.1, 1.2, 5.1, 5.6_

  - [x] 7.2 'SBF 반영 작업' 진입/복귀 경로 유지 확인 및 배선
    - '처리 업무'(`ProcessingWork`)의 `openApply`가 `setView('SBF 반영 작업')`로 진입하고, `ChangeCompare` 완료/뒤로가기가 `setView('처리 업무')`로 복귀하는 기존 경로를 유지한다 (Top_Tab_Bar 비노출)
    - 복귀 시 '처리 업무' 탭이 Active_Tab으로 표시되도록 한다
    - _Requirements: 6.2, 6.3_

- [x] 8. 통합/렌더 테스트
  - [x]* 8.1 Top_Tab_Bar 렌더링 및 사이드바 부재 통합 테스트
    - 상단 고정 위치(1.1), 세로 사이드바 부재 + 상단 탭만 존재(1.2), 단일 행 배치(1.3), Group_Divider 표시(2.5, 4.1)를 렌더링 테스트로 검증
    - _Requirements: 1.1, 1.2, 1.3, 2.5, 4.1_

  - [x]* 8.2 가로 오버플로우 통합 테스트
    - 탭 총 너비 초과 시 줄바꿈 없이 단일 행 유지 + 가로 스크롤 접근 가능함을 검증
    - _Requirements: 1.5_

  - [x]* 8.3 Active_Tab 스타일 통합 테스트
    - 탭 선택 시 정확히 하나의 탭만 Active_Tab 스타일로 표시되고 이전 활성 표시가 해제됨을 검증
    - _Requirements: 5.2, 5.3_

  - [x]* 8.4 'SBF 반영 작업' 진입/복귀 통합 테스트
    - '처리 업무' 경유 진입 시 독립 탭 제거 이전과 동일한 화면 표시(6.2), 완료/뒤로가기 시 '처리 업무' View 복귀 + '처리 업무' Active_Tab 표시(6.3) 검증
    - _Requirements: 6.2, 6.3_

- [x] 9. 최종 체크포인트 — 전체 테스트 통과 확인
  - 모든 속성/단위/통합 테스트와 `npm run build`를 실행해 통과를 확인한다. 문제가 있으면 사용자에게 질문한다.

## Notes

- `*`로 표시된 서브태스크는 선택 사항(테스트)이며 빠른 MVP를 위해 건너뛸 수 있다. 핵심 구현 태스크는 선택 사항이 아니다.
- 각 태스크는 추적성을 위해 requirements 수용 기준(`_Requirements: X.Y_`)을 참조하고, 테스트 태스크는 설계의 Correctness Property도 함께 참조한다.
- 속성 테스트는 fast-check로 각 속성당 100회 이상 반복하며 태그 형식 `Feature: horizontal-tab-navigation, Property N`을 사용한다.
- 순수 계산 계층(computeVisibleGroups, Group_Divider 삽입, resolveViewForTab, Active_Tab 판정, 재선택 함수)이 광범위한 입력 커버리지를 담당하므로 단위 테스트는 구체 구성/경계 조건에 집중한다.
- 기존 `view`/`setView` 상태와 콘텐츠 View 전환 체인은 변경하지 않아 재구성 전후 동일 View를 보장한다(Req 5.6, Property 8).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "4.1", "4.4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.1", "4.2", "4.3", "4.5", "4.6"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.7", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1"] },
    { "id": 5, "tasks": ["7.2"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4"] }
  ]
}
```
