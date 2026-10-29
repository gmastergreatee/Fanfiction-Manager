// Version 4/src/updater/rollback-manager.js
/**
 * 3-Version Rollback Manager
 *
 * Automatically maintains a ring buffer of up to 3 historical snapshots.
 * If an update introduces regressions or issues, users can seamlessly rollback
 * to any of the 3 prior versions via 1-click in the UI or CLI.
 */

const fs = require('fs');
const path = require('path');

const MAX_ROLLBACK_SNAPSHOTS = 3;

class RollbackManager {
  constructor(options = {}) {
    this.appRoot = path.resolve(options.appRoot || path.join(__dirname, '..', '..'));
    this.snapshotsDir = path.resolve(
      options.snapshotsDir || path.join(this.appRoot, 'v4_data', 'snapshots')
    );
    this.dbPath = path.join(this.appRoot, 'v4_data', 'fanfiction.db');
  }

  /**
   * Create a full backup snapshot of current files & DB before applying an update
   */
  async createSnapshotBeforeUpdate(currentVersion) {
    fs.mkdirSync(this.snapshotsDir, { recursive: true });

    const timestamp = Date.now();
    const snapshotId = `v${currentVersion}_${timestamp}`;
    const targetDir = path.join(this.snapshotsDir, snapshotId);
    fs.mkdirSync(targetDir, { recursive: true });

    console.log(`[Rollback] Backing up current v${currentVersion} into snapshot ring buffer...`);

    // 1. Copy application runtime files
    const filesToBackup = ['package.json', 'main.js'];
    for (const f of filesToBackup) {
      const src = path.join(this.appRoot, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(targetDir, f));
      }
    }

    // Copy src directory
    const srcDir = path.join(this.appRoot, 'src');
    if (fs.existsSync(srcDir)) {
      fs.cpSync(srcDir, path.join(targetDir, 'src'), { recursive: true });
    }

    // 2. Backup SQLite database if present
    let dbBackedUp = false;
    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, path.join(targetDir, 'fanfiction.db'));
      dbBackedUp = true;
    }

    // 3. Write snapshot manifest
    const manifest = {
      id: snapshotId,
      version: currentVersion,
      created_at: new Date().toISOString(),
      timestamp,
      dbBackedUp,
    };
    fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // 4. Prune snapshots older than MAX_ROLLBACK_SNAPSHOTS (3)
    this.pruneOldSnapshots();

    return manifest;
  }

  /**
   * List available rollback snapshots (up to 3, sorted newest to oldest)
   */
  listSnapshots() {
    if (!fs.existsSync(this.snapshotsDir)) return [];

    const entries = fs.readdirSync(this.snapshotsDir);
    const snapshots = [];

    for (const entry of entries) {
      const manifestPath = path.join(this.snapshotsDir, entry, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          snapshots.push(data);
        } catch {}
      }
    }

    // Sort newest to oldest
    snapshots.sort((a, b) => b.timestamp - a.timestamp);
    return snapshots.slice(0, MAX_ROLLBACK_SNAPSHOTS);
  }

  /**
   * Enforces the 3-snapshot limit by removing the oldest snapshots
   */
  pruneOldSnapshots() {
    if (!fs.existsSync(this.snapshotsDir)) return;

    const snapshots = this.listSnapshots();
    const allEntries = fs.readdirSync(this.snapshotsDir);

    const validIds = new Set(snapshots.map((s) => s.id));

    for (const entry of allEntries) {
      if (!validIds.has(entry)) {
        const toDelete = path.join(this.snapshotsDir, entry);
        try {
          fs.rmSync(toDelete, { recursive: true, force: true });
          console.log(`[Rollback] Pruned old snapshot: ${entry}`);
        } catch (e) {
          console.warn(`[Rollback] Could not prune ${entry}: ${e.message}`);
        }
      }
    }
  }

  /**
   * Rollback the application to a specific snapshot
   */
  async rollbackTo(snapshotId) {
    const snapshots = this.listSnapshots();
    const target = snapshots.find((s) => s.id === snapshotId) || (snapshotId ? null : snapshots[0]);

    if (!target) {
      throw new Error(`Rollback snapshot not found: ${snapshotId || 'Latest'}`);
    }

    const snapshotDir = path.join(this.snapshotsDir, target.id);
    console.log(`[Rollback] Rolling back application to v${target.version} (${target.id})...`);

    // 1. Restore runtime files
    const filesToRestore = ['package.json', 'main.js'];
    for (const f of filesToRestore) {
      const src = path.join(snapshotDir, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(this.appRoot, f));
      }
    }

    // Restore src directory
    const srcBackup = path.join(snapshotDir, 'src');
    if (fs.existsSync(srcBackup)) {
      const liveSrc = path.join(this.appRoot, 'src');
      fs.rmSync(liveSrc, { recursive: true, force: true });
      fs.cpSync(srcBackup, liveSrc, { recursive: true });
    }

    // 2. Restore database if it was backed up
    const dbBackup = path.join(snapshotDir, 'fanfiction.db');
    if (fs.existsSync(dbBackup)) {
      fs.copyFileSync(dbBackup, this.dbPath);
      console.log('  ✅ Database restored to snapshot state.');
    }

    console.log(`  🎉 Successfully rolled back to Version ${target.version}!`);
    return {
      success: true,
      rolledBackToVersion: target.version,
      snapshotId: target.id,
      restoredAt: new Date().toISOString(),
    };
  }
}

module.exports = RollbackManager;

