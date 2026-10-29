use serde::{Deserialize, Serialize};
use super::client::CookieEntry;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebViewScrapeRequest {
    pub url: String,
    pub script_to_inject: String,
    pub timeout_seconds: u64,
    pub is_headless: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebViewScrapeResponse {
    pub url: String,
    pub extracted_json: String,
    pub cookies: Vec<CookieEntry>,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptchaResolutionEvent {
    pub url: String,
    pub user_agent: String,
    pub cookies: Vec<CookieEntry>,
    pub resolved_at: String,
}

/// Helper to generate safe client-side extraction scripts with jQuery polyfill
pub fn wrap_extraction_script(raw_script: &str) -> String {
    format!(
        r#"(async function() {{
            function injectJquery() {{
                if (!window.jQuery) {{
                    const s = document.createElement('script');
                    s.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
                    document.head.appendChild(s);
                }}
            }}
            function sleep(ms) {{
                return new Promise(resolve => setTimeout(resolve, ms));
            }}
            try {{
                const result = await (async () => {{
                    {}
                }})();
                return JSON.stringify({{ success: true, data: result }});
            }} catch (err) {{
                return JSON.stringify({{ success: false, error: err.toString() }});
            }}
        }})()"#,
        raw_script
    )
}

