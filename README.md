# LightNovel-Manager
Light-novel manager/downloader

Current Status: APLHA

- Add new `Novel`
- Download `Novel`
- Rules included
  - `Fanfiction.net`
  - `Webnovel.com`
- Rules editor
- Novel `Reading Mode`
- Novel details editor

### Known Issues / Not Implemented Yet

- No `Update Novel` option yet -> WIP
- Multiple utility `buttons`'s functionality not implemented.
- Download next `Chapter` using `nextURL` when `ChapterCount` is <= 0. -> STALE
  - Although, the case is possible, but currently, no known website requires this.
    - Further testing required.
  - Possibility of infinite loop, in-case `nextURL` always comes up non-empty.
- More testing required for downloading from other websites.

### Download Steps

- Download `electron` from [this](https://github.com/electron/electron/releases) page
    - Example, for window 64bit, you need to download `electron-[version]-win32-x64.zip`
- Extract the `electron` zip file to empty directory
- Delete `default_app.asar` file inside `.../[electron-folder]/resources`
- Create new directory `app` in `.../[electron-folder]/resources`
- Paste the contents of this repo into `app` folder
- Now run `electron` executable
- Done