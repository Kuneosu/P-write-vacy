// @testing-library/jest-dom의 custom matchers 추가
require('@testing-library/jest-dom');

// Electron API mock 설정
const { setupElectronMock } = require('./__mocks__/electron.ts');
setupElectronMock();

// React의 act() 경고 숨기기
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('act(...)') ||
       args[0].includes('ReactDOM.render'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// window.matchMedia mock (일부 컴포넌트에서 사용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Selection API mock (caret tracking에서 사용)
global.Selection = class Selection {
  constructor() {
    this.rangeCount = 0;
    this.anchorNode = null;
    this.anchorOffset = 0;
    this.focusNode = null;
    this.focusOffset = 0;
  }
  getRangeAt() {
    return {
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
      }),
      getClientRects: () => [],
      collapsed: true,
      startContainer: document.createElement('div'),
      startOffset: 0,
      endContainer: document.createElement('div'),
      endOffset: 0,
    };
  }
  removeAllRanges() {}
  addRange() {}
};

document.getSelection = () => new Selection();

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
