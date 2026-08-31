// Feature: horizontal-tab-navigation, Property 3: 그룹 인접 연속 배치 —
// 렌더 순서로 나열된 Tab 시퀀스를 각 Tab의 소속 Menu_Group으로 매핑하면
// 동일한 Menu_Group에 속한 Tab들은 항상 하나의 연속 구간을 이룬다
// (같은 그룹 Tab 사이에 다른 그룹 Tab이 배치되지 않는다).
// Validates: Requirements 4.2
import assert from "node:assert/strict";
import test from "node:test";
import fc from "fast-check";
import { buildRenderSequence } from "../app/tabnav/renderSequence.ts";

// 임의의 VisibleGroup[] 생성기.
// 그룹 라벨은 (같은 라벨 중복 방지를 위해) 인덱스 접미사로 유일하게 부여하고,
// 각 그룹의 tabs는 0개 이상(빈 그룹 경계 포함)으로 생성한다.
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
    // 라벨을 인덱스로 유일화하여 "소속 그룹" 매핑이 명확해지도록 한다.
    groups.map((g, i) => ({ groupLabel: `${g.groupLabel}#${i}`, tabs: g.tabs }))
  );

test("Feature: horizontal-tab-navigation, Property 3 — 동일 그룹 탭은 연속 구간을 이룬다", () => {
  fc.assert(
    fc.property(visibleGroupsArb, (visibleGroups) => {
      const items = buildRenderSequence(visibleGroups);

      // 렌더 순서에서 탭 항목만 추려 소속 그룹 라벨 시퀀스로 매핑한다.
      const groupSeq = items
        .filter((it) => it.kind === "tab")
        .map((it) => it.groupLabel);

      // 시퀀스에서 각 그룹 라벨이 나타나는 구간이 하나로 연속됨을 검증한다:
      // 이미 등장이 끝난 그룹 라벨이 다시 나타나면 연속 구간이 깨진 것.
      const seen = new Set();
      let prev = null;
      for (const label of groupSeq) {
        if (label !== prev) {
          assert.ok(
            !seen.has(label),
            `그룹 '${label}' 탭이 비연속으로 배치됨: ${JSON.stringify(groupSeq)}`
          );
          seen.add(label);
          prev = label;
        }
      }
    }),
    { numRuns: 200 }
  );
});
