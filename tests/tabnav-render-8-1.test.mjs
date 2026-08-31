// Feature: horizontal-tab-navigation
// Task 8.1: TopTabBar 렌더/통합 테스트 — 구조·순서·구분자 계약 검증.
//
// _Requirements: 1.1, 1.2, 1.3, 2.5, 4.1_
//
// 검증 전략
//  - computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE)의 실제 결과를 props로
//    넘겨 TopTabBar를 렌더한 뒤 DOM 구조/클래스/역할(ARIA) 계약을 단언한다.
//  - "어떻게 보이는지(레이아웃/위치/색상)"가 아닌 "무엇이 존재하는지(마크업 계약)"에
//    초점을 맞춘다. jsdom은 실제 CSS 스타일을 적용하지 않으므로
//    `position: sticky`·`top: 0` 같은 시각 속성은 검증하지 않는다.
//
// 실행:
//   node --import tsx --test tests/tabnav-render-8-1.test.mjs

// ────── 1. jsdom 전역 설정(반드시 RTL import 전에) ─────────────────────
import './jsdom-setup.mjs';

// ────── 2. 테스트·렌더링 의존 ──────────────────────────────────────────
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ────── 3. 테스트 대상 ────────────────────────────────────────────────
import { TopTabBar } from '../app/tabnav/TopTabBar.tsx';
import { computeVisibleGroups } from '../app/tabnav/computeVisibleGroups.ts';
import { buildRenderSequence } from '../app/tabnav/renderSequence.ts';
import {
  menuGroups,
  exposureRules,
  OPEN_ROLE,
} from '../app/tabnav/adapter.ts';

// ────── 4. 공통 픽스처 ───────────────────────────────────────────────
const visibleGroups = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
const renderSeq = buildRenderSequence(visibleGroups);
const expectedTabLabels = renderSeq
  .filter((item) => item.kind === 'tab')
  .map((item) => item.tab.label);

// 아무 탭이나 activeView로 사용한다(첫 번째 탭).
const activeView = expectedTabLabels[0] ?? null;

/** 공통 렌더 실행. afterEach에서 cleanup으로 DOM을 비운다. */
function renderBar() {
  const onSelectTab = () => {};
  return render(
    React.createElement(TopTabBar, { visibleGroups, activeView, onSelectTab }),
  );
}

// ────── afterEach: DOM 정리 ──────────────────────────────────────────
test.afterEach(() => {
  cleanup();
});

// ════════════════════════════════════════════════════════════════════════
// Req 1.1 — 탭 바는 .top-tab-bar 클래스를 가진 <nav> 최상위 컨테이너로 렌더된다.
//
// ※ position:sticky / top:0 은 CSS 계약이며 jsdom은 스타일을 적용하지 않으므로
//    여기서는 클래스·마크업 계약만 확인한다. 실제 고정 헤더 동작은 E2E 또는 스냅샷
//    CSS 검증이 필요하다.
// ════════════════════════════════════════════════════════════════════════
test('TC-8.1-01 Req 1.1: 최상위 요소가 nav.top-tab-bar 이다', () => {
  const { container } = renderBar();
  const nav = container.querySelector('nav.top-tab-bar');
  assert.ok(nav, 'nav.top-tab-bar 요소가 존재해야 한다');
  // <nav>가 컨테이너의 직접 자식(최상위)이어야 한다.
  assert.strictEqual(container.firstElementChild, nav, 'nav는 최상위 요소여야 한다');
});

// ════════════════════════════════════════════════════════════════════════
// Req 1.2 — TopTabBar는 사이드바 마크업을 생성하지 않는다.
//  (TopTabBar만 렌더하므로 aside.sidebar 또는 .sidebar 클래스가 DOM에 없어야 함)
// ════════════════════════════════════════════════════════════════════════
test('TC-8.1-02 Req 1.2: 사이드바 마크업이 없다', () => {
  const { container } = renderBar();
  assert.strictEqual(
    container.querySelector('aside'),
    null,
    '<aside> 요소가 없어야 한다',
  );
  assert.strictEqual(
    container.querySelector('.sidebar'),
    null,
    '.sidebar 클래스 요소가 없어야 한다',
  );
});

