<template>
  <div
    class="relative flex-1 flex flex-col h-full overflow-hidden select-text transition-colors duration-200"
    :class="readerThemeClasses"
  >
    <!-- FLOATING READER HUD (Auto-Hides on Scroll or Center Tap) -->
    <header
      v-show="showHUD"
      class="absolute top-0 inset-x-0 h-14 bg-surface/90 backdrop-blur-xl border-b border-border/80 px-4 md:px-6 flex items-center justify-between z-30 transition-transform duration-200 select-none shadow-md"
      :class="platformHUDClass"
    >
      <!-- Back to Library & Chapter Drawer Toggle -->
      <div class="flex items-center gap-2">
        <button
          @click="store.closeReader()"
          class="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
          title="Exit to Library"
        >
          <ArrowLeft class="w-4 h-4" />
          <span class="hidden sm:inline">Library</span>
        </button>

        <button
          @click="showChapterDrawer = true"
          class="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
          title="Chapter Index"
        >
          <List class="w-4 h-4" />
          <span class="hidden sm:inline">Chapters</span>
        </button>
      </div>

      <!-- Novel & Active Chapter Title in Center -->
      <div class="text-center px-3 max-w-xs md:max-w-md truncate">
        <h4 class="text-xs font-semibold truncate text-text-primary">{{ store.activeNovel?.title }}</h4>
        <span class="text-[10px] text-accent font-mono truncate block">
          Ch. {{ activeVisibleChapter?.chapter_index || store.currentChapter?.chapter_index }}: {{ activeVisibleChapter?.title || store.currentChapter?.title }}
        </span>
      </div>

      <!-- HUD Actions: Mode, TTS, Settings Dropdown, Fullscreen -->
      <div class="flex items-center gap-1.5">
        <!-- TTS Toggle -->
        <button
          @click="toggleTTSBar"
          class="p-1.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs flex items-center gap-1"
          :class="{ 'bg-surface-elevated text-accent': showTTS }"
          title="Text-to-Speech (TTS)"
        >
          <Volume2 class="w-4 h-4 text-accent" />
          <span class="hidden md:inline text-[11px]">TTS</span>
        </button>

        <!-- Reading Mode Toggle (Continuous Vertical vs Paginated Drag) -->
        <button
          @click="toggleLayoutMode"
          class="p-1.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs flex items-center gap-1"
          :title="store.readerLayoutMode === 'vertical' ? 'Switch to Paginated Drag Mode' : 'Switch to Continuous Scroll Mode'"
        >
          <Columns v-if="store.readerLayoutMode === 'paginated'" class="w-4 h-4 text-accent" />
          <Scroll v-else class="w-4 h-4 text-accent" />
          <span class="hidden md:inline capitalize text-[11px] font-mono">{{ store.readerLayoutMode }}</span>
        </button>

        <!-- Appearance Settings -->
        <button
          @click="showSettings = !showSettings"
          class="p-1.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
          :class="{ 'bg-surface-elevated text-accent': showSettings }"
          title="Appearance"
        >
          <Settings2 class="w-4 h-4" />
        </button>

        <!-- Fullscreen -->
        <button
          @click="toggleFullscreen"
          class="p-1.5 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
          title="Fullscreen"
        >
          <Maximize v-if="!isFullscreen" class="w-4 h-4" />
          <Minimize v-else class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Typography & Appearance Settings Popover -->
    <div
      v-if="showSettings"
      class="absolute top-16 right-4 md:right-6 z-40 w-80 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 select-none"
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
            v-for="th in themeOptions"
            :key="th.id"
            @click="store.setReaderTheme(th.id)"
            :class="[
              'h-9 rounded-xl border flex items-center justify-center text-xs font-semibold transition-all shadow-xs',
              store.readerTheme === th.id
                ? 'ring-2 ring-accent border-transparent scale-105'
                : 'border-border/60 hover:scale-102'
            ]"
            :style="{ backgroundColor: th.bg, color: th.color }"
          >
            {{ th.label }}
          </button>
        </div>
      </div>

      <!-- Font Size Slider -->
      <div>
        <div class="flex items-center justify-between text-[11px] font-medium text-text-muted mb-1.5">
          <span>Font Size</span>
          <span class="font-mono text-accent">{{ store.readerFontSize }}px</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-text-muted font-bold">A</span>
          <input
            type="range"
            min="14"
            max="28"
            step="1"
            :value="store.readerFontSize"
            @input="handleFontSizeInput"
            class="flex-1 accent-accent h-1.5 bg-surface-elevated rounded-lg cursor-pointer"
          />
          <span class="text-base text-text-primary font-bold">A</span>
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

      <!-- Line Spacing & Width -->
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
            @click="jumpToChapter(ch.chapter_index)"
            :class="[
              'w-full text-left px-4 py-3 flex items-center justify-between text-xs transition-colors',
              ch.chapter_index === (activeVisibleChapter?.chapter_index || store.currentChapter?.chapter_index)
                ? 'bg-accent/15 text-accent font-bold'
                : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
            ]"
          >
            <span class="truncate pr-2">Ch. {{ ch.chapter_index }}: {{ ch.title }}</span>
            <span
              v-if="ch.chapter_index === (activeVisibleChapter?.chapter_index || store.currentChapter?.chapter_index)"
              class="w-2 h-2 rounded-full bg-accent shrink-0"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN READING CONTAINER -->

    <!-- MODE A: Continuous Seamless Infinite Scrolling -->
    <main
      v-if="store.readerLayoutMode === 'vertical'"
      ref="scrollContainer"
      @click="handleContentTap"
      @scroll="handleScroll"
      class="flex-1 overflow-y-auto px-6 md:px-12 py-20 mx-auto w-full transition-all scroll-smooth"
      :class="[containerWidthClass, textAlignClass]"
      :style="typographyStyle"
    >
      <!-- Sequentially rendered continuous chapters -->
      <div
        v-for="ch in loadedChapters"
        :key="ch.chapter_index"
        :id="`chapter-anchor-${ch.chapter_index}`"
        :data-chapter-index="ch.chapter_index"
        class="chapter-section mb-16"
      >
        <!-- Chapter Header Divider (Shown for subsequent chapters) -->
        <div class="my-14 py-8 flex flex-col items-center justify-center border-t border-b border-border/40 text-center select-none">
          <span class="text-[10px] font-mono tracking-widest text-accent uppercase font-bold mb-1">
            Chapter {{ ch.chapter_index }}
          </span>
          <h2 class="text-xl md:text-2xl font-bold font-sans tracking-tight text-text-primary">
            {{ ch.title }}
          </h2>
        </div>

        <!-- Chapter Paragraphs -->
        <div
          v-if="ch.content_html"
          class="chapter-content space-y-5"
        >
          <p
            v-for="(p, pIdx) in getParagraphsForChapter(ch)"
            :key="pIdx"
            :id="`tts-para-${ch.chapter_index}-${pIdx}`"
            :class="[
              'transition-all duration-300 rounded-xl leading-relaxed',
              showTTS && ttsChapterIndex === ch.chapter_index && ttsParagraphIndex === pIdx
                ? 'bg-accent/15 px-3 py-1 ring-1 ring-accent/40 font-medium'
                : ''
            ]"
            v-html="p"
          ></p>
        </div>

        <div v-else class="text-center py-12 text-text-muted text-sm font-sans">
          Loading chapter content...
        </div>
      </div>

      <!-- Loading Next Chapter Indicator -->
      <div v-if="isLoadingMoreNext" class="py-12 flex flex-col items-center justify-center gap-2 text-text-muted">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-mono">Loading next chapter seamlessly...</span>
      </div>

      <!-- End of Novel Notice -->
      <div
        v-else-if="!hasNextChapterToAppend"
        class="py-16 text-center border-t border-border/40 text-text-muted space-y-3"
      >
        <BookOpen class="w-8 h-8 text-accent mx-auto opacity-70" />
        <h3 class="text-sm font-bold text-text-primary">You've reached the end of downloaded chapters!</h3>
        <p class="text-xs max-w-sm mx-auto">Check the Downloader Queue or Site Rules to fetch new updates.</p>
      </div>
    </main>

    <!-- MODE B: Seamless Dragging & Horizontal Paginated Mode -->
    <main
      v-else
      class="flex-1 overflow-hidden px-6 md:px-16 py-16 mx-auto w-full flex flex-col justify-between relative touch-none select-none"
      :class="[containerWidthClass, textAlignClass]"
      :style="typographyStyle"
      @pointerdown="onDragStart"
      @pointermove="onDragMove"
      @pointerup="onDragEnd"
      @pointercancel="onDragEnd"
      @wheel.passive="onWheelPaging"
    >
      <!-- Click Edge Zones for Instant Page Turn -->
      <div
        class="absolute left-0 top-14 bottom-14 w-1/4 z-10 cursor-w-resize"
        @click.stop="prevPage"
        title="Tap or drag right for Previous Page"
      ></div>
      <div
        class="absolute right-0 top-14 bottom-14 w-1/4 z-10 cursor-e-resize"
        @click.stop="nextPage"
        title="Tap or drag left for Next Page"
      ></div>
      <div
        class="absolute inset-x-1/4 top-14 bottom-14 z-10"
        @click.stop="handleContentTap"
      ></div>

      <!-- Interactive Dragging Page Container -->
      <div
        class="flex-1 overflow-hidden flex flex-col justify-start transition-transform"
        :style="pageDragStyle"
      >
        <div class="text-center mb-6 shrink-0">
          <span class="text-[10px] font-mono text-accent uppercase tracking-widest block font-bold">
            Chapter {{ store.currentChapter?.chapter_index }}
          </span>
          <h2 class="text-base md:text-lg font-bold font-sans text-text-primary truncate">
            {{ store.currentChapter?.title }}
          </h2>
        </div>

        <!-- Paginated Content Chunk -->
        <div
          v-if="currentPaginatedChunk"
          class="chapter-content flex-1 space-y-5 overflow-hidden text-left"
          v-html="currentPaginatedChunk"
        ></div>
        <div v-else class="text-center py-20 text-text-muted text-sm">
          No content available on this page.
        </div>
      </div>

      <!-- Elegant Floating Bottom Status Pill -->
      <div class="h-10 flex items-center justify-between select-none font-sans text-xs text-text-muted px-2 shrink-0 border-t border-border/30 pt-2 z-20">
        <span class="font-mono text-[11px] truncate">
          {{ store.currentChapter?.title }}
        </span>

        <!-- Page Capsule -->
        <div class="flex items-center gap-2 bg-surface-elevated/70 backdrop-blur-md px-3 py-1 rounded-full border border-border/60 shadow-xs">
          <span class="font-mono font-medium text-text-primary text-[11px]">
            Page {{ currentPage }} / {{ totalPages }}
          </span>
          <span class="text-border">|</span>
          <span class="font-mono text-accent text-[11px] font-bold">
            {{ currentChapterPct }}%
          </span>
        </div>
      </div>
    </main>

    <!-- Floating Text-to-Speech (TTS) Control Bar -->
    <div
      v-if="showTTS"
      class="absolute bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-lg w-full bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3 z-30 flex items-center justify-between gap-3 text-xs select-none animate-in slide-in-from-bottom-4"
    >
      <div class="flex items-center gap-1.5">
        <button
          @click="toggleTTSPlayback"
          class="p-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
          :title="isTTSPlaying ? 'Pause' : 'Play'"
        >
          <Pause v-if="isTTSPlaying" class="w-4 h-4" />
          <Play v-else class="w-4 h-4 fill-white" />
        </button>

        <button
          @click="stopTTS"
          class="p-2 rounded-xl hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
          title="Stop"
        >
          <Square class="w-4 h-4" />
        </button>
      </div>

      <div class="text-center font-mono text-[11px] text-text-muted truncate">
        <span>Ch. {{ ttsChapterIndex }} · Para {{ ttsParagraphIndex + 1 }}</span>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="ttsRate"
          @change="updateTTSRate"
          class="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
        >
          <option :value="0.8">0.8x</option>
          <option :value="1.0">1.0x</option>
          <option :value="1.25">1.25x</option>
          <option :value="1.5">1.5x</option>
          <option :value="2.0">2.0x</option>
        </select>

        <button @click="showTTS = false; stopTTS()" class="text-text-muted hover:text-text-primary p-1">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
  AlignLeft,
  AlignJustify,
  Volume2,
  Play,
  Pause,
  Square,
  BookOpen,
} from 'lucide-vue-next';
import type {
  Chapter,
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

// Continuous Infinite Scrolling state
const loadedChapters = ref<Chapter[]>([]);
const activeVisibleChapter = ref<Chapter | null>(null);
const isLoadingMoreNext = ref(false);

// Paginated Drag & Swipe state
const currentPage = ref(1);
const pageSize = 1200;
const isDragging = ref(false);
const dragStartX = ref(0);
const dragDeltaX = ref(0);
const dragStartTime = ref(0);
let wheelDebounceTimer: any = null;

// TTS state
const showTTS = ref(false);
const isTTSPlaying = ref(false);
const ttsChapterIndex = ref(1);
const ttsParagraphIndex = ref(0);
const ttsRate = ref(1.0);

// Appearance options
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
const platformHUDClass = computed(() => {
  switch (store.platformStyle) {
    case 'windows':
      return 'bg-[#202020]/90 backdrop-blur-xl border-white/10';
    case 'apple':
      return 'bg-surface/70 backdrop-blur-2xl border-white/15';
    case 'android':
      return 'bg-[#1d1b20] border-white/5';
    case 'linux':
    default:
      return 'bg-[#242424] border-white/10';
  }
});

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

// Check if more chapters are available to append
const hasNextChapterToAppend = computed(() => {
  if (!store.currentChaptersList.length || !loadedChapters.value.length) return false;
  const lastLoaded = loadedChapters.value[loadedChapters.value.length - 1];
  return store.currentChaptersList.some((c) => c.chapter_index > lastLoaded.chapter_index);
});

// Helper to get paragraphs from a chapter
function getParagraphsForChapter(ch: Chapter): string[] {
  const content = ch.content_html || '';
  if (!content) return [];
  const pRegex = /<p>[\s\S]*?<\/p>/gi;
  const matches = content.match(pRegex);
  if (matches && matches.length > 0) {
    return matches.map((p) => p.replace(/^<p>/i, '').replace(/<\/p>$/i, '').trim());
  }
  return content.split('\n').filter((l) => l.trim().length > 0);
}

// ==========================================
// CONTINUOUS INFINITE SCROLLING LOGIC
// ==========================================

async function fetchChapterData(chapterIndex: number): Promise<Chapter | null> {
  if (!store.activeNovel) return null;
  const target = store.currentChaptersList.find((c) => c.chapter_index === chapterIndex);
  if (!target) return null;

  if (target.content_html) return target;

  if (window.__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const loaded = await invoke<Chapter | null>('get_chapter_content', {
        novelId: store.activeNovel.id,
        chapterIndex: target.chapter_index,
      });
      if (loaded && loaded.content_html) {
        target.content_html = loaded.content_html;
        return target;
      }
    } catch (e) {
      console.warn('Error fetching chapter content in reader:', e);
    }
  }

  // Fallback demo content if offline/mock
  target.content_html = `
    <p>The dawn broke over the horizon, casting crimson light upon the ancient towers.</p>
    <p>"We have reached the boundary of the forbidden district," a whispered warning came through the chill air.</p>
    <p>Runes etched along the masonry flared with sapphire intensity, answering the call of an ancient lineage long forgotten by modern chronicles.</p>
    <p>Every step was deliberate. When power demands sacrifice, destiny offers no compromises.</p>
  `;
  return target;
}

