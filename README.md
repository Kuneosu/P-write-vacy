# P-write-vacy (React)

프라이버시를 보호하는 텍스트 에디터 - 옆에서 보는 사람으로부터 글을 보호합니다.

## 주요 기능

### 프라이버시 보호
- **중심시야 최적화**: 커서/마우스 주변만 선명하게 표시하고 나머지는 블러 처리
- **실시간 포커스 추적**: 텍스트 입력 시 커서를 자동으로 따라가는 포커스
- **프리셋 기능**: 자주 사용하는 설정을 프리셋으로 저장 (최대 3개)
- **커스터마이징 가능한 설정**:
  - 포커스 영역 크기 조절 (가로/세로)
  - 포커스 모양 선택 (타원형/원형)
  - 블러 영역 색상 및 투명도 설정
  - 블러 번짐 정도 및 강도 조절
  - 배경색 및 텍스트 색상 커스터마이징

### 파일 관리
- **파일 탐색기**: 폴더 선택 후 파일 트리 구조 탐색
- **파일/폴더 생성**: 새 파일 및 폴더 생성 기능
- **자동 저장**: 파일 수정 시 자동으로 저장 (1초 후)
- **정렬 기능**: 파일 이름, 수정일, 생성일 기준 정렬

### 마크다운 지원
- **마크다운 뷰어**: 마크다운 파일의 렌더링된 결과 확인
- **GitHub Flavored Markdown**: 테이블, 체크박스 등 GFM 지원
- **뷰어/편집 모드 토글**: 마크다운 파일 편집과 미리보기 전환
- **이미지 지연 로딩**: 대용량 마크다운 파일 성능 최적화

### 국제화
- **다국어 지원**: 한국어, 영어 완전 지원
- **실시간 언어 전환**: 설정 패널에서 즉시 언어 변경
- **모든 UI 텍스트 번역**: 버튼, 메뉴, 토스트 메시지 등 완전 번역

### 온보딩
- **첫 실행 가이드**: 처음 사용자를 위한 4페이지 온보딩
- **주요 기능 소개**: 프라이버시 모드, 마크다운 뷰어, 프리셋 기능
- **비디오 데모**: 실제 사용 예시를 보여주는 영상
- **키보드 네비게이션**: 화살표 키, Enter, Escape로 탐색

### 키보드 단축키
- **파일 탐색기**: `Ctrl+S`로 열기/닫기 토글
- **프라이버시 모드**: `Ctrl+H`로 빠른 토글
- **온보딩 다시보기**: 삭제된 localStorage 키로 재실행 가능

## 기술 스택

- React 18 + TypeScript
- Vite (빌드 도구)
- Electron (데스크톱 앱)
- TailwindCSS (스타일링)
- React Markdown + remark-gfm (마크다운 렌더링)
- react-i18next (국제화)
- Jest + React Testing Library (테스트)
- Cypress (E2E 테스트)
- 순수 브라우저 API (Selection API, ContentEditable)

## 테스트

프로젝트는 포괄적인 테스트 커버리지를 갖추고 있습니다:

- **총 테스트**: 106개
- **테스트 커버리지**: 89.37%
- **테스트 스위트**: 6개

```bash
# 테스트 실행
npm test

# Watch 모드로 테스트
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage

# 상세 출력 모드
npm run test:verbose
```

### 테스트 구조

- `useFileTree.test.ts` - 파일 트리 관리 (12개 테스트)
- `useFileOperations.test.ts` - CRUD 작업 (32개 테스트)
- `useFileSelection.test.ts` - 다중 선택 (12개 테스트)
- `useDragAndDrop.test.ts` - 드래그 앤 드롭 (18개 테스트)
- `useKeyboardShortcuts.test.ts` - 키보드 단축키 (22개 테스트)
- `FileExplorer.test.tsx` - 통합 테스트 (10개 테스트)

## 시작하기

### 웹 버전

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

### Electron 데스크톱 앱

