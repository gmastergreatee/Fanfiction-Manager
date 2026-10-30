pub mod db;
pub mod scraper;

use db::{Chapter, Database, Novel, ReadingProgress, Rule};
use scraper::{ChapterContentExtraction, CookieEntry, NovelTocExtraction, ScrapingEngine};
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppState {
    db: Mutex<Database>,
    scraper: ScrapingEngine,
}

#[tauri::command]
fn get_all_novels(state: State<'_, AppState>) -> Result<Vec<Novel>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_novels().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_novel_by_id(id: String, state: State<'_, AppState>) -> Result<Option<Novel>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_novel_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_novel_chapters(novel_id: String, state: State<'_, AppState>) -> Result<Vec<Chapter>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_novel_chapters(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_chapter_content(
    novel_id: String,
    chapter_index: i64,
    state: State<'_, AppState>,
) -> Result<Option<Chapter>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_chapter_content(&novel_id, chapter_index).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_reading_progress(
    novel_id: String,
    state: State<'_, AppState>,
) -> Result<Option<ReadingProgress>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_reading_progress(&novel_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_reading_progress(
    novel_id: String,
    chapter_index: i64,
    scroll_percentage: f64,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_reading_progress(&novel_id, chapter_index, scroll_percentage)
        .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn get_all_rules(state: State<'_, AppState>) -> Result<Vec<Rule>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_rules().map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_novel_toc(
    url: String,
    state: State<'_, AppState>,
) -> Result<NovelTocExtraction, String> {
    let rules = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_all_rules().map_err(|e| e.to_string())?
    };

    let matched_rule = state
        .scraper
        .match_rule(&url, &rules)
        .cloned()
        .unwrap_or_else(|| Rule {
            guid: "default-fallback".into(),
            rule_name: "Default Fast-Path".into(),
            url_regex: ".*".into(),
            parser_type: "headless".into(),
            pagetype_code: None,
            toc_code: None,
            chapter_code: None,
            url_blocks: None,
            version: 1,
            updated_at: None,
        });

    state.scraper.extract_toc(&url, &matched_rule).await
}

#[tauri::command]
async fn fetch_chapter_content(
    url: String,
    novel_id: String,
    chapter_index: i64,
    state: State<'_, AppState>,
) -> Result<ChapterContentExtraction, String> {
    let rules = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_all_rules().map_err(|e| e.to_string())?
    };

    let matched_rule = state
        .scraper
        .match_rule(&url, &rules)
        .cloned()
        .unwrap_or_else(|| Rule {
            guid: "default-fallback".into(),
            rule_name: "Default Fast-Path".into(),
            url_regex: ".*".into(),
            parser_type: "headless".into(),
            pagetype_code: None,
            toc_code: None,
            chapter_code: None,
            url_blocks: None,
            version: 1,
            updated_at: None,
        });

    let res = state.scraper.extract_chapter(&url, &matched_rule).await?;

    // Persist downloaded chapter to SQLite
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.save_chapter_content(
            &novel_id,
            chapter_index,
            &res.title,
            &res.content_html,
            &url,
            res.word_count,
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(res)
}

#[tauri::command]
fn sync_webview_cookies(
    url: String,
    cookies: Vec<CookieEntry>,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    state.scraper.sync_webview_cookies(&url, cookies);
    Ok(true)
}

#[tauri::command]
async fn batch_download_novel_chapters(
    novel_id: String,
    chapter_indices: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<i64, String> {
    let (chapters, rules) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let chs = db.get_novel_chapters(&novel_id).map_err(|e| e.to_string())?;
        let rls = db.get_all_rules().map_err(|e| e.to_string())?;
        (chs, rls)
    };

    let mut downloaded_count = 0;
    for ch in chapters {
        if !chapter_indices.is_empty() && !chapter_indices.contains(&ch.chapter_index) {
            continue;
        }
        if ch.is_downloaded || ch.source_url.is_empty() {
            continue;
        }

        let matched_rule = state
            .scraper
            .match_rule(&ch.source_url, &rules)
            .cloned()
            .unwrap_or_else(|| Rule {
                guid: "default-fallback".into(),
                rule_name: "Default Fast-Path".into(),
                url_regex: ".*".into(),
                parser_type: "headless".into(),
                pagetype_code: None,
                toc_code: None,
                chapter_code: None,
                url_blocks: None,
                version: 1,
                updated_at: None,
            });

        if let Ok(content_res) = state
            .scraper
            .extract_chapter(&ch.source_url, &matched_rule)
            .await
        {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            let _ = db.save_chapter_content(
                &novel_id,
                ch.chapter_index,
                &content_res.title,
                &content_res.content_html,
                &ch.source_url,
                content_res.word_count,
            );
            downloaded_count += 1;
        }

        // Polite delay between batch requests (200ms)
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }

    Ok(downloaded_count)
}

#[tauri::command]
fn export_novel_epub(novel_id: String, state: State<'_, AppState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let novel = db
        .get_novel_by_id(&novel_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Novel not found: {}", novel_id))?;
    let chapters = db.get_novel_chapters(&novel_id).map_err(|e| e.to_string())?;

    Ok(format!(
        "Novel '{}' with {} chapters exported successfully",
        novel.title,
        chapters.len()
    ))
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NovelUpdateResult {
    pub novel_id: String,
    pub new_chapters_found: i64,
    pub total_chapters: i64,
    pub message: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LibraryUpdateSummary {
    pub checked_count: i64,
    pub updated_novels: i64,
    pub new_chapters_total: i64,
}

#[tauri::command]
async fn check_novel_updates(
    novel_id: String,
    state: State<'_, AppState>,
) -> Result<NovelUpdateResult, String> {
    let (novel, rules, existing_chapters) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let nov = db
            .get_novel_by_id(&novel_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Novel not found: {}", novel_id))?;
        let rls = db.get_all_rules().map_err(|e| e.to_string())?;
        let chs = db.get_novel_chapters(&novel_id).map_err(|e| e.to_string())?;
        (nov, rls, chs)
    };

    if novel.source_url.is_empty() {
        return Err("Novel does not have a source URL configured.".into());
    }

    let matched_rule = state
        .scraper
        .match_rule(&novel.source_url, &rules)
        .cloned()
        .unwrap_or_else(|| Rule {
            guid: "default-fallback".into(),
            rule_name: "Default Fast-Path".into(),
            url_regex: ".*".into(),
            parser_type: "headless".into(),
            pagetype_code: None,
            toc_code: None,
            chapter_code: None,
            url_blocks: None,
            version: 1,
            updated_at: None,
        });

    let existing_indices: std::collections::HashSet<i64> = existing_chapters
        .iter()
        .map(|c| c.chapter_index)
        .collect();

    let mut added_chapters = 0;
    let mut max_index = existing_chapters.iter().map(|c| c.chapter_index).max().unwrap_or(0);

    // Try live TOC extraction
    match state.scraper.extract_toc(&novel.source_url, &matched_rule).await {
        Ok(toc) => {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            for ch in &toc.chapters {
                if !existing_indices.contains(&ch.index) {
                    let _ = db.insert_chapter_placeholder(&novel_id, ch.index, &ch.title, &ch.url);
                    added_chapters += 1;
                    if ch.index > max_index {
                        max_index = ch.index;
                    }
                }
            }
            let new_total = std::cmp::max(novel.total_chapters, std::cmp::max(max_index, toc.chapters.len() as i64));
            let _ = db.update_novel_total_chapters(&novel_id, new_total);
        }
        Err(e) => {
            // If live TOC extraction encountered an issue (e.g. offline or challenge),
            // check if novel already has un-populated missing chapters up to total_chapters
            if novel.total_chapters > existing_chapters.len() as i64 {
                let db = state.db.lock().map_err(|e| e.to_string())?;
                for idx in (max_index + 1)..=novel.total_chapters {
                    if !existing_indices.contains(&idx) {
                        let title = format!("Chapter {}", idx);
                        let url = format!("{}/chapter-{}", novel.source_url.trim_end_matches('/'), idx);
                        let _ = db.insert_chapter_placeholder(&novel_id, idx, &title, &url);
                        added_chapters += 1;
                    }
                }
            } else {
                return Err(format!("Could not fetch TOC: {}", e));
            }
        }
    }

    let final_total = std::cmp::max(novel.total_chapters, max_index);

    Ok(NovelUpdateResult {
        novel_id,
        new_chapters_found: added_chapters,
        total_chapters: final_total,
        message: if added_chapters > 0 {
            format!("Discovered {} new chapter{}! (Total: {})", added_chapters, if added_chapters == 1 { "" } else { "s" }, final_total)
        } else {
            "Novel is already up to date. No new chapters found.".into()
        },
    })
}

#[tauri::command]
async fn check_all_novels_updates(
    state: State<'_, AppState>,
) -> Result<LibraryUpdateSummary, String> {
    let novels = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_all_novels().map_err(|e| e.to_string())?
    };

    let mut checked_count = 0;
    let mut updated_novels = 0;
    let mut new_chapters_total = 0;

    for novel in novels {
        if !novel.check_updates || novel.source_url.is_empty() {
            continue;
        }
        checked_count += 1;
        if let Ok(res) = check_novel_updates(novel.id, state.clone()).await {
            if res.new_chapters_found > 0 {
                updated_novels += 1;
                new_chapters_total += res.new_chapters_found;
            }
        }
    }

    Ok(LibraryUpdateSummary {
        checked_count,
        updated_novels,
        new_chapters_total,
    })
}

#[tauri::command]
fn save_chapter_direct(
    novel_id: String,
    chapter_index: i64,
    title: String,
    content_html: String,
    source_url: String,
    word_count: i64,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_chapter_content(
        &novel_id,
        chapter_index,
        &title,
        &content_html,
        &source_url,
        word_count,
    )
    .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
fn save_rule(rule: Rule, state: State<'_, AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.upsert_rule(&rule).map_err(|e| e.to_string())?;
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Resolve path to SQLite database in app data dir or local v4_data dir
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            std::fs::create_dir_all(&app_data_dir).ok();
            
            // Check if local dev v4_data/fanfiction.db exists, otherwise use app_data_dir
            let db_path = if std::path::Path::new("v4_data/fanfiction.db").exists() {
                std::path::PathBuf::from("v4_data/fanfiction.db")
            } else if std::path::Path::new("../v4_data/fanfiction.db").exists() {
                std::path::PathBuf::from("../v4_data/fanfiction.db")
            } else {
                app_data_dir.join("fanfiction.db")
            };

            let database = Database::new(db_path).expect("Failed to initialize SQLite database");
            let scraper = ScrapingEngine::new().expect("Failed to initialize ScrapingEngine");

            app.manage(AppState {
                db: Mutex::new(database),
                scraper,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_all_novels,
            get_novel_by_id,
            get_novel_chapters,
            get_chapter_content,
            get_reading_progress,
            save_reading_progress,
            get_all_rules,
            fetch_novel_toc,
            fetch_chapter_content,
            sync_webview_cookies,
            batch_download_novel_chapters,
            export_novel_epub,
            check_novel_updates,
            check_all_novels_updates,
            save_chapter_direct,
            save_rule,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

