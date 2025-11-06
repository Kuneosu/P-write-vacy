import React, { useState, useEffect, useRef } from 'react';
import type { FileEntry, SortOrder } from '../types/electron';
import { Tooltip } from './Tooltip';

interface FileExplorerProps {
  isOpen: boolean;
  currentFolder: string | null;
  currentFile: string | null;
  onSelectFolder: () => void;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile?: (filePath: string) => void;
  refreshTrigger?: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  isOpen,
  currentFolder,
  currentFile,
  onSelectFolder,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  refreshTrigger = 0,
}) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Map<string, FileEntry[]>>(new Map());
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null);
  const [adjustedMenuPosition, setAdjustedMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Clipboard state for copy/paste
  const [clipboard, setClipboard] = useState<FileEntry | null>(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<FileEntry | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragOverTimer, setDragOverTimer] = useState<number | null>(null);

  useEffect(() => {
    if (currentFolder && window.electron) {
      loadFiles(currentFolder);
    } else {
      setFiles([]);
    }
  }, [currentFolder]);

  // Refresh file list when explorer opens
  useEffect(() => {
    if (isOpen && currentFolder && window.electron) {
      loadFiles(currentFolder);
    }
  }, [isOpen]);

  // Refresh file list when refreshTrigger changes
  useEffect(() => {
    if (currentFolder && window.electron) {
      loadFiles(currentFolder);
    }
  }, [refreshTrigger]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSortMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('.sort-menu-container')) {
          setShowSortMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSortMenu]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Adjust context menu position to keep it within window bounds
  useEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const rect = contextMenuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let { x, y } = contextMenu;

      // Adjust horizontal position if menu goes off-screen
      if (x + rect.width > windowWidth) {
        x = windowWidth - rect.width - 8;
      }
      if (x < 0) {
        x = 8;
      }

      // Adjust vertical position if menu goes off-screen
      if (y + rect.height > windowHeight) {
        y = windowHeight - rect.height - 8;
      }
      if (y < 0) {
        y = 8;
      }

      setAdjustedMenuPosition({ x, y });
    }
  }, [contextMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when file explorer is open and a file is selected
      if (!isOpen || !currentFile) return;

      // Don't interfere with input fields or contenteditable elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.isContentEditable) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Find the currently selected file entry
      const findEntry = (path: string): FileEntry | null => {
        // Search in root files
        const rootEntry = files.find(f => f.path === path);
        if (rootEntry) return rootEntry;

        // Search in expanded folders
        for (const [, entries] of folderContents) {
          const entry = entries.find(f => f.path === path);
          if (entry) return entry;
        }
        return null;
      };

      const currentEntry = findEntry(currentFile);
      if (!currentEntry) return;

      // Cmd+Backspace: Delete
      if (cmdKey && e.key === 'Backspace') {
        e.preventDefault();
        handleDelete(currentEntry);
        return;
      }

      // Cmd+C: Copy
      if (cmdKey && e.key === 'c') {
        e.preventDefault();
        setClipboard(currentEntry);
        return;
      }

      // Cmd+V: Paste (duplicate)
      if (cmdKey && e.key === 'v' && clipboard) {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Cmd+D: Duplicate
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicate(currentEntry);
        return;
      }

      // Enter: Rename
      if (e.key === 'Enter' && !isRenaming) {
        e.preventDefault();
        handleRename(currentEntry);
        return;
      }

      // Delete/Backspace (without Cmd): Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && !cmdKey) {
        e.preventDefault();
        handleDelete(currentEntry);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentFile, files, folderContents, clipboard, isRenaming]);

  // Cleanup drag over timer on unmount
  useEffect(() => {
    return () => {
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }
    };
  }, [dragOverTimer]);

  const loadFiles = async (folderPath: string) => {
    if (!window.electron) return;
    const entries = await window.electron.readDirectory(folderPath);
    setFiles(entries);
    // 폴더 내용 캐시 초기화
    setFolderContents(new Map());
    setExpandedFolders(new Set());
  };

  const sortFiles = (filesToSort: FileEntry[]): FileEntry[] => {
    const sorted = [...filesToSort].sort((a, b) => {
      // 폴더를 항상 위에 표시
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      // 같은 타입(파일 또는 폴더)끼리 정렬
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'modified-desc':
          return (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0);
        case 'modified-asc':
          return (a.modified?.getTime() || 0) - (b.modified?.getTime() || 0);
        case 'created-desc':
          return (b.created?.getTime() || 0) - (a.created?.getTime() || 0);
        case 'created-asc':
          return (a.created?.getTime() || 0) - (b.created?.getTime() || 0);
        default:
          return 0;
      }
    });
    return sorted;
  };

  const toggleFolder = async (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
      // 폴더 내용이 아직 로드되지 않았으면 로드
      if (!folderContents.has(folderPath) && window.electron) {
        const entries = await window.electron.readDirectory(folderPath);
        setFolderContents(prev => new Map(prev).set(folderPath, entries));
      }
    }
    setExpandedFolders(newExpanded);
  };


  const handleCreateFileSubmit = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleCreateFileCancel = () => {
    setNewFileName('');
    setIsCreatingFile(false);
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim() || !currentFolder || !window.electron) return;

    const result = await window.electron.createFolder(currentFolder, newFolderName.trim());
    if (result.success) {
      setNewFolderName('');
      setIsCreatingFolder(false);
      // 현재 폴더 새로고침
      const entries = await window.electron.readDirectory(currentFolder);
      setFiles(entries);
      // 폴더 내용 캐시 초기화
      setFolderContents(new Map());
    } else {
      alert('폴더 생성 실패: ' + result.error);
    }
  };

  const handleCreateFolderCancel = () => {
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const handleDelete = async (entry: FileEntry) => {
    if (!window.electron || !currentFolder) return;

    const confirmMessage = entry.type === 'directory'
      ? `"${entry.name}" 폴더와 내부의 모든 파일을 삭제하시겠습니까?`
      : `"${entry.name}" 파일을 삭제하시겠습니까?`;

    if (!confirm(confirmMessage)) return;

    const result = entry.type === 'directory'
      ? await window.electron.deleteFolder(entry.path)
      : await window.electron.deleteFile(entry.path);

    if (result.success) {
      // Notify parent component about the deletion
      if (onDeleteFile) {
        onDeleteFile(entry.path);
      }

      // 현재 폴더 새로고침
      const entries = await window.electron.readDirectory(currentFolder);
      setFiles(entries);
      setFolderContents(new Map());
    } else {
      alert('삭제 실패: ' + result.error);
    }

    setContextMenu(null);
  };

  const handleRename = (entry: FileEntry) => {
    setIsRenaming(entry.path);
    setRenameValue(entry.name);
    setContextMenu(null);
  };

  const handleRenameSubmit = async (entry: FileEntry) => {
    if (!window.electron || !renameValue.trim() || renameValue === entry.name) {
      setIsRenaming(null);
      return;
    }

    const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const newPath = `${parentPath}/${renameValue}`;

    const result = await window.electron.renameFile(entry.path, newPath);
    if (result.success) {
      // 현재 폴더 새로고침
      if (currentFolder) {
        const entries = await window.electron.readDirectory(currentFolder);
        setFiles(entries);
        setFolderContents(new Map());
      }
    } else {
      alert('이름 변경 실패: ' + result.error);
    }

    setIsRenaming(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setIsRenaming(null);
    setRenameValue('');
  };

  const handleDuplicate = async (entry: FileEntry) => {
    if (!window.electron || !currentFolder) return;

    const result = await window.electron.duplicateItem(entry.path);
    if (result.success) {
      // 현재 폴더 새로고침
      const entries = await window.electron.readDirectory(currentFolder);
      setFiles(entries);
      setFolderContents(new Map());
    } else {
      alert('복제 실패: ' + result.error);
    }

    setContextMenu(null);
  };

  const handlePaste = async () => {
    if (!clipboard || !window.electron || !currentFolder) return;

    const result = await window.electron.duplicateItem(clipboard.path);
    if (result.success) {
      // 현재 폴더 새로고침
      const entries = await window.electron.readDirectory(currentFolder);
      setFiles(entries);
      setFolderContents(new Map());
    } else {
      alert('붙여넣기 실패: ' + result.error);
    }
  };

  const handleOpenWithDefault = async (entry: FileEntry) => {
    if (!window.electron) return;

    const result = await window.electron.openWithDefault(entry.path);
    if (!result.success) {
      alert('열기 실패: ' + result.error);
    }

    setContextMenu(null);
  };

  const handleRevealInFinder = async (entry: FileEntry) => {
    if (!window.electron) return;

    const result = await window.electron.revealInFinder(entry.path);
    if (!result.success) {
      alert('Finder에서 보기 실패: ' + result.error);
    }

    setContextMenu(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, entry: FileEntry) => {
    setDraggedItem(entry);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entry.path);
  };

  const handleDragOver = (e: React.DragEvent, entry: FileEntry) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // If it's a file (not a directory), treat as root drop zone
    if (entry.type !== 'directory') {
      e.stopPropagation(); // Don't let it bubble further
      setDropTarget('root');
      return;
    }

    // It's a directory - allow drop on it
    e.stopPropagation(); // Prevent bubbling to root drop zone

    // If we're hovering over a different folder than before, clear the old timer
    if (dropTarget !== entry.path) {
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }

      setDropTarget(entry.path);

      // Set a timer to auto-expand the folder after 500ms
      // Only if the folder is not already expanded
      if (!expandedFolders.has(entry.path)) {
        const timer = setTimeout(() => {
          toggleFolder(entry.path);
          setDragOverTimer(null);
        }, 500);
        setDragOverTimer(timer);
      }
    }
  };

  const handleDragLeave = (_e: React.DragEvent, _entry: FileEntry) => {
    // Don't preventDefault or stopPropagation - let it bubble to root

    // Don't clear the timer here - child elements can trigger dragLeave
    // Timer will be cleared when moving to another folder or when drag ends

    // Don't clear dropTarget here - let dragOver events handle it
    // This allows smooth transition from folder to root area
  };

  const handleDrop = async (e: React.DragEvent, targetEntry: FileEntry) => {
    // If dropping on a file and dropTarget is 'root', let it bubble to root
    if (targetEntry.type !== 'directory' && dropTarget === 'root') {
      // Don't preventDefault or stopPropagation - let it bubble
      return;
    }

    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to root drop zone

    // Clear the timer when dropping
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }

    setDropTarget(null);

    if (!draggedItem || !window.electron || !currentFolder) {
      return;
    }

    // Can't drop on files, only on directories
    if (targetEntry.type !== 'directory') {
      return;
    }

    // Can't drop on itself
    if (draggedItem.path === targetEntry.path) {
      return;
    }

    // Can't drop parent folder into its child
    if (targetEntry.path.startsWith(draggedItem.path + '/')) {
      alert('하위 폴더로 이동할 수 없습니다.');
      setDraggedItem(null);
      return;
    }

    // Move the file/folder
    const fileName = draggedItem.name;
    const newPath = `${targetEntry.path}/${fileName}`;

    const result = await window.electron.renameFile(draggedItem.path, newPath);
    if (result.success) {
      // Refresh current folder
      const entries = await window.electron.readDirectory(currentFolder);
      setFiles(entries);

      // Reload all expanded folders to keep them open
      const newFolderContents = new Map<string, FileEntry[]>();
      for (const folderPath of expandedFolders) {
        const folderEntries = await window.electron.readDirectory(folderPath);
        newFolderContents.set(folderPath, folderEntries);
      }
      setFolderContents(newFolderContents);
    } else {
      alert('이동 실패: ' + result.error);
    }

    setDraggedItem(null);
  };

  const handleDropToRoot = async (e: React.DragEvent) => {
    e.preventDefault();

    // Clear the timer when dropping
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }

    setDropTarget(null);

    if (!draggedItem || !window.electron || !currentFolder) {
      return;
    }

    // Can't drop if already in root
    const draggedItemParent = draggedItem.path.substring(0, draggedItem.path.lastIndexOf('/'));
    if (draggedItemParent === currentFolder) {
      setDraggedItem(null);
      return;
    }

    // Move to root
    const fileName = draggedItem.name;
    const newPath = `${currentFolder}/${fileName}`;

    const result = await window.electron.renameFile(draggedItem.path, newPath);
    if (result.success) {
      // Refresh current folder
      const entries = await window.electron.readDirectory(currentFolder);
      setFiles(entries);

      // Reload all expanded folders to keep them open
      const newFolderContents = new Map<string, FileEntry[]>();
      for (const folderPath of expandedFolders) {
        const folderEntries = await window.electron.readDirectory(folderPath);
        newFolderContents.set(folderPath, folderEntries);
      }
      setFolderContents(newFolderContents);
    } else {
      alert('이동 실패: ' + result.error);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    // Clear the timer when drag ends
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  const getSortOrderLabel = (order: SortOrder): string => {
    switch (order) {
      case 'name-asc':
        return '파일 이름 (알파벳순)';
      case 'name-desc':
        return '파일 이름 (알파벳 역순)';
      case 'modified-desc':
        return '업데이트 날짜 (최신순)';
      case 'modified-asc':
        return '업데이트 날짜 (오래된 순)';
      case 'created-desc':
        return '생성일 (최신순)';
      case 'created-asc':
        return '생성일 (오래된 순)';
    }
  };

  // Collect all folder paths recursively
  const getAllFolderPaths = (entries: FileEntry[]): string[] => {
    const folders: string[] = [];
    for (const entry of entries) {
      if (entry.type === 'directory') {
        folders.push(entry.path);
        const subFolders = folderContents.get(entry.path);
        if (subFolders) {
          folders.push(...getAllFolderPaths(subFolders));
        }
      }
    }
    return folders;
  };

  // Expand all folders
  const handleExpandAll = async () => {
    if (!window.electron || !currentFolder) return;

    // Get all folders from root
    const allFolders = files.filter(f => f.type === 'directory');
    const newExpanded = new Set<string>();
    const newFolderContents = new Map(folderContents);

    // Recursively expand all folders
    const expandRecursive = async (folders: FileEntry[]) => {
      if (!window.electron) return;

      for (const folder of folders) {
        newExpanded.add(folder.path);

        // Load folder contents if not already loaded
        if (!newFolderContents.has(folder.path)) {
          const entries = await window.electron.readDirectory(folder.path);
          newFolderContents.set(folder.path, entries);

          // Recursively expand subfolders
          const subFolders = entries.filter(e => e.type === 'directory');
          if (subFolders.length > 0) {
            await expandRecursive(subFolders);
          }
        } else {
          // Already loaded, just expand subfolders
          const entries = newFolderContents.get(folder.path)!;
          const subFolders = entries.filter(e => e.type === 'directory');
          if (subFolders.length > 0) {
            await expandRecursive(subFolders);
          }
        }
      }
    };

    await expandRecursive(allFolders);
    setExpandedFolders(newExpanded);
    setFolderContents(newFolderContents);
  };

  // Collapse all folders
  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
  };

  const getDropTargetName = (): string | null => {
    if (!dropTarget) return null;

    if (dropTarget === 'root') {
      return currentFolder?.split('/').pop() || '루트';
    }

    // Find the folder in files or folderContents
    const findFolder = (entries: FileEntry[]): string | null => {
      for (const entry of entries) {
        if (entry.path === dropTarget && entry.type === 'directory') {
          return entry.name;
        }
      }
      return null;
    };

    // Search in root files
    let folderName = findFolder(files);
    if (folderName) return folderName;

    // Search in expanded folders
    for (const [, entries] of folderContents) {
      folderName = findFolder(entries);
      if (folderName) return folderName;
    }

    return null;
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '알 수 없음';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFolderStats = (folderPath: string): { files: number; folders: number } | null => {
    const contents = folderContents.get(folderPath);
    if (!contents) return null;

    const files = contents.filter(e => e.type === 'file').length;
    const folders = contents.filter(e => e.type === 'directory').length;
    return { files, folders };
  };

  const getFileTooltipContent = (entry: FileEntry): React.ReactNode => {
    return (
      <div className="space-y-1">
        <div className="font-medium">{entry.name}</div>
        <div className="text-xs text-gray-300">
          <div>수정: {formatDate(entry.modified)}</div>
          <div>생성: {formatDate(entry.created)}</div>
        </div>
      </div>
    );
  };

  const getFolderTooltipContent = (entry: FileEntry): React.ReactNode => {
    const stats = getFolderStats(entry.path);

    return (
      <div className="space-y-1">
        <div className="font-medium">{entry.name}</div>
        {stats ? (
          <div className="text-xs text-gray-300">
            <div>폴더 {stats.folders}개</div>
            <div>파일 {stats.files}개</div>
          </div>
        ) : (
          <div className="text-xs text-gray-300">클릭하여 내용 확인</div>
        )}
      </div>
    );
  };

  const renderFileTree = (entries: FileEntry[], depth: number = 0): React.ReactNode => {
    return sortFiles(entries).map((entry) => (
      <div key={entry.path}>
        {isRenaming === entry.path ? (
          // Rename mode
          <div
            className="w-full flex items-center gap-2 px-2 py-1.5"
            style={{ paddingLeft: `${8 + depth * 16}px` }}
          >
            {entry.type === 'directory' && <span className="w-3" />}
            {entry.type === 'file' && <span className="w-3" />}
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(entry);
                if (e.key === 'Escape') handleRenameCancel();
              }}
              onBlur={() => handleRenameSubmit(entry)}
              className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        ) : (
          // Normal mode
          <Tooltip content={entry.type === 'file' ? getFileTooltipContent(entry) : getFolderTooltipContent(entry)}>
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, entry)}
              onDragOver={(e) => handleDragOver(e, entry)}
              onDragLeave={(e) => handleDragLeave(e, entry)}
              onDrop={(e) => handleDrop(e, entry)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (entry.type === 'directory') {
                  toggleFolder(entry.path);
                } else {
                  onSelectFile(entry.path);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, entry)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left ${
                currentFile === entry.path
                  ? 'bg-blue-100 text-blue-700'
                  : draggedItem?.path === entry.path
                  ? 'opacity-50'
                  : dropTarget === entry.path && entry.type === 'directory'
                  ? 'bg-green-100 border-2 border-green-400'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
              {entry.type === 'directory' && (
                <svg
                  className={`w-3 h-3 transition-transform ${
                    expandedFolders.has(entry.path) ? 'rotate-90' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {entry.type === 'file' && <span className="w-3" />}
              <span className="flex-1 truncate">{entry.name}</span>
            </button>
          </Tooltip>
        )}
        {entry.type === 'directory' &&
         expandedFolders.has(entry.path) &&
         folderContents.has(entry.path) && (
          <div>
            {renderFileTree(folderContents.get(entry.path)!, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg flex flex-col"
      style={{ zIndex: 50, paddingTop: '52px' }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">파일</h3>
          <div className="flex gap-2">
            {currentFolder && (
              <>
                <Tooltip content="새 파일 만들기">
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip content="새 폴더 만들기">
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip content={expandedFolders.size > 0 ? "모두 접기" : "모두 펼치기"}>
                  <button
                    onClick={expandedFolders.size > 0 ? handleCollapseAll : handleExpandAll}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {expandedFolders.size > 0 ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
                <div className="relative sort-menu-container">
                  <Tooltip content="정렬 순서 변경">
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                    </button>
                  </Tooltip>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-10 sort-menu-container" style={{ marginRight: '4px' }}>
                      {(['name-asc', 'name-desc', 'modified-desc', 'modified-asc', 'created-desc', 'created-asc'] as SortOrder[]).map((order) => (
                        <button
                          key={order}
                          onClick={() => {
                            setSortOrder(order);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-2 py-2 text-xs hover:bg-gray-100 transition-colors ${
                            sortOrder === order ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {getSortOrderLabel(order)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <Tooltip content="작업 폴더 선택">
              <button
                onClick={onSelectFolder}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 새 파일 생성 입력 */}
        {isCreatingFile && (
          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFileSubmit();
                if (e.key === 'Escape') handleCreateFileCancel();
              }}
              placeholder="파일 이름 (예: note.md)"
              className="w-full px-2 py-1 text-sm border border-blue-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFileSubmit}
                className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                생성
              </button>
              <button
                onClick={handleCreateFileCancel}
                className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 새 폴더 생성 입력 */}
        {isCreatingFolder && (
          <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolderSubmit();
                if (e.key === 'Escape') handleCreateFolderCancel();
              }}
              placeholder="폴더 이름"
              className="w-full px-2 py-1 text-sm border border-green-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolderSubmit}
                className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                생성
              </button>
              <button
                onClick={handleCreateFolderCancel}
                className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {!currentFolder ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            폴더를 선택하세요
          </div>
        ) : (
          <div
            className="space-y-1 min-h-[200px]"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDropTarget('root');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              // Only clear if we're leaving the root area completely
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX;
              const y = e.clientY;
              if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                setDropTarget(null);
              }
            }}
            onDrop={handleDropToRoot}
          >
            {renderFileTree(files)}
          </div>
        )}
        </div>
      </div>

      {/* Current folder path - Fixed at bottom */}
      {currentFolder && (
        <Tooltip content={currentFolder}>
          <div
            className="border-t border-gray-200 bg-gray-50 px-4 py-2 cursor-default"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                entry: { name: '', path: currentFolder, type: 'directory' } as FileEntry
              });
            }}
          >
            <div className="text-xs text-gray-600 truncate font-medium">
              📁 {currentFolder.split('/').pop() || currentFolder}
            </div>
          </div>
        </Tooltip>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[200]"
          style={{
            left: `${adjustedMenuPosition?.x ?? contextMenu.x}px`,
            top: `${adjustedMenuPosition?.y ?? contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.entry.name === '' ? (
            // Folder path context menu
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.entry.path);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                경로 복사
              </button>
              <button
                onClick={() => handleRevealInFinder(contextMenu.entry)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                Finder에서 보기
              </button>
            </>
          ) : (
            // File/folder item context menu
            <>
              <button
                onClick={() => handleOpenWithDefault(contextMenu.entry)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                기본 앱에서 열기
              </button>
              <button
                onClick={() => handleRevealInFinder(contextMenu.entry)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                Finder에서 보기
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={() => handleDuplicate(contextMenu.entry)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                복제
              </button>
              <button
                onClick={() => handleRename(contextMenu.entry)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                이름 변경
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={() => handleDelete(contextMenu.entry)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
            </>
          )}
        </div>
      )}

      {/* Drag and Drop Info Overlay */}
      {draggedItem && dropTarget && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white px-6 py-4 rounded-lg shadow-2xl z-[300] pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="text-lg font-medium">{draggedItem.name}</div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="text-lg font-medium">{getDropTargetName()}</div>
          </div>
          <div className="text-sm text-gray-300 mt-1 text-center">
            {draggedItem.type === 'directory' ? '폴더' : '파일'}를 이동합니다
          </div>
        </div>
      )}
    </div>
  );
};
