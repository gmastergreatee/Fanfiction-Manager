// Version 4/src/ui/theme-studio.js
/**
 * Live Theme Studio & Color Customizer
 *
 * Capabilities:
 * 1. Mobile users can choose between iOS Cupertino & Android Material 3 (or any other theme).
 * 2. Desktop users can choose among Windows 11, Apple macOS, Linux GNOME, Android, or iOS.
 * 3. Live real-time color customizer (Accent, Canvas, Surface, Text, Borders).
 * 4. Save custom color schemes to SQLite / localStorage.
 * 5. Share/Export custom themes via shareable JSON payloads & QR codes (like the rule system).
 */

const COLOR_KEYS = [
  { key: '--accent-primary', label: 'Accent / Brand Color', default: '#3b82f6' },
  { key: '--bg-canvas', label: 'Background Canvas', default: '#0f1115' },
  { key: '--bg-surface', label: 'Card & Surface Color', default: '#181b21' },
  { key: '--bg-surface-elevated', label: 'Elevated Elements', default: '#222630' },
  { key: '--text-primary', label: 'Primary Text', default: '#f3f4f6' },
  { key: '--text-secondary', label: 'Secondary Text', default: '#9ca3af' },
  { key: '--border-subtle', label: 'Border Highlights', default: '#2a2f3b' },
];

