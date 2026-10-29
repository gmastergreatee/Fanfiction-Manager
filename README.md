# Fanfiction-Manager

`NOTE : This program is for personal use only. Please do not use it to share/plagiarize content.`

Fanfiction manager/downloader/reader

<img src="https://github.com/gmastergreatee/Fanfiction-Manager/raw/master/pic_dark_2022-07-15.png">
<img src="https://github.com/gmastergreatee/Fanfiction-Manager/raw/master/pic_light_2022-07-15.png">

Provides extreme flexibility with the help of `Rule` system to `power-users`* in downloading, tracking-status & reading novels from __ANY__ site they want.

`Novice-users`** may only download `Novels` from site whose `Rule` is included.

`Feel free to request for more website inclusions via issues`

Current Status: **v3.2.0 (Stable Beta)** | **v4.0.0 (Next-Gen Alpha in Progress in [`Version 4/`](./Version%204/))**

---

## 🚀 Upcoming Version 4: Highlights & Modernization

The next major generation of Fanfiction Manager is currently being built in the [`Version 4/`](./Version%204/) directory. When released, existing v3 installations will automatically upgrade without any data loss.

### 🌟 Key Highlights of Version 4:
1. **5 Platforms Supported**:
   - **Desktop**: Windows 11 / 10, macOS (Apple Silicon & Intel), and Linux (GNOME Libadwaita / KDE Plasma).
   - **Mobile**: Android (Phones & Tablets) and iOS (iPhone & iPad).
2. **Zero-Loss Auto-Upgrade Engine**:
   - Automatically migrates existing novels, 6,800+ downloaded chapters, site rules, reading history, and covers into embedded SQLite in ~11 seconds.
3. **Multi-Mode Rule Studio (Mobile & Desktop)**:
   - **Visual Tap-to-Select Picker**: Create scraping rules on phones, tablets, or desktop by simply tapping elements on web pages — no DevTools required!
   - **AI Assistant (Model Context Protocol)**: In-app MCP server (`stdio` / `SSE`) enables Claude, Antigravity, and AI agents to autonomously inspect pages, synthesize rules, and test extraction.
   - **Community Rule Hub & QR Sync**: 1-click install verified scraping rules; scan QR codes to instantly transfer rules across devices.
   - **Desktop DevTools**: Native F12 Chrome/WebKit Inspector on Windows, Linux, and macOS for power users.
4. **Adaptive Native UI & Live Theme Studio**:
   - Native platform design language: **Windows 11 Fluent** (Mica/Acrylic), **Apple Cupertino** (macOS/iOS frosted glass), **Android Material 3**, and **Linux GNOME Libadwaita**.
   - **Theme Swapping**: Mobile users can toggle between Android MD3 and iOS Cupertino styles. Desktop users can freely select any platform theme.
   - **Live Color Customizer & Sharing**: Real-time CSS color adjustments, custom theme persistence, and sharing via JSON or QR code (`ffm-theme-v4`).
5. **Silent Store-Bypass Updates (Android & iOS)**:
   - **100% Silent OTA Updates**: Web assets hot-update over the air (`mobile-bundle.zip`) without App Store or Play Store review delays or manual clicks.
   - **Unattended Native APK Installer**: Android 12+ background installation via `PackageInstaller.Session`.
6. **3-Version Rollback Ring Buffer**:
   - Automatic pre-update snapshot safeguard. Revert code and database up to 3 previous releases directly from the UI header (`⏪ Rollback`) or CLI (`npm run rollback`).
7. **High-Performance Architecture**:
   - **Embedded SQLite (ACID)**: Replaces monolithic 1.3MB `novels.json` and 6,800+ loose files with instant queries.
   - **Hybrid 3-Tier Scraper**: High-speed headless fetching (50-100 ch/sec) with fallback to headless webview and interactive captcha resolution.
   - **Distraction-Free Reader**: OLED pure black, Slate dark, warm sepia, and clean light modes with auto-hiding floating HUD.

> 📖 **Read the Full Version 4 Documentation:**
> - [Version 4 Readme](./Version%204/README.md)
> - [Auto-Upgrade & Release Guide](./Version%204/AUTO_UPGRADE_GUIDE.md)
> - [Technical Architecture](./Version%204/ARCHITECTURE.md)
> - [MCP AI Rule Specification](./Version%204/MCP_SPECIFICATION.md)
> - [Roadmap](./Version%204/ROADMAP.md)

---

### Legacy v3 Features

- Add new `Novel`
- Download `Novel`
- Update `Novel`
- Rules included for sites
  - `fanfiction.net`
  - `scribblehub.com`
  - `webnovel.com`
  - `novelupdates.com`
    - need to add rules related to external linked sites
    - out of scope
  - `comrademao.com`
  - `archiveofourown.org`
  - `royalroad.com`
  - `wattpad.com`
  - `mtlnovel.com`
  - and more... check `Rules` tab in-app to get the full list
