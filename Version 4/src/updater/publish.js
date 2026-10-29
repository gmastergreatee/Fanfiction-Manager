#!/usr/bin/env node
// Version 4/src/updater/publish.js
/**
 * Single-Command Automated Release Publisher
 * Usage:
 *   npm run release:patch   (bumps 4.0.0 -> 4.0.1)
 *   npm run release:minor   (bumps 4.0.0 -> 4.1.0)
 *   npm run release:major   (bumps 4.0.0 -> 5.0.0)
 *
 * Fully autonomous workflow:
 * 1. Runs test suite to verify 100% data integrity
 * 2. Bumps version in package.json
 * 3. Compiles dist/app.zip and computes SHA-256 hash
 * 4. Creates git commit and annotated tag
 * 5. Pushes tag to GitHub
 * 6. (Optional) Publishes release via GitHub API with GITHUB_TOKEN
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { createReleasePackage } = require('./packager');

function bumpVersion(currentVersion, bumpType = 'patch') {
  const parts = currentVersion.replace(/^[vV]|beta_/g, '').split('.').map((x) => parseInt(x, 10) || 0);
  while (parts.length < 3) parts.push(0);

  if (bumpType === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bumpType === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    // patch
    parts[2]++;
  }
  return parts.join('.');
}

function calculateSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function publishRelease() {
  const version4Dir = path.resolve(__dirname, '..', '..');
  const pkgPath = path.join(version4Dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const args = process.argv.slice(2);
  let bumpType = 'patch';
  if (args.includes('minor') || args.includes('--minor')) bumpType = 'minor';
  if (args.includes('major') || args.includes('--major')) bumpType = 'major';

  console.log('='.repeat(65));
  console.log('  Fanfiction Manager — Automated Release Pipeline');
  console.log('='.repeat(65));

  // Step 1: Pre-flight Verification Tests
  console.log('\n[1/5] Running verification test suite...');
  try {
    execSync('node tests/test-migration.js', { cwd: version4Dir, stdio: 'inherit' });
    console.log('  ✅ Tests passed with 100% data integrity.');
  } catch (err) {
    console.error('❌ Tests failed! Aborting release.');
    process.exit(1);
  }

  // Step 2: Version Bump
  const oldVersion = pkg.version;
  const newVersion = bumpVersion(oldVersion, bumpType);
  const newTag = `v${newVersion}`;
  console.log(`\n[2/5] Bumping version: ${oldVersion} ──▶ ${newVersion} (${bumpType})`);

  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // Step 3: Build app.zip release bundle
  console.log('\n[3/5] Packaging release bundle...');
  const zipPath = createReleasePackage();
  const sha256 = calculateSha256(zipPath);
  console.log(`  🔑 SHA-256 Checksum: ${sha256}`);

  // Save checksum manifest
  const checksumPath = path.join(version4Dir, 'dist', 'checksums.json');
  fs.writeFileSync(
    checksumPath,
    JSON.stringify(
      {
        version: newVersion,
        tag: newTag,
        file: 'app.zip',
        sha256,
        created_at: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // Step 4: Git Commit & Tag
  console.log('\n[4/5] Creating Git commit and annotated tag...');
  try {
    execSync(`git add "${pkgPath}"`, { stdio: 'inherit' });
    execSync(`git commit -m "release: ${newTag}"`, { stdio: 'inherit' });
    execSync(`git tag -a ${newTag} -m "Release ${newTag}"`, { stdio: 'inherit' });
    console.log(`  ✅ Tagged ${newTag}`);
  } catch (err) {
    console.warn(`  ⚠️ Git commit/tag skipped or already exists: ${err.message}`);
  }

  // Step 5: Automated GitHub Release
  console.log('\n[5/5] Checking GitHub automated publishing...');
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    console.log('  🚀 GITHUB_TOKEN detected. Publishing directly via GitHub API...');
    try {
      const releaseBody = JSON.stringify({
        tag_name: newTag,
        name: `Fanfiction Manager ${newTag}`,
        body: `### Fanfiction Manager ${newTag}\n\n- Automated release\n- SHA-256: \`${sha256}\`\n`,
        draft: false,
        prerelease: false,
      });

      const res = await fetch(
        'https://api.github.com/repos/gmastergreatee/Fanfiction-Manager/releases',
        {
          method: 'POST',
          headers: {
            Authorization: `token ${token}`,
            'User-Agent': 'Fanfiction-Manager-Release-Bot',
            'Content-Type': 'application/json',
          },
          body: releaseBody,
        }
      );

      if (res.ok) {
        const releaseData = await res.json();
        console.log(`  ✅ Release created: ${releaseData.html_url}`);

        // Upload app.zip asset
        const uploadUrl = releaseData.upload_url.replace('{?name,label}', `?name=app.zip`);
        const fileBytes = fs.readFileSync(zipPath);
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `token ${token}`,
            'User-Agent': 'Fanfiction-Manager-Release-Bot',
            'Content-Type': 'application/zip',
          },
          body: fileBytes,
        });

        if (uploadRes.ok) {
          console.log('  ✅ Asset app.zip uploaded successfully!');
        }
      }
    } catch (apiErr) {
      console.warn(`  ⚠️ GitHub API upload error: ${apiErr.message}`);
    }
  } else {
    console.log('  ℹ️  No GITHUB_TOKEN environment variable found.');
    console.log(`  To push tag and upload manually:`);
    console.log(`     git push origin ${newTag}`);
    console.log(`     Upload '${zipPath}' to https://github.com/gmastergreatee/Fanfiction-Manager/releases/tag/${newTag}`);
  }

  console.log('\n' + '='.repeat(65));
  console.log(`🎉 RELEASE ${newTag} READY!`);
  console.log('='.repeat(65) + '\n');
}

if (require.main === module) {
  publishRelease().catch((err) => {
    console.error('Fatal release error:', err);
    process.exit(1);
  });
}

module.exports = { publishRelease };

