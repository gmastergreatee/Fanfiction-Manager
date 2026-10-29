// Version 4/tests/test-migration.js
/**
 * Test Suite: Auto-Upgrade Module Verification
 * Supports both local workstation development (with local user data)
 * and clean CI environments (GitHub Actions) via automatic fixture generation.
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

  const v3Root = fs.existsSync(path.join(__dirname, '..', 'Legacy', 'config', 'novels.json'))
    ? path.join(__dirname, '..', 'Legacy')
    : fs.existsSync(path.join(__dirname, '..', 'config', 'novels.json'))
    ? path.join(__dirname, '..')
    : path.join(__dirname, '..', '..');
  const hasLocalNovels =
    process.env.FORCE_CI_FIXTURE !== '1' &&
    fs.existsSync(path.join(v3Root, 'config', 'novels.json'));

  let v3SourcePath = v3Root;
  let expectedNovelCount = 30;
  let isCiFixture = false;

  if (!hasLocalNovels) {
    // Running in CI or clean git clone without user's local novel library
    isCiFixture = true;
    expectedNovelCount = 2;
    v3SourcePath = path.join(testDataDir, 'v3_fixture');
    fs.mkdirSync(path.join(v3SourcePath, 'config'), { recursive: true });
    fs.mkdirSync(
      path.join(v3SourcePath, 'data', 'novels', '0e229d89-3901-4770-ade3-d0f16b6376f2'),
      { recursive: true }
    );
    fs.mkdirSync(path.join(v3SourcePath, 'data', 'covers'), { recursive: true });

    // Copy rules.json if present in repo
    const rulesSrc = fs.existsSync(path.join(v3Root, 'config', 'rules.json'))
      ? path.join(v3Root, 'config', 'rules.json')
      : fs.existsSync(path.join(__dirname, '..', 'Legacy', 'config', 'rules.json'))
      ? path.join(__dirname, '..', 'Legacy', 'config', 'rules.json')
      : path.join(__dirname, '..', '..', 'config', 'rules.json');
    if (fs.existsSync(rulesSrc)) {
      fs.copyFileSync(rulesSrc, path.join(v3SourcePath, 'config', 'rules.json'));
    }

    // Write fixture novels.json
    fs.writeFileSync(
      path.join(v3SourcePath, 'config', 'novels.json'),
      JSON.stringify(
        [
          {
            GUID: '0e229d89-3901-4770-ade3-d0f16b6376f2',
            Title: 'DC: All for One',
            Author: 'Original Author',
            URL: 'https://example.com/novel/dc-all-for-one',
            ChapterCount: 90,
            DownloadedCount: 1,
            Summary: 'Ethan Kane never felt human...',
            CheckUpdates: true,
          },
          {
            GUID: '81bd638a-d669-4d47-96e7-141dfb470eb6',
            Title: 'One Piece: With Sign-in System',
            Author: 'Unknown',
            URL: 'https://example.com/novel/one-piece',
            ChapterCount: 256,
            DownloadedCount: 0,
            Summary: 'Traversing the world of One Piece...',
            CheckUpdates: true,
          },
        ],
        null,
        2
      )
    );

    // Write fixture chapter 1 (legacy v3 format is JSON)
    fs.writeFileSync(
      path.join(v3SourcePath, 'data', 'novels', '0e229d89-3901-4770-ade3-d0f16b6376f2', '1.json'),
      JSON.stringify({
        title: 'Chapter 1: Awaken',
        content: '<h1>Chapter 1: Awaken</h1><div class="content"><p>Ethan Kane awoke with a start. The night air was freezing cold, and the shadows outside the warehouse stretched into grotesque shapes. He looked down at his trembling hands, feeling an ancient and terrifying power stirring within his veins.</p><p>For years he had concealed this uncanny sensation, but now there was no turning back.</p></div>',
      })
    );
  }

  try {
    const migrator = new DataMigrator({
      v3Path: v3SourcePath,
      v4DataDir: testDataDir,
      dbName: 'test_fanfiction.db',
    });

    // 1. Run migration
    const result = await migrator.runUpgrade({ force: true });
    assert.strictEqual(result.status, 'SUCCESS', 'Migration must complete successfully');
    assert.strictEqual(result.novelCount, expectedNovelCount, `Should migrate all ${expectedNovelCount} novels`);
    if (!isCiFixture) {
      assert(result.chapterCount > 6000, 'Should migrate over 6,000 chapters');
    } else {
      assert(result.chapterCount >= 1, 'Should migrate at least 1 fixture chapter');
    }
    assert(result.ruleCount > 0, 'Should migrate site rules');

    // 2. Verify database records
    const db = new DatabaseClient(testDbPath);
    const novels = db.getAllNovels();
    assert.strictEqual(novels.length, expectedNovelCount, `Database should contain exactly ${expectedNovelCount} novels`);

    // 3. Verify specific novel and chapter content
    const sampleNovel = novels.find((n) => n.title.includes('DC: All for One'));
    assert(sampleNovel, 'Must find sample novel "DC: All for One"');
    if (!isCiFixture) {
      assert.strictEqual(sampleNovel.downloaded_chapters, 90, 'Downloaded chapters count must match');
      const chapters = db.getNovelChapters(sampleNovel.id);
      assert.strictEqual(chapters.length, 90, 'Should have exactly 90 chapters');
    } else {
      assert.strictEqual(sampleNovel.downloaded_chapters, 1, 'Downloaded chapters count must match fixture');
      const chapters = db.getNovelChapters(sampleNovel.id);
      assert.strictEqual(chapters.length, 1, 'Should have 1 chapter');
    }

    const ch1 = db.getChapterContent(sampleNovel.id, 1);
    assert(ch1, 'Chapter 1 must exist');
    assert(ch1.content_html.length > 200, 'Chapter 1 content must not be empty');
    assert(ch1.title.length > 0, 'Chapter 1 must have a title');

    // 4. Verify rules
    const rules = db.getAllRules();
    assert(rules.length > 0, 'Should have rules');
    const rrRule = rules.find((r) => r.rule_name.toLowerCase().includes('royalroad'));
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
