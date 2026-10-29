# Version 4 Implementation Roadmap

## Overview of Development Phases

```
[ Phase 1: Foundation & Migrator ] ──▶ [ Phase 2: Hybrid Scraper Core ] ──▶ [ Phase 3: Modern UI & Reader ]
                                                                                       │
[ Phase 5: Multi-Platform CI/CD ] ◀── [ Phase 4: Extended Features & Rules ] ◀─────────┘
        │
        ▼
[ Phase 6: Local Switchover & Legacy Archival ]
```

---

### Phase 1: Foundation & Data Migration
- [x] Initialize Tauri 2.0 multi-platform workspace (`src-tauri` with Rust, `frontend` with Vue 3 / Vite / TypeScript / Tailwind CSS).
- [x] Configure SQLite with `rusqlite` / `sqlx` and implement the schema defined in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- [x] Develop automated **Migration Script**:
  - Scans `../config/novels.json`, `../config/rules.json`, and `../data/novels/`.
  - Converts existing novels and downloaded chapters into SQLite records.
  - Copies covers into the new sandboxed asset directory.
  - Ensures zero data loss for existing reading libraries.

### Phase 2: Hybrid Scraping Pipeline
- [ ] Implement Rust HTTP client with cookie jar and browser impersonation headers.
- [ ] Implement fast-path HTML parsing (Tier 1) for rapid batch chapter downloading.
- [ ] Implement native WebView fallback (Tier 2 & 3) with dynamic cookie sync.
- [ ] Port and validate existing rules from `rules.json` (Fanfiction.net, WebNovel, RoyalRoad, AO3, Wattpad, ScribbleHub, etc.).

### Phase 3: Modern Responsive UI & Reading Mode
- [ ] Build responsive UI layouts (Desktop multi-column + Mobile bottom navigation & gesture drawer).
- [ ] Develop modern Reader Mode:
  - Continuous vertical reading and paginated reader mode.
  - Themes: Light, Sepia, Slate Dark, OLED True Black.
  - Reading progress auto-save (chapter position and scroll percentage).
  - Customizable typography (font family, font size, line spacing, margins).
- [ ] Build Downloader Queue manager with pause/resume and rate throttling controls.

### Phase 4: Extended Features & Rule Studio
- [ ] Implement **Model Context Protocol (MCP) Server** (`stdio` and `SSE` transport) as specified in [`MCP_SPECIFICATION.md`](./MCP_SPECIFICATION.md).
- [ ] Implement AI rule generation tools: `inspect_webpage`, `analyze_novel_structure`, `test_rule_execution`, `save_site_rule`.
- [ ] Built-in **EPUB Exporter**: Export downloaded fanfiction to `.epub` format with metadata and cover image.
- [ ] Rule Studio / Tester Workbench: Real-time visual testing tool to author and debug site extraction rules.
- [ ] Remote Rule Sync: Auto-update rule definitions from GitHub releases.
- [ ] Text-to-Speech (TTS) integration using platform-native speech synthesis APIs.

### Phase 5: Multi-Platform Build & CI/CD
- [ ] Configure Android target (Android Studio SDK, NDK, Gradle build scripts).
- [ ] Configure iOS target (Xcode project, provisioning, WKWebView configuration).
- [ ] Configure Windows, macOS, and Linux desktop packaging targets.
- [ ] Set up GitHub Actions workflow for automated multi-platform builds and release artifacts.

### Phase 6: Local Switchover & Legacy Archival (Developer Dedicated)
- [x] Implement automated promotion tool [`scripts/switchover-to-root.js`](./scripts/switchover-to-root.js).
- [x] Provide `--dry-run` safe verification command.
- [ ] Once Version 4 implementation is finalized by the user:
  - Run `npm run switchover` inside `Version 4/`.
  - Automatically moves all legacy v3 files (`main.js`, `index.html`, `config/`, `data/`, `js/`, `css/`) into `./Legacy/`.
  - Promotes `Version 4/` components directly to project root.
  - Cleans up the empty `Version 4/` directory.

