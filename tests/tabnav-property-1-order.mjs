// Feature: horizontal-tab-navigation, Property 1: Menus_Data 순서 보존
// 임의의 Menus_Data와 임의의 User_Role에 대해, 노출 계산 결과의 Menu_Group 배치 순서와
// 각 그룹 내 Tab 배치 순서는 항상 Menus_Data 정의 순서의 부분수열이어야 한다.
// Validates: Requirements 1.4, 4.4

import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

// computeVisibleGroups.ts 는 './types' 에서 타입만(import type) 참조하므로
// Node 의 type stripping (--experimental-strip-types) 으로 직접 import 가능하다.
// 런타임 의존성(@/app/data 등)이 없어 별도 빌드 산출물 없이 순수 함수를 그대로 호출한다.
const { computeVisibleGroups } = await import('../app/tabnav/computeVisibleGroups.ts');

const NUM_RUNS = 200; // 최소 100회 이상 반복

/**
 * a 가 b 의 부분수열(subsequence)인지 판정한다.
 * (a 의 원소들이 b 안에서 상대적 순서를 유지하며 순서대로 등장하는지)
 */
function isSubsequence(a, b) {
  let i = 0;
  for (let j = 0; j < b.length && i < a.length; j++) {
    if (b[j] === a[i]) i++;
  }
  return i === a.length;
}

// 하나의 Tab 을 생성하는 arbitrary. viewId 는 현재 항등(label 과 동일).
const tabArb = fc.record({
  label: fc.string({ minLength: 1, maxLength: 8 }),
  viewId: fc.string({ minLength: 1, maxLength: 8 }),
  order: fc.integer({ min: 0, max: 20 }),
});

// 하나의 Menu_Group 을 생성하는 arbitrary. groupLabel 은 고유하게 만들기 위해
// 인덱스 접두어를 붙인다(아래 menusDataArb 에서 처리).
const groupTabsArb = fc.array(tabArb, { minLength: 0, maxLength: 5 });

// Menus_Data(Menu_Group[]) 생성기: 그룹 라벨을 인덱스로 유일화하여
// 필터링/부분수열 판정이 라벨 충돌 없이 성립하도록 한다.
const menusDataArb = fc
  .array(
    fc.record({
      groupLabelBase: fc.string({ minLength: 0, maxLength: 6 }),
      tabs: groupTabsArb,
    }),
    { minLength: 0, maxLength: 6 },
  )
  .map((groups) =>
    groups.map((g, gi) => ({
      groupLabel: `G${gi}:${g.groupLabelBase}`,
      order: gi,
      tabs: g.tabs.map((t, ti) => ({ label: t.label, viewId: t.viewId, order: ti })),
    })),
  );

test('Feature: horizontal-tab-navigation, Property 1 — computeVisibleGroups는 Menus_Data 정의 순서의 부분수열을 유지한다', () => {
  fc.assert(
    fc.property(
      menusDataArb,
      // 규칙과 현재 역할을 무작위 생성한다.
      fc.record({
        // 임의의 역할 문자열
        role: fc.string({ minLength: 1, maxLength: 6 }),
        // 임의로 허용할 그룹 인덱스 부분집합(존재하는 그룹 라벨을 선택하기 위해 인덱스 사용)
        allowedIndexes: fc.array(fc.integer({ min: 0, max: 5 }), { maxLength: 6 }),
      }),
      // 현재 역할: 규칙의 역할과 일치할 수도, 미매칭일 수도, null 일 수도 있게 한다.
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.string({ minLength: 0, maxLength: 6 }),
      ),
      (menusData, ruleSpec, currentRole) => {
        // 존재하는 그룹 라벨 목록
        const groupLabels = menusData.map((g) => g.groupLabel);
        const allowedGroups = ruleSpec.allowedIndexes
          .filter((i) => i < groupLabels.length)
          .map((i) => groupLabels[i]);

        const rules = [{ role: ruleSpec.role, allowedGroups }];

        // 현재 역할 후보: 규칙 역할과 같게도 만들어 노출이 실제로 발생하는 경우를 포함
        const effectiveRole =
          currentRole === 'MATCH' ? ruleSpec.role : currentRole;

        const result = computeVisibleGroups(menusData, rules, effectiveRole);

        // 1) 결과 그룹 배치 순서가 Menus_Data 그룹 순서의 부분수열인지
        const resultGroupLabels = result.map((g) => g.groupLabel);
        assert.ok(
          isSubsequence(resultGroupLabels, groupLabels),
          `그룹 순서가 부분수열이 아님: 결과=${JSON.stringify(resultGroupLabels)} 정의=${JSON.stringify(groupLabels)}`,
        );

        // 2) 각 결과 그룹 내 Tab 순서가 해당 정의 그룹의 Tab 순서의 부분수열인지
        for (const rg of result) {
          const defGroup = menusData.find((g) => g.groupLabel === rg.groupLabel);
          assert.ok(defGroup, `결과 그룹이 정의에 없음: ${rg.groupLabel}`);
          const resultTabLabels = rg.tabs.map((t) => t.label);
          const defTabLabels = defGroup.tabs.map((t) => t.label);
          assert.ok(
            isSubsequence(resultTabLabels, defTabLabels),
            `탭 순서가 부분수열이 아님(${rg.groupLabel}): 결과=${JSON.stringify(resultTabLabels)} 정의=${JSON.stringify(defTabLabels)}`,
          );
        }
      },
    ),
    { numRuns: NUM_RUNS },
  );
});

// 추가로 현재 역할이 규칙과 일치하여 실제 노출이 발생하는 경우를 별도 실행하여
// 부분수열 판정이 "빈 결과"만으로 통과되지 않도록 커버리지를 보강한다.
test('Feature: horizontal-tab-navigation, Property 1 — 전체 그룹 노출 시에도 정의 순서를 그대로 유지한다', () => {
  fc.assert(
    fc.property(menusDataArb, (menusData) => {
      const groupLabels = menusData.map((g) => g.groupLabel);
      const rules = [{ role: 'open', allowedGroups: groupLabels }];
      const result = computeVisibleGroups(menusData, rules, 'open');

      // 모든 그룹이 허용되었으므로 결과 그룹 순서는 정의 순서와 완전히 동일해야 한다(부분수열의 특수 케이스).
      assert.deepEqual(
        result.map((g) => g.groupLabel),
        groupLabels,
      );
      for (const rg of result) {
        const defGroup = menusData.find((g) => g.groupLabel === rg.groupLabel);
        assert.deepEqual(
          rg.tabs.map((t) => t.label),
          defGroup.tabs.map((t) => t.label),
        );
      }
    }),
    { numRuns: NUM_RUNS },
  );
});
