// Feature: horizontal-tab-navigation
// Task 8.3: Active_Tab 스타일 통합/렌더 테스트.
//
// _Requirements: 5.2, 5.3_
//
// 검증 대상 (Req 5.2, 5.3)
//  - 탭 선택 시 정확히 하나의 탭만 Active_Tab 스타일(top-tab--active + aria-current="page")로
//    표시된다.
//  - 새 탭이 Active_Tab이 되면 이전 Active_Tab의 활성 표시가 해제된다(한 시점에 정확히 하나).
//  - 매핑되는 노출 탭이 없는 activeView(제외 대상 'SBF 반영 작업' 또는 알 수 없는 값)에서는
//    활성 탭이 0개다.
//
// 검증 전략
//  - TopTabBar는 controlled 컴포넌트이며 activeView prop이 활성 상태를 구동한다.
//    computeVisibleGroups(...)의 실제 결과를 props로 넘겨 렌더한 뒤 DOM 클래스/ARIA 계약을
//    단언한다. jsdom은 CSS를 적용하지 않으므로 시각 스타일이 아닌 마크업 계약을 검증한다.
//  - 태스크 8.1이 마련한 tests/jsdom-setup.mjs 렌더 인프라를 재사용한다.
//
// 실행:
//   node --import tsx --test tests/tabnav-render-8-3.test.mjs

// ────── 1. jsdom 전역 설정(반드시 RTL import 전에) ─────────────────────
import './jsdom-setup.mjs';

// ────── 2. 테스트·렌더링 의존 ──────────────────────────────────────────
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';

// ────── 3. 테스트 대상 ────────────────────────────────────────────────
import { TopTabBar } from '../app/tabnav/TopTabBar.tsx';
import { computeVisibleGroups } from '../app/tabnav/computeVisibleGroups.ts';
import { menuGroups, exposureRules, OPEN_ROLE } from '../app/tabnav/adapter.ts';

// ────── 4. 공통 픽스처 ───────────────────────────────────────────────
// open 상태 → 세 그룹 전체 노출.
const visibleGroups = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);

// 렌더 순서의 전체 탭 라벨(=viewId, 현재 항등 매핑).
const allTabs = visibleGroups.flatMap((g) => g.tabs);
const allViewIds = allTabs.map((t) => t.viewId);

// 최소 2개 탭이 있어야 "이전 활성 해제" 시나리오를 검증할 수 있다.
assert.ok(allViewIds.length >= 2, '테스트 전제: 노출 탭이 2개 이상이어야 한다');

/** 활성 표시된 버튼(top-tab--active 클래스 보유)들을 반환. */
function activeButtons(container) {
  return Array.from(container.querySelectorAll('button.top-tab.top-tab--active'));
}

/** aria-current="page"를 가진 버튼들을 반환. */
function ariaCurrentButtons(container) {
  return Array.from(container.querySelectorAll('button.top-tab[aria-current="page"]'));
}

/** 라벨로 탭 버튼을 찾는다. */
function buttonByLabel(container, label) {
  return Array.from(container.querySelectorAll('button.top-tab')).find(
    (b) => b.textContent.trim() === label,
  );
}

// ────── afterEach: DOM 정리 ──────────────────────────────────────────
test.afterEach(() => {
  cleanup();
});

// ════════════════════════════════════════════════════════════════════════
// TC-8.3-01 Req 5.2/5.3 — activeView가 어느 탭의 viewId면, 정확히 하나의 탭만
//   top-tab--active + aria-current="page" 이고, 그 탭이 activeView와 일치한다.
// ════════════════════════════════════════════════════════════════════════
test('TC-8.3-01 Req 5.2/5.3: activeView와 일치하는 탭 하나만 활성 상태다', () => {
  const activeView = allViewIds[0];
  const { container } = render(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView,
      onSelectTab: () => {},
    }),
  );

  const actives = activeButtons(container);
  const currents = ariaCurrentButtons(container);

  // 정확히 하나만 활성.
  assert.strictEqual(actives.length, 1, 'top-tab--active 버튼은 정확히 1개여야 한다');
  assert.strictEqual(currents.length, 1, 'aria-current="page" 버튼은 정확히 1개여야 한다');

  // 활성 버튼이 activeView 탭과 일치.
  assert.strictEqual(
    actives[0].textContent.trim(),
    activeView,
    '활성 버튼 라벨이 activeView와 일치해야 한다',
  );
  // 클래스와 aria-current가 같은 버튼에 적용된다.
  assert.strictEqual(actives[0], currents[0], '활성 클래스와 aria-current는 동일 버튼에 적용된다');
});

