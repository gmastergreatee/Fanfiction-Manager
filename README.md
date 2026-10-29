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

## 🛠️ Local Development & Debugging Guide

### 1. Prerequisites by Platform

Before starting local development, ensure your environment has the required toolchains:

| Platform | Node.js | Rust & Cargo | Native Build Tools |
| :--- | :--- | :--- | :--- |
| **Windows** | Node 20+ / 22+ | `rustup` (`stable-x86_64-pc-windows-msvc` or `gnu`) | WebView2 (built-in on Win 10/11) + VS Build Tools / MinGW |
| **macOS** | Node 20+ / 22+ | `rustup` (`stable-aarch64-apple-darwin` or `x86_64`) | Xcode Command Line Tools (`xcode-select --install`) |
| **Linux (Ubuntu/Debian)** | Node 20+ / 22+ | `rustup` (`stable-x86_64-unknown-linux-gnu`) | `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `libssl-dev` |
| **Android** | Node 20+ / 22+ | Rust Android targets (`aarch64`, `armv7`, `x86_64`) | Android Studio SDK (API 34), NDK, Java 17 |
| **iOS** | Node 20+ / 22+ | Rust iOS targets (`aarch64-apple-ios`) | macOS with Xcode 15+ |

---

### 2. Launching Desktop Debug Mode

Desktop debug mode boots the native Tauri window, mounts the local SQLite database from [`v4_data/fanfiction.db`](file:///d:/Softwares/Fanfiction%20Manager/resources/app/v4_data/fanfiction.db), and starts the Vite frontend dev server with instant Hot Module Replacement (HMR).

#### On Windows:
- **Option A (1-Click Launcher)**: Double-click **[`start-debug.bat`](file:///d:/Softwares/Fanfiction%20Manager/resources/app/start-debug.bat)** in the root folder.
- **Option B (PowerShell / Command Prompt)**:
  ```powershell
  npm.cmd start
  ```
  *(Or run `npm.cmd run tauri:dev`)*

> [!TIP]
> **Windows PowerShell Execution Policy Note**:
> If you see `File ... npm.ps1 cannot be loaded because running scripts is disabled on this system`, either run `npm.cmd start` instead of `npm`, or run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your PowerShell session.

#### On macOS & Linux:
- **Option A (POSIX Shell Launcher)**:
  ```bash
  ./start-debug.sh
  ```
- **Option B (Standard npm)**:
  ```bash
  npm start
  ```

---

### 3. Inspecting & Debugging the Live UI

Once the application window opens, use native DevTools to debug code, state, network requests, and DOM elements:

| OS | DevTools Shortcut | How to Access |
| :--- | :--- | :--- |
| **Windows** | `F12` | Right-click anywhere in the window ➔ **Inspect Element** |
| **Linux** | `F12` | Right-click anywhere in the window ➔ **Inspect Element** |
| **macOS** | `Cmd + Option + I` | Right-click anywhere in the window ➔ **Inspect Element** |
| **Android** | `chrome://inspect` | Open Google Chrome on your desktop and inspect the connected device/emulator |
| **iOS** | Safari Develop Menu | Safari ➔ **Develop** ➔ **[Simulator / iPhone]** ➔ **Fanfiction Manager** |

---

### 4. Browser-Only UI Debugging (No Rust Compilation Needed)

If you only want to develop or tweak Vue 3 components, Reader mode typography, Tailwind styles, or Theme presets without compiling the Rust backend:
```bash
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173) in your browser. The frontend store ([`frontend/src/stores/library.ts`](file:///d:/Softwares/Fanfiction%20Manager/resources/app/frontend/src/stores/library.ts)) automatically detects when Tauri is absent and activates mock fallback data for instant interactive testing.

---

### 5. Mobile Emulation & Device Debugging

#### Android Debug Mode:
```bash
npm run tauri:android
```
- Compiles the Android Rust JNI library and APK.
- Deploys and launches the app on your running Android Studio Emulator or physical USB phone (via `adb`).
- Inspect web elements via Chrome: navigate to `chrome://inspect/#devices`.

#### iOS Debug Mode (macOS only):
```bash
npm run tauri:ios
```
- Compiles the iOS binary and boots the Xcode iOS Simulator.
- Inspect web elements via Safari: **Develop ➔ Simulator ➔ Fanfiction Manager**.

---

### 6. Core Services, Tests, and MCP Debugging

- **Run All Automated Test Suites (9 Suites)**:
  ```bash
  npm test
  ```
- **Start the AI Model Context Protocol (MCP) Server**:
  ```bash
  npm run mcp
  ```
  *(Listens on SSE port `4455` and `stdio` for AI-assisted rule creation with Claude / Antigravity / Cursor)*
- **Inspect SQLite Library Status via CLI**:
  ```bash
  npm run start:cli
  ```
- **Test v3 ➔ v4 SQLite Data Migration**:
  ```bash
  npm run migrate:dry    # Safe preview
  npm run migrate        # Execute migration
  ```

---

### 7. Production Packaging & Release Building

- **Compile Desktop Release Installers (Windows NSIS `.exe`, macOS `.dmg/.app`, Linux `.AppImage/.deb`)**:
  ```bash
  npm run build:ui       # Builds frontend into dist_ui/
  npm run tauri:build    # Generates native bundles in src-tauri/target/release/bundle/
  ```
- **Generate Multi-Platform Release Archives**:
  ```bash
  npm run package:release
  ```
  *(Generates `dist/app.zip`, `dist/mobile-bundle.zip`, and SHA-256 `dist/checksums.json`)*

- **Continuous Integration (CI/CD Performance)**:
  - CI builds on GitHub Actions are automatically accelerated using:
    - `swatinem/rust-cache@v2`: caches 468 Rust crate targets and cargo registries across macOS, Linux, and Windows.
    - Windows Defender build exclusions for compiler tools and repository workspaces.
    - Node.js npm dependency cache with dual `package-lock.json` hashes.
    - Automated test runners on lightweight Ubuntu virtualization.

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

