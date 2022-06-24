window.addEventListener("DOMContentLoaded", () => {
  //   document.querySelectorAll(".slide-right").forEach((el) => {
  //     el.addEventListener("mousedown", (e) => {
  //         e.
  //     });
  //   });
});

let debugMode = true;
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
return 0;`,
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

return retMe;`,
  },
];

let default_TOC_Code = `let retMe = {
  'Title': 'novel name here',
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
    "nextURL": ""
  },
];

return retMe;`;

app = new Vue({
  el: "#main",
  mounted() {
    this.resetTestFields();
    this.mainWebView = document.getElementById("mainWebView");

    this.mainWebView.addEventListener("did-start-loading", () => {
      this.iframe_working = true;
    });
    this.mainWebView.addEventListener("did-stop-loading", () => {
      this.iframe_working = false;
    });
  },
  data() {
    return {
      darkMode: true,

      //......... Main variables
      mainWebView: null,
      tabs: ["Library", "Rules", "Tester"],
      activeTab: 2,
      showIframe: true,
      showTestResults: true,

      //......... tester related

      test_url: "",
      test_rule_name: "",
      test_url_regex: "",
      test_pagetype_code: "",
      test_toc_code: default_TOC_Code,
      test_chapter_code: default_Chapter_Code,

      test_result_page_type: "NA",
      test_result_content: "",

      //.........

      iframe_working: true,
      iframe_url: "",
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
      this.activeTab = tabIndex;
    },
    toggleRenderer() {
      this.showIframe = !this.showIframe;
    },
    toggleTestResults() {
      this.showTestResults = !this.showTestResults;
    },
    resetTestFields() {
      if (!debugMode) {
        this.test_rule_name = "";
        this.test_url_regex = "";
        this.test_url = "";
        this.test_pagetype_code = "";
        this.test_toc_code = default_TOC_Code;
        this.test_chapter_code = default_Chapter_Code;
      } else {
        let testRule = debugTestVals[debugTestIndex];
        this.test_rule_name = testRule.rule_name;
        this.test_url_regex = testRule.url_regex;
        this.test_url = testRule.test_url;
        this.test_pagetype_code = testRule.page_type_code;
        this.test_toc_code = testRule.toc_code;
        this.test_chapter_code = testRule.chapter_code;
      }
      this.test_result_page_type = "NA";

      this.iframe_url = "";
      this.iframe_working = true;
    },
    loadTestURL() {
      if (this.test_url.trim()) {
        if (this.test_url != this.iframe_url) {
          this.iframe_url = this.test_url.trim();
        } else {
          this.mainWebView.reload();
        }
      }
    },
    openRendererDevTools() {
      try {
        if (!this.mainWebView.isDevToolsOpened()) {
          this.mainWebView.openDevTools();
        } else {
          this.mainWebView.closeDevTools();
        }
      } catch {
        alert("Please load an URL before opening DevTools");
      }
    },
    evaluateJavascriptCode(script = "") {
      return "(function(){" + script + "})()";
    },
    async runTestTOCScript() {
      try {
        let data = await this.mainWebView.executeJavaScript(
          this.evaluateJavascriptCode(this.test_toc_code)
        );
        if (data) {
          this.test_result_content =
            "<pre>" + JSON.stringify(data, null, 4) + "</pre>";
        } else alert("No data received");
      } catch {
        alert(
          "Error executing script.\nMake sure an URL is already loaded & the script is valid.\n\nCheck DevTools for more details."
        );
      }
    },
    async runTestChapterScript() {
      try {
        let data = await this.mainWebView.executeJavaScript(
          this.evaluateJavascriptCode(this.test_chapter_code)
        );
        if (data && data.length > 0) {
          this.test_result_content = data[0].content;
        } else alert("No data received");
      } catch {
        alert(
          "Error executing script.\nMake sure an URL is already loaded & the script is valid.\n\nCheck DevTools for more details."
        );
      }
    },
    saveTestRule() {
      // ... save rule code
    },
  },
  computed: {
    showRenderer() {
      return this.showIframe && this.activeTabStr != "Rules";
    },
    activeTabStr() {
      return this.tabs[this.activeTab];
    },
  },
});
