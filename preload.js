// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  msgBox: (text, caption) => ipcRenderer.send("show-msgbox", text, caption), // 1 way
  rootDir: () => ipcRenderer.invoke("dir-root"),
  createDir: (dirPath) => ipcRenderer.invoke("dir-create", dirPath),
  readFile: (filePath) => ipcRenderer.invoke("file-read", filePath),
  writeFile: (filePath, contents) =>
    ipcRenderer.invoke("file-write", filePath, contents),
  pathExists: (somePath) => ipcRenderer.invoke("path-exists", somePath),
  deletePath: (somePath) => ipcRenderer.invoke("path-delete", somePath),
});
