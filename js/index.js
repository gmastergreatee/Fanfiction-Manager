let appName = "Novel Downloader v3";
let debugTestMode = false;
let debugTestIndex = 0;
let debugTestVals = [
  {
    rule_name: "Fanfiction.net",
    test_url:
      "https://www.fanfiction.net/s/13861458/1/Reincarnation-Of-Overlord",
    url_regex:
      "(?:https://)*(?:www|m).fanfiction.net/([a-z]+)/([0-9]+)/([0-9]+)/([a-zA-Z0-9-]+)",
    page_type_code: `if (document.querySelector('#cf-wrapper #cookie-alert'))
    return -2;
if (document.querySelector('.cf-browser-verification.cf-im-under-attack'))
    return -1;
if (document.querySelector('#chap_select'))
    return 0;
return -3;`,
    toc_code: `let retMe = {
  'Title': 'novel name here',
  'ChapterCount': 1,
  'ChapterURLs': [],
};

let chaps = [];
Array.from($('#chap_select').first().find('option')).forEach(el=>{
    chaps.push(el.value);
});

let matches = new RegExp('(?:https://)*(?:www|m).fanfiction.net/([a-z]+)/([0-9]+)/([0-9]+)/([a-zA-Z0-9-]+)').exec(window.location.href);
chaps.forEach(el => {
    retMe.ChapterURLs.push([window.location.origin, matches[1], matches[2], el, matches[4]].join('/'));
});

retMe.ChapterCount = chaps.length;
retMe.Title = $('#profile_top b').html();

return retMe;`,
    chapter_code: `let retMe = [
  {
    "title": "",    // title of chapter
    "content": $('.storytext').html(),  // content
    "nextURL": ""
  },
];

let chap_select = document.getElementById('chap_select');
if (chap_select != null) {
    retMe[0].title = chap_select.options[chap_select.selectedIndex].text;
}

return retMe;`,
  },
];

let default_TOC_Code = `let retMe = {
  'Title': 'novel name here',
  'Summary': '',
  'ChapterCount': 1, // chapter count here
  'ChapterURLs': [   // list of chapter-URLs
      '', // must contain atleast the first chapter URL
      '',
  ],
};

return retMe;`;

let default_Chapter_Code = `let retMe = [
  {
    "title": "",    // title of chapter
    "content": "",  // content
    "nextURL": ""   // when "ChapterCount" <= 0 & "nextURL" always comes non-empty
                    // will loop infinitely unless something else(javascript) breaks
  },
];

return retMe;`;

let dummyPageUrl = "/dummy.html";

const simpleEvent = function (context) {
  if (context === void 0) {
    context = null;
  }
  var cbs = [];
  return {
    addListener: function (cb) {
      cbs.push(cb);
    },
    removeListener: function (cb) {
      var i = cbs.indexOf(cb);
      cbs.splice(i, 1);
    },
    trigger: function () {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return cbs.forEach(function (cb) {
        return cb.apply(context, args);
      });
    },
    clearAllListeners: function () {
      cbs.splice(0);
    },
  };
};

let onMainWebViewLoadedEvent = simpleEvent();

