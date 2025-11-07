import React from 'react';
import type { FileEntry } from '../../../types/electron';
import { Tooltip } from '../../Tooltip';

interface FileItemProps {
  entry: FileEntry;
  depth: number;

  // State
  isRenaming: boolean;
  renameValue: string;
  isSelected: boolean;
  isCurrentFile: boolean;
  isDragged: boolean;
  isDropTarget: boolean;
  isExpanded: boolean;

  // Rename handlers
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;

  // Drag and drop handlers
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;

  // Click handlers
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;

  // Tooltip
  tooltipContent: React.ReactNode;
}

/**
 * 단일 파일/폴더 항목 렌더링 컴포넌트
 * Rename 모드와 Normal 모드 지원
 */
export const FileItem: React.FC<FileItemProps> = ({
  entry,
  depth,
  isRenaming,
  renameValue,
  isSelected,
  isCurrentFile,
  isDragged,
  isDropTarget,
  isExpanded,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onClick,
  onContextMenu,
  tooltipContent,
}) => {
  const paddingLeft = `${8 + depth * 16}px`;

  // Rename 모드
  if (isRenaming) {
    return (
      <div
        className="w-full flex items-center gap-2 px-2 py-1.5"
        style={{ paddingLeft }}
      >
        {entry.type === 'directory' && <span className="w-3" />}
        {entry.type === 'file' && <span className="w-3" />}
        <input
          type="text"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameSubmit}
          className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      </div>
    );
  }

  // Normal 모드
  const buttonClassName = `w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left ${
    isCurrentFile && entry.type === 'file'
      ? 'bg-blue-100 text-blue-700'
      : isSelected
      ? 'bg-blue-50 text-blue-600'
      : isDragged
      ? 'opacity-50'
      : isDropTarget && entry.type === 'directory'
      ? 'bg-green-100 border-2 border-green-400'
      : 'hover:bg-gray-100 text-gray-700'
  }`;

  return (
    <Tooltip content={tooltipContent}>
      <button
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={buttonClassName}
        style={{ paddingLeft }}
      >
        {/* 폴더 확장/축소 아이콘 */}
        {entry.type === 'directory' && (
          <svg
            className={`w-3 h-3 transition-transform ${
              isExpanded ? 'rotate-90' : ''
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

        {/* 파일 아이콘 (빈 공간) */}
        {entry.type === 'file' && <span className="w-3" />}

        {/* 파일/폴더 이름 */}
        <span className="flex-1 truncate">{entry.name}</span>
      </button>
    </Tooltip>
  );
};
