# Version 4 Architecture Specification

## 1. System Topology

```
+-------------------------------------------------------------------------------+
|                       UI Layer (Vue 3 + Tailwind CSS)                         |
|   [Library View]   [Reader Mode]   [Rule Studio]   [Download Queue Manager]   |
+-------------------------------------------------------------------------------+
                                        ▲
                                        │ Typed IPC Commands / Events
                                        ▼
+-------------------------------------------------------------------------------+
|                           Tauri 2.0 Rust Core Engine                          |
|                                                                               |
|  +---------------------+  +------------------------+  +--------------------+  |
|  |   Database Engine   |  |     Network Service    |  |  Rule Interpreter  |  |
|  |     (SQLite FTS5)   |  |  (reqwest + TLS pool)  |  |  (DOM + QuickJS)   |  |
|  +---------------------+  +------------------------+  +--------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                     Hybrid 3-Tier Scraping Pipeline                     |  |
|  |  Tier 1: Headless HTTP  ->  Tier 2: Offscreen WV  ->  Tier 3: Captcha UI |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +---------------------+  +------------------------+  +--------------------+  |
|  |   MCP Core Server   |  |     EPUB Exporter      |  |  Auto-Updater /    |  |
|  | (stdio / SSE JSON)  |  |   (Packaged e-books)   |  |   Rule Sync        |  |
|  +---------------------+  +------------------------+  +--------------------+  |
+-------------------------------------------------------------------------------+
                                        ▲
                                        │ Native OS Bindings
                                        ▼
+-------------------------------------------------------------------------------+
|      Windows (WebView2) | Linux (WebKitGTK) | macOS & iOS (WebKit) | Android  |
+-------------------------------------------------------------------------------+
```

---

## 2. SQLite Database Schema

The SQLite database (`fanfiction.db`) replaces all legacy JSON files:

```sql
-- Novel metadata
CREATE TABLE novels (
    id TEXT PRIMARY KEY,                       -- UUID
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    cover_local_path TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    source_url TEXT NOT NULL UNIQUE,
    rule_guid TEXT,
    total_chapters INTEGER DEFAULT 0,
    downloaded_chapters INTEGER DEFAULT 0,
    check_updates BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chapters
CREATE TABLE chapters (
    id TEXT PRIMARY KEY,                       -- UUID
    novel_id TEXT NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_index INTEGER NOT NULL,            -- 0-based or 1-based order
    title TEXT NOT NULL,
    content_html MEDIUMTEXT,
    source_url TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    is_downloaded BOOLEAN DEFAULT 0,
    downloaded_at DATETIME,
    UNIQUE(novel_id, chapter_index)
);

-- Reading progress
CREATE TABLE reading_progress (
    novel_id TEXT PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
    last_chapter_index INTEGER DEFAULT 0,
    scroll_percentage REAL DEFAULT 0.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Site rules
CREATE TABLE rules (
    guid TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    url_regex TEXT NOT NULL,
    parser_type TEXT DEFAULT 'headless',       -- 'headless' | 'webview'
    definition_json TEXT NOT NULL,             -- JSON containing selectors / code
    version INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Full-Text Search (FTS5) for chapters and novel titles
CREATE VIRTUAL TABLE fts_novel_content USING fts5(
    novel_id UNINDEXED,
    chapter_index UNINDEXED,
    chapter_title,
    chapter_text_content
);
```

---

## 3. Scraping Engine Strategy

### Tier 1: Fast-Path Headless HTTP Fetch
- **When**: Used for 80%+ of websites that do not rely on aggressive Cloudflare verification or client-side JavaScript rendering.
- **Implementation**:
  - Rust uses `reqwest` with preconfigured browser headers (User-Agent, Accept-Encoding, Sec-CH-UA).
  - DOM parsed with fast selector library (`scraper` / `kuchiki` in Rust or `cheerio` in a web worker).
  - Multi-threaded worker pool can fetch 10-20 chapters simultaneously while respecting rate limits.

### Tier 2: Headless Native WebView
- **When**: Single-page applications (SPAs) or sites requiring JavaScript hydration to render chapter text.
- **Implementation**:
  - Native WebView runs offscreen.
  - Injects scraping script when DOM is ready and collects extracted JSON.

### Tier 3: In-App Interactive Captcha Sheet
- **When**: Cloudflare Turnstile, hCaptcha, or 403 Forbidden is returned.
- **Implementation**:
  - Surfaces a native modal sheet displaying the live webview.
  - User solves the challenge (or automated clicker runs).
  - Cookies (`cf_clearance`, etc.) are synchronized back to the Rust HTTP client session.
  - Headless downloading automatically resumes.

---

## 4. Model Context Protocol (MCP) Integration

Fanfiction Manager Version 4 functions as an MCP Server (over `stdio` and local `SSE` transport), enabling external AI agents (Claude, Antigravity, local LLMs) or an embedded in-app AI assistant to:
- Inspect target novel websites (`inspect_webpage`).
- Heuristically detect TOC and chapter patterns (`analyze_novel_structure`).
- Test candidate rule extraction scripts in an isolated sandbox (`test_rule_execution`).
- Save validated rules into the SQLite database (`save_site_rule`).

