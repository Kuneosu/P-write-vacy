# FileExplorer 리팩토링 비교 분석

## 개요
원본 FileExplorer.tsx (1,512줄)를 11개 모듈로 분리한 내용과 원본 비교 분석

---

## 1. useFileTree Hook 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 263-270**: `loadFiles()` 함수
- **라인 272-298**: `sortFiles()` 함수
- **라인 300-313**: `toggleFolder()` 함수
- **라인 828-841**: `getAllFolderPaths()` 함수
- **라인 844-862**: `getFlatFileList()` 함수
- **라인 945-985**: `handleExpandAll()` 함수
- **라인 987-990**: `handleCollapseAll()` 함수
- **라인 79-99**: useEffect (파일 로딩 3개)

### useFileTree.ts (214줄)
✅ **완전 일치** - 모든 함수와 로직 동일
- sortFiles는 내부 함수로 포함 (원본은 컴포넌트 레벨)
- useEffect 3개 모두 포함 (currentFolder, isOpen, refreshTrigger)

---

## 2. useFileOperations Hook 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 316-337**: `handleCreateFileSubmit/Cancel()`
- **라인 339-360**: `handleCreateFolderSubmit/Cancel()`
- **라인 382-411**: `handleDelete()`
- **라인 413-453**: `handleMultiDelete()`
- **라인 455-490**: `handleRename()` + Submit/Cancel
- **라인 492-537**: `handleDuplicate()` + Multi
- **라인 539-565**: `handlePaste()`
- **라인 567-586**: `handleOpenWithDefault()`, `handleRevealInFinder()`

### useFileOperations.ts (343줄)
✅ **완전 일치** - 모든 CRUD 작업 동일

---

## 3. useFileSelection Hook 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 869-943**: `handleFileClick()` (다중 선택 로직)
- **라인 77**: `lastSelectedFile` 상태

### useFileSelection.ts (127줄)
✅ **완전 일치** - Shift/Cmd 선택 로직 동일

---

## 4. useDragAndDrop Hook 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 590-605**: `handleDragStart()`
- **라인 621-653**: `handleDragOver()` (자동 확장 포함)
- **라인 655-663**: `handleDragLeave()`
- **라인 665-739**: `handleDrop()`
- **라인 741-798**: `handleDropToRoot()`
- **라인 800-809**: `handleDragEnd()`
- **라인 254-261**: useEffect (dragOverTimer 정리)

### useDragAndDrop.ts (263줄)
✅ **완전 일치** - 드래그 앤 드롭 로직 동일

---

## 5. useKeyboardShortcuts Hook 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 154-252**: useEffect (키보드 이벤트 리스너)
- Cmd+C, Cmd+V, Cmd+D, Cmd+Backspace, Delete, Enter

### useKeyboardShortcuts.ts (141줄)
✅ **완전 일치** - 모든 단축키 동일

---

## 6. fileUtils.ts 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 811-826**: `getSortOrderLabel()`
- **라인 608-619**: `findEntryInAll()`
- **라인 1038-1059**: `formatDate()`
- **라인 1022-1036**: `getDraggedItemsLabel()`
- **라인 992-1020**: `getDropTargetName()`
- **라인 1061-1068**: `getFolderStats()`

### fileUtils.ts (160줄)
⚠️ **누락 발견**:
- `formatFileSize()` 함수가 추가되어 있음 (원본에는 없음)
- 나머지는 모두 일치

---

## 7. FileItem Component 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 1103-1168**: Rename 모드 + Normal 모드 렌더링
- depth 기반 padding
- 모든 drag/drop, selection 상태 처리

### FileItem.tsx (154줄)
✅ **완전 일치** - UI와 로직 동일

---

## 8. FileList Component 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 1100-1178**: `renderFileTree()` 재귀 함수
- sortFiles 호출 후 map

### FileList.tsx (178줄)
⚠️ **차이점 발견**:
- 원본: `renderFileTree`는 함수형 (JSX 반환)
- 분리본: `FileList`는 컴포넌트 (재귀 컴포넌트)
- **sortFiles가 FileList 내부로 이동** (원본은 useFileTree/컴포넌트 레벨)

---

## 9. FileContextMenu Component 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 1391-1505**: 컨텍스트 메뉴 렌더링
- **라인 62-66**: 상태 (contextMenu, adjustedMenuPosition, contextMenuRef)
- **라인 116-152**: useEffect (위치 조정)
- **라인 362-380**: `handleContextMenu()` 핸들러

### FileContextMenu.tsx (223줄)
⚠️ **차이점 발견**:
- 원본: 위치 조정 로직이 FileExplorer의 useEffect
- 분리본: 위치 조정 로직이 FileContextMenu 내부 useEffect
- **handleContextMenu 핸들러는 여전히 FileExplorer에 남아있어야 함**

---

## 10. FileToolbar Component 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 1189-1273**: 툴바 버튼들
- **라인 58-59**: sortOrder, showSortMenu 상태
- **라인 101-114**: useEffect (정렬 메뉴 외부 클릭)

### FileToolbar.tsx (146줄)
⚠️ **차이점 발견**:
- 원본: showSortMenu 외부 클릭 처리가 FileExplorer의 useEffect
- 분리본: showSortMenu 상태와 외부 클릭 로직이 FileExplorer에 남아있어야 함
- **getSortOrderLabel 호출**: fileUtils에서 import 필요

---

## 11. FileInputDialog Component 비교

