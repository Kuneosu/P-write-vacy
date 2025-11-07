import { useState } from 'react';
import type { FileEntry } from '../../../types/electron';

interface UseFileSelectionProps {
  selectedFiles: string[];
  currentFile: string | null;
  onSelectFile: (filePath: string) => void;
  onFileSelection: (selectedPaths: string[]) => void;
  onFolderSelection: (folderPath: string) => void;
  onLoadFileInMultiSelect: (filePath: string) => Promise<void>;
  getFlatFileList: () => FileEntry[];
  findEntryInAll: (path: string) => FileEntry | null;
  toggleFolder: (folderPath: string) => Promise<void>;
}

interface UseFileSelectionReturn {
  lastSelectedFile: string | null;
  handleFileClick: (entry: FileEntry, e: React.MouseEvent) => Promise<void>;
  isSelected: (path: string) => boolean;
}

/**
 * 파일/폴더 선택 관리 hook
 * 단일 선택, 다중 선택 (Cmd/Ctrl + Click, Shift + Click) 로직 담당
 */
export const useFileSelection = ({
  selectedFiles,
  currentFile,
  onSelectFile,
  onFileSelection,
  onFolderSelection,
  onLoadFileInMultiSelect,
  getFlatFileList,
  findEntryInAll,
  toggleFolder,
}: UseFileSelectionProps): UseFileSelectionReturn => {
  const [lastSelectedFile, setLastSelectedFile] = useState<string | null>(null);

  // 파일 내용 로드 (다중 선택용)
  const loadFileContent = async (filePath: string) => {
    await onLoadFileInMultiSelect(filePath);
  };

  // 파일/폴더 클릭 핸들러
  const handleFileClick = async (entry: FileEntry, e: React.MouseEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    const shiftKey = e.shiftKey;

    // Multi-selection mode: Shift or Cmd/Ctrl pressed
    if (shiftKey || cmdKey) {
      if (shiftKey && (lastSelectedFile || selectedFiles.length > 0)) {
        // Shift click: range selection (includes both files and folders)
        const flatList = getFlatFileList();
        const anchorFile = lastSelectedFile || selectedFiles[0];
        const lastIndex = flatList.findIndex(f => f.path === anchorFile);
        const currentIndex = flatList.findIndex(f => f.path === entry.path);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeItems = flatList.slice(start, end + 1).map(f => f.path);

          // Set range as new selection
          onFileSelection(rangeItems);

          // Load the clicked file if it's a file
          if (entry.type === 'file') {
            await loadFileContent(entry.path);
          }
          setLastSelectedFile(entry.path);
        }
      } else if (cmdKey) {
        // Cmd/Ctrl click: toggle individual item (file or folder)
        const isSelected = selectedFiles.includes(entry.path);

        if (isSelected) {
          // Deselect
          const newSelection = selectedFiles.filter(p => p !== entry.path);
          onFileSelection(newSelection.length > 0 ? newSelection : []);

          // If deselecting current file, select the first remaining file
          if (currentFile === entry.path && newSelection.length > 0) {
            const firstFile = newSelection.find(path => {
              const item = findEntryInAll(path);
              return item?.type === 'file';
            });
            if (firstFile) {
              await loadFileContent(firstFile);
              setLastSelectedFile(firstFile);
            }
          }
        } else {
          // Add to selection
          const newSelection = [...selectedFiles, entry.path];
          onFileSelection(newSelection);

          // Load the file if it's a file
          if (entry.type === 'file') {
            await loadFileContent(entry.path);
          }
          setLastSelectedFile(entry.path);
        }
      }
    } else {
      // Normal click: single selection and folder toggle
      if (entry.type === 'directory') {
        // Toggle folder and select it (clear currentFile but keep editor content)
        await toggleFolder(entry.path);
        onFolderSelection(entry.path);
        setLastSelectedFile(entry.path);
      } else {
        // Select file
        onSelectFile(entry.path);
        setLastSelectedFile(entry.path);
      }
    }
  };

  // 선택 여부 확인
  const isSelected = (path: string): boolean => {
    return selectedFiles.includes(path);
  };

  return {
    lastSelectedFile,
    handleFileClick,
    isSelected,
  };
};
