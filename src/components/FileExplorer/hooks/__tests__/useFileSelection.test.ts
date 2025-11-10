/**
 * useFileSelection hook 테스트
 * 단일 선택, 다중 선택 (Ctrl, Shift) 기능 테스트
 */

import { renderHook, act } from '@testing-library/react';
import { useFileSelection } from '../useFileSelection';
import type { FileEntry } from '../../../../types/electron';

describe('useFileSelection', () => {
  const mockOnSelectFile = jest.fn();
  const mockOnFileSelection = jest.fn();
  const mockOnFolderSelection = jest.fn();
  const mockOnLoadFileInMultiSelect = jest.fn();
  const mockGetFlatFileList = jest.fn();
  const mockFindEntryInAll = jest.fn();
  const mockToggleFolder = jest.fn();

  const testFiles: FileEntry[] = [
    {
      name: 'file1.md',
      path: '/test/file1.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
    {
      name: 'file2.md',
      path: '/test/file2.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
    {
      name: 'folder1',
      path: '/test/folder1',
      type: 'directory',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
    {
      name: 'file3.md',
      path: '/test/file3.md',
      type: 'file',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
  ];

  const defaultProps = {
    selectedFiles: [],
    currentFile: null,
    onSelectFile: mockOnSelectFile,
    onFileSelection: mockOnFileSelection,
    onFolderSelection: mockOnFolderSelection,
    onLoadFileInMultiSelect: mockOnLoadFileInMultiSelect,
    getFlatFileList: mockGetFlatFileList,
    findEntryInAll: mockFindEntryInAll,
    toggleFolder: mockToggleFolder,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnLoadFileInMultiSelect.mockResolvedValue(undefined);
    mockToggleFolder.mockResolvedValue(undefined);
    mockGetFlatFileList.mockReturnValue(testFiles);
    mockFindEntryInAll.mockImplementation((path: string) =>
      testFiles.find(f => f.path === path) || null
    );
  });

  describe('단일 선택', () => {
    it('파일을 클릭하면 onSelectFile이 호출된다', async () => {
      const { result } = renderHook(() => useFileSelection(defaultProps));

      const mouseEvent = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[0], mouseEvent);
      });

      expect(mockOnSelectFile).toHaveBeenCalledWith('/test/file1.md');
      expect(result.current.lastSelectedFile).toBe('/test/file1.md');
    });

    it('폴더를 클릭하면 toggleFolder와 onFolderSelection이 호출된다', async () => {
      const { result } = renderHook(() => useFileSelection(defaultProps));

      const mouseEvent = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[2], mouseEvent);
      });

      expect(mockToggleFolder).toHaveBeenCalledWith('/test/folder1');
      expect(mockOnFolderSelection).toHaveBeenCalledWith('/test/folder1');
      expect(result.current.lastSelectedFile).toBe('/test/folder1');
    });

    it('isSelected는 선택된 파일에 대해 true를 반환한다', () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      expect(result.current.isSelected('/test/file1.md')).toBe(true);
      expect(result.current.isSelected('/test/file2.md')).toBe(true);
      expect(result.current.isSelected('/test/file3.md')).toBe(false);
    });
  });

  describe('Ctrl/Cmd + Click (다중 선택)', () => {
    // Mac 플랫폼 mock
    const originalPlatform = navigator.platform;

    afterEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('Mac에서 Cmd+Click으로 파일을 추가 선택할 수 있다', async () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      const mouseEvent = {
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[1], mouseEvent);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith([
        '/test/file1.md',
        '/test/file2.md',
      ]);
      expect(mockOnLoadFileInMultiSelect).toHaveBeenCalledWith('/test/file2.md');
    });

    it('Windows에서 Ctrl+Click으로 파일을 추가 선택할 수 있다', async () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      const mouseEvent = {
        metaKey: false,
        ctrlKey: true,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[1], mouseEvent);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith([
        '/test/file1.md',
        '/test/file2.md',
      ]);
      expect(mockOnLoadFileInMultiSelect).toHaveBeenCalledWith('/test/file2.md');
    });

    it('Ctrl+Click으로 이미 선택된 파일을 제거할 수 있다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      const mouseEvent = {
        metaKey: false,
        ctrlKey: true,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[1], mouseEvent);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith(['/test/file1.md']);
    });

    it('Ctrl+Click으로 폴더를 다중 선택할 수 있다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      const mouseEvent = {
        metaKey: false,
        ctrlKey: true,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[2], mouseEvent);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith([
        '/test/file1.md',
        '/test/folder1',
      ]);
      expect(mockOnLoadFileInMultiSelect).not.toHaveBeenCalled();
    });

    it('현재 열린 파일을 제거하면 다른 선택된 파일을 로드한다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
          currentFile: '/test/file1.md',
        })
      );

      const mouseEvent = {
        metaKey: false,
        ctrlKey: true,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[0], mouseEvent);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith(['/test/file2.md']);
      expect(mockOnLoadFileInMultiSelect).toHaveBeenCalledWith('/test/file2.md');
    });
  });

  describe('Shift + Click (범위 선택)', () => {
    it('Shift+Click으로 범위 선택을 할 수 있다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      // 첫 번째 파일 선택 (lastSelectedFile 설정)
      const normalClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[0], normalClick);
      });

      // Shift+Click으로 file3까지 범위 선택
      const shiftClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: true,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[3], shiftClick);
      });

      // file1부터 file3까지 선택됨 (folder1 포함)
      expect(mockOnFileSelection).toHaveBeenCalledWith([
        '/test/file1.md',
        '/test/file2.md',
        '/test/folder1',
        '/test/file3.md',
      ]);
      expect(mockOnLoadFileInMultiSelect).toHaveBeenCalledWith('/test/file3.md');
    });

    it('역순으로도 범위 선택이 가능하다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file3.md'],
        })
      );

      // file3 선택
      const normalClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[3], normalClick);
      });

      // Shift+Click으로 file1까지 역순 범위 선택
      const shiftClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: true,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[0], shiftClick);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith([
        '/test/file1.md',
        '/test/file2.md',
        '/test/folder1',
        '/test/file3.md',
      ]);
    });

    it('lastSelectedFile이 없으면 selectedFiles[0]을 기준으로 범위 선택한다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      const shiftClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: true,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[2], shiftClick);
      });

      expect(mockOnFileSelection).toHaveBeenCalledWith([
        '/test/file1.md',
        '/test/file2.md',
        '/test/folder1',
      ]);
    });

    it('범위 선택 시 폴더를 클릭하면 파일 로드는 하지 않는다', async () => {
      const { result } = renderHook(() =>
        useFileSelection({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      const normalClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[0], normalClick);
      });

      const shiftClick = {
        metaKey: false,
        ctrlKey: false,
        shiftKey: true,
      } as React.MouseEvent;

      await act(async () => {
        await result.current.handleFileClick(testFiles[2], shiftClick);
      });

      expect(mockOnLoadFileInMultiSelect).not.toHaveBeenCalled();
    });
  });
});
