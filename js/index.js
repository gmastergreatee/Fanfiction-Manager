let appName = "Fanfiction-Manager";
let appVersion = "beta_3.0.7";
let verboseMode = false;

let site_vars_script = `
let defaultGlobals = ["window", "self", "document", "name", "location", "customElements", "history", "locationbar", "menubar",
  "personalbar", "scrollbars", "statusbar", "toolbar", "status", "closed", "frames", "length", "top", "opener", "parent",
  "frameElement", "navigator", "origin", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY",
  "pageYOffset", "visualViewport", "screenX", "screenY", "outerWidth", "outerHeight", "devicePixelRatio", "clientInformation",
  "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onsearch", "isSecureContext", "performance",
  "onappinstalled", "onbeforeinstallprompt", "crypto", "indexedDB", "webkitStorageInfo", "sessionStorage", "localStorage",
  "onbeforexrselect", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose",
  "oncontextlost", "oncontextmenu", "oncontextrestored", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter",
  "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus",
  "onformdata", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata",
  "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup",
  "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll",
  "onsecuritypolicyviolation", "onseeked", "onseeking", "onselect", "onslotchange", "onstalled", "onsubmit", "onsuspend",
  "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onwebkitanimationend", "onwebkitanimationiteration",
  "onwebkitanimationstart", "onwebkittransitionend", "onwheel", "onauxclick", "ongotpointercapture", "onlostpointercapture",
  "onpointerdown", "onpointermove", "onpointerup", "onpointercancel", "onpointerover", "onpointerout", "onpointerenter",
  "onpointerleave", "onselectstart", "onselectionchange", "onanimationend", "onanimationiteration", "onanimationstart",
  "ontransitionrun", "ontransitionstart", "ontransitionend", "ontransitioncancel", "onafterprint", "onbeforeprint",
  "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onmessageerror", "onoffline", "ononline", "onpagehide",
  "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "alert", "atob", "blur",
  "btoa", "cancelAnimationFrame", "cancelIdleCallback", "captureEvents", "clearInterval", "clearTimeout", "close", "confirm",
  "createImageBitmap", "fetch", "find", "focus", "getComputedStyle", "getSelection", "matchMedia", "moveBy", "moveTo", "open",
  "postMessage", "print", "prompt", "queueMicrotask", "releaseEvents", "reportError", "requestAnimationFrame",
  "requestIdleCallback", "resizeBy", "resizeTo", "scroll", "scrollBy", "scrollTo", "setInterval", "setTimeout", "stop",
  "structuredClone", "webkitCancelAnimationFrame", "webkitRequestAnimationFrame", "chrome", "caches", "cookieStore",
  "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "launchQueue", "onbeforematch", "getScreenDetails",
  "showDirectoryPicker", "showOpenFilePicker", "showSaveFilePicker", "originAgentCluster", "trustedTypes", "navigation",
  "speechSynthesis", "onpointerrawupdate", "crossOriginIsolated", "scheduler", "openDatabase", "webkitRequestFileSystem",
  "webkitResolveLocalFileSystemURL", "getSiteGlobals"];

function getSiteGlobals() {
  let globals = Object.keys(window);
  let siteGlobals = globals.filter((i) => !defaultGlobals.includes(i));
  return siteGlobals.map((i) => {
    return {
        type: typeof(window[i]),
        name: i,
    };
  });
}

return getSiteGlobals();
`;

