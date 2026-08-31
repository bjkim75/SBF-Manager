// Feature: horizontal-tab-navigation, Property 2: 역할 기반 노출 정합성 —
// 임의의 Menus_Data, Role_Exposure_Rule, 현재 User_Role에 대해, 노출 계산 결과에
// 포함된 모든 Tab은 현재 역할에 허용된 Menu_Group에 속해야 하며, 허용되지 않았거나
// 규칙에 명시되지 않은 Menu_Group의 Tab은 결과에 하나도 포함되지 않아야 한다.
// (역할 변경 후 재평가 결과도 새 역할 기준으로 동일 속성을 만족한다.)
//
// Validates: Requirements 3.1, 3.3, 3.4
//
// 대상 순수 함수: app/tabnav/computeVisibleGroups.ts 의 computeVisibleGroups.
// 타입 전용 import만 갖는 모듈이므로 Node의 타입 스트리핑으로 직접 로드한다
// (barrel(index.ts)은 @/app/data 경로 별칭에 의존하므로 사용하지 않는다).

import test from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";

const { computeVisibleGroups } = await import(
  new URL("../app/tabnav/computeVisibleGroups.ts", import.meta.url)
);

const NUM_RUNS = 200; // 최소 100회 이상 반복 (설계 속성 테스트 구성 규칙)

// 임의의 Menu_Group[](Menus_Data 파생 형태)를 생성한다.
// - 그룹 라벨은 서로 겹치지 않게 유지하여 소속 판정을 명확히 한다.
// - 각 그룹은 0개 이상의 Tab을 가지며 order는 정의 순서에서 파생된다.
function menusDataArb() {
  return fc
    .uniqueArray(
      fc.string({ minLength: 1, maxLength: 12 }).filter((s) => s.trim().length > 0),
      { minLength: 0, maxLength: 6 }
    )
    .chain((groupLabels) =>
      fc.tuple(
        ...groupLabels.map((groupLabel, groupIndex) =>
          fc
            .array(
              fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
              { minLength: 0, maxLength: 5 }
            )
            .map((tabLabels) => ({
              groupLabel,
              order: groupIndex,
              tabs: tabLabels.map((label, tabIndex) => ({
                label,
                viewId: label,
                order: tabIndex,
              })),
            }))
        )
      )
    );
}

// 주어진 그룹 라벨 목록에서 임의의 부분집합을 allowedGroups로 갖는 역할 규칙 집합과
// 평가에 사용할 현재 역할을 함께 생성한다.
// - 규칙에 명시되지 않은 그룹은 비노출이어야 하므로, allowedGroups는 존재하는
//   그룹 라벨의 부분집합 또는 존재하지 않는 라벨을 섞어 생성한다.
function scenarioArb() {
  return menusDataArb().chain((menusData) => {
    const groupLabels = menusData.map((g) => g.groupLabel);
    // 규칙 후보 역할 이름
    const roleNameArb = fc.string({ minLength: 1, maxLength: 8 }).filter((s) => s.trim().length > 0);
    // allowedGroups: 존재하는 그룹의 부분집합 + 노이즈(존재하지 않는 라벨)
    const allowedArb =
      groupLabels.length === 0
        ? fc.constant([])
        : fc.subarray(groupLabels);
    const noiseArb = fc.array(fc.string({ minLength: 1, maxLength: 8 }), { maxLength: 3 });

    return fc
      .uniqueArray(roleNameArb, { minLength: 1, maxLength: 4 })
      .chain((roleNames) =>
        fc.tuple(
          ...roleNames.map((role) =>
            fc.tuple(allowedArb, noiseArb).map(([allowed, noise]) => ({
              role,
              allowedGroups: [...allowed, ...noise],
            }))
          )
        ).chain((rules) =>
          // 현재 역할: 규칙에 존재하는 역할 또는 미매칭/미정의 값도 섞는다.
          fc
            .oneof(
              fc.constantFrom(...rules.map((r) => r.role)),
              fc.string({ maxLength: 8 }),
              fc.constant(undefined),
              fc.constant(null)
            )
            .map((currentRole) => ({ menusData, rules, currentRole }))
        )
      );
  });
}

