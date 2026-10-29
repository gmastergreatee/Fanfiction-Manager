pub mod db;
pub mod scraper;

use db::{Chapter, Database, Novel, Rule};
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
            get_all_rules,
            fetch_novel_toc,
            fetch_chapter_content,
            sync_webview_cookies,
            batch_download_novel_chapters,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