let default_TOC_Code = `let retMe = {
  'CoverURL': '',              // may be empty
  'Title': 'novel name here',
  'Summary': '',               // may be empty
  'ChapterCount': 1,           // chapter count here
  'ChapterURLs': [             // list of chapter-URLs
      '',                      // must contain atleast the first chapter URL
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

let chapter_default_styles =
  "<style>\n#novel-reader {\n\n\n\n}\n#novel-reader * {\n\nfont-size: 20px;\n\n}\n#btn-back {\n\n\n\n}\n#btn-forward {\n\n\n\n}\n#novel-chapters {\n\n\n\n}\n#novel-chapters a {\n\n\n\n}\n</style>";

// --------------------------------------------------------------------------------------------------------------------

let updatedAppZip = null;
let dummyPageUrl = "./dummy.html";

let configDirectoryRelativePath = "/config/";
let dataDirectoryRelativePath = "/data/";
let coverDirectoryRelativePath = dataDirectoryRelativePath + "covers/";
let novelDirectoryRelativePath = dataDirectoryRelativePath + "novels/";

let chapterChangeLock = false;
let chapterChangeLockTimeout = 200;
let appOptionsChanged = false;
let novelOptionsChanged = false;

let extras = [];

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

const fileDownloader_2 = function (context) {
  if (context === void 0) {
    context = null;
  }
  const fileDownloadScript = `  
  async function downloadFileArrayBuffer(url) {
    let prom = new Promise(async (resolve, reject) => {
      try {
        let data = await fetch(url).then((a) => a.blob());
        let reader = new FileReader();
        reader.loadend += () => {};
        reader.readAsArrayBuffer(data);
        let sleepCounter = 0;
        while (reader.readyState != 2 && reader.readyState != 0) {
          await sleep(500);
          sleepCounter++;
          if (sleepCounter > 20) {
            reject("Wait timeout expired");
          }
        }
        resolve(reader.result);
      } catch (ex) {
        reject(ex);
      }
    });
    return await prom;
  }
  `;
  var urlFileMaps = [];
  return {
    addEntry: function (url, filePath) {
      urlFileMaps.push({
        url: url,
        path: filePath,
      });
    },
    download: async function () {
      for (let i = 0; i < urlFileMaps.length; i++) {
        try {
          let fileData = await app.mainWebView.executeJavaScript(
            app.getEvaluateJavascriptCode(
              fileDownloadScript +
                "return await downloadFileArrayBuffer('" +
                urlFileMaps[i].url +
                "')"
            )
          );

          if (fileData) {
            writeFile(urlFileMaps[i].path, new DataView(fileData));
          }
        } catch (ex) {
          log(
            "Error downloading file (" +
              ex.message +
              ") -> " +
              urlFileMaps[i].url
          );
        }
      }
    },
  };
};

let onMainWebViewLoadedEvent = simpleEvent();
let rootDirectoryAbsolutePath = "";

app = new Vue({
  el: "#main",
  async mounted() {
    window.document.title = appName + " - " + appVersion;
    rootDirectoryAbsolutePath = await rootDir();

    loadAllConfigs();
    this.mainWebView = document.getElementById("mainWebView");
    this.console = document.getElementById("web-console");

    this.mainWebView.addEventListener("did-start-loading", () => {
      if (!this.iframe_url.endsWith(dummyPageUrl)) {
        if (this.isTabActive("Tester")) {
          log("Loading url", this.iframe_url);
        } else {
          logVerbose("Loading url", this.iframe_url);
        }
      }
    });
    this.mainWebView.addEventListener("dom-ready", () => {
      if (!this.mainWebView.getURL().endsWith(dummyPageUrl)) {
        let curr_url = this.mainWebView.getURL();
        if (!curr_url.endsWith("dummy.html")) {
          if (this.isTabActive("Tester")) {
            log("Url loaded", this.mainWebView.getURL());
          } else {
            logVerbose("Url loaded", this.mainWebView.getURL());
          }
        }
      }
      onMainWebViewLoadedEvent.trigger();
    });
    checkAppUpdate();
    setInterval(async () => {
      checkAppUpdate();
    }, 1000 * 60 * 60 * 12);
  },
  data() {
    return {
      //#region Main variables
      mainWebView: null,
      console: null,
      tabs: ["Library", "Rules", "Tester"],

      rules: [],
      loading_rules: true,

      novels: [],
      loading_novels: true,

      app_options: {
        darkMode: true,
        showNewOnly: false,
        showCheckUpdatedOnly: false,
        showGridLayout: false,
        activeTab: 0,
        showWebPage: false,
        showTestResults: false,
        showConsole: false,
      },

      iframe_working: false,
      iframe_url: dummyPageUrl,
      status: "NA",

      checkingForUpdates: false,
      newVersionTag: appVersion,
      isDisplayingUpdateDialog: false,
      isAppUpdating: false,

      updatingRules: false,

      //#endregion

      //#region Reader Mode
      reading_mode: false,
      r_novel: null,
      loading_chapters: false,
      auto_reader_focus: true,

      r_chapters: [],
      r_chapter_index: 0,
      r_chapterIndex_loaded: [],

      r_show_sidebar: true,
      r_show_options: false,
      r_reader_options: {
        r_chapter_styles: chapter_default_styles,
        displayChapterNumbers: false,
        r_chapter_index: 0,
        r_chapter_top_element_index: 0,
        r_chapter_scroll_top_offset: 0,
      },
      r_temp_reader_options: null,

      r_show_goto_mode: false,
      r_goto_offset: 0,
      //#endregion

      //#region Library

      summaryExpandedGUID: "",

      //#endregion

      //#region Add Novel

      add_novel_url: "",
      temp_detailing_novel: null,
      detailing_novel: null,

      //#endregion

      //#region downloader

      d_novel: null,
      stop_download_update_novel: false,
      u_novel: null,

      //#endregion

      //#region tester related

      test_rule_guid: "",
      test_url: "",
      test_rule_name: "",
      test_url_regex: "",
      test_pagetype_code: "",
      test_toc_code: default_TOC_Code,
      test_novel_toc_data: null,
      test_chapter_code: default_Chapter_Code,
      test_url_blocks: "",

      test_result_page_type: "UNKNOWN",
      test_result_content: "",

      //#endregion
    };
  },
  methods: {
    toggleDarkMode() {
      appOptionsChanged = true;
      this.app_options.darkMode = !this.app_options.darkMode;
    },
    isTabActive(tabName = "") {
      return this.tabs[this.app_options.activeTab] == tabName;
    },
    setActiveTab(tabIndex = 0) {
      if (this.app_options.activeTab != tabIndex) {
        appOptionsChanged = true;
        this.app_options.activeTab = tabIndex;
        switch (this.app_options.activeTab) {
          case 0:
            this.app_options.showWebPage = false;
            break;
          case 2:
            this.app_options.showWebPage = true;
            this.app_options.showTestResults = true;
            break;
          default:
            break;
        }
      }
    },
    toggleRenderer() {
      appOptionsChanged = true;
      this.app_options.showWebPage = !this.app_options.showWebPage;
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
      } catch (ex) {
        window.electronAPI.msgBox(
          "Please load an URL before opening DevTools.\nError ->" + ex.message,
          appName
        );
      }
    },
    toggleWebConsole() {
      appOptionsChanged = true;
      this.app_options.showConsole = !this.app_options.showConsole;
    },
    getEvaluateJavascriptCode(script = "") {
      let sleepCode = script.includes("sleep(")
        ? "function sleep(ms) { return new Promise((resolve) => {setTimeout(resolve, ms);}); }\n"
        : "";
      let htmlDecodeCode = script.includes("htmlDecode(")
        ? "function htmlDecode(input) { var doc = new DOMParser().parseFromString(input, 'text/html'); return doc.documentElement.textContent; }\n"
        : "";
      let injectJqueryCode = script.includes("injectJquery()")
        ? "function injectJquery() { " + JqueryString() + " }\n"
        : "";
      return (
        sleepCode +
        htmlDecodeCode +
        injectJqueryCode +
        "(async function() {" +
        "let extras = " +
        (typeof extras == "object"
          ? "JSON.parse('" + JSON.stringify(extras).replace(/\'/g, "\\'") + "')"
          : extras) +
        ";\n" +
        script +
        "})()"
      );
    },
    blockURLIncludes(url_blocks = "") {
      let blocks = url_blocks.trim();
      if (blocks.includes("\n")) {
        blocks = blocks
          .split("\n")
          .map((i) => i.trim())
          .filter((i) => i != "");
      } else {
        if (blocks.trim() != "") blocks = [blocks];
        else blocks = [];
      }
      urlIncludesToBlock(blocks);
    },
    checkForAppUpdates() {
      checkAppUpdate(true);
    },
    showUpdateDialog() {
      this.isDisplayingUpdateDialog = true;
    },
    async downloadAppUpdate() {
      if (updatedAppZip != null) {
        this.isAppUpdating = true;
        let resp = await updateApp(updatedAppZip.browser_download_url);
        if (resp && resp.success) {
          relaunchApp();
        } else if (resp) {
          this.discardAppUpdate();
          log("Something went wrong while updating. :(");
          console.log(resp.message);
        }
        this.isAppUpdating = false;
      } else {
        log(
          'Error -> "updatedAppZip" cannot be null. Please report this error.'
        );
      }
    },
    discardAppUpdate() {
      this.isDisplayingUpdateDialog = false;
      this.newVersionTag = appVersion;
      updatedAppZip = null;
    },
    async updateRules() {
      if (!this.updatingRules) {
        this.updatingRules = true;
        log("Updating rules...");
        try {
          let latestRules = JSON.parse(
            await fetch(
              "https://github.com/gmastergreatee/Fanfiction-Manager/raw/master/config/rules.json"
            ).then((e) => e.text())
          );
          latestRules.forEach((el) => {
            let oldRule = this.rules.find(
              (i) => i.rule_name.toLowerCase() == el.rule_name.toLowerCase()
            );
            if (oldRule) {
              oldRule.url_regex = el.url_regex;
              oldRule.pagetype_code = el.pagetype_code;
              oldRule.toc_code = el.toc_code;
              oldRule.chapter_code = el.chapter_code;
              oldRule.url_blocks = el.url_blocks;
            } else {
              this.rules.push(el);
            }
          });
          saveConfigArrayData("rules");
          log("Rules updated");
        } catch (ex) {
          log("Error updating rules -> " + ex.message);
          console.log(ex);
        }
        this.updatingRules = false;
      }
    },
    //#region Rules Related
    toggleTestResults() {
      appOptionsChanged = true;
      this.app_options.showTestResults = !this.app_options.showTestResults;
    },
    resetTestFields(clearGUID = false) {
      if (clearGUID) {
        this.test_rule_guid = "";
      }

      this.test_novel_toc_data = null;

      let r = {
        rule_name: "",
        url_regex: "",
        pagetype_code: "",
        toc_code: default_TOC_Code,
        chapter_code: default_Chapter_Code,
        url_blocks: "",
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
            url_blocks: t_rule.url_blocks,
          };
        }
      }

      this.test_rule_name = r.rule_name;
      this.test_url_regex = r.url_regex;
      // this.test_url = "";
      this.test_pagetype_code = r.pagetype_code;
      this.test_toc_code = r.toc_code;
      this.test_chapter_code = r.chapter_code;
      this.test_url_blocks = "";
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
        } catch (ex) {
          msgBox("Please enter a valid URL\nError -> " + ex.message);
          return;
        }

        this.blockURLIncludes(this.test_url_blocks);

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
        log("Getting site vars...");
        let data = await this.mainWebView.executeJavaScript(
          this.getEvaluateJavascriptCode(site_vars_script)
        );
        if (data) {
          this.test_result_content =
            "<pre>" + JSON.stringify(data, null, 4) + "</pre>";
          log("Site vars loaded");
        } else {
          log("No site vars found");
        }
      } catch (ex) {
        log("Error getting site vars");
      }
      try {
        let data = await this.mainWebView.executeJavaScript(
          this.getEvaluateJavascriptCode(this.test_pagetype_code)
        );
        if (data || data == 0) {
          // check for extras
          if (data.extras) {
            extras = data.extras;
          }
          // check for chapter custom redirection
          // dataFormat -> { retry: 1, nextURL: '' }
          if (data.retry && data.nextURL) {
            this.mainWebView.stop();
            log("Chapter redirection detected, working...");
            let t_url = data.nextURL;
            if (t_url != this.iframe_url) {
              this.iframe_url = t_url;
            } else {
              try {
                this.mainWebView.loadURL(t_url);
              } catch {
                this.mainWebView.reload();
              }
            }
            return;
          }

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
              this.mainWebView.stop();
              break;
          }
          return;
        } else {
          log("No PAGETYPE data received");
          this.test_result_page_type = "UNKNOWN";
        }
      } catch (ex) {
        log("Error -> " + ex.message);
        this.test_result_page_type = "UNKNOWN";
      }
      onMainWebViewLoadedEvent.removeListener(this.runTestPageTypeScript);
    },
    async runTestTOCScript() {
      try {
        extras = [];
        log("Running TOC Script...");
        let data = await this.mainWebView.executeJavaScript(
          this.getEvaluateJavascriptCode(this.test_toc_code)
        );
        this.test_novel_toc_data = null;
        if (data) {
          // check for extras
          if (data.extras) {
            extras = data.extras;
          }
          // check for chapter custom redirection
          // dataFormat -> { retry: 1, nextURL: '' }
          if (data.retry && data.nextURL) {
            log("Chapter redirection detected, working...");
            let t_url = data.nextURL;
            if (t_url != this.iframe_url) {
              this.iframe_url = t_url;
            } else {
              try {
                this.mainWebView.loadURL(t_url);
              } catch {
                this.mainWebView.reload();
              }
            }
            return;
          }

          this.test_novel_toc_data = data;
          this.test_result_content =
            "<pre>" + JSON.stringify(data, null, 4) + "</pre>";
        } else {
          log("No TOC data received");
        }
        log("Script executed successfully");
      } catch (ex) {
        log("Error -> " + ex.message);
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
        if (data) {
          // check for extras
          if (data.extras) {
            extras = data.extras;
          }
          // check for chapter custom redirection
          // dataFormat -> { retry: 1, nextURL: '' }
          if (data.retry && data.nextURL) {
            log("Chapter redirection detected, working...");
            let t_url = data.nextURL;
            if (t_url != this.iframe_url) {
              this.iframe_url = t_url;
            } else {
              try {
                this.mainWebView.loadURL(t_url);
              } catch {
                this.mainWebView.reload();
              }
            }
            return;
          }

          if (data.length > 0) {
            let t_data = data[0];
            this.test_result_content =
              (t_data.title
                ? '<div class="fwb">' + t_data.title + "</div>"
                : "") + t_data.content;
          }
        } else {
          log("No TOC data received");
        }
        log("Script executed successfully");
      } catch (ex) {
        log("Error -> " + ex.message);
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
          t_rule.url_blocks = this.test_url_blocks;
        } else {
          this.rules.unshift({
            guid: guid(),
            rule_name: this.test_rule_name,
            url_regex: this.test_url_regex,
            pagetype_code: this.test_pagetype_code,
            toc_code: this.test_toc_code,
            chapter_code: this.test_chapter_code,
            url_blocks: this.test_url_blocks,
          });
        }
      } else {
        this.rules.unshift({
          guid: guid(),
          rule_name: this.test_rule_name,
          url_regex: this.test_url_regex,
          pagetype_code: this.test_pagetype_code,
          toc_code: this.test_toc_code,
          chapter_code: this.test_chapter_code,
          url_blocks: this.test_url_blocks,
        });
      }
      saveConfigArrayData("rules");
      this.goBackFromEditRule();
    },
    editRule(t_rule) {
      if (t_rule) {
        this.test_rule_guid = t_rule.guid;
        this.test_rule_name = t_rule.rule_name;
        this.test_url_regex = t_rule.url_regex;
        this.test_pagetype_code = t_rule.pagetype_code;
        this.test_toc_code = t_rule.toc_code;
        this.test_chapter_code = t_rule.chapter_code;
        this.test_url_blocks = t_rule.url_blocks;

        this.setActiveTab(2);
      }
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
        try {
          targ.innerHTML = "Delete";
          targ.classList.remove("cr");
        } catch {}
        let t_rule_index = this.rules.indexOf(t_rule);
        if (t_rule_index >= 0) {
          this.rules.splice(t_rule_index, 1);
          saveConfigArrayData("rules");
        }
      }
    },
    //#endregion
    //#region Novel Related
    addNewNovel() {
      let t_url = this.add_novel_url.trim();
      if (this.iframe_working) {
        msgBox("Renderer busy, please wait");
        return;
      }

      this.iframe_working = true;

      if (!t_url) {
        msgBox("Please enter the URL");
        this.iframe_working = false;
        return;
      }

      let old_novel = this.novels.find(
        (i) => i.URL.toLowerCase() == t_url.toLowerCase()
      );
      if (old_novel) {
        msgBox("Novel already added");
        this.add_novel_url = "";
        this.iframe_working = false;
        return;
      }

      let t_url_origin = "";
      try {
        t_url_origin = new URL(t_url).origin;
      } catch (ex) {
        msgBox("Please enter a valid URL\nError -> " + ex.message);
        this.iframe_working = false;
        return;
      }

      let t_rule = null;
      this.rules.every((el) => {
        if (new RegExp(el.url_regex).test(t_url)) {
          t_rule = el;
          return false;
        }
        return true;
      });

      if (!t_rule) {
        msgBox("No matching rule found for the URL. Please add the rule.");
        this.iframe_working = false;
        return;
      }

      log("Rule applied -> " + t_rule.rule_name);
      log("Downloading Novel Metadata...");

      this.blockURLIncludes(t_rule.url_blocks);

      let onTOCPageConfirmed = async () => {
        try {
          logVerbose("Running TOC Script...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.toc_code)
          );
          if (data) {
            // check for extras
            if (data.extras) {
              extras = data.extras;
            }
            // check for chapter custom redirection
            // dataFormat -> { retry: 1, nextURL: '' }
            if (data.retry && data.nextURL) {
              log("Chapter redirection detected, working...");
              t_url = data.nextURL;
              if (t_url != this.iframe_url) {
                this.iframe_url = t_url;
              } else {
                try {
                  this.mainWebView.loadURL(t_url);
                } catch {
                  this.mainWebView.reload();
                }
              }
              return false;
            }

            data["GUID"] = guid();
            if (data.CoverURL) {
              try {
                new URL(data.CoverURL);
                let cover_file_name = data["GUID"] + ".png";
                let cover_file_path =
                  rootDirectoryAbsolutePath +
                  coverDirectoryRelativePath +
                  cover_file_name;
                let downloader = fileDownloader_2();
                downloader.addEntry(data.CoverURL, cover_file_path);
                data.CoverURL = "";
                this.blockURLIncludes("");
                await downloader.download();
                data.CoverURL =
                  "." + coverDirectoryRelativePath + cover_file_name;
                saveConfigArrayData("novels");
              } catch (ex) {
                log("Cover download error\nError -> " + ex.message);
                data.CoverURL = "";
              }
            }
            data["URL"] = t_url;
            data["DownloadedCount"] = 0;
            data["CheckUpdates"] = true;
            this.novels.unshift(data);
            saveConfigArrayData("novels");
            logVerbose("TOC data retrieved");
            log("Added novel -> " + data.Title);
            this.add_novel_url = "";
          } else {
            this.test_url = this.mainWebView.getURL();
            log("No TOC data returned");
          }
        } catch (ex) {
          this.test_url = this.mainWebView.getURL();
          log("Error -> " + ex.message);
        }
        this.iframe_working = false;
        return true;
      };

      let onLoadCallback = async () => {
        try {
          let curr_url = this.mainWebView.getURL();
          if (!curr_url.includes(t_url_origin)) {
            log("URL changed, probably redirection");
            log("Re-matching rule");
            let t_rule_2 = null;
            this.rules.every((el) => {
              if (new RegExp(el.url_regex).test(t_url)) {
                t_rule_2 = el;
                return false;
              }
              return true;
            });
            if (!t_rule_2) {
              log("No rules matched. Keeping original rule.");
            } else {
              t_rule = t_rule_2;
              log("Rule applied -> " + t_rule.rule_name);
              this.blockURLIncludes(t_rule.url_blocks);
            }
            t_url_origin = new URL(curr_url).origin;
          }

          logVerbose("Checking page-type...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.pagetype_code)
          );
          if (data || data == 0) {
            // check for extras
            if (data.extras) {
              extras = data.extras;
            }
            // check for chapter custom redirection
            // dataFormat -> { retry: 1, nextURL: '' }
            if (data.retry && data.nextURL) {
              log("Chapter redirection detected, working...");
              t_url = data.nextURL;
              if (t_url != this.iframe_url) {
                this.iframe_url = t_url;
              } else {
                try {
                  this.mainWebView.loadURL(t_url);
                } catch {
                  this.mainWebView.reload();
                }
              }
              return;
            }

            switch (data) {
              case 0:
                this.mainWebView.stop();
                logVerbose("TOC page found");
                if (await onTOCPageConfirmed()) {
                  onMainWebViewLoadedEvent.clearAllListeners();
                  this.iframe_url = dummyPageUrl;
                }
                break;
              case -1:
              case -2:
                break;
              default:
                onMainWebViewLoadedEvent.clearAllListeners();
                this.iframe_working = false;
                this.mainWebView.stop();
                this.iframe_url = dummyPageUrl;
                break;
            }
            return;
          } else {
            this.test_url = this.mainWebView.getURL();
            log("No PAGETYPE data received");
          }
        } catch (ex) {
          this.test_url = this.mainWebView.getURL();
          onMainWebViewLoadedEvent.clearAllListeners();
          this.mainWebView.stop();
          this.iframe_working = false;
          log("Error -> " + ex.message);
        }
      };

      onMainWebViewLoadedEvent.clearAllListeners();
      onMainWebViewLoadedEvent.addListener(onLoadCallback);

      extras = [];

      if (t_url != this.iframe_url) {
        this.iframe_url = t_url;
      } else {
        try {
          this.mainWebView.loadURL(t_url);
        } catch {
          this.mainWebView.reload();
        }
      }
    },
    async deleteNovel(event, t_novel) {
      let index = this.novels.indexOf(t_novel);
      if (index >= 0) {
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
          try {
            targ.innerHTML = "Delete";
            targ.classList.remove("cr");
          } catch {}
          let cover_url_from_root_path = t_novel.CoverURL.replace(/^\.+/, "");
          if (cover_url_from_root_path) {
            pathExists(
              rootDirectoryAbsolutePath + cover_url_from_root_path
            ).then(async (e) => {
              if (e) {
                await deletePath(
                  rootDirectoryAbsolutePath + cover_url_from_root_path
                );
              }
            });
          }
          if (await pathExists(novelDirectoryAbsolutePath(t_novel.GUID))) {
            await deletePath(novelDirectoryAbsolutePath(t_novel.GUID));
          }
          if (this.novels.splice(index, 1).length > 0) {
            saveConfigArrayData("novels");
          }
        }
      }
    },
    isDetailingMode(t_novel) {
      if (!this.detailing_novel) return false;
      if (this.detailing_novel.GUID == t_novel.GUID) return true;
      return false;
    },
    viewNovelDetails(t_novel) {
      if (this.detailing_novel == t_novel) return;
      if (this.detailing_novel && this.temp_detailing_novel) {
        let novel_index = this.novels.indexOf(this.detailing_novel);
        Vue.set(
          this.novels,
          novel_index,
          JSON.parse(JSON.stringify(this.temp_detailing_novel))
        );
      }
      this.detailing_novel = t_novel;
      this.temp_detailing_novel = JSON.parse(JSON.stringify(t_novel));
    },
    discardNovelDetailsChanges() {
      let novel_index = this.novels.indexOf(this.detailing_novel);
      this.detailing_novel = null;
      Vue.set(
        this.novels,
        novel_index,
        JSON.parse(JSON.stringify(this.temp_detailing_novel))
      );
      this.temp_detailing_novel = null;
    },
    async saveCloseNovelDetails() {
      this.detailing_novel = null;
      this.temp_detailing_novel = null;
      await saveConfigArrayData("novels");
    },
    toggleNewOnly() {
      appOptionsChanged = true;
      this.app_options.showNewOnly = !this.app_options.showNewOnly;
    },
    toggleCheckUpdatedOnly() {
      appOptionsChanged = true;
      this.app_options.showCheckUpdatedOnly =
        !this.app_options.showCheckUpdatedOnly;
    },
    setSummaryGUID(guid) {
      if (this.summaryExpandedGUID != guid) {
        this.summaryExpandedGUID = guid;
      } else {
        this.summaryExpandedGUID = "";
      }
    },
    //#endregion
    //#region Downloader related
    async downloadNovel(t_novel) {
      if (this.iframe_working) {
        msgBox("Renderer busy, please wait");
        return;
      }

      this.iframe_working = true;

      if (
        t_novel.ChapterCount != 0 &&
        t_novel.ChapterCount <= t_novel.DownloadedCount
      ) {
        this.iframe_working = false;
        return;
      }

      let t_url = t_novel.URL;
      if (!t_url) {
        msgBox("Please fix the URL for the novel");
        return;
      }

      let t_url_origin = "";
      try {
        t_url_origin = new URL(t_url).origin;
      } catch (ex) {
        msgBox("Please fix the URL for the novel\nError -> " + ex.message);
        this.iframe_working = false;
        return;
      }

      let t_rule = null;
      this.rules.every((el) => {
        if (new RegExp(el.url_regex).test(t_url)) {
          t_rule = el;
          return false;
        }
        return true;
      });

      if (!t_rule) {
        msgBox("No matching rule found for the URL. Please add the rule.");
        this.iframe_working = false;
        return;
      }

      log("Rule applied -> " + t_rule.rule_name);

      let novel_full_path = novelDirectoryAbsolutePath(t_novel.GUID);
      let chapter_urls = t_novel.ChapterURLs;
      let urls_to_download = [];
      for (let i = 0; i < chapter_urls.length; i++) {
        let doesChapterFileExist = await pathExists(
          novel_full_path + (i + 1) + ".json"
        );
        if (!doesChapterFileExist) {
          urls_to_download.push({ index: i, url: chapter_urls[i] });
        }
      }

      if (urls_to_download.length <= 0) {
        log("Already up to date");
        t_novel.DownloadedCount = t_novel.ChapterCount;
        saveConfigArrayData("novels");
        this.iframe_working = false;
        return;
      }

      this.d_novel = t_novel;
      let curr_url_index = 0;
      this.blockURLIncludes(t_rule.url_blocks);

      let onLoadCallback = async () => {
        try {
          let curr_url = this.mainWebView.getURL();
          if (!curr_url.includes(t_url_origin)) {
            log("URL changed, probably redirection");
            log("Re-matching rule");
            let t_rule_2 = null;
            this.rules.every((el) => {
              if (new RegExp(el.url_regex).test(curr_url)) {
                t_rule_2 = el;
                return false;
              }
              return true;
            });
            if (!t_rule_2) {
              log("No rules matched. Keeping original rule.");
            } else {
              t_rule = t_rule_2;
              log("Rule applied -> " + t_rule.rule_name);
              this.blockURLIncludes(t_rule.url_blocks);
            }
            t_url_origin = new URL(curr_url).origin;
          }

          logVerbose("Checking page-type...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.pagetype_code)
          );
          if (data || data == 0) {
            // check for extras
            if (data.extras) {
              extras = data.extras;
            }
            // check for chapter custom redirection
            // dataFormat -> { retry: 1, nextURL: '' }
            if (data.retry && data.nextURL) {
              log("Chapter redirection detected, working...");
              t_url = data.nextURL;
              if (t_url != this.iframe_url) {
                this.iframe_url = t_url;
              } else {
                try {
                  this.mainWebView.loadURL(t_url);
                } catch {
                  this.mainWebView.reload();
                }
              }
              return;
            }

            let skipDownload = true;
            switch (data) {
              case 0:
                logVerbose("TOC page found");
                skipDownload = false;
                break;
              case -1:
                log("Auto-Captcha page");
              case -2:
                log("Manual-Captcha page");
                break;
              default:
                this.test_url = this.mainWebView.getURL();
                this.mainWebView.stop();
                log("Unknown page-type");
                onMainWebViewLoadedEvent.clearAllListeners();
                this.d_novel = null;
                this.iframe_working = false;
            }
            if (skipDownload) {
              return;
            }
          } else {
            this.test_url = this.mainWebView.getURL();
            log("No PAGETYPE data received");
            onMainWebViewLoadedEvent.clearAllListeners();
            this.d_novel = null;
            this.iframe_working = false;
            return;
          }

          logVerbose("Running Chapter Script...");
          data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.chapter_code)
          );
          this.mainWebView.stop();
          let t_c_url = urls_to_download[curr_url_index];
          if (data) {
            // check for extras
            if (data.extras) {
              extras = data.extras;
            }
            // check for chapter custom redirection
            // dataFormat -> { retry: 1, nextURL: '' }
            if (data.retry && data.nextURL) {
              log("Chapter redirection detected, working...");
              t_url = data.nextURL;
              if (t_url != this.iframe_url) {
                this.iframe_url = t_url;
              } else {
                try {
                  this.mainWebView.loadURL(t_url);
                } catch {
                  this.mainWebView.reload();
                }
              }
              return;
            }
            if (data.length > 0) {
              let next_url = "";
              for (let i = 0; i < data.length; i++) {
                let chapter_file_path =
                  novel_full_path + (t_c_url.index + i + 1) + ".json";
                await writeFile(
                  chapter_file_path,
                  JSON.stringify(
                    { title: data[i].title, content: data[i].content },
                    null,
                    2
                  )
                );
                next_url = data[i].nextURL;
              }
              curr_url_index += data.length;
              t_novel.DownloadedCount =
                t_novel.ChapterCount - urls_to_download.length + curr_url_index;
              if (curr_url_index < urls_to_download.length) {
                if (!this.stop_download_update_novel) {
                  log(
                    "[" +
                      (t_novel.ChapterCount -
                        (urls_to_download.length - curr_url_index - 1)) +
                      "/" +
                      t_novel.ChapterCount +
                      "] Downloading chapter..."
                  );
                  t_url = next_url
                    ? next_url
                    : urls_to_download[curr_url_index].url;
                  if (t_url != this.iframe_url) {
                    this.iframe_url = t_url;
                  } else {
                    try {
                      this.mainWebView.loadURL(t_url);
                    } catch {
                      this.mainWebView.reload();
                    }
                  }
                } else {
                  this.iframe_url = dummyPageUrl;
                  this.stop_download_update_novel = false;
                  saveConfigArrayData("novels");
                  log("Downloading stopped");
                  onMainWebViewLoadedEvent.clearAllListeners();
                  this.d_novel = null;
                  this.iframe_working = false;
                }
              } else {
                this.iframe_url = dummyPageUrl;
                saveConfigArrayData("novels");
                log("All chapters downloaded");
                onMainWebViewLoadedEvent.clearAllListeners();
                this.d_novel = null;
                this.iframe_working = false;
              }
            }
          } else {
            this.test_url = this.mainWebView.getURL();
            log(
              "No CHAPTER data received\n" +
                (t_c_url.index + 1) +
                " -> " +
                t_c_url.url,
              data
            );
            onMainWebViewLoadedEvent.clearAllListeners();
            this.d_novel = null;
            this.iframe_working = false;
          }
        } catch (ex) {
          this.test_url = this.mainWebView.getURL();
          log("Error -> " + ex.message);
          onMainWebViewLoadedEvent.clearAllListeners();
          this.d_novel = null;
          this.iframe_working = false;
        }
      };

      t_url = urls_to_download[curr_url_index].url;
      onMainWebViewLoadedEvent.clearAllListeners();
      onMainWebViewLoadedEvent.addListener(onLoadCallback);

      extras = [];

      log(
        "[" +
          (t_novel.ChapterCount -
            (urls_to_download.length - curr_url_index - 1)) +
          "/" +
          t_novel.ChapterCount +
          "] Downloading chapter..."
      );
      if (t_url != this.iframe_url) {
        this.iframe_url = t_url;
      } else {
        try {
          this.mainWebView.loadURL(t_url);
        } catch {
          this.mainWebView.reload();
        }
      }
    },
    stopDownloadNovel() {
      this.stop_download_update_novel = true;
    },
    updateNovel(t_novel) {
      let t_url = t_novel.URL;

      this.iframe_working = true;

      if (!t_url) {
        msgBox("Please enter the URL");
        this.iframe_working = false;
        return;
      }

      let t_url_origin = "";
      try {
        t_url_origin = new URL(t_url).origin;
      } catch (ex) {
        msgBox("Please enter a valid URL\nError -> " + ex.message);
        this.iframe_working = false;
        return;
      }

      let t_rule = null;
      this.rules.every((el) => {
        if (new RegExp(el.url_regex).test(t_url)) {
          t_rule = el;
          return false;
        }
        return true;
      });

      if (!t_rule) {
        msgBox("No matching rule found for the URL. Please add the rule.");
        this.iframe_working = false;
        return;
      }

      this.u_novel = t_novel;

      log("Rule applied -> " + t_rule.rule_name);
      log("Updating Novel Metadata...");
      this.blockURLIncludes(t_rule.url_blocks);

      let onTOCPageConfirmed = async () => {
        try {
          logVerbose("Running TOC Script...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.toc_code)
          );
          if (data) {
            // check for extras
            if (data.extras) {
              extras = data.extras;
            }
            // check for chapter custom redirection
            // dataFormat -> { retry: 1, nextURL: '' }
            if (data.retry && data.nextURL) {
              log("Chapter redirection detected, working...");
              t_url = data.nextURL;
              if (t_url != this.iframe_url) {
                this.iframe_url = t_url;
              } else {
                try {
                  this.mainWebView.loadURL(t_url);
                } catch {
                  this.mainWebView.reload();
                }
              }
              return false;
            }

            if (!t_novel.CoverURL && data.CoverURL) {
              try {
                new URL(data.CoverURL);
                let cover_file_name = t_novel.GUID + ".png";
                let cover_file_path =
                  rootDirectoryAbsolutePath +
                  coverDirectoryRelativePath +
                  cover_file_name;
                let downloader = fileDownloader_2();
                downloader.addEntry(data.CoverURL, cover_file_path);
                await downloader.download();
                t_novel.CoverURL =
                  "." + coverDirectoryRelativePath + cover_file_name;
                saveConfigArrayData("novels");
              } catch (ex) {
                log("Cover download error\nError -> " + ex.message);
                t_novel.CoverURL = "";
              }
            }
            if (
              (data.ChapterURLs &&
                data.ChapterURLs.length > t_novel.ChapterURLs.length) ||
              data.ChapterCount > t_novel.ChapterCount
            ) {
              t_novel.ChapterURLs = data.ChapterURLs;
              t_novel.ChapterCount = t_novel.ChapterURLs.length;
            }
            saveConfigArrayData("novels");
            logVerbose("TOC data retrieved");
            log("Updated novel -> " + t_novel.Title);
          } else {
            this.test_url = this.mainWebView.getURL();
            log("No TOC data received");
          }
        } catch (ex) {
          this.test_url = this.mainWebView.getURL();
          log("Error -> " + ex.message);
        }
        this.iframe_working = false;
        return true;
      };

      let onLoadCallback = async () => {
        try {
          let curr_url = this.mainWebView.getURL();
          if (!curr_url.includes(t_url_origin)) {
            log("URL changed, probably redirection");
            log("Re-matching rule");
            let t_rule_2 = null;
            this.rules.every((el) => {
              if (new RegExp(el.url_regex).test(t_url)) {
                t_rule_2 = el;
                return false;
              }
              return true;
            });
            if (!t_rule_2) {
              log("No rules matched. Keeping original rule.");
            } else {
              t_rule = t_rule_2;
              log("Rule applied -> " + t_rule.rule_name);
              this.blockURLIncludes(t_rule.url_blocks);
            }
            t_url_origin = new URL(curr_url).origin;
          }

          logVerbose("Checking page-type...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.pagetype_code)
          );
          if (data || data == 0) {
            switch (data) {
              case 0:
                this.mainWebView.stop();
                logVerbose("TOC page found");
                if (await onTOCPageConfirmed()) {
                  onMainWebViewLoadedEvent.clearAllListeners();
                  this.iframe_url = dummyPageUrl;
                }
                break;
              case -1:
              case -2:
                break;
              default:
                onMainWebViewLoadedEvent.clearAllListeners();
                this.iframe_working = false;
                this.mainWebView.stop();
                this.iframe_url = dummyPageUrl;
                break;
            }
            this.u_novel = null;
            return;
          } else {
            this.test_url = this.mainWebView.getURL();
            log("No PAGETYPE data received");
          }
        } catch (ex) {
          this.test_url = this.mainWebView.getURL();
          onMainWebViewLoadedEvent.clearAllListeners();
          this.mainWebView.stop();
          this.iframe_working = false;
          log("Error -> " + ex.message);
        }
        this.u_novel = null;
      };

      onMainWebViewLoadedEvent.clearAllListeners();
      onMainWebViewLoadedEvent.addListener(onLoadCallback);

      extras = [];

      if (t_url != this.iframe_url) {
        this.iframe_url = t_url;
      } else {
        try {
          this.mainWebView.loadURL(t_url);
        } catch {
          this.mainWebView.reload();
        }
      }
    },
    //#endregion
    //#region Reading Mode
    async enterReadingMode(t_novel) {
      loadNovelConfigData(
        t_novel.GUID,
        "r_reader_options",
        {
          r_chapter_styles: chapter_default_styles,
          displayChapterNumbers: false,
          r_chapter_index: 0,
          r_chapter_top_element_index: 0,
          r_chapter_scroll_top_offset: 0,
        },
        () => {
          this.reading_mode = true;
          this.r_chapter_index = 0;
          this.r_novel = t_novel;
          document.title =
            this.r_novel.Title + " - " + appName + " - " + appVersion;
          chapterChangeLock = false;
          activateReadingModeEventListeners();
          setTimeout(() => {
            this.setReadingChapterIndex(this.r_reader_options.r_chapter_index);
            this.loadChapters();
          }, 1);
        }
      );
    },
    async loadChapters() {
      this.loading_chapters = true;
      this.r_chapters = Array.apply(
        null,
        Array(this.r_novel.ChapterURLs.length)
      ).fill(null);

      let chapter_urls = this.r_novel.ChapterURLs;
      let novel_directory = novelDirectoryAbsolutePath(this.r_novel.GUID);
      this.r_chapterIndex_loaded = [];

      for (let i = 0; i < chapter_urls.length; i++) {
        if (!this.r_chapterIndex_loaded.includes(this.r_chapter_index)) {
          if (this.r_chapters[this.r_chapter_index] == null) {
            let chapter_file_name =
              novel_directory + (this.r_chapter_index + 1) + ".json";
            let chapter_file_exist = await pathExists(chapter_file_name);
            if (chapter_file_exist) {
              let data = await readFile(chapter_file_name);
              Vue.set(this.r_chapters, this.r_chapter_index, JSON.parse(data));
              this.r_chapterIndex_loaded.push(this.r_chapter_index);
            }
            setTimeout(() => {
              let reader = document.getElementById("novel-reader");
              let topElIndex =
                this.r_reader_options.r_chapter_top_element_index;
              let scrollOffset =
                this.r_reader_options.r_chapter_scroll_top_offset;
              if (topElIndex) {
                let firstEl = reader.children[topElIndex];
                if (reader && firstEl) {
                  firstEl.scrollIntoView();
                  if (scrollOffset) {
                    reader.scrollBy(0, scrollOffset);
                  }
                }
              }
            }, 100);
          }
        }
        if (this.r_chapters[i] == null) {
          let chapter_file_name = novel_directory + (i + 1) + ".json";
          let chapter_file_exist = await pathExists(chapter_file_name);
          if (chapter_file_exist) {
            let data = await readFile(chapter_file_name);
            Vue.set(this.r_chapters, i, JSON.parse(data));
            this.r_chapterIndex_loaded.push(i);
          }
        }
      }
      this.loading_chapters = false;
    },
    getChapterName(index = 0) {
      let chapter = this.r_chapters[index];
      if (!chapter) {
        return this.loading_chapters ? "Loading" : "Not Downloaded";
      }

      if (chapter.title) {
        return (
          (this.r_reader_options.displayChapterNumbers
            ? index + 1 + ". "
            : "") + chapter.title
        );
      }

      return (
        (this.r_reader_options.displayChapterNumbers ? index + 1 + ". " : "") +
        "Chapter " +
        (index + 1).toString()
      );
    },
    setReadingChapterIndex(index = 0) {
      let reader = document.getElementById("novel-reader");
      if (this.r_chapter_index != index) {
        this.r_chapter_index = index;
        this.r_reader_options.r_chapter_index = this.r_chapter_index;
        novelOptionsChanged = true;
        reader.scrollTo(0, 0);
      }
      document
        .querySelector('[href="#' + this.r_chapter_index + '"]')
        .scrollIntoViewIfNeeded(false);
      setTimeout(() => {
        reader.focus();
      }, 1);
    },
    loadPreviousChapter(reader, offset = 1, scrollDown = true) {
      if (!chapterChangeLock) {
        if (offset > 0 && this.r_chapter_index > 0) {
          chapterChangeLock = true;
          if (this.r_chapter_index - offset < 0) {
            offset = this.r_chapter_index;
          }
          this.r_chapter_index -= offset;
          this.r_reader_options.r_chapter_index = this.r_chapter_index;
          novelOptionsChanged = true;
          if (scrollDown) {
            setTimeout(() => {
              let actualScrollHeight =
                reader.scrollHeight - reader.clientHeight;
              reader.scrollTo(0, actualScrollHeight);
            }, 1);
          }
          document
            .querySelector('[href="#' + this.r_chapter_index + '"]')
            .scrollIntoViewIfNeeded(false);
          // lil bit of delay before allowing chapter change,
          // to disallow repeated triggers resulting in chapter skips
          setTimeout(() => {
            chapterChangeLock = false;
          }, chapterChangeLockTimeout);
        }
      }
    },
    loadNextChapter(reader, offset = 1) {
      if (!chapterChangeLock) {
        if (offset > 0 && this.r_chapters) {
          chapterChangeLock = true;
          if (this.r_chapter_index + offset + 1 > this.r_chapters.length) {
            offset = this.r_chapters.length - this.r_chapter_index - 1;
          }
          if (offset > 0) {
            this.r_chapter_index += offset;
            this.r_reader_options.r_chapter_index = this.r_chapter_index;
            novelOptionsChanged = true;
            setTimeout(() => {
              reader.scrollTo(0, 0);
            }, 1);
            document
              .querySelector('[href="#' + this.r_chapter_index + '"]')
              .scrollIntoViewIfNeeded(false);
            // lil bit of delay before allowing chapter change,
            // to disallow repeated triggers resulting in chapter skips
          }
          setTimeout(() => {
            chapterChangeLock = false;
          }, chapterChangeLockTimeout);
        }
      }
    },
    enterGoToChapterMode() {
      this.r_goto_offset = this.r_chapter_index + 1;
      this.r_show_goto_mode = true;
      setTimeout(() => {
        document.getElementById("goto-input").select();
      }, 1);
    },
    exitGoToChapterMode() {
      this.r_goto_offset = 0;
      this.r_show_goto_mode = false;
      document.getElementById("novel-reader").focus();
    },
    exitReadingMode() {
      this.reading_mode = false;
      this.r_novel = null;
      this.loading_chapters = false;
      this.r_chapters = [];
      this.r_chapter_index = 0;
      this.r_show_sidebar = true;
      this.r_show_options = false;
      if (this.r_temp_reader_options) {
        this.r_reader_options = JSON.parse(this.r_temp_reader_options);
      }
      document.title = appName + " - " + appVersion;
      deactivateReadingModeEventListeners();
    },
    toggleReaderOptions() {
      if (this.r_show_options) {
        this.r_reader_options = JSON.parse(this.r_temp_reader_options);
        this.r_temp_reader_options = null;
        this.focusOnReader();
      } else {
        this.r_temp_reader_options = JSON.stringify(this.r_reader_options);
        setTimeout(() => {
          let stylesEl = document.getElementById("novel-styles-text");
          stylesEl.focus();
          stylesEl.scrollTo(0, 0);
        }, 2);
      }
      this.r_show_options = !this.r_show_options;
    },
    toggleReadingModeSidebar() {
      this.r_show_sidebar = !this.r_show_sidebar;
    },
    async saveReaderOptions() {
      if (!this.r_reader_options.r_chapter_styles) {
        this.r_reader_options.r_chapter_styles = chapter_default_styles;
      }
      novelOptionsChanged = true;
      this.r_show_options = false;
    },
    focusOnReader() {
      if (this.auto_reader_focus) {
        setTimeout(() => {
          if (!this.r_show_options) {
            let reader = document.getElementById("novel-reader");
            if (reader) reader.focus();
          }
        }, 1);
      }
    },
    readerPageUpKeyDown() {
      document.getElementById("novel-reader").focus();
      setTimeout(() => {
        sendInput("keyDown", "PageUp");
      }, 1);
    },
    readerPageDownKeyDown() {
      document.getElementById("novel-reader").focus();
      setTimeout(() => {
        sendInput("keyDown", "PageDown");
      }, 1);
    },
    mouseOverChapterList(event) {
      this.auto_reader_focus = false;
      setTimeout(() => {
        event.target.focus();
      }, 1);
    },
    mouseLeaveChapterList() {
      this.auto_reader_focus = true;
      this.focusOnReader();
    },
    //#endregion
  },
  computed: {
    showRenderer() {
      return this.app_options.showWebPage && this.activeTabStr != "Rules";
    },
    activeTabStr() {
      return this.tabs[this.app_options.activeTab];
    },
    showSideBar() {
      return this.test_rule_guid.length <= 0;
    },
    //#region Library
    getNovels() {
      return this.novels.filter(
        (i) =>
          (this.app_options.showNewOnly
            ? i.DownloadedCount < i.ChapterCount || i.ChapterCount <= 0
            : true) &&
          (this.app_options.showCheckUpdatedOnly ? i.CheckUpdates : true)
      );
    },
    //#endregion
    //#region Reader
    getSelectedChapterName() {
      let chapter = this.r_chapters[this.r_chapter_index];
      if (!chapter) {
        return this.loading_chapters ? "Loading" : "Not Downloaded";
      }

      if (chapter.title) {
        return (
          (this.r_reader_options.displayChapterNumbers
            ? this.r_chapter_index + 1 + ". "
            : "") + chapter.title
        );
      }

      return "Chapter " + (this.r_chapter_index + 1).toString();
    },
    getSelectedChapterContent() {
      let chapter = this.r_chapters[this.r_chapter_index];
      if (!chapter) {
        return this.loading_chapters
          ? "!~~~ Loading Chapter ~~~!"
          : "!~~~ Page not downloaded yet ~~~!";
      }

      if (chapter.content) {
        return chapter.content;
      }

      return "Oops! You shouldn't view this message. Reporting this would be very helpful. For that immediately close the app, then zip & submit the 'data' and 'config' folder & create a new github issue.";
    },
    //#endregion
  },
});

//#region Keyboard + Mouse events

//#region Reading mode

// To keep track of current reading position if user resizes window

let firstVisibleEl = null;
let firstOffsetClientTop = 0;

let resizeEventFunc = function (observer) {
  if (firstVisibleEl) {
    firstVisibleEl.scrollIntoView();
    observer[0].target.scrollBy(0, firstOffsetClientTop);
  }
};

let stylechangeEventFunc = function () {
  let reader = document.getElementById("novel-reader");
  if (reader && firstVisibleEl) {
    firstVisibleEl.scrollIntoView();
    reader.scrollBy(0, firstOffsetClientTop);
  }
};

let cursorHideFunc = function (e) {
  let _el = e.target;

  // clear the timer if it is set when the mouse move
  const timer = _el.getAttribute("timer");
  if (timer) {
    clearTimeout(timer);
    _el.setAttribute("timer", "");
  }

  // set timeout to wait of idle time
  const t = setTimeout(() => {
    _el.setAttribute("timer", "");
    _el.classList.add("cn");
  }, 3500);
  _el.setAttribute("timer", t);

  _el.classList.remove("cn");
};

let novelReaderResizeObserver = new ResizeObserver(resizeEventFunc);
let novelStyleChangeObserver = new MutationObserver(stylechangeEventFunc);

function activateReadingModeEventListeners() {
  document.addEventListener("wheel", mouseEventFunc);
  document.addEventListener("keydown", keyboardEventFunc);
  setTimeout(() => {
    // wait for reader to show
    let reader = document.getElementById("novel-reader");
    firstVisibleEl = Array.from(reader.children).find(
      (i) => i.offsetTop > reader.scrollTop
    );
    if (firstVisibleEl) {
      firstOffsetClientTop = reader.scrollTop - firstVisibleEl.offsetTop;
    }

    reader.addEventListener("mousemove", cursorHideFunc);

    // set observers
    novelReaderResizeObserver.observe(reader);
    novelStyleChangeObserver.observe(
      document.getElementById("novel-reader-styles"),
      {
        childList: true,
      }
    );
  }, 10);
}

function deactivateReadingModeEventListeners() {
  document.removeEventListener("wheel", mouseEventFunc);
  document.removeEventListener("keydown", keyboardEventFunc);

  let reader = document.getElementById("novel-reader");
  reader.removeEventListener("mousemove", cursorHideFunc);

  novelReaderResizeObserver.disconnect();
  novelStyleChangeObserver.disconnect();
}

let keyboardEventFunc = function (event) {
  if (app) {
    let key = event.keyCode;
    if (app.r_novel) {
      let reader = document.getElementById("novel-reader");

      // Enter key
      if (key == 13 && app.r_show_goto_mode) {
        let nextChapterIndex = document.getElementById("goto-input").value - 1;
        let offset = nextChapterIndex - app.r_chapter_index;
        if (offset < 0) {
          app.loadPreviousChapter(reader, -offset, false);
        } else if (offset > 0) {
          app.loadNextChapter(reader, offset);
        }
        app.exitGoToChapterMode();
      }

      // Ctrl+G key
      if (key == 71 && event.ctrlKey) {
        app.enterGoToChapterMode();
        return;
      }

      // Ctrl+H key
      if (key == 72 && event.ctrlKey) {
        app.toggleReadingModeSidebar();
        return;
      }

      // Ctrl+Home or Ctrl+End
      if ((key == 36 || key == 35) && event.ctrlKey) {
        if (key == 36) {
          app.setReadingChapterIndex(0);
        } else if (key == 35) {
          app.setReadingChapterIndex(app.r_chapters.length - 1);
        }
        return;
      }

      if (document.activeElement == reader) {
        if (
          key == 32 || // space
          key == 35 || // end
          key == 36 || // home
          key == 33 || // pageUp
          key == 34 || // pageDown
          key == 37 || // leftArrow
          key == 38 || // upArrow
          key == 39 || // rightArrow
          key == 40 // downArrow
        ) {
          let shift = event.shiftKey;
          let direction = 0;
          let power = 0;

          let max_power = 100;

          // left or right
          if (key == 37 || key == 39) power = max_power / 4;
          // up or down
          if (key == 38 || key == 40) power = max_power / 2;

          // left or up
          if (key == 37 || key == 38) direction--;
          // right or down
          if (key == 39 || key == 40) direction++;

          if (key == 32 || key == 33 || key == 34 || key == 35 || key == 36) {
            // space or pageUp or pageDown or end or home
            power = max_power;
            // shift+space pr pageUp or home
            if ((shift && key == 32) || key == 33 || key == 36) direction--;
            else direction++;
          }

          // wanna go up ?
          if (direction < 0) {
            if (reader.scrollTop > 0) {
              if (power < max_power) {
                reader.scrollBy(0, power * direction);
                event.preventDefault();
              }
            } else {
              app.loadPreviousChapter(reader);
              event.preventDefault();
            }
          } else if (direction > 0) {
            // wanna go down ?
            let actualScrollHeight = reader.scrollHeight - reader.clientHeight;
            // freaking 10 px scrollHeight hack here,
            // coz apparently the scroll sometimes never reaches the bottom before stopping scroll
            // took me quite some time faaaaaak
            if (reader.scrollTop + 10 < actualScrollHeight) {
              if (power < max_power) {
                reader.scrollBy(0, power * direction);
                event.preventDefault();
              }
            } else {
              app.loadNextChapter(reader);
              event.preventDefault();
            }
          }

          if (direction != 0) {
            setTimeout(() => {
              let childArray = Array.from(reader.children);
              firstVisibleEl = childArray.find(
                (i) => i.offsetTop > reader.scrollTop
              );
              if (firstVisibleEl) {
                firstOffsetClientTop =
                  reader.scrollTop - firstVisibleEl.offsetTop;

                app.r_reader_options.r_chapter_scroll_top_offset =
                  firstOffsetClientTop;

                app.r_reader_options.r_chapter_top_element_index =
                  childArray.indexOf(firstVisibleEl);

                novelOptionsChanged = true;
              }
            }, 10);
          }
        }
      }

      // Escape key
      if (key == 27) {
        if (app.r_show_goto_mode) {
          app.exitGoToChapterMode();
        } else if (app.r_show_options) {
          app.toggleReaderOptions();
        } else if (app.r_novel) {
          app.exitReadingMode();
        }
      }
    }
  }
};

let mouseEventFunc = function (event) {
  if (app && app.r_novel) {
    let reader = document.getElementById("novel-reader");
    if (document.activeElement == reader) {
      if (event.deltaY < 0) {
        if (reader.scrollTop <= 0) {
          app.loadPreviousChapter(reader);
        }
      } else if (event.deltaY > 0) {
        let actualScrollHeight = reader.scrollHeight - reader.clientHeight;
        if (reader.scrollTop + 10 >= actualScrollHeight) {
          app.loadNextChapter(reader);
        }
      }

      if (event.deltaY != 0) {
        setTimeout(() => {
          let childArray = Array.from(reader.children);
          firstVisibleEl = childArray.find(
            (i) => i.offsetTop > reader.scrollTop
          );
          if (firstVisibleEl) {
            firstOffsetClientTop = reader.scrollTop - firstVisibleEl.offsetTop;

            app.r_reader_options.r_chapter_scroll_top_offset =
              firstOffsetClientTop;

            app.r_reader_options.r_chapter_top_element_index =
              childArray.indexOf(firstVisibleEl);

            novelOptionsChanged = true;
          }
        }, 10);
      }
    }
  }
};

//#endregion

let globalKeyboardEventFunction = function (event) {
  if (app) {
    let key = event.keyCode;
    // Ctrl+F key
    if (key == 70 && event.ctrlKey) {
      toggleFullScreen();
      return;
    }
  }
};

document.addEventListener("keydown", globalKeyboardEventFunction);

//#endregion

//#region Logging

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
    if ((app.showRenderer && app.app_options.showConsole) || verboseMode) {
      app.console.textContent =
        app.console.textContent + text + " -> " + more_text + "\r\n";
    }
  } else {
    console.log(text);
    if ((app.showRenderer && app.app_options.showConsole) || verboseMode) {
      app.console.textContent = app.console.textContent + text + "\r\n";
    }
  }
  app.console.scrollTo(0, app.console.scrollHeight);
}

/**
 * Changes the status text and logs to console when `verboseMode` is set to `true`
 * @param {string} text The text to log
 * @param {*} more_text Extra text to be displayed in the console only
 */
function logVerbose(text = "", more_text = "") {
  if (verboseMode) {
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
}

//#endregion

//#region Load/Save Configs

async function loadConfigArrayData(configName = "") {
  await loadConfigData(configName, []);
}

async function saveConfigArrayData(configName = "", callback = null) {
  await saveConfigData(configName, callback);
}

async function loadConfigData(configName = "", defaultValue = {}) {
  if (configName.trim()) {
    let configFilePath = configDirectoryAbsolutePath() + configName + ".json";
    let configFilePresent = await pathExists(configFilePath);
    if (configFilePresent) {
      let fileData = await readFile(configFilePath);
      if (app[configName]) {
        app[configName] = JSON.parse(fileData);
      }
    } else {
      if (app[configName]) {
        app[configName] = defaultValue;
      }
    }
  }
}

async function saveConfigData(configName = "", callback = null) {
  if (configName.trim()) {
    let configFilePath = configDirectoryAbsolutePath() + configName + ".json";
    if (app[configName] != null) {
      await writeFile(configFilePath, JSON.stringify(app[configName], null, 2));
      if (callback) callback();
    }
  }
}

async function loadNovelConfigData(
  guid,
  configName = "",
  defaultValue = {},
  callback = null
) {
  if (configName.trim()) {
    let configFilePath =
      novelDirectoryAbsolutePath(guid) + configName + ".json";
    let configFilePresent = await pathExists(configFilePath);
    if (configFilePresent) {
      let fileData = await readFile(configFilePath);
      if (app[configName]) {
        app[configName] = JSON.parse(fileData);
      }
    } else {
      if (app[configName]) {
        app[configName] = defaultValue;
      }
    }
    if (callback) callback();
  }
}

async function saveNovelConfigData(guid, configName = "", callback = null) {
  if (configName.trim()) {
    let configFilePath =
      novelDirectoryAbsolutePath(guid) + configName + ".json";
    if (app[configName] != null) {
      await writeFile(configFilePath, JSON.stringify(app[configName], null, 2));
      if (callback) callback();
    }
  }
}

//#endregion

//#region Electron to Browser

window.electronAPI.log((event, text, more_text = "") => {
  if (text) {
    log(text, more_text);
  }
});

//#endregion

//#region Electron API wrappers

/**
 * Returns the contents of jQuery file
 * @returns {String} The string contents of jQuery minified file
 */
function JqueryString() {
  return window.electronAPI.JqueryString();
}

function msgBox(text, caption = appName) {
  window.electronAPI.msgBox(text, caption);
}

function urlIncludesToBlock(includes = []) {
  window.electronAPI.urlIncludesToBlock(includes);
}

function toggleFullScreen() {
  window.electronAPI.toggleFullScreen();
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

/**
 * Simulate Input events to AppWindow
 * @param {string} type Event type
 * @param {*} accelerator The button to be sent
 */
async function sendInput(type = "keyDown", accelerator) {
  await window.electronAPI.sendInput(type, accelerator);
}

async function updateApp(appZipUrl) {
  return await window.electronAPI.updateApp(appZipUrl);
}

async function relaunchApp() {
  window.electronAPI.relaunchApp();
}

//#endregion

//#region Utility Functions

function configDirectoryAbsolutePath() {
  return rootDirectoryAbsolutePath + configDirectoryRelativePath;
}

function dataDirectoryAbsolutePath() {
  return rootDirectoryAbsolutePath + dataDirectoryRelativePath;
}

function coverDirectoryAbsolutePath() {
  return rootDirectoryAbsolutePath + coverDirectoryRelativePath;
}

function novelDirectoryAbsolutePath(guid = "") {
  if (guid) {
    return (
      rootDirectoryAbsolutePath + novelDirectoryRelativePath + "/" + guid + "/"
    );
  }
  return "";
}

async function loadAllConfigs() {
  let configDirPath = configDirectoryAbsolutePath();
  let configDirPresent = await pathExists(configDirPath);
  if (!configDirPresent) {
    await createDir(configDirPath);
  }

  loadConfigData("r_reader_options", {
    r_chapter_styles:
      "<style>\n    #novel-reader * {\n\n        font-size: 20px;\n\n    }\n</style>",
    displayChapterNumbers: false,
  });

  loadConfigData("app_options", {
    darkMode: true,
    showNewOnly: false,
    showCheckUpdatedOnly: false,
    showGridLayout: false,
    activeTab: 0,
    showWebPage: false,
    showTestResults: false,
    showConsole: false,
  });

  await loadConfigArrayData("rules");
  app.loading_rules = false;

  await loadConfigArrayData("novels");
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

// timer for saving app & novel options
setInterval(async () => {
  if (appOptionsChanged && app) {
    await saveConfigData("app_options");
    appOptionsChanged = false;
  }
  if (novelOptionsChanged && app && app.r_novel) {
    await saveNovelConfigData(app.r_novel.GUID, "r_reader_options");
    novelOptionsChanged = false;
  }
}, 3000);

//#endregion

//#region App Update

function getVersionNoFromString(versionText) {
  return parseInt(versionText.replace(/[(beta_)\.]/g, ""));
}

async function checkAppUpdate(showStatus = false) {
  if (showStatus) {
    log("Checking for app-update...");
  }
  app.checkingForUpdates = true;
  try {
    let data = await fetch(
      "https://api.github.com/repos/gmastergreatee/Fanfiction-Manager/releases/latest"
    ).then((e) => e.json());
    app.checkingForUpdates = false;
    if (data && data.tag_name) {
      let latestVersion = getVersionNoFromString(data.tag_name);
      let currentVersion = getVersionNoFromString(appVersion);
      if (
        latestVersion > currentVersion &&
        data.assets &&
        data.assets.length > 0
      ) {
        let appZip = data.assets.find((i) => i.name == "app.zip");
        if (appZip) {
          app.newVersionTag = data.tag_name;
          updatedAppZip = appZip;
          if (showStatus) {
            log("Update found -> " + data.tag_name);
          }
          app.showUpdateDialog();
          return;
        }
      }
      if (showStatus) {
        log("Already latest version");
      }
    }
  } catch (ex) {
    app.checkingForUpdates = false;
    if (showStatus) {
      log("Error checking app-update -> " + ex.message);
    }
    console.log(ex);
  }
}

//#endregion
