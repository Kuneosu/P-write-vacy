import React, { useState, useEffect } from 'react';
import type { FileEntry, SortOrder } from '../types/electron';

interface FileExplorerProps {
  isOpen: boolean;
  currentFolder: string | null;
  currentFile: string | null;
  onSelectFolder: () => void;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (fileName: string) => void;
  refreshTrigger?: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  isOpen,
  currentFolder,
  currentFile,
  onSelectFolder,
  onSelectFile,
  onCreateFile,
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

  const renderFileTree = (entries: FileEntry[], depth: number = 0): React.ReactNode => {
    return sortFiles(entries).map((entry) => (
      <div key={entry.path}>
        <button
          onClick={() => {
            if (entry.type === 'directory') {
              toggleFolder(entry.path);
            } else {
              onSelectFile(entry.path);
            }
          }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left ${
            currentFile === entry.path
              ? 'bg-blue-100 text-blue-700'
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
      className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg overflow-y-auto"
      style={{ zIndex: 50, paddingTop: '52px' }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">파일</h3>
          <div className="flex gap-2">
            {currentFolder && (
              <>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="새 파일"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="새 폴더"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </button>
                <div className="relative sort-menu-container">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="정렬 순서"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </button>
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
            <button
              onClick={onSelectFolder}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="폴더 열기"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </button>
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
          <div className="space-y-1">
            {renderFileTree(files)}
          </div>
        )}
      </div>
    </div>
  );
};
