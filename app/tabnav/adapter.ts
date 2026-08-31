// Feature: horizontal-tab-navigation
// Menus_Data(app/data.ts의 menus 배열)를 계산 계층 데이터 모델로 변환하는 어댑터와
// 권한 미구현 "open" 상태의 Role_Exposure_Rule을 데이터로 정의한다.

import { menus } from '../data';
import type { Menu_Group, Role_Exposure_Rule, Tab } from './types';

/**
 * Top_Tab_Bar에 독립 Tab으로 노출하지 않는 라벨.
 * 'SBF 반영 작업'은 '처리 업무'를 통한 진입/복귀만 지원한다. (Req 6.1)
 */
export const EXCLUDED_TAB_LABELS: readonly string[] = ['SBF 반영 작업'];

/**
 * 권한 미구현 상태를 나타내는 open 역할 식별자.
 */
export const OPEN_ROLE = 'open';

/**
 * Menus_Data(menus 배열)를 Menu_Group[]로 변환한다.
 * - 그룹/탭 순서는 Menus_Data 정의 순서를 그대로 파생한다.
 * - 'SBF 반영 작업' 등 제외 대상 라벨은 어떤 그룹의 탭 목록에도 포함하지 않는다. (Req 6.1)
 * - viewId는 현재 항등 매핑이므로 label과 동일하다.
 */
export function deriveMenuGroups(source: typeof menus = menus): Menu_Group[] {
  return source.map(([groupLabel, tabLabels], groupIndex) => {
    const tabs: Tab[] = tabLabels
      .filter((label) => !EXCLUDED_TAB_LABELS.includes(label))
      .map((label, tabIndex) => ({
        label,
        viewId: label,
        order: tabIndex,
      }));
    return {
      groupLabel,
      order: groupIndex,
      tabs,
    };
  });
}

/**
 * Menus_Data 정의 순서를 따르는 전체 그룹 라벨 목록.
 */
export function allGroupLabels(source: typeof menus = menus): string[] {
  return source.map(([groupLabel]) => groupLabel);
}

/**
 * 권한 미구현(open) 상태의 노출 규칙.
 * 모든 역할이 세 그룹 전체에 접근한다는 의미로, open 역할에 전체 그룹을 허용한다.
 * 향후 역할 체계가 도입되면 이 규칙 데이터만 수정하여 그룹 단위 조건부 노출로 확장한다. (Req 3.2, 3.3)
 */
export function openExposureRule(source: typeof menus = menus): Role_Exposure_Rule {
  return {
    role: OPEN_ROLE,
    allowedGroups: allGroupLabels(source),
  };
}

/**
 * 현재(권한 미구현) 시스템에서 사용하는 노출 규칙 집합.
 */
export const exposureRules: Role_Exposure_Rule[] = [openExposureRule()];

/**
 * Menus_Data에서 파생한 그룹/탭 정의(제외 라벨 반영).
 */
export const menuGroups: Menu_Group[] = deriveMenuGroups();