app = new Vue({
  el: "#main",
  mounted() {
    if (debugTestMode) {
      this.resetTestFields();
    }

    loadAllConfigs();
    this.mainWebView = document.getElementById("mainWebView");
    this.console = document.getElementById("web-console");

    this.mainWebView.addEventListener("did-start-loading", () => {
      if (!this.iframe_url.endsWith(dummyPageUrl)) {
        this.iframe_working = true;
        log("Loading url", this.iframe_url);
      }
    });
    this.mainWebView.addEventListener("did-stop-loading", () => {
      if (!this.mainWebView.getURL().endsWith(dummyPageUrl)) {
        this.iframe_working = false;
        log("Url loaded", this.mainWebView.getURL());
      }
      onMainWebViewLoadedEvent.trigger();
    });
  },
  data() {
    return {
      darkMode: true,

      rules: [],
      loading_rules: true,

      novels: [],
      loading_novels: true,

      //......... Main variables
      mainWebView: null,
      console: null,
      tabs: ["Library", "Rules", "Tester"],
      activeTab: 0,

      showWebPage: true,
      showTestResults: true,
      showConsole: true,

      //......... Add Novel

      add_novel_url: "",

      //......... tester related

      test_rule_guid: "",
      test_url: "",
      test_rule_name: "",
      test_url_regex: "",
      test_pagetype_code: "",
      test_toc_code: default_TOC_Code,
      test_novel_toc_data: null,
      test_chapter_code: default_Chapter_Code,

      test_result_page_type: "UNKNOWN",
      test_result_content: "",

      //.........

      iframe_working: false,
      iframe_url: dummyPageUrl,
      status: "NA",
    };
  },
  methods: {
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
    },
    isTabActive(tabName = "") {
      return this.tabs[this.activeTab] == tabName;
    },
    setActiveTab(tabIndex = 0) {
      if (this.activeTab != tabIndex) {
        this.activeTab = tabIndex;
        switch (this.activeTab) {
          case 0:
            this.showWebPage = false;
            break;
          case 2:
            this.showWebPage = true;
            this.showTestResults = true;
            break;
          default:
            break;
        }
      }
    },
    toggleRenderer() {
      this.showWebPage = !this.showWebPage;
    },
    clearWebConsole() {
      this.console.textContent = "";
    },
    openRendererDevTools() {
      try {
        if (!this.mainWebView.isDevToolsOpened()) {
          this.mainWebView.openDevTools();
        } else {
          this.mainWebView.closeDevTools();
        }
      } catch {
        window.electronAPI.msgBox(
          "Please load an URL before opening DevTools",
          appName
        );
      }
    },
    toggleWebConsole() {
      this.showConsole = !this.showConsole;
    },
    getEvaluateJavascriptCode(script = "") {
      return "(function(){" + script + "})()";
    },
    //#region Rules Related
    toggleTestResults() {
      this.showTestResults = !this.showTestResults;
    },
    resetTestFields(clearGUID = false) {
      if (clearGUID) {
        this.test_rule_guid = "";
      }

      this.test_novel_toc_data = null;

      if (!debugTestMode) {
        let r = {
          rule_name: "",
          url_regex: "",
          pagetype_code: "",
          toc_code: default_TOC_Code,
          chapter_code: default_Chapter_Code,
        };
        if (this.test_rule_guid) {
          let t_rule = this.rules.find((i) => i.guid == this.test_rule_guid);
          if (t_rule) {
            r = {
              rule_name: t_rule.rule_name,
              url_regex: t_rule.url_regex,
              pagetype_code: t_rule.pagetype_code,
              toc_code: t_rule.toc_code,
              chapter_code: t_rule.chapter_code,
            };
          }
        }
        this.test_rule_name = r.rule_name;
        this.test_url_regex = r.url_regex;
        // this.test_url = "";
        this.test_pagetype_code = r.pagetype_code;
        this.test_toc_code = r.toc_code;
        this.test_chapter_code = r.chapter_code;
      } else {
        let testRule = debugTestVals[debugTestIndex];
        this.test_rule_name = testRule.rule_name;
        this.test_url_regex = testRule.url_regex;
        this.test_url = testRule.test_url;
        this.test_pagetype_code = testRule.page_type_code;
        this.test_toc_code = testRule.toc_code;
        this.test_chapter_code = testRule.chapter_code;
      }
      this.test_result_page_type = "UNKNOWN";
      this.test_result_content = "";

      this.iframe_url = dummyPageUrl;
      this.iframe_working = false;
      this.status = "NA";
    },
    loadTestURL() {
      if (this.test_url.trim() && this.iframe_working == false) {
        try {
          new URL(this.test_url.trim());
        } catch {
          msgBox("Please enter a valid URL");
          return;
        }

        onMainWebViewLoadedEvent.clearAllListeners();
        onMainWebViewLoadedEvent.addListener(this.runTestPageTypeScript);
        if (this.test_url.trim() != this.iframe_url) {
          this.iframe_url = this.test_url.trim();
        } else {
          try {
            this.mainWebView.loadURL(this.test_url.trim());
          } catch {
            this.mainWebView.reload();
          }
        }
      } else if (!this.test_url.trim()) {
        msgBox("Empty URL");
      } else if (this.iframe_working) {
        msgBox("Renderer busy, please wait");
      }
    },
    async runTestPageTypeScript() {
      try {
        let data = await this.mainWebView.executeJavaScript(
          this.getEvaluateJavascriptCode(this.test_pagetype_code)
        );
        if (data || data == 0) {
          switch (data) {
            case 0:
              this.test_result_page_type = "TOCPage";
              onMainWebViewLoadedEvent.removeListener(
                this.runTestPageTypeScript
              );
              break;
            case -1:
              this.test_result_page_type = "Auto Captcha";
              break;
            case -2:
              this.test_result_page_type = "Manual Captcha";
              break;
            default:
              this.test_result_page_type = "UNKNOWN";
              onMainWebViewLoadedEvent.removeListener(
                this.runTestPageTypeScript
              );
              break;
          }
          return;
        } else this.test_result_page_type = "UNKNOWN";
      } catch {
        this.test_result_page_type = "UNKNOWN";
      }
      onMainWebViewLoadedEvent.removeListener(this.runTestPageTypeScript);
    },
    async runTestTOCScript() {
      try {
        log("Running TOC Script...");
        let data = await this.mainWebView.executeJavaScript(
          this.getEvaluateJavascriptCode(this.test_toc_code)
        );
        this.test_novel_toc_data = null;
        if (data) {
          this.test_novel_toc_data = data;
          this.test_result_content =
            "<pre>" + JSON.stringify(data, null, 4) + "</pre>";
        } else msgBox("No data received");
        log("Script executed successfully");
      } catch {
        log("Error");
        msgBox(
          "Error executing script.\nMake sure an URL is already loaded & the script is valid.\n\nCheck DevTools for more details."
        );
      }
    },
    async runTestChapterScript() {
      try {
        log("Running Chapter Script...");
        let data = await this.mainWebView.executeJavaScript(
          this.getEvaluateJavascriptCode(
            (this.test_novel_toc_data != null
              ? "let ndata = " + JSON.stringify(this.test_novel_toc_data) + ";"
              : "") + this.test_chapter_code
          )
        );
        if (data && data.length > 0) {
          let t_data = data[0];
          this.test_result_content =
            (t_data.title
              ? '<div class="fwb">' + t_data.title + "</div>"
              : "") + t_data.content;
        } else window.electronAPI.msgBox("No data received", appName);
        log("Script executed successfully");
      } catch {
        log("Error");
        window.electronAPI.msgBox(
          "Error executing script.\nMake sure an URL is already loaded & the script is valid.\n\nCheck DevTools for more details.",
          appName
        );
      }
    },
    saveTestRule() {
      if (!this.test_rule_name.trim()) {
        msgBox("Please enter a valid Rule-Name");
        return;
      }

      if (!this.test_url_regex.trim()) {
        msgBox("Please enter a valid URL-Regex");
        return;
      }

      if (!this.test_pagetype_code.trim()) {
        msgBox("Please provide PageType-Script");
        return;
      }

      if (!this.test_toc_code.trim()) {
        msgBox("Please provide TOC-Script");
        return;
      }

      if (!this.test_chapter_code.trim()) {
        msgBox("Please provide Chapter-Script");
        return;
      }

      if (this.test_rule_guid) {
        let t_rule = this.rules.find((i) => i.guid == this.test_rule_guid);
        if (t_rule) {
          t_rule.rule_name = this.test_rule_name;
          t_rule.url_regex = this.test_url_regex;
          t_rule.pagetype_code = this.test_pagetype_code;
          t_rule.toc_code = this.test_toc_code;
          t_rule.chapter_code = this.test_chapter_code;
        } else {
          this.rules.push({
            guid: guid(),
            rule_name: this.test_rule_name,
            url_regex: this.test_url_regex,
            pagetype_code: this.test_pagetype_code,
            toc_code: this.test_toc_code,
            chapter_code: this.test_chapter_code,
          });
        }
      } else {
        this.rules.push({
          guid: guid(),
          rule_name: this.test_rule_name,
          url_regex: this.test_url_regex,
          pagetype_code: this.test_pagetype_code,
          toc_code: this.test_toc_code,
          chapter_code: this.test_chapter_code,
        });
      }
      saveConfigData("rules");
      this.goBackFromEditRule();
    },
    editRule(r) {
      this.test_rule_guid = r.guid;
      this.test_rule_name = r.rule_name;
      this.test_url_regex = r.url_regex;
      this.test_pagetype_code = r.pagetype_code;
      this.test_toc_code = r.toc_code;
      this.test_chapter_code = r.chapter_code;

      this.setActiveTab(2);
    },
    goBackFromEditRule() {
      this.resetTestFields(true);
      this.setActiveTab(1);
    },
    deleteRule(event, t_rule) {
      let targ = event.target;
      if (!targ.classList.contains("cr")) {
        targ.innerHTML = "Seriously buddy?";
        targ.classList.add("cr");

        setTimeout(() => {
          try {
            targ.innerHTML = "Delete";
            targ.classList.remove("cr");
          } catch {}
        }, 3000);
      } else {
        let t_rule_index = this.rules.indexOf(t_rule);
        if (t_rule_index >= 0) {
          this.rules.splice(t_rule_index, 1);
          saveConfigData("rules");
        }
      }
    },
    //#endregion
    //#region Add Novel Related
    addNewNovel() {
      if (this.iframe_working) {
        msgBox("Renderer busy, please wait");
        return;
      }

      if (!this.add_novel_url.trim()) {
        msgBox("Please enter the URL");
        return;
      }

      try {
        new URL(this.add_novel_url.trim());
      } catch {
        msgBox("Please enter a valid URL");
        return;
      }

      let t_rule = null;
      this.rules.every((el) => {
        if (new RegExp(el.url_regex).test(this.add_novel_url)) {
          t_rule = el;
          return false;
        }
        return true;
      });

      if (!t_rule) {
        msgBox("No matching rule found for the URL. Please add the rule.");
        return;
      }

      log("Rule applied -> " + t_rule.rule_name);

      this.iframe_working = true;

      let onTOCPageConfirmed = async () => {
        try {
          log("Running TOC Script...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.toc_code)
          );
          if (data) {
            this.novels.push(data);
            saveConfigData("novels");
            log("TOC data retrieved");
            log("Added novel -> " + data.Title);
            this.add_novel_url = "";
          } else log("Error");
        } catch {
          log("Error");
        }
        this.iframe_working = false;
      };

      let onLoadCallback = async () => {
        try {
          log("Checking page-type...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.pagetype_code)
          );
          if (data || data == 0) {
            switch (data) {
              case 0:
                onMainWebViewLoadedEvent.clearAllListeners();
                log("TOC page found");
                await onTOCPageConfirmed();
                break;
              case -1:
              case -2:
                break;
              default:
                onMainWebViewLoadedEvent.clearAllListeners();
                this.iframe_working = false;
                break;
            }
            return;
          } else log("Error");
        } catch {
          log("Error");
          onMainWebViewLoadedEvent.clearAllListeners();
          this.iframe_working = false;
        }
      };

      onMainWebViewLoadedEvent.clearAllListeners();
      onMainWebViewLoadedEvent.addListener(onLoadCallback);
      if (this.add_novel_url.trim() != this.iframe_url) {
        this.iframe_url = this.add_novel_url.trim();
      } else {
        try {
          this.mainWebView.loadURL(this.add_novel_url);
        } catch {
          this.mainWebView.reload();
        }
      }
    },
    //#endregion
  },
  computed: {
    showRenderer() {
      return this.showWebPage && this.activeTabStr != "Rules";
    },
    activeTabStr() {
      return this.tabs[this.activeTab];
    },
    showSideBar() {
      return this.test_rule_guid.length <= 0;
    },
  },
});

