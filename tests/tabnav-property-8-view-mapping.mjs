// Feature: horizontal-tab-navigation, Property 8: Tab → View 매핑 등가성
// 임의의 Tab에 대해, resolveViewForTab이 산출하는 View 식별자는 재구성 이전의
// View 전환 판정(매핑표 기준 항등)과 동일한 View 식별자와 일치해야 한다.
// (현재 매핑에서는 Tab 라벨과 View 식별자가 항등 관계이므로 항등 매핑이 성립한다.)
// Validates: Requirements 5.6
//
// resolveViewForTab.ts 는 './types' 에서 타입만(import type) 참조하므로 런타임 의존성이 없다.
// 따라서 Node 의 type stripping 으로 직접 import 하여 순수 함수를 그대로 호출한다.
//   node --experimental-strip-types --test tests/tabnav-property-8-view-mapping.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

const { resolveViewForTab } = await import('../app/tabnav/resolveViewForTab.ts');

const NUM_RUNS = 200; // 최소 100회 이상 반복

/**
 * 재구성 이전 View 전환 판정의 참조 구현(reference oracle).
 *
 * 재구성 이전에는 Tab 라벨을 그대로 `view` 상태 문자열로 사용하여 문자열 비교 체인으로
 * View 를 전환했다(예: '대시보드' 라벨 → view='대시보드'). 즉 라벨 == View 식별자(항등).
 * 유효한(비어있지 않은) 라벨/viewId 는 그 값 자체가 전환 대상 View 식별자이고,
 * 비어있으면 매핑 대상이 없어 전환을 수행하지 않는다.
 *
 * @param {string} candidate Tab 라벨 또는 viewId (실제 재구성 이전 view 상태 문자열)
 * @returns {{ resolved: true, viewId: string } | { resolved: false, viewId: undefined }}
 */
function referenceViewDecision(candidate) {
  if (typeof candidate === 'string' && candidate.length > 0) {
    return { resolved: true, viewId: candidate };
  }
  return { resolved: false, viewId: undefined };
}

// 매핑표(설계 Menu_Group ↔ Tab ↔ View 매핑표)의 실제 라벨들 — 항등 관계를 대표적으로 포함한다.
const MAPPING_TABLE_LABELS = [
  '대시보드',
  'SBF 마스터',
  '변경요청',
  '내 요청',
  '처리 업무',
  '변경이력',
  '데이터 가져오기',
  '배포관리',
  'SBF 반영 작업', // Tab 은 아니지만 view 식별자로는 항등이 성립하는 매핑표 항목
];

// 임의의 라벨/viewId 문자열. 매핑표 실제 라벨과 무작위 문자열, 빈 문자열(경계)을 섞는다.
const labelArb = fc.oneof(
  { weight: 4, arbitrary: fc.constantFrom(...MAPPING_TABLE_LABELS) },
  { weight: 4, arbitrary: fc.string({ minLength: 1, maxLength: 16 }) },
  { weight: 1, arbitrary: fc.constant('') }, // 빈 문자열 → 매핑 없음 경계
);

test('Feature: horizontal-tab-navigation, Property 8 — resolveViewForTab(문자열 라벨)은 재구성 이전 항등 매핑과 일치한다', () => {
  fc.assert(
    fc.property(labelArb, (label) => {
      const actual = resolveViewForTab(label);
      const expected = referenceViewDecision(label);
      assert.deepEqual(
        actual,
        expected,
        `라벨 매핑 불일치: label=${JSON.stringify(label)} actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`,
      );
    }),
    { numRuns: NUM_RUNS },
  );
});

test('Feature: horizontal-tab-navigation, Property 8 — resolveViewForTab(Tab 객체)의 viewId 매핑은 재구성 이전 판정과 일치한다', () => {
  const tabArb = fc.record({
    label: labelArb,
    // 현재 매핑은 항등이므로 viewId 는 label 과 동일한 분포에서 뽑되, 명시 매핑 경로도 함께 검증한다.
    viewId: labelArb,
    order: fc.integer({ min: 0, max: 20 }),
  });

  fc.assert(
    fc.property(tabArb, (tab) => {
      const actual = resolveViewForTab(tab);
      // resolveViewForTab 은 Tab 객체에 대해 명시 viewId 를 사용한다.
      const expected = referenceViewDecision(tab.viewId);
      assert.deepEqual(
        actual,
        expected,
        `Tab 매핑 불일치: tab=${JSON.stringify(tab)} actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`,
      );
    }),
    { numRuns: NUM_RUNS },
  );
});

test('Feature: horizontal-tab-navigation, Property 8 — 매핑표 라벨은 항등(label === viewId)으로 전환된다', () => {
  fc.assert(
    fc.property(fc.constantFrom(...MAPPING_TABLE_LABELS), (label) => {
      const result = resolveViewForTab(label);
      assert.equal(result.resolved, true, `매핑표 라벨은 항상 전환 가능해야 함: ${label}`);
      assert.equal(result.viewId, label, `매핑표 라벨은 항등 매핑이어야 함: ${label}`);
    }),
    { numRuns: NUM_RUNS },
  );
});
