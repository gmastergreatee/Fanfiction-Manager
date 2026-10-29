// Version 4/src/migrator/schema.js
/**
 * SQLite Schema Initialization for Version 4
 * Uses native Node.js SQLite (DatabaseSync) or compatible SQLite driver.
 */

const SCHEMA_SQL = `
-- Table: novels
CREATE TABLE IF NOT EXISTS novels (
    id TEXT PRIMARY KEY,                       -- UUID
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    cover_local_path TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    source_url TEXT NOT NULL UNIQUE,
    rule_guid TEXT,
    total_chapters INTEGER DEFAULT 0,
    downloaded_chapters INTEGER DEFAULT 0,
    check_updates INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Table: chapters
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,                       -- UUID or {novel_id}_{index}
    novel_id TEXT NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_index INTEGER NOT NULL,            -- 1-based index
    title TEXT NOT NULL,
    content_html TEXT,
    source_url TEXT DEFAULT '',
    word_count INTEGER DEFAULT 0,
    is_downloaded INTEGER DEFAULT 0,
    downloaded_at TEXT,
    UNIQUE(novel_id, chapter_index)
);

-- Table: reading_progress
CREATE TABLE IF NOT EXISTS reading_progress (
    novel_id TEXT PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
    last_chapter_index INTEGER DEFAULT 0,
    scroll_percentage REAL DEFAULT 0.0,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Table: rules
CREATE TABLE IF NOT EXISTS rules (
    guid TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    url_regex TEXT NOT NULL,
    parser_type TEXT DEFAULT 'headless',       -- 'headless' | 'webview'
    pagetype_code TEXT DEFAULT '',
    toc_code TEXT DEFAULT '',
    chapter_code TEXT DEFAULT '',
    url_blocks TEXT DEFAULT '',
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Table: settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Table: migration_history
CREATE TABLE IF NOT EXISTS migration_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_version TEXT NOT NULL,
    target_version TEXT NOT NULL,
    novel_count INTEGER DEFAULT 0,
    chapter_count INTEGER DEFAULT 0,
    rule_count INTEGER DEFAULT 0,
    migrated_at TEXT DEFAULT (datetime('now')),
    status TEXT NOT NULL                       -- 'SUCCESS' | 'FAILED' | 'PARTIAL'
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_novel_idx ON chapters(novel_id, chapter_index);
CREATE INDEX IF NOT EXISTS idx_novels_source_url ON novels(source_url);
CREATE INDEX IF NOT EXISTS idx_rules_url_regex ON rules(url_regex);
`;

function initializeDatabaseSchema(db) {
  db.exec(SCHEMA_SQL);
}

module.exports = {
  SCHEMA_SQL,
  initializeDatabaseSchema,
};

