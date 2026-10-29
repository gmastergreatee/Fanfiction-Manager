#!/usr/bin/env node
// Version 4/src/updater/rollback.js
/**
 * CLI Runner for 3-Version Rollback
 * Usage:
 *   node src/updater/rollback.js --list         (Lists up to 3 available rollback versions)
 *   node src/updater/rollback.js                (Rolls back to the immediately previous version)
 *   node src/updater/rollback.js <snapshotId>   (Rolls back to a specific snapshot)
 */

const RollbackManager = require('./rollback-manager');

async function main() {
  const args = process.argv.slice(2);
  const manager = new RollbackManager();
  const snapshots = manager.listSnapshots();

  console.log('='.repeat(65));
  console.log('  Fanfiction Manager — 3-Version Rollback Manager');
  console.log('='.repeat(65));

  if (args.includes('--list') || args.includes('-l')) {
    if (snapshots.length === 0) {
      console.log('ℹ️  No previous update snapshots found.');
    } else {
      console.log(`Available Rollback Versions (${snapshots.length}/3):\n`);
      snapshots.forEach((s, idx) => {
        const date = new Date(s.timestamp).toLocaleString();
        console.log(`  [${idx + 1}] Version: v${s.version}`);
        console.log(`      Snapshot ID: ${s.id}`);
        console.log(`      Created:     ${date}`);
        console.log(`      Database:    ${s.dbBackedUp ? 'Included' : 'None'}\n`);
      });
      console.log('To rollback, run:');
      console.log('   npm run rollback');
      console.log('   # or specify snapshot: npm run rollback <snapshotId>');
    }
    console.log('='.repeat(65));
    return;
  }

  if (snapshots.length === 0) {
    console.log('❌ Cannot rollback: No update snapshots available.');
    console.log('='.repeat(65));
    process.exit(1);
  }

  const targetId = args[0] && !args[0].startsWith('-') ? args[0] : snapshots[0].id;
  const result = await manager.rollbackTo(targetId);

  console.log('\n' + '-'.repeat(65));
  console.log(`✅ ROLLBACK SUCCESSFUL!`);
  console.log(`   • Active Version: v${result.rolledBackToVersion}`);
  console.log(`   • Restored From:  ${result.snapshotId}`);
  console.log(`   • Timestamp:      ${result.restoredAt}`);
  console.log('='.repeat(65) + '\n');
}

main().catch((err) => {
  console.error('❌ Rollback failed:', err.message);
  process.exit(1);
});

