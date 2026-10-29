# Version 4 Auto-Upgrade & Release Guide

This guide explains how existing users running **Fanfiction Manager v3.x** can auto-upgrade to **Version 4** seamlessly using the existing in-app auto-update system, with zero data loss.

---

## 1. How the Seamless Upgrade Works for Existing v3 Users

### Current v3 Update Mechanism Recap
In the current application:
1. Every 12 hours (or when the user clicks the "Update" button in the header), v3 calls `checkAppUpdate()`.
2. It queries `https://api.github.com/repos/gmastergreatee/Fanfiction-Manager/releases/latest`.
3. It parses the release tag (e.g., `v4.0.0` or `beta_4.0.0`) and detects that `400 > 320`.
4. It downloads the release asset named **`app.zip`**.
5. It extracts `app.zip` directly into `resources/app/` (overwriting the app files).
6. It triggers `relaunchApp()`.

### What Happens on First v4 Launch
When the newly extracted Version 4 boots:
1. Version 4's [`main.js`](./main.js) launches.
2. It runs the [`src/migrator`](./src/migrator) auto-upgrader before showing the main window.
3. The migrator automatically:
   - Detects the existing `config/novels.json`, `config/rules.json`, `data/novels/`, and `data/covers/`.
   - Converts all **30 novels** and **6,826+ chapters** into SQLite records in `v4_data/fanfiction.db`.
   - Copies cover images into `v4_data/covers/`.
   - Writes a completion record into `migration_history`.
4. The migration completes in ~11 seconds.
5. The application opens with the user's complete library and downloaded chapters fully intact!

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant V3App as Existing v3 App
    participant GitHub as GitHub Releases
    participant V4App as Version 4 Bootstrap
    participant Migrator as SQLite Migrator Engine

    User->>V3App: Clicks "Update" (or 12h background timer)
    V3App->>GitHub: GET /releases/latest
    GitHub-->>V3App: Finds tag "v4.0.0" with asset "app.zip"
    V3App->>User: "New update found - v4.0.0, wanna download?"
    User->>V3App: Clicks "Yaay!"
    V3App->>GitHub: Downloads "app.zip"
    V3App->>V3App: Extracts to resources/app & calls relaunchApp()
    Note over V3App, V4App: Application restarts into Version 4
    V4App->>Migrator: autoUpgradeIfRequired()
    Migrator->>Migrator: Reads novels.json, rules.json, & 6,800+ chapter JSONs
    Migrator->>Migrator: Transactionally commits into SQLite database & copies covers
    Migrator-->>V4App: Returns SUCCESS
    V4App-->>User: Opens Version 4 with full library intact!
```

---

## 2. How to Publish the Version 4 Release

To trigger this auto-upgrade for existing users:

### Step 1: Generate `app.zip`
In the `Version 4` directory, run:
```bash
npm run package:release
```
This builds `Version 4/dist/app.zip` containing all Version 4 components and the auto-upgrade bootstrap.

### Step 2: Create a GitHub Release
1. Go to your GitHub repository: `https://github.com/gmastergreatee/Fanfiction-Manager/releases/new`.
2. Tag version: `v4.0.0` or `beta_4.0.0`.
3. Release title: `Fanfiction Manager v4.0.0 — Next-Gen Multi-Platform & MCP`.
4. Attach files to the release:
   - Attach **`Version 4/dist/app.zip`** (mandatory for existing v3 in-app updater).
   - Attach platform installers (`.exe`, `.dmg`, `.AppImage`, `.apk`) as built.
5. Click **Publish Release**.

Existing users worldwide will immediately see the update dialog in their v3 application and upgrade smoothly!

---

## 3. Version 4 Ongoing Updates & Mobile Store-Bypass Architecture

Going forward in Version 4, [`src/updater/mobile-ota-updater.js`](./src/updater/mobile-ota-updater.js) eliminates the need for manual store installs or clicking:

