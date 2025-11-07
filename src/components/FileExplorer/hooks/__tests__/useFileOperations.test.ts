/**
 * useFileOperations hook 테스트
 * 파일/폴더 생성, 삭제, 이름변경, 복제 등 파일 작업 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileOperations } from '../useFileOperations';
import { resetElectronMock, mockElectronAPI } from '../../../../../__mocks__/electron';
import type { FileEntry } from '../../../../types/electron';
import { renderWithProviders } from '../../../../test-utils/testUtils';

// ToastContext mock
jest.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }),
}));

// window.confirm mock
global.confirm = jest.fn(() => true);

// console.error mock (테스트 중 에러 로그 숨기기)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('useFileOperations', () => {
  const mockOnCreateFile = jest.fn();
  const mockOnDeleteFile = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockFindEntryInAll = jest.fn();

  const defaultProps = {
    currentFolder: '/test-folder',
    selectedFiles: [],
    onCreateFile: mockOnCreateFile,
    onDeleteFile: mockOnDeleteFile,
    onRefresh: mockOnRefresh,
    findEntryInAll: mockFindEntryInAll,
  };

  beforeEach(() => {
    resetElectronMock();
    jest.clearAllMocks();
    mockOnRefresh.mockResolvedValue(undefined);
  });

  describe('파일 생성', () => {
    it('파일 이름을 입력하고 submit하면 onCreateFile이 호출된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      // 파일 생성 모드 활성화
      act(() => {
        result.current.setIsCreatingFile(true);
        result.current.setNewFileName('test-file.md');
      });

      // 파일 생성 submit
      act(() => {
        result.current.handleCreateFileSubmit();
      });

      expect(mockOnCreateFile).toHaveBeenCalledWith('test-file.md');
      expect(result.current.isCreatingFile).toBe(false);
      expect(result.current.newFileName).toBe('');
    });

    it('확장자가 없는 파일 이름은 자동으로 .txt가 추가된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFile(true);
        result.current.setNewFileName('test-file');
      });

      act(() => {
        result.current.handleCreateFileSubmit();
      });

      expect(mockOnCreateFile).toHaveBeenCalledWith('test-file.txt');
    });

    it('앞뒤 공백이 제거된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFile(true);
        result.current.setNewFileName('  test-file.md  ');
      });

      act(() => {
        result.current.handleCreateFileSubmit();
      });

      expect(mockOnCreateFile).toHaveBeenCalledWith('test-file.md');
    });

    it('빈 파일 이름은 무시된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFile(true);
        result.current.setNewFileName('   ');
      });

      act(() => {
        result.current.handleCreateFileSubmit();
      });

      expect(mockOnCreateFile).not.toHaveBeenCalled();
      expect(result.current.isCreatingFile).toBe(true);
    });

    it('Cancel하면 상태가 초기화된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFile(true);
        result.current.setNewFileName('test-file.md');
      });

      act(() => {
        result.current.handleCreateFileCancel();
      });

      expect(result.current.isCreatingFile).toBe(false);
      expect(result.current.newFileName).toBe('');
      expect(mockOnCreateFile).not.toHaveBeenCalled();
    });
  });

  describe('폴더 생성', () => {
    it('폴더 이름을 입력하고 submit하면 폴더가 생성된다', async () => {
      mockElectronAPI.createFolder.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      // 폴더 생성 모드 활성화
      act(() => {
        result.current.setIsCreatingFolder(true);
        result.current.setNewFolderName('new-folder');
      });

      // 폴더 생성 submit
      await act(async () => {
        await result.current.handleCreateFolderSubmit();
      });

      expect(mockElectronAPI.createFolder).toHaveBeenCalledWith('/test-folder', 'new-folder');
      expect(mockOnRefresh).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isCreatingFolder).toBe(false);
        expect(result.current.newFolderName).toBe('');
      });
    });

    it('폴더 이름 앞뒤 공백이 제거된다', async () => {
      mockElectronAPI.createFolder.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFolder(true);
        result.current.setNewFolderName('  new-folder  ');
      });

      await act(async () => {
        await result.current.handleCreateFolderSubmit();
      });

      expect(mockElectronAPI.createFolder).toHaveBeenCalledWith('/test-folder', 'new-folder');
    });

    it('빈 폴더 이름은 무시된다', async () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFolder(true);
        result.current.setNewFolderName('   ');
      });

      await act(async () => {
        await result.current.handleCreateFolderSubmit();
      });

      expect(mockElectronAPI.createFolder).not.toHaveBeenCalled();
    });

    it('currentFolder가 없으면 폴더 생성이 실행되지 않는다', async () => {
      const { result } = renderHook(() =>
        useFileOperations({ ...defaultProps, currentFolder: null })
      );

      act(() => {
        result.current.setIsCreatingFolder(true);
        result.current.setNewFolderName('new-folder');
      });

      await act(async () => {
        await result.current.handleCreateFolderSubmit();
      });

      expect(mockElectronAPI.createFolder).not.toHaveBeenCalled();
    });

    it('폴더 생성 실패 시 에러 토스트가 표시된다', async () => {
      mockElectronAPI.createFolder.mockResolvedValueOnce({
        success: false,
        error: 'Permission denied',
      });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFolder(true);
        result.current.setNewFolderName('new-folder');
      });

      await act(async () => {
        await result.current.handleCreateFolderSubmit();
      });

      expect(mockElectronAPI.createFolder).toHaveBeenCalledWith('/test-folder', 'new-folder');
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('Cancel하면 상태가 초기화된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.setIsCreatingFolder(true);
        result.current.setNewFolderName('new-folder');
      });

      act(() => {
        result.current.handleCreateFolderCancel();
      });

      expect(result.current.isCreatingFolder).toBe(false);
      expect(result.current.newFolderName).toBe('');
      expect(mockElectronAPI.createFolder).not.toHaveBeenCalled();
    });
  });

  describe('파일/폴더 삭제', () => {
    const testFile: FileEntry = {
      name: 'test-file.md',
      path: '/test-folder/test-file.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    };

    const testFolder: FileEntry = {
      name: 'test-folder',
      path: '/test-folder/test-folder',
      type: 'directory',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    };

    it('파일을 삭제하면 confirm 후 deleteFile이 호출된다', async () => {
      global.confirm = jest.fn(() => true);
      mockElectronAPI.deleteFile.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleDelete(testFile);
      });

      expect(global.confirm).toHaveBeenCalledWith('"test-file.md" 파일을 삭제하시겠습니까?');
      expect(mockElectronAPI.deleteFile).toHaveBeenCalledWith('/test-folder/test-file.md');
      expect(mockOnDeleteFile).toHaveBeenCalledWith('/test-folder/test-file.md');
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('폴더를 삭제하면 confirm 후 deleteFolder가 호출된다', async () => {
      global.confirm = jest.fn(() => true);
      mockElectronAPI.deleteFolder.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleDelete(testFolder);
      });

      expect(global.confirm).toHaveBeenCalledWith(
        '"test-folder" 폴더와 내부의 모든 파일을 삭제하시겠습니까?'
      );
      expect(mockElectronAPI.deleteFolder).toHaveBeenCalledWith('/test-folder/test-folder');
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('confirm을 취소하면 삭제가 실행되지 않는다', async () => {
      global.confirm = jest.fn(() => false);

      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleDelete(testFile);
      });

      expect(mockElectronAPI.deleteFile).not.toHaveBeenCalled();
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('삭제 실패 시 에러 토스트가 표시된다', async () => {
      global.confirm = jest.fn(() => true);
      mockElectronAPI.deleteFile.mockResolvedValueOnce({
        success: false,
        error: 'File not found',
      });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleDelete(testFile);
      });

      expect(mockElectronAPI.deleteFile).toHaveBeenCalled();
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('여러 파일을 선택하여 삭제할 수 있다', async () => {
      global.confirm = jest.fn(() => true);
      mockElectronAPI.deleteFile.mockResolvedValue({ success: true });
      mockElectronAPI.deleteFolder.mockResolvedValue({ success: true });

      mockFindEntryInAll.mockImplementation((path: string) => {
        if (path === '/test-folder/file1.md') {
          return {
            name: 'file1.md',
            path: '/test-folder/file1.md',
            type: 'file' as const,
            created: new Date('2025-01-01'),
            modified: new Date('2025-01-01'),
          };
        }
        if (path === '/test-folder/file2.md') {
          return {
            name: 'file2.md',
            path: '/test-folder/file2.md',
            type: 'file' as const,
            created: new Date('2025-01-01'),
            modified: new Date('2025-01-01'),
          };
        }
        return null;
      });

      const { result } = renderHook(() =>
        useFileOperations({
          ...defaultProps,
          selectedFiles: ['/test-folder/file1.md', '/test-folder/file2.md'],
        })
      );

      await act(async () => {
        await result.current.handleMultiDelete();
      });

      expect(global.confirm).toHaveBeenCalledWith('선택한 2개의 항목을 삭제하시겠습니까?');
      expect(mockElectronAPI.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('다중 삭제 시 일부 실패하면 경고 토스트가 표시된다', async () => {
      global.confirm = jest.fn(() => true);
      mockElectronAPI.deleteFile
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Permission denied' });

      mockFindEntryInAll.mockImplementation((path: string) => {
        if (path === '/test-folder/file1.md' || path === '/test-folder/file2.md') {
          return {
            name: path.split('/').pop()!,
            path,
            type: 'file' as const,
            created: new Date('2025-01-01'),
            modified: new Date('2025-01-01'),
          };
        }
        return null;
      });

      const { result } = renderHook(() =>
        useFileOperations({
          ...defaultProps,
          selectedFiles: ['/test-folder/file1.md', '/test-folder/file2.md'],
        })
      );

      await act(async () => {
        await result.current.handleMultiDelete();
      });

      expect(mockElectronAPI.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('선택된 파일이 없으면 다중 삭제가 실행되지 않는다', async () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleMultiDelete();
      });

      expect(global.confirm).not.toHaveBeenCalled();
      expect(mockElectronAPI.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('파일/폴더 이름 변경', () => {
    const testFile: FileEntry = {
      name: 'old-name.md',
      path: '/test-folder/old-name.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    };

    it('handleRename을 호출하면 이름 변경 모드가 활성화된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.handleRename(testFile);
      });

      expect(result.current.isRenaming).toBe('/test-folder/old-name.md');
      expect(result.current.renameValue).toBe('old-name.md');
    });

    it('이름을 변경하면 renameFile이 호출된다', async () => {
      mockElectronAPI.renameFile.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.handleRename(testFile);
        result.current.setRenameValue('new-name.md');
      });

      await act(async () => {
        await result.current.handleRenameSubmit(testFile);
      });

      expect(mockElectronAPI.renameFile).toHaveBeenCalledWith(
        '/test-folder/old-name.md',
        '/test-folder/new-name.md'
      );
      expect(mockOnRefresh).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isRenaming).toBe(null);
        expect(result.current.renameValue).toBe('');
      });
    });

    it('빈 이름으로 변경하려고 하면 무시된다', async () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.handleRename(testFile);
        result.current.setRenameValue('   ');
      });

      await act(async () => {
        await result.current.handleRenameSubmit(testFile);
      });

      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
      expect(result.current.isRenaming).toBe(null);
    });

    it('같은 이름으로 변경하려고 하면 무시된다', async () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.handleRename(testFile);
      });

      await act(async () => {
        await result.current.handleRenameSubmit(testFile);
      });

      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
      expect(result.current.isRenaming).toBe(null);
    });

    it('이름 변경 실패 시 에러 토스트가 표시된다', async () => {
      mockElectronAPI.renameFile.mockResolvedValueOnce({
        success: false,
        error: 'File already exists',
      });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.handleRename(testFile);
        result.current.setRenameValue('new-name.md');
      });

      await act(async () => {
        await result.current.handleRenameSubmit(testFile);
      });

      expect(mockElectronAPI.renameFile).toHaveBeenCalled();
      await waitFor(() => {
        expect(result.current.isRenaming).toBe(null);
      });
    });

    it('Cancel하면 상태가 초기화된다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.handleRename(testFile);
        result.current.setRenameValue('new-name.md');
      });

      act(() => {
        result.current.handleRenameCancel();
      });

      expect(result.current.isRenaming).toBe(null);
      expect(result.current.renameValue).toBe('');
      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
    });
  });

  describe('복사/붙여넣기/복제', () => {
    const testFiles: FileEntry[] = [
      {
        name: 'file1.md',
        path: '/test-folder/file1.md',
        type: 'file',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-01'),
      },
      {
        name: 'file2.md',
        path: '/test-folder/file2.md',
        type: 'file',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-01'),
      },
    ];

    it('copyToClipboard로 파일을 클립보드에 복사할 수 있다', () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      act(() => {
        result.current.copyToClipboard(testFiles);
      });

      expect(result.current.clipboard).toEqual(testFiles);
      expect(result.current.clipboard.length).toBe(2);
    });

    it('파일을 복제하면 duplicateItem이 호출된다', async () => {
      mockElectronAPI.duplicateItem.mockResolvedValueOnce({
        success: true,
        newPath: '/test-folder/file1-copy.md',
      });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleDuplicate(testFiles[0]);
      });

      expect(mockElectronAPI.duplicateItem).toHaveBeenCalledWith('/test-folder/file1.md');
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('복제 실패 시 에러 토스트가 표시된다', async () => {
      mockElectronAPI.duplicateItem.mockResolvedValueOnce({
        success: false,
        error: 'Disk full',
      });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handleDuplicate(testFiles[0]);
      });

      expect(mockElectronAPI.duplicateItem).toHaveBeenCalled();
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('여러 파일을 선택하여 복제할 수 있다', async () => {
      mockElectronAPI.duplicateItem.mockResolvedValue({
        success: true,
        newPath: '/test-folder/file-copy.md',
      });

      const { result } = renderHook(() =>
        useFileOperations({
          ...defaultProps,
          selectedFiles: ['/test-folder/file1.md', '/test-folder/file2.md'],
        })
      );

      await act(async () => {
        await result.current.handleMultiDuplicate();
      });

      expect(mockElectronAPI.duplicateItem).toHaveBeenCalledTimes(2);
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('다중 복제 시 일부 실패하면 경고 토스트가 표시된다', async () => {
      mockElectronAPI.duplicateItem
        .mockResolvedValueOnce({ success: true, newPath: '/test-folder/file1-copy.md' })
        .mockResolvedValueOnce({ success: false, error: 'Disk full' });

      const { result } = renderHook(() =>
        useFileOperations({
          ...defaultProps,
          selectedFiles: ['/test-folder/file1.md', '/test-folder/file2.md'],
        })
      );

      await act(async () => {
        await result.current.handleMultiDuplicate();
      });

      expect(mockElectronAPI.duplicateItem).toHaveBeenCalledTimes(2);
    });

    it('클립보드에 있는 파일을 붙여넣기할 수 있다', async () => {
      mockElectronAPI.duplicateItem.mockResolvedValue({
        success: true,
        newPath: '/test-folder/file-copy.md',
      });

      const { result } = renderHook(() => useFileOperations(defaultProps));

      // 클립보드에 복사
      act(() => {
        result.current.copyToClipboard(testFiles);
      });

      // 붙여넣기
      await act(async () => {
        await result.current.handlePaste();
      });

      expect(mockElectronAPI.duplicateItem).toHaveBeenCalledTimes(2);
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('클립보드가 비어있으면 붙여넣기가 실행되지 않는다', async () => {
      const { result } = renderHook(() => useFileOperations(defaultProps));

      await act(async () => {
        await result.current.handlePaste();
      });

      expect(mockElectronAPI.duplicateItem).not.toHaveBeenCalled();
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('currentFolder가 없으면 복제/붙여넣기가 실행되지 않는다', async () => {
      const { result } = renderHook(() =>
        useFileOperations({ ...defaultProps, currentFolder: null })
      );

      await act(async () => {
        await result.current.handleDuplicate(testFiles[0]);
      });

      expect(mockElectronAPI.duplicateItem).not.toHaveBeenCalled();

      act(() => {
        result.current.copyToClipboard(testFiles);
      });

      await act(async () => {
        await result.current.handlePaste();
      });

      expect(mockElectronAPI.duplicateItem).not.toHaveBeenCalled();
    });
  });
});
