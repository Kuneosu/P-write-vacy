# P-write-vacy React - TODO List

**현재 버전**: v0.3.0
**목표 버전**: v1.0.0
**마지막 업데이트**: 2025-01-07

---

## ✅ Phase 2: Architecture Refactoring (v0.3.0) - 완료!

### ✅ Critical: FileExplorer 리팩토링 - 완료!

**현재 문제**:
- FileExplorer.tsx가 1,497줄로 과도하게 복잡함
- 파일 관리, 컨텍스트 메뉴, 다중 선택, 드래그 앤 드롭이 모두 한 파일에 집중
- 유지보수 및 테스트가 매우 어려움
- 버그 위험도가 높음

**목표 구조**:
```
src/components/FileExplorer/
├── FileExplorer.tsx              (메인 컨테이너, ~200줄)
├── FileList.tsx                  (파일 목록 렌더링)
├── FileItem.tsx                  (개별 파일/폴더 항목)
├── FileContextMenu.tsx           (우클릭 메뉴)
├── hooks/
│   ├── useFileOperations.ts     (삭제, 복제, 이름변경)
│   ├── useFileSelection.ts      (다중 선택 로직)
│   └── useDragAndDrop.ts        (드래그 앤 드롭)
└── __tests__/
    ├── FileOperations.test.ts
    ├── FileSelection.test.ts
    └── DragAndDrop.test.ts
```

**작업 순서**:
1. [x] FileExplorer 현재 상태 분석 및 분할 계획 수립
2. [x] FileItem 컴포넌트 분리 (단일 파일/폴더 렌더링)
3. [x] FileList 컴포넌트 분리 (목록 렌더링)
4. [x] useFileOperations hook 분리 (CRUD 작업)
5. [x] useFileSelection hook 분리 (다중 선택)
6. [x] useDragAndDrop hook 분리 (DnD 로직)
7. [x] FileContextMenu 컴포넌트 분리
8. [x] 메인 FileExplorer 리팩토링 (상태 관리만)
9. [x] 기능 테스트 및 버그 수정
10. [x] 단위 테스트 작성 (106개 테스트, 89% 커버리지)

**예상 효과**:
- 코드 가독성 대폭 향상
- 유지보수 용이성 증가
- 테스트 가능성 확보
- 버그 감소

---

### 🟡 High Priority: 성능 최적화 (예상 2-3일)

#### 1. Caret Tracking 최적화
**현재 문제**: 매 input 이벤트마다 DOM 조작 발생

**개선 방안**:
```typescript
// useCaretTracking.ts 개선
import { throttle } from 'lodash'; // 또는 직접 구현

const updateCaretPosition = useCallback(
  throttle((coords: CaretPosition) => {
    setCaretPosition(coords);
  }, 16), // ~60fps
  []
);
```

**작업**:
- [ ] throttle 함수 구현 또는 lodash 설치
- [ ] useCaretTracking에 throttle 적용
- [ ] 성능 테스트 (before/after 비교)

#### 2. FocusOverlay 리렌더링 최적화
**현재 문제**: maskStyles 객체가 매번 새로 생성됨

**개선 방안**:
```typescript
const maskStyles = useMemo(
  () => getMask(settings, caretPosition),
  [settings.radiusX, settings.radiusY, caretPosition.x, caretPosition.y]
);
```

**작업**:
- [ ] useMemo로 maskStyles 메모이제이션
- [ ] 불필요한 재렌더링 방지
- [ ] 성능 측정 및 검증

#### 3. FileExplorer 가상 스크롤링
**현재 문제**: 1,000+ 파일 폴더에서 렌더링 지연

**개선 방안**:
- react-window 또는 react-virtualized 사용
- 화면에 보이는 항목만 렌더링

**작업**:
- [ ] react-window 라이브러리 조사
- [ ] PoC(Proof of Concept) 구현
- [ ] FileList에 가상 스크롤링 적용
- [ ] 성능 벤치마크 (1000+ 파일)

#### 4. 이미지 로딩 최적화 (마크다운)
**작업**:
- [ ] 원격 이미지 로딩 지원
- [ ] 이미지 lazy loading 구현
- [ ] 대용량 이미지 리사이징 (Electron)

---

### ✅ High Priority: 테스트 커버리지 구축 - 완료!

