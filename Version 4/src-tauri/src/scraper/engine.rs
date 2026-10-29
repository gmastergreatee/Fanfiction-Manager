use crate::db::Rule;
use crate::scraper::client::{ChallengeType, CookieEntry, ScraperHttpClient};
use crate::scraper::tier1::{ChapterSelectors, Tier1FastParser, TocSelectors};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovelTocExtraction {
    pub title: String,
    pub author: String,
    pub cover_url: String,
    pub summary: String,
    pub chapters: Vec<ChapterLinkItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterLinkItem {
    pub index: i64,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChapterContentExtraction {
    pub title: String,
    pub content_html: String,
    pub word_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgressEvent {
    pub novel_id: String,
    pub chapter_index: i64,
    pub total_chapters: i64,
    pub title: String,
    pub status: String, // "downloading" | "saved" | "error"
}

#[derive(Clone)]
pub struct ScrapingEngine {
    pub http_client: Arc<ScraperHttpClient>,
}

impl ScrapingEngine {
    pub fn new() -> Result<Self, String> {
        let http_client = ScraperHttpClient::new().map_err(|e| e.to_string())?;
        Ok(ScrapingEngine {
            http_client: Arc::new(http_client),
        })
    }

    /// Match a novel URL against registered rules and return the best matching rule
    pub fn match_rule<'a>(&self, url: &str, rules: &'a [Rule]) -> Option<&'a Rule> {
        for rule in rules {
            if let Ok(re) = regex::Regex::new(&rule.url_regex) {
                if re.is_match(url) {
                    return Some(rule);
                }
            }
        }
        None
    }

    /// Extract Table of Contents metadata from a novel URL using Fast-Path Tier 1 or rule fallback
    pub async fn extract_toc(&self, url: &str, rule: &Rule) -> Result<NovelTocExtraction, String> {
        let resp = self
            .http_client
            .fetch(url)
            .await
            .map_err(|e| format!("HTTP request failed: {}", e))?;

        if resp.challenge != ChallengeType::None {
            return Err(format!(
                "Site challenge detected ({:?}) on {}. WebView captcha resolution (Tier 3) required.",
                resp.challenge, url
            ));
        }

        // Try to parse structured selectors if defined in rule JSON
        let selectors = Self::extract_toc_selectors(rule);
        let parsed = Tier1FastParser::parse_toc(&resp.body, &selectors, &resp.url)?;

        Ok(NovelTocExtraction {
            title: parsed.title,
            author: parsed.author,
            cover_url: parsed.cover_url,
            summary: parsed.summary,
            chapters: parsed
                .chapters
                .into_iter()
                .map(|c| ChapterLinkItem {
                    index: c.index,
                    title: c.title,
                    url: c.url,
                })
                .collect(),
        })
    }

    /// Extract single chapter content using Fast-Path Tier 1
    pub async fn extract_chapter(
        &self,
        url: &str,
        rule: &Rule,
    ) -> Result<ChapterContentExtraction, String> {
        let resp = self
            .http_client
            .fetch(url)
            .await
            .map_err(|e| format!("HTTP request failed: {}", e))?;

        if resp.challenge != ChallengeType::None {
            return Err(format!(
                "Site challenge detected ({:?}) on {}. WebView captcha resolution (Tier 3) required.",
                resp.challenge, url
            ));
        }

        let selectors = Self::extract_chapter_selectors(rule);
        let parsed = Tier1FastParser::parse_chapter(&resp.body, &selectors)?;

        Ok(ChapterContentExtraction {
            title: parsed.title,
            content_html: parsed.content_html,
            word_count: parsed.word_count,
        })
    }

    /// Synchronize cookies obtained from WebView interactive challenge sheet
    pub fn sync_webview_cookies(&self, url: &str, cookies: Vec<CookieEntry>) {
        self.http_client.sync_cookies(url, &cookies);
    }

    // Helper: Map rule definition to TocSelectors
    fn extract_toc_selectors(rule: &Rule) -> TocSelectors {
        let rule_name = rule.rule_name.to_lowercase();
        if rule_name.contains("royalroad") {
            TocSelectors {
                title: ".fic-header h1".into(),
                author: Some(".fic-header h4 a".into()),
                cover: Some(".fic-header img".into()),
                summary: Some(".description".into()),
                chapter_links: "table#chapters tbody tr a[href*='/chapter/']".into(),
                chapter_title_subselector: None,
            }
        } else if rule_name.contains("archiveofourown") || rule_name.contains("ao3") {
            TocSelectors {
                title: "h2.title".into(),
                author: Some("a[rel='author']".into()),
                cover: None,
                summary: Some(".summary blockquote".into()),
                chapter_links: "ol.chapter li a".into(),
                chapter_title_subselector: None,
            }
        } else if rule_name.contains("lightnovelworld") {
            TocSelectors {
                title: "h1".into(),
                author: Some(".author a".into()),
                cover: Some(".glass-background img".into()),
                summary: Some(".summary .content".into()),
                chapter_links: "li[data-chapterno] a".into(),
                chapter_title_subselector: None,
            }
        } else if rule_name.contains("scribblehub") {
            TocSelectors {
                title: ".fic_title".into(),
                author: Some(".auth_name_fic".into()),
                cover: Some(".fic_image img".into()),
                summary: Some(".wi_fic_desc".into()),
                chapter_links: ".toc_o".into(),
                chapter_title_subselector: None,
            }
        } else {
            // General / default fallback selectors
            TocSelectors {
                title: "h1, .novel-title, .book-title".into(),
                author: Some(".novel-author, .author".into()),
                cover: Some(".novel-cover img, .cover img".into()),
                summary: Some(".novel-summary, .description, #description".into()),
                chapter_links: ".chapter-list a, .chapters a, ul.chapter-list li a".into(),
                chapter_title_subselector: None,
            }
        }
    }

    // Helper: Map rule definition to ChapterSelectors
    fn extract_chapter_selectors(rule: &Rule) -> ChapterSelectors {
        let rule_name = rule.rule_name.to_lowercase();
        if rule_name.contains("royalroad") {
            ChapterSelectors {
                title: ".fic-header h1, h1.font-white".into(),
                content: ".chapter-content".into(),
                strip_selectors: vec![".portlet".into(), ".ad".into()],
            }
        } else if rule_name.contains("archiveofourown") || rule_name.contains("ao3") {
            ChapterSelectors {
                title: "h3.title".into(),
                content: "div.userstuff".into(),
                strip_selectors: vec![".landmark".into()],
            }
        } else if rule_name.contains("lightnovelworld") {
            ChapterSelectors {
                title: ".chapter-title".into(),
                content: "#chapter-container".into(),
                strip_selectors: vec!["#chapter-container > div".into()],
            }
        } else if rule_name.contains("scribblehub") {
            ChapterSelectors {
                title: ".chapter-title".into(),
                content: ".chp_raw".into(),
                strip_selectors: vec![],
            }
        } else if rule_name.contains("fanfiction.net") {
            ChapterSelectors {
                title: "#chap_select option:checked, b.head".into(),
                content: ".storytext".into(),
                strip_selectors: vec!["script".into(), "style".into()],
            }
        } else {
            ChapterSelectors {
                title: "h1, .chapter-title, .entry-title".into(),
                content: "#chapter-content, .chapter-content, .entry-content, article".into(),
                strip_selectors: vec![],
            }
        }
    }
}
