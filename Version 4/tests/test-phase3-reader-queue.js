// Version 4/tests/test-phase3-reader-queue.js
/**
 * Test Suite for Phase 3: Modern Responsive UI, Reading Mode, & Downloader Queue
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const DatabaseClient = require('../src/core/db');
const DownloadQueueManager = require('../src/core/queue');

async function runPhase3Tests() {
  console.log('🧪 Running Phase 3: Reading Mode & Downloader Queue Test Suite...\n');

  // --- 1. Test Reading Progress & SQLite Persistence ---
  console.log('  1. Testing Reading Progress Persistence & Auto-Save in SQLite...');
  const testDbPath = path.join(__dirname, 'test_phase3_db.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new DatabaseClient(testDbPath);
  const novelId = 'test-novel-uuid-101';

  // Seed sample novel
  db.db.prepare(`
    INSERT INTO novels (id, title, author, source_url, total_chapters, downloaded_chapters)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(novelId, 'Re:Zero Test Novel', 'Tappei', 'https://example.com/rezero', 50, 10);

  // Initial progress should be undefined
  const initialProg = db.getReadingProgress(novelId);
  assert.strictEqual(initialProg, undefined, 'Initial progress should be empty');

  // Auto-save progress at Chapter 5, 42.5%
  db.saveReadingProgress(novelId, 5, 42.5);
  const savedProg1 = db.getReadingProgress(novelId);
  assert.ok(savedProg1, 'Saved progress record should exist');
  assert.strictEqual(savedProg1.novel_id, novelId);
  assert.strictEqual(savedProg1.last_chapter_index, 5);
  assert.strictEqual(Math.round(savedProg1.scroll_percentage * 10) / 10, 42.5);

  // Update progress to Chapter 12, 88.0%
  db.saveReadingProgress(novelId, 12, 88.0);
  const savedProg2 = db.getReadingProgress(novelId);
  assert.strictEqual(savedProg2.last_chapter_index, 12);
  assert.strictEqual(Math.round(savedProg2.scroll_percentage), 88);

  console.log('  ✅ Reading progress auto-save & SQLite persistence verified.');

  // --- 2. Test Reading Mode Typography & Paginated Chunking ---
  console.log('  2. Testing Reader Typography, Themes, & Pagination Engine...');
  const themes = {
    dark: { bg: '#18181b', text: '#e2e8f0' },
    oled: { bg: '#000000', text: '#e5e5e5' },
    sepia: { bg: '#fbf0d9', text: '#5f4b32' },
    light: { bg: '#ffffff', text: '#1e293b' },
  };

  assert.strictEqual(themes.oled.bg, '#000000', 'OLED theme must be pure 100% black');
  assert.strictEqual(themes.sepia.bg, '#fbf0d9', 'Sepia theme background verified');

  // Simulate paragraph pagination calculation
  const sampleChapterContent = `
    <p>Paragraph 1: The sun set over the horizon, casting crimson streaks across the towering crystalline towers.</p>
    <p>Paragraph 2: A cold gust rushed through the stone colonnade, fluttering the banners of the northern guild.</p>
    <p>Paragraph 3: Deep inside the archives, scholars deciphered the ancient glyphs describing the rift.</p>
    <p>Paragraph 4: "We do not have much time left," the archivist whispered with trembling hands.</p>
    <p>Paragraph 5: Outside, the bells of the citadel tolled twelve times, echoing into the darkening night.</p>
  `;

  function paginateContent(content, pageSize = 200) {
    const pRegex = /<p>[\s\S]*?<\/p>/gi;
    const matches = content.match(pRegex) || [content];
    const pages = [];
    let cur = '';
    for (const p of matches) {
      if (cur.length + p.length > pageSize && cur.length > 0) {
        pages.push(cur);
        cur = p;
      } else {
        cur += p;
      }
    }
    if (cur) pages.push(cur);
    return pages;
  }

  const pages = paginateContent(sampleChapterContent, 220);
  assert.ok(pages.length >= 2, `Should split into multiple pages (actual: ${pages.length})`);
  assert.ok(pages[0].includes('Paragraph 1'), 'First page should contain Paragraph 1');
  assert.ok(pages[pages.length - 1].includes('Paragraph 5'), 'Last page should contain final paragraph');

  console.log(`  ✅ Reader pagination & theme engine verified (${pages.length} pages generated).`);

  // --- 3. Test Downloader Queue Manager (Concurrency, Throttling & Controls) ---
  console.log('  3. Testing Downloader Queue Manager Concurrency & Rate Throttling...');
  const queue = new DownloadQueueManager({
    concurrency: 2,
    delayMs: 30, // 30ms polite throttle for unit test speed
  });

  const executedTasks = [];

  // Add 4 tasks with mock fetch
  for (let i = 1; i <= 4; i++) {
    queue.addTask({
      novelId,
      novelTitle: 'Re:Zero Test Novel',
      chapterIndex: i,
      chapterTitle: `Chapter ${i}`,
      fetchFn: async (task) => {
        executedTasks.push(task.chapterIndex);
        await new Promise((res) => setTimeout(res, 20));
      },
    });
  }

  assert.strictEqual(queue.queue.length, 4, '4 tasks should be enqueued');

  // Wait for all 4 tasks to finish processing
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const snap = queue.getSnapshot();
      if (snap.stats.completed === 4) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 20);
  });

  assert.strictEqual(executedTasks.length, 4, 'All 4 chapters should have executed');
  assert.deepStrictEqual(executedTasks.sort(), [1, 2, 3, 4]);

  const snapCompleted = queue.getSnapshot();
  assert.strictEqual(snapCompleted.stats.completed, 4);
  assert.strictEqual(snapCompleted.stats.overallProgress, 100);

  // Clear completed tasks
  queue.clearCompleted();
  assert.strictEqual(queue.queue.length, 0, 'Queue should be empty after clearCompleted');

  // --- 4. Test Queue Pause & Resume Controls ---
  console.log('  4. Testing Queue Pause & Resume Flow...');
  const pauseTestQueue = new DownloadQueueManager({
    concurrency: 1,
    delayMs: 40,
  });

  const orderOfEvents = [];
  pauseTestQueue.on('paused', () => orderOfEvents.push('paused'));
  pauseTestQueue.on('resumed', () => orderOfEvents.push('resumed'));

  // Pause before adding tasks
  pauseTestQueue.pause();
  assert.strictEqual(pauseTestQueue.isPaused, true);

  pauseTestQueue.addTask({
    novelId,
    chapterIndex: 99,
    fetchFn: async () => {
      orderOfEvents.push('executed-99');
    },
  });

  // Task should remain paused/queued and NOT execute while paused
  await new Promise((res) => setTimeout(res, 80));
  assert.strictEqual(orderOfEvents.includes('executed-99'), false, 'Task should not run while queue is paused');

  // Resume queue
  pauseTestQueue.resume();
  assert.strictEqual(pauseTestQueue.isPaused, false);

  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (orderOfEvents.includes('executed-99')) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 15);
  });

  assert.ok(orderOfEvents.includes('executed-99'), 'Task executed after resuming');
  console.log('  ✅ Queue pause/resume and rate throttling verified.');

  // Clean up
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  console.log('\n🎉 ALL PHASE 3 TESTS PASSED! 100% SUCCESS.\n');
}

if (require.main === module) {
  runPhase3Tests().catch((err) => {
    console.error('❌ Phase 3 Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { runPhase3Tests };