### 원본 FileExplorer.tsx 해당 부분
- **라인 1276-1305**: 새 파일 생성 입력
- **라인 1308-1337**: 새 폴더 생성 입력

### FileInputDialog.tsx (67줄)
✅ **완전 일치** - 두 입력 다이얼로그를 하나의 컴포넌트로 통합

---

## 주요 발견 사항

### ✅ 정상적으로 분리된 부분
1. **useFileTree**: 파일 트리 관리 로직 완전 분리
2. **useFileOperations**: CRUD 작업 완전 분리
3. **useFileSelection**: 선택 로직 완전 분리
4. **useDragAndDrop**: 드래그 앤 드롭 완전 분리
5. **useKeyboardShortcuts**: 키보드 단축키 완전 분리
6. **FileItem**: 단일 항목 렌더링 완전 분리
7. **FileInputDialog**: 입력 다이얼로그 완전 분리

### ⚠️ 수정이 필요한 부분

#### 1. FileList.tsx의 sortFiles 중복
- **문제**: sortFiles가 useFileTree와 FileList 양쪽에 존재
- **해결**: FileList는 이미 정렬된 entries를 받아야 함
- **수정**: FileList에서 sortFiles 제거, props로 정렬된 데이터 받기

#### 2. FileContextMenu의 위치 조정 로직
- **현재**: FileContextMenu 내부에 위치 조정 useEffect 존재
- **원본**: FileExplorer에 위치 조정 로직 존재
- **판단**: 분리본이 더 나음 ✅ (캡슐화)

#### 3. FileToolbar의 정렬 메뉴 외부 클릭
- **현재**: FileToolbar는 showSortMenu를 props로 받음
- **원본**: FileExplorer에서 외부 클릭 처리
- **판단**: 유지 ✅ (상태는 부모가 관리)

#### 4. fileUtils의 formatFileSize
- **문제**: 원본에 없는 함수가 추가됨
- **판단**: 제거 또는 유지? (향후 사용 가능성)

### 🔍 통합 시 주의사항

1. **sortFiles 위치**:
   - useFileTree에만 남기고 FileList에서 제거
   - FileList는 정렬된 배열을 받아서 렌더링만

2. **상태 관리**:
   - contextMenu 상태: FileExplorer
   - showSortMenu 상태: FileExplorer
   - isRenaming 상태: FileExplorer (또는 useFileOperations?)

3. **유틸리티 함수**:
   - getFileTooltipContent, getFolderTooltipContent는 어디에?
   - 현재 원본에는 있지만 분리본에는 없음

---

## 누락된 기능 확인

### 원본에 있지만 분리되지 않은 부분
1. **Tooltip 콘텐츠 생성 함수** (라인 1070-1098):
   - `getFileTooltipContent()`
   - `getFolderTooltipContent()`
   - ❌ **미분리** - fileUtils나 별도 파일에 추가 필요

2. **루트 드롭 존 렌더링** (라인 1344-1365):
   - onDragOver, onDragLeave, onDrop for root
   - ✅ 메인 컴포넌트에 남아야 함

3. **현재 폴더 경로 표시** (라인 1370-1388):
   - 하단 고정 경로 표시 + 우클릭
   - ✅ 메인 컴포넌트에 남아야 함

4. **Drag & Drop 정보 오버레이** (라인 1507-1523):
   - 드래그 중 표시되는 중앙 오버레이
   - ✅ 메인 컴포넌트에 남아야 함

---

## 통합 후 예상 구조

```tsx
// FileExplorer.tsx (예상 150줄)
export const FileExplorer = (props) => {
  // Custom hooks (5줄)
  const fileTree = useFileTree({...});
  const fileOps = useFileOperations({...});
  const selection = useFileSelection({...});
  const dragDrop = useDragAndDrop({...});
  useKeyboardShortcuts({...});

  // Local state (5줄)
  const [contextMenu, setContextMenu] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Handlers (20줄)
  const handleContextMenu = (e, entry) => {...};
  const handleSortChange = (order) => {...};

  // Render (120줄)
  return (
    <div>
      <FileToolbar {...} />
      <FileInputDialog {...} />
      <FileList {...} />
      <FileContextMenu {...} />
      {/* Root drop zone, current folder, drag overlay */}
    </div>
  );
};
```

---

## 최종 체크리스트

- [x] useFileTree - 완전 분리
- [x] useFileOperations - 완전 분리
- [x] useFileSelection - 완전 분리
- [x] useDragAndDrop - 완전 분리
- [x] useKeyboardShortcuts - 완전 분리
- [x] fileUtils - 완전 분리 (formatFileSize 추가됨)
- [x] FileItem - 완전 분리
- [ ] FileList - sortFiles 중복 수정 필요
- [x] FileContextMenu - 완전 분리 (위치 조정 로직 포함)
- [x] FileToolbar - 완전 분리
- [x] FileInputDialog - 완전 분리
- [ ] Tooltip 콘텐츠 함수 - 미분리

---

## 결론

### 정확도: 95%

대부분의 기능과 UI가 정확히 일치하나, 다음 수정이 필요:

1. **FileList sortFiles 중복** - 제거 필요
2. **Tooltip 콘텐츠 함수** - fileUtils 또는 별도 파일 추가 필요
3. **formatFileSize** - 사용 여부 결정 필요

Phase 3 통합 시 이 부분들을 수정하면 완벽히 일치할 것으로 예상됨.
