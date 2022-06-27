let appName = "Novel Downloader v3";
let verboseMode = false;

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

let debugReadingMode = false;

// --------------------------------------------------------------------------------------------------------------------

let dummyPageUrl = "./dummy.html";

let configDirectoryPath = "/config/";
let dataDirectoryPath = "/data/";
let coverDirectoryPath = dataDirectoryPath + "covers/";
let novelDirectoryPath = dataDirectoryPath + "novels/";

let globalCallbacks = {};

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

const fileDownloader = function (context) {
  if (context === void 0) {
    context = null;
  }
  var urlFileMaps = [];
  var callBackName = null;
  return {
    addEntry: function (url, filePath) {
      urlFileMaps.push({
        url: url,
        path: filePath,
        done: false,
      });
    },
    download: function (_callbackName = "file_0") {
      if (urlFileMaps.length > 0) {
        callBackName = _callbackName;
        globalCallbacks[callBackName] = this.recurse;
        log(
          "[1/" + urlFileMaps.length + "] File Downloading",
          urlFileMaps[0].url
        );
        downloadFile(urlFileMaps[0].url, urlFileMaps[0].path, 0, callBackName);
      }
    },
    recurse: function (fileDownloadStatus) {
      let index = fileDownloadStatus.index;
      let fileStatus = fileDownloadStatus.fileStatus;

      if (index != null && fileStatus != null) {
        urlFileMaps[index].done = fileStatus;
        if (!fileStatus) {
          log("File Download Error", urlFileMaps[index].url);
        }
        index++;
        if (index < urlFileMaps.length) {
          log(
            "[" + (index + 1) + "/" + urlFileMaps.length + "] File Downloading",
            urlFileMaps[0].url
          );
          downloadFile(
            urlFileMaps[index].url,
            urlFileMaps[index].path,
            index,
            callBackName
          );
        } else {
          globalCallbacks[callBackName] = null;
          log("All Files Downloaded");
        }
      }
    },
  };
};

let onMainWebViewLoadedEvent = simpleEvent();
let rootDirectory = "";