let scrollDebounceTimer: any = null;
async function handleScroll() {
  if (!scrollContainer.value || !store.activeNovel) return;
  const el = scrollContainer.value;

  // 1. Infinite Scroll: append next chapter when within 700px of bottom
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (distanceToBottom < 700 && !isLoadingMoreNext.value && hasNextChapterToAppend.value) {
    isLoadingMoreNext.value = true;
    const lastLoaded = loadedChapters.value[loadedChapters.value.length - 1];
    const nextChapter = await fetchChapterData(lastLoaded.chapter_index + 1);
    if (nextChapter) {
      loadedChapters.value.push(nextChapter);
    }
    isLoadingMoreNext.value = false;
  }

  // 2. Scroll Spy: Detect visible chapter
  clearTimeout(scrollDebounceTimer);
  scrollDebounceTimer = setTimeout(() => {
    updateVisibleChapterAndProgress();
  }, 200);
}

function updateVisibleChapterAndProgress() {
  if (!scrollContainer.value || !store.activeNovel) return;
  const container = scrollContainer.value;
  const midPoint = container.scrollTop + container.clientHeight / 3;

  for (const ch of loadedChapters.value) {
    const sectionEl = document.getElementById(`chapter-anchor-${ch.chapter_index}`);
    if (sectionEl) {
      const top = sectionEl.offsetTop;
      const bottom = top + sectionEl.offsetHeight;
      if (midPoint >= top && midPoint <= bottom) {
        activeVisibleChapter.value = ch;
        store.currentChapter = ch;
        ttsChapterIndex.value = ch.chapter_index;

        const maxScroll = container.scrollHeight - container.clientHeight;
        const pct = maxScroll > 0 ? (container.scrollTop / maxScroll) * 100 : 0;
        store.saveProgress(store.activeNovel.id, ch.chapter_index, pct);
        break;
      }
    }
  }
}

