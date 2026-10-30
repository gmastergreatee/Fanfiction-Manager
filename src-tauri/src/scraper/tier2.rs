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

/// Helper to generate safe client-side extraction scripts with jQuery polyfill & v3 runtime helpers
pub fn wrap_extraction_script(raw_script: &str) -> String {
    format!(
        r#"(async function() {{
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
                const result = await (async () => {{
                    {}
                }})();
                return JSON.stringify({{ success: true, data: result }});
            }} catch (err) {{
                return JSON.stringify({{ success: false, error: err ? (err.stack || err.toString()) : "Script error" }});
            }}
        }})()"#,
        raw_script
    )
}

