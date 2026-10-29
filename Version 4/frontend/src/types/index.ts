// Version 4/frontend/src/types/index.ts
export interface Novel {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  cover_local_path: string;
  summary: string;
  source_url: string;
  rule_guid?: string;
  total_chapters: number;
  downloaded_chapters: number;
  check_updates: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_index: number;
  title: string;
  content_html?: string;
  source_url: string;
  word_count: number;
  is_downloaded: boolean | number;
  downloaded_at?: string;
}

export interface ReadingProgress {
  novel_id: string;
  last_chapter_index: number;
  scroll_percentage: number;
  updated_at?: string;
}

export interface Rule {
  guid: string;
  rule_name: string;
  url_regex: string;
  parser_type: 'headless' | 'webview';
  pagetype_code?: string;
  toc_code?: string;
  chapter_code?: string;
  url_blocks?: string;
  version: number;
  updated_at?: string;
}

export type PlatformStyle = 'windows' | 'apple' | 'android' | 'linux';
export type ThemeMode = 'dark' | 'light' | 'oled';
export type ReaderTheme = 'dark' | 'oled' | 'sepia' | 'light';

export interface CustomThemePalette {
  id: string;
  name: string;
  accent: string;
  canvas: string;
  surface: string;
  text: string;
  border: string;
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

