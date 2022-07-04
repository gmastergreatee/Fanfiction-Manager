# LightNovel-Manager
Light-novel manager/downloader/reader

<img src="https://github.com/gmastergreatee/LightNovel-Manager/raw/master/pic1.png">

Provides extreme flexibility with the help of `Rule` system to `power-users`* in downloading, tracking-status & reading novels from __ANY__ site they want.

`Novice-users`** may only download `Novels` from site whose `Rule` is included.

Current Status: __BETA__

- Add new `Novel`
- Download `Novel`
- Update `Novel`
- Rules included for sites
  - `fanfiction.net`
  - `webnovel.com`
  - `novelupdates.com`
    - need to add rules related to external linked sites
    - out of scope
  - `comrademao.com`
  - `archiveofourown.org`
- `Rules Editor`
- Novel `Reading Mode`
- Novel `Details Editor`

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
- [NYI] Rules export option.
- [NYI] Download next `Chapter` using `nextURL` when `ChapterCount` is <= 0
  - Although, the case is possible, but currently, no known website requires this.
    - Further testing required.
  - Possibility of infinite loop, in-case `nextURL` always comes up non-empty.
- [WIP] More testing required for downloading from other websites.

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
    'retry': 1,
    'nextURL': '', // the URL to redirect to
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
- Make sure `Title`/`title` for `Novel`/`Chapter` is actually the `innerText`, __not__ `innerHTML`
- In `Chapter`'s `content` field, HTML is to be used.
  - Make sure all anchor tags in HTML are marked with `target="_blank"`
    - This will open the link in external browser whenever clicked upon

---

\* persons with javascript & DOM knowledge

\*\* persons with no programming knowledge whatsoever

[WIP] Work in progress

[NYI] Not yet implemented
