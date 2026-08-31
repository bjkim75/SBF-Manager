// Feature: horizontal-tab-navigation
// 탭 노출 계산 순수 함수 (computeVisibleGroups).
// 현재 User_Role, Menus_Data(Menu_Group[]), Role_Exposure_Rule(들)을 입력받아
// 노출 대상 Menu_Group과 각 그룹의 Tab 목록/순서를 계산한다. 부수효과 없음.

import type { Menu_Group, Role_Exposure_Rule, VisibleGroup } from './types';

/**
 * 현재 역할과 노출 규칙, Menus_Data를 기반으로 노출 대상 그룹/탭을 계산한다.
 *
 * 규칙 (설계 "탭 노출 계산 (computeVisibleGroups)" 절 기준):
 * - Role_Exposure_Rule에서 현재 역할에 허용된 Menu_Group만 남긴다.
 *   규칙에 명시되지 않은 그룹은 비노출로 처리한다. (Req 3.1, 3.3)
 * - 노출 그룹의 순서는 항상 Menus_Data 정의 순서를 따른다. (Req 1.4, 4.4)
 * - 각 그룹 내 Tab 순서도 Menus_Data(어댑터 파생) 순서를 그대로 유지한다.
 * - 'SBF 반영 작업'은 어댑터(deriveMenuGroups)에서 이미 제외되므로 그 정의를 신뢰한다. (Req 6.1)
 * - 현재 역할이 미정의/알 수 없는 값이거나, 허용 그룹이 하나도 없으면 빈 목록을 반환한다. (Req 3.5)
 *
 * open 상태(권한 미구현)는 별도 분기가 아니라 데이터로 표현된다. openExposureRule이
 * open 역할에 세 그룹 전체를 허용하므로, currentRole === OPEN_ROLE일 때 세 그룹이 모두
 * 노출된다. (Req 3.2)
 *
 * @param menusData Menus_Data에서 파생한 그룹/탭 정의(어댑터 deriveMenuGroups 결과)
 * @param rules 역할별 노출 규칙 집합
 * @param currentRole 현재 User_Role 식별자. undefined/null/미매칭이면 빈 목록 반환
 * @returns 노출 대상 VisibleGroup[] (Menus_Data 정의 순서 유지)
 */
export function computeVisibleGroups(
  menusData: Menu_Group[],
  rules: Role_Exposure_Rule[],
  currentRole: string | null | undefined
): VisibleGroup[] {
  // 역할 미정의/알 수 없음: 어떤 그룹도 노출하지 않는다. (Req 3.5)
  if (currentRole == null) {
    return [];
  }

  // 현재 역할에 해당하는 규칙을 찾는다. 규칙이 없으면(알 수 없는 역할) 빈 목록. (Req 3.5)
  const rule = rules.find((r) => r.role === currentRole);
  if (!rule) {
    return [];
  }

  // 허용 그룹 라벨 집합. 규칙에 명시되지 않은 그룹은 비노출. (Req 3.3)
  const allowed = new Set(rule.allowedGroups);

  // Menus_Data 정의 순서를 유지하면서 허용 그룹만 남긴다. (Req 1.4, 4.4)
  // 어댑터가 'SBF 반영 작업'을 이미 제외했으므로 tabs 정의를 그대로 신뢰한다. (Req 6.1)
  const visible: VisibleGroup[] = menusData
    .filter((group) => allowed.has(group.groupLabel))
    .map((group) => ({
      groupLabel: group.groupLabel,
      tabs: group.tabs.map((tab) => ({ ...tab })),
    }));

  return visible;
}
