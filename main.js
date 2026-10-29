// Version 4/main.js
/**
 * Fanfiction Manager Version 4 — Main Desktop Bootstrap
 * Handles:
 * 1. Automatic data migration from legacy v3 on initial launch
 * 2. Multi-Platform update checks
 * 3. Native window lifecycle & MCP server initialization
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpgradeIfRequired } = require('./src/migrator');
const DatabaseClient = require('./src/core/db');
const V4Updater = require('./src/updater/v4-updater');

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow = null;
let db = null;
let updater = null;

// Check if running in MCP mode via CLI flag
if (process.argv.includes('--mcp')) {
  const MCPServer = require('./src/mcp/server');
  const server = new MCPServer();
  server.start();
  return;
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    darkTheme: true,
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  const iconPath = path.join(__dirname, 'Icon.png');
  if (fs.existsSync(iconPath)) {
    mainWindow.setIcon(iconPath);
  }

  // Load splash / loading view while initializing
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #121212; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); width: 44px; height: 44px; border-radius: 50%; border-left-color: #3b82f6; animation: spin 1s linear infinite; margin-bottom: 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        h2 { font-weight: 500; font-size: 1.25rem; margin-bottom: 8px; }
        p { color: #888; font-size: 0.9rem; margin: 0; }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <h2>Fanfiction Manager v4</h2>
      <p id="status">Initializing & Checking Library...</p>
    </body>
    </html>
  `)}`);

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();

    // Step 1: Perform automatic upgrade from v3 if needed
    try {
      const legacyPath = fs.existsSync(path.join(__dirname, 'Legacy'))
        ? path.join(__dirname, 'Legacy')
        : path.resolve(__dirname, '..');
      const upgradeResult = await autoUpgradeIfRequired({
        v3Path: legacyPath,
        v4DataDir: path.join(__dirname, 'v4_data'),
        onProgress: (p) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.executeJavaScript(`
              document.getElementById('status').innerText = 'Migrating novel [${p.index}/${p.total}]: "${p.title.replace(/'/g, "\\'")}"';
            `).catch(() => {});
          }
        },
      });

      if (upgradeResult.status === 'SUCCESS') {
        console.log(`[Auto-Upgrade] Migrated ${upgradeResult.novelCount} novels and ${upgradeResult.chapterCount} chapters.`);
      }
    } catch (err) {
      console.error('[Auto-Upgrade] Error during migration:', err);
    }

    // Step 2: Initialize Database & Updater
    db = new DatabaseClient(path.join(__dirname, 'v4_data', 'fanfiction.db'));
    updater = new V4Updater({ currentVersion: '4.0.0', db });

    // Step 3: Check for updates in the background
    updater.checkForUpdates().then((res) => {
      if (res && res.updateAvailable) {
        console.log(`[V4Updater] New update available: ${res.latestVersion}`);
      }
    }).catch(() => {});

    // Load the modern native-themed UI
    mainWindow.loadFile(path.join(__dirname, 'src', 'ui', 'index.html'));
  });
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

