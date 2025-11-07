# FileExplorer 리팩토링 계획서

**작성일**: 2025-11-07
**현재 상태**: 1,512줄의 단일 파일
**목표**: 8-10개의 모듈로 분할

---

## 📊 현재 구조 분석

### 파일 통계
- **총 라인 수**: 1,512줄
- **상태 변수**: 15개
- **useEffect 훅**: 7개
- **핸들러 함수**: 25개 이상
- **렌더링 함수**: 1개 (renderFileTree)
- **유틸리티 함수**: 5개 이상

### 주요 기능 영역 (라인 범위)

| 영역 | 라인 범위 | 라인 수 | 설명 |
|------|----------|---------|------|
| **Import & Types** | 1-19 | 19 | Import 문 및 Props 인터페이스 |
| **State Declarations** | 35-62 | 28 | 15개의 상태 변수 선언 |
| **useEffect Hooks** | 64-246 | 182 | 7개의 useEffect (이벤트 리스너, 키보드 단축키 등) |
| **File Loading** | 248-299 | 51 | 파일 로딩, 정렬, 폴더 토글 |
| **File Creation** | 301-346 | 45 | 파일/폴더 생성 |
| **File Operations** | 367-522 | 155 | Delete, Rename, Duplicate, Paste |
| **Context Menu** | 347-365, 552-573 | 40 | 컨텍스트 메뉴 핸들러 |
| **Drag & Drop** | 575-794 | 219 | 드래그 앤 드롭 전체 로직 |
| **File Selection** | 855-929 | 74 | 단일/다중 선택, 클릭 핸들러 |
| **Expand/Collapse** | 931-973 | 42 | 전체 확장/축소 |
| **Utilities** | 796-850 | 54 | 유틸리티 함수들 |
| **Rendering** | 1085-1456 | 371 | renderFileTree 및 하위 JSX |
| **Main JSX** | 1056-1512 | 456 | 메인 return JSX |

### 복잡도 분석

**가장 복잡한 영역** (리팩토링 우선순위 순):
1. **드래그 앤 드롭** (219줄) - 복잡한 상태 관리, 타이머, 이벤트 핸들링
2. **렌더링 로직** (371줄) - 재귀적 트리 렌더링, 조건부 렌더링 많음
3. **useEffect 훅** (182줄) - 7개의 효과, 이벤트 리스너 관리
4. **파일 작업** (155줄) - Delete, Rename, Duplicate 등 CRUD 작업

---

## 🎯 리팩토링 목표 구조

### 새로운 폴더 구조
```
src/components/FileExplorer/
├── FileExplorer.tsx                    (~150줄)  메인 컨테이너
├── components/
│   ├── FileToolbar.tsx                 (~80줄)   상단 툴바
│   ├── FileList.tsx                    (~100줄)  파일 목록 렌더링
│   ├── FileItem.tsx                    (~200줄)  단일 파일/폴더 항목
│   ├── FileContextMenu.tsx             (~150줄)  컨텍스트 메뉴
│   └── FileInputDialog.tsx             (~60줄)   파일/폴더 이름 입력
├── hooks/
│   ├── useFileOperations.ts            (~200줄)  CRUD 작업
│   ├── useFileSelection.ts             (~100줄)  다중 선택 로직
│   ├── useDragAndDrop.ts               (~250줄)  드래그 앤 드롭
│   ├── useFileTree.ts                  (~120줄)  트리 상태 관리
│   └── useKeyboardShortcuts.ts         (~100줄)  키보드 단축키
├── utils/
│   └── fileUtils.ts                    (~50줄)   유틸리티 함수
└── types/
    └── index.ts                        (~30줄)   FileExplorer 타입 정의

총 예상 라인 수: ~1,590줄 (현재 1,512줄 + 리팩토링 오버헤드 ~80줄)
```

---

## 📋 상세 분할 계획

### 1. useFileOperations.ts (Hook)
**목적**: 파일/폴더 CRUD 작업 관리

**추출할 함수들**:
- handleCreateFileSubmit
- handleCreateFolderSubmit
- handleDelete
- handleMultiDelete
- handleRename
- handleRenameSubmit
- handleDuplicate
- handleMultiDuplicate
- handlePaste
- handleOpenWithDefault
- handleRevealInFinder

**상태 관리**:
- isCreatingFile, newFileName
- isCreatingFolder, newFolderName
- isRenaming, renameValue
- clipboard