```bash
# 의존성 설치
npm install

# Electron 개발 모드 실행
npm run electron:dev

# Electron 앱 빌드
npm run electron:build
```

## 사용 방법

### 첫 실행
1. **온보딩 화면**: 앱을 처음 실행하면 4페이지 온보딩이 표시됩니다
   - Welcome 페이지에서 앱 소개 확인
   - 프라이버시 모드 데모 시청
   - 마크다운 뷰어 기능 확인
   - 프리셋 기능 알아보기
   - 화살표 키로 탐색, Enter로 시작하기

### 기본 사용
1. **폴더 선택**: 초기 화면에서 "폴더 선택하기" 버튼 클릭
2. **파일 탐색**: `Ctrl+S`로 파일 탐색기 열고 파일 선택
3. **텍스트 편집**: 에디터에 글 입력 (커서 주변만 선명하게 표시)
4. **프라이버시 모드**: `Ctrl+H`로 빠르게 켜고 끄기
5. **설정 조정**: 우측 상단 설정 버튼(⚙️)으로 세부 설정 변경
6. **프리셋 저장**: 자주 사용하는 설정을 프리셋으로 저장 (최대 3개)
7. **마크다운 뷰어**: 마크다운 파일 선택 시 우측 상단에 뷰어 토글 버튼 표시
8. **언어 변경**: 설정 패널 하단에서 한국어/영어 전환

## 키보드 단축키

### 전역 단축키
- `Ctrl + S`: 파일 탐색기 열기/닫기
- `Ctrl + H`: 프라이버시 모드 토글

### 온보딩 화면
- `Arrow Left/Right`: 이전/다음 페이지
- `Enter`: 마지막 페이지에서 시작하기
- `Escape`: 온보딩 건너뛰기

### 패널 및 다이얼로그
- `Escape`: 열린 패널 닫기
- `Tab`: 포커스 이동 (포커스 트랩)

## 프로젝트 구조

```
src/
├── components/
│   ├── Editor.tsx              # 메인 텍스트 에디터
│   ├── FocusOverlay.tsx        # 프라이버시 블러 오버레이
│   ├── Onboarding.tsx          # 온보딩 화면 (4페이지)
│   ├── FileExplorer/           # 파일 탐색기 (모듈화)
│   │   ├── FileExplorer.tsx
│   │   ├── components/         # UI 컴포넌트
│   │   ├── hooks/              # 커스텀 훅
│   │   ├── utils/              # 유틸리티 함수
│   │   └── __tests__/          # 테스트 파일
│   ├── MarkdownViewer.tsx      # 마크다운 뷰어
│   ├── Sidebar.tsx             # 설정 패널
│   ├── SettingsButton.tsx      # 설정 버튼
│   ├── SaveStatus.tsx          # 저장 상태 표시
│   ├── Toast.tsx               # 토스트 알림
│   ├── ErrorBoundary.tsx       # 에러 처리
│   ├── Tooltip.tsx             # 도움말
│   ├── ContextMenu.tsx         # 파일 우클릭 메뉴
│   └── __tests__/              # 컴포넌트 테스트
├── hooks/
│   └── useCaretTracking.ts     # 커서 위치 추적 훅
├── contexts/
│   └── ToastContext.tsx        # 토스트 전역 상태
├── i18n/
│   ├── config.ts               # i18n 설정
│   └── locales/
│       ├── ko.json             # 한국어 번역
│       └── en.json             # 영어 번역
├── test-utils/
│   └── testUtils.tsx           # 테스트 유틸리티
├── types/
│   ├── index.ts                # TypeScript 타입 정의
│   └── electron.d.ts           # Electron API 타입
├── __mocks__/
│   └── electron.ts             # Electron API 모킹
├── App.tsx                     # 메인 앱 컴포넌트
└── main.tsx                    # 진입점
```

## 빌드 결과물

Electron 앱 빌드 시 생성되는 파일:
- **macOS**: DMG 파일
- **Windows**: NSIS 인스톨러
- **Linux**: AppImage

## 라이선스

MIT
