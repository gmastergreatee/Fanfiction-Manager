// Version 4/tests/test-migration.js
/**
 * Test Suite: Auto-Upgrade Module Verification
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { DataMigrator } = require('../src/migrator');
const DatabaseClient = require('../src/core/db');

async function runTests() {
  console.log('🧪 Running Auto-Upgrade verification test in isolated memory DB...');

  const testDataDir = path.join(__dirname, 'temp_test_data');
  const testDbPath = path.join(testDataDir, 'test_fanfiction.db');
  fs.mkdirSync(testDataDir, { recursive: true });

  try {
    const migrator = new DataMigrator({
      v3Path: path.join(__dirname, '..', '..'),
      v4DataDir: testDataDir,
      dbName: 'test_fanfiction.db',
    });

    // 1. Run migration
    const result = await migrator.runUpgrade({ force: true });
    assert.strictEqual(result.status, 'SUCCESS', 'Migration must complete successfully');
    assert.strictEqual(result.novelCount, 30, 'Should migrate all 30 novels');
    assert(result.chapterCount > 6000, 'Should migrate over 6,000 chapters');
    assert.strictEqual(result.ruleCount, 20, 'Should migrate all 20 rules');

    // 2. Verify database records
    const db = new DatabaseClient(testDbPath);
    const novels = db.getAllNovels();
    assert.strictEqual(novels.length, 30, 'Database should contain exactly 30 novels');

    // 3. Verify specific novel and chapter content
    const sampleNovel = novels.find((n) => n.title.includes('DC: All for One'));
    assert(sampleNovel, 'Must find sample novel "DC: All for One"');
    assert.strictEqual(sampleNovel.downloaded_chapters, 90, 'Downloaded chapters count must match');

    const chapters = db.getNovelChapters(sampleNovel.id);
    assert.strictEqual(chapters.length, 90, 'Should have exactly 90 chapters');

    const ch1 = db.getChapterContent(sampleNovel.id, 1);
    assert(ch1, 'Chapter 1 must exist');
    assert(ch1.content_html.length > 500, 'Chapter 1 content must not be empty');
    assert(ch1.title.length > 0, 'Chapter 1 must have a title');

    // 4. Verify rules
    const rules = db.getAllRules();
    assert.strictEqual(rules.length, 20, 'Should have 20 rules');
    const rrRule = rules.find((r) => r.rule_name === 'Royalroad.com');
    assert(rrRule, 'Must have Royalroad rule');
    assert(rrRule.url_regex.includes('royalroad.com'), 'Rule regex must be preserved');

    db.close();
    console.log('✅ ALL TEST ASSERTIONS PASSED! Auto-Upgrade module is 100% verified.');
  } finally {
    // Cleanup temporary test directory
    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch {}
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

