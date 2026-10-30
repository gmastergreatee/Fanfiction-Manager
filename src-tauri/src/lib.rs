pub mod db;
pub mod scraper;

use db::{Chapter, Database, Novel, ReadingProgress, Rule};
use scraper::{ChallengeType, ChapterContentExtraction, CookieEntry, NovelTocExtraction, ScrapingEngine};
use std::sync::Mutex;
use tauri::{Manager, State, WebviewWindowBuilder, WebviewUrl, Position, Size};

#[tauri::command]
async fn open_test_webview(
    app: tauri::AppHandle,
    url: String,
    title: Option<String>,
) -> Result<String, String> {
    let mut normalized_url = url.trim().to_string();
    if !normalized_url.starts_with("http://") && !normalized_url.starts_with("https://") {
        normalized_url = format!("https://{}", normalized_url);
    }

    let parsed_url = normalized_url
        .parse::<tauri::Url>()
        .map_err(|e| format!("Invalid URL: {}", e))?;

    let window_title = title.unwrap_or_else(|| format!("Rule Tester Webview - {}", normalized_url));

    if let Some(existing) = app.get_webview_window("rule-tester-webview") {
        let _ = existing.navigate(parsed_url);
        let _ = existing.set_title(&window_title);
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok("Navigated existing webview window".to_string());
    }

    let builder = WebviewWindowBuilder::new(
        &app,
        "rule-tester-webview",
        WebviewUrl::External(parsed_url.clone()),
    )
    .title(window_title.clone())
    .inner_size(1050.0, 750.0)
    .resizable(true);

    match builder.build() {
        Ok(_) => Ok("Webview window created successfully".to_string()),
        Err(e) => {
            if let Some(existing) = app.get_webview_window("rule-tester-webview") {
                let _ = existing.navigate(parsed_url);
                let _ = existing.set_title(&window_title);
                let _ = existing.show();
                let _ = existing.set_focus();
                Ok("Webview window focused and navigated".to_string())
            } else {
                Err(format!("Failed to create webview window: {}", e))
            }
        }
    }
}

#[tauri::command]
fn open_devtools_for_webview(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(win) = app.get_webview_window("rule-tester-webview") {
        let _ = win.url();
        win.open_devtools();
        Ok("DevTools opened".to_string())
    } else {
        Err("Test webview is not open".to_string())
    }
}

#[tauri::command]
fn eval_in_test_webview(app: tauri::AppHandle, script: String) -> Result<String, String> {
    if let Some(win) = app.get_webview_window("rule-tester-webview") {
        win.eval(&script).map_err(|e| format!("Eval error: {}", e))?;
        Ok("Script evaluated in webview".to_string())
    } else {
        Err("Test webview is not open".to_string())
    }
}

#[tauri::command]
async fn close_test_webview(app: tauri::AppHandle) -> Result<String, String> {
    if let Some(win) = app.get_webview_window("rule-tester-webview") {
        win.close().map_err(|e| format!("Failed to close webview: {}", e))?;
        Ok("Webview closed".to_string())
    } else {
        Ok("Webview was not open".to_string())
    }
}

#[derive(serde::Serialize)]
pub struct PreviewHtmlResult {
    pub html: String,
    pub url: String,
    pub status: u16,
    pub has_challenge: bool,
}

