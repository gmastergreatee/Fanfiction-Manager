// main.js

// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  session,
  Menu,
  shell,
} = require("electron");

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.commandLine.appendSwitch("disable-site-isolation-trials");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

const path = require("path");
var { http, https } = require("follow-redirects");
const fs = require("fs");
const extract = require("extract-zip");

let mainWindow;
let url_includes_to_block = [
  "adsbygoogle",
  "googleads",
  "wpdiscuz",
  "amazon",
  "/ads",
  "googlesyndication",
  "adservice",
  "translate.google",
];

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    darkTheme: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false,
      webviewTag: true,
      nodeIntegration: true,
    },
    show: false,
    autoHideMenuBar: true,
  });
  mainWindow.setIcon(path.join(__dirname, "Icon.png"));

  // mainWindow.webContents.session.webRequest.onHeadersReceived(
  //   (details, callback) => {
  //     callback({
  //       responseHeaders: Object.fromEntries(
  //         Object.entries(details.responseHeaders).filter(
  //           (header) =>
  //             !/x-frame-options/i.test(header[0]) &&
  //             !/content-security-policy/i.test(header[0])
  //         )
  //       ),
  //     });
  //   }
  // );

  let selectionMenu = Menu.buildFromTemplate([
    { role: "copy" },
    { type: "separator" },
    { role: "selectall" },
  ]);

  let inputMenu = Menu.buildFromTemplate([
    // { role: "undo" },
    // { role: "redo" },
    // { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },
    { type: "separator" },
    { role: "selectall" },
  ]);

  mainWindow.webContents.on("context-menu", (e, props) => {
    const { selectionText, isEditable } = props;
    if (isEditable) {
      inputMenu.popup();
    } else if (selectionText && selectionText.trim() !== "") {
      selectionMenu.popup();
    }
  });

  mainWindow.webContents.on("new-window", function (event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();

    mainWindow.on('maximize', () => {
      mainWindow.webContents.send("on-app-maximized");
    });

    mainWindow.on('unmaximize', () => {
      mainWindow.webContents.send("on-app-unmaximized");
    });

    //#region Disabling CORS
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      let url = details.url.toLowerCase();
      if (!(url.startsWith("file://") || url.startsWith("devtools://"))) {
        details.responseHeaders["access-control-allow-origin"] = "*";
      }
      callback({ responseHeaders: details.responseHeaders });
    });
    //#endregion

    //#region URL blocking system
    session.defaultSession.webRequest.onBeforeRequest(
      // { urls: ["*://*./*"] },
      function (details, callback) {
        let blocked = false;
        let url = details.url.toLowerCase();
        if (
          url.startsWith("file://") ||
          url.startsWith("devtools://") ||
          url.includes("gmastergreatee/Fanfiction-Manager")
        ) {
          callback({ cancel: false });
          return;
        }

        url_includes_to_block.every((x) => {
          if (url.includes(x.toLowerCase())) {
            callback({ cancel: true });
            blocked = true;
            return false;
          }
          return true;
        });

        if (!blocked) callback({ cancel: false });
      }
    );
    //#endregion
  });

  // and load the index.html of the app.
  // mainWindow.loadURL("http://localhost:5500/index.html");
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  session.defaultSession.setProxy({ proxyRules: null });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  handleComs();

  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function handleComs() {
  ipcMain.on("show-msgbox", showMessageBox);
  ipcMain.on("block-includes", urlIncludesToBlock);
  ipcMain.on("toggle-fullscreen", toggleFullScreen);
  ipcMain.on("app-relaunch", relaunchApp);
  ipcMain.on("maximize-app", maximizeApp);
  ipcMain.on("start-check-captcha", startCheckCaptcha);
  ipcMain.on("stop-check-captcha", stopCheckCaptcha);
  ipcMain.handle("dir-create", createDirectory);
  ipcMain.handle("dir-root", rootDir);
  ipcMain.handle("file-read", readFile);
  ipcMain.handle("file-write", writeFile);
  ipcMain.handle("path-exists", pathExists);
  ipcMain.handle("path-delete", deletePath);
  ipcMain.handle("send-input", sendInput);
  ipcMain.handle("app-update-self", updateApp);
}

//#region APIS
function showMessageBox(e, text = "", caption = "") {
  if (text.trim() && caption.trim()) {
    dialog.showMessageBoxSync(mainWindow, {
      message: text,
      title: caption,
    });
  }
}

function urlIncludesToBlock(e, includes = []) {
  url_includes_to_block = includes;
}

function toggleFullScreen() {
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
  } else {
    mainWindow.setFullScreen(true);
  }
}

function createDirectory(e, dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, {
        recursive: true,
      });
    } catch {
      return null;
    }
  }
  return dirPath;
}

function deletePath(e, somePath) {
  fs.rmSync(somePath, {
    recursive: true,
    force: true,
  });
}

function writeFile(e, filePath, contents) {
  let dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, {
        recursive: true,
      });
    } catch {
      return null;
    }
  }
  fs.writeFileSync(filePath, contents);
}

function pathExists(e, somePath) {
  return fs.existsSync(somePath);
}

async function readFile(e, filePath) {
  return fs.readFileSync(filePath, {
    encoding: "utf8",
  });
}

async function rootDir() {
  return __dirname;
}

async function sendInput(e, type, accelerator) {
  mainWindow.webContents.sendInputEvent({ type: type, keyCode: accelerator });
}

async function updateApp(e, appZipUrl = "") {
  let dirPath = __dirname;
  let dirPathExists = pathExists(null, dirPath);
  if (!dirPathExists) {
    createDirectory(null, dirPath);
  }
  let filePath = path.join(dirPath, "app.zip");
  var file = fs.createWriteStream(filePath);

  let request = new Promise((resolve, reject) => {
    https
      .get(appZipUrl, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.end(() => {
            resolve(filePath);
          });
        });
      })
      .on("error", function (err) {
        deletePath(e, filePath);
        reject(err);
      });
  });

  try {
    let response = await request;
    await extract(response, {
      dir: dirPath,
    });
    deletePath(e, response);
    return {
      success: true,
    };
  } catch (ex) {
    console.log(ex);
    return {
      success: false,
      message: ex.message,
    };
  }
}

function maximizeApp() {
  if (!mainWindow.isMaximized()) {
    mainWindow.maximize(); 
  }
}

function relaunchApp() {
  app.relaunch();
  app.exit();
}

let captchaCheckMode = false;
let captchaInterval;

function startCheckCaptcha() {
  if (captchaInterval) {
    clearInterval(captchaInterval);
  }
  captchaInterval = setInterval(() => {
    mainWindow.webContents.mainFrame.framesInSubtree.forEach(frame => {
      console.log(frame.url);
      if (frame.url.startsWith('http')) {
        console.log('executed');
        frame.executeJavaScript(`Array.from(document.querySelectorAll('input')).forEach(x => x.click());`);
      }
    });
  }, 500);
}

function stopCheckCaptcha() {
  if (captchaInterval) {
    clearInterval(captchaInterval);
  }
}
//#endregion