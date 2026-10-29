# Fanfiction Manager — Version 4 (Next-Gen)

Welcome to **Fanfiction Manager Version 4**. This folder houses the modernized, 5-platform edition of Fanfiction Manager designed for:
- **Desktop**: Windows (x64/ARM64), macOS (Apple Silicon/Intel), Linux (x64/ARM64)
- **Mobile**: Android (Phones & Tablets), iOS (iPhone & iPad)

---

## Key Technological Advancements over Version 3

1. **Cross-Platform Core (Tauri 2.0 + Rust)**
   - Replaces heavy, desktop-only Electron architecture.
   - Generates native binaries for Windows (`.exe`), Linux (`.deb`/`.AppImage`), macOS (`.dmg`), Android (`.apk`), and iOS (`.ipa`).
   - Reduces memory usage from ~300MB+ down to ~30MB.
   - Cuts binary distribution size from ~150MB down to ~15MB.

2. **Hybrid 3-Tier Scraping Pipeline**
   - **Tier 1 (Fast-Path Headless Fetch)**: Direct HTTP requests through Rust `reqwest` + fast HTML parser. Downloads 50–100 chapters per second without spawning heavy web browser views.
   - **Tier 2 (Headless Native WebView)**: Offscreen WebView fallback for dynamic, single-page application (SPA) websites.
   - **Tier 3 (Interactive Captcha Sheet)**: Native bottom sheet / modal for solving Cloudflare Turnstile or manual captchas when required, saving session cookies for subsequent headless requests.

3. **Enterprise-Grade Database (Embedded SQLite)**
   - Replaces monolithic, crash-prone `config/novels.json` (1.3MB+) and loose JSON files.
   - Full ACID transaction safety, instant library queries, and full-text search (FTS5).
   - Seamless automatic migration from Version 3 legacy data.

4. **Modern Responsive UI (Vue 3 + Vite + Tailwind CSS / Shadcn)**
   - Adaptive layouts for desktop monitors, tablets, and smartphones.
   - Distraction-free reader with customizable typography, dark/sepia/OLED themes, and reading progress tracking.
   - Built-in **EPUB Exporter** for reading on e-ink devices (Kindle, Kobo) or Apple Books.

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Detailed technical architecture, scraper tiers, and SQLite database schema.
- [`ROADMAP.md`](./ROADMAP.md) — Step-by-step phased development plan and multi-platform build setup.