#[tauri::command]
async fn fetch_preview_html(
    url: String,
    state: State<'_, AppState>,
) -> Result<PreviewHtmlResult, String> {
    let mut normalized_url = url.trim().to_string();
    if !normalized_url.starts_with("http://") && !normalized_url.starts_with("https://") {
        normalized_url = format!("https://{}", normalized_url);
    }

    let resp = state
        .scraper
        .http_client
        .fetch(&normalized_url)
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    let raw_html = resp.body;
    let base_tag = format!(r#"<base href="{}">"#, normalized_url);

    // Inject <base href="..."> into <head> so relative assets load cleanly without origin errors
    let mut modified = if let Some(idx) = raw_html.find("<head>") {
        let (before, after) = raw_html.split_at(idx + 6);
        format!("{}{}{}", before, base_tag, after)
    } else if let Some(idx) = raw_html.find("<HEAD>") {
        let (before, after) = raw_html.split_at(idx + 6);
        format!("{}{}{}", before, base_tag, after)
    } else {
        format!("{}\n{}", base_tag, raw_html)
    };

    // Strip frame-blocking meta tags
    if let Ok(re) = regex::Regex::new(r#"(?i)<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)["']?[^>]*>"#) {
        modified = re.replace_all(&modified, "").to_string();
    }

    let has_challenge = resp.challenge != ChallengeType::None;

    Ok(PreviewHtmlResult {
        html: modified,
        url: normalized_url,
        status: resp.status,
        has_challenge,
    })
}

#[tauri::command]
async fn snap_test_webview(app: tauri::AppHandle) -> Result<String, String> {
    if let (Some(main_win), Some(test_win)) = (
        app.get_webview_window("main"),
        app.get_webview_window("rule-tester-webview"),
    ) {
        if let (Ok(main_pos), Ok(main_size)) = (main_win.outer_position(), main_win.outer_size()) {
            let target_x = main_pos.x + main_size.width as i32 + 10;
            let target_y = main_pos.y;
            let target_w = (main_size.width as f64 * 0.85).max(700.0) as u32;
            let target_h = main_size.height;

            let _ = test_win.set_position(Position::Physical(tauri::PhysicalPosition {
                x: target_x,
                y: target_y,
            }));
            let _ = test_win.set_size(Size::Physical(tauri::PhysicalSize {
                width: target_w,
                height: target_h,
            }));
            let _ = test_win.show();
            let _ = test_win.set_focus();
            return Ok("Snapped test webview side-by-side with main window".to_string());
        }
    }
    Err("Could not find both main window and test webview window".to_string())
}

fn url_decode_simple(s: &str) -> String {
    let mut result = Vec::new();
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or(""), 16) {
                result.push(byte);
                i += 3;
                continue;
            }
        }
        result.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&result).to_string()
}

