#!/usr/bin/env bash
# Fanfiction Manager v4 - Debug Launcher (macOS & Linux)
# Automatically adds Rust Cargo to PATH and launches Tauri dev mode

export PATH="$HOME/.cargo/bin:$PATH"
echo "🚀 Starting Fanfiction Manager v4 in Tauri Debug Mode..."
npm start

