#!/usr/bin/env node
// Version 4/src/updater/self-update.js
/**
 * Single-Command Client Self-Updater
 * Usage:
 *   node src/updater/self-update.js [--force]
 *
 * Checks GitHub Releases, downloads app.zip, unpacks in place,
 * and automatically runs database migrations.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { autoUpgradeIfRequired } = require('../migrator');
const RollbackManager = require('./rollback-manager');
const pkg = require('../../package.json');

const GITHUB_REPO = 'gmastergreatee/Fanfiction-Manager';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (targetUrl) => {
      https.get(
        targetUrl,
        {
          headers: {
            'User-Agent': `Fanfiction-Manager-v4/${pkg.version}`,
            Accept: 'application/octet-stream',
          },
        },
        (res) => {
          // Handle HTTP redirects (GitHub Releases redirect to S3/CDN)
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return get(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`Download failed with HTTP ${res.statusCode}`));
          }
          res.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }
      ).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    get(url);
  });
}

function parseSemver(ver) {
  return ver
    .replace(/^[vV]|beta_/g, '')
    .split('.')
    .map((x) => parseInt(x, 10) || 0);
}

function isNewer(remote, local) {
  const r = parseSemver(remote);
  const l = parseSemver(local);
  for (let i = 0; i < 3; i++) {
    if (r[i] > (l[i] || 0)) return true;
    if (r[i] < (l[i] || 0)) return false;
  }
  return false;
}

async function selfUpdate() {
  const force = process.argv.includes('--force');
  const appRoot = path.resolve(__dirname, '..', '..');
  const tempDir = path.join(appRoot, 'temp_update');
  const zipPath = path.join(tempDir, 'update.zip');

  console.log('='.repeat(65));
  console.log('  Fanfiction Manager — Automatic Self-Updater');
  console.log('='.repeat(65));
  console.log(`Current version: v${pkg.version}`);
  console.log('Checking for updates on GitHub...');

  const res = await fetch(RELEASES_API, {
    headers: {
      'User-Agent': `Fanfiction-Manager-v4/${pkg.version}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to check updates (GitHub HTTP ${res.status})`);
  }

  const release = await res.json();
  const remoteTag = release.tag_name;
  console.log(`Latest release on GitHub: ${remoteTag}`);

  if (!force && !isNewer(remoteTag, pkg.version)) {
    console.log('✅ You are already on the latest version!');
    console.log('='.repeat(65));
    return;
  }

  const appZipAsset = (release.assets || []).find((a) => a.name === 'app.zip');
  if (!appZipAsset) {
    throw new Error(`Release ${remoteTag} does not contain an app.zip asset.`);
  }

  console.log(`\n📥 Downloading update from: ${appZipAsset.browser_download_url}`);
  fs.mkdirSync(tempDir, { recursive: true });

  await downloadFile(appZipAsset.browser_download_url, zipPath);
  
  // Create rollback snapshot of current version (holds up to 3 older versions)
  console.log('🛡️  Creating safety rollback snapshot (3-version ring buffer)...');
  const rollbackManager = new RollbackManager({ appRoot });
  await rollbackManager.createSnapshotBeforeUpdate(pkg.version);

  console.log('📦 Extracting update in place...');

  // Unpack using PowerShell Expand-Archive
  const psCmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${appRoot}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Clean up temp directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  console.log('\n🔄 Running database migrations on updated schema...');
  const migrationResult = await autoUpgradeIfRequired({
    v3Path: path.resolve(appRoot, '..'),
    v4DataDir: path.join(appRoot, 'v4_data'),
  });

  if (migrationResult.status === 'SUCCESS') {
    console.log(`   • Migrated ${migrationResult.novelCount} novels and ${migrationResult.chapterCount} chapters.`);
  }

  console.log('\n' + '-'.repeat(65));
  console.log(`✅ UPDATE COMPLETED! Fanfiction Manager upgraded to ${remoteTag}`);
  console.log('='.repeat(65) + '\n');
}

if (require.main === module) {
  selfUpdate().catch((err) => {
    console.error('❌ Self-update failed:', err.message);
    process.exit(1);
  });
}

module.exports = { selfUpdate };