// ==========================================
// PAGINATED DRAG & HORIZONTAL SWIPE LOGIC
// ==========================================

const contentChunks = computed(() => {
  const content = store.currentChapter?.content_html || '';
  if (!content) return [];
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
const currentChapterPct = computed(() => {
  return Math.min(100, Math.round((currentPage.value / totalPages.value) * 100));
});

const pageDragStyle = computed(() => {
  if (isDragging.value) {
    return {
      transform: `translateX(${dragDeltaX.value * 0.85}px)`,
      transition: 'none',
    };
  }
  return {
    transform: 'translateX(0px)',
    transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
  };
});

function onDragStart(e: PointerEvent) {
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragDeltaX.value = 0;
  dragStartTime.value = Date.now();
}

function onDragMove(e: PointerEvent) {
  if (!isDragging.value) return;
  dragDeltaX.value = e.clientX - dragStartX.value;
}

function onDragEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  const duration = Math.max(1, Date.now() - dragStartTime.value);
  const velocity = dragDeltaX.value / duration;

  // Swipe left: Next page / Next chapter
  if (dragDeltaX.value < -60 || velocity < -0.4) {
    nextPage();
  }
  // Swipe right: Previous page / Previous chapter
  else if (dragDeltaX.value > 60 || velocity > 0.4) {
    prevPage();
  }

  dragDeltaX.value = 0;
}

function onWheelPaging(e: WheelEvent) {
  if (store.readerLayoutMode !== 'paginated') return;
  clearTimeout(wheelDebounceTimer);
  wheelDebounceTimer = setTimeout(() => {
    if (e.deltaY > 30 || e.deltaX > 30) {
      nextPage();
    } else if (e.deltaY < -30 || e.deltaX < -30) {
      prevPage();
    }
  }, 100);
}

async function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    savePaginatedProgress();
  } else {
    // Seamlessly transition into Page 1 of the NEXT chapter!
    const nextIdx = (store.currentChapter?.chapter_index || 1) + 1;
    const nextCh = await fetchChapterData(nextIdx);
    if (nextCh) {
      store.currentChapter = nextCh;
      activeVisibleChapter.value = nextCh;
      currentPage.value = 1;
      savePaginatedProgress();
    }
  }
}

