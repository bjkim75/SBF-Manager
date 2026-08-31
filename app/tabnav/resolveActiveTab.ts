// Feature: horizontal-tab-navigation
// Active_Tab 판정 순수 함수.
// 노출 Tab 집합(또는 VisibleGroup[])과 현재 View 식별자를 입력받아
// 현재 View에 매핑되는 노출 Tab이 있으면 정확히 1개를 Active_Tab으로 반환하고,
// 없으면 미선택(undefined)을 반환한다. (Req 5.2, 5.3)

import type { Tab, VisibleGroup } from './types';

/**
 * 노출 Tab 집합 또는 노출 계산 결과(VisibleGroup[])를 단일 Tab 시퀀스로 평탄화한다.
 * VisibleGroup[] 여부는 각 원소가 `tabs` 배열을 가지는지로 판정한다.
 */
function toVisibleTabs(source: readonly Tab[] | readonly VisibleGroup[]): Tab[] {
  const tabs: Tab[] = [];
  for (const item of source) {
    if (item && Array.isArray((item as VisibleGroup).tabs)) {
      tabs.push(...(item as VisibleGroup).tabs);
    } else {
      tabs.push(item as Tab);
    }
  }
  return tabs;
}

/**
 * 현재 View 식별자에 매핑되는 노출 Tab을 Active_Tab으로 판정한다.
 *
 * - 노출 Tab 집합(`Tab[]`) 또는 노출 계산 결과(`VisibleGroup[]`)를 모두 입력으로 받는다.
 * - 현재 View(`activeView`)의 `viewId`와 일치하는 노출 Tab이 존재하면 그 중 첫 번째 하나만
 *   Active_Tab으로 반환한다. (동일 View에 매핑되는 노출 Tab은 유일하다는 전제이며,
 *   중복이 있어도 정확히 1개만 선택하여 Active_Tab 유일성을 보장한다. Req 5.3)
 * - 매핑되는 노출 Tab이 없거나 `activeView`가 비어 있으면(0개) undefined를 반환한다.
 *
 * 부수효과 없는 순수 함수다.
 */
export function resolveActiveTab(
  source: readonly Tab[] | readonly VisibleGroup[],
  activeView: string | null | undefined,
): Tab | undefined {
  if (activeView == null) {
    return undefined;
  }
  const tabs = toVisibleTabs(source);
  return tabs.find((tab) => tab.viewId === activeView);
}
