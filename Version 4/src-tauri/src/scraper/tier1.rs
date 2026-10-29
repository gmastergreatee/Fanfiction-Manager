use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TocSelectors {
    pub title: String,
    pub author: Option<String>,
    pub cover: Option<String>,
    pub summary: Option<String>,
    pub chapter_links: String,
    pub chapter_title_subselector: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ChapterSelectors {
    pub title: String,
    pub content: String,
    pub strip_selectors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedChapterLink {
    pub index: i64,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedTocResult {
    pub title: String,
    pub author: String,
    pub cover_url: String,
    pub summary: String,
    pub chapters: Vec<ParsedChapterLink>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedChapterResult {
    pub title: String,
    pub content_html: String,
    pub word_count: i64,
}

pub struct Tier1FastParser;

impl Tier1FastParser {
    /// Extract TOC metadata (novel title, cover, summary, chapter list)
    pub fn parse_toc(
        html_content: &str,
        selectors: &TocSelectors,
        base_url: &str,
    ) -> Result<ParsedTocResult, String> {
        let document = Html::parse_document(html_content);
        let base = reqwest::Url::parse(base_url).map_err(|e| e.to_string())?;

        // 1. Extract Title
        let title_sel = Selector::parse(&selectors.title)
            .map_err(|e| format!("Invalid title selector: {:?}", e))?;
        let title = document
            .select(&title_sel)
            .next()
            .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
            .unwrap_or_else(|| "Untitled Novel".to_string());

        // 2. Extract Author
        let author = if let Some(ref sel_str) = selectors.author {
            if let Ok(sel) = Selector::parse(sel_str) {
                document
                    .select(&sel)
                    .next()
                    .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
                    .unwrap_or_default()
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        // 3. Extract Cover URL
        let cover_url = if let Some(ref sel_str) = selectors.cover {
            if let Ok(sel) = Selector::parse(sel_str) {
                document
                    .select(&sel)
                    .next()
                    .and_then(|el| {
                        el.value()
                            .attr("src")
                            .or_else(|| el.value().attr("data-src"))
                            .or_else(|| el.value().attr("href"))
                    })
                    .and_then(|href| base.join(href).ok().map(|u| u.to_string()))
                    .unwrap_or_default()
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        // 4. Extract Summary
        let summary = if let Some(ref sel_str) = selectors.summary {
            if let Ok(sel) = Selector::parse(sel_str) {
                document
                    .select(&sel)
                    .map(|el| el.inner_html())
                    .collect::<Vec<_>>()
                    .join("\n")
                    .trim()
                    .to_string()
            } else {
                String::new()
            }
        } else {
            String::new()
        };

        // 5. Extract Chapter Links
        let links_sel = Selector::parse(&selectors.chapter_links)
            .map_err(|e| format!("Invalid chapter links selector: {:?}", e))?;
        let mut chapters = Vec::new();
        let mut idx = 1;

        for element in document.select(&links_sel) {
            let href_opt = element
                .value()
                .attr("href")
                .or_else(|| element.value().attr("data-url"));

            if let Some(href) = href_opt {
                if let Ok(full_url) = base.join(href) {
                    let ch_title = if let Some(ref sub_sel_str) = selectors.chapter_title_subselector {
                        if let Ok(sub_sel) = Selector::parse(sub_sel_str) {
                            element
                                .select(&sub_sel)
                                .next()
                                .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
                                .unwrap_or_else(|| element.text().collect::<Vec<_>>().join(" ").trim().to_string())
                        } else {
                            element.text().collect::<Vec<_>>().join(" ").trim().to_string()
                        }
                    } else {
                        element.text().collect::<Vec<_>>().join(" ").trim().to_string()
                    };

                    let clean_title = if ch_title.is_empty() {
                        format!("Chapter {}", idx)
                    } else {
                        ch_title
                    };

                    chapters.push(ParsedChapterLink {
                        index: idx,
                        title: clean_title,
                        url: full_url.to_string(),
                    });
                    idx += 1;
                }
            }
        }

        Ok(ParsedTocResult {
            title,
            author,
            cover_url,
            summary,
            chapters,
        })
    }

    /// Extract Chapter Content and clean unwanted advertising/scripts
    pub fn parse_chapter(
        html_content: &str,
        selectors: &ChapterSelectors,
    ) -> Result<ParsedChapterResult, String> {
        let document = Html::parse_document(html_content);

        // 1. Chapter Title
        let title_sel = Selector::parse(&selectors.title)
            .map_err(|e| format!("Invalid chapter title selector: {:?}", e))?;
        let title = document
            .select(&title_sel)
            .next()
            .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
            .unwrap_or_else(|| "Chapter".to_string());

        // 2. Chapter Content
        let content_sel = Selector::parse(&selectors.content)
            .map_err(|e| format!("Invalid chapter content selector: {:?}", e))?;
        let content_el = document
            .select(&content_sel)
            .next()
            .ok_or_else(|| "Content element not found matching selector".to_string())?;

        let mut raw_html = content_el.inner_html();

        // 3. Strip unwanted elements & advertisements
        let default_strips = [
            "script", "style", "noscript", "iframe", ".ads", ".advertisement",
            ".pirate", ".watermark", "div[id^='ad']"
        ];

        for strip in default_strips.iter().copied().chain(selectors.strip_selectors.iter().map(|s| s.as_str())) {
            let re_pattern = format!(r"(?is)<{}[^>]*>.*?</{}>", strip, strip);
            if let Ok(re) = regex::Regex::new(&re_pattern) {
                raw_html = re.replace_all(&raw_html, "").to_string();
            }
        }

        // Clean up common boilerplate comments & redundant whitespace
        let cleaned_html = raw_html
            .replace("<!--", "")
            .replace("-->", "")
            .trim()
            .to_string();

        // 4. Calculate word count from stripped text
        let text_content = content_el.text().collect::<Vec<_>>().join(" ");
        let word_count = text_content
            .split_whitespace()
            .count() as i64;

        Ok(ParsedChapterResult {
            title,
            content_html: cleaned_html,
            word_count,
        })
    }
}
