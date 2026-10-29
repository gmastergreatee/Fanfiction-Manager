// Version 4/src/updater/packager.js
/**
 * Release Packager for Version 4
 * Creates the exact 'app.zip' bundle expected by legacy v3's updateApp() function.
 * When published to GitHub Releases for tag 'v4.0.0', existing users will auto-upgrade seamlessly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createReleasePackage() {
  const version4Dir = path.resolve(__dirname, '..', '..');
  const distDir = path.join(version4Dir, 'dist');
  const stageDir = path.join(distDir, 'stage_app');
  const outputZipPath = path.join(distDir, 'app.zip');

  console.log('='.repeat(65));
  console.log('  Fanfiction Manager — Version 4 Release Packager');
  console.log('='.repeat(65));

  // 1. Clean staging directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stageDir, { recursive: true });

  console.log('📦 Staging files for app.zip release...');

  // 2. Files to include in the release bundle
  const filesToCopy = [
    { src: path.join(version4Dir, 'package.json'), dest: path.join(stageDir, 'package.json') },
    { src: path.join(version4Dir, 'main.js'), dest: path.join(stageDir, 'main.js') },
    { src: path.join(version4Dir, 'README.md'), dest: path.join(stageDir, 'README.md') },
  ];

  // Optional icon copy from root if present
  const rootDir = path.join(version4Dir, '..');
  const iconPath = path.join(rootDir, 'Icon.png');
  if (fs.existsSync(iconPath)) {
    filesToCopy.push({ src: iconPath, dest: path.join(stageDir, 'Icon.png') });
  }

  for (const item of filesToCopy) {
    if (fs.existsSync(item.src)) {
      fs.copyFileSync(item.src, item.dest);
    }
  }

  // Copy src directory
  const srcSource = path.join(version4Dir, 'src');
  const srcDest = path.join(stageDir, 'src');
  fs.cpSync(srcSource, srcDest, { recursive: true });

  console.log('🗜️  Compressing into app.zip via PowerShell Compress-Archive...');
  
  // Use PowerShell Compress-Archive to build zip without external dependencies
  const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${outputZipPath}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });

  // Also build mobile-bundle.zip for 100% silent mobile OTA updates (Android & iOS)
  const mobileZipPath = path.join(distDir, 'mobile-bundle.zip');
  const mobileStageDir = path.join(stageDir, 'src', 'ui');
  const psMobileCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${mobileStageDir}\\*' -DestinationPath '${mobileZipPath}' -Force"`;
  execSync(psMobileCmd, { stdio: 'inherit' });

  const zipStats = fs.statSync(outputZipPath);
  const sizeMb = (zipStats.size / (1024 * 1024)).toFixed(2);
  const mobileStats = fs.statSync(mobileZipPath);
  const mobileMb = (mobileStats.size / (1024 * 1024)).toFixed(2);

  console.log('\n' + '-'.repeat(65));
  console.log('✅ RELEASE PACKAGES GENERATED SUCCESSFULLY!');
  console.log(`   • Desktop / v3 Migration: ${outputZipPath} (${sizeMb} MB)`);
  console.log(`   • Mobile Silent OTA:       ${mobileZipPath} (${mobileMb} MB)`);
  console.log(`   • Target: Upload both to GitHub Releases under latest release tag`);
  console.log('='.repeat(65) + '\n');

  return { appZip: outputZipPath, mobileBundle: mobileZipPath };
}

if (require.main === module) {
  try {
    createReleasePackage();
  } catch (err) {
    console.error('Packaging failed:', err);
    process.exit(1);
  }
}

module.exports = { createReleasePackage };

