// Feature: horizontal-tab-navigation, Property 6: 재선택 후 Active_Tab 정합성 —
// 임의의 이전 Active_Tab과 임의의 User_Role 조합에 대해, 노출 규칙 재평가 후의
// Active_Tab은 표시 가능한 Tab이 하나라도 있으면 반드시 표시 Tab 집합에 포함되어야
// 하고(이전 Active_Tab이 비노출이 되면 표시 Tab 중 첫 번째로 재선택), 표시 가능한
// Tab이 없으면 Active_Tab이 선택되지 않아야 한다.
//
// Validates: Requirements 3.6
//
// 대상 순수 함수: app/tabnav/reselectActiveTab.ts 의 reselectActiveTab.
// 타입 전용 import(및 resolveActiveTab)만 갖는 모듈이므로 Node의 타입 스트리핑으로
// 직접 로드한다 (barrel(index.ts)은 @/app/data 경로 별칭에 의존하므로 사용하지 않는다).

import test from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";

const { reselectActiveTab } = await import(
  new URL("../app/tabnav/reselectActiveTab.ts", import.meta.url)
);

const NUM_RUNS = 200; // 최소 100회 이상 반복 (설계 속성 테스트 구성 규칙)

// 임의의 Tab 생성기. viewId는 label과 동일(항등 매핑)하게 유지한다.
const tabArb = fc.record({
  label: fc.string({ minLength: 1, maxLength: 10 }),
  order: fc.integer({ min: 0, max: 20 }),
});

// 노출 결과를 두 가지 표현(Tab[] 또는 VisibleGroup[])으로 생성하여
// reselectActiveTab이 두 입력 형태를 모두 올바르게 평탄화하는지 함께 검증한다.

// 1) 평탄한 Tab[] 형태의 노출 결과.
function flatExposureArb() {
  return fc
    .array(tabArb, { minLength: 0, maxLength: 8 })
    .map((tabs) =>
      // label을 유일하게 만들어 viewId 매핑 판정을 명확히 한다.
      tabs.map((t, i) => ({ label: `${t.label}#${i}`, viewId: `${t.label}#${i}`, order: t.order }))
    );
}

// 2) VisibleGroup[] 형태의 노출 결과.
function groupedExposureArb() {
  return fc
    .array(
      fc.record({
        groupLabel: fc.string({ minLength: 1, maxLength: 8 }),
        tabs: fc.array(tabArb, { minLength: 0, maxLength: 4 }),
      }),
      { minLength: 0, maxLength: 4 }
    )
    .map((groups) => {
      let counter = 0;
      return groups.map((g, gi) => ({
        groupLabel: `${g.groupLabel}#${gi}`,
        tabs: g.tabs.map((t) => {
          const idx = counter++;
          return { label: `t${idx}`, viewId: `t${idx}`, order: t.order };
        }),
      }));
    });
}

// 노출 결과(Tab[] 또는 VisibleGroup[])를 단일 Tab 시퀀스로 평탄화한다.
// (reselectActiveTab 내부 규칙과 동일: 원소가 tabs 배열을 가지면 그룹으로 취급)
function flatten(exposure) {
  const tabs = [];
  for (const item of exposure) {
    if (item && Array.isArray(item.tabs)) {
      tabs.push(...item.tabs);
    } else {
      tabs.push(item);
    }
  }
  return tabs;
}

// 이전 Active_Tab 입력: 노출 Tab 중 하나(Tab 객체), 노출 Tab의 viewId(문자열),
// 비노출 viewId(문자열), null/undefined(이전 선택 없음)를 섞어 생성한다.
function previousActiveArb(visibleTabs) {
  const options = [
    fc.constant(null),
    fc.constant(undefined),
    // 비노출 viewId (노출 집합에 없을 가능성이 높은 문자열)
    fc.string().map((s) => `__absent__${s}`),
  ];
  if (visibleTabs.length > 0) {
    // 노출 Tab 객체 그대로
    options.push(fc.constantFrom(...visibleTabs));
    // 노출 Tab의 viewId 문자열
    options.push(fc.constantFrom(...visibleTabs.map((t) => t.viewId)));
  }
  return fc.oneof(...options);
}

function runProperty(exposureArb) {
  fc.assert(
    fc.property(
      exposureArb.chain((exposure) => {
        const visibleTabs = flatten(exposure);
        return previousActiveArb(visibleTabs).map((previousActive) => ({
          exposure,
          visibleTabs,
          previousActive,
        }));
      }),
      ({ exposure, visibleTabs, previousActive }) => {
        const result = reselectActiveTab(exposure, previousActive);

        if (visibleTabs.length === 0) {
          // 표시 Tab이 없으면 Active_Tab 미선택.
          assert.equal(result, undefined, "표시 Tab이 없는데 Active_Tab이 선택됨");
          return;
        }

        // 표시 Tab이 있으면 반드시 표시 집합에 포함되어야 한다.
        assert.ok(result != null, "표시 Tab이 있는데 Active_Tab이 미선택됨");
        const visibleViewIds = new Set(visibleTabs.map((t) => t.viewId));
        assert.ok(
          visibleViewIds.has(result.viewId),
          `재선택된 Active_Tab(viewId='${result.viewId}')이 표시 집합에 포함되지 않음`
        );

        // 이전 Active_Tab이 여전히 노출되면 그 viewId를 유지해야 한다.
        const prevViewId =
          previousActive == null
            ? undefined
            : typeof previousActive === "string"
            ? previousActive
            : previousActive.viewId;

        if (prevViewId != null && visibleViewIds.has(prevViewId)) {
          assert.equal(
            result.viewId,
            prevViewId,
            "이전 Active_Tab이 여전히 노출되는데 유지되지 않음"
          );
        } else {
          // 이전 Active_Tab이 비노출(또는 없음)이면 표시 Tab 중 첫 번째로 재선택.
          assert.equal(
            result.viewId,
            visibleTabs[0].viewId,
            "비노출/미선택 상황에서 첫 번째 표시 Tab으로 재선택되지 않음"
          );
        }
      }
    ),
    { numRuns: NUM_RUNS }
  );
}

test("Feature: horizontal-tab-navigation, Property 6 — 재선택 후 Active_Tab 정합성 (Tab[] 입력)", () => {
  runProperty(flatExposureArb());
});

test("Feature: horizontal-tab-navigation, Property 6 — 재선택 후 Active_Tab 정합성 (VisibleGroup[] 입력)", () => {
  runProperty(groupedExposureArb());
});
