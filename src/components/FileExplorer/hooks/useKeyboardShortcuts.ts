import { useEffect } from 'react';
import type { FileEntry } from '../../../types/electron';

interface UseKeyboardShortcutsProps {
  isOpen: boolean;
  selectedFiles: string[];
  clipboard: FileEntry[];
  isRenaming: string | null;
  findEntryInAll: (path: string) => FileEntry | null;
  copyToClipboard: (entries: FileEntry[]) => void;
  handleDelete: (entry: FileEntry) => Promise<void>;
  handleMultiDelete: () => Promise<void>;
  handleDuplicate: (entry: FileEntry) => Promise<void>;
  handleMultiDuplicate: () => Promise<void>;
  handlePaste: () => Promise<void>;
  handleRename: (entry: FileEntry) => void;
}

/**
 * 키보드 단축키 관리 hook
 * Cmd+C/V/D, Delete, Enter 등의 단축키 처리
 */
export const useKeyboardShortcuts = ({
  isOpen,
  selectedFiles,
  clipboard,
  isRenaming,
  findEntryInAll,
  copyToClipboard,
  handleDelete,
  handleMultiDelete,
  handleDuplicate,
  handleMultiDuplicate,
  handlePaste,
  handleRename,
}: UseKeyboardShortcutsProps): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when file explorer is open and something is selected
      if (!isOpen || selectedFiles.length === 0) return;

      // Don't interfere with input fields or contenteditable elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.isContentEditable) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Find the currently selected entry (first selected item)
      const currentEntry = findEntryInAll(selectedFiles[0]);
      if (!currentEntry) return;

      // Cmd+Backspace: Delete (supports multi-selection)
      if (cmdKey && e.key === 'Backspace') {
        e.preventDefault();
        if (selectedFiles.length > 1) {
          handleMultiDelete();
        } else {
          handleDelete(currentEntry);
        }
        return;
      }

      // Cmd+C: Copy (supports multi-selection)
      if (cmdKey && e.key === 'c') {
        e.preventDefault();
        if (selectedFiles.length > 1) {
          // Copy all selected files
          const entriesToCopy: FileEntry[] = [];
          for (const path of selectedFiles) {
            const entry = findEntryInAll(path);
            if (entry) entriesToCopy.push(entry);
          }
          copyToClipboard(entriesToCopy);
        } else {
          copyToClipboard([currentEntry]);
        }
        return;
      }

      // Cmd+V: Paste (duplicate)
      if (cmdKey && e.key === 'v' && clipboard.length > 0) {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Cmd+D: Duplicate (supports multi-selection)
      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        if (selectedFiles.length > 1) {
          handleMultiDuplicate();
        } else {
          handleDuplicate(currentEntry);
        }
        return;
      }

      // Enter: Rename
      if (e.key === 'Enter' && !isRenaming) {
        e.preventDefault();
        handleRename(currentEntry);
        return;
      }

      // Delete/Backspace (without Cmd): Delete (supports multi-selection)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !cmdKey) {
        e.preventDefault();
        if (selectedFiles.length > 1) {
          handleMultiDelete();
        } else {
          handleDelete(currentEntry);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedFiles,
    clipboard,
    isRenaming,
    findEntryInAll,
    copyToClipboard,
    handleDelete,
    handleMultiDelete,
    handleDuplicate,
    handleMultiDuplicate,
    handlePaste,
    handleRename,
  ]);
};
