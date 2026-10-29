#!/usr/bin/env node
// scripts/start-tauri.js
/**
 * Cross-platform launcher for Tauri 2.0 in debug/dev mode.
 * Automatically injects Rust Cargo to PATH if needed and handles Windows cmd execution.
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Ensure cargo bin is in PATH
const cargoBinDir = path.join(os.homedir(), '.cargo', 'bin');
const env = { ...process.env };
if (fs.existsSync(cargoBinDir)) {
  if (env.PATH) {
    if (!env.PATH.toLowerCase().includes('.cargo\\bin') && !env.PATH.toLowerCase().includes('.cargo/bin')) {
      env.PATH = `${cargoBinDir}${path.delimiter}${env.PATH}`;
    }
  } else {
    env.PATH = cargoBinDir;
  }
}

console.log('🚀 Starting Fanfiction Manager v4 (Tauri Debug Mode)...');
const isWin = process.platform === 'win32';

let child;
if (isWin) {
  child = spawn('cmd.exe', ['/c', 'npx', '@tauri-apps/cli', 'dev'], {
    stdio: 'inherit',
    env,
  });
} else {
  child = spawn('npx', ['@tauri-apps/cli', 'dev'], {
    stdio: 'inherit',
    env,
  });
}

child.on('error', (err) => {
  console.error('Failed to start Tauri:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
