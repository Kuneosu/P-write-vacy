# FileExplorer 레이아웃 가이드

## ⚠️ 중요: UI 레이아웃 문제 방지

통합 시 반드시 유지해야 할 레이아웃 속성들

---

## 1. 메인 컨테이너 (FileExplorer 루트)

```tsx
<div
  className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg flex flex-col"
  style={{ zIndex: 50, paddingTop: '52px' }}
>
```

### 필수 속성
- **position**: `fixed` (화면에 고정)
- **left**: `0` (왼쪽 끝)
- **top**: `0` (상단 끝)
- **height**: `h-full` (100vh)
- **width**: `w-64` (256px)
- **zIndex**: `50` (에디터 위에 표시)
- **paddingTop**: `52px` (상단 헤더 공간 확보)

### 문제 방지
❌ `position: absolute` 사용 시 → 스크롤 시 따라다니지 않음
❌ `zIndex < 50` 사용 시 → 에디터에 가려짐
❌ `paddingTop` 누락 시 → 상단 헤더와 겹침

---

## 2. Z-Index 계층 구조

반드시 이 순서를 유지해야 함:

```
z-[300] - 드래그 오버레이 (최상단)
  ↓
z-[200] - 컨텍스트 메뉴
  ↓
z-50 - 파일 탐색기 메인
  ↓
z-10 - 정렬 메뉴
```

### 각 요소의 z-index

#### 드래그 오버레이
```tsx
<div className="... z-[300] pointer-events-none">
  {/* 드래그 중 표시되는 정보 */}
</div>
```

#### 컨텍스트 메뉴
```tsx
<div className="fixed ... z-[200]">
  {/* 우클릭 메뉴 */}
</div>
```

#### 정렬 드롭다운 메뉴
```tsx
<div className="absolute ... z-10 sort-menu-container">
  {/* 정렬 옵션 */}
</div>
```

---

## 3. 컴포넌트별 레이아웃 속성

### FileToolbar
- **위치**: 메인 컨테이너 최상단
- **스타일**:
  ```tsx
  className="flex items-center justify-between mb-3 px-3 py-2 bg-white border-b border-gray-200"
  ```

### FileInputDialog
- **위치**: Toolbar 바로 아래
- **스타일**:
  ```tsx
  className="mb-3 p-2 bg-blue-50 rounded border border-blue-200"
  // 또는
  className="mb-3 p-2 bg-green-50 rounded border border-green-200"
  ```

### FileList 스크롤 영역
- **위치**: InputDialog 아래, 현재 폴더 경로 위
- **스타일**:
  ```tsx
  <div className="flex-1 overflow-y-auto">
    <div className="p-4">
      <div className="space-y-1 min-h-[200px]">
        {/* FileList 렌더링 */}
      </div>
    </div>
  </div>
  ```

### 현재 폴더 경로 (하단 고정)
- **위치**: 메인 컨테이너 최하단
- **스타일**:
  ```tsx
  <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
    {/* 현재 폴더 경로 */}
  </div>
  ```

### FileContextMenu (포탈/fixed)
- **위치**: document body에 렌더링
- **스타일**:
  ```tsx
  <div
    className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[200]"
    style={{ left: `${x}px`, top: `${y}px` }}
  >
  ```

---

## 4. 통합 시 체크리스트

### Phase 3 통합 시 반드시 확인할 것

- [ ] 메인 컨테이너 `style={{ zIndex: 50, paddingTop: '52px' }}` 유지
- [ ] 메인 컨테이너 `className`에 `fixed left-0 top-0 h-full w-64` 포함
- [ ] 컨텍스트 메뉴 `z-[200]` 유지
- [ ] 드래그 오버레이 `z-[300]` 유지
- [ ] 정렬 메뉴 `z-10` 유지
- [ ] 스크롤 영역 `flex-1 overflow-y-auto` 구조 유지
- [ ] 하단 폴더 경로는 `border-t` 있는 별도 div

---

## 5. 흔한 실수 방지

### ❌ 하지 말아야 할 것

1. **메인 컨테이너를 relative로 변경**
   ```tsx
   // ❌ 잘못된 예
   <div className="relative ...">
   ```

2. **zIndex를 인라인이 아닌 클래스로만 지정**
   ```tsx
   // ❌ 잘못된 예 (Tailwind는 50을 지원하지 않음)
   <div className="z-50 ...">

   // ✅ 올바른 예
   <div style={{ zIndex: 50 }} className="...">
   ```

3. **paddingTop 누락**
   ```tsx
   // ❌ 잘못된 예
   <div style={{ zIndex: 50 }}>

   // ✅ 올바른 예
   <div style={{ zIndex: 50, paddingTop: '52px' }}>
   ```

