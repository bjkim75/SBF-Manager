// Feature: horizontal-tab-navigation
// Group_Divider 삽입 계산 및 렌더 순서 산출 순수 함수 (buildRenderSequence).
// 노출 계산 결과(VisibleGroup[])를 입력받아 렌더 순서의 항목 시퀀스(탭/구분자)를 산출한다.
// 부수효과 없음(pure).
// Requirements: 4.1, 4.2, 4.3
//   - Property 3: 그룹 인접 연속 배치 (같은 그룹 탭은 연속 구간 유지)
//   - Property 4: Group_Divider 개수 = max(0, N - 1)

import type { Tab, VisibleGroup } from './types';

/**
 * 렌더 순서의 개별 항목(판별 유니온).
 * - kind='tab': 표시할 Tab 항목. 소속 그룹 라벨(groupLabel)을 함께 담아 표현 계층에서
 *   그룹 구분/스타일에 활용할 수 있게 한다.
 * - kind='divider': 인접한 두 Menu_Group 사이에 삽입되는 Group_Divider.
 *   구분자가 나누는 앞 그룹(beforeGroupLabel)과 뒤 그룹(afterGroupLabel) 라벨을 참고용으로 담는다.
 */
export type RenderItem =
  | { kind: 'tab'; tab: Tab; groupLabel: string }
  | { kind: 'divider'; beforeGroupLabel: string; afterGroupLabel: string };

/**
 * 노출 계산 결과(VisibleGroup[])를 렌더 순서의 항목 시퀀스로 산출한다.
 *
 * 규칙 (설계 "Top_Tab_Bar 렌더 규칙" 및 Requirement 4 기준):
 * - 그룹 순서대로 각 그룹의 Tab을 왼쪽→오른쪽 순서로 연속 배치한다. 같은 그룹의 Tab 사이에는
 *   다른 그룹의 Tab이나 Group_Divider가 끼지 않는다. (Req 4.2, Property 3)
 * - 노출 Menu_Group 수가 N일 때 인접 그룹 사이마다 정확히 하나의 Group_Divider를 삽입한다.
 *   즉 삽입되는 Group_Divider 개수는 항상 max(0, N - 1)이다. (Req 4.1, 4.3, Property 4)
 * - 표시 그룹이 하나뿐이거나 0개면 Group_Divider를 삽입하지 않는다. (Req 4.3)
 *
 * 주의: "인접 그룹 사이"는 두 그룹이 실제로 렌더 시퀀스에서 이웃할 때 그 경계를 뜻한다.
 * 그룹의 Tab 목록이 비어 있어도 그룹 자체는 노출 대상이므로 그룹 경계로 취급하여
 * Group_Divider를 삽입한다(그룹 수 N 기준으로 max(0, N - 1)개 보장).
 *
 * 부수효과 없음(pure). 입력 VisibleGroup[]/Tab을 변형하지 않으며 새 배열/객체를 반환한다.
 *
 * @param visibleGroups 노출 계산 결과. Menus_Data 정의 순서가 유지된 상태로 전달된다.
 * @returns 렌더 순서의 판별 유니온 시퀀스(탭/구분자)
 */
export function buildRenderSequence(
  visibleGroups: readonly VisibleGroup[]
): RenderItem[] {
  const items: RenderItem[] = [];

  for (let i = 0; i < visibleGroups.length; i++) {
    const group = visibleGroups[i];

    // 이전 그룹과의 경계마다 정확히 하나의 Group_Divider를 삽입한다.
    // 첫 그룹(i === 0) 앞에는 삽입하지 않으므로 총 삽입 수는 max(0, N - 1)이 된다. (Req 4.1, 4.3)
    if (i > 0) {
      items.push({
        kind: 'divider',
        beforeGroupLabel: visibleGroups[i - 1].groupLabel,
        afterGroupLabel: group.groupLabel,
      });
    }

    // 같은 그룹의 Tab을 연속으로 배치한다(그룹 내 순서 유지). (Req 4.2)
    for (const tab of group.tabs) {
      items.push({ kind: 'tab', tab: { ...tab }, groupLabel: group.groupLabel });
    }
  }

  return items;
}
