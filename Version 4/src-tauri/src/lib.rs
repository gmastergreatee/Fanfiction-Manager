pub mod db;

use db::{Chapter, Database, Novel, Rule};
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppState {
    db: Mutex<Database>,
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
            app.manage(AppState {
                db: Mutex::new(database),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_all_novels,
            get_novel_by_id,
            get_novel_chapters,
            get_all_rules,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

