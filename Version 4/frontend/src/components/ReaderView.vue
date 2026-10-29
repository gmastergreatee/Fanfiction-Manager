<template>
  <div
    class="relative flex-1 flex flex-col h-full overflow-hidden select-text transition-colors duration-200"
    :class="readerThemeClasses"
  >
    <!-- Floating Reader HUD (Auto-Hides on Scroll or User Click) -->
    <header
      v-show="showHUD"
      class="absolute top-0 inset-x-0 h-14 bg-surface/90 backdrop-blur-md border-b border-border px-4 md:px-6 flex items-center justify-between z-30 transition-transform duration-200 select-none shadow-sm"
    >
      <!-- Back to Library & Chapter Drawer Toggle -->
      <div class="flex items-center gap-2">
        <button
          @click="store.closeReader()"
          class="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          title="Exit to Library"
        >
          <ArrowLeft class="w-4 h-4" />
          <span class="hidden sm:inline">Library</span>
        </button>

        <button
          @click="showChapterDrawer = true"
          class="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          title="Chapter Index"
        >
          <List class="w-4 h-4" />
          <span class="hidden sm:inline">Chapters</span>
        </button>
      </div>

      <!-- Novel & Chapter Title in Center -->
      <div class="text-center px-2 max-w-xs md:max-w-md truncate">
        <h4 class="text-xs font-semibold truncate text-text-primary">{{ store.activeNovel?.title }}</h4>
        <span class="text-[10px] text-text-muted truncate">{{ store.currentChapter?.title }}</span>
      </div>

      <!-- HUD Actions: Mode, Settings Dropdown, Fullscreen -->
      <div class="flex items-center gap-2">
        <!-- Reading Layout Toggle (Vertical vs Paginated) -->
        <button
          @click="toggleLayoutMode"
          class="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs flex items-center gap-1"
          :title="store.readerLayoutMode === 'vertical' ? 'Switch to Paginated Mode' : 'Switch to Vertical Mode'"
        >
          <Columns v-if="store.readerLayoutMode === 'paginated'" class="w-4 h-4 text-accent" />
          <Scroll v-else class="w-4 h-4 text-accent" />
          <span class="hidden md:inline capitalize text-[11px]">{{ store.readerLayoutMode }}</span>
        </button>

        <!-- Typography Settings Modal Toggle -->
        <button
          @click="showSettings = !showSettings"
          class="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
          :class="{ 'bg-surface-elevated text-accent': showSettings }"
          title="Reader Typography & Themes"
        >
          <Settings2 class="w-4 h-4" />
        </button>

        <!-- Fullscreen Toggle -->
        <button
          @click="toggleFullscreen"
          class="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
          title="Toggle Fullscreen"
        >
          <Maximize v-if="!isFullscreen" class="w-4 h-4" />
          <Minimize v-else class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Typography & Appearance Settings Popover -->
    <div
      v-if="showSettings"
      class="absolute top-16 right-4 md:right-6 z-40 w-80 bg-surface border border-border rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 select-none"
    >
      <div class="flex items-center justify-between pb-2 border-b border-border">
        <span class="text-xs font-semibold text-text-primary">Reader Appearance</span>
        <button @click="showSettings = false" class="text-text-muted hover:text-text-primary">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Theme Selectors -->
      <div>
        <label class="text-[11px] font-medium text-text-muted mb-2 block">Theme</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="t in themeOptions"
            :key="t.id"
            @click="store.setReaderTheme(t.id)"
            :class="[
              'py-1.5 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all',
              store.readerTheme === t.id
                ? 'border-accent ring-1 ring-accent'
                : 'border-border hover:border-accent/40'
            ]"
            :style="{ backgroundColor: t.bg, color: t.color }"
          >
            <span class="w-3 h-3 rounded-full border border-black/20" :style="{ backgroundColor: t.bg }"></span>
            <span class="text-[10px]">{{ t.label }}</span>
          </button>
        </div>
      </div>

      <!-- Font Size Stepper -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-medium text-text-muted">Font Size</span>
          <span class="text-xs font-semibold text-text-primary">{{ store.readerFontSize }}px</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="store.setReaderFontSize(store.readerFontSize - 1)"
            class="flex-1 py-1 bg-surface-elevated rounded-lg hover:bg-border text-xs font-semibold flex items-center justify-center text-text-primary"
          >
            A-
          </button>
          <input
            type="range"
            min="12"
            max="36"
            :value="store.readerFontSize"
            @input="(e: any) => store.setReaderFontSize(parseInt(e.target.value))"
            class="flex-1 accent-accent"
          />
          <button
            @click="store.setReaderFontSize(store.readerFontSize + 1)"
            class="flex-1 py-1 bg-surface-elevated rounded-lg hover:bg-border text-xs font-semibold flex items-center justify-center text-text-primary"
          >
            A+
          </button>
        </div>
      </div>

      <!-- Font Family -->
      <div>
        <label class="text-[11px] font-medium text-text-muted mb-1.5 block">Font Family</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="font in fontFamilies"
            :key="font.id"
            @click="store.setReaderFontFamily(font.id)"
            :class="[
              'py-1.5 px-2 rounded-xl text-xs text-center border transition-colors',
              store.readerFontFamily === font.id
                ? 'bg-accent/15 border-accent text-accent font-semibold'
                : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            ]"
            :style="{ fontFamily: font.css }"
          >
            {{ font.label }}
          </button>
        </div>
      </div>

      <!-- Line Height & Margins -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[11px] font-medium text-text-muted mb-1 block">Line Spacing</label>
          <div class="flex rounded-lg border border-border p-0.5 bg-surface-elevated">
            <button
              v-for="lh in lineHeightOptions"
              :key="lh.id"
              @click="store.setReaderLineHeight(lh.id)"
              class="flex-1 py-1 text-[10px] rounded font-medium transition-colors text-center"
              :class="store.readerLineHeight === lh.id ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'"
            >
              {{ lh.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="text-[11px] font-medium text-text-muted mb-1 block">Width</label>
          <div class="flex rounded-lg border border-border p-0.5 bg-surface-elevated">
            <button
              v-for="w in widthOptions"
              :key="w.id"
              @click="store.setReaderContainerWidth(w.id)"
              class="flex-1 py-1 text-[10px] rounded font-medium transition-colors text-center"
              :class="store.readerContainerWidth === w.id ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'"
            >
              {{ w.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Text Alignment -->
      <div>
        <label class="text-[11px] font-medium text-text-muted mb-1 block">Text Alignment</label>
        <div class="flex gap-2">
          <button
            @click="store.setReaderTextAlign('left')"
            class="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1.5"
            :class="store.readerTextAlign === 'left' ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-border text-text-secondary'"
          >
            <AlignLeft class="w-3.5 h-3.5" />
            <span>Left</span>
          </button>
          <button
            @click="store.setReaderTextAlign('justify')"
            class="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1.5"
            :class="store.readerTextAlign === 'justify' ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-border text-text-secondary'"
          >
            <AlignJustify class="w-3.5 h-3.5" />
            <span>Justify</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Chapter List Slide-Over Drawer -->
    <div
      v-if="showChapterDrawer"
      class="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs select-none"
      @click.self="showChapterDrawer = false"
    >
      <div class="w-80 max-w-[85vw] bg-surface border-r border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <h3 class="text-xs font-semibold text-text-primary">Chapter Index</h3>
          <button @click="showChapterDrawer = false" class="p-1 rounded-lg text-text-muted hover:text-text-primary">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto divide-y divide-border/40">
          <button
            v-for="ch in store.currentChaptersList"
            :key="ch.id"
            @click="selectChapterFromDrawer(ch.chapter_index)"
            :class="[
              'w-full text-left px-4 py-3 flex items-center justify-between text-xs transition-colors',
              ch.chapter_index === store.currentChapter?.chapter_index
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
            ]"
          >
            <span class="truncate pr-2">Ch. {{ ch.chapter_index }}: {{ ch.title }}</span>
            <span v-if="ch.chapter_index === store.currentChapter?.chapter_index" class="w-2 h-2 rounded-full bg-accent shrink-0"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN READING CONTAINER -->

    <!-- MODE A: Continuous Vertical Reading -->
    <main
      v-if="store.readerLayoutMode === 'vertical'"
      ref="scrollContainer"
      @click="handleContentTap"
      @scroll="handleScroll"
      class="flex-1 overflow-y-auto px-6 md:px-12 py-20 mx-auto w-full transition-all"
      :class="[containerWidthClass, textAlignClass]"
      :style="typographyStyle"
    >
      <h1 class="text-xl md:text-2xl font-bold mb-8 text-center font-sans tracking-tight">
        {{ store.currentChapter?.title || 'Chapter Title' }}
      </h1>

      <div
        v-if="store.currentChapter?.content_html"
        class="chapter-content space-y-5"
        v-html="store.currentChapter.content_html"
      ></div>

      <div v-else class="text-center py-20 text-text-muted text-sm font-sans">
        No chapter content loaded. Please select a downloaded chapter.
      </div>

      <!-- Bottom Next / Prev Navigation -->
      <nav class="flex items-center justify-between pt-12 pb-16 border-t border-border/40 mt-16 font-sans select-none">
        <button
          @click="navigateChapter(-1)"
          :disabled="!hasPrevChapter"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-border text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Previous Chapter</span>
        </button>

        <span class="text-xs text-text-muted font-mono">
          Chapter {{ store.currentChapter?.chapter_index || 1 }}
        </span>

        <button
          @click="navigateChapter(1)"
          :disabled="!hasNextChapter"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-border text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <span>Next Chapter</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </nav>
    </main>

    <!-- MODE B: Paginated Reader Mode -->
    <main
      v-else
      @click="handleContentTap"
      class="flex-1 overflow-hidden px-6 md:px-16 py-18 mx-auto w-full flex flex-col justify-between"
      :class="[containerWidthClass, textAlignClass]"
      :style="typographyStyle"
    >
      <div class="flex-1 overflow-hidden flex flex-col">
        <h2 class="text-base md:text-lg font-bold mb-4 text-center font-sans">
          {{ store.currentChapter?.title }}
        </h2>

        <!-- Paginated Content Chunk -->
        <div
          v-if="currentPaginatedChunk"
          class="chapter-content flex-1 space-y-4 overflow-hidden"
          v-html="currentPaginatedChunk"
        ></div>
        <div v-else class="text-center py-20 text-text-muted text-sm">
          No content available on this page.
        </div>
      </div>

      <!-- Bottom Pagination Bar -->
      <div class="h-14 border-t border-border/40 flex items-center justify-between pt-2 select-none font-sans">
        <button
          @click.stop="prevPage"
          :disabled="currentPage === 1 && !hasPrevChapter"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>{{ currentPage === 1 ? 'Prev Chapter' : 'Prev Page' }}</span>
        </button>

        <span class="text-xs text-text-muted font-mono">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          @click.stop="nextPage"
          :disabled="currentPage === totalPages && !hasNextChapter"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          <span>{{ currentPage === totalPages ? 'Next Chapter' : 'Next Page' }}</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLibraryStore } from '../stores/library';
import {
  ArrowLeft,
  List,
  Columns,
  Scroll,
  Settings2,
  Maximize,
  Minimize,
  X,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignJustify,
} from 'lucide-vue-next';
import type {
  ReaderTheme,
  ReaderFontFamily,
  ReaderLineHeight,
  ReaderContainerWidth,
} from '../types';

const store = useLibraryStore();

const showHUD = ref(true);
const showSettings = ref(false);
const showChapterDrawer = ref(false);
const isFullscreen = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

// Pagination state
const currentPage = ref(1);
const pageSize = 1200; // Characters per paginated page chunk

// Themes
const themeOptions: { id: ReaderTheme; label: string; bg: string; color: string }[] = [
  { id: 'dark', label: 'Slate', bg: '#18181b', color: '#e2e8f0' },
  { id: 'oled', label: 'OLED', bg: '#000000', color: '#e5e5e5' },
  { id: 'sepia', label: 'Sepia', bg: '#fbf0d9', color: '#5f4b32' },
  { id: 'light', label: 'Light', bg: '#ffffff', color: '#1e293b' },
];

const fontFamilies: { id: ReaderFontFamily; label: string; css: string }[] = [
  { id: 'serif', label: 'Merriweather', css: '"Merriweather", Georgia, serif' },
  { id: 'sans', label: 'Modern Sans', css: 'Inter, system-ui, sans-serif' },
  { id: 'mono', label: 'JetBrains Mono', css: '"JetBrains Mono", monospace' },
  { id: 'dyslexic', label: 'OpenDyslexic', css: '"OpenDyslexic", Comic Sans MS, sans-serif' },
];

const lineHeightOptions: { id: ReaderLineHeight; label: string }[] = [
  { id: 'compact', label: '1.3' },
  { id: 'normal', label: '1.6' },
  { id: 'relaxed', label: '1.9' },
  { id: 'loose', label: '2.2' },
];

const widthOptions: { id: ReaderContainerWidth; label: string }[] = [
  { id: 'narrow', label: '640' },
  { id: 'medium', label: '768' },
  { id: 'wide', label: '1024' },
  { id: 'full', label: '100%' },
];

// Computed styles
const readerThemeClasses = computed(() => {
  switch (store.readerTheme) {
    case 'oled':
      return 'bg-black text-[#e5e5e5]';
    case 'sepia':
      return 'bg-[#fbf0d9] text-[#5f4b32]';
    case 'light':
      return 'bg-white text-[#1e293b]';
    case 'dark':
    default:
      return 'bg-[#18181b] text-[#e2e8f0]';
  }
});

const containerWidthClass = computed(() => {
  switch (store.readerContainerWidth) {
    case 'narrow':
      return 'max-w-xl';
    case 'wide':
      return 'max-w-5xl';
    case 'full':
      return 'max-w-none';
    case 'medium':
    default:
      return 'max-w-3xl';
  }
});

const textAlignClass = computed(() => {
  return store.readerTextAlign === 'justify' ? 'text-justify' : 'text-left';
});

const typographyStyle = computed(() => {
  let lh = '1.6';
  if (store.readerLineHeight === 'compact') lh = '1.3';
  if (store.readerLineHeight === 'relaxed') lh = '1.9';
  if (store.readerLineHeight === 'loose') lh = '2.2';

  let fam = '"Merriweather", Georgia, serif';
  if (store.readerFontFamily === 'sans') fam = 'Inter, system-ui, sans-serif';
  if (store.readerFontFamily === 'mono') fam = '"JetBrains Mono", monospace';
  if (store.readerFontFamily === 'dyslexic') fam = '"OpenDyslexic", Comic Sans MS, sans-serif';

  return {
    fontSize: `${store.readerFontSize}px`,
    lineHeight: lh,
    fontFamily: fam,
  };
});

// Pagination computed
const contentChunks = computed(() => {
  const content = store.currentChapter?.content_html || '';
  if (!content) return [];
  // Split by paragraph tags or length
  const pRegex = /<p>[\s\S]*?<\/p>/gi;
  const matches = content.match(pRegex);
  if (!matches || matches.length === 0) {
    return [content];
  }

  const pages: string[] = [];
  let currentChunk = '';
  for (const p of matches) {
    if (currentChunk.length + p.length > pageSize && currentChunk.length > 0) {
      pages.push(currentChunk);
      currentChunk = p;
    } else {
      currentChunk += p;
    }
  }
  if (currentChunk) pages.push(currentChunk);
  return pages;
});

const totalPages = computed(() => Math.max(1, contentChunks.value.length));
const currentPaginatedChunk = computed(() => contentChunks.value[currentPage.value - 1] || '');

// Navigation computed
const currentIdx = computed(() => store.currentChapter?.chapter_index || 1);
const hasPrevChapter = computed(() => {
  return store.currentChaptersList.some((c) => c.chapter_index < currentIdx.value);
});
const hasNextChapter = computed(() => {
  return store.currentChaptersList.some((c) => c.chapter_index > currentIdx.value);
});

// HUD & Content tap
function handleContentTap(e: MouseEvent) {
  // If clicked on an interactive link, don't toggle HUD
  if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).tagName === 'BUTTON') {
    return;
  }
  showHUD.value = !showHUD.value;
  if (!showHUD.value) {
    showSettings.value = false;
  }
}

