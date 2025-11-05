const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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
