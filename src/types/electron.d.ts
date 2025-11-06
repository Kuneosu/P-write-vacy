export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  readDirectory: (folderPath: string) => Promise<FileEntry[]>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  createFile: (folderPath: string, fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  createFolder: (parentPath: string, folderName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  deleteFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  ext?: string;
  modified?: Date;
  created?: Date;
}

export type SortOrder =
  | 'name-asc'
  | 'name-desc'
  | 'modified-desc'
  | 'modified-asc'
  | 'created-desc'
  | 'created-asc';

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