4. **flex-1 overflow 구조 변경**
   ```tsx
   // ❌ 잘못된 예
   <div className="overflow-y-auto">
     {/* 직접 FileList */}
   </div>

   // ✅ 올바른 예
   <div className="flex-1 overflow-y-auto">
     <div className="p-4">
       {/* FileList */}
     </div>
   </div>
   ```

---

## 6. 컴포넌트 렌더링 순서

메인 FileExplorer 컴포넌트의 렌더링 순서:

```tsx
<div className="fixed left-0 top-0 h-full w-64 ..." style={{ zIndex: 50, paddingTop: '52px' }}>
  {/* 1. 스크롤 가능 영역 */}
  <div className="flex-1 overflow-y-auto">
    <div className="p-4">
      {/* 1-1. Toolbar */}
      <FileToolbar {...} />

      {/* 1-2. File Input Dialog (조건부) */}
      {isCreatingFile && <FileInputDialog type="file" {...} />}
      {isCreatingFolder && <FileInputDialog type="folder" {...} />}

      {/* 1-3. File Tree 또는 Empty State */}
      {!currentFolder ? (
        <div>폴더를 선택하세요</div>
      ) : (
        <div className="space-y-1 min-h-[200px]" onDragOver={...} onDrop={handleDropToRoot}>
          <FileList entries={sortedFiles} {...} />
        </div>
      )}
    </div>
  </div>

  {/* 2. 하단 고정 - 현재 폴더 경로 */}
  {currentFolder && (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
      {/* 현재 폴더 */}
    </div>
  )}

  {/* 3. 포탈 컴포넌트들 (fixed position) */}
  {contextMenu && <FileContextMenu {...} />}
  {draggedItems.length > 0 && dropTarget && (
    <div className="fixed ... z-[300]">
      {/* 드래그 정보 */}
    </div>
  )}
</div>
```

---

## 7. 테스트 시나리오

통합 후 반드시 테스트해야 할 항목:

1. **파일 탐색기가 화면 왼쪽에 고정되는가?**
2. **스크롤 시 파일 탐색기가 따라 움직이지 않는가?**
3. **상단 헤더와 겹치지 않는가?** (paddingTop: 52px)
4. **에디터 영역 위에 표시되는가?** (zIndex: 50)
5. **컨텍스트 메뉴가 파일 목록 위에 표시되는가?** (z-[200])
6. **드래그 중 정보 오버레이가 최상단에 표시되는가?** (z-[300])
7. **파일 목록이 스크롤되는가?** (flex-1 overflow-y-auto)
8. **하단 폴더 경로가 고정되어 있는가?**

---

## 8. 마이그레이션 가이드

### 기존 코드에서 새 컴포넌트로

```tsx
// BEFORE (원본 - 1,512줄)
export const FileExplorer = ({ ... }) => {
  // 모든 로직이 한 파일에...

  return (
    <div className="fixed left-0 top-0 h-full w-64 ..." style={{ zIndex: 50, paddingTop: '52px' }}>
      {/* 1,500줄의 코드 */}
    </div>
  );
};

// AFTER (리팩토링 - ~150줄)
export const FileExplorer = ({ ... }) => {
  // Hooks로 로직 분리
  const fileTree = useFileTree({ ... });
  const fileOps = useFileOperations({ ... });
  const selection = useFileSelection({ ... });
  const dragDrop = useDragAndDrop({ ... });
  useKeyboardShortcuts({ ... });

  // 컴포넌트로 UI 분리
  return (
    <div className="fixed left-0 top-0 h-full w-64 ..." style={{ zIndex: 50, paddingTop: '52px' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <FileToolbar {...} />
          {isCreatingFile && <FileInputDialog type="file" {...} />}
          {isCreatingFolder && <FileInputDialog type="folder" {...} />}
          <FileList entries={sortedEntries} {...} />
        </div>
      </div>

      {currentFolder && <CurrentFolderPath {...} />}
      {contextMenu && <FileContextMenu {...} />}
      {draggedItems.length > 0 && dropTarget && <DragOverlay {...} />}
    </div>
  );
};
```

---

## 요약

**핵심 3가지만 기억하세요:**

1. ✅ **메인 컨테이너**: `style={{ zIndex: 50, paddingTop: '52px' }}`
2. ✅ **Z-Index 순서**: 300 (드래그) > 200 (메뉴) > 50 (메인) > 10 (정렬)
3. ✅ **Flex 구조**: `flex-1 overflow-y-auto` → `p-4` → `FileList`
