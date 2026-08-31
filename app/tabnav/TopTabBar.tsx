// Feature: horizontal-tab-navigation
// Top_Tab_Bar 표현 계층 컴포넌트.
// 계산 계층(buildRenderSequence, resolveActiveTab)의 결과를 받아 화면 상단 가로 한 줄
// 탭 내비게이션을 렌더한다. "무엇을 보여줄지"는 계산 계층이 결정하고, 이 컴포넌트는
// "어떻게 그릴지"만 담당한다. (설계 "Components and Interfaces → Top_Tab_Bar" 절 기준)
//
// Requirements: 1.3, 2.5, 4.1, 5.2, 1.6, 3.5
//
// ── CSS 클래스 계약 (스타일은 별도 태스크 6.2에서 app/globals.css에 정의) ──────────────
//   top-tab-bar            : 탭 바 최상위 컨테이너(<nav>). topbar 행 중앙에 인라인 배치/단일 행/가로 스크롤 대상.
//   top-tab-bar__list      : 그룹 박스를 왼쪽→오른쪽으로 담는 단일 행 트랙.
//   top-tab-group          : 하나의 Menu_Group을 감싸는 경계 박스(role="group"). 그룹 내 Tab을 좌→우로 담는다.
//   top-tab                : 개별 Tab 버튼.
//   top-tab--active        : 현재 activeView와 일치하는 Active_Tab에 추가되는 modifier.
//   top-tab-bar--empty     : 노출 탭이 0개인 빈 탭 바 영역(그룹은 있으나 탭 0개) modifier. (Req 1.6)
//   top-tab-bar__empty-notice : 사용 가능한 메뉴가 없을 때의 안내 문구. (Req 3.5)
//
//   ※ 그룹 시각 구분은 기존 얇은 세로 Group_Divider 선 대신 그룹별 경계 박스(top-tab-group)로
//     표현한다. 순수 계산 계층(buildRenderSequence)의 구분자 산출/속성은 그대로 유지되지만,
//     표현 계층(TopTabBar)은 더 이상 렌더 시퀀스를 사용하지 않고 visibleGroups를 직접 순회한다.
// ────────────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import type { Tab, VisibleGroup } from './types';
import { resolveActiveTab } from './resolveActiveTab';

/**
 * 역할 미정의/허용 그룹 없음일 때 표시하는 안내 문구. (Req 3.5)
 */
export const NO_MENU_AVAILABLE_LABEL = '사용 가능한 메뉴가 없음';

/**
 * 저장된 그룹 라벨(groupLabel)을 화면에 표시할 대괄호 라벨로 변환하는 순수 헬퍼.
 * 알 수 없는 라벨은 `[${groupLabel}]` 형태로 폴백한다.
 */
export function formatGroupLabel(groupLabel: string): string {
  switch (groupLabel) {
    case '공통 메뉴':
      return '[공통메뉴]';
    case '변경요청자 메뉴':
      return '[변경요청자메뉴]';
    case '검토자/관리자 메뉴':
      return '[검토자/관리자 메뉴]';
    default:
      return `[${groupLabel}]`;
  }
}

export type TopTabBarProps = {
  /** 노출 계산 결과(computeVisibleGroups 결과). Menus_Data 정의 순서를 유지한다. */
  visibleGroups: readonly VisibleGroup[];
  /** 현재 `view` 상태 문자열. 일치하는 Tab이 Active_Tab이 된다. */
  activeView: string | null | undefined;
  /** Tab 선택 시 호출. 배선 계층에서 resolveViewForTab → setView로 연결한다. */
  onSelectTab: (tab: Tab) => void;
  /**
   * (선택) 개별 Tab에 표시할 카운트 배지를 렌더한다. (구 사이드바 '처리 업무' 대기 건수 배지 UX 복원)
   * - 배지가 없는 탭에 대해서는 `null`/`undefined`를 반환하면 배지를 그리지 않는다.
   * - 배지 마크업(예: `<em>...</em>`)은 배선 계층(page.tsx)에서 정의하여 표현 데이터를
   *   계산 계층과 분리한다. 반환된 노드는 Tab 버튼 라벨 뒤에 렌더된다.
   */
  renderBadge?: (tab: Tab) => ReactNode;
};

