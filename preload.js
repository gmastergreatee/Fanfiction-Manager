// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

let jqFileContents = fs.readFileSync(
  path.join(__dirname, "js", "jquery.min.js"),
  {
    encoding: "utf8",
  }
);

contextBridge.exposeInMainWorld("electronAPI", {
  JqueryString: () => jqFileContents,
  // --- renderer to main - 1 way
  msgBox: (text, caption) => ipcRenderer.send("show-msgbox", text, caption),
  relaunchApp: () => ipcRenderer.send("app-relaunch"),
  urlIncludesToBlock: (includes) =>
    ipcRenderer.send("block-includes", includes),
  toggleFullScreen: () => ipcRenderer.send("toggle-fullscreen"),
  startCheckCaptcha: () => ipcRenderer.send("start-check-captcha"),
  stopCheckCaptcha: () => ipcRenderer.send("stop-check-captcha"),

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
  updateApp: (appZipUrl) => ipcRenderer.invoke("app-update-self", appZipUrl),

  // --- main to renderer
  log: (callback) => ipcRenderer.on("log-message", callback),
});
