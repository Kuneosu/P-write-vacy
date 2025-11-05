import React, { useState, useEffect } from 'react';
import type { FileEntry } from '../types/electron';

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
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

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

  const loadFiles = async (folderPath: string) => {
    if (!window.electron) return;
    const entries = await window.electron.readDirectory(folderPath);
    setFiles(entries);
  };

  const toggleFolder = async (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      return expandedFolders.has(entry.path) ? '📂' : '📁';
    }
    switch (entry.ext) {
      case '.md':
      case '.markdown':
        return '📝';
      case '.txt':
        return '📄';
      case '.json':
        return '📋';
      case '.log':
        return '📊';
      default:
        return '📄';
    }
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
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="새 파일"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
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

        {!currentFolder ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            폴더를 선택하세요
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((entry) => (
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
                >
                  <span className="text-base">{getFileIcon(entry)}</span>
                  <span className="flex-1 truncate">{entry.name}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
