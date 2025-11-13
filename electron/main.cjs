const { app, BrowserWindow, ipcMain, dialog, shell, protocol, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

// app:// 프로토콜에 특권 부여 (localStorage 등 사용 가능하도록)
// 반드시 app.whenReady() 전에 호출해야 함
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
      bypassCSP: false,
      stream: true
    }
  }
]);

// 디버그 로깅 활성화
console.log('Electron app starting...');
console.log('__dirname:', __dirname);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

let mainWindow;

// 처리되지 않은 예외 캐치
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createWindow() {
  console.log('Creating window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // 준비될 때까지 숨김
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    frame: process.platform !== 'darwin',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false, // 디버깅을 위해 임시로 비활성화
    },
  });

  // 웹 컨텐츠 로그
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('[Renderer]', message, `(${sourceId}:${line})`);
  });

  // 개발 모드: Vite 개발 서버 로드
  if (process.env.NODE_ENV === 'development') {
    console.log('Loading development server...');
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load dev server:', err);
    });
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션 모드: 빌드된 파일 로드
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production build from:', indexPath);
    console.log('File exists:', fsSync.existsSync(indexPath));
    console.log('Resources path:', process.resourcesPath);
    console.log('__dirname:', __dirname);

    // loadFile 대신 loadURL + custom protocol 사용
    mainWindow.loadURL('app://./index.html').catch(err => {
      console.error('Failed to load index.html:', err);
    });

    // 프로덕션에서도 디버깅을 위해 DevTools 열기
    mainWindow.webContents.openDevTools();
  }

  // ready-to-show 이벤트로 깜빡임 방지
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // 로딩 실패 감지
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // 윈도우 이벤트 핸들링
  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });

  // 크래시 감지
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Window crashed, killed:', killed);
    // 크래시 시 앱 재시작 옵션
    const options = {
      type: 'error',
      title: 'Application Crashed',
      message: 'The application has crashed. Do you want to restart?',
      buttons: ['Restart', 'Quit']
    };
    dialog.showMessageBox(options).then((result) => {
      if (result.response === 0) {
        app.relaunch();
        app.exit(0);
      } else {
        app.quit();
      }
    });
  });

  mainWindow.on('unresponsive', () => {
    console.error('Window unresponsive');
  });

  mainWindow.on('responsive', () => {
    console.log('Window responsive again');
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS의 경우 첫 번째 메뉴는 앱 이름
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File 메뉴
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit 메뉴
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // View 메뉴
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window 메뉴 - 여기가 크래시 원인이었던 부분
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && !focusedWindow.isDestroyed()) {
              focusedWindow.minimize();
            }
          }
        },
        {
          label: 'Zoom',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && !focusedWindow.isDestroyed()) {
              if (focusedWindow.isMaximized()) {
                focusedWindow.unmaximize();
              } else {
                focusedWindow.maximize();
              }
            }
          }
        },
        { type: 'separator' },
        ...(isMac ? [
          { role: 'front' },
          { type: 'separator' },
          {
            label: 'Bring All to Front',
            click: () => {
              const windows = BrowserWindow.getAllWindows();
              windows.forEach(win => {
                if (win && !win.isDestroyed()) {
                  win.show();
                }
              });
            }
          }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    // Help 메뉴
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/anthropics/claude-code');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  // 메뉴 생성 (크래시 방지를 위해 명시적으로 설정)
  createMenu();

  // app:// custom protocol 등록
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.substring(6); // 'app://' 제거
    console.log('App protocol request:', url);

    // URL 디코딩 및 query string 제거
    url = decodeURIComponent(url.split('?')[0]);

    // './' 또는 '/' 로 시작하는 경로 정규화
    url = url.replace(/^\.\//, '');
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    console.log('Normalized URL:', url);

    // 먼저 asar.unpacked에서 찾기 (미디어 파일용)
    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', url);
    console.log('Checking unpacked:', unpackedPath);

    if (fsSync.existsSync(unpackedPath)) {
      console.log('✓ Found in unpacked:', unpackedPath);
      callback({ path: unpackedPath });
      return;
    }

    // asar 내부에서 찾기 (일반 파일용)
    const asarPath = path.join(__dirname, '..', 'dist', url);
    console.log('Checking asar:', asarPath);

    if (fsSync.existsSync(asarPath)) {
      console.log('✓ Found in asar:', asarPath);
      callback({ path: asarPath });
      return;
    }

    console.error('✗ File not found:', url);
    callback({ error: -6 }); // ERR_FILE_NOT_FOUND
  });

  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  // 모든 플랫폼에서 앱 종료
  app.quit();
});

app.on('activate', () => {
  console.log('App activated');
  // macOS: Dock 아이콘 클릭 시 창이 없으면 새로 생성
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