/**
 * Changes the status text and logs to console
 * @param {string} text The text to log
 * @param {*} more_text Extra text to be displayed in the console only
 */
function log(text = "", more_text = "") {
  if (app.status) {
    app.status = text.trim();
  }
  if (more_text.trim().length > 0) {
    console.log(text, "->", more_text);
    app.console.textContent =
      app.console.textContent + text + " -> " + more_text + "\r\n";
  } else {
    console.log(text);
    app.console.textContent = app.console.textContent + text + "\r\n";
  }
  app.console.scrollTo(0, app.console.scrollHeight);
}

async function loadAllConfigs() {
  let root = await rootDir();
  let configDirPath = root + "/config";
  let configDirPresent = await pathExists(configDirPath);
  if (!configDirPresent) {
    await createDir(configDirPath);
  }
  await loadConfigData("rules");
  app.loading_rules = false;

  await loadConfigData("novels");
  app.loading_novels = false;
}

/**
 * Generates and returns a GUID `string`
 * @returns {string} GUID
 */
function guid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

async function loadConfigData(configFileName = "") {
  if (configFileName.trim()) {
    let root = await rootDir();
    let configFilePath = root + "/config/" + configFileName + ".json";
    let configFilePresent = await pathExists(configFilePath);
    if (configFilePresent) {
      let fileData = await readFile(configFilePath);
      if (app[configFileName]) {
        app[configFileName] = JSON.parse(fileData);
      }
    } else {
      if (app[configFileName]) {
        app[configFileName] = [];
      }
    }
  }
}