app = new Vue({
  el: "#main",
  async mounted() {
    rootDirectory = await rootDir();

    if (debugReadingMode) {
      this.reading_mode = true;
      this.r_novel = {
        CoverURL: "./data/covers/7d466fe2-210a-4ce7-bd08-86ab4955e728.png",
        Title: "Reincarnation Of Overlord",
        Summary:
          "What if Suzuki Satoru gets reincarnated in the new world. What will happen ? Will he take the path of Overlord ? Or will he create his own path ? (Being rewritten)",
        ChapterCount: 5,
        ChapterURLs: [
          "https://www.fanfiction.net/s/13861458/1/Reincarnation-Of-Overlord",
          "https://www.fanfiction.net/s/13861458/2/Reincarnation-Of-Overlord",
          "https://www.fanfiction.net/s/13861458/3/Reincarnation-Of-Overlord",
          "https://www.fanfiction.net/s/13861458/4/Reincarnation-Of-Overlord",
          "https://www.fanfiction.net/s/13861458/5/Reincarnation-Of-Overlord",
        ],
        GUID: "7d466fe2-210a-4ce7-bd08-86ab4955e728",
        URL: "https://www.fanfiction.net/s/13861458/1/Reincarnation-Of-Overlord",
        DownloadedCount: 5,
        CheckUpdates: true,
      };
      this.loadChapters();
    }

    loadAllConfigs();
    this.mainWebView = document.getElementById("mainWebView");
    this.console = document.getElementById("web-console");

    this.mainWebView.addEventListener("did-start-loading", () => {
      if (!this.iframe_url.endsWith(dummyPageUrl)) {
        if (this.isTabActive("Tester")) {
          log("Loading url", this.iframe_url);
        } else logVerbose("Loading url", this.iframe_url);
      }
    });
    this.mainWebView.addEventListener("dom-ready", () => {
      this.mainWebView.stop();
      if (!this.mainWebView.getURL().endsWith(dummyPageUrl)) {
        let curr_url = this.mainWebView.getURL();
        if (!curr_url.endsWith("dummy.html")) {
          if (this.isTabActive("Tester")) {
            log("Url loaded", this.mainWebView.getURL());
          } else logVerbose("Url loaded", this.mainWebView.getURL());
        }
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

      //......... Reader
      reading_mode: false,
      r_novel: null,
      loading_chapters: false,
      r_chapters: [],
      r_chapter_index: 0,
      r_chapterIndex_loaded: [],

      //......... Main variables
      mainWebView: null,
      console: null,
      tabs: ["Library", "Rules", "Tester"],
      activeTab: 0,

      showWebPage: false,
      showTestResults: false,
      showConsole: true,

      //......... Library

      showNewOnly: false,
      showCheckUpdatedOnly: false,
      showGridLayout: false,
      summaryExpandedGUID: "",

      //......... Add Novel

      add_novel_url: "",
      temp_detailing_novel: null,
      detailing_novel: null,

      //......... downloader

      d_novel: null,
      stop_download_update_novel: false,

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
      let sleepCode =
        "function sleep(ms) {return new Promise((resolve) => {setTimeout(resolve, ms);});}\n";
      return "(async function(){" + sleepCode + script + "})()";
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
          this.rules.unshift({
            guid: guid(),
            rule_name: this.test_rule_name,
            url_regex: this.test_url_regex,
            pagetype_code: this.test_pagetype_code,
            toc_code: this.test_toc_code,
            chapter_code: this.test_chapter_code,
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
        });
      }
      saveConfigData("rules");
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
          saveConfigData("rules");
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
      } catch {
        msgBox("Please enter a valid URL");
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

      let onTOCPageConfirmed = async () => {
        try {
          logVerbose("Running TOC Script...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.toc_code)
          );
          if (data) {
            data["GUID"] = guid();
            if (data.CoverURL) {
              try {
                new URL(data.CoverURL);
                let cover_file_name = data["GUID"] + ".png";
                let cover_file_path =
                  rootDirectory + coverDirectoryPath + cover_file_name;
                let downloader = fileDownloader();
                downloader.addEntry(data.CoverURL, cover_file_path);
                downloader.download();
                data.CoverURL = "." + coverDirectoryPath + cover_file_name;
              } catch {
                data.CoverURL = "";
              }
            }
            data["URL"] = t_url;
            data["DownloadedCount"] = 0;
            data["CheckUpdates"] = true;
            this.novels.unshift(data);
            saveConfigData("novels");
            logVerbose("TOC data retrieved");
            log("Added novel -> " + data.Title);
            this.add_novel_url = "";
            this.iframe_url = dummyPageUrl;
          } else log("Error");
        } catch (ex) {
          log("Error");
        }
        this.iframe_working = false;
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
                onMainWebViewLoadedEvent.clearAllListeners();
                logVerbose("TOC page found");
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
            pathExists(rootDirectory + cover_url_from_root_path).then(
              async (e) => {
                if (e) {
                  await deletePath(rootDirectory + cover_url_from_root_path);
                }
              }
            );
          }
          if (this.novels.splice(index, 1).length > 0) {
            saveConfigData("novels");
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
      await saveConfigData("novels");
    },
    toggleNewOnly() {
      this.showNewOnly = !this.showNewOnly;
    },
    toggleCheckUpdatedOnly() {
      this.showCheckUpdatedOnly = !this.showCheckUpdatedOnly;
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
    async downloadUpdateNovel(t_novel) {
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
      } catch {
        msgBox("Please fix the URL for the novel");
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

      let novel_folder = t_novel.GUID + "/";
      let chapter_urls = t_novel.ChapterURLs;
      let urls_to_download = [];
      for (let i = 0; i < chapter_urls.length; i++) {
        let doesChapterFileExist = await pathExists(
          rootDirectory + novelDirectoryPath + novel_folder + (i + 1) + ".json"
        );
        if (!doesChapterFileExist) {
          urls_to_download.push({ index: i, url: chapter_urls[i] });
        }
      }

      if (urls_to_download.length <= 0) {
        log("Already up to date");
        t_novel.DownloadedCount = t_novel.ChapterCount;
        saveConfigData("novels");
        this.iframe_working = false;
        return;
      }

      this.d_novel = t_novel;
      let curr_url_index = 0;

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
            }
            t_url_origin = new URL(curr_url).origin;
          }

          logVerbose("Checking page-type...");
          let data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.pagetype_code)
          );
          if (data || data == 0) {
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
                log("Unknown page-type");
                onMainWebViewLoadedEvent.clearAllListeners();
                this.d_novel = null;
                this.iframe_working = false;
            }
            if (skipDownload) {
              return;
            }
          } else {
            log("Unknown page-type");
            onMainWebViewLoadedEvent.clearAllListeners();
            this.d_novel = null;
            this.iframe_working = false;
            return;
          }

          logVerbose("Running Chapter Script...");
          data = await this.mainWebView.executeJavaScript(
            this.getEvaluateJavascriptCode(t_rule.chapter_code)
          );
          let t_c_url = urls_to_download[curr_url_index];
          if (data && data.length > 0) {
            let next_url = "";
            for (let i = 0; i < data.length; i++) {
              let chapter_file_path =
                rootDirectory +
                novelDirectoryPath +
                novel_folder +
                (t_c_url.index + i + 1) +
                ".json";
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
                this.stop_download_update_novel = false;
                saveConfigData("novels");
                log("Downloading stopped");
                onMainWebViewLoadedEvent.clearAllListeners();
                this.d_novel = null;
                this.iframe_working = false;
              }
            } else {
              saveConfigData("novels");
              log("All chapters downloaded");
              onMainWebViewLoadedEvent.clearAllListeners();
              this.d_novel = null;
              this.iframe_working = false;
            }
          } else {
            log(
              "Error downloading chapter (" +
                (t_c_url.index + 1) +
                ") - " +
                t_c_url.url,
              data
            );
            onMainWebViewLoadedEvent.clearAllListeners();
            this.d_novel = null;
            this.iframe_working = false;
          }
        } catch (ex) {
          log("File API Error");
          onMainWebViewLoadedEvent.clearAllListeners();
          this.d_novel = null;
          this.iframe_working = false;
        }
      };

      t_url = urls_to_download[curr_url_index].url;
      onMainWebViewLoadedEvent.clearAllListeners();
      onMainWebViewLoadedEvent.addListener(onLoadCallback);
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
    stopDownloadUpdateNovel() {
      this.stop_download_update_novel = true;
    },
    //#endregion
    //#region Reading Mode
    enterReadingMode(t_novel) {
      this.reading_mode = true;
      this.r_novel = t_novel;
      this.loadChapters();
      document.title = this.r_novel.Title;
    },
    async loadChapters() {
      this.loading_chapters = true;
      this.r_chapters = Array.apply(
        null,
        Array(this.r_novel.ChapterURLs.length)
      ).fill(null);

      let chapter_urls = this.r_novel.ChapterURLs;
      let novel_directory =
        rootDirectory + novelDirectoryPath + this.r_novel.GUID + "/";
      this.r_chapterIndex_loaded = [];

      for (let i = 0; i < chapter_urls.length; i++) {
        if (
          this.r_chapter_index > i &&
          !this.r_chapterIndex_loaded.includes(this.r_chapter_index)
        ) {
          if (this.r_chapters[this.r_chapter_index] == null) {
            let chapter_file_name =
              novel_directory + (this.r_chapter_index + 1) + ".json";
            let chapter_file_exist = await pathExists(chapter_file_name);
            if (chapter_file_exist) {
              let data = await readFile(chapter_file_name);
              this.r_chapters[this.r_chapter_index] = JSON.parse(data);
            }
            this.r_chapterIndex_loaded.push(this.r_chapter_index);
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
        return chapter.title;
      }

      return "Chapter " + (index + 1).toString();
    },
    setReadingChapterIndex(index = 0) {
      this.r_chapter_index = index;
      document.getElementById("novel-reader").scrollTo(0, 0);
    },
    exitReadingMode() {
      this.reading_mode = false;
      this.r_novel = null;
      this.loading_chapters = false;
      this.r_chapters = [];
      this.r_chapter_index = 0;
      document.title = appName;
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
    //#region Library
    getNovels() {
      return this.novels.filter(
        (i) =>
          (this.showNewOnly
            ? i.DownloadedCount < i.ChapterCount || i.ChapterCount <= 0
            : true) && (this.showCheckUpdatedOnly ? i.CheckUpdates : true)
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
        return chapter.title;
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

      return "Oops! You shouldn't view this message. Report if you do. Submit the 'data' and 'config' folder too.";
    },
    //#endregion
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

async function loadAllConfigs() {
  let root = rootDirectory;
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
    let root = rootDirectory;
    let configFilePath = root + configDirectoryPath + configFileName + ".json";
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

async function saveConfigData(configFileName = "", callback = null) {
  if (configFileName.trim()) {
    let root = rootDirectory;
    let configFilePath = root + configDirectoryPath + configFileName + ".json";
    if (app[configFileName] != null) {
      await writeFile(
        configFilePath,
        JSON.stringify(app[configFileName], null, 2)
      );
      if (callback) callback();
    }
  }
}

// -------- main to renderer

window.electronAPI.log((event, text, more_text = "") => {
  if (text) {
    log(text, more_text);
  }
});

window.electronAPI.callGlobalCallBack((event, callBackName, data) => {
  let cb = globalCallbacks[callBackName];
  if (cb) {
    cb(data);
  }
});

//#region Electron API wrappers

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
 * Downloads the file and saves it to the provided destination
 * @param {string} url The URL of the file to download
 * @param {string} filePath Download destination filepath
 */
async function downloadFile(
  url,
  filePath,
  index = 0,
  globalCallBackName = null
) {
  await window.electronAPI.downloadFile(
    url,
    filePath,
    index,
    globalCallBackName
  );
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
