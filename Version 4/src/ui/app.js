// Version 4/src/ui/app.js
/**
 * Modern Reactive UI Controller for Fanfiction Manager Version 4
 */

let allNovels = [];
let allRules = [];
let activeFilter = 'all';
let currentSearch = '';
let activeNovel = null;
let currentChapterIndex = 1;
let readerFontSize = 19;
let readerThemeIndex = 0;
const READER_THEMES = ['dark', 'oled', 'sepia', 'light'];

// Detect Platform and Apply Native UI Theme
(function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  let platform = 'windows';

  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('macintosh') || ua.includes('mac os')) {
    platform = 'apple';
  } else if (ua.includes('android')) {
    platform = 'android';
  } else if (ua.includes('linux')) {
    platform = 'linux';
  } else if (typeof process !== 'undefined' && process.platform) {
    if (process.platform === 'darwin') platform = 'apple';
    else if (process.platform === 'android') platform = 'android';
    else if (process.platform === 'linux') platform = 'linux';
    else platform = 'windows';
  }

  document.documentElement.setAttribute('data-platform', platform);
  const selectEl = document.getElementById('platform-style-select');
  if (selectEl) selectEl.value = platform;
})();

function setPlatformStyle(styleName) {
  document.documentElement.setAttribute('data-platform', styleName);
}

function toggleThemeMode() {
  const current = document.documentElement.getAttribute('data-theme-mode') || 'dark';
  const next = current === 'dark' ? 'light' : current === 'light' ? 'oled' : 'dark';
  document.documentElement.setAttribute('data-theme-mode', next);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerText = next === 'light' ? '☀️ Light' : next === 'oled' ? '⚫ OLED' : '🌙 Dark';
}

// Data Loading (Connects to SQLite)
async function loadLibraryData() {
  try {
    let novels = [];
    let rules = [];

    // If running in Node.js / Electron context with direct SQLite access
    if (typeof require !== 'undefined') {
      const DatabaseClient = require('../core/db');
      const path = require('path');
      const dbPath = path.join(__dirname, '..', '..', 'v4_data', 'fanfiction.db');
      const db = new DatabaseClient(dbPath);
      novels = db.getAllNovels();
      rules = db.getAllRules();
    } else {
      // Mock / Sample Data fallback for browser previews
      novels = [
        {
          id: 'sample-1',
          title: 'DC: All for One',
          downloaded_chapters: 90,
          total_chapters: 90,
          cover_local_path: 'covers/0e229d89-3901-4770-ade3-d0f16b6376f2.png',
          summary: 'Ethan Kane never felt human until one violent moment changed everything...',
        },
        {
          id: 'sample-2',
          title: 'One Piece: With Sign-in System',
          downloaded_chapters: 256,
          total_chapters: 256,
          cover_local_path: '',
          summary: 'Traversing the world of One Piece with an almighty sign-in check-in system.',
        },
      ];
      rules = [
        { guid: '1', rule_name: 'WebNovel.com', url_regex: 'webnovel\\.com\\/.*' },
        { guid: '2', rule_name: 'Royalroad.com', url_regex: 'royalroad\\.com\\/fiction\\/.*' },
      ];
    }

    allNovels = novels;
    allRules = rules;

    document.getElementById('count-all').innerText = novels.length;
    document.getElementById('count-rules').innerText = rules.length;

    renderNovels();
    renderRules();
  } catch (err) {
    console.error('Failed to load library data:', err);
  }
}