async function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    savePaginatedProgress();
  } else {
    // Seamlessly transition into last page of PREVIOUS chapter!
    const prevIdx = (store.currentChapter?.chapter_index || 1) - 1;
    if (prevIdx >= 1) {
      const prevCh = await fetchChapterData(prevIdx);
      if (prevCh) {
        store.currentChapter = prevCh;
        activeVisibleChapter.value = prevCh;
        currentPage.value = totalPages.value;
        savePaginatedProgress();
      }
    }
  }
}

function savePaginatedProgress() {
  if (!store.activeNovel || !store.currentChapter) return;
  const percentage = (currentPage.value / totalPages.value) * 100;
  store.saveProgress(store.activeNovel.id, store.currentChapter.chapter_index, percentage);
}

// ==========================================
// COMMON ACTIONS & CONTROLS
// ==========================================

function handleFontSizeInput(e: Event) {
  const target = e.target as HTMLInputElement;
  store.setReaderFontSize(parseInt(target.value, 10));
}

function handleContentTap(e: MouseEvent) {
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

async function jumpToChapter(chapterIndex: number) {
  stopTTS();
  showChapterDrawer.value = false;
  const ch = await fetchChapterData(chapterIndex);
  if (ch) {
    store.currentChapter = ch;
    activeVisibleChapter.value = ch;
    loadedChapters.value = [ch];
    currentPage.value = 1;
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
    }
  }
}