async function saveConfigData(configFileName = "") {
  if (configFileName.trim()) {
    let root = await rootDir();
    let configFilePath = root + "/config/" + configFileName + ".json";
    if (app[configFileName] != null) {
      await writeFile(
        configFilePath,
        JSON.stringify(app[configFileName], null, 4)
      );
    }
  }
}

//#region Electron APIs

function msgBox(text, caption = appName) {
  window.electronAPI.msgBox(text, caption);
}

/**
 * Returns the root directory of the app
 * @returns {Promise<string>} Root-directory path
 */
async function rootDir() {
  return await window.electronAPI.rootDir();
}

/**
 * Creates the supplied directory
 * @param {string} dirPath The directory-path to create
 * @returns {Promise<string>} The full path of the directory
 */
async function createDir(dirPath) {
  return await window.electronAPI.createDir(dirPath);
}

/**
 * Reads the target file as a string
 * @param {string} filePath The path of the file
 * @returns {Promise<string>} The contents of the file
 */
async function readFile(filePath) {
  return await window.electronAPI.readFile(filePath);
}

/**
 * Writes to a file
 * @param {string} filePath The path of the file
 * @param {string} contents The data of the file
 */
async function writeFile(filePath, contents) {
  await window.electronAPI.writeFile(filePath, contents);
}

/**
 * Checks if the given path exists or not
 * @param {string} somePath The path to check
 * @returns {Promise<bool>} Whether path exists or not
 */
async function pathExists(somePath) {
  return await window.electronAPI.pathExists(somePath);
}

/**
 * Deletes the file or directory path specified recursively
 * @param {string} somePath Path of file/directory to delete
 */
async function deletePath(somePath) {
  await window.electronAPI.deletePath(somePath);
}
//#endregion
