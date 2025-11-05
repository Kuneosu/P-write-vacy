# P-write-vacy (React)

프라이버시를 보호하는 텍스트 에디터 - 옆에서 보는 사람으로부터 글을 보호합니다.

## 주요 기능

### 프라이버시 보호
- **중심시야 최적화**: 커서/마우스 주변만 선명하게 표시하고 나머지는 블러 처리
- **실시간 포커스 추적**: 텍스트 입력 시 커서를 자동으로 따라가는 포커스
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

### 키보드 단축키
- **파일 탐색기**: Ctrl+S로 열기/닫기 토글
- **프라이버시 모드**: Ctrl+H로 빠른 토글
- **포커스 크기 조절**:
  - Ctrl+9: 가로 크기 감소
  - Ctrl+0: 가로 크기 증가
  - Ctrl+-: 세로 크기 감소
  - Ctrl+=: 세로 크기 증가

## 기술 스택

- React 18 + TypeScript
- Vite (빌드 도구)
- Electron (데스크톱 앱)
- TailwindCSS (스타일링)
- React Markdown + remark-gfm (마크다운 렌더링)
- 순수 브라우저 API (Selection API, ContentEditable)

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

1. **폴더 선택**: 초기 화면에서 "폴더 선택하기" 버튼 클릭
2. **파일 탐색**: 좌측 파일 탐색기에서 파일 선택
3. **텍스트 편집**: 에디터에 글 입력 (커서 주변만 선명하게 표시)
4. **설정 조정**: 우측 상단 설정 버튼(⚙️)으로 세부 설정 변경
5. **마크다운 뷰어**: 마크다운 파일 선택 시 우측 상단에 뷰어 토글 버튼 표시
6. **프라이버시 모드**: Ctrl+H 또는 눈 아이콘 버튼으로 토글

## 키보드 단축키

- `Ctrl + S`: 파일 탐색기 열기/닫기
- `Ctrl + H`: 프라이버시 모드 토글
- `Ctrl + 9`: 포커스 가로 크기 감소
- `Ctrl + 0`: 포커스 가로 크기 증가
- `Ctrl + -`: 포커스 세로 크기 감소
- `Ctrl + =`: 포커스 세로 크기 증가

## 프로젝트 구조

```
src/
├── components/
│   ├── Editor.tsx           # 메인 텍스트 에디터
│   ├── FocusOverlay.tsx     # 프라이버시 블러 오버레이
│   ├── FileExplorer.tsx     # 파일 탐색기
│   ├── MarkdownViewer.tsx   # 마크다운 뷰어
│   ├── Sidebar.tsx          # 설정 패널
│   └── SettingsButton.tsx   # 설정 버튼
├── hooks/
│   └── useCaretTracking.ts  # 커서 위치 추적 훅
├── types/
│   ├── index.ts             # TypeScript 타입 정의
│   └── electron.d.ts        # Electron API 타입
├── App.tsx                  # 메인 앱 컴포넌트
└── main.tsx                 # 진입점
```

## 빌드 결과물

Electron 앱 빌드 시 생성되는 파일:
- **macOS**: DMG 파일
- **Windows**: NSIS 인스톨러
- **Linux**: AppImage

## 라이선스

MIT
