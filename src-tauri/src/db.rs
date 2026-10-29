use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Novel {
    pub id: String,
    pub title: String,
    pub author: String,
    pub cover_url: String,
    pub cover_local_path: String,
    pub summary: String,
    pub source_url: String,
    pub rule_guid: Option<String>,
    pub total_chapters: i64,
    pub downloaded_chapters: i64,
    pub check_updates: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: String,
    pub novel_id: String,
    pub chapter_index: i64,
    pub title: String,
    pub content_html: Option<String>,
    pub source_url: String,
    pub word_count: i64,
    pub is_downloaded: bool,
    pub downloaded_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Rule {
    pub guid: String,
    pub rule_name: String,
    pub url_regex: String,
    pub parser_type: String,
    pub pagetype_code: Option<String>,
    pub toc_code: Option<String>,
    pub chapter_code: Option<String>,
    pub url_blocks: Option<String>,
    pub version: i64,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadingProgress {
    pub novel_id: String,
    pub last_chapter_index: i64,
    pub scroll_percentage: f64,
    pub updated_at: Option<String>,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    pub fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS novels (
                id TEXT PRIMARY KEY,
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

            CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                novel_id TEXT NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
                chapter_index INTEGER NOT NULL,
                title TEXT NOT NULL,
                content_html TEXT,
                source_url TEXT DEFAULT '',
                word_count INTEGER DEFAULT 0,
                is_downloaded INTEGER DEFAULT 0,
                downloaded_at TEXT,
                UNIQUE(novel_id, chapter_index)
            );

            CREATE TABLE IF NOT EXISTS reading_progress (
                novel_id TEXT PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
                last_chapter_index INTEGER DEFAULT 0,
                scroll_percentage REAL DEFAULT 0.0,
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS rules (
                guid TEXT PRIMARY KEY,
                rule_name TEXT NOT NULL,
                url_regex TEXT NOT NULL,
                parser_type TEXT DEFAULT 'headless',
                pagetype_code TEXT DEFAULT '',
                toc_code TEXT DEFAULT '',
                chapter_code TEXT DEFAULT '',
                url_blocks TEXT DEFAULT '',
                version INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
            CREATE INDEX IF NOT EXISTS idx_chapters_novel_idx ON chapters(novel_id, chapter_index);
            CREATE INDEX IF NOT EXISTS idx_novels_source_url ON novels(source_url);
            CREATE INDEX IF NOT EXISTS idx_rules_url_regex ON rules(url_regex);
            "#,
        )?;
        Ok(())
    }

    pub fn get_all_novels(&self) -> Result<Vec<Novel>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, author, cover_url, cover_local_path, summary, source_url, rule_guid,
                    total_chapters, downloaded_chapters, check_updates, created_at, updated_at
             FROM novels ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            let check_up: i64 = row.get(10)?;
            Ok(Novel {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                cover_url: row.get(3)?,
                cover_local_path: row.get(4)?,
                summary: row.get(5)?,
                source_url: row.get(6)?,
                rule_guid: row.get(7)?,
                total_chapters: row.get(8)?,
                downloaded_chapters: row.get(9)?,
                check_updates: check_up == 1,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;

        let mut novels = Vec::new();
        for r in rows {
            novels.push(r?);
        }
        Ok(novels)
    }

    pub fn get_novel_by_id(&self, id: &str) -> Result<Option<Novel>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, author, cover_url, cover_local_path, summary, source_url, rule_guid,
                    total_chapters, downloaded_chapters, check_updates, created_at, updated_at
             FROM novels WHERE id = ?",
        )?;

        let mut rows = stmt.query_map([id], |row| {
            let check_up: i64 = row.get(10)?;
            Ok(Novel {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                cover_url: row.get(3)?,
                cover_local_path: row.get(4)?,
                summary: row.get(5)?,
                source_url: row.get(6)?,
                rule_guid: row.get(7)?,
                total_chapters: row.get(8)?,
                downloaded_chapters: row.get(9)?,
                check_updates: check_up == 1,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;

        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    pub fn get_novel_chapters(&self, novel_id: &str) -> Result<Vec<Chapter>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, novel_id, chapter_index, title, content_html, source_url, word_count, is_downloaded, downloaded_at
             FROM chapters WHERE novel_id = ? ORDER BY chapter_index ASC",
        )?;

        let rows = stmt.query_map([novel_id], |row| {
            let is_dl: i64 = row.get(7)?;
            Ok(Chapter {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                chapter_index: row.get(2)?,
                title: row.get(3)?,
                content_html: row.get(4)?,
                source_url: row.get(5)?,
                word_count: row.get(6)?,
                is_downloaded: is_dl == 1,
                downloaded_at: row.get(8)?,
            })
        })?;

        let mut chapters = Vec::new();
        for r in rows {
            chapters.push(r?);
        }
        Ok(chapters)
    }

    pub fn get_all_rules(&self) -> Result<Vec<Rule>> {
        let mut stmt = self.conn.prepare(
            "SELECT guid, rule_name, url_regex, parser_type, pagetype_code, toc_code, chapter_code, url_blocks, version, updated_at
             FROM rules ORDER BY rule_name ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(Rule {
                guid: row.get(0)?,
                rule_name: row.get(1)?,
                url_regex: row.get(2)?,
                parser_type: row.get(3)?,
                pagetype_code: row.get(4)?,
                toc_code: row.get(5)?,
                chapter_code: row.get(6)?,
                url_blocks: row.get(7)?,
                version: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut rules = Vec::new();
        for r in rows {
            rules.push(r?);
        }
        Ok(rules)
    }

    pub fn upsert_novel(&self, novel: &Novel) -> Result<()> {
        self.conn.execute(
            r#"
            INSERT INTO novels (id, title, author, cover_url, cover_local_path, summary, source_url, rule_guid, total_chapters, downloaded_chapters, check_updates, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                author = excluded.author,
                cover_url = excluded.cover_url,
                summary = excluded.summary,
                rule_guid = excluded.rule_guid,
                total_chapters = excluded.total_chapters,
                downloaded_chapters = excluded.downloaded_chapters,
                updated_at = datetime('now')
            "#,
            rusqlite::params![
                novel.id,
                novel.title,
                novel.author,
                novel.cover_url,
                novel.cover_local_path,
                novel.summary,
                novel.source_url,
                novel.rule_guid,
                novel.total_chapters,
                novel.downloaded_chapters,
                if novel.check_updates { 1 } else { 0 },
            ],
        )?;
        Ok(())
    }

    pub fn save_chapter_content(
        &self,
        novel_id: &str,
        chapter_index: i64,
        title: &str,
        content_html: &str,
        source_url: &str,
        word_count: i64,
    ) -> Result<()> {
        let chapter_id = format!("{}_ch_{}", novel_id, chapter_index);
        self.conn.execute(
            r#"
            INSERT INTO chapters (id, novel_id, chapter_index, title, content_html, source_url, word_count, is_downloaded, downloaded_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, datetime('now'))
            ON CONFLICT(novel_id, chapter_index) DO UPDATE SET
                title = excluded.title,
                content_html = excluded.content_html,
                source_url = excluded.source_url,
                word_count = excluded.word_count,
                is_downloaded = 1,
                downloaded_at = datetime('now')
            "#,
            rusqlite::params![
                chapter_id,
                novel_id,
                chapter_index,
                title,
                content_html,
                source_url,
                word_count,
            ],
        )?;

        // Update novel's downloaded_chapters count
        self.conn.execute(
            r#"
            UPDATE novels
            SET downloaded_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = ?1 AND is_downloaded = 1),
                updated_at = datetime('now')
            WHERE id = ?1
            "#,
            rusqlite::params![novel_id],
        )?;

        Ok(())
    }

    pub fn get_chapter_content(&self, novel_id: &str, chapter_index: i64) -> Result<Option<Chapter>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, novel_id, chapter_index, title, content_html, source_url, word_count, is_downloaded, downloaded_at
             FROM chapters WHERE novel_id = ? AND chapter_index = ?",
        )?;

        let mut rows = stmt.query_map(rusqlite::params![novel_id, chapter_index], |row| {
            let is_dl: i64 = row.get(7)?;
            Ok(Chapter {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                chapter_index: row.get(2)?,
                title: row.get(3)?,
                content_html: row.get(4)?,
                source_url: row.get(5)?,
                word_count: row.get(6)?,
                is_downloaded: is_dl == 1,
                downloaded_at: row.get(8)?,
            })
        })?;

        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    pub fn get_reading_progress(&self, novel_id: &str) -> Result<Option<ReadingProgress>> {
        let mut stmt = self.conn.prepare(
            "SELECT novel_id, last_chapter_index, scroll_percentage, updated_at
             FROM reading_progress WHERE novel_id = ?",
        )?;

        let mut rows = stmt.query_map([novel_id], |row| {
            Ok(ReadingProgress {
                novel_id: row.get(0)?,
                last_chapter_index: row.get(1)?,
                scroll_percentage: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })?;

        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    pub fn save_reading_progress(
        &self,
        novel_id: &str,
        chapter_index: i64,
        scroll_percentage: f64,
    ) -> Result<()> {
        self.conn.execute(
            r#"
            INSERT INTO reading_progress (novel_id, last_chapter_index, scroll_percentage, updated_at)
            VALUES (?1, ?2, ?3, datetime('now'))
            ON CONFLICT(novel_id) DO UPDATE SET
                last_chapter_index = excluded.last_chapter_index,
                scroll_percentage = excluded.scroll_percentage,
                updated_at = datetime('now')
            "#,
            rusqlite::params![novel_id, chapter_index, scroll_percentage],
        )?;
        Ok(())
    }
}
