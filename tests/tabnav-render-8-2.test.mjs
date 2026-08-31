// Feature: horizontal-tab-navigation
// Task 8.2: 가로 오버플로우 통합 테스트 — 단일 행 유지 + 가로 스크롤 접근 계약 검증.
//
// _Requirements: 1.5_
//   WHERE 노출 대상 Tab의 총 너비가 Top_Tab_Bar의 가용 너비를 초과하는 경우,
//   THE Top_Tab_Bar SHALL 모든 Tab을 단일 행으로 유지하며 가로 스크롤을 통해 접근 가능하게 한다.
//   (설계 "Data Models → 가로 오버플로우 처리" 절)
//
// ── jsdom 한계와 검증 전략 ────────────────────────────────────────────────────────────
//  jsdom은 레이아웃 엔진이 없고 스타일시트를 실제로 적용하지 않는다. 즉 요소의 실제 너비,
//  줄바꿈 여부, overflow 스크롤 동작 같은 "시각적으로 계산된 결과"를 관찰할 수 없다.
//  (getComputedStyle은 인라인 스타일 정도만 돌려주며 외부 CSS 규칙의 레이아웃 효과는 없음.)
//  따라서 순수 computed-style 단언으로는 Req 1.5를 검증할 수 없다.
//
//  이 테스트는 두 축으로 나누어 실용적으로 검증한다:
//   (A) 구조/계약: 아주 큰(오버플로우가 발생할 법한) synthetic visibleGroups를 렌더해도
//       모든 Tab이 "단 하나의" .top-tab-bar__list 컨테이너 안에 직접 형제로, 정의 순서대로
//       나열된다. 두 번째 행/두 번째 리스트 컨테이너가 생기지 않는다.
//       → 줄바꿈(멀티 행)이 아니라 단일 행 트랙에 모든 탭을 담는다는 마크업 계약을 확인.
//   (B) CSS 계약: app/globals.css의 .top-tab-bar__list 규칙이 단일 행 + 가로 스크롤을
//       제공하는 선언(flex-wrap:nowrap / white-space:nowrap / overflow-x:auto)을 포함한다.
//       jsdom이 실행하지 못하는 스타일이 스타일시트에 실제로 존재함을 텍스트로 단언한다.
// ──────────────────────────────────────────────────────────────────────────────────────
//
// 실행:
//   node --import tsx --test tests/tabnav-render-8-2.test.mjs

// ────── 1. jsdom 전역 설정(반드시 RTL import 전에) ─────────────────────
import './jsdom-setup.mjs';

// ────── 2. 테스트·렌더링 의존 ──────────────────────────────────────────
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ────── 3. 테스트 대상 ────────────────────────────────────────────────
import { TopTabBar } from '../app/tabnav/TopTabBar.tsx';
import { buildRenderSequence } from '../app/tabnav/renderSequence.ts';

// ────── 4. 오버플로우를 유발할 만한 큰 synthetic 픽스처 ────────────────
// 실제 메뉴보다 훨씬 많은 탭 수 + 긴 라벨로 "가용 너비 초과" 상황을 모사한다.
// (jsdom은 실제 폭을 계산하지 않으므로, 여기서는 "많은 탭이 단일 트랙에 담긴다"는
//  구조 계약을 확인하기 위한 입력으로 사용한다.)
const GROUP_COUNT = 4;
const TABS_PER_GROUP = 12;

/** 큰 synthetic VisibleGroup[]을 생성한다. */
function makeLargeVisibleGroups() {
  const groups = [];
  for (let g = 0; g < GROUP_COUNT; g++) {
    const tabs = [];
    for (let t = 0; t < TABS_PER_GROUP; t++) {
      // 의도적으로 긴 라벨(가용 너비를 초과시키기 위한 모사).
      const label = `그룹${g + 1}-매우긴탭라벨이름${t + 1}-${'x'.repeat(20)}`;
      tabs.push({ label, viewId: label, order: t });
    }
    groups.push({ groupLabel: `그룹${g + 1}`, tabs });
  }
  return groups;
}

const largeVisibleGroups = makeLargeVisibleGroups();

// 렌더 순서에서 기대되는 탭 라벨 순서(구분자 제외).
const expectedTabLabels = buildRenderSequence(largeVisibleGroups)
  .filter((item) => item.kind === 'tab')
  .map((item) => item.tab.label);

/** 공통 렌더 실행. afterEach에서 cleanup으로 DOM을 비운다. */
function renderLargeBar() {
  const onSelectTab = () => {};
  return render(
    React.createElement(TopTabBar, {
      visibleGroups: largeVisibleGroups,
      activeView: expectedTabLabels[0] ?? null,
      onSelectTab,
    }),
  );
}

// ────── afterEach: DOM 정리 ──────────────────────────────────────────
test.afterEach(() => {
  cleanup();
});

