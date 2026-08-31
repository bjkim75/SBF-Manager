// Feature: horizontal-tab-navigation, Property 5: Active_Tab 유일성 —
// 임의의 노출 Tab 집합과 임의의 현재 View 식별자에 대해, Active_Tab으로 판정되는
// 노출 Tab의 개수는 해당 View에 매핑되는 노출 Tab이 존재하면 정확히 1개,
// 존재하지 않으면 0개여야 한다.
// Validates: Requirements 5.2, 5.3

import assert from "node:assert/strict";
import test from "node:test";
import fc from "fast-check";

import { resolveActiveTab } from "../app/tabnav/resolveActiveTab.ts";

// 임의의 Tab 생성기. viewId는 좁은 후보 집합에서 뽑아
// activeView와의 매핑/중복 매핑이 충분히 자주 발생하도록 한다.
const viewIdArb = fc.constantFrom(
  "대시보드",
  "SBF 마스터",
  "변경요청",
  "내 요청",
  "처리 업무",
  "변경이력",
  "데이터 가져오기",
  "배포관리",
);

const tabArb = fc.record({
  label: fc.string(),
  viewId: viewIdArb,
  order: fc.integer({ min: 0, max: 20 }),
});

// 노출 Tab 집합(중복 viewId 허용). 빈 배열 포함.
const tabsArb = fc.array(tabArb, { minLength: 0, maxLength: 12 });

// activeView 후보: 매핑 후보 + 매핑되지 않는 값 + null/undefined
const activeViewArb = fc.oneof(
  viewIdArb,
  fc.constant("존재하지_않는_View"),
  fc.constant(null),
  fc.constant(undefined),
);

test("Feature: horizontal-tab-navigation, Property 5: Active_Tab 유일성", () => {
  fc.assert(
    fc.property(tabsArb, activeViewArb, (tabs, activeView) => {
      const result = resolveActiveTab(tabs, activeView);

      // 판정 개수: undefined면 0개, Tab이면 1개
      const activeCount = result === undefined ? 0 : 1;

      // 현재 View에 매핑되는 노출 Tab의 존재 여부
      const hasMatch =
        activeView != null && tabs.some((t) => t.viewId === activeView);

      if (hasMatch) {
        // 매핑되는 노출 Tab이 존재하면 정확히 1개 (중복 viewId여도 1개)
        assert.equal(activeCount, 1);
        // 반환된 Tab은 실제로 activeView에 매핑되어야 하고 노출 집합에 포함되어야 한다
        assert.equal(result.viewId, activeView);
        assert.ok(tabs.includes(result));
      } else {
        // 매핑되는 노출 Tab이 없으면 0개
        assert.equal(activeCount, 0);
      }
    }),
    { numRuns: 200 },
  );
});

// VisibleGroup[] 형태 입력에서도 동일한 유일성 속성이 성립하는지 검증한다.
const visibleGroupsArb = fc.array(
  fc.record({
    groupLabel: fc.string(),
    tabs: fc.array(tabArb, { minLength: 0, maxLength: 5 }),
  }),
  { minLength: 0, maxLength: 4 },
);

test("Feature: horizontal-tab-navigation, Property 5: Active_Tab 유일성 (VisibleGroup[])", () => {
  fc.assert(
    fc.property(visibleGroupsArb, activeViewArb, (groups, activeView) => {
      const result = resolveActiveTab(groups, activeView);
      const activeCount = result === undefined ? 0 : 1;

      const flatTabs = groups.flatMap((g) => g.tabs);
      const hasMatch =
        activeView != null && flatTabs.some((t) => t.viewId === activeView);

      if (hasMatch) {
        assert.equal(activeCount, 1);
        assert.equal(result.viewId, activeView);
      } else {
        assert.equal(activeCount, 0);
      }
    }),
    { numRuns: 200 },
  );
});
