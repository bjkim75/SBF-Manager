// Feature: horizontal-tab-navigation
// Tab → View 매핑 순수 함수 (설계 "Tab → View 매핑 (resolveViewForTab)" 절 기준)
// Requirements: 5.1, 5.5, 5.6 / Property 8: Tab → View 매핑 등가성

import type { Tab } from './types';

/**
 * resolveViewForTab의 판별 결과.
 * - resolved=true: 매핑된 View 식별자(viewId)가 존재한다. → 해당 View로 전환한다. (Req 5.1)
 * - resolved=false: 매핑된 View가 없다. → View 전환을 수행하지 않는다(전환 미수행 신호). (Req 5.5)
 */
export type ResolveViewResult =
  | { resolved: true; viewId: string }
  | { resolved: false; viewId: undefined };

/**
 * Tab 라벨 또는 Tab을 기존 `view` 상태 문자열(View 식별자)로 매핑하는 순수 함수.
 *
 * - 현재 시스템에서 Tab 라벨과 View 식별자는 동일 문자열이므로 기본 매핑은 항등(identity)이다.
 *   (예: '대시보드' → view='대시보드'). 이로써 재구성 이전과 동일한 View 전환 판정 결과를 보장한다. (Req 5.6, Property 8)
 * - Tab 객체를 받는 경우 명시된 `viewId`를 우선 사용한다. viewId가 유효하면 그 값을 그대로 반환한다.
 * - 매핑 가능한 View 식별자가 없으면(빈 라벨/비어있는 viewId 등) resolved=false를 반환하여
 *   전환을 수행하지 않아야 함을 신호한다. (Req 5.5)
 *
 * 부수효과 없음(pure).
 *
 * @param tab Tab 객체 또는 Tab 라벨 문자열
 * @returns 매핑 결과. resolved=true이면 viewId가 전환 대상 View 식별자, resolved=false이면 전환 미수행.
 */
export function resolveViewForTab(tab: Tab | string): ResolveViewResult {
  // Tab 객체면 viewId를 우선 사용(명시 매핑), 문자열이면 라벨을 항등 매핑한다.
  const candidate = typeof tab === 'string' ? tab : tab.viewId;

  // View 식별자가 유효한 비어있지 않은 문자열이어야 전환 대상이 존재한다고 본다.
  if (typeof candidate === 'string' && candidate.length > 0) {
    return { resolved: true, viewId: candidate };
  }

  // 매핑된 View 식별자 부재 → 전환 미수행 신호.
  return { resolved: false, viewId: undefined };
}
