// Feature: horizontal-tab-navigation
// Task 8.4: 'SBF 반영 작업' 진입/복귀 통합 테스트.
//
// _Requirements: 6.1, 6.2, 6.3_
//
// ── 하이브리드(2단) 검증 전략 ────────────────────────────────────────────────
// 요구사항 6.2/6.3의 "완전한" 진입/복귀 흐름(openApply → setView('SBF 반영 작업'),
// ChangeCompare 완료/뒤로가기 → setView('처리 업무'))은 app/page.tsx의 거대한 클라이언트
// 컴포넌트(Home) 안에 있다. Home은 data.ts(수천 행), 다수의 상태/하위 컴포넌트, 외부
// iframe 등에 의존하여 jsdom에서 통째로 마운트하기에는 설정 비용이 지나치게 크고
// 취약하다. 따라서 본 통합 테스트는 두 층위로 나눠 검증한다.
//
//   (A) 탭 바 계약(관찰 가능한 UI 계약): 진입/복귀 흐름이 "의존"하는 Top_Tab_Bar의
//       관찰 가능한 동작을 TopTabBar + 계산 계층으로 직접 렌더하여 검증한다.
//        - 'SBF 반영 작업'은 독립 탭으로 노출되지 않는다. (Req 6.1)
//        - 복귀 View('처리 업무')일 때 '처리 업무' 탭이 유일한 Active_Tab이다. (Req 6.3)
//        - 진입 View('SBF 반영 작업')일 때 활성 탭이 0개다(비노출 탭이므로). (Req 6.2 탭 바 측)
//        - activeView를 'SBF 반영 작업' → '처리 업무'로 rerender하면 '처리 업무'가 유일
//          Active_Tab이 된다(= 완료/뒤로가기 시 setView('처리 업무') 결과의 탭 바 표현). (Req 6.3)
//
//   (B) 페이지 배선(소스 수준 앵커): 위 탭 바 계약을 "실제 page.tsx 흐름"에 묶기 위해,
//       node:fs로 app/page.tsx를 텍스트로 읽어 진입/복귀 배선이 실제로 존재하는지
//       단언한다(openApply → setView('SBF 반영 작업'), 완료/뒤로가기 → setView('처리 업무')).
//       page.tsx는 한글을 \uXXXX 이스케이프로 저장하므로, 파일 텍스트의 유니코드 이스케이프를
//       먼저 디코드한 뒤 한글 형태로 단언한다(리터럴/이스케이프 양쪽 모두에 견고).
//
// 이 두 층위를 합치면 "전체 Home을 마운트하지 않고도" 진입/복귀 흐름의 탭 바 계약과
// 그 흐름의 배선 존재를 함께 보증할 수 있다.
//
// 실행:
//   node --import tsx --test tests/tabnav-render-8-4.test.mjs

// ────── 1. jsdom 전역 설정(반드시 RTL import 전에) ─────────────────────
import './jsdom-setup.mjs';

// ────── 2. 테스트·렌더링 의존 ──────────────────────────────────────────
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { render, cleanup } from '@testing-library/react';

// ────── 3. 테스트 대상(표현 계층 + 계산 계층) ──────────────────────────
import { TopTabBar } from '../app/tabnav/TopTabBar.tsx';
import { computeVisibleGroups } from '../app/tabnav/computeVisibleGroups.ts';
import {
  menuGroups,
  exposureRules,
  OPEN_ROLE,
} from '../app/tabnav/adapter.ts';

// ────── 4. 상수/픽스처 ────────────────────────────────────────────────
const APPLY_VIEW = 'SBF 반영 작업'; // '처리 업무' 경유 진입 View (독립 탭 아님)
const PROCESS_VIEW = '처리 업무'; // 복귀 View + Active_Tab 대상

// open 상태(권한 미구현)의 실제 노출 계산 결과를 props로 사용한다.
const visibleGroups = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);

/** container 안의 활성 탭(top-tab--active) 라벨 목록을 추출한다. */
function activeTabLabels(container) {
  const actives = container.querySelectorAll('button.top-tab.top-tab--active');
  return Array.from(actives).map((b) => b.textContent.trim());
}

/** container 안의 aria-current="page" 탭 라벨 목록을 추출한다. */
function ariaCurrentLabels(container) {
  const currents = container.querySelectorAll('button.top-tab[aria-current="page"]');
  return Array.from(currents).map((b) => b.textContent.trim());
}

/** 모든 탭 버튼 라벨 목록. */
function allTabLabels(container) {
  return Array.from(container.querySelectorAll('button.top-tab')).map((b) =>
    b.textContent.trim(),
  );
}

function renderBar(activeView) {
  return render(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView,
      onSelectTab: () => {},
    }),
  );
}

test.afterEach(() => {
  cleanup();
});

// ════════════════════════════════════════════════════════════════════════
// (A) 탭 바 계약
// ════════════════════════════════════════════════════════════════════════

// Req 6.1 — 'SBF 반영 작업'은 독립 Tab으로 노출되지 않는다.
test("TC-8.4-01 Req 6.1: 'SBF 반영 작업' 라벨 탭이 탭 바에 존재하지 않는다", () => {
  const { container } = renderBar(PROCESS_VIEW);
  const labels = allTabLabels(container);
  assert.ok(labels.length > 0, '탭이 하나 이상 렌더되어야 한다');
  assert.ok(
    !labels.includes(APPLY_VIEW),
    `'${APPLY_VIEW}' 라벨의 탭 버튼이 존재하면 안 된다 (실제: ${JSON.stringify(labels)})`,
  );
});

