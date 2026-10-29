<template>
  <div
    v-if="store.selectedNovelDetail"
    class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
    @click.self="store.closeNovelDetail()"
  >
    <!-- Modal Container: Sheet on mobile, Centered Multi-Column Dialog on desktop -->
    <div
      class="bg-surface border border-border w-full md:max-w-4xl max-h-[90vh] md:max-h-[85vh] h-[85vh] md:h-auto rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Mobile Drag Handle indicator -->
      <div class="md:hidden flex justify-center pt-3 pb-1">
        <div class="w-12 h-1.5 rounded-full bg-border"></div>
      </div>

      <!-- Header with Close Button -->
      <div class="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-accent" />
          <h2 class="text-sm font-semibold text-text-primary">Novel Details</h2>
        </div>
        <button
          @click="store.closeNovelDetail()"
          class="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body: Multi-column Desktop layout -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Left Column: Cover & Quick Stats (md:col-span-4) -->
        <div class="md:col-span-4 flex flex-col items-center md:items-start space-y-4">
          <div class="relative w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-surface-elevated shadow-md border border-border">
            <img
              v-if="!coverFailed && (novel.cover_local_path || novel.cover_url)"
              :src="getCoverUrl()"
              :alt="novel.title"
              @error="coverFailed = true"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-text-muted bg-gradient-to-br from-surface to-surface-elevated">
              <BookOpen class="w-10 h-10 text-accent/50 mb-2" />
              <span class="font-medium text-text-primary line-clamp-3">{{ novel.title }}</span>
            </div>
          </div>

          <div class="w-full space-y-2">
            <button
              @click="handleStartReading"
              class="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Play class="w-4 h-4 fill-white" />
              <span>{{ continueReadingLabel }}</span>
            </button>

            <button
              @click="handleEnqueueDownload"
              class="w-full py-2.5 px-4 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-text-primary font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <DownloadCloud class="w-4 h-4 text-accent" />
              <span>Download Missing Chapters</span>
            </button>

            <button
              @click="handleExportEpub"
              class="w-full py-2.5 px-4 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-text-primary font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <BookDown class="w-4 h-4 text-emerald-500" />
              <span>{{ epubExporting ? 'Exporting EPUB...' : 'Export as EPUB' }}</span>
            </button>
            <p v-if="epubMessage" class="text-[10px] text-center text-emerald-500 font-medium">
              {{ epubMessage }}
            </p>
          </div>

          <!-- Metadata List -->
          <div class="w-full bg-surface-elevated/60 border border-border/80 rounded-2xl p-4 space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-border/40">
              <span class="text-text-muted">Total Chapters</span>
              <span class="font-medium text-text-primary">{{ novel.total_chapters }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/40">
              <span class="text-text-muted">Downloaded</span>
              <span class="font-medium text-accent">{{ novel.downloaded_chapters }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-border/40">
              <span class="text-text-muted">Auto Updates</span>
              <span class="font-medium" :class="novel.check_updates ? 'text-emerald-500' : 'text-text-muted'">
                {{ novel.check_updates ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
            <div v-if="savedProgress" class="flex justify-between py-1">
              <span class="text-text-muted">Last Read</span>
              <span class="font-medium text-text-primary">
                Ch. {{ savedProgress.last_chapter_index }} ({{ Math.round(savedProgress.scroll_percentage) }}%)
              </span>
            </div>
          </div>
        </div>

        <!-- Right Column: Title, Summary, Chapters List (md:col-span-8) -->
        <div class="md:col-span-8 flex flex-col space-y-5">
          <div>
            <h1 class="text-lg md:text-xl font-bold text-text-primary mb-1">{{ novel.title }}</h1>
            <p class="text-xs text-text-muted flex items-center gap-2">
              <span>Author: <strong class="text-text-secondary">{{ novel.author || 'Unknown' }}</strong></span>
              <span>•</span>
              <a
                v-if="novel.source_url"
                :href="novel.source_url"
                target="_blank"
                class="text-accent hover:underline flex items-center gap-1"
              >
                <span>Source</span>
                <ExternalLink class="w-3 h-3" />
              </a>
            </p>
          </div>

          <!-- Summary Box -->
          <div class="bg-surface-elevated/40 border border-border/60 rounded-2xl p-4 text-xs leading-relaxed text-text-secondary max-h-36 overflow-y-auto">
            <h4 class="text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1">Synopsis</h4>
            <p class="whitespace-pre-line">{{ novel.summary || 'No synopsis available for this title.' }}</p>
          </div>

          <!-- Chapter List Section -->
          <div class="flex-1 flex flex-col min-h-0">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <ListFilter class="w-4 h-4 text-accent" />
                <h3 class="text-xs font-semibold text-text-primary">Chapter Index</h3>
                <span class="text-[11px] text-text-muted">({{ store.currentChaptersList.length }} loaded)</span>
              </div>
              <div class="relative w-48">
                <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  v-model="chapterSearch"
                  type="text"
                  placeholder="Filter chapters..."
                  class="w-full pl-8 pr-3 py-1 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <!-- Chapters Scroll Area -->
            <div class="flex-1 overflow-y-auto border border-border/80 rounded-2xl bg-surface-elevated/30 divide-y divide-border/40 max-h-64">
              <div
                v-for="ch in filteredChapters"
                :key="ch.id"
                @click="openChapter(ch)"
                class="px-4 py-2.5 flex items-center justify-between hover:bg-surface-elevated cursor-pointer transition-colors group"
              >
                <div class="flex items-center gap-3 truncate">
                  <span class="text-xs font-mono text-text-muted w-8">#{{ ch.chapter_index }}</span>
                  <span class="text-xs text-text-secondary group-hover:text-text-primary truncate">
                    {{ ch.title }}
                  </span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] text-text-muted">{{ ch.word_count }} words</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    :class="ch.is_downloaded ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'"
                  >
                    {{ ch.is_downloaded ? 'Ready' : 'Online' }}
                  </span>
                </div>
              </div>

              <div v-if="filteredChapters.length === 0" class="p-8 text-center text-xs text-text-muted">
                No matching chapters found.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLibraryStore } from '../stores/library';
import {
  X,
  BookOpen,
  Play,
  DownloadCloud,
  ExternalLink,
  ListFilter,
  Search,
  BookDown,
} from 'lucide-vue-next';
import type { Chapter } from '../types';

const store = useLibraryStore();
const chapterSearch = ref('');
const epubExporting = ref(false);
const epubMessage = ref('');
const coverFailed = ref(false);

const novel = computed(() => store.selectedNovelDetail!);

function getCoverUrl(): string {
  if (!novel.value) return '';
  const raw = novel.value.cover_local_path || novel.value.cover_url || '';
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  let clean = raw.replace(/\\/g, '/').replace(/^\.?\/?(data\/)?/, '');
  if (!clean.startsWith('covers/')) {
    clean = 'covers/' + clean;
  }
  return '/' + clean;
}

const savedProgress = computed(() => {
  return novel.value ? store.readingProgress[novel.value.id] : null;
});

const continueReadingLabel = computed(() => {
  if (savedProgress.value && savedProgress.value.last_chapter_index > 0) {
    return `Continue (Ch. ${savedProgress.value.last_chapter_index})`;
  }
  return 'Start Reading';
});

const filteredChapters = computed(() => {
  if (!chapterSearch.value.trim()) {
    return store.currentChaptersList;
  }
  const q = chapterSearch.value.toLowerCase();
  return store.currentChaptersList.filter(
    (c) => c.title.toLowerCase().includes(q) || c.chapter_index.toString().includes(q)
  );
});

function handleStartReading() {
  if (!novel.value) return;
  const targetIndex = savedProgress.value?.last_chapter_index || 1;
  const targetChapter = store.currentChaptersList.find((c) => c.chapter_index === targetIndex);
  store.openReader(novel.value, targetChapter);
}

function openChapter(ch: Chapter) {
  if (!novel.value) return;
  store.openReader(novel.value, ch);
}

function handleEnqueueDownload() {
  if (!novel.value) return;
  store.enqueueNovel(novel.value, store.currentChaptersList);
}

async function handleExportEpub() {
  if (!novel.value) return;
  epubExporting.value = true;
  epubMessage.value = '';

  try {
    if (window.__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('export_novel_epub', { novelId: novel.value.id });
      epubMessage.value = 'EPUB exported to Downloads folder!';
    } else {
      await new Promise((res) => setTimeout(res, 600));
      epubMessage.value = `Exported "${novel.value.title}.epub" successfully!`;
    }
  } catch (err: any) {
    epubMessage.value = `Export failed: ${err?.message || 'Error'}`;
  } finally {
    epubExporting.value = false;
    setTimeout(() => {
      epubMessage.value = '';
    }, 4000);
  }
}
</script>

