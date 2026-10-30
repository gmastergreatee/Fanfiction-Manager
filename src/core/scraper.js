// Version 4/src/core/scraper.js
/**
 * Hybrid Scraping Pipeline (Phase 2)
 * Tier 1: Fast-Path Headless HTTP Fetch with Browser Impersonation
 * Tier 2: Headless Native WebView fallback
 * Tier 3: In-App Interactive Captcha Sheet with Dynamic Cookie Sync
 */

const { URL } = require('url');

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Cookie Jar for session & clearance cookie synchronization
 */
class CookieJar {
  constructor() {
    this.cookies = new Map(); // domain -> Map(name -> { value, path, expires })
  }

  setCookie(urlStr, cookieStr) {
    try {
      const url = new URL(urlStr);
      const domain = url.hostname;
      if (!this.cookies.has(domain)) {
        this.cookies.set(domain, new Map());
      }
      const domainJar = this.cookies.get(domain);

      const parts = cookieStr.split(';').map((p) => p.trim());
      const [nameVal] = parts;
      const eqIdx = nameVal.indexOf('=');
      if (eqIdx === -1) return;

      const name = nameVal.substring(0, eqIdx).trim();
      const value = nameVal.substring(eqIdx + 1).trim();

      domainJar.set(name, { value, setAt: Date.now() });
    } catch {
      // Ignore invalid URL
    }
  }

  getCookieString(urlStr) {
    try {
      const url = new URL(urlStr);
      const domain = url.hostname;
      const domainJar = this.cookies.get(domain);
      if (!domainJar || domainJar.size === 0) return '';

      const pairs = [];
      for (const [name, entry] of domainJar.entries()) {
        pairs.push(`${name}=${entry.value}`);
      }
      return pairs.join('; ');
    } catch {
      return '';
    }
  }

  syncFromWebview(urlStr, cookies) {
    if (!Array.isArray(cookies)) return;
    for (const c of cookies) {
      if (c.name && c.value) {
        this.setCookie(urlStr, `${c.name}=${c.value}`);
      }
    }
  }

  hasClearance(urlStr) {
    try {
      const url = new URL(urlStr);
      const domainJar = this.cookies.get(url.hostname);
      return !!(domainJar && (domainJar.has('cf_clearance') || domainJar.has('cf_bm')));
    } catch {
      return false;
    }
  }
}

/**
 * Fast HTML Parsing helpers without heavyweight DOM dependencies
 */
class FastHtmlParser {
  static cleanHtml(html, stripSelectors = []) {
    let cleaned = html || '';
    // Strip script, style, iframe, noscript
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    // Strip custom ad / watermark classes
    const defaultStrips = ['ads', 'advertisement', 'pirate', 'watermark'];
    const allStrips = [...defaultStrips, ...stripSelectors];
    for (const cls of allStrips) {
      const reg = new RegExp(`<[^>]+class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>.*?<\\/[^>]+>`, 'gis');
      cleaned = cleaned.replace(reg, '');
    }

    // Clean html comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    return cleaned.trim();
  }