function renderNovels() {
  const container = document.getElementById('novel-grid');
  if (!container) return;

  const filtered = allNovels.filter((n) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'downloaded' && n.downloaded_chapters >= n.total_chapters) ||
      (activeFilter === 'updates' && n.downloaded_chapters < n.total_chapters);

    const matchesSearch =
      !currentSearch ||
      n.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
      (n.summary && n.summary.toLowerCase().includes(currentSearch.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-tertiary);">
        <div style="font-size: 32px; margin-bottom: 8px;">📚</div>
        <div style="font-size: 15px; font-weight: 500;">No novels found matching criteria.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((novel) => {
      const coverSrc = novel.cover_local_path
        ? `../v4_data/${novel.cover_local_path}`
        : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="110" viewBox="0 0 80 110"><rect width="80" height="110" fill="%23222630"/><text x="40" y="55" fill="%236b7280" font-size="12" text-anchor="middle">No Cover</text></svg>';

      const isComplete = novel.downloaded_chapters >= novel.total_chapters && novel.total_chapters > 0;
      const progressLabel = `${novel.downloaded_chapters} / ${novel.total_chapters} Chs`;
      const cleanSummary = (novel.summary || '').replace(/<[^>]+>/g, ' ');

      return `
        <div class="novel-card" onclick="openReader('${novel.id}')">
          <div class="novel-cover">
            <img src="${coverSrc}" alt="Cover" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'110\\'><rect width=\\'80\\' height=\\'110\\' fill=\\'%23222\\'/></svg>'">
          </div>
          <div class="novel-info">
            <div class="novel-title" title="${novel.title}">${novel.title}</div>
            <div class="novel-meta">
              <span style="color: ${isComplete ? 'var(--accent-green)' : 'var(--accent-primary)'};">● ${progressLabel}</span>
            </div>
            <div class="novel-summary">${cleanSummary}</div>
            <div class="novel-actions" onclick="event.stopPropagation()">
              <button class="btn-sm" onclick="openReader('${novel.id}')">Read</button>
              <button class="btn-sm" onclick="downloadNovel('${novel.id}')">Update</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderRules() {
  const container = document.getElementById('rules-cards-container');
  if (!container) return;

  container.innerHTML = allRules
    .map(
      (r) => `
    <div class="card" style="padding: 12px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${r.rule_name}</div>
        <div style="font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono);">${r.url_regex}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-sm" onclick="editRule('${r.guid}')">Edit</button>
        <button class="btn-sm" onclick="exportRuleQR('${r.guid}')">Share QR</button>
      </div>
    </div>
  `
    )
    .join('');
}

function switchTab(tabName) {
  document.getElementById('library-view').style.display = tabName === 'library' ? 'block' : 'none';
  document.getElementById('rules-view').style.display = tabName === 'rules' ? 'block' : 'none';

  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${tabName}`);
  if (activeNav) activeNav.classList.add('active');
}

function setFilter(filter, el) {
  activeFilter = filter;
  document.querySelectorAll('.filter-bar .chip').forEach((c) => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderNovels();
}

function onSearchChange(val) {
  currentSearch = val;
  renderNovels();
}

// Reader Mode Controller
function openReader(novelId) {
  activeNovel = allNovels.find((n) => n.id === novelId);
  if (!activeNovel) return;

  const readerView = document.getElementById('reader-view');
  readerView.style.display = 'flex';

  document.getElementById('reader-chapter-title').innerText = `${activeNovel.title} — Ch. ${currentChapterIndex}`;
  document.getElementById('reader-progress-label').innerText = `Chapter ${currentChapterIndex} of ${activeNovel.total_chapters || 1}`;

  // Load chapter content from SQLite if available
  let chapterHtml = '<p>Loading chapter content...</p>';
  if (typeof require !== 'undefined') {
    const DatabaseClient = require('../core/db');
    const path = require('path');
    const db = new DatabaseClient(path.join(__dirname, '..', '..', 'v4_data', 'fanfiction.db'));
    const ch = db.getChapterContent(activeNovel.id, currentChapterIndex);
    if (ch && ch.content_html) {
      chapterHtml = ch.content_html;
    } else {
      chapterHtml = `<p>Chapter ${currentChapterIndex} has not been downloaded yet. Tap 'Update' in library to download.</p>`;
    }
  } else {
    chapterHtml = `
      <p>Ethan Kane sat at the back of a physics classroom in Gotham City Academy, his pencil scraping across a notepad whose pages had curled at the edges from the damp winter air leaking through old school windows.</p>
      <p>He wasn't taking notes on inertia or velocity. He was observing. He studied people the way others studied mathematics—calculating motives, probabilities, points of failure.</p>
      <p>The bell rang with a piercing rattle that shook the classroom. It was time.</p>
    `;
  }

  document.getElementById('reader-content-body').innerHTML = chapterHtml;
}

function exitReader() {
  document.getElementById('reader-view').style.display = 'none';
}

function toggleReaderHUD() {
  const top = document.getElementById('reader-hud-top');
  const bottom = document.getElementById('reader-hud-bottom');
  top.classList.toggle('hidden');
  bottom.classList.toggle('hidden');
}

function adjustFontSize(delta) {
  readerFontSize = Math.min(32, Math.max(14, readerFontSize + delta));
  document.getElementById('reader-content-body').style.fontSize = `${readerFontSize}px`;
}

function cycleReaderTheme() {
  readerThemeIndex = (readerThemeIndex + 1) % READER_THEMES.length;
  const theme = READER_THEMES[readerThemeIndex];
  document.documentElement.setAttribute('data-theme-mode', theme);
}

function navigateChapter(dir) {
  if (!activeNovel) return;
  const nextIdx = currentChapterIndex + dir;
  if (nextIdx >= 1 && nextIdx <= (activeNovel.total_chapters || 100)) {
    currentChapterIndex = nextIdx;
    openReader(activeNovel.id);
  }
}

// Rule Studio Helpers
function selectRuleMode(mode) {
  alert(`Mode "${mode}" activated! On mobile, the Visual Picker and AI Assistant work natively without DevTools.`);
}

function openDevToolsIfSupported() {
  if (typeof require !== 'undefined') {
    const { remote } = require('electron');
    // Toggle devtools on desktop
    try {
      const win = require('@electron/remote') ? require('@electron/remote').getCurrentWindow() : null;
      if (win) win.webContents.toggleDevTools();
      else alert('DevTools can be toggled via Ctrl+Shift+I on Windows/Linux or Cmd+Option+I on macOS.');
    } catch {
      alert('Press Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (macOS) to inspect native DevTools.');
    }
  } else {
    alert('Native F12 DevTools are available on Windows, Linux, and macOS.');
  }
}

function openAddNovelModal() {
  const url = prompt('Enter novel URL to add:');
  if (url) alert('Analyzing URL with AI Rule Assistant...');
}

// ==========================================================================
// Theme Studio UI Controller
// ==========================================================================
let studioInstance = null;

function getStudio() {
  if (!studioInstance && typeof ThemeStudio !== 'undefined') {
    studioInstance = new ThemeStudio();
  }
  return studioInstance;
}

function openThemeStudioModal() {
  const studio = getStudio();
  if (!studio) return;

  const modal = document.getElementById('theme-studio-modal');
  modal.style.display = 'flex';

  // Base platform select
  const platformSelect = document.getElementById('theme-modal-platform-select');
  if (platformSelect) platformSelect.value = studio.currentBasePlatform;

  // Render Preset chips
  const presetsContainer = document.getElementById('preset-chips-container');
  if (presetsContainer) {
    const allPresets = [...PRESET_THEMES, ...studio.customThemes];
    presetsContainer.innerHTML = allPresets
      .map(
        (p) =>
          `<button class="chip" onclick="applyPresetFromStudio('${p.id}')" style="font-size: 12px; padding: 4px 12px;">${p.name}</button>`
      )
      .join('');
  }

  // Render Live Color Pickers
  renderColorSwatches();
}

function closeThemeStudioModal() {
  document.getElementById('theme-studio-modal').style.display = 'none';
}

function renderColorSwatches() {
  const studio = getStudio();
  if (!studio) return;

  const swatchesContainer = document.getElementById('live-color-swatches-container');
  if (!swatchesContainer) return;

  swatchesContainer.innerHTML = COLOR_KEYS.map((item) => {
    const currentColor =
      studio.currentColors[item.key] ||
      getComputedStyle(document.documentElement).getPropertyValue(item.key).trim() ||
      item.default;

    return `
      <div class="color-swatch-row">
        <span style="font-size: 13px; color: var(--text-secondary);">${item.label}</span>
        <div class="color-input-wrapper">
          <input type="color" class="color-input" value="${currentColor}" onchange="onStudioColorChange('${item.key}', this.value)">
          <span style="font-size: 12px; font-family: var(--font-mono); color: var(--text-tertiary);" id="label-${item.key.replace('--', '')}">${currentColor}</span>
        </div>
      </div>
    `;
  }).join('');
}

function onStudioBasePlatformChange(platformId) {
  const studio = getStudio();
  if (studio) {
    studio.setBasePlatform(platformId);
    setPlatformStyle(platformId);
  }
}

function onStudioColorChange(cssVarKey, hexColor) {
  const studio = getStudio();
  if (studio) {
    studio.setLiveColor(cssVarKey, hexColor);
    const label = document.getElementById(`label-${cssVarKey.replace('--', '')}`);
    if (label) label.innerText = hexColor;
  }
}

function applyPresetFromStudio(presetId) {
  const studio = getStudio();
  if (studio) {
    studio.applyPreset(presetId);
    renderColorSwatches();
    const platformSelect = document.getElementById('theme-modal-platform-select');
    if (platformSelect) platformSelect.value = studio.currentBasePlatform;
  }
}

function promptSaveCustomTheme() {
  const studio = getStudio();
  if (!studio) return;
  const name = prompt('Enter a name for your custom theme:', 'My Custom Theme');
  if (name) {
    studio.saveCurrentAsCustomTheme(name);
    alert(`Theme "${name}" saved! You can now apply or share it.`);
    openThemeStudioModal(); // Re-render chips
  }
}

function exportActiveTheme() {
  const studio = getStudio();
  if (!studio) return;
  const payload = studio.exportThemePayload();
  const jsonStr = JSON.stringify(payload, null, 2);

  // Copy to clipboard or prompt
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('Theme JSON copied to clipboard! You can share this text or QR code with others.');
    });
  } else {
    prompt('Copy this Theme JSON to share:', jsonStr);
  }
}

