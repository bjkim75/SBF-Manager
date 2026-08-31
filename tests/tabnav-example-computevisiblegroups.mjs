// Feature: horizontal-tab-navigation
// Task 2.5: computeVisibleGroups 예시/엣지 테스트
// 순수 계산 함수 computeVisibleGroups의 구체 예시/경계 동작을 검증한다.
// 속성 테스트(2.2~2.4)가 광범위한 입력 커버리지를 담당하므로, 여기서는
// 구체 그룹/탭 구성과 경계 조건에 집중한다. (설계 Testing Strategy 참고)
//
// _Requirements: 2.1, 2.2, 2.3, 2.4, 1.6, 3.5_
//
// 실행: node --import tsx --test tests/tabnav-example-computevisiblegroups.mjs

import assert from 'node:assert/strict';
import test from 'node:test';

import { computeVisibleGroups } from '../app/tabnav/computeVisibleGroups.ts';
import {
  deriveMenuGroups,
  exposureRules,
  openExposureRule,
  menuGroups,
  OPEN_ROLE,
} from '../app/tabnav/adapter.ts';

// 노출 결과를 [groupLabel, [탭 라벨...]] 형태의 평탄한 구조로 변환한다.
const asPairs = (visible) => visible.map((g) => [g.groupLabel, g.tabs.map((t) => t.label)]);
// 노출 결과에 등장하는 모든 탭 라벨을 평탄하게 모은다.
const allTabLabels = (visible) => visible.flatMap((g) => g.tabs.map((t) => t.label));

const COMMON_GROUP = '공통 메뉴';
const REQUESTER_GROUP = '변경요청자 메뉴';
const REVIEWER_GROUP = '검토자/관리자 메뉴';

// 원본 이미지 전용 메뉴(어떤 그룹의 탭으로도 노출되지 않아야 함). (Req 2.4)
const IMAGE_ONLY_LABELS = ['SBF 탐색기', '1Depth검토', '2Depth검토', 'D3-L3 매칭'];

test('TC-2.5-01 open 상태에서 공통 메뉴 탭 순서 (대시보드 → SBF 마스터)', () => {
  // Req 2.1
  const visible = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
  const common = visible.find((g) => g.groupLabel === COMMON_GROUP);
  assert.ok(common, '공통 메뉴 그룹이 노출되어야 한다');
  assert.deepEqual(
    common.tabs.map((t) => t.label),
    ['대시보드', 'SBF 마스터'],
  );
});

test('TC-2.5-02 open 상태에서 변경요청자 메뉴 탭 순서 (변경요청 → 내 요청)', () => {
  // Req 2.2
  const visible = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
  const requester = visible.find((g) => g.groupLabel === REQUESTER_GROUP);
  assert.ok(requester, '변경요청자 메뉴 그룹이 노출되어야 한다');
  assert.deepEqual(
    requester.tabs.map((t) => t.label),
    ['변경요청', '내 요청'],
  );
});

test('TC-2.5-03 open 상태에서 검토자/관리자 메뉴 탭 순서 (처리 업무 → 변경이력 → 데이터 가져오기 → 배포관리)', () => {
  // Req 2.3 (그리고 'SBF 반영 작업'은 제외되어야 함 → Req 2.4/6.1)
  const visible = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
  const reviewer = visible.find((g) => g.groupLabel === REVIEWER_GROUP);
  assert.ok(reviewer, '검토자/관리자 메뉴 그룹이 노출되어야 한다');
  assert.deepEqual(
    reviewer.tabs.map((t) => t.label),
    ['처리 업무', '변경이력', '데이터 가져오기', '배포관리'],
  );
});

test('TC-2.5-04 open 상태에서 세 그룹이 Menus_Data 정의 순서대로 전부 노출된다', () => {
  // Req 3.2, 2.1~2.3 종합
  const visible = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
  assert.deepEqual(asPairs(visible), [
    [COMMON_GROUP, ['대시보드', 'SBF 마스터']],
    [REQUESTER_GROUP, ['변경요청', '내 요청']],
    [REVIEWER_GROUP, ['처리 업무', '변경이력', '데이터 가져오기', '배포관리']],
  ]);
});

test('TC-2.5-05 원본 이미지 전용 메뉴는 어떤 그룹의 탭으로도 노출되지 않는다', () => {
  // Req 2.4
  const visible = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
  const labels = allTabLabels(visible);
  for (const label of IMAGE_ONLY_LABELS) {
    assert.ok(!labels.includes(label), `이미지 전용 메뉴 "${label}"는 노출되지 않아야 한다`);
  }
});

test("TC-2.5-06 'SBF 반영 작업'은 어떤 그룹의 탭으로도 노출되지 않는다", () => {
  // Req 2.4 / 6.1 (검토자/관리자 그룹 원본에는 존재하지만 어댑터에서 제외)
  const visible = computeVisibleGroups(menuGroups, exposureRules, OPEN_ROLE);
  assert.ok(!allTabLabels(visible).includes('SBF 반영 작업'));
});

test('TC-2.5-07 빈 Menus_Data이면 노출 그룹이 0개이다', () => {
  // Req 1.6
  const visible = computeVisibleGroups([], exposureRules, OPEN_ROLE);
  assert.deepEqual(visible, []);
});

test('TC-2.5-08 규칙이 허용하는 그룹이 하나도 없으면 노출 탭이 0개이다', () => {
  // Req 1.6 / 3.5 (허용 그룹 없음)
  const emptyRule = [{ role: OPEN_ROLE, allowedGroups: [] }];
  const visible = computeVisibleGroups(menuGroups, emptyRule, OPEN_ROLE);
  assert.deepEqual(visible, []);
});

test('TC-2.5-09 미정의 역할(null/undefined)이면 빈 목록을 반환한다', () => {
  // Req 3.5
  assert.deepEqual(computeVisibleGroups(menuGroups, exposureRules, null), []);
  assert.deepEqual(computeVisibleGroups(menuGroups, exposureRules, undefined), []);
});

test('TC-2.5-10 알 수 없는 역할이면 빈 목록을 반환한다', () => {
  // Req 3.5 (규칙에 없는 역할)
  const visible = computeVisibleGroups(menuGroups, exposureRules, '알수없는역할');
  assert.deepEqual(visible, []);
});

test('TC-2.5-11 규칙에 명시되지 않은 그룹은 비노출로 처리된다', () => {
  // Req 3.5 관련 (규칙에 명시된 그룹만 노출)
  const partialRule = [{ role: OPEN_ROLE, allowedGroups: [COMMON_GROUP] }];
  const visible = computeVisibleGroups(menuGroups, partialRule, OPEN_ROLE);
  assert.deepEqual(asPairs(visible), [[COMMON_GROUP, ['대시보드', 'SBF 마스터']]]);
});

test('TC-2.5-12 deriveMenuGroups/openExposureRule로 파생한 데이터도 동일한 세 그룹을 노출한다', () => {
  // 어댑터 파생 경로(기본 인자)로도 동일 결과가 나오는지 확인 (Req 2.1~2.3, 3.2)
  const groups = deriveMenuGroups();
  const rule = openExposureRule();
  const visible = computeVisibleGroups(groups, [rule], OPEN_ROLE);
  assert.deepEqual(asPairs(visible), [
    [COMMON_GROUP, ['대시보드', 'SBF 마스터']],
    [REQUESTER_GROUP, ['변경요청', '내 요청']],
    [REVIEWER_GROUP, ['처리 업무', '변경이력', '데이터 가져오기', '배포관리']],
  ]);
});
