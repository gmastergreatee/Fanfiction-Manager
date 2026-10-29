// Version 4/src/migrator/v3-reader.js
/**
 * Legacy Version 3 Data Reader & Validator
 * Reads novels, chapters, rules, and settings from v3 directory structure.
 */

const fs = require('fs');
const path = require('path');

class V3DataReader {
  constructor(v3BasePath) {
    this.basePath = path.resolve(v3BasePath);
    this.configPath = path.join(this.basePath, 'config');
    this.dataPath = path.join(this.basePath, 'data');
    this.novelsJsonPath = path.join(this.configPath, 'novels.json');
    this.rulesJsonPath = path.join(this.configPath, 'rules.json');
    this.appOptionsPath = path.join(this.configPath, 'app_options.json');
    this.readerOptionsPath = path.join(this.configPath, 'r_reader_options.json');
    this.novelDirsPath = path.join(this.dataPath, 'novels');
    this.coversPath = path.join(this.dataPath, 'covers');
  }

  /**
   * Check if legacy v3 data exists at this path
   */
  hasLegacyData() {
    return fs.existsSync(this.novelsJsonPath) || fs.existsSync(this.rulesJsonPath);
  }

  /**
   * Read and parse novels.json
   */
  readNovels() {
    if (!fs.existsSync(this.novelsJsonPath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(this.novelsJsonPath, 'utf8');
      const raw = JSON.parse(content);
      if (!Array.isArray(raw)) return [];
      return raw.map((n, idx) => ({
        id: n.GUID || `legacy-novel-${idx + 1}`,
        title: n.Title || 'Untitled Novel',
        author: n.Author || '',
        cover_url: n.CoverURL || '',
        summary: n.Summary || '',
        source_url: n.URL || '',
        total_chapters: parseInt(n.ChapterCount, 10) || 0,
        downloaded_chapters: parseInt(n.DownloadedCount, 10) || 0,
        check_updates: n.CheckUpdates === false ? 0 : 1,
        chapter_urls: Array.isArray(n.ChapterURLs) ? n.ChapterURLs : [],
      }));
    } catch (err) {
      console.error(`[V3Reader] Failed to read novels.json: ${err.message}`);
      return [];
    }
  }

  /**
   * Read and parse rules.json
   */
  readRules() {
    if (!fs.existsSync(this.rulesJsonPath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(this.rulesJsonPath, 'utf8');
      const raw = JSON.parse(content);
      if (!Array.isArray(raw)) return [];
      return raw.map((r, idx) => ({
        guid: r.guid || `legacy-rule-${idx + 1}`,
        rule_name: r.rule_name || `Rule ${idx + 1}`,
        url_regex: r.url_regex || '',
        parser_type: 'webview',
        pagetype_code: r.pagetype_code || '',
        toc_code: r.toc_code || '',
        chapter_code: r.chapter_code || '',
        url_blocks: r.url_blocks || '',
        version: 1,
      }));
    } catch (err) {
      console.error(`[V3Reader] Failed to read rules.json: ${err.message}`);
      return [];
    }
  }

  /**
   * Read app and reader options
   */
  readSettings() {
    const settings = {};
    if (fs.existsSync(this.appOptionsPath)) {
      try {
        const appOpts = JSON.parse(fs.readFileSync(this.appOptionsPath, 'utf8'));
        settings['app_options'] = JSON.stringify(appOpts);
      } catch (err) {
        console.warn(`[V3Reader] Failed to parse app_options.json: ${err.message}`);
      }
    }
    if (fs.existsSync(this.readerOptionsPath)) {
      try {
        const readerOpts = JSON.parse(fs.readFileSync(this.readerOptionsPath, 'utf8'));
        settings['reader_options'] = JSON.stringify(readerOpts);
      } catch (err) {
        console.warn(`[V3Reader] Failed to parse r_reader_options.json: ${err.message}`);
      }
    }
    return settings;
  }

  /**
   * Read downloaded chapters for a given novel GUID
   * Reads from data/novels/{guid}/*.json
   */
  readNovelChapters(novelGuid, chapterUrls = []) {
    const novelDir = path.join(this.novelDirsPath, novelGuid);
    if (!fs.existsSync(novelDir)) {
      return [];
    }

    const chapters = [];
    try {
      const files = fs.readdirSync(novelDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const indexStr = path.basename(file, '.json');
        const chapterIndex = parseInt(indexStr, 10);
        if (isNaN(chapterIndex)) continue;

        const filePath = path.join(novelDir, file);
        try {
          const contentRaw = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(contentRaw);
          const title = data.title || `Chapter ${chapterIndex}`;
          const contentHtml = data.content || '';
          
          // Rough word count estimation from text
          const plainText = contentHtml.replace(/<[^>]+>/g, ' ');
          const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
          const sourceUrl = chapterUrls[chapterIndex - 1] || '';

          chapters.push({
            id: `${novelGuid}_ch_${chapterIndex}`,
            novel_id: novelGuid,
            chapter_index: chapterIndex,
            title,
            content_html: contentHtml,
            source_url: sourceUrl,
            word_count: wordCount,
            is_downloaded: 1,
            downloaded_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn(`[V3Reader] Skipped corrupted chapter file ${filePath}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`[V3Reader] Error reading novel directory ${novelDir}: ${err.message}`);
    }

    // Sort chapters by chapter_index ascending
    chapters.sort((a, b) => a.chapter_index - b.chapter_index);
    return chapters;
  }

  /**
   * Get cover file path if it exists
   */
  getCoverFilePath(novelGuid) {
    const pngPath = path.join(this.coversPath, `${novelGuid}.png`);
    if (fs.existsSync(pngPath)) return pngPath;
    const jpgPath = path.join(this.coversPath, `${novelGuid}.jpg`);
    if (fs.existsSync(jpgPath)) return jpgPath;
    return null;
  }
}

module.exports = V3DataReader;

