use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, USER_AGENT};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;

pub const DEFAULT_USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ChallengeType {
    None,
    CloudflareTurnstile,
    CloudflareRay,
    RateLimited,
    AccessDenied,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapedResponse {
    pub url: String,
    pub status: u16,
    pub body: String,
    pub challenge: ChallengeType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieEntry {
    pub name: String,
    pub value: String,
    pub domain: Option<String>,
    pub path: Option<String>,
}

#[derive(Clone)]
pub struct ScraperHttpClient {
    pub client: Client,
    pub cookie_jar: Arc<reqwest::cookie::Jar>,
}

impl ScraperHttpClient {
    pub fn new() -> Result<Self, reqwest::Error> {
        let cookie_jar = Arc::new(reqwest::cookie::Jar::default());

        let mut headers = HeaderMap::new();
        headers.insert(USER_AGENT, HeaderValue::from_static(DEFAULT_USER_AGENT));
        headers.insert(
            ACCEPT,
            HeaderValue::from_static(
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            ),
        );
        headers.insert(
            ACCEPT_LANGUAGE,
            HeaderValue::from_static("en-US,en;q=0.9"),
        );
        headers.insert(
            "Sec-CH-UA",
            HeaderValue::from_static(
                "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
            ),
        );
        headers.insert("Sec-CH-UA-Mobile", HeaderValue::from_static("?0"));
        headers.insert(
            "Sec-CH-UA-Platform",
            HeaderValue::from_static("\"Windows\""),
        );
        headers.insert("Sec-Fetch-Dest", HeaderValue::from_static("document"));
        headers.insert("Sec-Fetch-Mode", HeaderValue::from_static("navigate"));
        headers.insert("Sec-Fetch-Site", HeaderValue::from_static("none"));
        headers.insert("Sec-Fetch-User", HeaderValue::from_static("?1"));
        headers.insert(
            "Upgrade-Insecure-Requests",
            HeaderValue::from_static("1"),
        );

        let client = Client::builder()
            .default_headers(headers)
            .cookie_provider(cookie_jar.clone())
            .timeout(Duration::from_secs(30))
            .redirect(reqwest::redirect::Policy::limited(10))
            .build()?;

        Ok(ScraperHttpClient {
            client,
            cookie_jar,
        })
    }

    /// Fetch a URL and inspect for bot challenges or Cloudflare protection
    pub async fn fetch(&self, url: &str) -> Result<ScrapedResponse, reqwest::Error> {
        let resp = self.client.get(url).send().await?;
        let status = resp.status().as_u16();
        let final_url = resp.url().to_string();
        let body = resp.text().await.unwrap_or_default();

        let challenge = Self::detect_challenge(status, &body);

        Ok(ScrapedResponse {
            url: final_url,
            status,
            body,
            challenge,
        })
    }

    /// Synchronize cookies (e.g., cf_clearance, clearance tokens) from a WebView challenge resolution
    pub fn sync_cookie(&self, url_str: &str, cookie_name: &str, cookie_val: &str) {
        if let Ok(parsed_url) = url_str.parse::<reqwest::Url>() {
            let cookie_header = format!("{}={}", cookie_name, cookie_val);
            self.cookie_jar.add_cookie_str(&cookie_header, &parsed_url);
        }
    }

    /// Synchronize multiple cookies received from WebView bridge
    pub fn sync_cookies(&self, url_str: &str, cookies: &[CookieEntry]) {
        if let Ok(parsed_url) = url_str.parse::<reqwest::Url>() {
            for c in cookies {
                let cookie_str = format!("{}={}", c.name, c.value);
                self.cookie_jar.add_cookie_str(&cookie_str, &parsed_url);
            }
        }
    }

    /// Analyze page contents and response status to detect Cloudflare, Turnstile, or DDoS blocks
    pub fn detect_challenge(status: u16, body: &str) -> ChallengeType {
        let body_lower = body.to_lowercase();

        if status == 429 {
            return ChallengeType::RateLimited;
        }

        let is_challenge_screen = body_lower.contains("just a moment...")
            || body_lower.contains("checking your browser before accessing")
            || body_lower.contains("cf-browser-verification")
            || body_lower.contains("challenge-running");

        if (status == 403 || status == 503 || is_challenge_screen)
            && (body_lower.contains("cf-turnstile") || body_lower.contains("challenges.cloudflare.com"))
        {
            return ChallengeType::CloudflareTurnstile;
        }

        if is_challenge_screen || body_lower.contains("enable javascript and cookies to continue") {
            return ChallengeType::CloudflareRay;
        }

        if (status == 403 || status == 503) && (body_lower.contains("cloudflare") || body_lower.contains("ddos-guard")) {
            return ChallengeType::AccessDenied;
        }

        ChallengeType::None
    }
}