**반환 인터페이스**:
```typescript
interface UseFileOperationsReturn {
  // State
  isCreatingFile: boolean;
  newFileName: string;
  isCreatingFolder: boolean;
  newFolderName: string;
  isRenaming: string | null;
  renameValue: string;
  clipboard: FileEntry[];

  // Setters
  setIsCreatingFile: (value: boolean) => void;
  setNewFileName: (value: string) => void;
  setIsCreatingFolder: (value: boolean) => void;
  setNewFolderName: (value: string) => void;
  setRenameValue: (value: string) => void;

  // Handlers
  handleCreateFileSubmit: () => void;
  handleCreateFileCancel: () => void;
  handleCreateFolderSubmit: () => Promise<void>;
  handleCreateFolderCancel: () => void;
  handleDelete: (entry: FileEntry) => Promise<void>;
  handleMultiDelete: () => Promise<void>;
  handleRename: (entry: FileEntry) => void;
  handleRenameSubmit: (entry: FileEntry) => Promise<void>;
  handleRenameCancel: () => void;
  handleDuplicate: (entry: FileEntry) => Promise<void>;
  handleMultiDuplicate: () => Promise<void>;
  handlePaste: () => Promise<void>;
  handleOpenWithDefault: (entry: FileEntry) => Promise<void>;
  handleRevealInFinder: (entry: FileEntry) => Promise<void>;

  // Clipboard operations
  copyToClipboard: (entries: FileEntry[]) => void;
}
```

---

### 2. useFileSelection.ts (Hook)
**목적**: 다중 선택, 클릭 처리

**추출할 함수들**:
- handleFileClick
- Multi-selection logic (Cmd/Ctrl + Click, Shift + Click)

**상태 관리**:
- lastSelectedFile

**Props 의존성**:
- selectedFiles (from parent)
- onSelectFile
- onLoadFileInMultiSelect
- onFileSelection

**반환 인터페이스**:
```typescript
interface UseFileSelectionReturn {
  lastSelectedFile: string | null;
  handleFileClick: (entry: FileEntry, e: React.MouseEvent) => Promise<void>;
  isSelected: (path: string) => boolean;
}
```

---

### 3. useDragAndDrop.ts (Hook)
**목적**: 드래그 앤 드롭 전체 로직

**추출할 함수들**:
- handleDragStart
- handleDragOver
- handleDragLeave
- handleDrop
- handleDropToRoot
- handleDragEnd

**상태 관리**:
- draggedItems
- dropTarget
- dragOverTimer

**반환 인터페이스**:
```typescript
interface UseDragAndDropReturn {
  draggedItems: FileEntry[];
  dropTarget: string | null;
  handleDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  handleDragOver: (e: React.DragEvent, entry: FileEntry) => void;
  handleDragLeave: (e: React.DragEvent, entry: FileEntry) => void;
  handleDrop: (e: React.DragEvent, targetEntry: FileEntry) => Promise<void>;
  handleDropToRoot: (e: React.DragEvent) => Promise<void>;
  handleDragEnd: () => void;
}
```

---

### 4. useFileTree.ts (Hook)
**목적**: 폴더 트리 상태 및 확장/축소 관리

**추출할 함수들**:
- loadFiles
- toggleFolder
- handleExpandAll
- handleCollapseAll
- getAllFolderPaths
- getFlatFileList

**상태 관리**:
- files
- expandedFolders
- folderContents

**반환 인터페이스**:
```typescript
interface UseFileTreeReturn {
  files: FileEntry[];
  expandedFolders: Set<string>;
  folderContents: Map<string, FileEntry[]>;

  loadFiles: (folderPath: string) => Promise<void>;
  toggleFolder: (folderPath: string) => Promise<void>;
  handleExpandAll: () => Promise<void>;
  handleCollapseAll: () => void;
  getAllFolderPaths: (entries: FileEntry[]) => string[];
  getFlatFileList: () => FileEntry[];
}
```

---

### 5. useKeyboardShortcuts.ts (Hook)
**목적**: 키보드 단축키 처리

**추출할 로직**:
- Cmd+Backspace: Delete
- Cmd+C: Copy
- Cmd+V: Paste
- Cmd+D: Duplicate
- Enter: Rename
- Delete/Backspace: Delete

**의존성**:
- isOpen (from props)
- selectedFiles (from parent)
- files, folderContents (from useFileTree)
- Operations from useFileOperations

---

### 6. FileItem.tsx (Component)
**목적**: 단일 파일/폴더 항목 렌더링

**Props**:
```typescript
interface FileItemProps {
  entry: FileEntry;
  depth: number;
  isSelected: boolean;
  isDraggedOver: boolean;
  isExpanded: boolean;
  isRenaming: boolean;
  renameValue: string;

  onToggle: () => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}
```

**렌더링 내용**:
- 들여쓰기 (depth 기반)
- 폴더 확장/축소 아이콘
- 파일/폴더 아이콘
- 파일명 또는 Rename input
- 선택 상태 스타일
- 드래그 앤 드롭 상태 스타일

---

