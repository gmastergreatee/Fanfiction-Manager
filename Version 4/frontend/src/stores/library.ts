import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Novel, Chapter, Rule, ReadingProgress, PlatformStyle, ThemeMode, ReaderTheme } from '../types';

export const useLibraryStore = defineStore('library', () => {
  const novels = ref<Novel[]>([]);
  const rules = ref<Rule[]>([]);
  const activeTab = ref<'library' | 'rules' | 'queue' | 'studio' | 'reader'>('library');
  const activeFilter = ref<'all' | 'downloaded' | 'updating'>('all');
  const searchQuery = ref('');
  const activeNovel = ref<Novel | null>(null);
  const currentChapter = ref<Chapter | null>(null);
  const currentChaptersList = ref<Chapter[]>([]);
  const readingProgress = ref<Record<string, ReadingProgress>>({});
  
  // Theme & Platform state
  const platformStyle = ref<PlatformStyle>('windows');
  const themeMode = ref<ThemeMode>('dark');
  const readerTheme = ref<ReaderTheme>('dark');
  const readerFontSize = ref<number>(18);

  // Filtered novels computation
  const filteredNovels = computed(() => {
    return novels.value.filter((n) => {
      const matchesSearch =
        searchQuery.value === '' ||
        n.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.value.toLowerCase());

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

  // Action methods
  function setNovels(list: Novel[]) {
    novels.value = list;
  }

  function setRules(list: Rule[]) {
    rules.value = list;
  }

  function openNovel(novel: Novel) {
    activeNovel.value = novel;
  }

  function openReader(novel: Novel, chapter: Chapter) {
    activeNovel.value = novel;
    currentChapter.value = chapter;
    activeTab.value = 'reader';
  }

  function closeReader() {
    activeTab.value = 'library';
  }

  function setPlatform(style: PlatformStyle) {
    platformStyle.value = style;
    document.documentElement.setAttribute('data-platform', style);
  }

  function setTheme(mode: ThemeMode) {
    themeMode.value = mode;
    document.documentElement.setAttribute('data-theme-mode', mode);
  }

  function setReaderFontSize(size: number) {
    readerFontSize.value = Math.max(12, Math.min(32, size));
  }

  function setReaderTheme(theme: ReaderTheme) {
    readerTheme.value = theme;
  }

  return {
    novels,
    rules,
    activeTab,
    activeFilter,
    searchQuery,
    activeNovel,
    currentChapter,
    currentChaptersList,
    readingProgress,
    platformStyle,
    themeMode,
    readerTheme,
    readerFontSize,
    filteredNovels,
    setNovels,
    setRules,
    openNovel,
    openReader,
    closeReader,
    setPlatform,
    setTheme,
    setReaderFontSize,
    setReaderTheme,
  };
});

