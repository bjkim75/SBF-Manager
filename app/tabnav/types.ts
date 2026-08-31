// Feature: horizontal-tab-navigation
// 계산 계층 데이터 모델 타입 정의 (설계 Data Models 표 기준)

/**
 * Top_Tab_Bar에 표시되는 단일 Tab.
 * - label: Menus_Data의 탭 라벨 값
 * - viewId: 선택 시 전환할 View 식별자(`view` 상태 값). 현재는 label과 동일(항등)
 * - order: 그룹 내 정렬 순서. Menus_Data 배열 순서에서 파생
 */
export type Tab = {
  label: string;
  viewId: string;
  order: number;
};

/**
 * Menu_Group. Menus_Data의 그룹 단위.
 * - groupLabel: 그룹 라벨('공통 메뉴' / '변경요청자 메뉴' / '검토자/관리자 메뉴')
 * - order: 그룹 간 정렬 순서. Menus_Data 배열 순서에서 파생
 * - tabs: 그룹에 속한 Tab 목록('SBF 반영 작업' 제외)
 */
export type Menu_Group = {
  groupLabel: string;
  order: number;
  tabs: Tab[];
};

/**
 * 역할 기반 노출 규칙.
 * - role: User_Role 식별자. 현재 미구현 상태에서는 open 단일 규칙
 * - allowedGroups: 해당 역할에 노출 허용되는 groupLabel 목록.
 *   명시되지 않은 그룹은 비노출로 처리한다. (Req 3.3)
 */
export type Role_Exposure_Rule = {
  role: string;
  allowedGroups: string[];
};

/**
 * 노출 계산 결과.
 * - groupLabel: 노출되는 그룹 라벨
 * - tabs: 노출되는 Tab 목록(그룹 내 순서 유지)
 */
export type VisibleGroup = {
  groupLabel: string;
  tabs: Tab[];
};