  static stripTags(html) {
    return (html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static extractByRegex(html, pattern, group = 1) {
    const match = new RegExp(pattern, 'i').exec(html);
    return match && match[group] ? match[group].trim() : '';
  }

  static extractAllLinks(html, baseUrl, linkPattern = null) {
    const links = [];
    const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
    let match;
    let idx = 1;

    while ((match = re.exec(html)) !== null) {
      const rawHref = match[1];
      const rawText = FastHtmlParser.stripTags(match[2]);

      if (linkPattern && !new RegExp(linkPattern, 'i').test(rawHref)) {
        continue;
      }

      try {
        const fullUrl = new URL(rawHref, baseUrl).href;
        links.push({
          index: idx++,
          title: rawText || `Chapter ${idx - 1}`,
          url: fullUrl,
        });
      } catch {
        // Skip unparseable URL
      }
    }
    return links;
  }
}

/**
 * Pre-configured Ported Rules from rules.json with Fast-Path CSS/Regex extraction
 */
const PORTED_RULES = [
  {
    guid: '5516b773-f939-4c68-89c1-4c8ba6641822',
    rule_name: 'RoyalRoad.com',
    url_regex: '(?:https://)*(?:www|m)\\.royalroad\\.com/fiction/.+',
    parser_type: 'headless',
    fast_path: {
      title_regex: '<h1[^>]*>\\s*([^<]+)\\s*</h1>',
      cover_regex: '<img[^>]+class=["\'][^"\']*img-responsive[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
      summary_regex: '<div[^>]+class=["\'][^"\']*description[^"\']*["\'][^>]*>(.*?)<\\/div>',
      chapter_link_filter: '/fiction/\\d+/[^/]+/chapter/',
      chapter_title_regex: '<h1[^>]*>\\s*([^<]+)\\s*</h1>',
      chapter_content_regex: '<div[^>]+class=["\'][^"\']*chapter-content[^"\']*["\'][^>]*>(.*?)<\\/div>\\s*<div',
    },
  },
  {
    guid: '18f77d09-fe80-4a18-9976-a9a54e480148',
    rule_name: 'ArchiveOfOurOwn.org (AO3)',
    url_regex: '(?:https://)*(?:www|m)*archiveofourown\\.org/works/([0-9]+).*',
    parser_type: 'headless',
    fast_path: {
      title_regex: '<h2[^>]+class=["\'][^"\']*title[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/h2>',
      cover_regex: null,
      summary_regex: '<blockquote[^>]+class=["\'][^"\']*userstuff[^"\']*["\'][^>]*>(.*?)<\\/blockquote>',
      chapter_link_filter: '/works/\\d+/chapters/\\d+',
      chapter_title_regex: '<h3[^>]+class=["\'][^"\']*title[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/h3>',
      chapter_content_regex: '<div[^>]+class=["\'][^"\']*userstuff[^"\']*["\'][^>]*>(.*?)<\\/div>',
    },
  },
  {
    guid: 'bf04cf84-1bfc-4233-9fa7-19871eaca783',
    rule_name: 'Fanfiction.net',
    url_regex: '(?:https://)*(?:www|m)\\.fanfiction\\.net/([a-z]+)/([0-9]+)/([0-9]+)/(?:[a-zA-Z0-9-]+)',
    parser_type: 'webview',
    fast_path: {
      title_regex: '<b[^>]+class=["\'][^"\']*xcontrast_txt[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/b>',
      cover_regex: '<img[^>]+class=["\'][^"\']*cimage[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
      summary_regex: '<div[^>]+class=["\'][^"\']*xcontrast_txt[^"\']*["\'][^>]*>(.*?)<\\/div>',
      chapter_link_filter: null,
      chapter_title_regex: '<option[^>]+selected[^>]*>\\s*([^<]+)\\s*<\\/option>',
      chapter_content_regex: '<div[^>]+class=["\'][^"\']*storytext[^"\']*["\'][^>]*>(.*?)<\\/div>',
    },
  },
  {
    guid: 'c6f1562f-2f0a-441b-861c-9255b7192455',
    rule_name: 'LightNovelWorld.com',
    url_regex: '(?:https://)*(?:www\\.)*(lightnovelworld)\\.com/novel/',
    parser_type: 'headless',
    fast_path: {
      title_regex: '<h1[^>]*>\\s*([^<]+)\\s*</h1>',
      cover_regex: '<img[^>]+src=["\']([^"\']+)["\'][^>]*class=["\'][^"\']*glass-background',
      summary_regex: '<div[^>]+class=["\'][^"\']*summary[^"\']*["\'][^>]*>(.*?)<\\/div>',
      chapter_link_filter: '/chapter-',
      chapter_title_regex: '<span[^>]+class=["\'][^"\']*chapter-title[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/span>',
      chapter_content_regex: '<div[^>]+id=["\']chapter-container["\'][^>]*>(.*?)<\\/div>',
    },
  },
  {
    guid: '340044b7-321e-4fe8-8c15-9c59e22f6fc8',
    rule_name: 'Wattpad.com',
    url_regex: '(?:https://)*(?:www|m|t)\\.wattpad\\.com/((?:text-)([0-9]*)-([0-9]*)-([a-z0-9]*)|(?:story/)([0-9]*)|([0-9]*)).*',
    parser_type: 'headless',
    fast_path: {
      title_regex: '<h1[^>]*>\\s*([^<]+)\\s*</h1>',
      cover_regex: '<img[^>]+class=["\'][^"\']*cover[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
      summary_regex: '<h2[^>]+class=["\'][^"\']*description[^"\']*["\'][^>]*>(.*?)<\\/h2>',
      chapter_link_filter: null,
      chapter_title_regex: '<h1[^>]+class=["\'][^"\']*h2[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/h1>',
      chapter_content_regex: '<pre[^>]*>(.*?)<\\/pre>',
    },
  },
  {
    guid: '4795a493-2a6e-4234-8dec-307b06129cd6',
    rule_name: 'WebNovel.com',
    url_regex: '(?:https://)*(?:www|m)\\.webnovel\\.com/([a-z]+)/([0-9a-z\\-A-Z~!\\(\\)%\'\\.]+)_([0-9]+)',
    parser_type: 'webview',
    fast_path: {
      title_regex: '<h1[^>]*>\\s*([^<]+)\\s*</h1>',
      cover_regex: '<div[^>]+class=["\'][^"\']*det-info[^"\']*["\'][^>]*>\\s*<img[^>]+src=["\']([^"\']+)["\']',
      summary_regex: '<div[^>]+class=["\'][^"\']*det-abt[^"\']*["\'][^>]*>(.*?)<\\/div>',
      chapter_link_filter: null,
      chapter_title_regex: '<h1[^>]+class=["\'][^"\']*cha-tit[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/h1>',
      chapter_content_regex: '<div[^>]+class=["\'][^"\']*cha-content[^"\']*["\'][^>]*>(.*?)<\\/div>',
    },
  },
  {
    guid: 'c9b65e52-a0d3-4e84-b46a-e782f93e3c35',
    rule_name: 'TechTeach4U.com',
    url_regex: '(?:https://)*(?:www\\.)*techteach4u\\.com/series/.*',
    parser_type: 'headless',
    fast_path: {
      title_regex: '<h1[^>]+class=["\'][^"\']*entry-title[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/h1>',
      cover_regex: '<img[^>]+class=["\'][^"\']*wp-post-image[^"\']*["\'][^>]+src=["\']([^"\']+)["\']',
      summary_regex: '<div[^>]+class=["\'][^"\']*entry-content[^"\']*["\'][^>]*>(.*?)<\\/div>',
      chapter_link_filter: '/chapter-',
      chapter_title_regex: '<h1[^>]+class=["\'][^"\']*title[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/h1>',
      chapter_content_regex: '<div[^>]+class=["\'][^"\']*epcontent[^"\']*["\'][^>]*>(.*?)<\\/div>',
    },
  },
  {
    guid: '1456f9af-ab7e-4f5f-b441-77a30ede82b5',
    rule_name: 'COMRADEMAO',
    url_regex: '(?:https?://)?(?:(?:www|m)\\.)*comrademao\\.com/novel/.*',
    parser_type: 'headless',
    fast_path: {
      title_regex: '<h1[^>]*>\\s*([^<]+)\\s*</h1>',
      cover_regex: '<div[^>]+class=["\'][^"\']*seriedetailcontent[^"\']*["\'][^>]*>\\s*<img[^>]+src=["\']([^"\']+)["\']',
      summary_regex: '<div[^>]+class=["\'][^"\']*infox[^"\']*["\'][^>]*>(.*?)<\\/div>',
      chapter_link_filter: null,
      chapter_title_regex: '<div[^>]+class=["\'][^"\']*doc_header[^"\']*["\'][^>]*>\\s*([^<]+)\\s*<\\/div>',
      chapter_content_regex: '<div[^>]+id=["\']chaptercontent["\'][^>]*>(.*?)<\\/div>',
    },
  },
];

/**
 * Unified Scraping Pipeline Engine
 */
class ScrapingPipeline {
  constructor(options = {}) {
    this.cookieJar = new CookieJar();
    this.rules = [...PORTED_RULES, ...(options.customRules || [])];
    this.db = options.db || null;
    this.defaultHeaders = {
      'User-Agent': DEFAULT_USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-CH-UA': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  matchRule(url) {
    for (const rule of this.rules) {
      if (new RegExp(rule.url_regex, 'i').test(url)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Performs an HTTP fetch with browser impersonation headers and cookie jar
   */
  async fetchWithImpersonation(url, customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    const cookieHeader = this.cookieJar.getCookieString(url);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, { headers, redirect: 'follow' });
    const status = response.status;
    const body = await response.text();

    // Check Set-Cookie headers
    if (response.headers.getSetCookie) {
      for (const c of response.headers.getSetCookie()) {
        this.cookieJar.setCookie(url, c);
      }
    } else if (response.headers.get('set-cookie')) {
      this.cookieJar.setCookie(url, response.headers.get('set-cookie'));
    }

    const challenge = this.detectChallenge(status, body);

    return {
      status,
      url: response.url || url,
      body,
      challenge,
    };
  }

  detectChallenge(status, body) {
    const lower = (body || '').toLowerCase();
    if (status === 429) return 'rate_limited';

    const isChallengeScreen =
      lower.includes('just a moment...') ||
      lower.includes('checking your browser before accessing') ||
      lower.includes('cf-browser-verification') ||
      lower.includes('challenge-running');

    if (
      (status === 403 || status === 503 || isChallengeScreen) &&
      (lower.includes('cf-turnstile') || lower.includes('challenges.cloudflare.com'))
    ) {
      return 'cloudflare_turnstile';
    }
    if (
      isChallengeScreen ||
      lower.includes('enable javascript and cookies to continue')
    ) {
      return 'cloudflare_ray';
    }
    if ((status === 403 || status === 503) && (lower.includes('cloudflare') || lower.includes('ddos-guard'))) {
      return 'access_denied';
    }
    return null;
  }

  /**
   * Tier 1 Fast-Path TOC Extractor
   */
  async extractToc(url) {
    const rule = this.matchRule(url);
    const resp = await this.fetchWithImpersonation(url);

    if (resp.challenge) {
      return {
        success: false,
        requires_tier3_captcha: true,
        challenge_type: resp.challenge,
        url,
      };
    }

    const fastPath = rule?.fast_path || {};
    const title =
      FastHtmlParser.extractByRegex(resp.body, fastPath.title_regex || '<h1[^>]*>\\s*([^<]+)\\s*<\\/h1>') ||
      'Untitled Novel';
    const coverUrl = fastPath.cover_regex ? FastHtmlParser.extractByRegex(resp.body, fastPath.cover_regex) : '';
    const summaryRaw = fastPath.summary_regex
      ? FastHtmlParser.extractByRegex(resp.body, fastPath.summary_regex)
      : '';
    const summary = FastHtmlParser.cleanHtml(summaryRaw);

    const chapterLinks = FastHtmlParser.extractAllLinks(resp.body, resp.url, fastPath.chapter_link_filter);

    return {
      success: true,
      data: {
        title,
        cover_url: coverUrl ? new URL(coverUrl, resp.url).href : '',
        summary,
        total_chapters: chapterLinks.length,
        chapters: chapterLinks,
      },
    };
  }

  /**
   * Tier 1 Fast-Path Chapter Content Extractor
   */
  async extractChapter(url) {
    const rule = this.matchRule(url);
    const resp = await this.fetchWithImpersonation(url);

    if (resp.challenge) {
      return {
        success: false,
        requires_tier3_captcha: true,
        challenge_type: resp.challenge,
        url,
      };
    }

    const fastPath = rule?.fast_path || {};
    const title =
      FastHtmlParser.extractByRegex(resp.body, fastPath.chapter_title_regex || '<h1[^>]*>\\s*([^<]+)\\s*<\\/h1>') ||
      'Chapter';
    const contentRaw = fastPath.chapter_content_regex
      ? FastHtmlParser.extractByRegex(resp.body, fastPath.chapter_content_regex)
      : resp.body;
    const cleanedContent = FastHtmlParser.cleanHtml(contentRaw);
    const plainText = FastHtmlParser.stripTags(cleanedContent);
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      data: {
        title,
        content_html: cleanedContent,
        word_count: wordCount,
      },
    };
  }

  /**
   * Synchronize cookies from WebView Captcha resolution (Tier 3)
   */
  syncCookies(url, cookies) {
    this.cookieJar.syncFromWebview(url, cookies);
  }
}

module.exports = {
  DEFAULT_USER_AGENT,
  CookieJar,
  FastHtmlParser,
  PORTED_RULES,
  ScrapingPipeline,
};
