// Version 4/src/core/db.js
/**
 * SQLite Database Access Layer for Version 4
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { initializeDatabaseSchema } = require('../migrator/schema');

class DatabaseClient {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(__dirname, '..', '..', 'v4_data', 'fanfiction.db');
    this.db = new DatabaseSync(this.dbPath);
    initializeDatabaseSchema(this.db);
  }

  // --- Novel Methods ---
  getAllNovels(options = {}) {
    let query = 'SELECT * FROM novels ORDER BY updated_at DESC';
    if (options.limit) {
      query += ` LIMIT ${parseInt(options.limit, 10)}`;
    }
    return this.db.prepare(query).all();
  }

  getNovelById(id) {
    return this.db.prepare('SELECT * FROM novels WHERE id = ?').get(id);
  }

  searchNovels(keyword) {
    return this.db.prepare(
      'SELECT * FROM novels WHERE title LIKE ? OR summary LIKE ? ORDER BY title ASC'
    ).all(`%${keyword}%`, `%${keyword}%`);
  }

  // --- Chapter Methods ---
  getNovelChapters(novelId) {
    return this.db.prepare(
      'SELECT id, novel_id, chapter_index, title, word_count, is_downloaded, downloaded_at FROM chapters WHERE novel_id = ? ORDER BY chapter_index ASC'
    ).all(novelId);
  }

  getChapterContent(novelId, chapterIndex) {
    return this.db.prepare(
      'SELECT * FROM chapters WHERE novel_id = ? AND chapter_index = ?'
    ).get(novelId, chapterIndex);
  }

  // --- Reading Progress ---
  getReadingProgress(novelId) {
    return this.db.prepare(
      'SELECT * FROM reading_progress WHERE novel_id = ?'
    ).get(novelId);
  }

  saveReadingProgress(novelId, chapterIndex, scrollPercentage = 0.0) {
    return this.db.prepare(`
      INSERT OR REPLACE INTO reading_progress (novel_id, last_chapter_index, scroll_percentage, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(novelId, chapterIndex, scrollPercentage);
  }

  // --- Rule Methods ---
  getAllRules() {
    return this.db.prepare('SELECT * FROM rules ORDER BY rule_name ASC').all();
  }

  getRuleByGuid(guid) {
    return this.db.prepare('SELECT * FROM rules WHERE guid = ?').get(guid);
  }

  saveRule(rule) {
    return this.db.prepare(`
      INSERT OR REPLACE INTO rules 
      (guid, rule_name, url_regex, parser_type, pagetype_code, toc_code, chapter_code, url_blocks, version, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      rule.guid,
      rule.rule_name,
      rule.url_regex,
      rule.parser_type || 'headless',
      rule.pagetype_code || '',
      rule.toc_code || '',
      rule.chapter_code || '',
      rule.url_blocks || '',
      rule.version || 1
    );
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseClient;