/**
 * Top_Tab_Bar 컴포넌트.
 *
 * 렌더 규칙:
 * - visibleGroups 순서대로 각 그룹을 경계 박스(top-tab-group)로 렌더하고, 박스 안에 그 그룹의
 *   Tab을 좌→우 순서로 배치한다. 그룹 박스들이 왼쪽→오른쪽으로 나란히 놓여 시각적 그룹 구분을
 *   제공한다(기존 세로 Group_Divider 선을 대체). (Req 1.3, 4.1, 2.5)
 * - activeView와 View 식별자가 일치하는 Tab에 Active_Tab 스타일(top-tab--active)과
 *   aria-current="page"를 적용한다. (Req 5.2)
 * - 두 가지 빈 상태를 구분한다:
 *   (a) visibleGroups는 있으나 노출 탭이 0개 → Tab을 표시하지 않고 빈 탭 바 영역만 유지. (Req 1.6)
 *   (b) 노출 그룹 자체가 없음(역할 미정의/허용 그룹 없음) → "사용 가능한 메뉴가 없음" 안내. (Req 3.5)
 */
export function TopTabBar({ visibleGroups, activeView, onSelectTab, renderBadge }: TopTabBarProps) {
  // (b) 노출 그룹이 하나도 없음 → 사용 가능한 메뉴 없음 안내. (Req 3.5)
  if (visibleGroups.length === 0) {
    return (
      <nav className="top-tab-bar top-tab-bar--empty" aria-label="주 메뉴">
        <p className="top-tab-bar__empty-notice" role="note">
          {NO_MENU_AVAILABLE_LABEL}
        </p>
      </nav>
    );
  }

  // 현재 View에 매핑되는 Active_Tab을 판정한다(있으면 정확히 1개, 없으면 undefined). (Req 5.2)
  const activeTab = resolveActiveTab(visibleGroups, activeView);
  const activeViewId = activeTab?.viewId;

  // (a) 그룹은 있으나 노출 탭이 0개 → 빈 탭 바 영역만 유지(안내 문구 없음). (Req 1.6)
  const hasTabs = visibleGroups.some((group) => group.tabs.length > 0);

  return (
    <nav
      className={hasTabs ? 'top-tab-bar' : 'top-tab-bar top-tab-bar--empty'}
      aria-label="주 메뉴"
    >
      <div className="top-tab-bar__list">
        {visibleGroups.map((group, groupIndex) => (
          // Menu_Group 경계 박스. 시각적 그룹 구분을 담당한다(구 Group_Divider 대체). (Req 2.5, 4.1)
          <div
            className="top-tab-group"
            role="group"
            aria-label={group.groupLabel}
            key={`group-${group.groupLabel}-${groupIndex}`}
          >
            <span className="top-tab-group__label" aria-hidden="true">
              {formatGroupLabel(group.groupLabel)}
            </span>
            {group.tabs.map((tab, tabIndex) => {
              const isActive = activeViewId != null && tab.viewId === activeViewId;
              // (선택) 카운트 배지. 배선 계층이 노드를 반환할 때만 라벨 뒤에 렌더한다.
              const badge = renderBadge ? renderBadge(tab) : null;

              return (
                <button
                  key={`tab-${group.groupLabel}-${tab.viewId}-${tabIndex}`}
                  type="button"
                  className={isActive ? 'top-tab top-tab--active' : 'top-tab'}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onSelectTab(tab)}
                >
                  {tab.label}
                  {badge != null && badge !== false ? (
                    <span className="top-tab__badge">
                      {badge}
                      <span className="top-tab__badge-hint"> 건 대기</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

export default TopTabBar;
