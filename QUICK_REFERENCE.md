# P-write-vacy 빠른 참고서 (Quick Reference)

## 🎯 한눈에 보는 상태

### 프로젝트 건강도 대시보드

```
프로젝트: P-write-vacy React (v0.1.0)
├─ 코드 품질:        🟡 75% (FileExplorer 개선 필요)
├─ 보안:             🔴 60% (경로 검증 필수)
├─ 접근성:           🔴 40% (WCAG 미준수)
├─ 성능:             🟡 70% (대용량 최적화 필요)
├─ 에러 처리:        🔴 45% (Error Boundary 없음)
├─ 테스트 커버리지:  ⚪ 0% (테스트 없음)
└─ 문서화:           🟡 60% (README 있음, 코드 주석 부족)

전체 종합 평가: 🟡 62% → v1.0.0 전에 개선 필요
```

## 📊 컴포넌트 복잡도 지수

```
복잡도 순서:
1. FileExplorer.tsx      ███████████ 1,496줄 ← 리팩토링 필수
2. Sidebar.tsx           █████ 596줄
3. App.tsx               ████ 639줄
4. Editor.tsx            ██ 118줄
5. FocusOverlay.tsx      ██ 133줄
6. MarkdownViewer.tsx    █ 80줄
7. Tooltip.tsx           █ 103줄
8. ContextMenu.tsx       █ 75줄
9. SettingsButton.tsx    █ 46줄
```

## 🔴 Critical Issues (즉시 처리)

| # | 문제 | 위험도 | 해결 시간 |
|---|------|--------|---------|
| 1 | FileExplorer 과도한 복잡도 | 🔴🔴🔴 | 3-4일 |
| 2 | 파일 경로 검증 부재 | 🔴🔴 | 2시간 |
| 3 | 파일 크기 제한 없음 | 🔴🔴 | 1시간 |
| 4 | Error Boundary 없음 | 🔴🔴 | 1시간 |
| 5 | 저장 상태 표시 없음 | 🔴 | 2시간 |

## 🟡 High Priority Issues

| # | 문제 | 영향도 | 복잡도 |
|---|------|--------|--------|
| 1 | 대용량 폴더 성능 | 🟡🟡 | 복잡 |
| 2 | 키보드 접근성 | 🟡 | 중간 |
| 3 | 마크다운 이미지 지원 | 🟡 | 중간 |
| 4 | 테스트 커버리지 | 🟡🟡 | 복잡 |
| 5 | 다국어 지원 | 🟡 | 중간 |

## 💡 빠른 해결 팁

### 1️⃣ 파일 경로 검증 (15분)
```javascript
// electron/main.cjs에 추가
const validatePath = (filePath, allowedDir) => {
  const resolvedPath = path.resolve(filePath);
  const allowedPath = path.resolve(allowedDir);
  if (!resolvedPath.startsWith(allowedPath)) {
    throw new Error('경로 접근 거부');
  }
  return resolvedPath;
};
```

### 2️⃣ 파일 크기 제한 (10분)
```javascript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

ipcMain.handle('read-file', async (event, filePath) => {
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    return { success: false, error: '파일이 너무 큽니다' };
  }
  // ...
});
```

### 3️⃣ Error Boundary (20분)
```tsx
// src/components/ErrorBoundary.tsx 생성
import { Component, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 rounded-lg">
          <h1 className="text-red-600 font-bold">문제 발생</h1>
          <p className="text-gray-700">{(this.state.error as Error).message}</p>
          <button onClick={() => window.location.reload()}>
            다시 시작
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 4️⃣ 저장 상태 표시 (30분)
```tsx
// Editor.tsx에 추가
<div className="fixed top-16 right-4 text-sm">
  {hasUnsavedChanges ? (
    <span className="text-red-500">● 저장 대기 중...</span>
  ) : (
    <span className="text-green-500">✓ 저장됨</span>
  )}
</div>
```

### 5️⃣ DevTools 비활성화 (5분)
```javascript
// electron/main.cjs
// if (process.env.NODE_ENV === 'development') {
//   mainWindow.webContents.openDevTools();  // ← 이 줄 제거
// }
```

## 📈 개선 로드맵

### Week 1: Critical Fixes
```
Day 1: 
  ✓ 파일 경로 검증
  ✓ 파일 크기 제한
  ✓ DevTools 비활성화

Day 2:
  ✓ Error Boundary 추가
  ✓ 저장 상태 표시기
  
Day 3-4:
  ✓ 초기 FileExplorer 리팩토링
```

### Week 2-3: Architecture
```
  ✓ FileExplorer 분할
  ✓ 테스트 작성 시작
  ✓ 성능 프로파일링
```

### Week 4: UX/Features
```
  ✓ 접근성 개선
  ✓ 다국어 지원
  ✓ 문서 작성
```

## 🧪 테스트 우선순위

```
필수 (순서대로):
1. FileOperations (삭제, 복제, 이름변경) → 높은 위험도
2. FileSelection (다중 선택) → 상태 버그 많음
3. CaretTracking (커서 추적) → 핵심 기능
4. FocusOverlay (블러 렌더링) → 성능 영향
5. Markdown 렌더링 → 보조 기능
```

## 📋 체크리스트

### v0.2.0 (Critical Fixes) - 1주일
- [ ] 파일 경로 검증 추가
- [ ] 파일 크기 제한 (100MB)
- [ ] Error Boundary 구현
- [ ] 저장 상태 표시기
- [ ] DevTools 프로덕션 제거

### v0.3.0 (Architecture) - 2주일
- [ ] FileExplorer 리팩토링 시작
- [ ] Jest 테스트 설정
- [ ] 50개 테스트 케이스 작성
- [ ] 성능 프로파일링

### v0.4.0 (UX/Features) - 2주일
- [ ] WCAG 2.1 AA 준수
- [ ] i18n 기본 설정
- [ ] 마크다운 이미지 지원
- [ ] 사용자 문서

### v1.0.0 (Release) - 1주일
- [ ] 최종 테스트
- [ ] 보안 감사
- [ ] 성능 벤치마크
- [ ] 공식 릴리스

## 📞 도움이 되는 리소스

- **보안**: https://www.electron.build/security
- **성능**: https://reactjs.org/docs/code-splitting.html
- **접근성**: https://www.w3.org/WAI/WCAG21/quickref/
- **테스트**: https://jestjs.io/docs/getting-started

---

**마지막 업데이트**: 2025-11-07
**분석 기준**: P-write-vacy v0.1.0
**상태**: 초기 개발 단계 → v1.0.0 준비 중
