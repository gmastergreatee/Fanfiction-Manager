// scripts/normalize-covers.js
const DatabaseClient = require('../src/core/db.js');
const db = new DatabaseClient();
const novels = db.getAllNovels();

let count = 0;
for (const n of novels) {
  let cover = n.cover_local_path || '';
  cover = cover.replace(/\\/g, '/').replace(/^\/+/, '');
  if (cover && !cover.startsWith('covers/')) {
    cover = 'covers/' + cover;
  }
  const normalizedCover = cover ? '/' + cover : '';

  let author = n.author;
  if (!author && n.summary) {
    const m = n.summary.match(/(?:Author|Original Author|By)[:：]\s*([^<\r\n]+)/i);
    if (m) author = m[1].trim();
  }
  if (!author && n.source_url) {
    try {
      author = new URL(n.source_url).hostname.replace(/^www\./, '');
    } catch (e) {}
  }

  db.db.prepare('UPDATE novels SET cover_local_path = ?, author = ? WHERE id = ?').run(
    normalizedCover,
    author || 'Web Novel',
    n.id
  );
  count++;
}

console.log(`Successfully normalized ${count} novels:`);
console.log(db.getAllNovels({ limit: 3 }).map((n) => ({ title: n.title, author: n.author, cover: n.cover_local_path })));

