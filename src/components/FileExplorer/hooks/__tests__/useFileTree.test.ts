/**
 * useFileTree hook 테스트
 * 파일 로딩, 정렬, 폴더 확장/축소 기능 테스트
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useFileTree } from '../useFileTree';
import { resetElectronMock, mockElectronAPI } from '../../../../../__mocks__/electron';
import type { FileEntry } from '../../../../types/electron';

describe('useFileTree', () => {
  beforeEach(() => {
    resetElectronMock();
  });

  describe('파일 로딩 및 정렬', () => {
    it('폴더를 로드하면 파일 목록이 설정된다', async () => {
      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: '/test-folder',
          sortOrder: 'name-asc',
          isOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.files.length).toBeGreaterThan(0);
      });

      expect(mockElectronAPI.readDirectory).toHaveBeenCalledWith('/test-folder');
    });

    it('sortOrder가 name-asc일 때 이름 오름차순으로 정렬된다', () => {
      const files: FileEntry[] = [
        {
          name: 'zebra.md',
          path: '/test/zebra.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'apple.md',
          path: '/test/apple.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'folder-z',
          path: '/test/folder-z',
          type: 'directory',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'folder-a',
          path: '/test/folder-a',
          type: 'directory',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ];

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: null,
          sortOrder: 'name-asc',
        })
      );

      const sorted = result.current.sortFiles(files);

      // 폴더가 먼저, 그 다음 파일 (각각 이름 오름차순)
      expect(sorted[0].name).toBe('folder-a');
      expect(sorted[1].name).toBe('folder-z');
      expect(sorted[2].name).toBe('apple.md');
      expect(sorted[3].name).toBe('zebra.md');
    });

    it('sortOrder가 name-desc일 때 이름 내림차순으로 정렬된다', () => {
      const files: FileEntry[] = [
        {
          name: 'apple.md',
          path: '/test/apple.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'zebra.md',
          path: '/test/zebra.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ];

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: null,
          sortOrder: 'name-desc',
        })
      );

      const sorted = result.current.sortFiles(files);
      expect(sorted[0].name).toBe('zebra.md');
      expect(sorted[1].name).toBe('apple.md');
    });

    it('sortOrder가 modified-desc일 때 수정일 내림차순으로 정렬된다', () => {
      const files: FileEntry[] = [
        {
          name: 'old.md',
          path: '/test/old.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01T00:00:00'),
        },
        {
          name: 'new.md',
          path: '/test/new.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-10T00:00:00'),
        },
      ];

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: null,
          sortOrder: 'modified-desc',
        })
      );

      const sorted = result.current.sortFiles(files);
      expect(sorted[0].name).toBe('new.md');
      expect(sorted[1].name).toBe('old.md');
    });

    it('sortOrder가 modified-asc일 때 수정일 오름차순으로 정렬된다', () => {
      const files: FileEntry[] = [
        {
          name: 'new.md',
          path: '/test/new.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-10T00:00:00'),
        },
        {
          name: 'old.md',
          path: '/test/old.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01T00:00:00'),
        },
      ];

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: null,
          sortOrder: 'modified-asc',
        })
      );

      const sorted = result.current.sortFiles(files);
      expect(sorted[0].name).toBe('old.md');
      expect(sorted[1].name).toBe('new.md');
    });

    it('폴더는 항상 파일보다 위에 표시된다', () => {
      const files: FileEntry[] = [
        {
          name: 'a-file.md',
          path: '/test/a-file.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'z-folder',
          path: '/test/z-folder',
          type: 'directory',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ];

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: null,
          sortOrder: 'name-asc',
        })
      );

      const sorted = result.current.sortFiles(files);
      expect(sorted[0].type).toBe('directory');
      expect(sorted[1].type).toBe('file');
    });
  });

  describe('refreshTrigger', () => {
    it('refreshTrigger가 변경되면 파일 목록이 다시 로드된다', async () => {
      const { result, rerender } = renderHook(
        ({ refreshTrigger }) =>
          useFileTree({
            currentFolder: '/test-folder',
            sortOrder: 'name-asc',
            isOpen: true,
            refreshTrigger,
          }),
        { initialProps: { refreshTrigger: 0 } }
      );

      await waitFor(() => {
        expect(result.current.files.length).toBeGreaterThan(0);
      });

      // 첫 로드 후 호출 횟수 기록
      const initialCallCount = mockElectronAPI.readDirectory.mock.calls.length;

      // refreshTrigger 변경
      rerender({ refreshTrigger: 1 });

      // 다시 호출되었는지 확인
      await waitFor(() => {
        expect(mockElectronAPI.readDirectory.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('폴더 확장/축소', () => {
    it('폴더를 토글하면 확장/축소된다', async () => {
      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: '/test',
          sortOrder: 'name-asc',
          isOpen: true,
        })
      );

      // 초기 상태: 폴더 확장되지 않음
      expect(result.current.expandedFolders.has('/test/folder1')).toBe(false);

      // Mock 설정: 폴더 확장 시 하위 파일 반환
      mockElectronAPI.readDirectory.mockResolvedValueOnce([
        {
          name: 'subfolder',
          path: '/test/folder1/subfolder',
          type: 'directory',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'file.md',
          path: '/test/folder1/file.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ]);

      // 폴더 확장
      await result.current.toggleFolder('/test/folder1');

      // 확장된 상태 확인
      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(true);
        expect(result.current.folderContents.has('/test/folder1')).toBe(true);
        expect(result.current.folderContents.get('/test/folder1')?.length).toBe(2);
      });

      // 다시 축소
      await result.current.toggleFolder('/test/folder1');

      // 축소된 상태 확인 (내용은 캐시에 남아있음)
      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(false);
        expect(result.current.folderContents.has('/test/folder1')).toBe(true); // 캐시는 유지
      });
    });

    it('이미 로드된 폴더는 다시 로드하지 않는다', async () => {
      mockElectronAPI.readDirectory.mockClear();

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: '/test',
          sortOrder: 'name-asc',
          isOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.files.length).toBeGreaterThan(0);
      });

      // 첫 번째 폴더 확장 - API 호출
      mockElectronAPI.readDirectory.mockResolvedValueOnce([
        {
          name: 'file.md',
          path: '/test/folder1/file.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ]);

      await result.current.toggleFolder('/test/folder1');

      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(true);
      });

      const callCountAfterFirstExpand = mockElectronAPI.readDirectory.mock.calls.length;

      // 축소
      await result.current.toggleFolder('/test/folder1');

      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(false);
      });

      // 다시 확장 - API 호출 없음 (캐시 사용)
      await result.current.toggleFolder('/test/folder1');

      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(true);
        expect(mockElectronAPI.readDirectory.mock.calls.length).toBe(callCountAfterFirstExpand);
      });
    });
  });

  describe('모든 폴더 확장/축소', () => {
    it('handleExpandAll은 모든 폴더를 재귀적으로 확장한다', async () => {
      const rootFiles = [
        {
          name: 'folder1',
          path: '/test/folder1',
          type: 'directory' as const,
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
        {
          name: 'file1.md',
          path: '/test/file1.md',
          type: 'file' as const,
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ];

      // Mock implementation to handle multiple calls for the same path
      mockElectronAPI.readDirectory.mockImplementation(async (folderPath: string) => {
        if (folderPath === '/test') {
          return rootFiles;
        } else if (folderPath === '/test/folder1') {
          return [
            {
              name: 'subfolder',
              path: '/test/folder1/subfolder',
              type: 'directory' as const,
              created: new Date('2025-01-01'),
              modified: new Date('2025-01-01'),
            },
          ];
        } else if (folderPath === '/test/folder1/subfolder') {
          return [
            {
              name: 'deep-file.md',
              path: '/test/folder1/subfolder/deep-file.md',
              type: 'file' as const,
              created: new Date('2025-01-01'),
              modified: new Date('2025-01-01'),
            },
          ];
        }
        return [];
      });

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: '/test',
          sortOrder: 'name-asc',
          isOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.files.length).toBe(2);
      });

      // 모든 폴더 확장
      await result.current.handleExpandAll();

      // 모든 폴더가 확장되었는지 확인
      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(true);
        expect(result.current.expandedFolders.has('/test/folder1/subfolder')).toBe(true);
      });
    });

    it('handleCollapseAll은 모든 폴더를 축소한다', async () => {
      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: '/test',
          sortOrder: 'name-asc',
          isOpen: true,
        })
      );

      // 몇 개 폴더 확장
      mockElectronAPI.readDirectory.mockResolvedValue([]);
      await result.current.toggleFolder('/test/folder1');
      await result.current.toggleFolder('/test/folder2');

      // 확장된 상태 확인
      await waitFor(() => {
        expect(result.current.expandedFolders.size).toBeGreaterThan(0);
      });

      // 모두 축소
      result.current.handleCollapseAll();

      // 모두 축소되었는지 확인
      await waitFor(() => {
        expect(result.current.expandedFolders.size).toBe(0);
      });
    });
  });

  describe('getFlatFileList', () => {
    it('확장된 폴더의 모든 파일을 플랫 리스트로 반환한다', async () => {
      // Mock implementation to handle multiple calls
      mockElectronAPI.readDirectory.mockImplementation(async (folderPath: string) => {
        if (folderPath === '/test') {
          return [
            {
              name: 'folder1',
              path: '/test/folder1',
              type: 'directory' as const,
              created: new Date('2025-01-01'),
              modified: new Date('2025-01-01'),
            },
            {
              name: 'file1.md',
              path: '/test/file1.md',
              type: 'file' as const,
              created: new Date('2025-01-01'),
              modified: new Date('2025-01-01'),
            },
          ];
        } else if (folderPath === '/test/folder1') {
          return [
            {
              name: 'file2.md',
              path: '/test/folder1/file2.md',
              type: 'file' as const,
              created: new Date('2025-01-01'),
              modified: new Date('2025-01-01'),
            },
          ];
        }
        return [];
      });

      const { result } = renderHook(() =>
        useFileTree({
          currentFolder: '/test',
          sortOrder: 'name-asc',
          isOpen: true,
        })
      );

      await waitFor(() => {
        expect(result.current.files.length).toBe(2);
      });

      // 폴더 확장
      await result.current.toggleFolder('/test/folder1');

      await waitFor(() => {
        expect(result.current.expandedFolders.has('/test/folder1')).toBe(true);
      });

      const flatList = result.current.getFlatFileList();
      expect(flatList.length).toBeGreaterThan(1);
    });
  });
});