// ════════════════════════════════════════════════════════════════════════
// (A) 구조/계약 — Req 1.5
//   오버플로우 규모의 탭 집합을 렌더해도:
//    - .top-tab-bar__list 컨테이너는 정확히 1개(두 번째 행/컨테이너로 분할되지 않음)
//    - 모든 탭이 그 단일 리스트의 직접 자식(li) 안에 정의 순서대로 존재
// ════════════════════════════════════════════════════════════════════════
test('TC-8.2-01 Req 1.5: 오버플로우 규모에도 리스트 컨테이너는 정확히 1개다(단일 행 트랙)', () => {
  const { container } = renderLargeBar();

  const lists = container.querySelectorAll('.top-tab-bar__list');
  assert.strictEqual(
    lists.length,
    1,
    '탭이 많아도 .top-tab-bar__list는 정확히 1개여야 한다(두 번째 행/컨테이너 없음)',
  );

  // 상위 <nav>도 1개(별도의 행 컨테이너로 복제되지 않음).
  const navs = container.querySelectorAll('nav.top-tab-bar');
  assert.strictEqual(navs.length, 1, 'nav.top-tab-bar는 정확히 1개여야 한다');
});

test('TC-8.2-02 Req 1.5: 모든 탭이 단일 리스트(그룹 박스 경유) 안에 정의 순서대로 나열된다', () => {
  const { container } = renderLargeBar();

  const list = container.querySelector('.top-tab-bar__list');
  assert.ok(list, '.top-tab-bar__list가 있어야 한다');

  // 모든 탭 버튼이 렌더되었는지(전체 개수). 탭은 그룹 박스 안에 중첩되지만 모두 단일 리스트 하위에 있다.
  const buttons = list.querySelectorAll('button.top-tab');
  assert.strictEqual(
    buttons.length,
    expectedTabLabels.length,
    `모든 탭(${expectedTabLabels.length}개)이 렌더되어야 한다`,
  );

  // 순서 보존(단일 트랙 내 그룹 박스 순서 → 그룹 내 탭 순서).
  const actualLabels = Array.from(buttons).map((b) => b.textContent.trim());
  assert.deepStrictEqual(
    actualLabels,
    expectedTabLabels,
    '탭 라벨이 정의 순서대로 단일 리스트에 나열되어야 한다',
  );

  // 각 탭 버튼은 그룹 박스(.top-tab-group)에 담기며, 그 박스는 모두 동일한 단일 리스트 하위에 있다.
  // (탭/그룹이 서로 다른 행/컨테이너로 분산되지 않음을 확인 — 단일 행 트랙 유지)
  for (const btn of buttons) {
    const box = btn.closest('.top-tab-group');
    assert.ok(box, '각 탭 버튼은 .top-tab-group 박스에 담겨야 한다');
    assert.strictEqual(
      box.parentElement,
      list,
      '모든 그룹 박스는 동일한 .top-tab-bar__list의 직접 자식이어야 한다(행 분할 없음)',
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// (B) CSS 계약 — Req 1.5
//   jsdom은 스타일시트 레이아웃을 실행하지 못하므로, 단일 행 + 가로 스크롤을 제공하는
//   선언이 app/globals.css의 .top-tab-bar__list 규칙에 실제로 존재하는지 텍스트로 단언한다.
//    - 줄바꿈 방지: flex-wrap:nowrap 그리고/또는 white-space:nowrap
//    - 가로 스크롤: overflow-x:auto
// ════════════════════════════════════════════════════════════════════════
test('TC-8.2-03 Req 1.5: globals.css의 .top-tab-bar__list가 단일 행 + 가로 스크롤 선언을 포함한다', () => {
  const cssPath = fileURLToPath(new URL('../app/globals.css', import.meta.url));
  const css = readFileSync(cssPath, 'utf8');

  // .top-tab-bar__list { ... } 규칙 블록만 추출한다.
  // (::-webkit-scrollbar 등 파생 선택자와 미디어쿼리 내부 재정의는 제외하고, 정확히
  //  `.top-tab-bar__list{` 로 시작하는 첫 규칙 블록을 대상으로 한다.)
  const ruleMatch = css.match(/\.top-tab-bar__list\s*\{([^}]*)\}/);
  assert.ok(ruleMatch, '.top-tab-bar__list 규칙 블록이 globals.css에 존재해야 한다');

  // 공백을 제거해 선언 비교를 견고하게 한다.
  const decl = ruleMatch[1].replace(/\s+/g, '');

  // 줄바꿈 없는 단일 행: flex-wrap:nowrap 또는 white-space:nowrap 중 하나 이상.
  const hasNoWrap =
    /flex-wrap:nowrap/.test(decl) || /white-space:nowrap/.test(decl);
  assert.ok(
    hasNoWrap,
    '.top-tab-bar__list는 줄바꿈 방지(flex-wrap:nowrap 또는 white-space:nowrap) 선언을 포함해야 한다',
  );

  // 가로 스크롤 접근: overflow-x:auto (또는 scroll).
  const hasHorizontalScroll = /overflow-x:(auto|scroll)/.test(decl);
  assert.ok(
    hasHorizontalScroll,
    '.top-tab-bar__list는 가로 스크롤(overflow-x:auto|scroll) 선언을 포함해야 한다',
  );
});
