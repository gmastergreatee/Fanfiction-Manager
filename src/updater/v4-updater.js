// Version 4/src/updater/v4-updater.js
/**
 * Multi-Platform Auto-Updater for Version 4
 * Supports Desktop (Win, Mac, Linux), Android, and iOS update checking.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_REPO = 'gmastergreatee/Fanfiction-Manager';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const RULES_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/master/config/rules.json`;

class V4Updater {
  constructor(options = {}) {
    this.currentVersion = options.currentVersion || '4.0.0';
    this.platform = options.platform || process.platform || 'win32';
    this.db = options.db || null;
  }

  /**
   * Parse version string (e.g., 'beta_3.2.0', 'v4.0.0', '4.1.2') into comparable array
   */
  parseVersion(versionStr) {
    const cleaned = versionStr.replace(/^[vV]|beta_/g, '').trim();
    const parts = cleaned.split('.').map((p) => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);
    return parts;
  }

  /**
   * Check if remote version is newer than current
   */
  isNewerVersion(remoteTag) {
    const remote = this.parseVersion(remoteTag);
    const current = this.parseVersion(this.currentVersion);
    for (let i = 0; i < 3; i++) {
      if (remote[i] > current[i]) return true;
      if (remote[i] < current[i]) return false;
    }
    return false;
  }

  /**
   * Check GitHub Releases for new updates
   */
  async checkForUpdates() {
    try {
      const response = await fetch(RELEASES_API, {
        headers: {
          'User-Agent': `Fanfiction-Manager-v4/${this.currentVersion}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned HTTP ${response.status}`);
      }

      const release = await response.json();
      if (!release || !release.tag_name) {
        return { updateAvailable: false, message: 'No release data found.' };
      }

      const updateAvailable = this.isNewerVersion(release.tag_name);
      if (!updateAvailable) {
        return {
          updateAvailable: false,
          currentVersion: this.currentVersion,
          latestVersion: release.tag_name,
          message: 'Application is up to date.',
        };
      }

      // Match asset appropriate for this platform
      const assets = release.assets || [];
      let targetAsset = null;

      if (this.platform === 'android') {
        targetAsset = assets.find((a) => a.name.endsWith('.apk'));
      } else if (this.platform === 'darwin') {
        targetAsset = assets.find((a) => a.name.endsWith('.dmg') || a.name === 'app.zip');
      } else if (this.platform === 'linux') {
        targetAsset = assets.find((a) => a.name.endsWith('.AppImage') || a.name === 'app.zip');
      } else {
        // Windows & Default fallback
        targetAsset =
          assets.find((a) => a.name.endsWith('.exe')) ||
          assets.find((a) => a.name === 'app.zip');
      }

      return {
        updateAvailable: true,
        currentVersion: this.currentVersion,
        latestVersion: release.tag_name,
        releaseNotes: release.body || '',
        publishedAt: release.published_at,
        asset: targetAsset
          ? {
              name: targetAsset.name,
              downloadUrl: targetAsset.browser_download_url,
              size: targetAsset.size,
            }
          : null,
      };
    } catch (err) {
      console.error(`[V4Updater] Check failed: ${err.message}`);
      return { updateAvailable: false, error: err.message };
    }
  }

  /**
   * Synchronize site rules with remote GitHub repository in the background
   */
  async syncRulesWithRemote() {
    if (!this.db) {
      throw new Error('Database client required for rule sync.');
    }
    try {
      const res = await fetch(RULES_RAW_URL, {
        headers: { 'User-Agent': 'Fanfiction-Manager-v4' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} while fetching remote rules`);

      const remoteRules = await res.json();
      if (!Array.isArray(remoteRules)) throw new Error('Invalid remote rules format');

      let updatedCount = 0;
      let insertedCount = 0;

      for (const r of remoteRules) {
        const existing = this.db.getRuleByGuid(r.guid);
        this.db.saveRule({
          guid: r.guid,
          rule_name: r.rule_name,
          url_regex: r.url_regex,
          pagetype_code: r.pagetype_code || '',
          toc_code: r.toc_code || '',
          chapter_code: r.chapter_code || '',
          url_blocks: r.url_blocks || '',
          version: (existing ? existing.version : 0) + 1,
        });
        if (existing) updatedCount++;
        else insertedCount++;
      }

      return {
        success: true,
        totalRemoteRules: remoteRules.length,
        updatedCount,
        insertedCount,
      };
    } catch (err) {
      console.error(`[V4Updater] Rule sync failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

module.exports = V4Updater;

