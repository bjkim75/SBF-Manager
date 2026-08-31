// Feature: horizontal-tab-navigation
// 계산 계층 공개 진입점(barrel).

export type { Tab, Menu_Group, Role_Exposure_Rule, VisibleGroup } from './types';
export {
  EXCLUDED_TAB_LABELS,
  OPEN_ROLE,
  deriveMenuGroups,
  allGroupLabels,
  openExposureRule,
  exposureRules,
  menuGroups,
} from './adapter';
export { computeVisibleGroups } from './computeVisibleGroups';

export type { ResolveViewResult } from './resolveViewForTab';
export { resolveViewForTab } from './resolveViewForTab';

export { resolveActiveTab } from './resolveActiveTab';

export type { RenderItem } from './renderSequence';
export { buildRenderSequence } from './renderSequence';

export { reselectActiveTab } from './reselectActiveTab';

export type { TopTabBarProps } from './TopTabBar';
export { TopTabBar, NO_MENU_AVAILABLE_LABEL } from './TopTabBar';