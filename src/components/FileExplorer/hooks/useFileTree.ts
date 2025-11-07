import { useState, useEffect } from 'react';
import type { FileEntry, SortOrder } from '../../../types/electron';

interface UseFileTreeProps {
  currentFolder: string | null;
  sortOrder: SortOrder;
  isOpen?: boolean;
  refreshTrigger?: number;
}

interface UseFileTreeReturn {
  // State
  files: FileEntry[];
  expandedFolders: Set<string>;
  folderContents: Map<string, FileEntry[]>;

  // File loading
  loadFiles: (folderPath: string) => Promise<void>;

  // Folder operations
  toggleFolder: (folderPath: string) => Promise<void>;
  handleExpandAll: () => Promise<void>;
  handleCollapseAll: () => void;

  // Utilities
  getAllFolderPaths: (entries: FileEntry[]) => string[];
  getFlatFileList: () => FileEntry[];
}

/**
 * 파일 트리 상태 관리 hook
 * 파일 로딩, 폴더 확장/축소, 파일 정렬 등을 담당
 */
export const useFileTree = ({
  currentFolder,
  sortOrder,
  isOpen = false,
  refreshTrigger = 0,
}: UseFileTreeProps): UseFileTreeReturn => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Map<string, FileEntry[]>>(new Map());

  // 파일 정렬 함수
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

  // 폴더의 파일 목록 로드
  const loadFiles = async (folderPath: string) => {
    if (!window.electron) return;
    const entries = await window.electron.readDirectory(folderPath);
    setFiles(entries);
    // 폴더 내용 캐시 초기화
    setFolderContents(new Map());
    setExpandedFolders(new Set());
  };

  // 폴더 확장/축소 토글
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

  // 모든 폴더 확장
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

  // 모든 폴더 축소
  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
  };

  // 모든 폴더 경로 가져오기 (재귀적)
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

  // 평평한 파일 목록 가져오기 (정렬 및 확장된 폴더 포함)
  const getFlatFileList = (): FileEntry[] => {
    const result: FileEntry[] = [];

    const addEntries = (entries: FileEntry[]) => {
      const sorted = sortFiles(entries);
      for (const entry of sorted) {
        result.push(entry);
        if (entry.type === 'directory' && expandedFolders.has(entry.path)) {
          const subEntries = folderContents.get(entry.path);
          if (subEntries) {
            addEntries(subEntries);
          }
        }
      }
    };

    addEntries(files);
    return result;
  };

  // Load files when currentFolder changes
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

  return {
    files,
    expandedFolders,
    folderContents,
    loadFiles,
    toggleFolder,
    handleExpandAll,
    handleCollapseAll,
    getAllFolderPaths,
    getFlatFileList,
  };
};
