import { useState } from 'react';
import type { FileEntry } from '../../../types/electron';
import { useToast } from '../../../contexts/ToastContext';

interface UseFileOperationsProps {
  currentFolder: string | null;
  selectedFiles: string[];
  onCreateFile: (fileName: string) => void;
  onDeleteFile?: (filePath: string) => void;
  onRefresh: () => Promise<void>;
  findEntryInAll: (path: string) => FileEntry | null;
}

interface UseFileOperationsReturn {
  // File creation state
  isCreatingFile: boolean;
  newFileName: string;
  setIsCreatingFile: (value: boolean) => void;
  setNewFileName: (value: string) => void;
  handleCreateFileSubmit: () => void;
  handleCreateFileCancel: () => void;

  // Folder creation state
  isCreatingFolder: boolean;
  newFolderName: string;
  setIsCreatingFolder: (value: boolean) => void;
  setNewFolderName: (value: string) => void;
  handleCreateFolderSubmit: () => Promise<void>;
  handleCreateFolderCancel: () => void;

  // Rename state
  isRenaming: string | null;
  renameValue: string;
  setRenameValue: (value: string) => void;
  handleRename: (entry: FileEntry) => void;
  handleRenameSubmit: (entry: FileEntry) => Promise<void>;
  handleRenameCancel: () => void;

  // Clipboard
  clipboard: FileEntry[];
  copyToClipboard: (entries: FileEntry[]) => void;

  // File operations
  handleDelete: (entry: FileEntry) => Promise<void>;
  handleMultiDelete: () => Promise<void>;
  handleDuplicate: (entry: FileEntry) => Promise<void>;
  handleMultiDuplicate: () => Promise<void>;
  handlePaste: () => Promise<void>;
  handleOpenWithDefault: (entry: FileEntry) => Promise<void>;
  handleRevealInFinder: (entry: FileEntry) => Promise<void>;
}

/**
 * 파일/폴더 CRUD 작업 관리 hook
 * 생성, 읽기, 수정, 삭제, 복제, 이름변경 등을 담당
 */
