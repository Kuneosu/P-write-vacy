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
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션 모드: 빌드된 파일 로드
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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

// 폴더 선택
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// 디렉토리 읽기
ipcMain.handle('read-directory', async (event, folderPath) => {
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
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
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 쓰기
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 생성
ipcMain.handle('create-file', async (event, folderPath, fileName) => {
  try {
    const filePath = path.join(folderPath, fileName);
    await fs.writeFile(filePath, '', 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 삭제
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일 이름 변경
ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 폴더 생성
ipcMain.handle('create-folder', async (event, parentPath, folderName) => {
  try {
    const folderPath = path.join(parentPath, folderName);
    await fs.mkdir(folderPath);
    return { success: true, path: folderPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 폴더 삭제
ipcMain.handle('delete-folder', async (event, folderPath) => {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 파일/폴더 복제
ipcMain.handle('duplicate-item', async (event, itemPath) => {
  try {
    const parsedPath = path.parse(itemPath);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory()) {
      // 폴더 복제
      let newPath = itemPath + ' copy';
      let counter = 1;
      while (fsSync.existsSync(newPath)) {
        newPath = `${itemPath} copy ${counter}`;
        counter++;
      }

      // 재귀적으로 폴더 복사
      await copyDir(itemPath, newPath);
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

      await fs.copyFile(itemPath, newPath);
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
    const result = await shell.openPath(itemPath);
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
    shell.showItemInFolder(itemPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