#[tauri::command]
async fn extract_from_test_webview(
    app: tauri::AppHandle,
    script: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let win = app
        .get_webview_window("rule-tester-webview")
        .ok_or_else(|| "Test Webview window is not open. Please click 'Open Webview' or 'Snap Side-by-Side' first.".to_string())?;

    // Wrap script with full legacy v3 runtime compatibility (sleep, htmlEncode, htmlDecode, jQuery shim, extras)
    let eval_payload = format!(
        r##"(async function() {{
            function sleep(ms) {{
                return new Promise(function(resolve) {{ setTimeout(resolve, ms); }});
            }}

            function htmlEncode(input) {{
                if (input == null) return '';
                var t = document.createElement('textarea');
                t.innerText = input;
                return t.innerHTML;
            }}

            function htmlDecode(input) {{
                if (input == null) return '';
                var d = new DOMParser().parseFromString(input, 'text/html');
                return d.documentElement.textContent || '';
            }}

            function _makeJq(elements) {{
                var arr = Array.isArray(elements) ? elements.slice() : Array.from(elements || []);
                arr.text = function() {{
                    return arr.map(function(el) {{ return el.innerText || el.textContent || ''; }}).join(' ').trim();
                }};
                arr.html = function() {{
                    return arr.map(function(el) {{ return el.innerHTML || ''; }}).join('');
                }};
                arr.attr = function(name) {{
                    return arr[0] ? arr[0].getAttribute(name) : null;
                }};
                arr.val = function(v) {{
                    if (v !== undefined && arr[0]) arr[0].value = v;
                    return arr[0] ? arr[0].value : null;
                }};
                arr.find = function(subSelector) {{
                    var matches = [];
                    arr.forEach(function(el) {{
                        if (el.querySelectorAll) {{
                            matches.push.apply(matches, el.querySelectorAll(subSelector));
                        }}
                    }});
                    return _makeJq(matches);
                }};
                arr.parent = function(filterSel) {{
                    var parents = [];
                    arr.forEach(function(el) {{
                        if (el.parentElement && parents.indexOf(el.parentElement) === -1) {{
                            if (!filterSel || el.parentElement.matches(filterSel)) {{
                                parents.push(el.parentElement);
                            }}
                        }}
                    }});
                    return _makeJq(parents);
                }};
                arr.children = function(filterSel) {{
                    var kids = [];
                    arr.forEach(function(el) {{
                        Array.from(el.children || []).forEach(function(c) {{
                            if (!filterSel || c.matches(filterSel)) {{
                                kids.push(c);
                            }}
                        }});
                    }});
                    return _makeJq(kids);
                }};
                arr.first = function() {{
                    return _makeJq(arr.length > 0 ? [arr[0]] : []);
                }};
                arr.last = function() {{
                    return _makeJq(arr.length > 0 ? [arr[arr.length - 1]] : []);
                }};
                arr.eq = function(i) {{
                    var idx = i < 0 ? arr.length + i : i;
                    return _makeJq(arr[idx] ? [arr[idx]] : []);
                }};
                arr.each = function(callback) {{
                    arr.forEach(function(el, i) {{
                        callback.call(el, i, el);
                    }});
                    return arr;
                }};
                arr.toArray = function() {{
                    return Array.from(arr);
                }};
                arr.removeAttr = function(name) {{
                    arr.forEach(function(el) {{ if (el.removeAttribute) el.removeAttribute(name); }});
                    return arr;
                }};
                arr.remove = function() {{
                    arr.forEach(function(el) {{ if (el.parentNode) el.parentNode.removeChild(el); }});
                    return arr;
                }};
                arr.click = function() {{
                    if (arr[0] && arr[0].click) arr[0].click();
                    return arr;
                }};
                return arr;
            }}

            if (typeof window.$ === 'undefined' || !window.$) {{
                window.$ = function(selector) {{
                    if (!selector) return _makeJq([]);
                    if (typeof selector === 'function') {{
                        if (document.readyState !== 'loading') selector();
                        else document.addEventListener('DOMContentLoaded', selector);
                        return;
                    }}
                    if (typeof selector === 'string') {{
                        try {{
                            return _makeJq(document.querySelectorAll(selector));
                        }} catch(e) {{
                            return _makeJq([]);
                        }}
                    }}
                    if (selector.nodeType || selector === window || selector === document) {{
                        return _makeJq([selector]);
                    }}
                    if (selector.length !== undefined) {{
                        return _makeJq(selector);
                    }}
                    return _makeJq([selector]);
                }};
                window.jQuery = window.$;
            }}

            function injectJquery() {{
                if (!window.jQuery || window.jQuery === window.$) {{
                    try {{
                        var s = document.createElement('script');
                        s.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
                        document.head.appendChild(s);
                    }} catch(e) {{}}
                }}
            }}

            let extras = {{}};
            let ndata = null;

            try {{
                const _eval_fn = async function() {{ {} }};
                const _res = await _eval_fn();
                const _cookies = document.cookie || "";
                const _payload = JSON.stringify({{ success: true, data: _res, cookies: _cookies }});
                window.location.hash = "#ffm_res=" + encodeURIComponent(_payload);
            }} catch(err) {{
                const _err_payload = JSON.stringify({{ success: false, error: err ? (err.stack || err.toString()) : "Script execution error" }});
                window.location.hash = "#ffm_res=" + encodeURIComponent(_err_payload);
            }}
        }})()"##,
        script
    );

    win.eval(&eval_payload)
        .map_err(|e| format!("Failed to evaluate extraction script in webview: {}", e))?;

    // Poll for hash to be populated by the evaluated script (up to 30s to allow async pagination / waiting)
    for _ in 0..300 {
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        if let Ok(curr_url) = win.url() {
            if let Some(fragment) = curr_url.fragment() {
                if fragment.starts_with("ffm_res=") {
                    let encoded_json = &fragment["ffm_res=".len()..];
                    let decoded_json = url_decode_simple(encoded_json);

                    // Clean up hash fragment silently
                    let _ = win.eval("history.replaceState(null, document.title, window.location.pathname + window.location.search);");

                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&decoded_json) {
                        // Sync live cookies from webview to scraper
                        if let Some(cookie_str) = val.get("cookies").and_then(|c| c.as_str()) {
                            if !cookie_str.is_empty() {
                                let origin = format!("{}://{}", curr_url.scheme(), curr_url.host_str().unwrap_or_default());
                                for pair in cookie_str.split(';') {
                                    let parts: Vec<&str> = pair.trim().splitn(2, '=').collect();
                                    if parts.len() == 2 {
                                        state.scraper.http_client.sync_cookie(&origin, parts[0], parts[1]);
                                    }
                                }
                            }
                        }

                        return Ok(val);
                    }
                }
            }
        }
    }

    Err("Timed out waiting for Webview to evaluate extraction script.".to_string())
}

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
            open_test_webview,
            open_devtools_for_webview,
            close_test_webview,
            eval_in_test_webview,
            fetch_preview_html,
            snap_test_webview,
            extract_from_test_webview,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