// ════════════════════════════════════════════════════════════════════════
// Req 1.3 — 모든 탭이 단일 .top-tab-bar__list 안에 정의 순서대로 렌더된다.
// ════════════════════════════════════════════════════════════════════════
test('TC-8.1-03 Req 1.3: 모든 탭이 단일 .top-tab-bar__list 안에 순서대로 렌더된다', () => {
  const { container } = renderBar();

  // 리스트 컨테이너가 정확히 1개인지 확인.
  const lists = container.querySelectorAll('.top-tab-bar__list');
  assert.strictEqual(lists.length, 1, '.top-tab-bar__list가 정확히 1개여야 한다');

  // 탭 버튼 라벨 순서.
  const buttons = lists[0].querySelectorAll('button.top-tab');
  const actualLabels = Array.from(buttons).map((b) => b.textContent.trim());
  assert.deepStrictEqual(
    actualLabels,
    expectedTabLabels,
    '탭 버튼 라벨이 정의 순서와 일치해야 한다',
  );
});

// ════════════════════════════════════════════════════════════════════════
// Req 2.5, 4.1 — 시각적 그룹 구분은 그룹별 경계 박스(.top-tab-group)로 표현된다.
//   레이아웃 개편으로 얇은 세로 Group_Divider 선(.top-tab-group-divider)은 제거되고,
//   노출된 각 Menu_Group이 하나의 role="group" 박스로 렌더된다.
//   open 상태의 3개 그룹이면 정확히 3개의 그룹 박스가 렌더되고, 구분자 요소는 0개다.
// ════════════════════════════════════════════════════════════════════════
test('TC-8.1-04 Req 2.5/4.1: 그룹별 경계 박스 개수 및 role=group, 구분자 제거', () => {
  const { container } = renderBar();

  // 노출 그룹 수만큼 .top-tab-group 박스가 존재한다(open → 3개).
  const groupBoxes = container.querySelectorAll('.top-tab-group');
  assert.strictEqual(
    groupBoxes.length,
    visibleGroups.length,
    `그룹 박스 수는 ${visibleGroups.length}개여야 한다`,
  );

  // 각 박스는 role=group 이며 그룹 라벨을 aria-label로 노출한다.
  for (const box of groupBoxes) {
    assert.strictEqual(box.getAttribute('role'), 'group', '그룹 박스는 role=group');
  }

  // 구 Group_Divider 선은 박스 경계로 대체되어 더 이상 렌더되지 않는다.
  const dividers = container.querySelectorAll('.top-tab-group-divider');
  assert.strictEqual(dividers.length, 0, 'Group_Divider 요소는 0개여야 한다(박스로 대체)');
});

test('TC-8.1-05 Req 4.1: 각 그룹 박스가 해당 그룹의 탭을 정의 순서대로만 담는다(그룹 연속성)', () => {
  const { container } = renderBar();
  const list = container.querySelector('.top-tab-bar__list');
  assert.ok(list, '.top-tab-bar__list가 있어야 한다');

  // 리스트의 직접 자식은 그룹 박스(.top-tab-group)이며, 순서는 visibleGroups 순서와 같다.
  const groupBoxes = Array.from(list.querySelectorAll('.top-tab-group'));
  assert.strictEqual(
    groupBoxes.length,
    visibleGroups.length,
    '그룹 박스 수 === 노출 그룹 수',
  );

  // 각 박스가 담은 탭 라벨을 추출해 해당 그룹의 탭 목록과 정확히 일치하는지 확인한다.
  // (같은 그룹 탭이 하나의 박스 안에 연속으로만 존재하고, 다른 그룹 탭이 섞이지 않음을 보증)
  for (let i = 0; i < groupBoxes.length; i++) {
    const boxLabels = Array.from(
      groupBoxes[i].querySelectorAll('button.top-tab'),
    ).map((b) => b.textContent.trim());
    const expectedGroupLabels = visibleGroups[i].tabs.map((t) => t.label);

    assert.deepStrictEqual(
      boxLabels,
      expectedGroupLabels,
      `${i + 1}번째 박스가 그룹 "${visibleGroups[i].groupLabel}"의 탭 목록과 순서까지 일치해야 한다`,
    );
  }
});
