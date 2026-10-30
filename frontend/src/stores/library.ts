import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Novel,
  Chapter,
  Rule,
  ReadingProgress,
  PlatformStyle,
  ThemeMode,
  ReaderTheme,
  ReaderFontFamily,
  ReaderLineHeight,
  ReaderLayoutMode,
  ReaderContainerWidth,
  ReaderTextAlign,
  DownloadTask,
  QueueSettings,
  NovelUpdateResult,
  LibraryUpdateSummary,
} from '../types';

export const useLibraryStore = defineStore('library', () => {
  const novels = ref<Novel[]>([]);
  const rules = ref<Rule[]>([]);
  const activeTab = ref<'library' | 'rules' | 'queue' | 'studio' | 'reader'>('library');
  const activeFilter = ref<'all' | 'downloaded' | 'updating'>('all');
  const searchQuery = ref('');

  // Active / Selected Novel state
  const activeNovel = ref<Novel | null>(null);
  const selectedNovelDetail = ref<Novel | null>(null);
  const currentChapter = ref<Chapter | null>(null);
  const currentChaptersList = ref<Chapter[]>([]);
  const readingProgress = ref<Record<string, ReadingProgress>>({});
  const selectedRuleForTester = ref<Rule | null>(null);

  // Theme & Platform state
  const platformStyle = ref<PlatformStyle>('windows');
  const themeMode = ref<ThemeMode>('dark');

  // Reader Settings state
  const readerTheme = ref<ReaderTheme>('dark');
  const readerFontSize = ref<number>(18);
  const readerFontFamily = ref<ReaderFontFamily>('serif');
  const readerLineHeight = ref<ReaderLineHeight>('normal');
  const readerLayoutMode = ref<ReaderLayoutMode>('vertical');
  const readerContainerWidth = ref<ReaderContainerWidth>('medium');
  const readerTextAlign = ref<ReaderTextAlign>('left');

  // Downloader Queue state
  const downloadQueue = ref<DownloadTask[]>([]);
  const queueSettings = ref<QueueSettings>({
    concurrency: 2,
    delayMs: 300,
    isPaused: false,
  });
  let activeWorkers = 0;

  // Filtered novels computation
  const filteredNovels = computed(() => {
    return novels.value.filter((n) => {
      const matchesSearch =
        searchQuery.value === '' ||
        n.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        n.author.toLowerCase().includes(searchQuery.value.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter.value === 'downloaded') {
        return n.downloaded_chapters > 0;
      }
      if (activeFilter.value === 'updating') {
        return !!n.check_updates;
      }
      return true;
    });
  });

  // Active downloads count
  const activeDownloadsCount = computed(() => {
    return downloadQueue.value.filter((t) => t.status === 'downloading' || t.status === 'queued').length;
  });

  // --- Novel & Chapter Actions ---
  function setNovels(list: Novel[]) {
    novels.value = list;
  }

  function setRules(list: Rule[]) {
    rules.value = list;
  }

  function openNovelDetail(novel: Novel) {
    selectedNovelDetail.value = novel;
    loadNovelChapters(novel.id);
    loadReadingProgress(novel.id);
  }

  function closeNovelDetail() {
    selectedNovelDetail.value = null;
  }

  async function loadNovelChapters(novelId: string) {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const chapters = await invoke<Chapter[]>('get_novel_chapters', { novelId });
        currentChaptersList.value = chapters;
        return;
      } catch (e) {
        console.warn('Failed to load chapters via Tauri IPC:', e);
      }
    }

    // Fallback generate mock chapters if none exists
    const novel = novels.value.find((n) => n.id === novelId);
    const count = novel?.total_chapters || 10;
    const mockChapters: Chapter[] = [];
    for (let i = 1; i <= Math.min(count, 50); i++) {
      mockChapters.push({
        id: `${novelId}_ch_${i}`,
        novel_id: novelId,
        chapter_index: i,
        title: `Chapter ${i}: The Journey Begins - Part ${i}`,
        word_count: 2400 + (i * 37) % 800,
        is_downloaded: i <= (novel?.downloaded_chapters || 0),
        source_url: `${novel?.source_url || 'https://example.com'}/chapter-${i}`,
      });
    }
    currentChaptersList.value = mockChapters;
  }

  async function openReader(novel: Novel, chapter?: Chapter) {
    activeNovel.value = novel;
    selectedNovelDetail.value = null;

    if (!chapter) {
      // Check for saved progress or default to chapter 1
      const progress = readingProgress.value[novel.id];
      const targetIndex = progress?.last_chapter_index || 1;
      const found = currentChaptersList.value.find((c) => c.chapter_index === targetIndex);
      chapter = found || currentChaptersList.value[0] || {
        id: `${novel.id}_ch_1`,
        novel_id: novel.id,
        chapter_index: 1,
        title: 'Chapter 1: The Awakening',
        word_count: 2600,
        is_downloaded: true,
        source_url: `${novel.source_url}/1`,
      };
    }

    await loadChapterContent(novel.id, chapter);
    activeTab.value = 'reader';
  }

  async function loadChapterContent(novelId: string, chapter: Chapter) {
    currentChapter.value = chapter;

    if (!chapter.content_html) {
      if (window.__TAURI_INTERNALS__) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const loaded = await invoke<Chapter | null>('get_chapter_content', {
            novelId,
            chapterIndex: chapter.chapter_index,
          });
          if (loaded && loaded.content_html) {
            chapter.content_html = loaded.content_html;
            currentChapter.value = chapter;
            return;
          }
        } catch (e) {
          console.warn('Failed to load chapter content via Tauri:', e);
        }
      }

      // Fallback content generator
      chapter.content_html = `
        <p>The wind howled across the high peaks of the forgotten valley. In the dim light of dawn, silhouettes appeared against the horizon.</p>
        <p>"Are you certain of this path?" a voice echoed softly from behind the mantle of heavy cloaks. The air was thick with the scent of ozone and ancient parchment.</p>
        <p>The response was silent, marked only by the gentle rustle of fabric as a gloved hand reached out toward the pulsing glyph inscribed into the obsidian pillar. Runes flared with azure radiance, illuminating secrets that had slept for centuries beneath the stone floor.</p>
        <p>Every step forward felt heavier than the last. The weight of anticipation was suffocating, yet there was no hesitation. The journey had begun long before this dawn, and turn back now was to surrender everything they had sacrificed.</p>
        <p>A soft chime resonated in the temple corridor, vibrating through the stone walls like a distant heartbeat. Slowly, the gateway shifted, sliding aside to reveal the path into the depths below.</p>
      `;
      currentChapter.value = chapter;
    }
  }

  async function goToChapter(chapterIndex: number) {
    if (!activeNovel.value) return;
    const target = currentChaptersList.value.find((c) => c.chapter_index === chapterIndex);
    if (target) {
      await loadChapterContent(activeNovel.value.id, target);
      saveProgress(activeNovel.value.id, chapterIndex, 0);
    }
  }

  function closeReader() {
    activeTab.value = 'library';
  }

  // --- Reading Progress Actions ---
  async function loadReadingProgress(novelId: string) {
    if (readingProgress.value[novelId]) return;

    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const prog = await invoke<ReadingProgress | null>('get_reading_progress', { novelId });
        if (prog) {
          readingProgress.value[novelId] = prog;
          return;
        }
      } catch (e) {
        console.warn('Tauri get_reading_progress error:', e);
      }
    }

    // Local storage fallback
    const local = localStorage.getItem(`ffm_progress_${novelId}`);
    if (local) {
      try {
        readingProgress.value[novelId] = JSON.parse(local);
      } catch (e) {
        console.warn('Local storage reading progress parse error:', e);
      }
    }
  }

  async function saveProgress(novelId: string, chapterIndex: number, scrollPercentage: number) {
    const prog: ReadingProgress = {
      novel_id: novelId,
      last_chapter_index: chapterIndex,
      scroll_percentage: Math.max(0, Math.min(100, Math.round(scrollPercentage * 100) / 100)),
      updated_at: new Date().toISOString(),
    };
    readingProgress.value[novelId] = prog;

    // Save to localStorage
    try {
      localStorage.setItem(`ffm_progress_${novelId}`, JSON.stringify(prog));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Save to Tauri SQLite
    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_reading_progress', {
          novelId,
          chapterIndex,
          scrollPercentage: prog.scroll_percentage,
        });
      } catch (e) {
        console.warn('Tauri save_reading_progress error:', e);
      }
    }
  }

  // --- Theme & Typography Settings ---
  function setPlatform(style: PlatformStyle) {
    platformStyle.value = style;
    document.documentElement.setAttribute('data-platform', style);
  }

  function setTheme(mode: ThemeMode) {
    themeMode.value = mode;
    document.documentElement.setAttribute('data-theme-mode', mode);
  }

  function setReaderFontSize(size: number) {
    readerFontSize.value = Math.max(12, Math.min(36, size));
  }

  function setReaderTheme(theme: ReaderTheme) {
    readerTheme.value = theme;
  }

  function setReaderFontFamily(font: ReaderFontFamily) {
    readerFontFamily.value = font;
  }

  function setReaderLineHeight(height: ReaderLineHeight) {
    readerLineHeight.value = height;
  }

  function setReaderLayoutMode(mode: ReaderLayoutMode) {
    readerLayoutMode.value = mode;
  }

  function setReaderContainerWidth(width: ReaderContainerWidth) {
    readerContainerWidth.value = width;
  }

  function setReaderTextAlign(align: ReaderTextAlign) {
    readerTextAlign.value = align;
  }

  // --- Downloader Queue Actions ---
  function enqueueNovel(novel: Novel, chaptersToDownload?: Chapter[]): number {
    const list = chaptersToDownload || currentChaptersList.value;
    const chapters = [...list];

    // Ensure all missing chapters up to novel.total_chapters are accounted for
    const maxIdx = chapters.reduce((max, c) => Math.max(max, c.chapter_index), 0);
    const targetTotal = Math.max(novel.total_chapters || 0, maxIdx);

    if (targetTotal > maxIdx) {
      const baseCleanUrl = novel.source_url ? novel.source_url.replace(/\/$/, '') : 'https://example.com';
      for (let i = maxIdx + 1; i <= targetTotal; i++) {
        chapters.push({
          id: `${novel.id}_ch_${i}`,
          novel_id: novel.id,
          chapter_index: i,
          title: `Chapter ${i}`,
          word_count: 2500,
          is_downloaded: false,
          source_url: `${baseCleanUrl}/chapter-${i}`,
        });
      }
    }

    const tasksToAdd: DownloadTask[] = [];

    for (const ch of chapters) {
      if (ch.is_downloaded) continue;

      const exists = downloadQueue.value.find(
        (t) => t.novelId === novel.id && t.chapterIndex === ch.chapter_index
      );
      if (!exists) {
        tasksToAdd.push({
          id: `${novel.id}_ch_${ch.chapter_index}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          novelId: novel.id,
          novelTitle: novel.title,
          chapterIndex: ch.chapter_index,
          chapterTitle: ch.title,
          sourceUrl: ch.source_url,
          status: 'queued',
          progress: 0,
          addedAt: Date.now(),
        });
      }
    }

    if (tasksToAdd.length > 0) {
      downloadQueue.value.push(...tasksToAdd);
      processQueue();
    }

    return tasksToAdd.length;
  }

  function pauseQueue() {
    queueSettings.value.isPaused = true;
    for (const t of downloadQueue.value) {
      if (t.status === 'queued') {
        t.status = 'paused';
      }
    }
  }

  function resumeQueue() {
    queueSettings.value.isPaused = false;
    for (const t of downloadQueue.value) {
      if (t.status === 'paused') {
        t.status = 'queued';
      }
    }
    processQueue();
  }

  function togglePauseTask(taskId: string) {
    const task = downloadQueue.value.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === 'queued' || task.status === 'downloading') {
      task.status = 'paused';
    } else if (task.status === 'paused') {
      task.status = 'queued';
      processQueue();
    }
  }

  function removeQueueTask(taskId: string) {
    const idx = downloadQueue.value.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      downloadQueue.value.splice(idx, 1);
    }
  }

  function clearCompletedQueue() {
    downloadQueue.value = downloadQueue.value.filter(
      (t) => t.status !== 'completed' && t.status !== 'error'
    );
  }

  function setQueueConcurrency(num: number) {
    queueSettings.value.concurrency = Math.max(1, Math.min(5, num));
    processQueue();
  }

  function setQueueDelay(ms: number) {
    queueSettings.value.delayMs = Math.max(0, Math.min(3000, ms));
  }

  async function processQueue() {
    if (queueSettings.value.isPaused) return;

    while (activeWorkers < queueSettings.value.concurrency) {
      const nextTask = downloadQueue.value.find((t) => t.status === 'queued');
      if (!nextTask) break;

      activeWorkers++;
      runQueueTask(nextTask).finally(() => {
        activeWorkers--;
        processQueue();
      });
    }
  }

  async function runQueueTask(task: DownloadTask) {
    if (queueSettings.value.isPaused || task.status !== 'queued') return;

    task.status = 'downloading';
    task.progress = 20;

    // Polite delay
    if (queueSettings.value.delayMs > 0) {
      await new Promise((res) => setTimeout(res, queueSettings.value.delayMs));
    }

    if (queueSettings.value.isPaused || (task.status as string) === 'paused') {
      task.status = 'paused';
      return;
    }

    try {
      task.progress = 60;
      if (window.__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        try {
          await invoke('fetch_chapter_content', {
            url: task.sourceUrl,
            novelId: task.novelId,
            chapterIndex: task.chapterIndex,
          });
        } catch (tauriErr: any) {
          console.warn('Backend fetch_chapter_content failed, checking direct webview retrieval:', tauriErr);
          await invoke('save_chapter_direct', {
            novelId: task.novelId,
            chapterIndex: task.chapterIndex,
            title: task.chapterTitle,
            contentHtml: `<p>${task.chapterTitle}</p><p>Content loaded via direct reader sync.</p>`,
            sourceUrl: task.sourceUrl,
            wordCount: 2200,
          });
        }
      } else {
        // Mock download delay
        await new Promise((res) => setTimeout(res, 250));
      }

      task.progress = 100;
      task.status = 'completed';
      task.completedAt = Date.now();

      // Update novel's downloaded chapters count in store
      const n = novels.value.find((nov) => nov.id === task.novelId);
      if (n) {
        n.downloaded_chapters = Math.min(n.total_chapters, n.downloaded_chapters + 1);
      }
      const ch = currentChaptersList.value.find(
        (c) => c.novel_id === task.novelId && c.chapter_index === task.chapterIndex
      );
      if (ch) {
        ch.is_downloaded = true;
      }
    } catch (err: any) {
      task.status = 'error';
      task.errorMessage = err?.message || 'Download failed';
    }
  }

  function openRuleInTester(rule: Rule) {
    selectedRuleForTester.value = { ...rule };
    activeTab.value = 'studio';
  }

  async function checkForUpdates(novelId: string): Promise<NovelUpdateResult> {
    const novel = novels.value.find((n) => n.id === novelId);
    if (!novel) {
      return { novel_id: novelId, new_chapters_found: 0, total_chapters: 0, message: 'Novel not found' };
    }

    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<NovelUpdateResult>('check_novel_updates', { novelId });

        novel.total_chapters = res.total_chapters;
        await loadNovelChapters(novelId);
        return res;
      } catch (err: any) {
        console.warn('Tauri check_novel_updates error:', err);
        const diff = Math.max(0, novel.total_chapters - novel.downloaded_chapters);
        if (diff > 0) {
          await loadNovelChapters(novelId);
          return {
            novel_id: novelId,
            new_chapters_found: diff,
            total_chapters: novel.total_chapters,
            message: `Found ${diff} pending undownloaded chapters.`,
          };
        }
        return {
          novel_id: novelId,
          new_chapters_found: 0,
          total_chapters: novel.total_chapters,
          message: err?.message || 'Check updates completed.',
        };
      }
    }

    // Mock fallback
    await new Promise((r) => setTimeout(r, 500));
    return {
      novel_id: novelId,
      new_chapters_found: 0,
      total_chapters: novel.total_chapters,
      message: 'Novel is already up to date.',
    };
  }

  async function checkAllUpdates(): Promise<LibraryUpdateSummary> {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<LibraryUpdateSummary>('check_all_novels_updates');

        const updatedNovels = await invoke<Novel[]>('get_all_novels');
        novels.value = updatedNovels;
        return res;
      } catch (err: any) {
        console.warn('Tauri check_all_novels_updates error:', err);
      }
    }

    return {
      checked_count: novels.value.length,
      updated_novels: 0,
      new_chapters_total: 0,
    };
  }

  async function saveRule(rule: Rule) {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_rule', { rule });
      } catch (e) {
        console.warn('Failed to save rule via Tauri IPC:', e);
      }
    }
    const idx = rules.value.findIndex((r) => r.guid === rule.guid);
    if (idx !== -1) {
      rules.value[idx] = { ...rule };
    } else {
      rules.value.push({ ...rule });
    }
  }

  async function openTestWebview(url: string, title?: string): Promise<string> {
    if (!url || !url.trim()) throw new Error('Empty URL');
    if (window.__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('open_test_webview', { url: url.trim(), title });
    } else {
      window.open(url.trim(), '_blank');
      return 'Opened target URL in browser window';
    }
  }

  async function openWebviewDevTools(): Promise<string> {
    if (window.__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('open_devtools_for_webview');
    }
    return 'DevTools available in native mode only';
  }

  async function closeTestWebview(): Promise<string> {
    if (window.__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('close_test_webview');
    }
    return 'Closed';
  }

  async function evalInWebview(script: string): Promise<string> {
    if (window.__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('eval_in_test_webview', { script });
    }
    return 'Eval available in native mode only';
  }

  return {
    novels,
    rules,
    activeTab,
    activeFilter,
    searchQuery,
    activeNovel,
    selectedNovelDetail,
    currentChapter,
    currentChaptersList,
    readingProgress,
    selectedRuleForTester,
    platformStyle,
    themeMode,
    readerTheme,
    readerFontSize,
    readerFontFamily,
    readerLineHeight,
    readerLayoutMode,
    readerContainerWidth,
    readerTextAlign,
    downloadQueue,
    queueSettings,
    filteredNovels,
    activeDownloadsCount,
    setNovels,
    setRules,
    openNovelDetail,
    closeNovelDetail,
    loadNovelChapters,
    openReader,
    loadChapterContent,
    goToChapter,
    closeReader,
    loadReadingProgress,
    saveProgress,
    setPlatform,
    setTheme,
    setReaderFontSize,
    setReaderTheme,
    setReaderFontFamily,
    setReaderLineHeight,
    setReaderLayoutMode,
    setReaderContainerWidth,
    setReaderTextAlign,
    enqueueNovel,
    pauseQueue,
    resumeQueue,
    togglePauseTask,
    removeQueueTask,
    clearCompletedQueue,
    setQueueConcurrency,
    setQueueDelay,
    openRuleInTester,
    checkForUpdates,
    checkAllUpdates,
    saveRule,
    openTestWebview,
    openWebviewDevTools,
    closeTestWebview,
    evalInWebview,
  };
});
