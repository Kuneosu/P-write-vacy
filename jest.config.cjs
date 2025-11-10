/** @type {import('jest').Config} */
module.exports = {
  // TypeScript 지원
  preset: 'ts-jest',

  // React 테스트를 위한 jsdom 환경
  testEnvironment: 'jsdom',

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}'
  ],

  // setup 파일 로드
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],

  // 출력 설정
  verbose: false,
  silent: false,

  // 모듈 경로 매핑 (Vite의 @ alias 등)
  moduleNameMapper: {
    // CSS 모듈 mock
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // 이미지/폰트 파일 mock
    '\\.(jpg|jpeg|png|gif|svg|woff|woff2|eot|ttf|otf)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // TypeScript 변환 설정
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
      }
    }]
  },

  // node_modules 무시 (일부 ES 모듈 제외)
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|unified|bail|is-plain-obj|trough|vfile|unist-.*|micromark.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|pretty-bytes)/)'
  ],

  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],

  // 테스트 타임아웃
  testTimeout: 10000,

  // 모듈 파일 확장자
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
