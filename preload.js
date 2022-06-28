// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // --- renderer to main - 1 way
  msgBox: (text, caption) => ipcRenderer.send("show-msgbox", text, caption),

  // --- renderer to main - 2 way
  rootDir: () => ipcRenderer.invoke("dir-root"),
  createDir: (dirPath) => ipcRenderer.invoke("dir-create", dirPath),
  readFile: (filePath) => ipcRenderer.invoke("file-read", filePath),
  writeFile: (filePath, contents) =>
    ipcRenderer.invoke("file-write", filePath, contents),
  downloadFile: (url, filePath, index, cb) =>
    ipcRenderer.invoke("file-download", url, filePath, index, cb),
  pathExists: (somePath) => ipcRenderer.invoke("path-exists", somePath),
  deletePath: (somePath) => ipcRenderer.invoke("path-delete", somePath),
  sendInput: (type, accelerator) =>
    ipcRenderer.invoke("send-input", type, accelerator),

  // --- main to renderer
  log: (callback) => ipcRenderer.on("log-message", callback),
  callGlobalCallBack: (callback) => ipcRenderer.on("globalCallBack", callback),
});
