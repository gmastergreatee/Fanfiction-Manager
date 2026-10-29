// Version 4/tests/test-mobile-ota.js
/**
 * Test Suite: Mobile OTA Hot-Updater & Store-Bypass Engine
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const MobileOTAUpdater = require('../src/updater/mobile-ota-updater');

async function testMobileOTA() {
  console.log('🧪 Testing Mobile OTA Hot-Updater & Store-Bypass Engine...');

  const tempDir = path.join(__dirname, 'temp_mobile_ota');
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const updater = new MobileOTAUpdater({
      currentVersion: '4.0.0',
      platform: 'android',
      bundleStorageDir: tempDir,
    });

    // 1. Test semver comparisons
    assert.strictEqual(updater.compareSemver('4.0.1', '4.0.0'), true, '4.0.1 should be newer than 4.0.0');
    assert.strictEqual(updater.compareSemver('4.1.0', '4.0.5'), true, '4.1.0 should be newer than 4.0.5');
    assert.strictEqual(updater.compareSemver('4.0.0', '4.0.0'), false, 'Identical versions should not be newer');
    assert.strictEqual(updater.compareSemver('3.9.0', '4.0.0'), false, 'Older versions should not be newer');

    // 2. Test Android Unattended PackageInstaller Spec
    const installerSpec = updater.getAndroidUnattendedInstallerSpec();
    assert.strictEqual(installerSpec.permissionRequired, 'android.permission.REQUEST_INSTALL_PACKAGES');
    assert(installerSpec.flag.includes('USER_ACTION_NOT_REQUIRED'), 'Must use Android 12+ unattended install flag');

    // 3. Test Silent OTA Bundle Application
    const dummyZipPath = path.join(__dirname, '..', 'dist', 'mobile-bundle.zip');
    if (fs.existsSync(dummyZipPath)) {
      const applyResult = await updater.applySilentOtaUpdate('file://' + dummyZipPath);
      assert.strictEqual(applyResult.success, true);
      assert.strictEqual(applyResult.canHotReload, true);
    }

    console.log('✅ ALL MOBILE OTA TESTS PASSED!');
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

testMobileOTA().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

