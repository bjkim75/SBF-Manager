// Feature: horizontal-tab-navigation
// 역할 변경 후 Active_Tab 재선택 순수 함수 (reselectActiveTab).
// 이전 Active_Tab(또는 이전 activeView 식별자)과 새 노출 결과(VisibleGroup[] 또는
// 노출 Tab 집합)를 입력받아 다음 규칙으로 재선택한다. 부수효과 없음. (Req 3.6)
//   - 이전 Active_Tab이 여전히 노출되면 유지한다.
//   - 비노출이면 표시 Tab 중 첫 번째로 재선택한다.
//   - 표시 Tab이 없으면 미선택(undefined)을 반환한다.

import type { Tab, VisibleGroup } from './types';
import { resolveActiveTab } from './resolveActiveTab';

/**
 * 노출 Tab 집합 또는 노출 계산 결과(VisibleGroup[])를 단일 Tab 시퀀스로 평탄화한다.
 * VisibleGroup[] 여부는 각 원소가 `tabs` 배열을 가지는지로 판정한다.
 * (resolveActiveTab의 내부 판정과 동일한 규칙을 따른다.)
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
 * 이전 Active_Tab의 View 식별자를 추출한다.
 * - Tab 객체가 주어지면 `viewId`를 사용한다.
 * - 문자열(이전 activeView 식별자)이 주어지면 그대로 사용한다.
 * - null/undefined면 undefined를 반환한다(이전 선택 없음).
 */
function toPreviousViewId(
  previous: Tab | string | null | undefined,
): string | undefined {
  if (previous == null) {
    return undefined;
  }
  if (typeof previous === 'string') {
    return previous;
  }
  return previous.viewId;
}

/**
 * 역할 변경(또는 노출 규칙 재평가) 후 Active_Tab을 재선택한다. (Req 3.6)
 *
 * - `newExposure`는 새 노출 계산 결과(`VisibleGroup[]`) 또는 노출 Tab 집합(`Tab[]`)을 받는다.
 * - `previousActive`는 이전 Active_Tab(`Tab`) 또는 이전 activeView 식별자(`string`)를 받는다.
 *
 * 판정:
 * 1. 이전 Active_Tab의 View 식별자가 새 노출 Tab 중에 여전히 존재하면 그 Tab을 유지한다.
 * 2. 존재하지 않으면(비노출) 표시 Tab 중 첫 번째 Tab으로 재선택한다.
 * 3. 표시 Tab이 하나도 없으면 undefined(미선택)를 반환한다.
 *
 * 반환하는 Tab은 항상 새 노출 Tab 집합에 포함된 인스턴스다(표시 Tab이 있는 경우).
 * 부수효과 없는 순수 함수다.
 */
export function reselectActiveTab(
  newExposure: readonly Tab[] | readonly VisibleGroup[],
  previousActive: Tab | string | null | undefined,
): Tab | undefined {
  const visibleTabs = toVisibleTabs(newExposure);

  // 표시 Tab이 하나도 없으면 미선택. (Req 3.6)
  if (visibleTabs.length === 0) {
    return undefined;
  }

  // 이전 Active_Tab이 여전히 노출되면 유지한다. (Req 3.6)
  const previousViewId = toPreviousViewId(previousActive);
  if (previousViewId != null) {
    const stillVisible = resolveActiveTab(visibleTabs, previousViewId);
    if (stillVisible) {
      return stillVisible;
    }
  }

  // 비노출이면 표시 Tab 중 첫 번째로 재선택한다. (Req 3.6)
  return visibleTabs[0];
}
