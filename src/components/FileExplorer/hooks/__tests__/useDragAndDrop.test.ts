/**
 * useDragAndDrop hook 테스트
 * 드래그 앤 드롭 기능, 자동 폴더 확장 테스트
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';
import type { FileEntry } from '../../../../types/electron';
import { mockElectronAPI } from '../../../../../__mocks__/electron';

// Mock ToastContext
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

jest.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => mockToast,
}));

describe('useDragAndDrop', () => {
  const mockToggleFolder = jest.fn().mockResolvedValue(undefined);
  const mockOnRefresh = jest.fn().mockResolvedValue(undefined);
  const mockFindEntryInAll = jest.fn();

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
      name: 'folder2',
      path: '/test/folder2',
      type: 'directory',
      created: new Date('2025-01-01'),
      modified: new Date('2025-01-01'),
    },
  ];

  const defaultProps = {
    selectedFiles: [],
    currentFolder: '/test',
    expandedFolders: new Set<string>(),
    findEntryInAll: mockFindEntryInAll,
    toggleFolder: mockToggleFolder,
    onRefresh: mockOnRefresh,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFindEntryInAll.mockImplementation((path: string) =>
      testFiles.find((f) => f.path === path) || null
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('드래그 시작', () => {
    it('단일 파일을 드래그하면 draggedItems에 해당 파일만 설정된다', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockDragEvent, testFiles[0]);
      });

      expect(result.current.draggedItems).toEqual([testFiles[0]]);
      expect(mockDragEvent.dataTransfer.effectAllowed).toBe('move');
      expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalledWith(
        'text/plain',
        '/test/file1.md'
      );
    });

    it('선택된 파일을 드래그하면 모든 선택된 파일이 draggedItems에 설정된다', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      const mockDragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockDragEvent, testFiles[0]);
      });

      expect(result.current.draggedItems).toHaveLength(2);
      expect(result.current.draggedItems).toEqual([testFiles[0], testFiles[1]]);
    });

    it('선택되지 않은 파일을 드래그하면 해당 파일만 draggedItems에 설정된다', () => {
      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          selectedFiles: ['/test/file1.md'],
        })
      );

      const mockDragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockDragEvent, testFiles[1]);
      });

      expect(result.current.draggedItems).toEqual([testFiles[1]]);
    });
  });

  describe('드래그 오버', () => {
    it('폴더 위로 드래그하면 dropTarget이 폴더 경로로 설정된다', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[2]); // folder1
      });

      expect(mockDragEvent.preventDefault).toHaveBeenCalled();
      expect(mockDragEvent.stopPropagation).toHaveBeenCalled();
      expect(mockDragEvent.dataTransfer.dropEffect).toBe('move');
      expect(result.current.dropTarget).toBe('/test/folder1');
    });

    it('파일 위로 드래그하면 dropTarget이 root로 설정된다', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[0]); // file
      });

      expect(result.current.dropTarget).toBe('root');
    });

    it('접혀있는 폴더 위로 500ms 이상 드래그하면 자동으로 확장된다', async () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[2]); // folder1
      });

      expect(result.current.dropTarget).toBe('/test/folder1');
      expect(mockToggleFolder).not.toHaveBeenCalled();

      // 500ms 경과
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToggleFolder).toHaveBeenCalledWith('/test/folder1');
      });
    });

    it('이미 확장된 폴더 위로 드래그하면 자동 확장이 트리거되지 않는다', () => {
      const expandedFolders = new Set(['/test/folder1']);
      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          expandedFolders,
        })
      );

      const mockDragEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[2]); // folder1
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockToggleFolder).not.toHaveBeenCalled();
    });

    it('다른 폴더로 이동하면 이전 타이머가 취소된다', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      // folder1 위로 드래그
      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[2]); // folder1
      });

      // 300ms 경과 (500ms 미만)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // folder2로 이동
      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[3]); // folder2
      });

      // 추가로 300ms 경과 (총 600ms이지만 folder2 기준으로는 300ms)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // folder1은 확장되지 않음
      expect(mockToggleFolder).not.toHaveBeenCalledWith('/test/folder1');
    });
  });

  describe('드래그 종료', () => {
    it('드래그가 종료되면 draggedItems와 dropTarget이 초기화된다', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      // 드래그 시작
      act(() => {
        result.current.handleDragStart(mockDragEvent, testFiles[0]);
      });

      expect(result.current.draggedItems).toHaveLength(1);

      // 드래그 종료
      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedItems).toEqual([]);
      expect(result.current.dropTarget).toBeNull();
    });

    it('드래그 종료시 실행중인 타이머가 취소된다', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      const mockDragEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      // 폴더 위로 드래그
      act(() => {
        result.current.handleDragOver(mockDragEvent, testFiles[2]); // folder1
      });

      // 드래그 종료 (500ms 이전)
      act(() => {
        result.current.handleDragEnd();
      });

      // 500ms 경과
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // toggleFolder가 호출되지 않음
      expect(mockToggleFolder).not.toHaveBeenCalled();
    });
  });

  describe('폴더에 드롭', () => {
    beforeEach(() => {
      mockElectronAPI.renameFile.mockResolvedValue({ success: true });
    });

    it('폴더에 파일을 드롭하면 파일이 이동된다', async () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // 드래그 시작
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[0]); // file1
      });

      // 폴더에 드롭
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDrop(dropEvent, testFiles[2]); // folder1
      });

      expect(mockElectronAPI.renameFile).toHaveBeenCalledWith(
        '/test/file1.md',
        '/test/folder1/file1.md'
      );
      expect(mockOnRefresh).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('1개 항목이 이동되었습니다');
      expect(result.current.draggedItems).toEqual([]);
    });

    it('여러 파일을 폴더에 드롭하면 모든 파일이 이동된다', async () => {
      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      // 드래그 시작
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[0]); // file1 (선택됨)
      });

      expect(result.current.draggedItems).toHaveLength(2);

      // 폴더에 드롭
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDrop(dropEvent, testFiles[2]); // folder1
      });

      expect(mockElectronAPI.renameFile).toHaveBeenCalledTimes(2);
      expect(mockToast.success).toHaveBeenCalledWith('2개 항목이 이동되었습니다');
    });

    it('자기 자신에게는 드롭할 수 없다', async () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // 폴더 드래그 시작
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[2]); // folder1
      });

      // 같은 폴더에 드롭
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDrop(dropEvent, testFiles[2]); // folder1
      });

      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
    });

    it('부모 폴더를 자식 폴더로 드롭할 수 없다', async () => {
      const childFolder: FileEntry = {
        name: 'child',
        path: '/test/folder1/child',
        type: 'directory',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-01'),
      };

      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // 부모 폴더 드래그
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[2]); // folder1
      });

      // 자식 폴더에 드롭
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDrop(dropEvent, childFolder);
      });

      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
      expect(mockToast.warning).toHaveBeenCalledWith('하위 폴더로 이동할 수 없습니다.');
    });

    it('파일에는 드롭할 수 없다', async () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // 파일 드래그
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[1]); // file2
      });

      // 다른 파일에 드롭 시도
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDrop(dropEvent, testFiles[0]); // file1
      });

      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
    });

    it('이동 중 일부 실패하면 경고 메시지를 표시한다', async () => {
      mockElectronAPI.renameFile
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Permission denied' });

      const { result } = renderHook(() =>
        useDragAndDrop({
          ...defaultProps,
          selectedFiles: ['/test/file1.md', '/test/file2.md'],
        })
      );

      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[0]);
      });

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDrop(dropEvent, testFiles[2]); // folder1
      });

      expect(mockToast.warning).toHaveBeenCalledWith('1개 이동 완료, 1개 실패');
    });
  });

  describe('루트에 드롭', () => {
    beforeEach(() => {
      mockElectronAPI.renameFile.mockResolvedValue({ success: true });
    });

    it('루트 영역에 파일을 드롭하면 현재 폴더로 이동된다', async () => {
      const fileInSubfolder: FileEntry = {
        name: 'file-in-subfolder.md',
        path: '/test/folder1/file-in-subfolder.md',
        type: 'file',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-01'),
      };

      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // 서브폴더의 파일 드래그
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, fileInSubfolder);
      });

      // 루트에 드롭
      const dropEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDropToRoot(dropEvent);
      });

      expect(mockElectronAPI.renameFile).toHaveBeenCalledWith(
        '/test/folder1/file-in-subfolder.md',
        '/test/file-in-subfolder.md'
      );
      expect(mockToast.success).toHaveBeenCalledWith('1개 항목이 이동되었습니다');
    });

    it('이미 루트에 있는 파일은 이동하지 않는다', async () => {
      const { result } = renderHook(() => useDragAndDrop(defaultProps));

      // 루트의 파일 드래그
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(dragStartEvent, testFiles[0]); // file1 (already in root)
      });

      // 루트에 드롭
      const dropEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.DragEvent;

      await act(async () => {
        await result.current.handleDropToRoot(dropEvent);
      });

      expect(mockElectronAPI.renameFile).not.toHaveBeenCalled();
    });
  });
});