// Req 6.3 — 복귀 View('처리 업무')일 때 '처리 업무' 탭이 유일한 Active_Tab.
test("TC-8.4-02 Req 6.3: activeView='처리 업무'면 '처리 업무' 탭이 유일한 Active_Tab이다", () => {
  const { container } = renderBar(PROCESS_VIEW);

  const actives = activeTabLabels(container);
  assert.deepStrictEqual(
    actives,
    [PROCESS_VIEW],
    `활성 탭은 '${PROCESS_VIEW}' 하나뿐이어야 한다 (실제: ${JSON.stringify(actives)})`,
  );

  // aria-current="page"도 정확히 '처리 업무' 탭 하나에만 적용된다.
  assert.deepStrictEqual(
    ariaCurrentLabels(container),
    [PROCESS_VIEW],
    "aria-current=page는 '처리 업무' 탭 하나에만 있어야 한다",
  );
});

// Req 6.2(탭 바 측) — 진입 View('SBF 반영 작업')일 때 활성 탭이 0개.
// 'SBF 반영 작업'은 비노출 탭이므로, 진입 중에는 어떤 탭도 활성으로 표시되지 않는다.
test("TC-8.4-03 Req 6.2: activeView='SBF 반영 작업'이면 활성 탭이 0개다", () => {
  const { container } = renderBar(APPLY_VIEW);

  const actives = activeTabLabels(container);
  assert.strictEqual(
    actives.length,
    0,
    `진입 View에서는 활성 탭이 없어야 한다 (실제: ${JSON.stringify(actives)})`,
  );
  assert.strictEqual(
    ariaCurrentLabels(container).length,
    0,
    '진입 View에서는 aria-current=page 탭이 없어야 한다',
  );

  // 그럼에도 탭 바 자체는 정상 렌더되어 탭 목록을 유지한다(빈 탭 바 아님).
  assert.ok(allTabLabels(container).length > 0, '탭 목록은 유지되어야 한다');
});

// Req 6.3 — 완료/뒤로가기 전이 시뮬레이션(탭 바 계약 수준):
//   activeView='SBF 반영 작업' → 'SBF 반영 작업' 활성 0개
//   rerender activeView='처리 업무' → '처리 업무'가 유일 Active_Tab
// 이는 page.tsx의 setView('처리 업무') on 완료/뒤로가기 결과를 탭 바 관점에서 재현한다.
test("TC-8.4-04 Req 6.3: 'SBF 반영 작업' → '처리 업무' 복귀 전이 시 '처리 업무'가 유일 Active_Tab이 된다", () => {
  const { container, rerender } = renderBar(APPLY_VIEW);

  // 진입 상태: 활성 탭 없음.
  assert.strictEqual(
    activeTabLabels(container).length,
    0,
    "진입 상태(activeView='SBF 반영 작업')에서는 활성 탭이 없어야 한다",
  );

  // 복귀: setView('처리 업무')에 해당하는 rerender.
  rerender(
    React.createElement(TopTabBar, {
      visibleGroups,
      activeView: PROCESS_VIEW,
      onSelectTab: () => {},
    }),
  );

  assert.deepStrictEqual(
    activeTabLabels(container),
    [PROCESS_VIEW],
    `복귀 후 활성 탭은 '${PROCESS_VIEW}' 하나뿐이어야 한다`,
  );
});

// ════════════════════════════════════════════════════════════════════════
// (B) 페이지 배선(소스 수준 앵커) — app/page.tsx 텍스트를 읽어 진입/복귀 배선 존재 확인.
//
// page.tsx는 한글을 \uXXXX로 저장하므로, 파일의 유니코드 이스케이프를 먼저 디코드한 뒤
// 한글 형태로 단언한다(리터럴/이스케이프 표기 양쪽에 견고).
// ════════════════════════════════════════════════════════════════════════

/** \uXXXX 이스케이프 시퀀스를 실제 문자로 디코드한다. */
function decodeUnicodeEscapes(text) {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

const pageSourceRaw = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const pageSource = decodeUnicodeEscapes(pageSourceRaw);

// Req 6.2 배선 — openApply가 'SBF 반영 작업' View로 진입시킨다.
test("TC-8.4-05 Req 6.2 배선: openApply가 setView('SBF 반영 작업')로 진입한다", () => {
  // ProcessingWork에 openApply prop이 전달된다.
  assert.match(
    pageSource,
    /openApply=\{/,
    "page.tsx에 openApply prop 배선이 존재해야 한다",
  );
  // openApply 핸들러가 'SBF 반영 작업' View로 setView 한다.
  assert.match(
    pageSource,
    /openApply=\{\(id\)=>\{setApplyRequestId\(id\);setView\('SBF 반영 작업'\)\}\}/,
    "openApply가 setApplyRequestId 후 setView('SBF 반영 작업')로 진입해야 한다",
  );
});

// Req 6.3 배선 — 완료/뒤로가기가 '처리 업무' View로 복귀한다.
test("TC-8.4-06 Req 6.3 배선: 완료/뒤로가기가 setView('처리 업무')로 복귀한다", () => {
  // ChangeCompare onBack이 '처리 업무'로 복귀.
  assert.match(
    pageSource,
    /onBack=\{\(\)=>setView\('처리 업무'\)\}/,
    "ChangeCompare onBack이 setView('처리 업무')로 복귀해야 한다",
  );
  // 완료 콜백도 '처리 업무'로 복귀(문자열이 최소 1회 이상 존재).
  assert.match(
    pageSource,
    /setView\('처리 업무'\)/,
    "완료/뒤로가기 흐름이 setView('처리 업무')로 복귀해야 한다",
  );
});