// ════════════════════════════════════════════════════════════════════════
// TC-8.3-02 Req 5.3 — 매핑되는 노출 탭이 없는 activeView에서는 활성 탭이 0개다.
//   (a) 제외 대상 'SBF 반영 작업' (Top_Tab_Bar 비노출)
//   (b) 알 수 없는 view 값
// ════════════════════════════════════════════════════════════════════════
test('TC-8.3-02 Req 5.3: 매핑 없는 activeView(제외/미지의 값)면 활성 탭이 0개다', () => {
  for (const activeView of ['SBF 반영 작업', '존재하지 않는 View']) {
    const { container } = render(
      React.createElement(TopTabBar, {
        visibleGroups,
        activeView,
        onSelectTab: () => {},
      }),
    );

    assert.strictEqual(
      activeButtons(container).length,
      0,
      `activeView="${activeView}"일 때 top-tab--active 버튼이 없어야 한다`,
    );
    assert.strictEqual(
      ariaCurrentButtons(container).length,
      0,
      `activeView="${activeView}"일 때 aria-current="page" 버튼이 없어야 한다`,
    );

    cleanup();
  }
});

// ════════════════════════════════════════════════════════════════════════
// TC-8.3-03 Req 5.3 — 탭 전환(rerender)으로 activeView가 바뀌면 활성 표시가 이동한다:
//   새 탭이 정확히 하나 활성, 이전 탭은 top-tab--active / aria-current가 해제된다.
// ════════════════════════════════════════════════════════════════════════
test('TC-8.3-03 Req 5.3: activeView 변경 시 활성 표시가 이동하고 이전 활성이 해제된다', () => {
  const firstView = allViewIds[0];
  const secondView = allViewIds[1];

  const { container, rerender } = render(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView: firstView,
      onSelectTab: () => {},
    }),
  );

  // 초기: 첫 번째 탭이 활성.
  let actives = activeButtons(container);
  assert.strictEqual(actives.length, 1, '초기 활성 탭은 1개여야 한다');
  assert.strictEqual(actives[0].textContent.trim(), firstView, '초기 활성 탭이 firstView여야 한다');

  // 탭 전환: activeView를 두 번째 탭으로 변경하여 rerender.
  rerender(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView: secondView,
      onSelectTab: () => {},
    }),
  );

  // 전환 후: 여전히 정확히 하나만 활성, 새 탭이 활성.
  actives = activeButtons(container);
  const currents = ariaCurrentButtons(container);
  assert.strictEqual(actives.length, 1, '전환 후 활성 탭은 여전히 1개여야 한다');
  assert.strictEqual(currents.length, 1, '전환 후 aria-current 탭은 1개여야 한다');
  assert.strictEqual(actives[0].textContent.trim(), secondView, '활성 탭이 secondView로 이동해야 한다');

  // 이전 활성 탭(firstView)은 활성 표시가 해제되어야 한다.
  const prevButton = buttonByLabel(container, firstView);
  assert.ok(prevButton, '이전 탭 버튼이 존재해야 한다');
  assert.ok(
    !prevButton.classList.contains('top-tab--active'),
    '이전 활성 탭에서 top-tab--active가 해제되어야 한다',
  );
  assert.strictEqual(
    prevButton.getAttribute('aria-current'),
    null,
    '이전 활성 탭에서 aria-current가 해제되어야 한다',
  );
});

// ════════════════════════════════════════════════════════════════════════
// TC-8.3-04 Req 5.2/5.3 — 클릭 배선: controlled 컴포넌트이므로 클릭은 onSelectTab을
//   올바른 탭으로 호출한다. 배선 계층이 activeView를 갱신했다고 가정하고 rerender하면
//   활성 표시가 클릭한 탭으로 이동한다.
// ════════════════════════════════════════════════════════════════════════
test('TC-8.3-04 Req 5.2/5.3: 탭 클릭이 onSelectTab을 호출하고 rerender 시 활성 표시가 갱신된다', () => {
  const firstView = allViewIds[0];
  const targetView = allViewIds[1];

  const calls = [];
  const onSelectTab = (tab) => calls.push(tab);

  const { container, rerender } = render(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView: firstView,
      onSelectTab,
    }),
  );

  // 두 번째 탭 버튼을 클릭한다.
  const targetButton = buttonByLabel(container, targetView);
  assert.ok(targetButton, '클릭 대상 탭 버튼이 존재해야 한다');
  fireEvent.click(targetButton);

  // onSelectTab이 올바른 탭으로 정확히 한 번 호출된다.
  assert.strictEqual(calls.length, 1, 'onSelectTab이 정확히 한 번 호출되어야 한다');
  assert.strictEqual(calls[0].label, targetView, 'onSelectTab이 클릭한 탭으로 호출되어야 한다');
  assert.strictEqual(calls[0].viewId, targetView, 'onSelectTab 콜백의 viewId가 클릭 탭과 일치해야 한다');

  // controlled: 클릭만으로는 활성 표시가 바뀌지 않는다(여전히 firstView 활성).
  assert.strictEqual(
    activeButtons(container)[0].textContent.trim(),
    firstView,
    '클릭 직후에는 activeView prop이 그대로이므로 활성 탭도 그대로다',
  );

  // 배선 계층이 activeView를 갱신했다고 가정하고 rerender → 활성 표시가 클릭 탭으로 이동.
  rerender(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView: targetView,
      onSelectTab,
    }),
  );

  const actives = activeButtons(container);
  assert.strictEqual(actives.length, 1, 'rerender 후 활성 탭은 1개여야 한다');
  assert.strictEqual(actives[0].textContent.trim(), targetView, '활성 표시가 클릭한 탭으로 갱신되어야 한다');
});
