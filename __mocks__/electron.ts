/**
 * Electron API Mock
 * 테스트 환경에서 window.electron API를 mock합니다.
 */

import type { FileEntry } from '../src/types/electron';

// Mock 데이터
const mockFiles: Map<string, string> = new Map();
const mockFolders: Set<string> = new Set(['/test-folder']);

// 현재 선택된 폴더
let currentFolder: string | null = '/test-folder';

export const mockElectronAPI = {
  // 폴더 선택
  selectFolder: jest.fn(async (): Promise<string | null> => {
    currentFolder = '/test-folder';
    return currentFolder;
  }),

  // 디렉토리 읽기 (실제 API는 FileEntry[] 직접 반환)
  readDirectory: jest.fn(async (folderPath: string): Promise<FileEntry[]> => {
    const files: FileEntry[] = [
      {
        name: 'test-file.md',
        path: `${folderPath}/test-file.md`,
        type: 'file',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-02'),
      },
      {
        name: 'test-folder',
        path: `${folderPath}/test-folder`,
        type: 'directory',
        created: new Date('2025-01-01'),
        modified: new Date('2025-01-01'),
      },
    ];

    return files;
  }),

  // 파일 읽기
  readFile: jest.fn(async (filePath: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    const content = mockFiles.get(filePath) || 'Test file content';
    return { success: true, content };
  }),

  // 파일 쓰기
  writeFile: jest.fn(async (filePath: string, content: string): Promise<{ success: boolean; error?: string }> => {
    mockFiles.set(filePath, content);
    return { success: true };
  }),

  // 파일 생성
  createFile: jest.fn(async (folderPath: string, fileName: string): Promise<{ success: boolean; error?: string }> => {
    const filePath = `${folderPath}/${fileName}`;
    mockFiles.set(filePath, '');
    return { success: true };
  }),

  // 파일 삭제
  deleteFile: jest.fn(async (filePath: string): Promise<{ success: boolean; error?: string }> => {
    mockFiles.delete(filePath);
    return { success: true };
  }),

  // 파일 이름 변경 / 이동
  renameFile: jest.fn(async (oldPath: string, newPath: string): Promise<{ success: boolean; error?: string }> => {
    const content = mockFiles.get(oldPath);
    if (content !== undefined) {
      mockFiles.delete(oldPath);
      mockFiles.set(newPath, content);
    }
    return { success: true };
  }),

  // 폴더 생성
  createFolder: jest.fn(async (parentPath: string, folderName: string): Promise<{ success: boolean; error?: string }> => {
    const folderPath = `${parentPath}/${folderName}`;
    mockFolders.add(folderPath);
    return { success: true };
  }),

  // 폴더 삭제
  deleteFolder: jest.fn(async (folderPath: string): Promise<{ success: boolean; error?: string }> => {
    mockFolders.delete(folderPath);
    return { success: true };
  }),

  // 항목 복제
  duplicateItem: jest.fn(async (itemPath: string): Promise<{ success: boolean; newPath?: string; error?: string }> => {
    const newPath = `${itemPath}-copy`;
    const content = mockFiles.get(itemPath);
    if (content !== undefined) {
      mockFiles.set(newPath, content);
    }
    return { success: true, newPath };
  }),

  // 기본 앱으로 열기
  openWithDefault: jest.fn(async (itemPath: string): Promise<{ success: boolean; error?: string }> => {
    console.log('Opening with default app:', itemPath);
    return { success: true };
  }),

  // Finder에서 보기
  revealInFinder: jest.fn(async (itemPath: string): Promise<{ success: boolean; error?: string }> => {
    console.log('Revealing in Finder:', itemPath);
    return { success: true };
  }),
};

// 전역 window.electron 설정
export const setupElectronMock = (): void => {
  Object.defineProperty(window, 'electron', {
    writable: true,
    configurable: true,
    value: mockElectronAPI,
  });
};

// Mock 초기화 (각 테스트 전에 호출)
export const resetElectronMock = (): void => {
  mockFiles.clear();
  mockFolders.clear();
  mockFolders.add('/test-folder');
  currentFolder = '/test-folder';

  // Mock 함수들 초기화
  Object.values(mockElectronAPI).forEach((mockFn) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
};