function toggleLayoutMode() {
  const nextMode = store.readerLayoutMode === 'vertical' ? 'paginated' : 'vertical';
  store.setReaderLayoutMode(nextMode);
  currentPage.value = 1;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    isFullscreen.value = true;
  } else {
    document.exitFullscreen().catch(() => {});
    isFullscreen.value = false;
  }
}

// Chapter navigation
function navigateChapter(delta: number) {
  const targetIndex = currentIdx.value + delta;
  store.goToChapter(targetIndex);
  currentPage.value = 1;
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
}

function selectChapterFromDrawer(chapterIndex: number) {
  store.goToChapter(chapterIndex);
  showChapterDrawer.value = false;
  currentPage.value = 1;
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    savePaginatedProgress();
  } else if (hasNextChapter.value) {
    navigateChapter(1);
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    savePaginatedProgress();
  } else if (hasPrevChapter.value) {
    navigateChapter(-1);
  }
}

// Progress Auto-Saving
let scrollDebounceTimer: any = null;
function handleScroll() {
  if (!scrollContainer.value || !store.activeNovel || !store.currentChapter) return;
  const el = scrollContainer.value;
  const maxScroll = el.scrollHeight - el.clientHeight;
  const percentage = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0;

  clearTimeout(scrollDebounceTimer);
  scrollDebounceTimer = setTimeout(() => {
    store.saveProgress(store.activeNovel!.id, store.currentChapter!.chapter_index, percentage);
  }, 300);
}

function savePaginatedProgress() {
  if (!store.activeNovel || !store.currentChapter) return;
  const percentage = (currentPage.value / totalPages.value) * 100;
  store.saveProgress(store.activeNovel.id, store.currentChapter.chapter_index, percentage);
}

// Keyboard navigation (Left / Right arrow for paginated mode)
function handleKeydown(e: KeyboardEvent) {
  if (store.readerLayoutMode === 'paginated') {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prevPage();
    }
  }
  if (e.key === 'Escape') {
    if (showSettings.value) showSettings.value = false;
    else if (showChapterDrawer.value) showChapterDrawer.value = false;
    else showHUD.value = !showHUD.value;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  // Restore scroll position if saved
  if (store.activeNovel && scrollContainer.value) {
    const saved = store.readingProgress[store.activeNovel.id];
    if (saved && saved.last_chapter_index === currentIdx.value && saved.scroll_percentage > 0) {
      setTimeout(() => {
        if (scrollContainer.value) {
          const maxScroll = scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight;
          scrollContainer.value.scrollTop = (saved.scroll_percentage / 100) * maxScroll;
        }
      }, 100);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  clearTimeout(scrollDebounceTimer);
});
</script>