- `Rules Editor`
- Novel `Reading Mode`
- Novel `Details Editor`
- App auto-updater

---

### Shortcuts

Global

| Keys     | Function   |
| -------- | ---------- |
| Ctrl + F | Fullscreen |

Reading Mode

| Keys     | Function       |
| -------- | -------------- |
| Ctrl + G | Go to Chapter  |
| Ctrl + H | Toggle Sidebar |

---

### Known Issues
- [WIP] No images support within chapters.
- [NYI] Rules export option.
- [NYI] Download next `Chapter` using `nextURL` when `ChapterCount` is <= 0
  - Although, the case is possible, but currently, no known website requires this.
    - Further testing required.
  - Possibility of infinite loop, in-case `nextURL` always comes up non-empty.
- [WIP] More testing required for downloading from other websites.

---

### Download

  > Rules may be outdated therefore update rules by clicking the `Update Rules` button on the top-right of `Rules` tab. Rules may be updated at random on the server, therefore do this regularly before adding/downloading/updating a novel.

For windows 64bit, download [here](https://github.com/gmastergreatee/Fanfiction-Manager/releases/download/beta_3.0.1/Fanfiction-Manager_win_x86-64_2024-09-09_0213.zip)

For others -

- Download `electron` from [this](https://github.com/electron/electron/releases/tag/v31.5.0) page
    - Example, for windows 64bit, you need to download `electron-v31.5.0-win32-x64.zip`
- Extract the `electron` zip file to an empty directory
- Delete `default_app.asar` file present in `.../[electron-dir]/resources`
- Create new directory `app` in `.../[electron-folder]/resources`
- Extract the contents of [this](https://github.com/gmastergreatee/Fanfiction-Manager/releases/download/beta_3.2.0/app.zip) zip file into `.../[electron-dir]/resources/app` directory
- Now run `electron` executable
- Done

### Rule Generation
#### Script details -
- PageTypeScript
  - checks if page is supported by current rule
  - if supported, `return 0;`
  - for captcha page
    - `return -1` for Auto-Captcha
      - meaning page will auto-redirect, just need to wait for it
    - `return -2` for Manual-Captcha
      - meaning there's a chance user needs to use the renderer to proceed from the page
      - otherwise similar to `Auto-Captcha`, if auto-redirects
  - returning anything else will mean
    - page not supported by rule
- TOCScript
  - Table Of Contents
  - gets `Novel` info from page
  - return type -
    ```JSON
    {
      "CoverURL": "",              // may be empty
      "Title": "novel name here",
      "Summary": "",               // may be empty
      "ChapterCount": 1,           // chapter count here
      "ChapterURLs": [             // list of chapter-URLs
          "",                      // must contain atleast the first chapter URL
          "",
      ],
    }
    ```
- ChapterScript
  - gets the `Chapter` data from page
  - return type -
    ```JSON
    [
      {
        "title": "",    // title of chapter
        "content": "",  // content
        "nextURL": ""   // when "ChapterCount" <= 0 & "nextURL" always comes non-empty
                        // will loop infinitely unless something else(javascript) breaks
      },
    ]
    ```
  - maybe one or more chapters at once, therefore an `Array`
#### Tips
- All scripts support custom-redirection if they return JSON in the following format -
  ```JSON
  {
    "retry": 1,
    "nextURL": "", // the URL to redirect to
  }
  ```

- Make sure no infinite loops are present in any `scripts`.
  - Use `Ctrl+Shift+R` to reload application, in-case UI gets stuck or high CPU usage
- Use `Tester` tab to load `TestURL` and execute particular scripts on them
- Want to wait(for some seconds) in script, use -
  - `await sleep(ms);`
    - where `ms` is in milliseconds
    - simple `Promise` based in-built `async/await` function
- Want to inject jQuery in script, use -
  - `injectJquery();`
- Want to decode html-codes like `&amp;`, `&larr;`, ... to their actual character in script, use -
  - `htmlDecode(input);`
    - where `input` is a string
  - similarly `htmlEncode(input)` is also there
- Make sure `Title`/`title` for `Novel`/`Chapter` is actually the `innerText`, __not__ `innerHTML`
- In `Chapter`'s `content` field, HTML is to be used.
  - Make sure all anchor tags in HTML are marked with `target="_blank"`
    - This will open the link in external browser whenever clicked upon

---

\* persons with javascript & DOM knowledge

\*\* persons with no programming knowledge whatsoever

[WIP] Work in progress

[NYI] Not yet implemented