test("Feature: horizontal-tab-navigation, Property 2 — 역할 기반 노출 정합성", () => {
  fc.assert(
    fc.property(scenarioArb(), ({ menusData, rules, currentRole }) => {
      const result = computeVisibleGroups(menusData, rules, currentRole);

      const groupByLabel = new Map(menusData.map((g) => [g.groupLabel, g]));
      const rule = currentRole == null ? undefined : rules.find((r) => r.role === currentRole);
      const allowed = new Set(rule ? rule.allowedGroups : []);

      // 규칙 미매칭/미정의 역할이면 결과는 비어 있어야 한다. (Req 3.5 경계 포함)
      if (!rule) {
        assert.equal(result.length, 0);
        return;
      }

      // 결과의 모든 그룹은 허용 집합에 속해야 하고, 실제 Menus_Data에 존재해야 한다.
      for (const vg of result) {
        assert.ok(
          allowed.has(vg.groupLabel),
          `결과 그룹 '${vg.groupLabel}'이(가) 허용되지 않은 그룹임`
        );
        assert.ok(
          groupByLabel.has(vg.groupLabel),
          `결과 그룹 '${vg.groupLabel}'이(가) Menus_Data에 존재하지 않음`
        );
      }

      // 허용되지 않았거나 규칙에 명시되지 않은 그룹의 Tab은 결과에 하나도 없어야 한다.
      const resultGroupLabels = new Set(result.map((vg) => vg.groupLabel));
      for (const group of menusData) {
        if (!allowed.has(group.groupLabel)) {
          assert.ok(
            !resultGroupLabels.has(group.groupLabel),
            `비허용 그룹 '${group.groupLabel}'이(가) 결과에 포함됨`
          );
        }
      }

      // 결과에 포함된 모든 Tab은 자신이 속한 (허용된) 그룹의 정의된 Tab 집합에
      // 속해야 한다. 즉 다른 그룹의 Tab이 섞여 들어오지 않는다.
      for (const vg of result) {
        const src = groupByLabel.get(vg.groupLabel);
        const srcLabels = new Set(src.tabs.map((t) => t.label));
        for (const tab of vg.tabs) {
          assert.ok(
            srcLabels.has(tab.label),
            `Tab '${tab.label}'이(가) 그룹 '${vg.groupLabel}' 소속이 아님`
          );
        }
      }
    }),
    { numRuns: NUM_RUNS }
  );
});

test("Feature: horizontal-tab-navigation, Property 2 — 역할 변경 후 재평가 정합성 (Req 3.4)", () => {
  // 동일 Menus_Data/규칙에 대해 서로 다른 두 역할로 평가했을 때, 각 결과가 각자의
  // 역할 허용 그룹 기준으로 정합해야 한다(재평가는 새 역할 기준으로 동일 속성 만족).
  fc.assert(
    fc.property(
      menusDataArb().chain((menusData) => {
        const groupLabels = menusData.map((g) => g.groupLabel);
        const allowedArb = groupLabels.length === 0 ? fc.constant([]) : fc.subarray(groupLabels);
        return fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 6 }).filter((s) => s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 6 }).filter((s) => s.trim().length > 0),
            allowedArb,
            allowedArb
          )
          .filter(([roleA, roleB]) => roleA !== roleB)
          .map(([roleA, roleB, allowedA, allowedB]) => ({
            menusData,
            rules: [
              { role: roleA, allowedGroups: allowedA },
              { role: roleB, allowedGroups: allowedB },
            ],
            roleA,
            roleB,
          }));
      }),
      ({ menusData, rules, roleA, roleB }) => {
        const check = (role) => {
          const result = computeVisibleGroups(menusData, rules, role);
          const allowed = new Set(rules.find((r) => r.role === role).allowedGroups);
          for (const vg of result) {
            assert.ok(allowed.has(vg.groupLabel));
          }
          // 비허용 그룹은 결과에 없어야 함
          const labels = new Set(result.map((vg) => vg.groupLabel));
          for (const g of menusData) {
            if (!allowed.has(g.groupLabel)) {
              assert.ok(!labels.has(g.groupLabel));
            }
          }
        };
        check(roleA);
        check(roleB); // 역할 변경 후 재평가
      }
    ),
    { numRuns: NUM_RUNS }
  );
});
