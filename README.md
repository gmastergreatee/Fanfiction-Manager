# Fanfiction Manager — Version 4

Welcome to **Fanfiction Manager Version 4**. This repository houses the modernized, 5-platform edition of Fanfiction Manager designed for:
- **Desktop**: Windows (x64/ARM64), macOS (Apple Silicon/Intel), Linux (x64/ARM64)
- **Mobile**: Android (Phones & Tablets), iOS (iPhone & iPad)

**Current Status**: **v4.0.0** (All Phases 1 through 6 completed, Version 4 promoted to project root, legacy v3 archived in `Legacy/`, 100% verified locally and on multi-platform CI/CD).

---

## 🌟 Key Technological Highlights over Version 3

1. **Enterprise Embedded SQLite Architecture (`node:sqlite` / SQLite 3)**:
   - Replaces monolithic, crash-prone `config/novels.json` (1.3MB+) and 6,800+ individual chapter JSON files.
   - ACID transaction safety, foreign key constraints, instant queries, and full-text search.
   - Built-in zero-data-loss auto-migrator (`src/migrator/`) transfers all 30 novels, 6,826 chapters, rules, and covers in ~11 seconds.

2. **Multi-Mode Rule Studio (Mobile & Desktop)**:
   - **Mode 1: Visual Tap-to-Select Picker**: Injects touch/click element highlighting overlay (`src/rule-studio/picker-script.js`). Select elements on mobile or desktop to auto-compile CSS selectors without DevTools.
   - **Mode 2: Conversational AI Assistant (MCP)**: Native Model Context Protocol stdio server (`src/mcp/server.js`) connects to AI models (Claude, Antigravity, Cursor) to inspect pages, analyze novel DOM structures, and generate verified scraping rules.
   - **Mode 3: Community Rule Hub & QR Sync**: 1-click install from verified community repositories; instant QR code transfer between mobile and desktop devices.
   - **Mode 4: Advanced Desktop Code Studio**: Full JavaScript code editor and Chrome/WebKit F12 DevTools on Windows, Linux, and macOS.

3. **Modern Native UI & Live Theme Studio (`src/ui/`)**:
   - Adaptive system styles: **Windows 11 Fluent** (Mica/Acrylic), **Apple Cupertino** (macOS/iOS frosted glass), **Android Material Design 3**, and **Linux GNOME Libadwaita**.
   - **Platform Swapping**: Mobile users can switch between Android MD3 and iOS Cupertino. Desktop users can choose any of the 4 platform designs.
   - **Live Color Customizer**: Live CSS color pickers, custom palette saving, and export/import via `ffm-theme-v4` JSON or QR codes.
   - **Distraction-Free Reader**: OLED pure black, Slate dark, warm sepia, clean light modes with auto-hiding floating HUD.

4. **100% Silent Mobile Updates & Store Bypass (`src/updater/mobile-ota-updater.js`)**:
   - **Silent OTA Hot-Updates**: Web assets update in the background via `mobile-bundle.zip` without App Store or Google Play review delays or manual clicks.
   - **Unattended Android 12+ APK Installer**: Leverages `PackageInstaller.Session` (`USER_ACTION_NOT_REQUIRED`) for background native updates.

5. **3-Version Rollback Ring Buffer (`src/updater/rollback-manager.js`)**:
   - Automatic pre-update snapshot safeguard. Revert code and database up to 3 previous releases directly from the UI header (`⏪ Rollback`) or CLI (`npm run rollback`).
   - Automatically prunes older snapshots beyond 3 to ensure storage efficiency.

6. **Automated Single-Command Workflows**:
   - Developer autonomous release: `npm run release:patch` (tests, bumps version, packages zip, pushes tag, and publishes to GitHub Releases).
   - User self-update: `npm run update:self` (checks releases, downloads, backs up, and applies update).
   - Developer promotion: `npm run switchover` (archives legacy v3 to `Legacy/` and moves `Version 4/` to the project root).

---

## 🛠️ Local Development & Debugging Across Platforms

### 1. Desktop Debugging (macOS, Linux & Windows)
The universal command to start the full desktop app in debug mode with hot reloading:
```bash
# macOS & Linux (in terminal)
npm start

# Or using the 1-click POSIX script:
./start-debug.sh

# Windows (Command Prompt, PowerShell, or 1-click)
npm.cmd start
# Or double-click start-debug.bat
```
*Note: Press **`F12`** or **Right-Click ➔ Inspect Element** anywhere in the opened desktop window to launch WebKit/Chromium DevTools.*

### 2. Fast Frontend UI Development (Browser Only)
Debug Vue 3 components, Themes, and Reader typography in Chrome/Firefox/Safari without compiling Rust:
```bash
npm run dev
# Open http://localhost:5173
```

### 3. Mobile Device & Emulator Debugging (Android & iOS)
Tauri 2.0 provides native mobile emulation commands:
```bash
# Android (Debugs in Android Studio Emulator or USB Device via ADB)
npm run tauri:android

# iOS (macOS only: Debugs in Xcode iOS Simulator or plugged iPhone/iPad)
npm run tauri:ios
```
*Chrome Web Inspector is available at `chrome://inspect` for Android, and Safari Web Inspector via `Develop ➔ Simulator` for iOS.*

---

## 🛠️ CLI Quick Reference

```bash
# Run desktop app in debug mode (macOS, Linux, Windows)
npm start

# Run all test suites
npm test

# Auto-Upgrade legacy v3 data to SQLite
npm run migrate

# Check or perform version rollback
npm run rollback:list
npm run rollback

# Publish a new patch release to GitHub
npm run release:patch

# Self-update to latest release
npm run update:self

# Start native MCP Server
npm run mcp
```

---

## 📖 Documentation Index

- [`AUTO_UPGRADE_GUIDE.md`](./AUTO_UPGRADE_GUIDE.md) — Guide for v3 auto-upgrade, silent OTA mobile updates, and rollback buffer.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Detailed technical architecture, scraper tiers, and database schema.
- [`MCP_SPECIFICATION.md`](./MCP_SPECIFICATION.md) — Full Model Context Protocol specification and tool definitions.
- [`ROADMAP.md`](./ROADMAP.md) — Phased roadmap and platform build specifications.

