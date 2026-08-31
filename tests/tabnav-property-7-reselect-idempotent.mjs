// Feature: horizontal-tab-navigation, Property 7: 재선택 멱등성
// 임의의 상태와 임의의 Tab에 대해, 같은 Tab을 두 번 연속 선택한 결과의 View 식별자는
// 한 번 선택한 결과의 View 식별자와 동일해야 한다.
// Validates: Requirements 5.4

import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

// resolveViewForTab.ts 는 './types' 에서 타입만(import type) 참조하므로
// Node 의 type stripping (--experimental-strip-types) 으로 직접 import 가능하다.
// 런타임 의존성이 없어 별도 빌드 산출물 없이 순수 함수를 그대로 호출한다.
const { resolveViewForTab } = await import('../app/tabnav/resolveViewForTab.ts');

const NUM_RUNS = 200; // 최소 100회 이상 반복

/**
 * "현재 View 상태"에서 특정 Tab을 선택한 뒤의 View 식별자를 계산한다.
 * - resolveViewForTab이 매핑 View를 산출하면(resolved=true) 그 View로 전환된다. (Req 5.1)
 * - 매핑 View가 없으면(resolved=false) 전환을 수행하지 않고 이전 View를 유지한다. (Req 5.5)
 * 이 함수는 "같은 Tab을 다시 선택해도(이미 Active_Tab이어도) View가 그대로 유지"되는지를
 * 검증하기 위한 선택(select) 동작의 순수 모델이다. (Req 5.4)
 */
function selectTab(currentView, tab) {
  const r = resolveViewForTab(tab);
  return r.resolved ? r.viewId : currentView;
}

// Tab 객체를 생성하는 arbitrary. viewId 는 현재 항등(label 과 동일 규칙) 이거나
// 빈 문자열(매핑 없음)일 수도 있게 하여 전환/미전환 두 경우를 모두 커버한다.
const tabArb = fc.record({
  label: fc.string({ minLength: 0, maxLength: 8 }),
  viewId: fc.string({ minLength: 0, maxLength: 8 }),
  order: fc.integer({ min: 0, max: 20 }),
});

// 선택 대상: Tab 객체 또는 라벨 문자열(빈 문자열 포함) 모두 허용한다.
const selectableArb = fc.oneof(tabArb, fc.string({ minLength: 0, maxLength: 8 }));

// 임의의 "현재 View 상태" 문자열.
const currentViewArb = fc.string({ minLength: 0, maxLength: 8 });

test('Feature: horizontal-tab-navigation, Property 7 — 같은 Tab을 두 번 연속 선택한 View 식별자는 한 번 선택 결과와 동일하다', () => {
  fc.assert(
    fc.property(currentViewArb, selectableArb, (currentView, tab) => {
      // 한 번 선택한 결과
      const once = selectTab(currentView, tab);
      // 같은 Tab을 두 번 연속 선택한 결과(첫 선택 결과 상태에서 다시 같은 Tab 선택)
      const twice = selectTab(once, tab);

      assert.equal(
        twice,
        once,
        `재선택 멱등성 위반: once=${JSON.stringify(once)} twice=${JSON.stringify(twice)} (tab=${JSON.stringify(tab)}, currentView=${JSON.stringify(currentView)})`,
      );
    }),
    { numRuns: NUM_RUNS },
  );
});

// 매핑이 존재하는(resolved=true) Tab 만을 대상으로도 별도 검증하여,
// "이미 Active_Tab 인 Tab 을 다시 선택해도 동일 View 로 수렴"함을 명시적으로 커버한다. (Req 5.4)
test('Feature: horizontal-tab-navigation, Property 7 — 매핑이 존재하는 Tab 재선택 시 최초 선택 후 View 로 수렴하여 유지된다', () => {
  fc.assert(
    fc.property(
      currentViewArb,
      fc.record({
        label: fc.string({ minLength: 1, maxLength: 8 }),
        viewId: fc.string({ minLength: 1, maxLength: 8 }),
        order: fc.integer({ min: 0, max: 20 }),
      }),
      (currentView, tab) => {
        const once = selectTab(currentView, tab);
        // 매핑이 존재하므로 최초 선택 결과는 tab.viewId 와 동일해야 한다. (항등/명시 매핑)
        assert.equal(once, tab.viewId);

        // 두 번째 선택도 동일 View 를 유지한다.
        const twice = selectTab(once, tab);
        assert.equal(twice, once);
      },
    ),
    { numRuns: NUM_RUNS },
  );
});
