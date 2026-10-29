#!/usr/bin/env node
// Version 4/src/migrator/cli.js
/**
 * CLI Runner for the Auto-Upgrade Module
 * Usage:
 *   node src/migrator/cli.js [--dry-run] [--force] [--verbose]
 */

const { DataMigrator } = require('./index');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('='.repeat(65));
  console.log('  Fanfiction Manager — Version 4 Auto-Upgrade Module');
  console.log('='.repeat(65));
  if (dryRun) {
    console.log('ℹ️  Mode: DRY RUN (no files or database will be written)');
  }
  if (force) {
    console.log('ℹ️  Mode: FORCE (re-running even if previously migrated)');
  }

  const migrator = new DataMigrator({
    onProgress: (p) => {
      if (p.step === 'NOVEL_PROCESSED' && (verbose || p.index % 5 === 0 || p.index === p.total)) {
        console.log(`  [${p.index}/${p.total}] Migrated: "${p.title}" (${p.chaptersMigrated} chapters)`);
      }
    },
  });

  console.log('\nChecking legacy v3 data...');
  const result = await migrator.runUpgrade({ dryRun, force });

  console.log('\n' + '-'.repeat(65));
  if (result.status === 'SUCCESS') {
    console.log('✅ Migration COMPLETED SUCCESSFULLY!');
    console.log(`   • Novels Migrated:   ${result.novelCount}`);
    console.log(`   • Chapters Migrated: ${result.chapterCount}`);
    console.log(`   • Rules Migrated:    ${result.ruleCount}`);
    console.log(`   • Covers Copied:     ${result.coversCopied}`);
    console.log(`   • Time Elapsed:      ${result.durationMs} ms`);
    console.log(`   • Target Database:   ${result.dbPath}`);
  } else if (result.status === 'SKIPPED') {
    console.log(`⚠️  Migration SKIPPED: ${result.message}`);
  } else {
    console.error(`❌ Migration FAILED: ${result.error}`);
    process.exit(1);
  }
  console.log('='.repeat(65) + '\n');
}

main().catch((err) => {
  console.error('Fatal migrator error:', err);
  process.exit(1);
});

