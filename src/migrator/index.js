// Version 4/src/migrator/index.js
/**
 * Auto-Upgrade / Migration Orchestrator
 * Automatically upgrades legacy v3 data to Version 4 SQLite storage.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { initializeDatabaseSchema } = require('./schema');
const V3DataReader = require('./v3-reader');

class DataMigrator {
  constructor(options = {}) {
    const legacyCandidate = path.resolve(__dirname, '..', '..', 'Legacy');
    const rootConfigCandidate = path.resolve(__dirname, '..', '..', 'config');
    const defaultV3Path = fs.existsSync(legacyCandidate)
      ? legacyCandidate
      : fs.existsSync(rootConfigCandidate)
      ? path.resolve(__dirname, '..', '..')
      : path.resolve(__dirname, '..', '..', '..');
    this.v3Path = path.resolve(options.v3Path || defaultV3Path);
    this.v4DataDir = path.resolve(options.v4DataDir || path.join(__dirname, '..', '..', 'v4_data'));
    this.dbPath = path.join(this.v4DataDir, options.dbName || 'fanfiction.db');
    this.coversDir = path.join(this.v4DataDir, 'covers');
    this.v3Reader = new V3DataReader(this.v3Path);
    this.onProgress = options.onProgress || (() => {});
  }

  /**
   * Check if upgrade/migration is needed
   */
  isUpgradeNeeded(db) {
    if (!this.v3Reader.hasLegacyData()) {
      return false; // No legacy data found to upgrade
    }

    try {
      const checkStmt = db.prepare(
        "SELECT COUNT(*) AS count FROM migration_history WHERE source_version = 'v3' AND status = 'SUCCESS'"
      );
      const row = checkStmt.get();
      return row.count === 0;
    } catch {
      return true;
    }
  }

  /**
   * Run the auto-upgrade process
   */
  async runUpgrade(options = {}) {
    const dryRun = options.dryRun || false;
    const force = options.force || false;
    const startTime = Date.now();

    // Ensure output directories exist
    if (!dryRun) {
      fs.mkdirSync(this.v4DataDir, { recursive: true });
      fs.mkdirSync(this.coversDir, { recursive: true });
    }

    const db = new DatabaseSync(dryRun ? ':memory:' : this.dbPath);
    initializeDatabaseSchema(db);

    if (!force && !this.isUpgradeNeeded(db)) {
      db.close();
      return {
        status: 'SKIPPED',
        message: 'Legacy v3 data has already been migrated. Use force=true to re-run.',
      };
    }

    this.onProgress({ step: 'START', message: 'Starting auto-upgrade from v3...' });

    // 1. Read legacy data
    const rawNovels = this.v3Reader.readNovels();
    const rawRules = this.v3Reader.readRules();
    const settings = this.v3Reader.readSettings();

    this.onProgress({
      step: 'READ_V3',
      novelCount: rawNovels.length,
      ruleCount: rawRules.length,
    });

    let totalChaptersCount = 0;
    let coversCopiedCount = 0;

    // 2. Perform Migration within SQLite Transaction
    try {
      db.exec('BEGIN TRANSACTION;');

      // Migrate Rules
      const insertRule = db.prepare(`
        INSERT OR REPLACE INTO rules 
        (guid, rule_name, url_regex, parser_type, pagetype_code, toc_code, chapter_code, url_blocks, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of rawRules) {
        insertRule.run(
          r.guid,
          r.rule_name,
          r.url_regex,
          r.parser_type,
          r.pagetype_code,
          r.toc_code,
          r.chapter_code,
          r.url_blocks,
          r.version
        );
      }

      // Migrate Settings
      const insertSetting = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
      `);
      for (const [key, val] of Object.entries(settings)) {
        insertSetting.run(key, val);
      }

      // Migrate Novels & Chapters
      const insertNovel = db.prepare(`
        INSERT OR REPLACE INTO novels 
        (id, title, author, cover_url, cover_local_path, summary, source_url, rule_guid, total_chapters, downloaded_chapters, check_updates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertChapter = db.prepare(`
        INSERT OR REPLACE INTO chapters 
        (id, novel_id, chapter_index, title, content_html, source_url, word_count, is_downloaded, downloaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < rawNovels.length; i++) {
        const novel = rawNovels[i];
        
        // Handle cover image
        const legacyCoverPath = this.v3Reader.getCoverFilePath(novel.id);
        let newLocalCoverPath = '';
        if (legacyCoverPath) {
          const ext = path.extname(legacyCoverPath);
          const targetCoverName = `${novel.id}${ext}`;
          newLocalCoverPath = path.join('covers', targetCoverName);
          if (!dryRun) {
            const destPath = path.join(this.coversDir, targetCoverName);
            fs.copyFileSync(legacyCoverPath, destPath);
          }
          coversCopiedCount++;
        }

        // Try to match matching rule
        let matchedRuleGuid = null;
        for (const r of rawRules) {
          try {
            if (new RegExp(r.url_regex).test(novel.source_url)) {
              matchedRuleGuid = r.guid;
              break;
            }
          } catch {}
        }

        insertNovel.run(
          novel.id,
          novel.title,
          novel.author,
          novel.cover_url,
          newLocalCoverPath,
          novel.summary,
          novel.source_url,
          matchedRuleGuid,
          novel.total_chapters,
          novel.downloaded_chapters,
          novel.check_updates
        );

        // Read and insert chapters
        const chapters = this.v3Reader.readNovelChapters(novel.id, novel.chapter_urls);
        for (const ch of chapters) {
          insertChapter.run(
            ch.id,
            ch.novel_id,
            ch.chapter_index,
            ch.title,
            ch.content_html,
            ch.source_url,
            ch.word_count,
            ch.is_downloaded,
            ch.downloaded_at
          );
          totalChaptersCount++;
        }

        this.onProgress({
          step: 'NOVEL_PROCESSED',
          index: i + 1,
          total: rawNovels.length,
          title: novel.title,
          chaptersMigrated: chapters.length,
        });
      }

      // Record migration success
      const recordHistory = db.prepare(`
        INSERT INTO migration_history 
        (source_version, target_version, novel_count, chapter_count, rule_count, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      recordHistory.run('v3', 'v4', rawNovels.length, totalChaptersCount, rawRules.length, 'SUCCESS');

      db.exec('COMMIT;');

      const durationMs = Date.now() - startTime;
      db.close();

      return {
        status: 'SUCCESS',
        dryRun,
        novelCount: rawNovels.length,
        chapterCount: totalChaptersCount,
        ruleCount: rawRules.length,
        coversCopied: coversCopiedCount,
        durationMs,
        dbPath: dryRun ? ':memory:' : this.dbPath,
      };
    } catch (err) {
      try {
        db.exec('ROLLBACK;');
      } catch {}
      db.close();
      console.error(`[Migrator] Upgrade failed: ${err.message}`, err);
      return {
        status: 'FAILED',
        error: err.message,
      };
    }
  }
}

/**
 * Convenience helper to auto-upgrade if needed on app startup
 */
async function autoUpgradeIfRequired(options = {}) {
  const migrator = new DataMigrator(options);
  return migrator.runUpgrade(options);
}

module.exports = {
  DataMigrator,
  autoUpgradeIfRequired,
};

