// Version 4/src/core/rule-sync.js
/**
 * Remote Rule Sync Engine for Fanfiction Manager Version 4
 * Checks remote GitHub rule repository for updates, compares versions,
 * merges improvements, and supports QR/JSON cross-device rule imports.
 */

const https = require('https');
const http = require('http');

class RuleSyncManager {
  constructor(options = {}) {
    this.db = options.db;
    this.remoteUrl =
      options.remoteUrl ||
      'https://raw.githubusercontent.com/fanfiction-manager/rules-v4/main/rules.json';
  }

  /**
   * Fetch rules from a remote URL with timeout and fallback
   */
  async fetchRemoteRules(url = this.remoteUrl) {
    return new Promise((resolve, reject) => {
      // If mock test data passed or protocol is simulated
      if (Array.isArray(url)) {
        return resolve(url);
      }

      try {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'FanfictionManager-v4' } }, (res) => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Remote rule server responded with status: ${res.statusCode}`));
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(Array.isArray(parsed) ? parsed : parsed.rules || []);
            } catch (e) {
              reject(new Error(`Failed to parse remote rules JSON: ${e.message}`));
            }
          });
        });

        req.on('error', (err) => reject(err));
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Rule sync request timed out (5000ms)'));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Sync rules with local database: inserts new rules, updates older versions
   */
  async syncRules(remoteRulesSource) {
    if (!this.db) {
      throw new Error('Database client instance required for syncRules');
    }

    let remoteRules = [];
    if (Array.isArray(remoteRulesSource)) {
      remoteRules = remoteRulesSource;
    } else {
      try {
        remoteRules = await this.fetchRemoteRules(remoteRulesSource);
      } catch (err) {
        // Fallback to built-in rules if remote network is offline
        remoteRules = this.getBuiltInRuleCatalog();
      }
    }

    const localRules = this.db.getAllRules();
    const localMap = new Map();
    for (const r of localRules) {
      localMap.set(r.guid, r);
    }

    const report = {
      checked: remoteRules.length,
      added: 0,
      updated: 0,
      upToDate: 0,
      rules: [],
    };

    for (const remote of remoteRules) {
      if (!remote.guid || !remote.rule_name || !remote.url_regex) continue;

      const local = localMap.get(remote.guid);
      if (!local) {
        // New rule to install
        this.db.saveRule(remote);
        report.added++;
        report.rules.push({ name: remote.rule_name, status: 'added', version: remote.version || 1 });
      } else if ((remote.version || 1) > (local.version || 1)) {
        // Updated rule version found
        this.db.saveRule(remote);
        report.updated++;
        report.rules.push({
          name: remote.rule_name,
          status: 'updated',
          oldVersion: local.version,
          newVersion: remote.version,
        });
      } else {
        report.upToDate++;
      }
    }

    return report;
  }

  /**
   * Built-in fallback catalog of verified rules
   */
  getBuiltInRuleCatalog() {
    return [
      {
        guid: 'fanfiction-net-official',
        rule_name: 'FanFiction.net',
        url_regex: 'fanfiction\\.net\\/s\\/.*',
        parser_type: 'webview',
        version: 6,
        pagetype_code: 'return 0;',
        toc_code: `const titleEl = document.querySelector('#profile_top b.xcontrast_txt');
return {
  Title: titleEl ? titleEl.innerText.trim() : 'Unknown Title',
  CoverURL: '',
  ChapterCount: 1,
  ChapterURLs: [window.location.href]
};`,
        chapter_code: `const contentEl = document.querySelector('#storytext');
return [{
  title: document.querySelector('#chap_select option:checked')?.innerText || '',
  content: contentEl ? contentEl.innerHTML : '',
  nextURL: ''
}];`,
      },
      {
        guid: 'royalroad-official',
        rule_name: 'RoyalRoad.com',
        url_regex: 'royalroad\\.com\\/fiction\\/.*',
        parser_type: 'headless',
        version: 3,
        pagetype_code: 'return 0;',
        toc_code: `const titleEl = document.querySelector('h1');
const chapters = Array.from(document.querySelectorAll('tbody tr a[href*="/chapter/"]')).map(a => a.href);
return {
  Title: titleEl ? titleEl.innerText.trim() : '',
  CoverURL: document.querySelector('.thumbnail')?.src || '',
  ChapterCount: chapters.length,
  ChapterURLs: chapters
};`,
        chapter_code: `const contentEl = document.querySelector('.chapter-inner');
return [{
  title: document.querySelector('h1')?.innerText || '',
  content: contentEl ? contentEl.innerHTML : '',
  nextURL: ''
}];`,
      },
      {
        guid: 'webnovel-official',
        rule_name: 'WebNovel.com',
        url_regex: 'webnovel\\.com\\/book\\/.*',
        parser_type: 'headless',
        version: 4,
        pagetype_code: 'return 0;',
        toc_code: `return { Title: document.querySelector('h1')?.innerText || '', ChapterCount: 1, ChapterURLs: [] };`,
        chapter_code: `return [{ title: 'Chapter', content: document.querySelector('.cha-words')?.innerHTML || '', nextURL: '' }];`,
      },
    ];
  }
}

module.exports = RuleSyncManager;

