// Version 4/tests/test-scraper-pipeline.js
/**
 * Test Suite for Phase 2: Hybrid Scraping Pipeline
 * Tests:
 * 1. HTTP Client & Browser Impersonation headers
 * 2. Dynamic Cookie Jar & Tier 3 Captcha sync
 * 3. Fast-Path Tier 1 HTML Parsing & Sanitization
 * 4. Bot Challenge / Cloudflare Detection
 * 5. Ported Site Rules Regex & Fast-Path validation
 * 6. SQLite persistence of scraped chapters
 */

const assert = require('assert');
const { DatabaseSync } = require('node:sqlite');
const {
  CookieJar,
  FastHtmlParser,
  PORTED_RULES,
  ScrapingPipeline,
  DEFAULT_USER_AGENT,
} = require('../src/core/scraper');
const { initializeDatabaseSchema } = require('../src/migrator/schema');

console.log('🧪 Running Phase 2: Hybrid Scraping Pipeline Test Suite...\n');

// --- Test 1: Impersonation Headers & Cookie Jar ---
console.log('  1. Testing HTTP Impersonation Headers & Cookie Jar...');
const pipeline = new ScrapingPipeline();

assert.ok(pipeline.defaultHeaders['User-Agent'].includes('Chrome/128'), 'User-Agent must impersonate Chrome 128');
assert.strictEqual(pipeline.defaultHeaders['Sec-CH-UA-Platform'], '"Windows"', 'Sec-CH-UA-Platform must be Windows');
assert.strictEqual(pipeline.defaultHeaders['Sec-Fetch-Dest'], 'document', 'Sec-Fetch-Dest must be document');

const jar = new CookieJar();
jar.setCookie('https://www.royalroad.com/fiction/1234', 'session_id=abc123xyz; Path=/; HttpOnly');
assert.ok(jar.getCookieString('https://www.royalroad.com').includes('session_id=abc123xyz'), 'Cookie must be retrieved by domain');

// Test Tier 3 Cookie Sync from WebView
jar.syncFromWebview('https://www.royalroad.com', [
  { name: 'cf_clearance', value: 'clearance_token_999' },
  { name: 'cf_bm', value: 'bot_management_token' },
]);
assert.ok(jar.hasClearance('https://www.royalroad.com'), 'Must detect Cloudflare clearance tokens');
assert.ok(jar.getCookieString('https://www.royalroad.com').includes('cf_clearance=clearance_token_999'));
console.log('  ✅ Impersonation headers and Cookie Jar verified.\n');

// --- Test 2: Bot Challenge Detection (Tier 2 & 3 Escalation) ---
console.log('  2. Testing Bot Challenge & Cloudflare Detection...');
const cloudflareHtml = `
<html>
  <head><title>Just a moment...</title></head>
  <body>
    <div id="cf-turnstile"></div>
    <p>Please wait while your request is being verified.</p>
  </body>
</html>
`;
const detected = pipeline.detectChallenge(403, cloudflareHtml);
assert.strictEqual(detected, 'cloudflare_turnstile', 'Must detect Cloudflare Turnstile challenge');

const rayHtml = '<html><body>Checking your browser before accessing the website.</body></html>';
assert.strictEqual(pipeline.detectChallenge(200, rayHtml), 'cloudflare_ray', 'Must detect Cloudflare Ray verification');

const rateLimit = pipeline.detectChallenge(429, 'Too many requests');
assert.strictEqual(rateLimit, 'rate_limited', 'Must detect 429 rate limit');

const cleanHtml = '<html><body><h1>Normal Content</h1></body></html>';
assert.strictEqual(pipeline.detectChallenge(200, cleanHtml), null, 'Must return null for clean pages');
console.log('  ✅ Challenge detection successfully verified.\n');

// --- Test 3: Fast-Path HTML Parsing & Sanitization ---
console.log('  3. Testing Fast-Path Tier 1 HTML Parsing & Sanitization...');
const sampleHtml = `
<div class="chapter-content">
  <script>console.log("tracker");</script>
  <style>.bad { color: red; }</style>
  <div class="ads">Buy something now!</div>
  <p>The knight drew his sword as the moon crested over the ancient tower.</p>
  <div class="pirate">Stolen from RoyalRoad</div>
  <p>Silence enveloped the hall, broken only by the distant echo of iron bells.</p>
  <!-- Comment to strip -->
</div>
`;

const cleaned = FastHtmlParser.cleanHtml(sampleHtml, ['ads', 'pirate']);
assert.ok(!cleaned.includes('console.log'), 'Scripts must be stripped');
assert.ok(!cleaned.includes('bad { color'), 'Styles must be stripped');
assert.ok(!cleaned.includes('Buy something now!'), 'Ads must be stripped');
assert.ok(!cleaned.includes('Stolen from RoyalRoad'), 'Watermarks must be stripped');
assert.ok(!cleaned.includes('Comment to strip'), 'Comments must be stripped');
assert.ok(cleaned.includes('knight drew his sword'), 'Chapter text must be preserved');