function promptImportTheme() {
  const studio = getStudio();
  if (!studio) return;
  const jsonStr = prompt('Paste the shared Theme JSON here:');
  if (jsonStr) {
    const res = studio.importThemePayload(jsonStr);
    if (res.success) {
      alert(`Successfully imported theme "${res.theme.name}"!`);
      renderColorSwatches();
      openThemeStudioModal();
    } else {
      alert(`Import failed: ${res.error}`);
    }
  }
}

function resetStudioColors() {
  const studio = getStudio();
  if (studio) {
    studio.resetToDefault();
    renderColorSwatches();
  }
}

// Rollback Dialog Controls
function openRollbackDialog() {
  const modal = document.getElementById('rollback-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  renderRollbackSnapshots();
}

function closeRollbackDialog() {
  const modal = document.getElementById('rollback-modal');
  if (modal) modal.style.display = 'none';
}

function renderRollbackSnapshots() {
  const container = document.getElementById('rollback-snapshots-list');
  if (!container) return;

  let snapshots = [];
  if (typeof require !== 'undefined') {
    try {
      const RollbackManager = require('../updater/rollback-manager');
      const manager = new RollbackManager();
      snapshots = manager.listSnapshots();
    } catch (e) {
      console.warn('Failed to load snapshots via RollbackManager:', e);
    }
  } else {
    // Browser mock snapshots for preview
    snapshots = [
      { id: 'v4.0.2_1740000000000', version: '4.0.2', created_at: new Date(Date.now() - 3600000).toISOString(), dbBackedUp: true },
      { id: 'v4.0.1_1739900000000', version: '4.0.1', created_at: new Date(Date.now() - 86400000).toISOString(), dbBackedUp: true },
      { id: 'v4.0.0_1739800000000', version: '4.0.0', created_at: new Date(Date.now() - 172800000).toISOString(), dbBackedUp: true }
    ];
  }

  if (snapshots.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
        No prior version snapshots available yet.<br/>Snapshots are automatically recorded before each app update.
      </div>
    `;
    return;
  }

  container.innerHTML = snapshots.map((s, idx) => {
    const dateStr = new Date(s.created_at).toLocaleString();
    return `
      <div class="card" style="padding: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div>
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">
            Version ${s.version} ${idx === 0 ? '<span style="font-size: 10.5px; background: var(--accent-primary); color: #fff; padding: 2px 6px; border-radius: 10px; margin-left: 6px;">Latest Prior</span>' : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-tertiary);">Snapshot: ${s.id}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Saved: ${dateStr}</div>
        </div>
        <button class="btn-sm" onclick="confirmRollback('${s.id}', '${s.version}')" style="background: var(--bg-surface-elevated); color: var(--accent-red); border-color: var(--accent-red); font-weight: 600;">
          Rollback
        </button>
      </div>
    `;
  }).join('');
}

async function confirmRollback(snapshotId, version) {
  const confirmed = confirm(`Are you sure you want to rollback to Version ${version}?\n\nThis will restore the app files and database to this exact snapshot and restart the app.`);
  if (!confirmed) return;

  try {
    if (typeof require !== 'undefined') {
      const RollbackManager = require('../updater/rollback-manager');
      const manager = new RollbackManager();
      await manager.rollbackTo(snapshotId);
      alert(`Successfully rolled back to Version ${version}! The application will now reload.`);
      window.location.reload();
    } else {
      alert(`[Demo Mode] Simulated rollback to Version ${version} successful!`);
      closeRollbackDialog();
    }
  } catch (err) {
    alert(`Rollback error: ${err.message}`);
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const studio = getStudio();
  if (studio) studio.restoreActiveConfiguration();
  loadLibraryData();
});

