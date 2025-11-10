/**
 * FileExplorer 통합 테스트
 * 전체 컴포넌트 렌더링 및 기본 워크플로우 테스트
 */

import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileExplorer } from '../FileExplorer';
import { mockElectronAPI } from '../../../__mocks__/electron';
import type { FileEntry } from '../../types/electron';
import { renderWithProviders } from '../../test-utils/testUtils';

describe('FileExplorer 통합 테스트', () => {
  const mockOnSelectFolder = jest.fn();
  const mockOnSelectFile = jest.fn();
  const mockOnLoadFileInMultiSelect = jest.fn().mockResolvedValue(undefined);
  const mockOnFileSelection = jest.fn();
  const mockOnFolderSelection = jest.fn();
  const mockOnCreateFile = jest.fn();
  const mockOnDeleteFile = jest.fn();

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
  ];

  const defaultProps = {
    isOpen: true,
    currentFolder: '/test',
    currentFile: null,
    selectedFiles: [],
    onSelectFolder: mockOnSelectFolder,
    onSelectFile: mockOnSelectFile,
    onLoadFileInMultiSelect: mockOnLoadFileInMultiSelect,
    onFileSelection: mockOnFileSelection,
    onFolderSelection: mockOnFolderSelection,
    onCreateFile: mockOnCreateFile,
    onDeleteFile: mockOnDeleteFile,
    refreshTrigger: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockElectronAPI.readDirectory.mockResolvedValue(testFiles);
  });

  describe('기본 렌더링', () => {
    it('isOpen=true일 때 파일 탐색기가 렌더링된다', () => {
      renderWithProviders(<FileExplorer {...defaultProps} />);

      expect(screen.getByText('📁 test')).toBeInTheDocument();
    });

    it('isOpen=false일 때 파일 탐색기가 렌더링되지 않는다', () => {
      renderWithProviders(<FileExplorer {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('📁 test')).not.toBeInTheDocument();
    });

    it('currentFolder가 null이면 "폴더를 선택하세요" 메시지를 표시한다', () => {
      renderWithProviders(
        <FileExplorer {...defaultProps} currentFolder={null} />
      );

      expect(screen.getByText('폴더를 선택하세요')).toBeInTheDocument();
    });

    it('currentFolder가 설정되면 파일 목록을 로드한다', async () => {
      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(mockElectronAPI.readDirectory).toHaveBeenCalledWith('/test');
      });

      await waitFor(() => {
        expect(screen.getByText('file1.md')).toBeInTheDocument();
        expect(screen.getByText('file2.md')).toBeInTheDocument();
        expect(screen.getByText('folder1')).toBeInTheDocument();
      });
    });
  });

  describe('툴바 버튼', () => {
    it('새 파일 버튼이 렌더링된다', async () => {
      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('file1.md')).toBeInTheDocument();
      });

      const newFileButton = screen.getByLabelText('New file');
      expect(newFileButton).toBeInTheDocument();
    });

    it('새 폴더 버튼이 렌더링된다', async () => {
      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('file1.md')).toBeInTheDocument();
      });

      const newFolderButton = screen.getByLabelText('New folder');
      expect(newFolderButton).toBeInTheDocument();
    });
  });


  describe('파일 선택', () => {
    it('파일을 클릭하면 onSelectFile이 호출된다', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('file1.md')).toBeInTheDocument();
      });

      const fileItem = screen.getByText('file1.md');
      await user.click(fileItem);

      expect(mockOnSelectFile).toHaveBeenCalledWith('/test/file1.md');
    });

    it('폴더를 클릭하면 onFolderSelection이 호출되고 폴더가 확장된다', async () => {
      const user = userEvent.setup();
      const subfolderFiles: FileEntry[] = [
        {
          name: 'subfile.md',
          path: '/test/folder1/subfile.md',
          type: 'file',
          created: new Date('2025-01-01'),
          modified: new Date('2025-01-01'),
        },
      ];

      mockElectronAPI.readDirectory.mockImplementation(async (path: string) => {
        if (path === '/test') return testFiles;
        if (path === '/test/folder1') return subfolderFiles;
        return [];
      });

      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
      });

      const folderItem = screen.getByText('folder1');
      await user.click(folderItem);

      expect(mockOnFolderSelection).toHaveBeenCalledWith('/test/folder1');

      // Check if folder expands and shows subfolder contents
      await waitFor(() => {
        expect(mockElectronAPI.readDirectory).toHaveBeenCalledWith('/test/folder1');
      });
    });
  });

  describe('정렬', () => {
    it('정렬 버튼이 렌더링된다', async () => {
      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('file1.md')).toBeInTheDocument();
      });

      const sortButton = screen.getByLabelText('Sort');
      expect(sortButton).toBeInTheDocument();
    });
  });

  describe('폴더 확장/축소', () => {
    it('모두 확장 버튼이 렌더링된다', async () => {
      renderWithProviders(<FileExplorer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
      });

      const expandAllButton = screen.getByLabelText('Expand all');
      expect(expandAllButton).toBeInTheDocument();
    });
  });
});
