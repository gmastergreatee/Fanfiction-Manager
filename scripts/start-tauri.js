#!/usr/bin/env node
// scripts/start-tauri.js
/**
 * Cross-platform launcher for Tauri 2.0 in debug/dev mode.
 * Automatically injects Rust Cargo and System32 to PATH if needed and handles Windows execution.
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const isWin = process.platform === 'win32';

// Resolve existing PATH case-insensitively
const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || (isWin ? 'Path' : 'PATH');
let currentPath = process.env[pathKey] || '';

// Ensure Cargo bin directory is in PATH
const cargoBinDir = path.join(os.homedir(), '.cargo', 'bin');
if (fs.existsSync(cargoBinDir)) {
  const normalized = currentPath.toLowerCase();
  if (!normalized.includes('.cargo\\bin') && !normalized.includes('.cargo/bin')) {
    currentPath = `${cargoBinDir}${path.delimiter}${currentPath}`;
  }
}

// Ensure Windows System32 is present in PATH for cmd.exe / PowerShell utilities
if (isWin) {
  const sysRoot = process.env.SystemRoot || 'C:\\Windows';
  const sys32 = path.join(sysRoot, 'System32');
  if (!currentPath.toLowerCase().includes('system32')) {
    currentPath = `${currentPath}${path.delimiter}${sys32}`;
  }
}

// Propagate updated PATH with both casings to prevent Windows env shadowing
process.env[pathKey] = currentPath;
const env = {
  ...process.env,
  [pathKey]: currentPath,
  PATH: currentPath,
  Path: currentPath,
};

console.log('🚀 Starting Fanfiction Manager v4 (Tauri Debug Mode)...');

let child;
if (isWin) {
  const cmdExe = process.env.ComSpec || path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe');
  child = spawn(cmdExe, ['/c', 'npx', '@tauri-apps/cli', 'dev'], {
    stdio: 'inherit',
    env,
    cwd: path.resolve(__dirname, '..'),
  });
} else {
  child = spawn('npx', ['@tauri-apps/cli', 'dev'], {
    stdio: 'inherit',
    env,
    cwd: path.resolve(__dirname, '..'),
  });
}

child.on('error', (err) => {
  console.error('Failed to start Tauri:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