### 7. FileList.tsx (Component)
**목적**: 파일 목록 재귀 렌더링 (renderFileTree 로직)

**Props**:
```typescript
interface FileListProps {
  entries: FileEntry[];
  depth?: number;
  expandedFolders: Set<string>;
  folderContents: Map<string, FileEntry[]>;
  selectedFiles: string[];
  draggedItems: FileEntry[];
  dropTarget: string | null;
  isRenaming: string | null;
  renameValue: string;

  onToggleFolder: (path: string) => void;
  onFileClick: (entry: FileEntry, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
  onDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  onDragOver: (e: React.DragEvent, entry: FileEntry) => void;
  onDragLeave: (e: React.DragEvent, entry: FileEntry) => void;
  onDrop: (e: React.DragEvent, entry: FileEntry) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: (entry: FileEntry) => void;
  onRenameCancel: () => void;
}
```

**로직**:
- 재귀적으로 파일 트리 렌더링
- 각 항목에 대해 FileItem 렌더링
- 폴더인 경우 하위 항목 재귀 렌더링

---

### 8. FileContextMenu.tsx (Component)
**목적**: 우클릭 컨텍스트 메뉴 UI

**Props**:
```typescript
interface FileContextMenuProps {
  entry: FileEntry | null;
  position: { x: number; y: number } | null;
  isMultiSelection: boolean;

  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenWithDefault: () => void;
  onRevealInFinder: () => void;
  onCopy: () => void;
  onPaste: () => void;
}
```

**렌더링 내용**:
- 위치 자동 조정 (화면 경계)
- 메뉴 항목들 (조건부 표시)
- 단축키 표시

---

### 9. FileToolbar.tsx (Component)
**목적**: 상단 툴바 (새 파일/폴더 버튼, 정렬 메뉴 등)

**Props**:
```typescript
interface FileToolbarProps {
  currentFolder: string | null;
  sortOrder: SortOrder;
  showSortMenu: boolean;

  onSelectFolder: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSortOrderChange: (order: SortOrder) => void;
  onToggleSortMenu: () => void;
}
```

**렌더링 내용**:
- "폴더 선택" 버튼
- "새 파일" 버튼
- "새 폴더" 버튼
- "전체 확장" 버튼
- "전체 축소" 버튼
- 정렬 드롭다운

---

### 10. fileUtils.ts (Utilities)
**목적**: 공통 유틸리티 함수

**함수들**:
- `sortFiles(files: FileEntry[], order: SortOrder): FileEntry[]`
- `findEntryInAll(path: string, files: FileEntry[], folderContents: Map<...>): FileEntry | null`
- `getSortOrderLabel(order: SortOrder): string`
- `generateUniqueName(baseName: string, existingNames: string[]): string`

---

### 11. FileExplorer.tsx (메인 컨테이너)
**목적**: 상태 조합 및 Props 전달만

**새로운 구조**:
```typescript
export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  // Custom hooks
  const fileTree = useFileTree(props.currentFolder);
  const fileOps = useFileOperations({
    currentFolder: props.currentFolder,
    onCreateFile: props.onCreateFile,
    selectedFiles: props.selectedFiles,
    files: fileTree.files,
    folderContents: fileTree.folderContents,
    onRefresh: fileTree.loadFiles
  });
  const selection = useFileSelection({
    selectedFiles: props.selectedFiles,
    onSelectFile: props.onSelectFile,
    onLoadFileInMultiSelect: props.onLoadFileInMultiSelect,
    onFileSelection: props.onFileSelection,
    files: fileTree.files,
    folderContents: fileTree.folderContents
  });
  const dnd = useDragAndDrop({
    currentFolder: props.currentFolder,
    selectedFiles: props.selectedFiles,
    files: fileTree.files,
    folderContents: fileTree.folderContents,
    onRefresh: fileTree.loadFiles
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<...>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isOpen: props.isOpen,
    selectedFiles: props.selectedFiles,
    files: fileTree.files,
    folderContents: fileTree.folderContents,
    fileOperations: fileOps,
    selection
  });

  // useEffects for refresh triggers
  useEffect(() => { ... }, [props.refreshTrigger]);
  useEffect(() => { ... }, [props.isOpen]);

  // Render
  return (
    <div>
      <FileToolbar ... />
      <FileList ... />
      {contextMenu && <FileContextMenu ... />}
      {fileOps.isCreatingFile && <FileInputDialog ... />}
      {fileOps.isCreatingFolder && <FileInputDialog ... />}
    </div>
  );
};
```

---

## 🚀 실행 계획 (단계별)

### Phase 1: Hooks 분리 (Day 1)
1. **useFileTree.ts 생성** (1시간)
   - 파일 로딩, 폴더 확장/축소 로직
   - 가장 독립적이므로 먼저 분리

