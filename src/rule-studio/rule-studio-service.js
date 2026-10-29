// Version 4/src/rule-studio/rule-studio-service.js
/**
 * Unified Rule Studio Service
 * Manages the 4 Rule Creation Modes across Desktop & Mobile:
 *   1. Visual "Tap-to-Select" Picker (All platforms)
 *   2. AI Assistant via MCP (All platforms)
 *   3. Community Hub & QR Sync (All platforms)
 *   4. Advanced Code Editor + Native DevTools (Windows, Linux, macOS)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class RuleStudioService {
  constructor(options = {}) {
    this.db = options.db;
    this.platform = options.platform || process.platform;
  }

  /**
   * Mode 1: Compile visually tapped selectors into executable scraping rules
   */
  compileVisualSelectorsToRule(domain, selectors = {}) {
    const guid = crypto.randomUUID();
    const titleSel = selectors.title || 'h1';
    const coverSel = selectors.cover || 'img.cover';
    const chapterLinkSel = selectors.chapters || 'a[href*="/chapter"]';
    const contentSel = selectors.content || '.chapter-content';

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const ruleName = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
    const urlRegex = `(?:https?:\\/\\/)*(?:www\\.)*${cleanDomain.replace(/\./g, '\\.')}\\/.*`;

    // Generated TOC extraction script
    const tocCode = `
const titleEl = document.querySelector('${titleSel}');
const coverEl = document.querySelector('${coverSel}');
const chapterEls = Array.from(document.querySelectorAll('${chapterLinkSel}'));

return {
  Title: titleEl ? titleEl.innerText.trim() : 'Unknown Title',
  CoverURL: coverEl ? (coverEl.src || coverEl.getAttribute('data-src') || '') : '',
  Summary: document.querySelector('.summary, .description') ? document.querySelector('.summary, .description').innerText.trim() : '',
  ChapterCount: chapterEls.length,
  ChapterURLs: chapterEls.map(a => a.href),
};
`.trim();

    // Generated Chapter extraction script
    const chapterCode = `
const contentEl = document.querySelector('${contentSel}');
const titleEl = document.querySelector('h1, h2, .chapter-title');

return [{
  title: titleEl ? titleEl.innerText.trim() : '',
  content: contentEl ? contentEl.innerHTML : '',
  nextURL: ''
}];
`.trim();

    return {
      guid,
      rule_name: ruleName,
      url_regex: urlRegex,
      parser_type: 'headless',
      pagetype_code: 'return 0;',
      toc_code: tocCode,
      chapter_code: chapterCode,
      url_blocks: 'googleads\nadsbygoogle\nanalytics\nfacebook',
      version: 1,
    };
  }

  /**
   * Mode 4 (Desktop Only): Toggle Native DevTools for Windows, Linux, and macOS
   */
  toggleDesktopDevTools(webContents) {
    if (this.isMobile()) {
      return { supported: false, message: 'Native DevTools are only supported on Windows, Linux, and macOS.' };
    }
    if (!webContents) {
      return { supported: false, message: 'No active webContents provided.' };
    }

    if (webContents.isDevToolsOpened()) {
      webContents.closeDevTools();
      return { supported: true, state: 'closed' };
    } else {
      webContents.openDevTools({ mode: 'detach' });
      return { supported: true, state: 'opened' };
    }
  }

  /**
   * Helper: Check if running on mobile
   */
  isMobile() {
    return this.platform === 'android' || this.platform === 'ios';
  }

  /**
   * Mode 3: Export rule to shareable JSON payload / QR code data
   */
  exportRuleForSync(guid) {
    const rule = this.db ? this.db.getRuleByGuid(guid) : null;
    if (!rule) throw new Error(`Rule not found for GUID: ${guid}`);
    return {
      schema: 'ffm-rule-v4',
      exported_at: new Date().toISOString(),
      rule,
    };
  }

  /**
   * Mode 3: Import rule from QR code string or JSON payload
   */
  importRuleFromSync(payload) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!data.rule || !data.rule.url_regex) {
      throw new Error('Invalid rule sync payload.');
    }
    if (this.db) {
      this.db.saveRule(data.rule);
    }
    return { success: true, ruleName: data.rule.rule_name, guid: data.rule.guid };
  }
}

module.exports = RuleStudioService;

