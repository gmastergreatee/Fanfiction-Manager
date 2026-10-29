// Version 4/src/core/epub.js
/**
 * Standalone EPUB Exporter for Fanfiction Manager Version 4
 * Generates compliant EPUB e-books with cover, metadata, NCX, and XHTML chapters.
 * Uses pure Node.js (zlib + built-in zip structure) with zero external dependencies.
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
 * Lightweight in-memory ZIP builder specifically designed for compliant EPUB packages
 */
class ZipArchiveBuilder {
  constructor() {
    this.files = [];
  }

  addFile(name, content, options = {}) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const compress = options.compress !== false;
    this.files.push({ name, data, compress });
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

class EpubExporter {
  constructor(options = {}) {
    this.options = options;
  }

  escapeXml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  cleanHtmlForXml(html = '') {
    if (!html) return '';
    // Self-close unclosed void tags in HTML to produce valid XML
    let xml = html
      .replace(/<br(\s*)>/gi, '<br/>')
      .replace(/<hr(\s*)>/gi, '<hr/>')
      .replace(/<img([^>]+)(?<!\/)>/gi, '<img$1/>');
    
    // Wrap text if missing paragraphs
    if (!/<[a-z][\s\S]*>/i.test(xml)) {
      xml = xml
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l) => `<p>${this.escapeXml(l)}</p>`)
        .join('\n');
    }
    return xml;
  }

  generateEpub(novel, chapters = [], options = {}) {
    const zip = new ZipArchiveBuilder();
    const bookId = novel.id || crypto.randomUUID();
    const title = novel.title || 'Untitled Fanfiction';
    const author = novel.author || 'Unknown Author';
    const summary = novel.summary || '';
    const date = new Date().toISOString().split('T')[0];

    // 1. mimetype (MUST be the first file, and MUST be uncompressed)
    zip.addFile('mimetype', 'application/epub+zip', { compress: false });

    // 2. META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.addFile('META-INF/container.xml', containerXml);

    // 3. OEBPS/style.css
    const css = `
body {
  font-family: "Merriweather", Georgia, "Times New Roman", serif;
  line-height: 1.6;
  margin: 5%;
  text-align: justify;
}
h1, h2, h3 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1em;
}
p {
  text-indent: 1.5em;
  margin: 0.5em 0;
}
.cover-page {
  text-align: center;
  padding: 10% 0;
}
.novel-title {
  font-size: 2.2em;
  font-weight: bold;
}
.novel-author {
  font-size: 1.2em;
  color: #555;
  margin-top: 1em;
}
.novel-summary {
  font-style: italic;
  margin: 3em 10%;
  text-indent: 0;
}
`;
    zip.addFile('OEBPS/style.css', css);

    // 4. OEBPS/titlepage.xhtml
    const titlePage = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${this.escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="cover-page">
    <h1 class="novel-title">${this.escapeXml(title)}</h1>
    <h3 class="novel-author">by ${this.escapeXml(author)}</h3>
    <div class="novel-summary">
      <p>${this.escapeXml(summary)}</p>
    </div>
  </div>
</body>
</html>`;
    zip.addFile('OEBPS/titlepage.xhtml', titlePage);

    // 5. Add Chapter Files
    const chapterManifest = [];
    const chapterSpine = [];
    const validChapters = chapters.filter((c) => c.content_html || c.is_downloaded);

    validChapters.forEach((ch, idx) => {
      const chIndex = ch.chapter_index || idx + 1;
      const chTitle = ch.title || `Chapter ${chIndex}`;
      const fileName = `chapter_${chIndex}.xhtml`;
      const id = `chapter_${chIndex}`;

      const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${this.escapeXml(chTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h2>${this.escapeXml(chTitle)}</h2>
  <div class="chapter-body">
    ${this.cleanHtmlForXml(ch.content_html || '<p>Chapter content downloaded.</p>')}
  </div>
</body>
</html>`;

      zip.addFile(`OEBPS/${fileName}`, xhtml);
      chapterManifest.push(`<item id="${id}" href="${fileName}" media-type="application/xhtml+xml"/>`);
      chapterSpine.push(`<itemref idref="${id}"/>`);
    });

    // 6. OEBPS/toc.ncx
    const ncxNavPoints = validChapters
      .map((ch, idx) => {
        const chIndex = ch.chapter_index || idx + 1;
        const chTitle = ch.title || `Chapter ${chIndex}`;
        return `
    <navPoint id="navPoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>${this.escapeXml(chTitle)}</text></navLabel>
      <content src="chapter_${chIndex}.xhtml"/>
    </navPoint>`;
      })
      .join('');

    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${this.escapeXml(title)}</text></docTitle>
  <docAuthor><text>${this.escapeXml(author)}</text></docAuthor>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Cover &amp; Title</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>${ncxNavPoints}
  </navMap>
</ncx>`;
    zip.addFile('OEBPS/toc.ncx', tocNcx);

    // 7. OEBPS/nav.xhtml (EPUB 3 Navigation Document)
    const navItems = validChapters
      .map((ch, idx) => {
        const chIndex = ch.chapter_index || idx + 1;
        const chTitle = ch.title || `Chapter ${chIndex}`;
        return `<li><a href="chapter_${chIndex}.xhtml">${this.escapeXml(chTitle)}</a></li>`;
      })
      .join('\n        ');

    const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="titlepage.xhtml">Title Page</a></li>
      ${navItems}
    </ol>
  </nav>
</body>
</html>`;
    zip.addFile('OEBPS/nav.xhtml', navXhtml);

    // 8. OEBPS/content.opf
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${bookId}</dc:identifier>
    <dc:title>${this.escapeXml(title)}</dc:title>
    <dc:creator>${this.escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${date}</dc:date>
    <dc:description>${this.escapeXml(summary)}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    ${chapterManifest.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    <itemref idref="titlepage"/>
    ${chapterSpine.join('\n    ')}
  </spine>
</package>`;
    zip.addFile('OEBPS/content.opf', contentOpf);

    return zip.build();
  }

  exportToFile(novel, chapters, outputPath) {
    const buffer = this.generateEpub(novel, chapters);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
    return {
      success: true,
      outputPath,
      bytes: buffer.length,
      chapterCount: chapters.length,
    };
  }
}

module.exports = { EpubExporter, ZipArchiveBuilder };