#### Jest 설정
**작업**:
- [x] Jest 및 Testing Library 설치
- [x] jest.config.js 설정
- [x] 테스트 환경 구성 (Electron mock)

#### 우선 순위 테스트 작성
**순서대로 진행**:

1. **FileOperations (High Risk)** - 완료 ✅
   - [x] 파일 생성 테스트 (32개 테스트)
   - [x] 파일 삭제 테스트
   - [x] 파일 이름 변경 테스트
   - [x] 파일 복제 테스트
   - [x] 에러 케이스 테스트

2. **FileSelection (State Complexity)** - 완료 ✅
   - [x] 단일 선택 테스트 (12개 테스트)
   - [x] 다중 선택 (Cmd/Ctrl + 클릭) 테스트
   - [x] 선택 해제 테스트
   - [x] 전체 선택/해제 테스트

3. **FileTree (Core Feature)** - 완료 ✅
   - [x] 파일 로딩 및 정렬 테스트 (12개 테스트)
   - [x] 폴더 확장/축소 테스트
   - [x] 경계 케이스 테스트

4. **DragAndDrop (Complex Logic)** - 완료 ✅
   - [x] 드래그 앤 드롭 테스트 (18개 테스트)
   - [x] 자동 확장 테스트
   - [x] 멀티 선택 드래그 테스트

5. **KeyboardShortcuts** - 완료 ✅
   - [x] 키보드 단축키 테스트 (22개 테스트)
   - [x] 플랫폼별 테스트 (Mac/Windows)
   - [x] 이벤트 리스너 정리 테스트

6. **FileExplorer Integration** - 완료 ✅
   - [x] 통합 테스트 (10개 테스트)
   - [x] 전체 워크플로우 검증

**결과**: 89.37% 코드 커버리지 달성! (목표 60% 초과 달성)

---

### 🟢 Medium Priority: 접근성 개선 (예상 2일)

#### WCAG 2.1 AA 준수
**작업**:
- [ ] 시맨틱 HTML 개선 (role, aria-label 추가)
- [ ] 키보드 네비게이션 완성
  - [ ] Tab 순서 정의
  - [ ] Shift+Tab 지원
  - [ ] Arrow 키 파일 탐색
- [ ] 포커스 표시 스타일 추가 (:focus-visible)
- [ ] 색상 대비 검증 (WCAG 도구 사용)
- [ ] 스크린 리더 테스트 (macOS VoiceOver)

**예시**:
```tsx
// 개선 전
<div className="file-list">
  {files.map(file => (
    <button onClick={() => onSelect(file)}>{file.name}</button>
  ))}
</div>

// 개선 후
<div className="file-list" role="listbox" aria-label="파일 목록">
  {files.map((file, index) => (
    <button
      key={file.path}
      role="option"
      aria-selected={selectedFiles.includes(file.path)}
      aria-label={`${file.name} ${file.isDirectory ? '폴더' : '파일'}`}
      onClick={() => onSelect(file)}
      onKeyDown={(e) => handleKeyNavigation(e, index)}
      className="focus:ring-2 focus:ring-blue-500"
    >
      {file.name}
    </button>
  ))}
</div>
```

---

## 🎯 Phase 3: UX/Features (v0.4.0)

### 다국어 지원 (i18n)
**작업**:
- [ ] react-i18next 설치 및 설정
- [ ] 한국어 번역 파일 생성 (ko.json)
- [ ] 영어 번역 파일 생성 (en.json)
- [ ] 모든 UI 텍스트 i18n 키로 변경
- [ ] 언어 선택 UI 추가 (Sidebar)
- [ ] localStorage에 언어 설정 저장

### 마크다운 렌더링 확장
**작업**:
- [ ] 이미지 표시 지원
- [ ] 코드 블록 문법 강조 (Prism.js 또는 highlight.js)
- [ ] TOC(Table of Contents) 자동 생성
- [ ] 체크박스 지원
- [ ] 수학 수식 렌더링 (KaTeX)

### E2E 테스트 (Cypress)
**작업**:
- [ ] Cypress 설치 및 설정
- [ ] 주요 사용자 시나리오 테스트 작성
  - [ ] 폴더 선택 → 파일 선택 → 편집 → 저장
  - [ ] 파일 생성 → 이름 입력 → 저장
  - [ ] 파일 삭제 흐름
  - [ ] 프라이버시 모드 토글
  - [ ] 설정 변경 및 프리셋 저장