const PRESET_THEMES = [
  {
    id: 'windows-fluent',
    name: 'Windows 11 Fluent',
    basePlatform: 'windows',
    colors: {
      '--accent-primary': '#0078d4',
      '--bg-canvas': '#202020',
      '--bg-surface': '#2b2b2b',
      '--bg-surface-elevated': '#323232',
      '--text-primary': '#ffffff',
      '--text-secondary': '#cccccc',
      '--border-subtle': '#3a3a3a',
    },
  },
  {
    id: 'apple-cupertino',
    name: 'Apple iOS / macOS Cupertino',
    basePlatform: 'apple',
    colors: {
      '--accent-primary': '#0a84ff',
      '--bg-canvas': '#000000',
      '--bg-surface': '#1c1c1e',
      '--bg-surface-elevated': '#2c2c2e',
      '--text-primary': '#ffffff',
      '--text-secondary': '#8e8e93',
      '--border-subtle': '#38383a',
    },
  },
  {
    id: 'android-material3',
    name: 'Android Material 3',
    basePlatform: 'android',
    colors: {
      '--accent-primary': '#d0bcff',
      '--bg-canvas': '#141218',
      '--bg-surface': '#211f26',
      '--bg-surface-elevated': '#2b2930',
      '--text-primary': '#e6e0e9',
      '--text-secondary': '#cac4d0',
      '--border-subtle': '#49454f',
    },
  },
  {
    id: 'linux-adwaita',
    name: 'Linux GNOME Libadwaita',
    basePlatform: 'linux',
    colors: {
      '--accent-primary': '#3584e4',
      '--bg-canvas': '#1e1e1e',
      '--bg-surface': '#242424',
      '--bg-surface-elevated': '#2e2e2e',
      '--text-primary': '#ffffff',
      '--text-secondary': '#9a9996',
      '--border-subtle': '#3d3d3d',
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    basePlatform: 'windows',
    colors: {
      '--accent-primary': '#00f0ff',
      '--bg-canvas': '#05050d',
      '--bg-surface': '#0e0e1e',
      '--bg-surface-elevated': '#181830',
      '--text-primary': '#ff007f',
      '--text-secondary': '#00f0ff',
      '--border-subtle': '#2a2a60',
    },
  },
  {
    id: 'warm-sepia',
    name: 'Bookstore Sepia',
    basePlatform: 'apple',
    colors: {
      '--accent-primary': '#a16207',
      '--bg-canvas': '#fbf0d9',
      '--bg-surface': '#f4e5c8',
      '--bg-surface-elevated': '#eedcba',
      '--text-primary': '#433422',
      '--text-secondary': '#785f43',
      '--border-subtle': '#dfcaa7',
    },
  },
  {
    id: 'oled-pure-black',
    name: 'OLED True Black',
    basePlatform: 'apple',
    colors: {
      '--accent-primary': '#60a5fa',
      '--bg-canvas': '#000000',
      '--bg-surface': '#0a0a0a',
      '--bg-surface-elevated': '#141414',
      '--text-primary': '#f9fafb',
      '--text-secondary': '#9ca3af',
      '--border-subtle': '#222222',
    },
  },
];

class ThemeStudio {
  constructor(options = {}) {
    this.storageKey = 'ffm_custom_themes';
    this.activeThemeKey = 'ffm_active_theme_config';
    this.customThemes = this.loadSavedThemes();
    this.currentBasePlatform = 'windows';
    this.currentColors = {};
  }

  isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('android') || ua.includes('iphone') || ua.includes('ipad') || (typeof window !== 'undefined' && window.innerWidth <= 768);
  }

  /**
   * Returns list of selectable base platform themes.
   * On mobile: prioritized for iOS & Android (with option to choose any).
   * On desktop: all 5 platforms available.
   */
  getSelectablePlatforms() {
    return [
      { id: 'windows', label: 'Windows 11 Fluent' },
      { id: 'apple', label: 'Apple iOS / macOS (Cupertino)' },
      { id: 'android', label: 'Android (Material Design 3)' },
      { id: 'linux', label: 'Linux (GNOME Libadwaita)' },
    ];
  }

  /**
   * Set Base Platform (Windows, Apple, Android, Linux)
   */
  setBasePlatform(platformId) {
    this.currentBasePlatform = platformId;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-platform', platformId);
    }
    this.saveActiveConfiguration();
  }

  /**
   * Apply a specific color change live in real-time
   */
  setLiveColor(cssVarKey, hexColor) {
    this.currentColors[cssVarKey] = hexColor;
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(cssVarKey, hexColor);
    }
    this.saveActiveConfiguration();
  }

  /**
   * Apply an entire preset
   */
  applyPreset(presetId) {
    const preset = PRESET_THEMES.find((p) => p.id === presetId) || this.customThemes.find((p) => p.id === presetId);
    if (!preset) return false;

    this.setBasePlatform(preset.basePlatform);
    for (const [key, val] of Object.entries(preset.colors)) {
      this.setLiveColor(key, val);
    }
    return true;
  }

  /**
   * Save the current active color combination as a named custom theme
   */
  saveCurrentAsCustomTheme(themeName) {
    const id = 'custom-' + Date.now();
    const newTheme = {
      id,
      name: themeName || `My Custom Theme ${this.customThemes.length + 1}`,
      basePlatform: this.currentBasePlatform,
      colors: { ...this.currentColors },
      created_at: new Date().toISOString(),
    };
    this.customThemes.push(newTheme);
    this.persistCustomThemes();
    return newTheme;
  }

  /**
   * Export Theme as a shareable JSON payload / QR code string
   */
  exportThemePayload(themeId) {
    const theme =
      this.customThemes.find((t) => t.id === themeId) ||
      PRESET_THEMES.find((t) => t.id === themeId) || {
        name: 'Custom Active Theme',
        basePlatform: this.currentBasePlatform,
        colors: this.currentColors,
      };

    return {
      schema: 'ffm-theme-v4',
      version: 1,
      theme: {
        name: theme.name,
        basePlatform: theme.basePlatform,
        colors: theme.colors,
      },
      exported_at: new Date().toISOString(),
    };
  }

  /**
   * Import Theme from JSON string or QR code payload
   */
  importThemePayload(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!data || data.schema !== 'ffm-theme-v4' || !data.theme || !data.theme.colors) {
        throw new Error('Invalid theme payload schema. Expected "ffm-theme-v4".');
      }

      const imported = {
        id: 'imported-' + Date.now(),
        name: data.theme.name || 'Imported Theme',
        basePlatform: data.theme.basePlatform || 'apple',
        colors: data.theme.colors,
        created_at: new Date().toISOString(),
      };

      this.customThemes.push(imported);
      this.persistCustomThemes();

      // Apply immediately live
      this.setBasePlatform(imported.basePlatform);
      for (const [k, v] of Object.entries(imported.colors)) {
        this.setLiveColor(k, v);
      }

      return { success: true, theme: imported };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete a custom theme
   */
  deleteCustomTheme(themeId) {
    this.customThemes = this.customThemes.filter((t) => t.id !== themeId);
    this.persistCustomThemes();
  }

  /**
   * Reset all colors back to platform default
   */
  resetToDefault() {
    this.currentColors = {};
    if (typeof document !== 'undefined') {
      for (const item of COLOR_KEYS) {
        document.documentElement.style.removeProperty(item.key);
      }
    }
    this.saveActiveConfiguration();
  }

  // Storage Helpers
  loadSavedThemes() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  persistCustomThemes() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.customThemes));
      } catch {}
    }
  }

  saveActiveConfiguration() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          this.activeThemeKey,
          JSON.stringify({
            basePlatform: this.currentBasePlatform,
            colors: this.currentColors,
          })
        );
      } catch {}
    }
  }

  restoreActiveConfiguration() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.activeThemeKey);
      if (!raw) return;
      const config = JSON.parse(raw);
      if (config.basePlatform) this.setBasePlatform(config.basePlatform);
      if (config.colors) {
        for (const [k, v] of Object.entries(config.colors)) {
          this.setLiveColor(k, v);
        }
      }
    } catch {}
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeStudio, PRESET_THEMES, COLOR_KEYS };
}

