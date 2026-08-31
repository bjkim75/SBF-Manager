// Feature: horizontal-tab-navigation, Property 4: Group_Divider 개수 —
// 노출 Menu_Group 수가 N일 때, 인접 그룹 사이에 삽입되는 Group_Divider의 개수는
// 항상 정확히 max(0, N - 1)이어야 한다 (그룹 1개 시 0개 포함).
// Validates: Requirements 4.1, 4.3
import assert from "node:assert/strict";
import test from "node:test";
import fc from "fast-check";
import { buildRenderSequence } from "../app/tabnav/renderSequence.ts";

// 임의의 VisibleGroup[] 생성기.
// 그룹 라벨은 인덱스 접미사로 유일하게 부여하고,
// 각 그룹의 tabs는 0개 이상(빈 그룹 경계 포함)으로 생성한다.
// 그룹 수는 0개(빈 목록)와 1개(구분자 0개) 경계를 포함하도록 minLength=0 부터 생성한다.
const tabArb = fc.record({
  label: fc.string(),
  viewId: fc.string(),
  order: fc.integer(),
});

const visibleGroupsArb = fc
  .array(
    fc.record({
      groupLabel: fc.string(),
      tabs: fc.array(tabArb, { maxLength: 6 }),
    }),
    { maxLength: 6 }
  )
  .map((groups) =>
    groups.map((g, i) => ({ groupLabel: `${g.groupLabel}#${i}`, tabs: g.tabs }))
  );

test("Feature: horizontal-tab-navigation, Property 4 — Group_Divider 개수는 max(0, N - 1)", () => {
  fc.assert(
    fc.property(visibleGroupsArb, (visibleGroups) => {
      const items = buildRenderSequence(visibleGroups);

      const dividerCount = items.filter((it) => it.kind === "divider").length;
      const n = visibleGroups.length;
      const expected = Math.max(0, n - 1);

      assert.equal(
        dividerCount,
        expected,
        `노출 그룹 수 N=${n} 일 때 구분자 수는 ${expected} 이어야 하나 ${dividerCount} 개가 삽입됨`
      );
    }),
    { numRuns: 200 }
  );
});
