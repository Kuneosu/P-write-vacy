const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // macOS: 타이틀바 숨기기
    trafficLightPosition: { x: 16, y: 16 }, // macOS: 신호등 버튼 위치
    frame: process.platform !== 'darwin', // Windows/Linux: 기본 프레임 유지
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // 개발 모드: Vite 개발 서버 로드
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // 개발 모드에서만 DevTools 활성화
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션 모드: 빌드된 파일 로드
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    // 프로덕션에서는 DevTools 비활성화 (보안)
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 핸들러들
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.json', '.log'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB 제한

// 보안: 파일 경로 검증 (상위 디렉토리 접근 방지)
let allowedBasePath = null;

function validatePath(targetPath) {
  if (!allowedBasePath) {
    throw new Error('작업 폴더가 선택되지 않았습니다.');
  }

  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(allowedBasePath);

  // 경로가 허용된 기본 경로 내에 있는지 확인
  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error('허용되지 않은 경로 접근입니다.');
  }

  return resolvedTarget;
}

// 폴더 선택
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  }

  // 선택된 폴더를 허용된 기본 경로로 설정
  allowedBasePath = result.filePaths[0];
  return allowedBasePath;
});

// 디렉토리 읽기
ipcMain.handle('read-directory', async (event, folderPath) => {
  try {
    const validatedPath = validatePath(folderPath);
    const entries = await fs.readdir(validatedPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(validatedPath, entry.name);
      const stats = await fs.stat(fullPath);

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            ext: ext,
            modified: stats.mtime,
            created: stats.birthtime,
          });
        }
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          modified: stats.mtime,
          created: stats.birthtime,
        });
      }
    }

    return files;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

// 파일 읽기
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const validatedPath = validatePath(filePath);

    // 파일 크기 체크
    const stats = await fs.stat(validatedPath);
    if (stats.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `파일이 너무 큽니다. (최대 ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      };
    }

    const content = await fs.readFile(validatedPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 쓰기
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    const validatedPath = validatePath(filePath);
    await fs.writeFile(validatedPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 생성
ipcMain.handle('create-file', async (event, folderPath, fileName) => {
  try {
    const validatedFolderPath = validatePath(folderPath);
    const filePath = path.join(validatedFolderPath, fileName);
    const validatedFilePath = validatePath(filePath);
    await fs.writeFile(validatedFilePath, '', 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 삭제
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const validatedPath = validatePath(filePath);
    await fs.unlink(validatedPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 이름 변경
ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    const validatedOldPath = validatePath(oldPath);
    const validatedNewPath = validatePath(newPath);
    await fs.rename(validatedOldPath, validatedNewPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 폴더 생성
ipcMain.handle('create-folder', async (event, parentPath, folderName) => {
  try {
    const validatedParentPath = validatePath(parentPath);
    const folderPath = path.join(validatedParentPath, folderName);
    const validatedFolderPath = validatePath(folderPath);
    await fs.mkdir(validatedFolderPath);
    return { success: true, path: folderPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 폴더 삭제
ipcMain.handle('delete-folder', async (event, folderPath) => {
  try {
    const validatedPath = validatePath(folderPath);
    await fs.rm(validatedPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일/폴더 복제
ipcMain.handle('duplicate-item', async (event, itemPath) => {
  try {
    const validatedPath = validatePath(itemPath);
    const parsedPath = path.parse(validatedPath);
    const stats = await fs.stat(validatedPath);

    if (stats.isDirectory()) {
      // 폴더 복제
      let newPath = validatedPath + ' copy';
      let counter = 1;
      while (fsSync.existsSync(newPath)) {
        newPath = `${validatedPath} copy ${counter}`;
        counter++;
      }

      const validatedNewPath = validatePath(newPath);
      // 재귀적으로 폴더 복사
      await copyDir(validatedPath, validatedNewPath);
      return { success: true, path: newPath };
    } else {
      // 파일 복제
      const ext = parsedPath.ext;
      const nameWithoutExt = parsedPath.name;
      let newPath = path.join(parsedPath.dir, `${nameWithoutExt} copy${ext}`);
      let counter = 1;

      while (fsSync.existsSync(newPath)) {
        newPath = path.join(parsedPath.dir, `${nameWithoutExt} copy ${counter}${ext}`);
        counter++;
      }

      const validatedNewPath = validatePath(newPath);
      await fs.copyFile(validatedPath, validatedNewPath);
      return { success: true, path: newPath };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 폴더 재귀 복사 헬퍼 함수
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// 기본 앱에서 열기
ipcMain.handle('open-with-default', async (event, itemPath) => {
  try {
    const validatedPath = validatePath(itemPath);
    const result = await shell.openPath(validatedPath);
    if (result) {
      return { success: false, error: result };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Finder에서 보기
ipcMain.handle('reveal-in-finder', async (event, itemPath) => {
  try {
    const validatedPath = validatePath(itemPath);
    shell.showItemInFolder(validatedPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
