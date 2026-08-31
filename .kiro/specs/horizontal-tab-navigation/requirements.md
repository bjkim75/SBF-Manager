# Requirements Document

## Introduction

SBF-Manager는 현재 화면 좌측의 세로 사이드바(`<aside className="sidebar">`) 형태로 메뉴를 제공한다. 본 기능은 원본 SBF 관리 화면과 동일하게 상단 가로 탭 한 줄로 메뉴 구조를 재구성한다. 모든 탭은 한 줄에 배치하며, 현재 사용자 역할에 맞는 탭만 노출하는 방식(방식 1: 탭 조건부 노출)을 채택한다.

다만 현재 시스템에는 사용자 권한 구분이 구현되어 있지 않아 모든 권한이 개방(open) 상태이며, 그 결과 전체 탭이 모두 노출된다. 이 상태에서 서로 다른 역할의 탭이 뒤섞여 보이지 않도록, 역할 그룹별 시각적 그룹핑(구분선/그룹 라벨/간격 등)을 적용한다. 추후 권한 체계가 도입되면 그룹 단위 조건부 노출로 확장 가능하도록 설계한다.

본 문서는 요구사항만 정의하며 구현 코드는 포함하지 않는다.

## Glossary

- **SBF_Manager**: SBF 마스터 데이터와 변경요청/검토/배포 업무를 제공하는 웹 애플리케이션 (기술 스택: Next.js)
- **Top_Tab_Bar**: 화면 상단에 가로 한 줄로 배치되는 탭 내비게이션 영역 (기존 세로 사이드바를 대체함)
- **Tab**: Top_Tab_Bar 내의 개별 메뉴 항목. 선택 시 해당 View로 전환됨
- **Menu_Group**: 역할 기준으로 묶인 Tab의 집합. 공통 메뉴, 변경요청자 메뉴, 검토자/관리자 메뉴의 3개 그룹으로 구성됨
- **User_Role**: 사용자의 역할 구분. 현재는 미구현 상태이며 모든 역할 권한이 개방(open)됨
- **View**: 특정 Tab 선택 시 표시되는 화면 상태. `app/page.tsx`의 `view` 상태 값(문자열)으로 식별됨
- **Group_Divider**: Menu_Group 사이의 시각적 구분 요소(구분선, 그룹 라벨, 간격 등)
- **Active_Tab**: 현재 선택되어 View가 표시되고 있는 Tab
- **Menus_Data**: `app/data.ts`의 `menus` 배열. Menu_Group과 각 그룹에 속한 Tab 목록의 정의 원본

## Requirements

### Requirement 1: 상단 가로 탭 구조로 재구성

**User Story:** 사용자로서, 세로 사이드바 대신 상단 가로 탭으로 메뉴를 이용하고 싶다. 그래야 원본 SBF 관리 화면과 동일한 방식으로 메뉴를 탐색할 수 있다.

#### Acceptance Criteria

1. WHEN SBF_Manager 화면이 로드되면, THE SBF_Manager SHALL 화면 최상단(뷰포트 상단 경계에 고정된 위치)에 Top_Tab_Bar를 표시한다
2. THE SBF_Manager SHALL 세로 사이드바를 표시하지 않으며, 모든 메뉴 항목을 Top_Tab_Bar를 통해서만 제공한다
3. THE Top_Tab_Bar SHALL 노출 대상인 모든 Tab을 가로 한 줄(단일 행)에 배치하고, 각 Tab을 왼쪽에서 오른쪽 순서로 표시한다
4. THE Top_Tab_Bar SHALL Menus_Data에 정의된 순서 값의 오름차순으로 Tab을 왼쪽에서 오른쪽으로 표시한다
5. WHERE 노출 대상 Tab의 총 너비가 Top_Tab_Bar의 가용 너비를 초과하는 경우, THE Top_Tab_Bar SHALL 모든 Tab을 단일 행으로 유지하며 가로 스크롤을 통해 접근 가능하게 한다
6. IF Menus_Data가 비어 있거나 노출 대상 Tab이 0개인 경우, THEN THE Top_Tab_Bar SHALL Tab을 표시하지 않고 빈 Top_Tab_Bar 영역을 유지한다