See [`MCP_SPECIFICATION.md`](./MCP_SPECIFICATION.md) for full endpoint, tool, schema, and prompt documentation.

---

## 5. Unified 4-Mode Rule Studio Architecture

To enable users on any device—mobile touchscreen or desktop workstation—to author, debug, and share scraping rules effortlessly:

| Mode | Target Platforms | Description & Workflow |
| :--- | :--- | :--- |
| **Mode 1: Visual "Tap-to-Select" Picker** | **All Platforms** (Win, Mac, Linux, Android, iOS) | Injects an interactive touch/click element highlighter into the live web page. Users simply tap Title, Cover, Chapter Link, and Content. Automatically computes optimal CSS selectors and compiles them into a verified rule without any coding. |
| **Mode 2: Conversational AI Assistant (MCP)** | **All Platforms** (Win, Mac, Linux, Android, iOS) | Users paste a novel URL; the built-in MCP engine inspects the DOM, synthesizes candidate extraction logic, tests it in a sandbox, and displays a 1-tap confirmation card. |
| **Mode 3: Community Rule Hub & QR Sync** | **All Platforms** (Win, Mac, Linux, Android, iOS) | 1-click install of verified site rules from the remote repository. Power users can export rules as QR codes or shareable JSON links to sync directly to phones. |
| **Mode 4: Advanced Code Editor & Native DevTools** | **Windows, Linux, macOS (Desktop Only)** | Full developer workbench featuring Monaco/CodeMirror JavaScript editor, live regex tester, console log stream, and native Chromium/WebKit F12 DevTools integration (`webContents.openDevTools()`). |

---

## 6. Modern Native UI Design System & Platform Adaptability

Version 4 replaces legacy utilitarian styling with an adaptive native UI engine:

### 6.1 Platform-Specific Native Themes (`src/ui/styles/native-themes.css`)
- **Windows 11 Fluent Design (`data-platform="windows"`)**:
  - `Segoe UI Variable` typography.
  - Mica & Acrylic glassmorphic panels (`backdrop-filter: blur(30px) saturate(125%)`).
  - Subtle borders and 8px card corner radii.
- **Apple macOS & iOS (`data-platform="apple"`)**:
  - `SF Pro` system font.
  - Frosted glass blur (`backdrop-filter: blur(25px) saturate(190%)`).
  - Cupertino-style pill buttons (`border-radius: 9999px`) and mobile bottom navigation tab bar.
- **Android Material Design 3 (`data-platform="android"`)**:
  - `Roboto` font.
  - MD3 elevated rounded cards (28px corner radius), pill chips, and floating action buttons.
- **Linux Desktop GNOME Libadwaita & KDE Plasma (`data-platform="linux"`)**:
  - `Cantarell`, `Ubuntu`, `Inter`, `Noto Sans` typography.
  - Libadwaita dark surfaces (`#242424` / `#2e2e2e`) with native CSD header bars.
  - GNOME accent blue (`#3584e4`) action buttons and 9px card corner radii.
  - Integrated with FreeDesktop system dark/light mode portals (`org.freedesktop.appearance.color-scheme`).

### 6.2 Distraction-Free Reader Mode
- Reader typography engine: Serif (`Georgia`, `Merriweather`, `Charter`) or Sans-serif (`SF Pro`, `Inter`).
- 4 Reading Themes:
  1. **Slate Dark**: Low-contrast night mode.
  2. **OLED Pure Black**: 100% black `#000000` for zero battery consumption on mobile OLED screens.
  3. **Warm Sepia**: Book-paper tint for eye comfort.
  4. **Clean Light**: High contrast day mode.
- Auto-hiding HUD: Controls glide away while scrolling and reappear on tap/click.

### 6.3 Live Theme Studio & Cross-Device Color Sharing Engine
Implemented in [`src/ui/theme-studio.js`](./src/ui/theme-studio.js):
- **Universal Platform Theme Switching**:
  - **Mobile (Android & iOS)**: Users can freely toggle between Android Material 3 and iOS Cupertino (e.g. run iOS Cupertino on an Android phone or Material 3 on an iPhone).
  - **Desktop (Windows, Linux, macOS)**: Users can select *any* platform theme (Windows 11 Fluent, macOS, Linux GNOME, Android, or iOS) on any desktop operating system.
- **Real-Time Live Color Customizer**:
  - Users can adjust Accent, Background, Card Surface, Text, and Border colors with immediate live preview via CSS Variable injection.
- **Theme Persistence**:
  - Save named custom color combinations into local configuration and SQLite.
- **Theme Sharing & QR Code Protocol (`ffm-theme-v4`)**:
  - Export custom color schemes as shareable JSON or QR codes to sync themes between desktop and phone, mirroring the site rule sharing system.





