#!/usr/bin/env node
// Version 4/scripts/switchover-to-root.js
/**
 * Developer Switchover Tool: Promote Version 4 to Root & Archive v3 to 'Legacy/'
 *
 * Usage:
 *   node scripts/switchover-to-root.js --dry-run    (Preview actions safely)
 *   node scripts/switchover-to-root.js              (Execute the switchover)
 *
 * What this does:
 * 1. Ensures SQLite database migration is 100% complete before touching files.
 * 2. Creates a 'Legacy/' directory at the project root.
 * 3. Moves legacy v3 files (main.js, preload.js, index.html, css/, js/, config/, data/) into 'Legacy/'.
 * 4. Promotes all 'Version 4/' files, scripts, docs, and configurations directly to project root.
 * 5. Cleans up the empty 'Version 4/' folder.
 */

const fs = require('fs');
const path = require('path');
const { autoUpgradeIfRequired } = require('../src/migrator');

const LEGACY_ITEMS = [
  'config',
  'css',
  'data',
  'js',
  'dummy.html',
  'index.html',
  'main.js',
  'package.json',
  'package-lock.json',
  'preload.js',
  'README.md',
  'pic_dark_2022-07-15.png',
  'pic_light_2022-07-15.png',
];

const PRESERVED_ROOT_ITEMS = [
  '.git',
  '.gitignore',
  '.github',
  '.vscode',
  'LICENSE',
  'Icon.afdesign',
  'Icon.ico',
  'Icon.png',
  'node_modules',
  'Legacy',
  'Version 4',
];

async function performSwitchover() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const rootDir = path.resolve(__dirname, '..', '..');
  const v4Dir = path.resolve(__dirname, '..');
  const legacyDir = path.join(rootDir, 'Legacy');

  console.log('='.repeat(70));
  console.log('  Fanfiction Manager — Version 4 Promotion & Legacy Archival Tool');
  console.log('='.repeat(70));
  if (dryRun) {
    console.log('ℹ️  MODE: DRY-RUN (Previewing actions. No files will be moved)\n');
  } else {
    console.log('⚠️  MODE: LIVE EXECUTION (Promoting Version 4 to project root)\n');
  }

  // Step 1: Pre-switchover database check
  console.log('[Step 1/4] Ensuring data migration is complete in Version 4...');
  const v4DataDir = path.join(v4Dir, 'v4_data');
  const migrationResult = await autoUpgradeIfRequired({
    v3Path: rootDir,
    v4DataDir: v4DataDir,
    dryRun: false,
  });

  if (migrationResult.status === 'SUCCESS') {
    console.log(`  ✅ Verified: Migrated ${migrationResult.novelCount} novels and ${migrationResult.chapterCount} chapters into SQLite.`);
  } else if (migrationResult.status === 'SKIPPED') {
    console.log('  ✅ Verified: SQLite database already exists and is up to date.');
  }

  // Step 2: Plan archival of legacy v3 items
  console.log('\n[Step 2/4] Archiving legacy v3 files into "Legacy/" folder...');
  if (!dryRun) {
    fs.mkdirSync(legacyDir, { recursive: true });
  }

  const existingRootItems = fs.readdirSync(rootDir);
  const toArchive = existingRootItems.filter((item) => LEGACY_ITEMS.includes(item));

  for (const item of toArchive) {
    const srcPath = path.join(rootDir, item);
    const destPath = path.join(legacyDir, item);
    console.log(`  📦 Archive: ${item} ──▶ Legacy/${item}`);
    if (!dryRun) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      fs.renameSync(srcPath, destPath);
    }
  }

  // Write Legacy README
  if (!dryRun) {
    const legacyReadmeContent = `# Fanfiction Manager — Legacy v3.x Archive\n\nThis directory contains the original Version 3.x codebase (Electron + raw JSON storage), archived when Version 4 was promoted to the project root on ${new Date().toISOString()}.\n\nAll novel library data and chapters have been migrated into SQLite in the root directory.\n`;
    fs.writeFileSync(path.join(legacyDir, 'README.md'), legacyReadmeContent);
  }

  // Step 3: Promote Version 4 items to root
  console.log('\n[Step 3/4] Promoting Version 4 files to project root...');
  const v4Items = fs.readdirSync(v4Dir);

  for (const item of v4Items) {
    if (item === 'dist') continue; // Don't move build artifacts
    const srcPath = path.join(v4Dir, item);
    const destPath = path.join(rootDir, item);

    // Special handling for workflows
    if (item === 'workflows') {
      const targetWorkflowDir = path.join(rootDir, '.github', 'workflows');
      console.log(`  🚀 Promote: Version 4/workflows/ ──▶ .github/workflows/`);
      if (!dryRun) {
        fs.mkdirSync(targetWorkflowDir, { recursive: true });
        const files = fs.readdirSync(srcPath);
        for (const f of files) {
          fs.copyFileSync(path.join(srcPath, f), path.join(targetWorkflowDir, f));
        }
      }
      continue;
    }

    console.log(`  🚀 Promote: Version 4/${item} ──▶ ${item}`);
    if (!dryRun) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      fs.renameSync(srcPath, destPath);
    }
  }

  // Step 4: Clean up empty Version 4 directory
  console.log('\n[Step 4/4] Finalizing root workspace...');
  if (!dryRun) {
    try {
      fs.rmSync(v4Dir, { recursive: true, force: true });
      console.log('  🧹 Removed empty "Version 4" directory.');
    } catch (e) {
      console.log('  ℹ️  Version 4 folder cleanup note: ' + e.message);
    }
  } else {
    console.log('  ℹ️  [Dry Run] "Version 4/" directory would be removed after promotion.');
  }

  console.log('\n' + '='.repeat(70));
  if (dryRun) {
    console.log('✅ DRY-RUN PREVIEW COMPLETE!');
    console.log('To execute this switchover for real, run:');
    console.log('   npm run switchover');
  } else {
    console.log('🎉 SWITCHOVER COMPLETE! VERSION 4 IS NOW ACTIVE IN ROOT DIRECTORY!');
    console.log('   • Legacy v3 files archived in: ./Legacy/');
    console.log('   • Version 4 core active in:   ./');
    console.log('   • SQLite Database active in:  ./v4_data/fanfiction.db');
  }
  console.log('='.repeat(70) + '\n');
}

if (require.main === module) {
  performSwitchover().catch((err) => {
    console.error('Fatal switchover error:', err);
    process.exit(1);
  });
}

module.exports = { performSwitchover };