### Requirement 2: 메뉴 그룹 유지

**User Story:** 사용자로서, 기존 메뉴 그룹 구성을 그대로 이용하고 싶다. 그래야 재구성 이후에도 익숙한 메뉴 체계를 사용할 수 있다.

#### Acceptance Criteria

1. WHEN Top_Tab_Bar가 렌더링될 때, THE Top_Tab_Bar SHALL 공통 Menu_Group의 Tab으로 "대시보드", "SBF 마스터"를 왼쪽에서 오른쪽 순서로 표시한다
2. WHEN Top_Tab_Bar가 렌더링될 때, THE Top_Tab_Bar SHALL 변경요청자 Menu_Group의 Tab으로 "변경요청", "내 요청"을 왼쪽에서 오른쪽 순서로 표시한다
3. WHEN Top_Tab_Bar가 렌더링될 때, THE Top_Tab_Bar SHALL 검토자/관리자 Menu_Group의 Tab으로 "처리 업무", "변경이력", "데이터 가져오기", "배포관리"를 왼쪽에서 오른쪽 순서로 표시한다
4. WHEN Top_Tab_Bar가 렌더링될 때, THE Top_Tab_Bar SHALL "SBF 탐색기", "1Depth검토", "2Depth검토", "D3-L3 매칭"에 해당하는 원본 이미지 전용 메뉴를 어떤 Menu_Group의 Tab으로도 표시하지 않는다
5. WHEN Top_Tab_Bar가 렌더링될 때, THE Top_Tab_Bar SHALL 인접한 Menu_Group 사이에 Group_Divider를 하나씩 표시하여 공통, 변경요청자, 검토자/관리자 Menu_Group을 시각적으로 구분한다

### Requirement 3: 역할 기반 조건부 노출(방식 1)

**User Story:** 사용자로서, 내 역할에 해당하는 탭만 보고 싶다. 그래야 사용하지 않는 메뉴로 인한 혼란 없이 업무에 집중할 수 있다.

#### Acceptance Criteria

1. WHERE User_Role별 노출 대상 Menu_Group이 지정된 경우, THE Top_Tab_Bar SHALL 현재 User_Role에 허용된 Menu_Group에 속한 Tab만 표시하고 허용되지 않은 Menu_Group의 Tab은 표시하지 않는다
2. WHILE User_Role 권한 구분이 미구현되어 모든 역할 권한이 개방(open) 상태인 동안, THE Top_Tab_Bar SHALL 세 개 Menu_Group의 모든 Tab을 표시한다
3. THE SBF_Manager SHALL Menu_Group 단위로 각 User_Role의 노출 허용 여부를 지정하는 Tab 노출 규칙을 정의하며, 규칙에서 명시되지 않은 Menu_Group은 비노출로 처리한다
4. WHEN 현재 User_Role이 변경되면, THE Top_Tab_Bar SHALL 변경 후 1초 이내에 노출 규칙을 재평가하여 새 User_Role에 허용된 Menu_Group의 Tab만 표시하도록 갱신한다
5. IF 현재 User_Role이 정의되지 않았거나 알 수 없는 값이거나 허용된 Menu_Group이 하나도 없는 경우, THEN THE Top_Tab_Bar SHALL 어떠한 Tab도 표시하지 않고 사용 가능한 메뉴가 없음을 알리는 안내를 표시한다
6. IF 노출 규칙 적용 후 현재 Active_Tab이 비노출 대상 Menu_Group에 속하게 되는 경우, THEN THE Top_Tab_Bar SHALL 표시 중인 Tab 중 첫 번째 Tab을 Active_Tab으로 재선택하며, 표시 가능한 Tab이 없으면 Active_Tab을 선택하지 않는다

### Requirement 4: 역할 그룹별 시각적 그룹핑

**User Story:** 사용자로서, 전체 탭이 모두 노출되는 상황에서도 어떤 탭이 어느 역할 그룹에 속하는지 한눈에 구분하고 싶다. 그래야 탭이 뒤섞여 보이지 않고 원하는 메뉴를 빠르게 찾을 수 있다.

