// Version 4/src/app.js
/**
 * Main Application Entry Point for Version 4
 */

const path = require('path');
const { autoUpgradeIfRequired } = require('./migrator');
const DatabaseClient = require('./core/db');

async function initializeApp() {
  console.log('='.repeat(65));
  console.log('  Fanfiction Manager — Version 4');
  console.log('='.repeat(65));

  // Step 1: Auto-Upgrade legacy v3 data if needed
  console.log('\n[Init] Checking for legacy v3 data to auto-upgrade...');
  const fs = require('fs');
  const appRoot = path.resolve(__dirname, '..');
  const legacyDir = path.join(appRoot, 'Legacy');
  const v3Source = fs.existsSync(legacyDir)
    ? legacyDir
    : fs.existsSync(path.join(appRoot, 'config', 'novels.json'))
    ? appRoot
    : path.resolve(appRoot, '..');

  const upgradeResult = await autoUpgradeIfRequired({
    v3Path: v3Source,
    v4DataDir: path.join(appRoot, 'v4_data'),
    onProgress: (p) => {
      if (p.step === 'NOVEL_PROCESSED' && (p.index % 5 === 0 || p.index === p.total)) {
        console.log(`  [Migration] Processing [${p.index}/${p.total}]: "${p.title}"`);
      }
    },
  });

  if (upgradeResult.status === 'SUCCESS') {
    console.log(`✅ [Migration] Auto-upgraded ${upgradeResult.novelCount} novels and ${upgradeResult.chapterCount} chapters in ${upgradeResult.durationMs}ms.`);
  } else if (upgradeResult.status === 'SKIPPED') {
    console.log('ℹ️  [Migration] Database is up to date.');
  }

  // Step 2: Open Version 4 Database
  const db = new DatabaseClient();
  const novels = db.getAllNovels();
  const rules = db.getAllRules();

  console.log(`\n📚 [Library Status]`);
  console.log(`   • Total Novels: ${novels.length}`);
  console.log(`   • Active Rules: ${rules.length}`);
  console.log(`   • Database:     ${db.dbPath}`);

  return { db, novels, rules };
}

if (require.main === module) {
  initializeApp().catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}

module.exports = { initializeApp };

