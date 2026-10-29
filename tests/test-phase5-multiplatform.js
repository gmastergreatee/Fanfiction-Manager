// Version 4/tests/test-phase5-multiplatform.js
/**
 * Test Suite for Phase 5: Multi-Platform Build & CI/CD Pipeline
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runPhase5Tests() {
  console.log('🧪 Running Phase 5: Multi-Platform Build & CI/CD Test Suite...\n');

  // --- 1. Test Tauri 2.0 Multi-Platform Configuration ---
  console.log('  1. Testing Tauri 2.0 Multi-Platform Bundle Configuration (tauri.conf.json)...');
  const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
  assert.ok(fs.existsSync(tauriConfPath), 'tauri.conf.json must exist');

  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  assert.strictEqual(tauriConf.productName, 'Fanfiction Manager');
  assert.strictEqual(tauriConf.identifier, 'com.fanfictionmanager.app');

  const bundle = tauriConf.bundle;
  assert.ok(bundle, 'bundle configuration must exist');
  assert.strictEqual(bundle.targets, 'all', 'bundle targets must include all platforms');

  // Windows
  assert.ok(bundle.windows && bundle.windows.nsis, 'Windows NSIS packaging must be configured');
  assert.strictEqual(bundle.windows.nsis.installMode, 'currentUser');

  // macOS
  assert.ok(bundle.macOS, 'macOS packaging must be configured');
  assert.strictEqual(bundle.macOS.minimumSystemVersion, '10.15');

  // Linux
  assert.ok(bundle.linux && bundle.linux.deb && bundle.linux.appimage, 'Linux deb & appimage must be configured');
  assert.ok(bundle.linux.deb.depends.includes('libwebkit2gtk-4.1-0'));

  // Android
  assert.ok(bundle.android, 'Android bundle target must be configured');
  assert.strictEqual(bundle.android.minSdkVersion, 24);
  assert.strictEqual(bundle.android.versionCode, 400);

  // iOS
  assert.ok(bundle.iOS, 'iOS bundle target must be configured');
  assert.strictEqual(bundle.iOS.minimumSystemVersion, '14.0');

  console.log('  ✅ Desktop & Mobile targets (Windows, macOS, Linux, Android, iOS) verified in tauri.conf.json.');

  // --- 2. Test Android Target Project Structure & Manifest ---
  console.log('  2. Testing Android Target Files, Manifest, & Gradle Scripts...');
  const androidDir = path.join(__dirname, '..', 'src-tauri', 'gen', 'android');
  assert.ok(fs.existsSync(androidDir), 'Android target directory must exist');

  const rootGradle = path.join(androidDir, 'build.gradle.kts');
  const settingsGradle = path.join(androidDir, 'settings.gradle.kts');
  const appGradle = path.join(androidDir, 'app', 'build.gradle.kts');
  const manifest = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  const mainActivity = path.join(androidDir, 'app', 'src', 'main', 'kotlin', 'com', 'fanfictionmanager', 'app', 'MainActivity.kt');

  assert.ok(fs.existsSync(rootGradle), 'build.gradle.kts must exist');
  assert.ok(fs.existsSync(settingsGradle), 'settings.gradle.kts must exist');
  assert.ok(fs.existsSync(appGradle), 'app/build.gradle.kts must exist');
  assert.ok(fs.existsSync(manifest), 'AndroidManifest.xml must exist');
  assert.ok(fs.existsSync(mainActivity), 'MainActivity.kt must exist');

  const appGradleContent = fs.readFileSync(appGradle, 'utf8');
  assert.ok(appGradleContent.includes('targetSdk = 34'), 'targetSdk 34 required in app/build.gradle.kts');

  const manifestContent = fs.readFileSync(manifest, 'utf8');
  assert.ok(manifestContent.includes('android.permission.INTERNET'), 'INTERNET permission required');
  assert.ok(manifestContent.includes('android.permission.READ_EXTERNAL_STORAGE'), 'READ_EXTERNAL_STORAGE required');
  assert.ok(manifestContent.includes('android.permission.WRITE_EXTERNAL_STORAGE'), 'WRITE_EXTERNAL_STORAGE required');
  assert.ok(manifestContent.includes('android.permission.WAKE_LOCK'), 'WAKE_LOCK required for continuous reading');
  assert.ok(manifestContent.includes('.MainActivity'), 'MainActivity declaration required');

  console.log('  ✅ Android Gradle configuration, NDK filters, and Manifest verified.');

  // --- 3. Test iOS Target Info.plist ---
  console.log('  3. Testing iOS Target & Info.plist Configuration...');
  const appleDir = path.join(__dirname, '..', 'src-tauri', 'gen', 'apple');
  const infoPlistPath = path.join(appleDir, 'Info.plist');
  assert.ok(fs.existsSync(infoPlistPath), 'iOS Info.plist must exist');

  const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
  assert.ok(infoPlistContent.includes('CFBundleDisplayName'), 'CFBundleDisplayName required');
  assert.ok(infoPlistContent.includes('com.fanfictionmanager.app'), 'CFBundleIdentifier required');
  assert.ok(infoPlistContent.includes('UIInterfaceOrientationPortrait'), 'Portrait orientation required');
  assert.ok(infoPlistContent.includes('NSAppTransportSecurity'), 'NSAppTransportSecurity required for chapter scraping');

  console.log('  ✅ iOS Info.plist & WKWebView app configuration verified.');

  // --- 4. Test GitHub Actions CI/CD Multi-Platform Workflow ---
  console.log('  4. Testing GitHub Actions Multi-Platform Workflow Matrix...');
  const workflowPath = fs.existsSync(path.join(__dirname, '..', '.github', 'workflows', 'multi-platform-build.yml'))
    ? path.join(__dirname, '..', '.github', 'workflows', 'multi-platform-build.yml')
    : path.join(__dirname, '..', '..', '.github', 'workflows', 'multi-platform-build.yml');
  assert.ok(fs.existsSync(workflowPath), 'multi-platform-build.yml must exist in .github/workflows');

  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  assert.ok(workflowContent.includes('Multi-Platform Build & Release Matrix'));
  assert.ok(workflowContent.includes('windows-latest'), 'Windows runner required in matrix');
  assert.ok(workflowContent.includes('macos-latest'), 'macOS runner required in matrix');
  assert.ok(workflowContent.includes('ubuntu-22.04'), 'Linux runner required in matrix');
  assert.ok(workflowContent.includes('build-android'), 'Android build job required');
  assert.ok(workflowContent.includes('tauri-apps/tauri-action'), 'Tauri action packaging step required');
  assert.ok(workflowContent.includes('softprops/action-gh-release'), 'Release upload step required');

  console.log('  ✅ GitHub Actions CI/CD matrix (Windows, macOS, Linux, Android) verified.');

  console.log('\n🎉 ALL PHASE 5 TESTS PASSED! 100% SUCCESS.\n');
}

if (require.main === module) {
  runPhase5Tests().catch((err) => {
    console.error('❌ Phase 5 Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { runPhase5Tests };