#### Acceptance Criteria

1. WHILE 둘 이상의 Menu_Group이 동시에 표시되는 동안, THE Top_Tab_Bar SHALL 인접한 두 Menu_Group 사이마다 정확히 하나의 Group_Divider를 표시한다
2. WHILE 둘 이상의 Menu_Group이 동시에 표시되는 동안, THE Top_Tab_Bar SHALL 각 Menu_Group에 속한 모든 Tab을 서로 인접하게(같은 Menu_Group의 Tab 사이에 다른 Menu_Group의 Tab이 배치되지 않도록) 연속 배치한다
3. IF 표시 대상 Menu_Group이 하나뿐이면, THEN THE Top_Tab_Bar SHALL Group_Divider를 표시하지 않는다
4. WHILE 둘 이상의 Menu_Group이 동시에 표시되는 동안, THE Top_Tab_Bar SHALL Menu_Group을 Menus_Data에 정의된 순서에 따라 항상 동일한 순서로 배치한다

### Requirement 5: 탭 선택과 뷰 전환

**User Story:** 사용자로서, 탭을 선택하면 해당 화면이 표시되기를 원한다. 그래야 기존과 동일하게 각 업무 화면으로 이동할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 매핑된 View가 존재하는 Tab을 선택하면, THE SBF_Manager SHALL 1초 이내에 해당 Tab에 매핑된 View를 표시한다
2. WHEN 사용자가 Tab을 선택하면, THE Top_Tab_Bar SHALL 선택된 Tab을 다른 모든 Tab과 시각적으로 구분되는 Active_Tab 상태로 표시한다
3. THE SBF_Manager SHALL 한 시점에 정확히 하나의 Tab만 Active_Tab으로 유지하고, 새 Tab이 Active_Tab이 되면 이전 Active_Tab의 활성 표시를 해제한다
4. WHEN 사용자가 이미 Active_Tab인 Tab을 다시 선택하면, THE SBF_Manager SHALL 현재 표시된 View를 변경 없이 유지한다
5. IF 사용자가 선택한 Tab에 매핑된 View가 존재하지 않으면, THEN THE SBF_Manager SHALL View 전환을 수행하지 않고 이전 View 및 Active_Tab 상태를 그대로 유지하며 매핑된 View가 없음을 나타내는 오류 표시를 제공한다
6. THE SBF_Manager SHALL 재구성 이후에도 현재 view 상태 문자열 비교 기반의 View 전환 판정 결과가 재구성 이전과 동일한 View를 표시하도록 유지한다

### Requirement 6: 'SBF 반영 작업' 진입 동작 유지

**User Story:** 검토자/관리자로서, 'SBF 반영 작업'이 별도 탭으로 노출되지 않더라도 기존과 동일하게 '처리 업무'를 통해 해당 작업에 진입하고 싶다. 그래야 재구성 이후에도 업무 흐름이 끊기지 않는다.

#### Acceptance Criteria

1. THE Top_Tab_Bar SHALL 'SBF 반영 작업'을 독립 Tab으로 표시하지 않으며, Top_Tab_Bar에 노출되는 Tab 목록에 'SBF 반영 작업' 항목이 포함되지 않는다
2. WHEN 사용자가 '처리 업무' Tab을 통해 SBF 반영 작업 흐름에 진입하면, THE SBF_Manager SHALL 독립 Tab 제거 이전과 동일한 SBF 반영 작업 화면(동일한 항목, 입력 필드, 실행 가능한 동작)을 표시한다
3. WHEN 사용자가 SBF 반영 작업을 완료하면, THE SBF_Manager SHALL 사용자를 '처리 업무' View로 복귀시키고 해당 View를 Active_Tab으로 표시한다
4. IF '처리 업무' Tab을 통한 SBF 반영 작업 흐름 진입이 실패하면, THEN THE SBF_Manager SHALL 진입 실패를 알리는 오류 메시지를 표시하고 사용자를 '처리 업무' View에 유지하며 작업 데이터를 변경하지 않는다
