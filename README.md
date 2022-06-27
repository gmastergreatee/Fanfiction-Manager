# LightNovel-Manager
Light-novel manager/downloader/reader

Provides extreme flexibility with the help of `Rule` system to `power-users`* in downloading, tracking-status & reading novels from any site they want from.

`Novice-users`** may only download `Novels` from site whose `Rule` is included.

Current Status: __APLHA__

- Add new `Novel`
- Download `Novel`
- Rules included for sites
  - `Fanfiction.net`
  - `Webnovel.com`
- `Rules Editor`
- Novel `Reading Mode`
- Novel `Details Editor`

---

### Known Issues / Not Implemented Yet
- [WIP] No `Update Novel` option yet
- [NYI] Multiple utility `buttons`'s do not work -> NYI
- [NYI] Download next `Chapter` using `nextURL` when `ChapterCount` is <= 0
  - Although, the case is possible, but currently, no known website requires this.
    - Further testing required.
  - Possibility of infinite loop, in-case `nextURL` always comes up non-empty.
- More testing required for downloading from other websites.

---

### Download Steps

- Download `electron` from [this](https://github.com/electron/electron/releases) page
    - Example, for window 64bit, you need to download `electron-[version]-win32-x64.zip`
- Extract the `electron` zip file to empty directory
- Delete `default_app.asar` file inside `.../[electron-folder]/resources`
- Create new directory `app` in `.../[electron-folder]/resources`
- Paste the contents of this repo into `app` folder
- Now run `electron` executable
- Done

### Rule Generation
#### Script details -
- PageTypeScript
  - checks if page is supported by current rule
  - if supported, `return 0;`
  - for captcha page
    - `return -1` for Auto-Captcha
    - `return -2` for Manual-Captcha
  - returning anything else will mean
    - page not supported by rule
- TOCScript
  - Table Of Contents
  - gets `Novel` info from page
  - for return-type, check in-app hints
- ChapterSipt
  - gets the `Chapter` data from page
  - for return-type, check in-app hints
#### Tips
- Make sure no infinite loops are present in any `scripts`.
  - Use `Ctrl+Shift+R` to reload application, in-case UI gets stuck or high CPU usage
- Use `Tester` tab to load `TestURL` and execute particular scripts on them
- If want to wait(for some seconds) in script, use -
  - `await sleep(ms);`
    - where `ms` is in milliseconds
    - simple `Promise` based in-built `async/await` function

---

\* persons with somewhat javascript & DOM knowledge

\*\* persons with no programming knowledge whatsoever

[WIP] Work in progress

[NYI] Not yet implemented