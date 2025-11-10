import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FileEntry } from '../../../types/electron';
import { useToast } from '../../../contexts/ToastContext';

interface UseDragAndDropProps {
  selectedFiles: string[];
  currentFolder: string | null;
  expandedFolders: Set<string>;
  findEntryInAll: (path: string) => FileEntry | null;
  toggleFolder: (folderPath: string) => Promise<void>;
  onRefresh: (expandedFolders: Set<string>) => Promise<void>;
}

interface UseDragAndDropReturn {
  draggedItems: FileEntry[];
  dropTarget: string | null;
  setDropTarget: (target: string | null) => void;
  handleDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  handleDragOver: (e: React.DragEvent, entry: FileEntry) => void;
  handleDragLeave: (e: React.DragEvent, entry: FileEntry) => void;
  handleDrop: (e: React.DragEvent, targetEntry: FileEntry) => Promise<void>;
  handleDropToRoot: (e: React.DragEvent) => Promise<void>;
  handleDragEnd: () => void;
}

/**
 * 드래그 앤 드롭 관리 hook
 * 파일/폴더 드래그 앤 드롭, 자동 폴더 확장 등을 담당
 */
export const useDragAndDrop = ({
  selectedFiles,
  currentFolder,
  expandedFolders,
  findEntryInAll,
  toggleFolder,
  onRefresh,
}: UseDragAndDropProps): UseDragAndDropReturn => {
  const { t } = useTranslation();
  const toast = useToast();

  const [draggedItems, setDraggedItems] = useState<FileEntry[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragOverTimer, setDragOverTimer] = useState<number | null>(null);

  // Cleanup drag over timer on unmount
  useEffect(() => {
    return () => {
      if (dragOverTimer) {
        clearTimeout(dragOverTimer);
      }
    };
  }, [dragOverTimer]);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, entry: FileEntry) => {
    // If dragging a selected file, drag all selected files
    // If dragging an unselected file, drag only that file
    if (selectedFiles.includes(entry.path) && selectedFiles.length > 1) {
      const entriesToDrag: FileEntry[] = [];
      for (const path of selectedFiles) {
        const foundEntry = findEntryInAll(path);
        if (foundEntry) entriesToDrag.push(foundEntry);
      }
      setDraggedItems(entriesToDrag);
    } else {
      setDraggedItems([entry]);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entry.path);
  };

  // 드래그 오버 (자동 폴더 확장 포함)
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
        const timer = window.setTimeout(() => {
          toggleFolder(entry.path);
          setDragOverTimer(null);
        }, 500);
        setDragOverTimer(timer);
      }
    }
  };

  // 드래그 리브
  const handleDragLeave = (_e: React.DragEvent, _entry: FileEntry) => {
    // Don't preventDefault or stopPropagation - let it bubble to root

    // Don't clear the timer here - child elements can trigger dragLeave
    // Timer will be cleared when moving to another folder or when drag ends

    // Don't clear dropTarget here - let dragOver events handle it
    // This allows smooth transition from folder to root area
  };

  // 폴더에 드롭
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

    if (draggedItems.length === 0 || !window.electron || !currentFolder) {
      return;
    }

    // Can't drop on files, only on directories
    if (targetEntry.type !== 'directory') {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const draggedItem of draggedItems) {
      // Can't drop on itself
      if (draggedItem.path === targetEntry.path) {
        continue;
      }

      // Can't drop parent folder into its child
      if (targetEntry.path.startsWith(draggedItem.path + '/')) {
        toast.warning(t('fileOperations.cannotMoveToChild'));
        continue;
      }

      // Move the file/folder
      const fileName = draggedItem.name;
      const newPath = `${targetEntry.path}/${fileName}`;

      const result = await window.electron.renameFile(draggedItem.path, newPath);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to move ${draggedItem.path}:`, result.error);
      }
    }

    // Refresh with expanded folders
    await onRefresh(expandedFolders);

    if (failCount > 0) {
      toast.warning(t('fileOperations.movePartial', { successCount, failCount }));
    } else if (successCount > 0) {
      toast.success(t('fileOperations.movedMulti', { count: successCount }));
    }

    setDraggedItems([]);
  };

  // 루트에 드롭
  const handleDropToRoot = async (e: React.DragEvent) => {
    e.preventDefault();

    // Clear the timer when dropping
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }

    setDropTarget(null);

    if (draggedItems.length === 0 || !window.electron || !currentFolder) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const draggedItem of draggedItems) {
      // Can't drop if already in root
      const draggedItemParent = draggedItem.path.substring(0, draggedItem.path.lastIndexOf('/'));
      if (draggedItemParent === currentFolder) {
        continue;
      }

      // Move to root
      const fileName = draggedItem.name;
      const newPath = `${currentFolder}/${fileName}`;

      const result = await window.electron.renameFile(draggedItem.path, newPath);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to move ${draggedItem.path}:`, result.error);
      }
    }

    // Refresh with expanded folders
    await onRefresh(expandedFolders);

    if (failCount > 0) {
      toast.warning(t('fileOperations.movePartial', { successCount, failCount }));
    } else if (successCount > 0) {
      toast.success(t('fileOperations.movedMulti', { count: successCount }));
    }

    setDraggedItems([]);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    // Clear the timer when drag ends
    if (dragOverTimer) {
      clearTimeout(dragOverTimer);
      setDragOverTimer(null);
    }

    setDraggedItems([]);
    setDropTarget(null);
  };

  return {
    draggedItems,
    dropTarget,
    setDropTarget,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropToRoot,
    handleDragEnd,
  };
};
