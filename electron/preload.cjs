const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // 폴더 선택
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // 파일 목록 읽기
  readDirectory: (folderPath) => ipcRenderer.invoke('read-directory', folderPath),

  // 파일 읽기
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // 파일 쓰기
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // 파일 생성
  createFile: (folderPath, fileName) => ipcRenderer.invoke('create-file', folderPath, fileName),

  // 파일 삭제
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

  // 파일 이름 변경
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
});