// ==========================================
// TEXT TO SPEECH (TTS)
// ==========================================

function toggleTTSBar() {
  showTTS.value = !showTTS.value;
  if (showTTS.value && !isTTSPlaying.value) {
    startTTS();
  } else if (!showTTS.value) {
    stopTTS();
  }
}

function startTTS() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const currentParas = getParagraphsForChapter(store.currentChapter || loadedChapters.value[0]);
  if (ttsParagraphIndex.value >= currentParas.length) {
    ttsParagraphIndex.value = 0;
  }
  isTTSPlaying.value = true;
  speakCurrentParagraph();
}

function speakCurrentParagraph() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const targetCh = loadedChapters.value.find((c) => c.chapter_index === ttsChapterIndex.value) || store.currentChapter;
  if (!targetCh) return;
  const paras = getParagraphsForChapter(targetCh);

  if (ttsParagraphIndex.value >= paras.length) {
    // Move to next chapter in TTS if available
    const nextIdx = ttsChapterIndex.value + 1;
    const nextCh = loadedChapters.value.find((c) => c.chapter_index === nextIdx);
    if (nextCh) {
      ttsChapterIndex.value = nextIdx;
      ttsParagraphIndex.value = 0;
      speakCurrentParagraph();
      return;
    }
    isTTSPlaying.value = false;
    return;
  }

  const rawText = paras[ttsParagraphIndex.value].replace(/<[^>]+>/g, '').trim();
  if (!rawText) {
    ttsParagraphIndex.value++;
    speakCurrentParagraph();
    return;
  }

  const el = document.getElementById(`tts-para-${targetCh.chapter_index}-${ttsParagraphIndex.value}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const utterance = new SpeechSynthesisUtterance(rawText);
  utterance.rate = ttsRate.value;
  utterance.onend = () => {
    if (isTTSPlaying.value) {
      ttsParagraphIndex.value++;
      speakCurrentParagraph();
    }
  };
  utterance.onerror = () => {
    isTTSPlaying.value = false;
  };

  window.speechSynthesis.speak(utterance);
}

function toggleTTSPlayback() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (isTTSPlaying.value) {
    window.speechSynthesis.pause();
    isTTSPlaying.value = false;
  } else {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isTTSPlaying.value = true;
    } else {
      startTTS();
    }
  }
}

function stopTTS() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isTTSPlaying.value = false;
}

function updateTTSRate() {
  if (isTTSPlaying.value) {
    speakCurrentParagraph();
  }
}

// ==========================================
// LIFECYCLE & KEYBOARD
// ==========================================

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

watch(
  () => store.currentChapter,
  (newCh) => {
    if (newCh && !loadedChapters.value.some((c) => c.chapter_index === newCh.chapter_index)) {
      loadedChapters.value = [newCh];
      activeVisibleChapter.value = newCh;
      ttsChapterIndex.value = newCh.chapter_index;
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  if (store.currentChapter) {
    loadedChapters.value = [store.currentChapter];
    activeVisibleChapter.value = store.currentChapter;
    ttsChapterIndex.value = store.currentChapter.chapter_index;
  }
});

onUnmounted(() => {
  stopTTS();
  window.removeEventListener('keydown', handleKeydown);
  clearTimeout(scrollDebounceTimer);
  clearTimeout(wheelDebounceTimer);
});
</script>