| Platform | Update Delivery Mechanism (100% Store-Bypass) | User Experience |
| :--- | :--- | :--- |
| **Android (Silent OTA)** | Downloads `mobile-bundle.zip` (~20 KB) from GitHub Releases in background; extracts to app storage & hot-reloads webview. | **100% Silent**. Zero clicks, zero package prompts. Exactly like desktop! |
| **Android (Native APK)** | On Android 12+ (API 31+), uses `PackageInstaller.Session` with `USER_ACTION_NOT_REQUIRED` to install APKs unattended. | Automated background install after initial permission grant. |
| **iOS (Silent OTA)** | Apple Guideline 2.5.2 permits dynamic JavaScript/HTML/CSS hot updates over the air. Native shell installed once (AltStore, SideStore, or PWA); future updates hot-swap via `mobile-bundle.zip`. | **100% Silent**. No TestFlight or App Store review delays. |
| **Desktop (Win/Mac/Linux)** | In-app notification or `npm run update:self` automatically downloads `app.zip` and hot-swaps in place. | 1-Click or automated background update. |
| **Dynamic Site Rules** | Background sync fetches verified scraping rules from GitHub directly into SQLite without needing an app update! | 100% automated & silent across all devices. |

---

## 4. Single-Command Fully Automated Workflows

### 4.1 Releasing an Update (Developer)
To release an update completely automatically without any manual steps:

```bash
# In "Version 4" directory:
npm run release:patch    # Bumps 4.0.0 -> 4.0.1
# or
npm run release:minor    # Bumps 4.0.0 -> 4.1.0
```

**What this single command executes automatically:**
1. Runs full test suite (`tests/test-migration.js`) verifying 100% data integrity.
2. Auto-bumps version in `package.json`.
3. Packages `dist/app.zip` and calculates cryptographic SHA-256 hash in `dist/checksums.json`.
4. Creates Git commit and tags release (e.g. `v4.0.1`).
5. Directly calls GitHub Releases API (or triggers GitHub Actions workflow) to publish the release live worldwide.

### 4.2 Updating the App (User / CLI)
To update the app to the latest GitHub release via terminal in one step:

```bash
npm run update:self
```

**What this single command executes automatically:**
1. Checks GitHub Releases for newer version tags.
2. Captures an automated rollback snapshot into the 3-version ring buffer.
3. Downloads `app.zip` directly into temporary storage.
4. Automatically unpacks and updates files in place.
5. Executes any new SQLite database migrations via `autoUpgradeIfRequired()`.
6. Confirms update completion.

---

## 5. 3-Version Rollback Ring Buffer

Starting from Version 4, Fanfiction Manager protects users against regressions or unwanted changes by maintaining an automated **3-version rollback ring buffer**.

### How It Works
1. **Pre-Update Snapshot**: Immediately prior to applying any update (via desktop updater, `npm run update:self`, or silent mobile OTA), [`src/updater/rollback-manager.js`](./src/updater/rollback-manager.js) takes a full atomic snapshot of:
   - Application runtime files (`package.json`, `main.js`, `src/`)
   - SQLite database (`v4_data/fanfiction.db`)
   - Manifest metadata (`id`, `version`, `created_at`, `timestamp`)
2. **Ring Buffer Pruning**: The buffer holds a maximum of **3 snapshots** in `v4_data/snapshots/`. When a 4th snapshot is recorded, the oldest snapshot is automatically pruned.
3. **100% Reversible**: Rolling back restores the exact code and database state from that release.

### How to Rollback

#### Option A: In the Modern UI
1. Click the **`⏪ Rollback`** chip in the top header.
2. The modal displays up to 3 prior version snapshots with their save timestamps.
3. Click **Rollback** on the version you wish to restore.
4. The application restores all files and database state, and reloads seamlessly.

#### Option B: Via Command Line (CLI)
```bash
# List available snapshots (up to 3)
npm run rollback:list

# Rollback to immediately prior release (1-step)
npm run rollback

# Or rollback to a specific snapshot ID
node src/updater/rollback.js v4.0.0_1740000000000
```