2. **useFileOperations.ts 생성** (2시간)
   - CRUD 작업 모두 이동
   - Toast 알림 통합

3. **useFileSelection.ts 생성** (1.5시간)
   - 다중 선택 로직
   - handleFileClick 이동

4. **useDragAndDrop.ts 생성** (2시간)
   - 가장 복잡한 부분
   - 타이머 관리 포함

5. **useKeyboardShortcuts.ts 생성** (1시간)
   - 키보드 단축키 로직 분리

### Phase 2: Components 분리 (Day 2)
6. **fileUtils.ts 생성** (30분)
   - 유틸리티 함수 이동

7. **FileItem.tsx 생성** (2시간)
   - 단일 항목 렌더링 로직
   - 드래그 앤 드롭 속성 적용

8. **FileList.tsx 생성** (2시간)
   - renderFileTree 로직 이동
   - FileItem 사용하도록 변경

9. **FileContextMenu.tsx 생성** (1.5시간)
   - 컨텍스트 메뉴 UI 분리
   - 위치 조정 로직 포함

10. **FileToolbar.tsx 생성** (1시간)
    - 상단 툴바 UI 분리

### Phase 3: 통합 및 테스트 (Day 3)
11. **FileExplorer.tsx 리팩토링** (2시간)
    - 모든 hooks 및 components 통합
    - Props 전달 연결

12. **기능 테스트** (3시간)
    - 모든 CRUD 작업 테스트
    - 드래그 앤 드롭 테스트
    - 키보드 단축키 테스트
    - 다중 선택 테스트

13. **버그 수정** (2시간)
    - 발견된 문제 해결

### Phase 4: 정리 및 문서화 (Day 4)
14. **코드 정리** (1시간)
    - 사용하지 않는 코드 제거
    - 주석 추가

15. **타입 정의 정리** (30분)
    - types/index.ts 생성
    - 공통 타입 정의

16. **README 작성** (30분)
    - FileExplorer/README.md 생성
    - 구조 설명

17. **커밋** (30분)
    - 리팩토링 완료 커밋

---

## ✅ 검증 체크리스트

리팩토링 완료 후 다음 항목들을 검증:

### 기능 검증
- [ ] 파일/폴더 생성
- [ ] 파일/폴더 삭제
- [ ] 파일/폴더 이름 변경
- [ ] 파일/폴더 복제
- [ ] 파일 복사/붙여넣기
- [ ] 다중 선택 (Cmd/Ctrl + 클릭)
- [ ] 다중 삭제
- [ ] 다중 복제
- [ ] 드래그 앤 드롭 (파일 → 폴더)
- [ ] 드래그 앤 드롭 (파일 → 루트)
- [ ] 다중 항목 드래그 앤 드롭
- [ ] 폴더 확장/축소
- [ ] 전체 확장
- [ ] 전체 축소
- [ ] 정렬 (이름, 수정일, 생성일)
- [ ] 컨텍스트 메뉴
- [ ] 기본 앱으로 열기
- [ ] Finder에서 표시

### 키보드 단축키 검증
- [ ] Cmd+Backspace: 삭제
- [ ] Cmd+C: 복사
- [ ] Cmd+V: 붙여넣기
- [ ] Cmd+D: 복제
- [ ] Enter: 이름 변경
- [ ] Delete/Backspace: 삭제
- [ ] Escape: 선택 해제

### 성능 검증
- [ ] 1000+ 파일 폴더 로딩 속도
- [ ] 드래그 앤 드롭 응답성
- [ ] 파일 선택 응답성
- [ ] 메모리 누수 확인

### 코드 품질 검증
- [ ] TypeScript 에러 없음
- [ ] ESLint 경고 없음
- [ ] 모든 props 타입 정의됨
- [ ] 주석 적절히 작성됨
- [ ] 함수 복잡도 감소 확인

---

## 📊 예상 효과

### 정량적 개선
- **파일 수**: 1개 → 11개
- **평균 파일 크기**: 1,512줄 → ~145줄
- **최대 파일 크기**: 1,512줄 → ~250줄 (useDragAndDrop)
- **함수당 평균 라인 수**: ~60줄 → ~30줄

### 정성적 개선
- ✅ **가독성**: 각 파일이 단일 책임 원칙 준수
- ✅ **유지보수성**: 버그 발견 및 수정 용이
- ✅ **테스트 가능성**: 각 hook/component 독립적 테스트 가능
- ✅ **재사용성**: Hooks는 다른 컴포넌트에서도 사용 가능
- ✅ **협업 용이성**: 여러 개발자가 동시에 작업 가능

---

**작성자**: Claude Code
**검토 필요**: 실행 전 계획 검토
**예상 소요 시간**: 3-4일