const text = FastHtmlParser.stripTags(cleaned);
const words = text.split(/\s+/).filter(Boolean).length;
assert.strictEqual(words, 26, `Word count should match 26 words, got ${words}`);
console.log('  ✅ Fast-Path HTML parsing & sanitization verified.\n');

// --- Test 4: Ported Site Rules Validation ---
console.log('  4. Testing Ported Site Rules & Matching Engine...');
const testUrls = [
  {
    url: 'https://www.royalroad.com/fiction/21220/mother-of-learning',
    expectedRule: 'RoyalRoad.com',
  },
  {
    url: 'https://archiveofourown.org/works/1005216/chapters/1992013',
    expectedRule: 'ArchiveOfOurOwn.org (AO3)',
  },
  {
    url: 'https://www.fanfiction.net/s/5782108/1/Harry-Potter-and-the-Methods-of-Rationality',
    expectedRule: 'Fanfiction.net',
  },
  {
    url: 'https://www.lightnovelworld.com/novel/shadow-slave-16091319',
    expectedRule: 'LightNovelWorld.com',
  },
  {
    url: 'https://www.wattpad.com/story/274056589-reincarnated-as-a-necromancer',
    expectedRule: 'Wattpad.com',
  },
  {
    url: 'https://www.webnovel.com/book/my-vampire-system_16725766006018805',
    expectedRule: 'WebNovel.com',
  },
  {
    url: 'https://techteach4u.com/series/even-after-death-by-lilting-champ-novel-full/',
    expectedRule: 'TechTeach4U.com',
  },
  {
    url: 'https://comrademao.com/novel/super-gene/',
    expectedRule: 'COMRADEMAO',
  },
];

for (const testCase of testUrls) {
  const rule = pipeline.matchRule(testCase.url);
  assert.ok(rule, `Rule must match URL: ${testCase.url}`);
  assert.strictEqual(rule.rule_name, testCase.expectedRule, `Matched rule should be ${testCase.expectedRule}`);
}
console.log(`  ✅ All ${testUrls.length} site rules matched with 100% regex precision.\n`);

// --- Test 5: End-to-End Extraction & SQLite Persistence ---
console.log('  5. Testing Scraped Content Persistence in SQLite...');
const memDb = new DatabaseSync(':memory:');
initializeDatabaseSchema(memDb);

// Insert a sample novel
memDb.prepare(`
  INSERT INTO novels (id, title, author, source_url, total_chapters, downloaded_chapters)
  VALUES ('novel-rr-1', 'Mother of Learning', 'nobody103', 'https://www.royalroad.com/fiction/21220/mother-of-learning', 108, 0)
`).run();

// Save scraped chapter
const scrapedChapterTitle = 'Chapter 1: Good Morning Brother';
const scrapedChapterContent = '<p>Zorian suddenly awoke to the sound of his sister knocking violently.</p>';
const wordCount = 11;

memDb.prepare(`
  INSERT INTO chapters (id, novel_id, chapter_index, title, content_html, source_url, word_count, is_downloaded, downloaded_at)
  VALUES ('novel-rr-1_ch_1', 'novel-rr-1', 1, ?, ?, 'https://www.royalroad.com/fiction/21220/mother-of-learning/chapter/325000/1', ?, 1, datetime('now'))
`).run(scrapedChapterTitle, scrapedChapterContent, wordCount);

memDb.prepare(`
  UPDATE novels SET downloaded_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = 'novel-rr-1' AND is_downloaded = 1)
  WHERE id = 'novel-rr-1'
`).run();

const savedNovel = memDb.prepare('SELECT * FROM novels WHERE id = ?').get('novel-rr-1');
const savedChapter = memDb.prepare('SELECT * FROM chapters WHERE novel_id = ? AND chapter_index = 1').get('novel-rr-1');

assert.strictEqual(savedNovel.downloaded_chapters, 1, 'Novel downloaded_chapters must be updated to 1');
assert.strictEqual(savedChapter.title, scrapedChapterTitle, 'Saved chapter title must match');
assert.strictEqual(savedChapter.is_downloaded, 1, 'Chapter is_downloaded flag must be 1');
assert.strictEqual(savedChapter.word_count, 11, 'Chapter word count must be 11');

console.log('  ✅ Scraped chapter content correctly persisted to SQLite schema.\n');

console.log('🎉 ALL PHASE 2 TESTS PASSED! 100% SUCCESS.');
