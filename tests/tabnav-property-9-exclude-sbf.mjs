// Feature: horizontal-tab-navigation, Property 9
// Property 9: 'SBF 반영 작업' 상시 제외
// 임의의 Menus_Data(open 규칙 포함)와 임의의 User_Role에 대해, 노출 계산 결과의
// 어떤 Tab 목록에도 'SBF 반영 작업' 라벨의 Tab이 포함되지 않아야 한다.
// Validates: Requirements 6.1
//
// Runner: node --test --experimental-strip-types --import ./tests/alias-register.mjs
// (alias-register.mjs registers the "@/" path-alias resolver so app/tabnav TS imports work)

import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import { computeVisibleGroups } from '../app/tabnav/computeVisibleGroups.ts';
import {
  deriveMenuGroups,
  openExposureRule,
  OPEN_ROLE,
  EXCLUDED_TAB_LABELS,
} from '../app/tabnav/adapter.ts';

const SBF_APPLY = 'SBF 반영 작업';

// Sanity: the excluded label the property guards against is the one the adapter excludes.
assert.ok(EXCLUDED_TAB_LABELS.includes(SBF_APPLY), 'adapter must exclude SBF 반영 작업');

// Arbitrary tab label: some ordinary labels plus the excluded label, so generated
// Menus_Data intentionally contains 'SBF 반영 작업' in varied positions.
const tabLabelArb = fc.oneof(
  { weight: 3, arbitrary: fc.string({ minLength: 1, maxLength: 12 }) },
  { weight: 3, arbitrary: fc.constantFrom('대시보드', 'SBF 마스터', '변경요청', '내 요청', '처리 업무', '변경이력', '배포관리') },
  { weight: 2, arbitrary: fc.constant(SBF_APPLY) }
);

// A single group tuple: [groupLabel, tabLabels[]] matching app/data.ts `menus` shape.
const groupArb = fc.tuple(
  fc.string({ minLength: 1, maxLength: 16 }),
  fc.array(tabLabelArb, { minLength: 0, maxLength: 8 })
);

// Arbitrary raw Menus_Data. Ensure at least one group so the pipeline has work to do,
// and inject 'SBF 반영 작업' into a guaranteed position to avoid vacuous passes.
const menusDataArb = fc
  .array(groupArb, { minLength: 1, maxLength: 5 })
  .map((groups) => {
    // Force the excluded label into the first group's tab list at a random-ish spot.
    const [label, tabs] = groups[0];
    const injected = [SBF_APPLY, ...tabs, SBF_APPLY];
    return [[label, injected], ...groups.slice(1)];
  });

// Arbitrary role: the real open role (exposes groups), random strings, and null/undefined.
const roleArb = fc.oneof(
  { weight: 4, arbitrary: fc.constant(OPEN_ROLE) },
  { weight: 2, arbitrary: fc.string({ maxLength: 10 }) },
  { weight: 1, arbitrary: fc.constantFrom(null, undefined) }
);

test('Property 9: SBF 반영 작업 is never present in computeVisibleGroups output', () => {
  fc.assert(
    fc.property(menusDataArb, roleArb, (rawMenus, role) => {
      // Real derivation (the excluder under test) + real exposure rule for the generated data.
      const groups = deriveMenuGroups(rawMenus);
      const rules = [openExposureRule(rawMenus)];

      const visible = computeVisibleGroups(groups, rules, role);

      for (const group of visible) {
        for (const tab of group.tabs) {
          assert.notStrictEqual(
            tab.label,
            SBF_APPLY,
            `'${SBF_APPLY}' must never appear as a visible tab (group: ${group.groupLabel})`
          );
        }
      }
    }),
    { numRuns: 200 }
  );
});
