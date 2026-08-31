// Feature: horizontal-tab-navigation
// Task 8.1: React 렌더 테스트를 위한 공용 jsdom 환경 설정 헬퍼.
//
// 목적
//  - 프로젝트는 jest/vitest가 없고 `node --test`(+ tsx 로더)로 테스트를 실행한다.
//  - @testing-library/react는 DOM 전역(document/window)을 필요로 하므로, 이 모듈을
//    테스트 파일 "가장 위에서" import 하여 jsdom 기반 전역 환경을 먼저 구성한다.
//  - 태스크 8.2~8.4의 렌더/통합 테스트도 이 헬퍼를 재사용한다.
//
// 사용법(테스트 파일 최상단):
//   import './jsdom-setup.mjs';           // 반드시 @testing-library/react import 보다 먼저
//   import { render } from '@testing-library/react';
//
// 실행 명령:
//   node --import tsx --test tests/tabnav-render-8-1.test.mjs
//   (tsx 로더가 .ts/.tsx(JSX 포함) 트랜스파일을 담당한다. --experimental-strip-types는
//    JSX를 처리하지 못하므로 렌더 테스트에는 tsx 로더가 필수다.)

import { JSDOM } from 'jsdom';

// 이미 DOM 전역이 구성돼 있으면(중복 import) 재설정하지 않는다.
if (!globalThis.window || !globalThis.document) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });

  const { window } = dom;

  globalThis.window = window;
  globalThis.document = window.document;

  // Node 22의 globalThis.navigator는 읽기 전용 getter라 직접 재할당하면 예외가 난다.
  // 이미 navigator가 있으면 그대로 두고, 없거나 설정 가능하면 jsdom navigator로 정의한다.
  if (!globalThis.navigator) {
    Object.defineProperty(globalThis, 'navigator', {
      value: window.navigator,
      configurable: true,
      writable: true,
    });
  }

  // React DOM / Testing Library가 참조할 수 있는 표준 DOM 전역들을 window에서 승격.
  const globalKeys = [
    'HTMLElement',
    'Element',
    'Node',
    'Event',
    'CustomEvent',
    'MouseEvent',
    'KeyboardEvent',
    'getComputedStyle',
    'DocumentFragment',
    'DOMParser',
    'NodeList',
    'requestAnimationFrame',
    'cancelAnimationFrame',
  ];
  for (const key of globalKeys) {
    if (globalThis[key] === undefined && window[key] !== undefined) {
      globalThis[key] = window[key];
    }
  }

  // React 19는 개발 빌드에서 IS_REACT_ACT_ENVIRONMENT 플래그를 참조한다.
  // render/act가 경고 없이 동작하도록 테스트 환경 플래그를 켠다.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}

export {};
