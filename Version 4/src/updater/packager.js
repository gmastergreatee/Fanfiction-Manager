// Version 4/src/updater/packager.js
/**
 * Release Packager for Version 4
 * Creates the exact 'app.zip' bundle expected by legacy v3's updateApp() function
 * and 'mobile-bundle.zip' for mobile OTA updates.
 * Pure Node.js implementation: cross-platform (Windows, Linux, macOS), 0 external dependencies.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

// Standard CRC32 table for pure Node.js zip generation
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c;
}

function calculateCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Pure Node.js ZIP archive generator with zero external dependencies
 */
class PureZipArchive {
  constructor() {
    this.files = [];
  }

  addFile(name, content, compress = true) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    this.files.push({ name: name.replace(/\\/g, '/'), data, compress });
  }

  addDirectory(dirPath, rootDir = dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        this.addDirectory(fullPath, rootDir);
      } else if (entry.isFile()) {
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        const data = fs.readFileSync(fullPath);
        this.addFile(relPath, data, true);
      }
    }
  }

  build() {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const file of this.files) {
      const nameBuf = Buffer.from(file.name, 'utf8');
      const uncompressedSize = file.data.length;
      const crc32 = calculateCrc32(file.data);

      let compressedData = file.data;
      let method = 0; // Stored (no compression)

      if (file.compress) {
        compressedData = zlib.deflateRawSync(file.data);
        method = 8; // Deflated
      }

      const compressedSize = compressedData.length;

      // Local file header (30 bytes + name length)
      const localHdr = Buffer.alloc(30 + nameBuf.length);
      localHdr.writeUInt32LE(0x04034b50, 0); // signature
      localHdr.writeUInt16LE(20, 4);          // version needed
      localHdr.writeUInt16LE(0, 6);           // flags
      localHdr.writeUInt16LE(method, 8);      // compression method
      localHdr.writeUInt16LE(0, 10);          // mod time
      localHdr.writeUInt16LE(0, 12);          // mod date
      localHdr.writeUInt32LE(crc32, 14);       // crc-32
      localHdr.writeUInt32LE(compressedSize, 18); // compressed size
      localHdr.writeUInt32LE(uncompressedSize, 22); // uncompressed size
      localHdr.writeUInt16LE(nameBuf.length, 26); // file name length
      localHdr.writeUInt16LE(0, 28);          // extra field length
      nameBuf.copy(localHdr, 30);

      // Central directory header (46 bytes + name length)
      const centralHdr = Buffer.alloc(46 + nameBuf.length);
      centralHdr.writeUInt32LE(0x02014b50, 0); // signature
      centralHdr.writeUInt16LE(20, 4);          // version made by
      centralHdr.writeUInt16LE(20, 6);          // version needed
      centralHdr.writeUInt16LE(0, 8);           // flags
      centralHdr.writeUInt16LE(method, 10);     // compression method
      centralHdr.writeUInt16LE(0, 12);          // mod time
      centralHdr.writeUInt16LE(0, 14);          // mod date
      centralHdr.writeUInt32LE(crc32, 16);       // crc-32
      centralHdr.writeUInt32LE(compressedSize, 20); // compressed size
      centralHdr.writeUInt32LE(uncompressedSize, 24); // uncompressed size
      centralHdr.writeUInt16LE(nameBuf.length, 28); // file name length
      centralHdr.writeUInt16LE(0, 30);          // extra field length
      centralHdr.writeUInt16LE(0, 32);          // file comment length
      centralHdr.writeUInt16LE(0, 34);          // disk number start
      centralHdr.writeUInt16LE(0, 36);          // internal file attrs
      centralHdr.writeUInt32LE(0, 38);          // external file attrs
      centralHdr.writeUInt32LE(offset, 42);     // relative offset of local header
      nameBuf.copy(centralHdr, 46);

      localHeaders.push(localHdr);
      localHeaders.push(compressedData);
      centralHeaders.push(centralHdr);

      offset += localHdr.length + compressedData.length;
    }

    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const ch of centralHeaders) {
      centralDirSize += ch.length;
    }

    // End of central directory record (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // signature
    eocd.writeUInt16LE(0, 4);          // number of this disk
    eocd.writeUInt16LE(0, 6);          // disk where central dir starts
    eocd.writeUInt16LE(this.files.length, 8); // total entries on this disk
    eocd.writeUInt16LE(this.files.length, 10); // total entries
    eocd.writeUInt32LE(centralDirSize, 12); // size of central directory
    eocd.writeUInt32LE(centralDirOffset, 16); // offset of start of central directory
    eocd.writeUInt16LE(0, 20);         // comment length

    return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  }
}

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

  console.log('🗜️  Compressing into app.zip via pure Node.js zip engine...');
  const appZip = new PureZipArchive();
  appZip.addDirectory(stageDir, stageDir);
  const appZipBuffer = appZip.build();
  fs.writeFileSync(outputZipPath, appZipBuffer);

  // Also build mobile-bundle.zip for 100% silent mobile OTA updates (Android & iOS)
  const mobileZipPath = path.join(distDir, 'mobile-bundle.zip');
  const mobileStageDir = path.join(stageDir, 'src', 'ui');
  const mobileZip = new PureZipArchive();
  if (fs.existsSync(mobileStageDir)) {
    mobileZip.addDirectory(mobileStageDir, mobileStageDir);
  }
  const mobileZipBuffer = mobileZip.build();
  fs.writeFileSync(mobileZipPath, mobileZipBuffer);

  // Generate checksums.json for integrity verification
  const checksumsPath = path.join(distDir, 'checksums.json');
  const checksums = {
    'app.zip': crypto.createHash('sha256').update(appZipBuffer).digest('hex'),
    'mobile-bundle.zip': crypto.createHash('sha256').update(mobileZipBuffer).digest('hex'),
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2), 'utf8');

  const zipStats = fs.statSync(outputZipPath);
  const sizeMb = (zipStats.size / (1024 * 1024)).toFixed(2);
  const mobileStats = fs.statSync(mobileZipPath);
  const mobileMb = (mobileStats.size / (1024 * 1024)).toFixed(2);

  console.log('\n' + '-'.repeat(65));
  console.log('✅ RELEASE PACKAGES GENERATED SUCCESSFULLY!');
  console.log(`   • Desktop / v3 Migration: ${outputZipPath} (${sizeMb} MB)`);
  console.log(`   • Mobile Silent OTA:       ${mobileZipPath} (${mobileMb} MB)`);
  console.log(`   • Checksums:               ${checksumsPath}`);
  console.log(`   • SHA-256 (app.zip):       ${checksums['app.zip']}`);
  console.log('='.repeat(65) + '\n');

  return { appZip: outputZipPath, mobileBundle: mobileZipPath, checksums: checksumsPath };
}

if (require.main === module) {
  try {
    createReleasePackage();
  } catch (err) {
    console.error('Packaging failed:', err);
    process.exit(1);
  }
}

module.exports = { createReleasePackage, PureZipArchive };