### 사용자 문서
**작업**:
- [ ] 상세한 사용자 매뉴얼 작성 (MANUAL.md)
- [ ] 스크린샷/GIF 가이드 추가
- [ ] 자주 묻는 질문(FAQ) 작성
- [ ] 키보드 단축키 치트 시트

---

## 🎯 Phase 4: Release Preparation (v1.0.0)

### 안정성 테스트
**작업**:
- [ ] 전체 기능 수동 테스트
- [ ] 엣지 케이스 테스트
- [ ] 크로스 플랫폼 테스트 (macOS, Windows, Linux)
- [ ] 메모리 누수 검사
- [ ] 장시간 실행 테스트

### 성능 벤치마크
**작업**:
- [ ] 파일 로딩 속도 측정
- [ ] 렌더링 성능 프로파일링
- [ ] 메모리 사용량 측정
- [ ] 번들 크기 최적화

### 보안 감사
**작업**:
- [ ] npm audit 실행 및 취약점 수정
- [ ] Electron 보안 체크리스트 검증
- [ ] IPC 핸들러 보안 검토
- [ ] 경로 검증 재확인

### 최종 리뷰
**작업**:
- [ ] 코드 리뷰
- [ ] 문서 업데이트
- [ ] 라이선스 및 저작권 표시
- [ ] 릴리스 노트 작성
- [ ] GitHub Release 준비

---

## 📝 추가 개선 아이디어 (선택 사항)

### Nice to Have
- [ ] 플러그인 시스템 설계
- [ ] 다크 모드 지원
- [ ] 커스텀 테마 시스템
- [ ] 클라우드 동기화 (선택적)
- [ ] 공동 편집 모드 (WebSocket)
- [ ] 버전 히스토리 추적 (Git 통합)
- [ ] 전체 텍스트 검색 기능
- [ ] 파일 북마크 기능
- [ ] 최근 파일 목록

---

## 🚀 즉시 착수 가능한 항목 (Quick Wins)

### 1. Caret Tracking Throttle (1시간)
가장 빠르게 성능 개선을 체감할 수 있는 작업

### 2. FocusOverlay useMemo (30분)
간단하지만 효과적인 최적화

### 3. 접근성 기본 개선 (2시간)
- aria-label 추가
- :focus-visible 스타일
- Tab 순서 정의

### 4. 에러 메시지 개선 (1시간)
Toast에 표시되는 에러 메시지를 더 사용자 친화적으로

---

## 📊 진행 상황 요약

```
Phase 1 (v0.2.0) - Critical Issues:     ✅ 100% 완료
Phase 2 (v0.3.0) - Architecture:       ✅ 100% 완료!
  ├─ FileExplorer 리팩토링:            ✅ 완료 (78% 코드 감소)
  ├─ 테스트 커버리지:                   ✅ 완료 (89.37%, 106개 테스트)
  └─ 성능 최적화:                      🔜 다음 단계
Phase 3 (v0.4.0) - UX/Features:        🔜 진행 예정
Phase 4 (v1.0.0) - Release:            ⬜ 0%

전체 v1.0.0 달성률: 60%
```

---

## 🎯 다음 작업 추천 순서 (Phase 3 & 4)

1. **성능 최적화** (Quick Wins 먼저, 1-2일)
   - Caret tracking throttle
   - FocusOverlay useMemo
   - 대용량 폴더 가상 스크롤링

2. **접근성 개선** (WCAG 준수, 2일)
   - 키보드 네비게이션 완성
   - aria-label 보완
   - 포커스 관리

3. **다국어 지원** (UX 향상, 1-2일)
   - react-i18next 설정
   - 한영 번역

4. **마크다운 확장** (기능 완성도, 2일)
   - 이미지 지원
   - 코드 문법 강조

5. **최종 테스트 및 릴리스** (안정성, 3-4일)
   - E2E 테스트
   - 보안 감사
   - 성능 벤치마크

**예상 총 소요 시간**: 약 2-3주

---

**작성일**: 2025-11-07
**다음 검토 예정**: v0.3.0 완료 후
