// Version 4/tests/test-theme-studio.js
/**
 * Test Suite: Theme Studio Live Customization & Share System
 */

const assert = require('assert');
const { ThemeStudio, PRESET_THEMES } = require('../src/ui/theme-studio');

async function testThemeStudio() {
  console.log('🧪 Testing Live Theme Studio & Color Customizer...');

  const studio = new ThemeStudio();

  // 1. Verify platform choices
  const platforms = studio.getSelectablePlatforms();
  assert.strictEqual(platforms.length, 4, 'Should offer Windows, Apple, Android, and Linux');
  assert(platforms.some((p) => p.id === 'apple'), 'Must include Apple iOS / macOS');
  assert(platforms.some((p) => p.id === 'android'), 'Must include Android Material 3');
  assert(platforms.some((p) => p.id === 'windows'), 'Must include Windows 11');
  assert(platforms.some((p) => p.id === 'linux'), 'Must include Linux Adwaita');

  // 2. Test Live Color Customization
  studio.setBasePlatform('android');
  assert.strictEqual(studio.currentBasePlatform, 'android');

  studio.setLiveColor('--accent-primary', '#ff0055');
  assert.strictEqual(studio.currentColors['--accent-primary'], '#ff0055');

  // 3. Test Saving Custom Theme
  const customTheme = studio.saveCurrentAsCustomTheme('Neon Hot Pink');
  assert.strictEqual(customTheme.name, 'Neon Hot Pink');
  assert.strictEqual(customTheme.basePlatform, 'android');
  assert.strictEqual(customTheme.colors['--accent-primary'], '#ff0055');
  assert.strictEqual(studio.customThemes.length, 1);

  // 4. Test Exporting Theme as Shareable JSON
  const exported = studio.exportThemePayload(customTheme.id);
  assert.strictEqual(exported.schema, 'ffm-theme-v4');
  assert.strictEqual(exported.theme.name, 'Neon Hot Pink');
  assert.strictEqual(exported.theme.basePlatform, 'android');
  assert.strictEqual(exported.theme.colors['--accent-primary'], '#ff0055');

  // 5. Test Importing Theme Payload
  const freshStudio = new ThemeStudio();
  const importResult = freshStudio.importThemePayload(JSON.stringify(exported));
  assert.strictEqual(importResult.success, true);
  assert.strictEqual(importResult.theme.name, 'Neon Hot Pink');
  assert.strictEqual(freshStudio.currentBasePlatform, 'android');
  assert.strictEqual(freshStudio.currentColors['--accent-primary'], '#ff0055');

  // 6. Test Applying Built-in Presets
  const appliedSepia = freshStudio.applyPreset('warm-sepia');
  assert.strictEqual(appliedSepia, true);
  assert.strictEqual(freshStudio.currentBasePlatform, 'apple');
  assert.strictEqual(freshStudio.currentColors['--accent-primary'], '#a16207');

  console.log('✅ ALL THEME STUDIO TESTS PASSED!');
}

testThemeStudio().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

