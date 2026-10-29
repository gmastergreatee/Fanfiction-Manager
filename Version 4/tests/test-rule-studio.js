// Version 4/tests/test-rule-studio.js
/**
 * Test Suite: Rule Studio Multi-Mode & Visual Selector Compiler
 */

const assert = require('assert');
const RuleStudioService = require('../src/rule-studio/rule-studio-service');

async function testRuleStudio() {
  console.log('🧪 Testing Rule Studio Multi-Mode Architecture...');

  const studio = new RuleStudioService({ platform: 'win32' });

  // 1. Test Visual Selector Compiler
  const sampleSelectors = {
    title: 'h1.fic-title',
    cover: 'img.cover-art',
    chapters: 'ul.chapters li a',
    content: 'div.story-text',
  };

  const compiled = studio.compileVisualSelectorsToRule('https://novelcool.com/novel/123', sampleSelectors);
  assert(compiled.guid, 'Rule must have a generated GUID');
  assert.strictEqual(compiled.rule_name, 'Novelcool.com');
  assert(compiled.toc_code.includes('h1.fic-title'), 'TOC script must include title selector');
  assert(compiled.toc_code.includes('ul.chapters li a'), 'TOC script must include chapter selector');
  assert(compiled.chapter_code.includes('div.story-text'), 'Chapter script must include story content selector');

  // 2. Test Desktop DevTools Flag
  assert.strictEqual(studio.isMobile(), false, 'win32 should not be identified as mobile');
  const mobileStudio = new RuleStudioService({ platform: 'android' });
  assert.strictEqual(mobileStudio.isMobile(), true, 'android should be identified as mobile');

  const mobileDevToolsResult = mobileStudio.toggleDesktopDevTools(null);
  assert.strictEqual(mobileDevToolsResult.supported, false, 'Mobile should gracefully report DevTools unsupported');

  // 3. Test Rule Sync Payload
  const dummyRule = {
    guid: 'test-guid-123',
    rule_name: 'TestSite.com',
    url_regex: 'testsite\\.com\\/.*',
    toc_code: 'return {};',
    chapter_code: 'return [];',
  };
  const mockDb = {
    rules: {},
    getRuleByGuid(guid) { return this.rules[guid]; },
    saveRule(r) { this.rules[r.guid] = r; },
  };
  mockDb.saveRule(dummyRule);

  const syncedStudio = new RuleStudioService({ db: mockDb });
  const exported = syncedStudio.exportRuleForSync('test-guid-123');
  assert.strictEqual(exported.schema, 'ffm-rule-v4');
  assert.strictEqual(exported.rule.rule_name, 'TestSite.com');

  const imported = syncedStudio.importRuleFromSync(exported);
  assert.strictEqual(imported.success, true);
  assert.strictEqual(imported.ruleName, 'TestSite.com');

  console.log('✅ ALL RULE STUDIO TESTS PASSED!');
}

testRuleStudio().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

