import React, { useEffect, useRef, useState } from 'react';
import type { FileEntry } from '../../../types/electron';

interface FileContextMenuProps {
  // Menu state
  contextMenu: { x: number; y: number; entry: FileEntry } | null;
  onClose: () => void;

  // Selection state
  selectedFiles: string[];

  // Handlers
  onCopyPath: () => void;
  onRevealInFinder: (entry: FileEntry) => void;
  onOpenWithDefault: (entry: FileEntry) => void;
  onDuplicate: (entry: FileEntry) => void;
  onMultiDuplicate: () => void;
  onRename: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  onMultiDelete: () => void;
}

/**
 * 파일/폴더 우클릭 컨텍스트 메뉴 컴포넌트
 * 세 가지 메뉴 타입 지원:
 * 1. 폴더 경로 메뉴 (entry.name === ''): 경로 복사, Finder에서 보기
 * 2. 다중 선택 메뉴: 모두 복제, 모두 삭제
 * 3. 단일 항목 메뉴: 열기, 복제, 이름 변경, 삭제
 */
export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  contextMenu,
  onClose,
  selectedFiles,
  onCopyPath,
  onRevealInFinder,
  onOpenWithDefault,
  onDuplicate,
  onMultiDuplicate,
  onRename,
  onDelete,
  onMultiDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu, onClose]);

  // Adjust menu position to keep it within window bounds
  useEffect(() => {
    if (!contextMenu || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
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

    setAdjustedPosition({ x, y });
  }, [contextMenu]);

  if (!contextMenu) return null;

  const isFolderPathMenu = contextMenu.entry.name === '';
  const isMultiSelection = selectedFiles.length > 1 && selectedFiles.includes(contextMenu.entry.path);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[200]"
      style={{
        left: `${adjustedPosition?.x ?? contextMenu.x}px`,
        top: `${adjustedPosition?.y ?? contextMenu.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isFolderPathMenu ? (
        // 폴더 경로 메뉴
        <>
          <button
            onClick={() => {
              onCopyPath();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            경로 복사
          </button>
          <button
            onClick={() => {
              onRevealInFinder(contextMenu.entry);
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            Finder에서 보기
          </button>
        </>
      ) : isMultiSelection ? (
        // 다중 선택 메뉴
        <>
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
            {selectedFiles.length}개 항목 선택됨
          </div>
          <button
            onClick={() => {
              onMultiDuplicate();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            모두 복제
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              onMultiDelete();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            모두 삭제
          </button>
        </>
      ) : (
        // 단일 항목 메뉴
        <>
          <button
            onClick={() => {
              onOpenWithDefault(contextMenu.entry);
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            기본 앱에서 열기
          </button>
          <button
            onClick={() => {
              onRevealInFinder(contextMenu.entry);
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            Finder에서 보기
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              onDuplicate(contextMenu.entry);
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            복제
          </button>
          <button
            onClick={() => {
              onRename(contextMenu.entry);
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            이름 변경
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              onDelete(contextMenu.entry);
              onClose();
            }}
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
  );
};
