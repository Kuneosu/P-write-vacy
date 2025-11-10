import React from 'react';
import type { FileEntry } from '../../../types/electron';
import { FileItem } from './FileItem';

interface FileListProps {
  entries: FileEntry[];
  depth?: number;

  // Tree state
  expandedFolders: Set<string>;
  folderContents: Map<string, FileEntry[]>;

  // Selection state
  selectedFiles: string[];
  currentFile: string | null;

  // Drag and drop state
  draggedItems: FileEntry[];
  dropTarget: string | null;

  // Rename state
  isRenaming: string | null;
  renameValue: string;

  // Handlers
  onRenameChange: (value: string) => void;
  onRenameSubmit: (entry: FileEntry) => void;
  onRenameCancel: () => void;
  onDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  onDragOver: (e: React.DragEvent, entry: FileEntry) => void;
  onDragLeave: (e: React.DragEvent, entry: FileEntry) => void;
  onDrop: (e: React.DragEvent, entry: FileEntry) => void;
  onDragEnd: () => void;
  onClick: (entry: FileEntry, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;

  // Tooltip content generator
  getTooltipContent: (entry: FileEntry) => React.ReactNode;
}

/**
 * 파일 트리를 재귀적으로 렌더링하는 컴포넌트
 * FileItem을 사용하여 각 항목을 렌더링하고, 폴더인 경우 하위 항목을 재귀 렌더링
 * React.memo로 최적화하여 1000+ 파일에서도 성능 유지
 */
const FileListComponent: React.FC<FileListProps> = ({
  entries,
  depth = 0,
  expandedFolders,
  folderContents,
  selectedFiles,
  currentFile,
  draggedItems,
  dropTarget,
  isRenaming,
  renameValue,
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
  getTooltipContent,
}) => {
  // entries는 이미 부모에서 정렬된 상태로 전달됨
  return (
    <>
      {entries.map((entry) => (
        <div key={entry.path}>
          <FileItem
            entry={entry}
            depth={depth}
            isRenaming={isRenaming === entry.path}
            renameValue={renameValue}
            isSelected={selectedFiles.includes(entry.path)}
            isCurrentFile={currentFile === entry.path}
            isDragged={draggedItems.some(item => item.path === entry.path)}
            isDropTarget={dropTarget === entry.path}
            isExpanded={expandedFolders.has(entry.path)}
            onRenameChange={onRenameChange}
            onRenameSubmit={() => onRenameSubmit(entry)}
            onRenameCancel={onRenameCancel}
            onDragStart={(e) => onDragStart(e, entry)}
            onDragOver={(e) => onDragOver(e, entry)}
            onDragLeave={(e) => onDragLeave(e, entry)}
            onDrop={(e) => onDrop(e, entry)}
            onDragEnd={onDragEnd}
            onClick={(e) => onClick(entry, e)}
            onContextMenu={(e) => onContextMenu(e, entry)}
            tooltipContent={getTooltipContent(entry)}
          />

          {/* 폴더인 경우 하위 항목 재귀 렌더링 */}
          {entry.type === 'directory' &&
           expandedFolders.has(entry.path) &&
           folderContents.has(entry.path) && (
            <div>
              <FileList
                entries={folderContents.get(entry.path)!}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                folderContents={folderContents}
                selectedFiles={selectedFiles}
                currentFile={currentFile}
                draggedItems={draggedItems}
                dropTarget={dropTarget}
                isRenaming={isRenaming}
                renameValue={renameValue}
                onRenameChange={onRenameChange}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onClick={onClick}
                onContextMenu={onContextMenu}
                getTooltipContent={getTooltipContent}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
};

// Export memoized version for performance optimization (1000+ files)
export const FileList = React.memo(FileListComponent);
