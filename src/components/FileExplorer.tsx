import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FileEntry, SortOrder } from '../types/electron';
import { Tooltip } from './Tooltip';

// Hooks
import { useFileTree } from './FileExplorer/hooks/useFileTree';
import { useFileOperations } from './FileExplorer/hooks/useFileOperations';
import { useFileSelection } from './FileExplorer/hooks/useFileSelection';
import { useDragAndDrop } from './FileExplorer/hooks/useDragAndDrop';
import { useKeyboardShortcuts } from './FileExplorer/hooks/useKeyboardShortcuts';

// Components
import { FileToolbar } from './FileExplorer/components/FileToolbar';
import { FileInputDialog } from './FileExplorer/components/FileInputDialog';
import { FileList } from './FileExplorer/components/FileList';
import { FileContextMenu } from './FileExplorer/components/FileContextMenu';

// Utils
import {
  findEntryInAll,
  getFileTooltipContent,
  getFolderTooltipContent,
  getDraggedItemsLabel,
  getDropTargetName,
} from './FileExplorer/utils/fileUtils';

interface FileExplorerProps {
  isOpen: boolean;
  currentFolder: string | null;
  currentFile: string | null;
  selectedFiles: string[];
  onSelectFolder: () => void;
  onSelectFile: (filePath: string) => void;
  onLoadFileInMultiSelect: (filePath: string) => Promise<void>;
  onFileSelection: (selectedPaths: string[]) => void;
  onFolderSelection: (folderPath: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile?: (filePath: string) => void;
  refreshTrigger?: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  isOpen,
  currentFolder,
  currentFile,
  selectedFiles,
  onSelectFolder,
  onSelectFile,
  onLoadFileInMultiSelect,
  onFileSelection,
  onFolderSelection,
  onCreateFile,
  onDeleteFile,
  refreshTrigger = 0,
}) => {
  // 메인 컴포넌트 state (3개)
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null);

  // Hooks
  const { t } = useTranslation();
  const fileTree = useFileTree({
    currentFolder,
    isOpen,
    refreshTrigger,
    sortOrder,
  });

  // Helper function for fileOps and dragDrop
  const handleRefresh = async () => {
    if (currentFolder) {
      await fileTree.loadFiles(currentFolder);
    }
  };

  // Helper function to find entry
  const findEntry = (path: string): FileEntry | null => {
    return findEntryInAll(path, fileTree.files, fileTree.folderContents);
  };

  const fileOps = useFileOperations({
    currentFolder,
    selectedFiles,
    onCreateFile,
    onDeleteFile,
    onRefresh: handleRefresh,
    findEntryInAll: findEntry,
  });

  const selection = useFileSelection({
    currentFile,
    selectedFiles,
    onSelectFile,
    onLoadFileInMultiSelect,
    onFileSelection,
    onFolderSelection,
    getFlatFileList: fileTree.getFlatFileList,
    findEntryInAll: findEntry,
    toggleFolder: fileTree.toggleFolder,
  });

  const dragDrop = useDragAndDrop({
    currentFolder,
    selectedFiles,
    expandedFolders: fileTree.expandedFolders,
    toggleFolder: fileTree.toggleFolder,
    findEntryInAll: findEntry,
    onRefresh: handleRefresh,
  });

  useKeyboardShortcuts({
    isOpen,
    selectedFiles,
    clipboard: fileOps.clipboard,
    isRenaming: fileOps.isRenaming,
    findEntryInAll: findEntry,
    copyToClipboard: fileOps.copyToClipboard,
    handlePaste: fileOps.handlePaste,
    handleDuplicate: fileOps.handleDuplicate,
    handleMultiDuplicate: fileOps.handleMultiDuplicate,
    handleDelete: fileOps.handleDelete,
    handleMultiDelete: fileOps.handleMultiDelete,
    handleRename: fileOps.handleRename,
  });

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

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  // Get tooltip content for file/folder
  const getTooltipContent = (entry: FileEntry): React.ReactNode => {
    if (entry.type === 'file') {
      return getFileTooltipContent(entry);
    } else {
      return getFolderTooltipContent(entry, fileTree.folderContents);
    }
  };

  // Sort files before rendering
  const sortedFiles = fileTree.sortFiles(fileTree.files);

  if (!isOpen) return null;

  return (
    <div
      className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg flex flex-col"
      style={{ zIndex: 50, paddingTop: '52px' }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Toolbar */}
          <FileToolbar
            currentFolder={currentFolder}
            expandedFolders={fileTree.expandedFolders}
            isExpanding={fileTree.isExpanding}
            sortOrder={sortOrder}
            showSortMenu={showSortMenu}
            onSortOrderChange={(order) => {
              setSortOrder(order);
              setShowSortMenu(false);
            }}
            onToggleSortMenu={() => setShowSortMenu(!showSortMenu)}
            onCreateFile={() => fileOps.setIsCreatingFile(true)}
            onCreateFolder={() => fileOps.setIsCreatingFolder(true)}
            onExpandAll={fileTree.handleExpandAll}
            onCollapseAll={fileTree.handleCollapseAll}
            onSelectFolder={onSelectFolder}
          />

          {/* File Input Dialog */}
          {fileOps.isCreatingFile && (
            <FileInputDialog
              type="file"
              value={fileOps.newFileName}
              onChange={fileOps.setNewFileName}
              onSubmit={fileOps.handleCreateFileSubmit}
              onCancel={fileOps.handleCreateFileCancel}
            />
          )}

          {/* Folder Input Dialog */}
          {fileOps.isCreatingFolder && (
            <FileInputDialog
              type="folder"
              value={fileOps.newFolderName}
              onChange={fileOps.setNewFolderName}
              onSubmit={fileOps.handleCreateFolderSubmit}
              onCancel={fileOps.handleCreateFolderCancel}
            />
          )}

          {/* File Tree or Empty State */}
          {!currentFolder ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {t('fileExplorer.noFolderSelected')}
            </div>
          ) : (
            <div
              className="space-y-1 min-h-[200px]"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dragDrop.setDropTarget('root');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                  dragDrop.setDropTarget(null);
                }
              }}
              onDrop={dragDrop.handleDropToRoot}
            >
              <FileList
                entries={sortedFiles}
                depth={0}
                expandedFolders={fileTree.expandedFolders}
                folderContents={fileTree.folderContents}
                selectedFiles={selectedFiles}
                currentFile={currentFile}
                draggedItems={dragDrop.draggedItems}
                dropTarget={dragDrop.dropTarget}
                isRenaming={fileOps.isRenaming}
                renameValue={fileOps.renameValue}
                onRenameChange={(value) => fileOps.setRenameValue(value)}
                onRenameSubmit={(entry) => fileOps.handleRenameSubmit(entry)}
                onRenameCancel={fileOps.handleRenameCancel}
                onDragStart={dragDrop.handleDragStart}
                onDragOver={dragDrop.handleDragOver}
                onDragLeave={dragDrop.handleDragLeave}
                onDrop={dragDrop.handleDrop}
                onDragEnd={dragDrop.handleDragEnd}
                onClick={selection.handleFileClick}
                onContextMenu={handleContextMenu}
                getTooltipContent={getTooltipContent}
              />
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
        <FileContextMenu
          contextMenu={contextMenu}
          onClose={() => setContextMenu(null)}
          selectedFiles={selectedFiles}
          onCopyPath={() => {
            navigator.clipboard.writeText(contextMenu.entry.path);
            setContextMenu(null);
          }}
          onRevealInFinder={fileOps.handleRevealInFinder}
          onOpenWithDefault={fileOps.handleOpenWithDefault}
          onDuplicate={fileOps.handleDuplicate}
          onMultiDuplicate={fileOps.handleMultiDuplicate}
          onRename={fileOps.handleRename}
          onDelete={fileOps.handleDelete}
          onMultiDelete={fileOps.handleMultiDelete}
        />
      )}

      {/* Drag and Drop Info Overlay */}
      {dragDrop.draggedItems.length > 0 && dragDrop.dropTarget && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white px-6 py-4 rounded-lg shadow-2xl z-[300] pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="text-lg font-medium">
              {getDraggedItemsLabel(dragDrop.draggedItems)}
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="text-lg font-medium">
              {getDropTargetName(
                dragDrop.dropTarget,
                currentFolder,
                fileTree.files,
                fileTree.folderContents
              )}
            </div>
          </div>
          <div className="text-sm text-gray-300 mt-1 text-center">
            {dragDrop.draggedItems.length === 1
              ? t(dragDrop.draggedItems[0].type === 'directory' ? 'fileOperations.movingFolder' : 'fileOperations.movingFile')
              : t('fileOperations.movingMulti', { count: dragDrop.draggedItems.length })
            }
          </div>
        </div>
      )}
    </div>
  );
};