export const useFileOperations = ({
  currentFolder,
  selectedFiles,
  onCreateFile,
  onDeleteFile,
  onRefresh,
  findEntryInAll,
}: UseFileOperationsProps): UseFileOperationsReturn => {
  const toast = useToast();

  // File creation state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Folder creation state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Rename state
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState<FileEntry[]>([]);

  // 파일 생성
  const handleCreateFileSubmit = () => {
    if (newFileName.trim()) {
      let fileName = newFileName.trim();

      // 확장자가 없으면 .txt 추가
      const lastDotIndex = fileName.lastIndexOf('.');
      const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;

      if (!hasExtension) {
        fileName = fileName + '.txt';
      }

      onCreateFile(fileName);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleCreateFileCancel = () => {
    setNewFileName('');
    setIsCreatingFile(false);
  };

  // 폴더 생성
  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim() || !currentFolder || !window.electron) return;

    const result = await window.electron.createFolder(currentFolder, newFolderName.trim());
    if (result.success) {
      setNewFolderName('');
      setIsCreatingFolder(false);
      await onRefresh();
      toast.success('폴더가 생성되었습니다');
    } else {
      toast.error('폴더 생성 실패: ' + result.error);
    }
  };

  const handleCreateFolderCancel = () => {
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  // 삭제 (단일)
  const handleDelete = async (entry: FileEntry) => {
    if (!window.electron || !currentFolder) return;

    const confirmMessage = entry.type === 'directory'
      ? `"${entry.name}" 폴더와 내부의 모든 파일을 삭제하시겠습니까?`
      : `"${entry.name}" 파일을 삭제하시겠습니까?`;

    if (!confirm(confirmMessage)) return;

    const result = entry.type === 'directory'
      ? await window.electron.deleteFolder(entry.path)
      : await window.electron.deleteFile(entry.path);

    if (result.success) {
      // Notify parent component about the deletion
      if (onDeleteFile) {
        onDeleteFile(entry.path);
      }

      await onRefresh();
      toast.success('삭제되었습니다');
    } else {
      toast.error('삭제 실패: ' + result.error);
    }
  };

  // 삭제 (다중)
  const handleMultiDelete = async () => {
    if (!window.electron || !currentFolder || selectedFiles.length === 0) return;

    const confirmMessage = `선택한 ${selectedFiles.length}개의 항목을 삭제하시겠습니까?`;
    if (!confirm(confirmMessage)) return;

    let successCount = 0;
    let failCount = 0;

    for (const itemPath of selectedFiles) {
      const item = findEntryInAll(itemPath);
      if (!item) continue;

      const result = item.type === 'directory'
        ? await window.electron.deleteFolder(itemPath)
        : await window.electron.deleteFile(itemPath);

      if (result.success) {
        successCount++;
        if (onDeleteFile) {
          onDeleteFile(itemPath);
        }
      } else {
        failCount++;
        console.error(`Failed to delete ${itemPath}:`, result.error);
      }
    }

    await onRefresh();

    if (failCount > 0) {
      toast.warning(`${successCount}개 삭제 완료, ${failCount}개 실패`);
    } else {
      toast.success(`${successCount}개 항목이 삭제되었습니다`);
    }
  };

  // 이름 변경
  const handleRename = (entry: FileEntry) => {
    setIsRenaming(entry.path);
    setRenameValue(entry.name);
  };

  const handleRenameSubmit = async (entry: FileEntry) => {
    if (!window.electron || !renameValue.trim() || renameValue === entry.name) {
      setIsRenaming(null);
      return;
    }

    const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const newPath = `${parentPath}/${renameValue}`;

    const result = await window.electron.renameFile(entry.path, newPath);
    if (result.success) {
      await onRefresh();
      toast.success('이름이 변경되었습니다');
    } else {
      toast.error('이름 변경 실패: ' + result.error);
    }

    setIsRenaming(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setIsRenaming(null);
    setRenameValue('');
  };

  // 복제 (단일)
  const handleDuplicate = async (entry: FileEntry) => {
    if (!window.electron || !currentFolder) return;

    const result = await window.electron.duplicateItem(entry.path);
    if (result.success) {
      await onRefresh();
      toast.success('복제되었습니다');
    } else {
      toast.error('복제 실패: ' + result.error);
    }
  };

  // 복제 (다중)
  const handleMultiDuplicate = async () => {
    if (!window.electron || !currentFolder || selectedFiles.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const filePath of selectedFiles) {
      const result = await window.electron.duplicateItem(filePath);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to duplicate ${filePath}:`, result.error);
      }
    }

    await onRefresh();

    if (failCount > 0) {
      toast.warning(`${successCount}개 복제 완료, ${failCount}개 실패`);
    } else {
      toast.success(`${successCount}개 항목이 복제되었습니다`);
    }
  };

  // 붙여넣기
  const handlePaste = async () => {
    if (clipboard.length === 0 || !window.electron || !currentFolder) return;

    let successCount = 0;
    let failCount = 0;

    for (const item of clipboard) {
      const result = await window.electron.duplicateItem(item.path);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to paste ${item.path}:`, result.error);
      }
    }

    await onRefresh();

    if (failCount > 0) {
      toast.warning(`${successCount}개 붙여넣기 완료, ${failCount}개 실패`);
    } else {
      toast.success(`${successCount}개 항목이 붙여넣기 되었습니다`);
    }
  };

  // 클립보드에 복사
  const copyToClipboard = (entries: FileEntry[]) => {
    setClipboard(entries);
  };

  // 기본 앱으로 열기
  const handleOpenWithDefault = async (entry: FileEntry) => {
    if (!window.electron) return;

    const result = await window.electron.openWithDefault(entry.path);
    if (!result.success) {
      toast.error('열기 실패: ' + result.error);
    }
  };

  // Finder에서 보기
  const handleRevealInFinder = async (entry: FileEntry) => {
    if (!window.electron) return;

    const result = await window.electron.revealInFinder(entry.path);
    if (!result.success) {
      toast.error('Finder에서 보기 실패: ' + result.error);
    }
  };

  return {
    // File creation
    isCreatingFile,
    newFileName,
    setIsCreatingFile,
    setNewFileName,
    handleCreateFileSubmit,
    handleCreateFileCancel,

    // Folder creation
    isCreatingFolder,
    newFolderName,
    setIsCreatingFolder,
    setNewFolderName,
    handleCreateFolderSubmit,
    handleCreateFolderCancel,

    // Rename
    isRenaming,
    renameValue,
    setRenameValue,
    handleRename,
    handleRenameSubmit,
    handleRenameCancel,

    // Clipboard
    clipboard,
    copyToClipboard,

    // File operations
    handleDelete,
    handleMultiDelete,
    handleDuplicate,
    handleMultiDuplicate,
    handlePaste,
    handleOpenWithDefault,
    handleRevealInFinder,
  };
};
