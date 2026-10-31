<template>
  <div
    v-if="store.selectedNovelDetail"
    class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
    @click.self="store.closeNovelDetail()"
  >
    <!-- Modal Container: Sheet on mobile, Centered Multi-Column Dialog on desktop -->
    <div
      :class="[
        'w-full md:max-w-4xl max-h-[90vh] md:max-h-[85vh] h-[85vh] md:h-auto flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all',
        modalContainerClass
      ]"
    >
      <!-- Mobile Drag Handle indicator -->
      <div class="md:hidden flex justify-center pt-3 pb-1">
        <div class="w-12 h-1.5 rounded-full bg-white/20"></div>
      </div>

      <!-- Header with Close Button -->
      <div :class="['px-6 py-4 flex items-center justify-between shrink-0', modalHeaderClass]">
        <div class="flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-accent" />
          <h2 :class="modalTitleClass">Novel Details</h2>
        </div>
        <button
          @click="store.closeNovelDetail()"
          :class="modalCloseBtnClass"
          title="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body: Multi-column Desktop layout -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Left Column: Cover & Quick Stats (md:col-span-4) -->
        <div class="md:col-span-4 flex flex-col items-center md:items-start space-y-4">
          <div
            :class="[
              'relative w-44 aspect-[2/3] overflow-hidden shadow-md',
              store.platformStyle === 'windows' ? 'rounded-md' : store.platformStyle === 'android' ? 'rounded-3xl' : 'rounded-2xl',
              modalCardClass
            ]"
          >
            <img
              v-if="!coverFailed && (novel.cover_local_path || novel.cover_url)"
              :src="getCoverUrl()"
              :alt="novel.title"
              @error="coverFailed = true"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-text-muted bg-gradient-to-br from-surface to-surface-elevated"
            >
              <BookOpen class="w-10 h-10 text-accent/50 mb-2" />
              <span class="font-medium text-text-primary line-clamp-3">{{ novel.title }}</span>
            </div>
          </div>

          <div class="w-full space-y-2">
            <button
              @click="handleStartReading"
              :class="['w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-sm transition-all', modalPrimaryBtnClass]"
            >
              <Play class="w-4 h-4 fill-white" />
              <span>{{ continueReadingLabel }}</span>
            </button>

            <button
              @click="handleCheckUpdatesForNovel"
              :disabled="checkingUpdates"
              :class="['w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 transition-all', modalSecondaryBtnClass]"
            >
              <RefreshCw class="w-4 h-4 text-accent" :class="{ 'animate-spin': checkingUpdates }" />
              <span>{{ checkingUpdates ? 'Checking for Updates...' : 'Check for Updates' }}</span>
            </button>

            <button
              @click="handleEnqueueDownload"
              :class="['w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 transition-all', modalSecondaryBtnClass]"
            >
              <DownloadCloud class="w-4 h-4 text-accent" />
              <span>Download Missing Chapters</span>
            </button>

            <!-- Live Batch Download Card if active for this novel -->
            <div v-if="novelBatch" class="p-3 rounded-xl bg-accent/10 border border-accent/25 space-y-2 text-left animate-in fade-in duration-150">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-1.5 font-semibold text-accent truncate">
                  <Loader2 v-if="novelBatch.status === 'downloading'" class="w-3.5 h-3.5 animate-spin shrink-0" />
                  <DownloadCloud v-else class="w-3.5 h-3.5 shrink-0" />
                  <span class="truncate">Batch: Ch. {{ novelBatch.startChapter }} - {{ novelBatch.endChapter }}</span>
                </div>
                <span class="text-[11px] font-bold text-text-primary ml-1 shrink-0">
                  {{ novelBatch.completedChapters }} / {{ novelBatch.totalChapters }} ({{ Math.round((novelBatch.completedChapters / (novelBatch.totalChapters || 1)) * 100) }}%)
                </span>
              </div>

              <!-- Progress bar -->
              <div class="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden border border-border/30">
                <div
                  class="bg-accent h-full transition-all duration-300"
                  :style="{ width: `${Math.round((novelBatch.completedChapters / (novelBatch.totalChapters || 1)) * 100)}%` }"
                ></div>
              </div>

              <div class="flex items-center justify-between text-[10px] text-text-muted">
                <span class="truncate max-w-[190px]">
                  {{ novelBatch.activeChapterTitle ? `Active: ${novelBatch.activeChapterTitle}` : novelBatch.status }}
                </span>
                <button
                  type="button"
                  @click="goToQueue"
                  class="text-accent hover:underline flex items-center gap-0.5 font-medium shrink-0 cursor-pointer"
                >
                  <span>View in Queue</span>
                  <ExternalLink class="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <button
              @click="handleExportEpub"
              :class="['w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 transition-all', modalSecondaryBtnClass]"
            >
              <BookDown class="w-4 h-4 text-emerald-500" />
              <span>{{ epubExporting ? 'Exporting EPUB...' : 'Export as EPUB' }}</span>
            </button>

            <!-- Delete Novel Confirmation & Trigger -->
            <div v-if="confirmDeleteNovel" class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 space-y-2 text-center animate-in fade-in duration-150">
              <p class="text-[11px] text-rose-300 font-semibold leading-tight">Permanently delete this novel and all downloaded chapters?</p>
              <div class="flex items-center justify-center gap-2 pt-1">
                <button
                  @click="handleDeleteNovel"
                  :disabled="isDeletingNovel"
                  class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>{{ isDeletingNovel ? 'Deleting...' : 'Yes, Delete' }}</span>
                </button>
                <button
                  @click="confirmDeleteNovel = false"
                  class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-text-secondary text-xs font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button
              v-else
              @click="confirmDeleteNovel = true"
              class="w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 transition-all rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50"
              title="Permanently remove novel from library"
            >
              <Trash2 class="w-4 h-4" />
              <span>Delete Novel</span>
            </button>

            <p v-if="actionMessage" class="text-[10px] text-center font-medium" :class="actionMessageColor">
              {{ actionMessage }}
            </p>
            <p v-if="epubMessage" class="text-[10px] text-center text-emerald-500 font-medium">
              {{ epubMessage }}
            </p>
          </div>

          <!-- Metadata List -->
          <div :class="['w-full p-4 space-y-2 text-xs', modalCardClass]">
            <div class="flex justify-between py-1 border-b border-white/5">
              <span class="text-text-muted">Total Chapters</span>
              <span class="font-medium text-text-primary">{{ novel.total_chapters }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-white/5">
              <span class="text-text-muted">Downloaded</span>
              <span class="font-medium text-accent">{{ novel.downloaded_chapters }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-white/5">
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
              <button
                v-if="novel.source_url"
                type="button"
                @click="store.openExternalUrl(novel.source_url)"
                class="text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium hover:text-accent/80 transition-colors"
                title="Open novel source website in default browser"
              >
                <span>Go to source</span>
                <ExternalLink class="w-3 h-3" />
              </button>
            </p>
          </div>

          <!-- Summary Box -->
          <div :class="['p-4 text-xs leading-relaxed text-text-secondary max-h-36 overflow-y-auto', modalCardClass]">
            <h4 class="text-[11px] font-semibold text-text-primary uppercase tracking-wider mb-1">Synopsis</h4>
            <p class="whitespace-pre-line">{{ novel.summary || 'No synopsis available for this title.' }}</p>
          </div>

          <!-- Chapter List Section -->
          <div class="flex-1 flex flex-col min-h-0">
            <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <ListFilter class="w-4 h-4 text-accent" />
                <h3 class="text-xs font-semibold text-text-primary">Chapter Index</h3>
                <span class="text-[11px] text-text-muted">({{ store.currentChaptersList.length }} total, {{ downloadedCount }} ready)</span>
              </div>
              <div class="relative w-44 sm:w-48">
                <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  v-model="chapterSearch"
                  type="text"
                  placeholder="Filter chapters..."
                  :class="['w-full pl-8 pr-3 py-1 text-xs focus:outline-none', modalInputClass]"
                />
              </div>
            </div>

            <!-- Chapter Batch Action Toolbar -->
            <div class="mb-2 px-3 py-1.5 rounded-lg bg-surface-elevated/80 border border-white/5 flex items-center justify-between text-xs flex-wrap gap-2">
              <div class="flex items-center gap-2.5">
                <label class="flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary select-none">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="rounded border-white/20 text-accent focus:ring-0 w-3.5 h-3.5"
                  />
                  <span class="text-[11px] font-medium">Select All</span>
                </label>
                <button
                  type="button"
                  @click="selectOnlyDownloaded"
                  class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary text-[10px] font-medium transition-colors"
                >
                  Select Downloaded ({{ downloadedCount }})
                </button>
                <button
                  v-if="selectedChapterIndices.length > 0"
                  type="button"
                  @click="selectedChapterIndices = []"
                  class="text-[10px] text-text-muted hover:text-text-primary underline ml-1"
                >
                  Clear Selection
                </button>
              </div>

              <!-- Batch Action Buttons when chapters are selected -->
              <div v-if="selectedChapterIndices.length > 0" class="flex items-center gap-1.5 animate-in fade-in duration-150">
                <span class="text-[10px] font-semibold text-accent px-1.5 py-0.5 bg-accent/15 rounded">
                  {{ selectedChapterIndices.length }} selected
                </span>
                <button
                  type="button"
                  @click="handleClearDownloadedBatch"
                  :disabled="isDeletingChapters"
                  class="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[10px] font-semibold flex items-center gap-1 transition-all"
                  title="Delete offline saved text while keeping chapters in index"
                >
                  <Eraser class="w-3 h-3" />
                  <span>Clear Content</span>
                </button>
                <button
                  type="button"
                  @click="handleDeleteRecordsBatch"
                  :disabled="isDeletingChapters"
                  class="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 text-[10px] font-semibold flex items-center gap-1 transition-all"
                  title="Permanently remove selected chapters from novel"
                >
                  <Trash2 class="w-3 h-3" />
                  <span>Delete Chapters</span>
                </button>
              </div>
            </div>

            <!-- Chapters Scroll Area -->
            <div :class="['flex-1 overflow-y-auto divide-y divide-white/5 max-h-64', modalCardClass]">
              <div
                v-for="ch in filteredChapters"
                :key="ch.id"
                class="px-3 py-2 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group"
                @click="openChapter(ch)"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <input
                    type="checkbox"
                    :checked="selectedChapterIndices.includes(ch.chapter_index)"
                    @click.stop="toggleSelectChapter(ch.chapter_index)"
                    class="rounded border-white/20 text-accent focus:ring-0 w-3.5 h-3.5 shrink-0 cursor-pointer"
                  />
                  <span class="text-xs font-mono text-text-muted w-7 shrink-0">#{{ ch.chapter_index }}</span>
                  <span class="text-xs text-text-secondary group-hover:text-text-primary truncate">
                    {{ ch.title }}
                  </span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] text-text-muted hidden sm:inline">{{ ch.word_count }} words</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    :class="ch.is_downloaded ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'"
                  >
                    {{ ch.is_downloaded ? 'Ready' : 'Online' }}
                  </span>
                  <!-- Single Chapter Quick Delete Action -->
                  <button
                    type="button"
                    @click.stop="handleDeleteSingleChapter(ch)"
                    class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-text-muted hover:text-rose-400 transition-all"
                    :title="ch.is_downloaded ? 'Delete downloaded content (Ch. ' + ch.chapter_index + ')' : 'Delete chapter from list (Ch. ' + ch.chapter_index + ')'"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
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
import {
  X,
  BookOpen,
  Play,
  RefreshCw,
  DownloadCloud,
  ExternalLink,
  ListFilter,
  Search,
  BookDown,
  Trash2,
  Eraser,
  Loader2,
} from 'lucide-vue-next';
import { usePlatformModal } from '../composables/usePlatformModal';
import type { Chapter } from '../types';

const {
  store,
  modalContainerClass,
  modalHeaderClass,
  modalTitleClass,
  modalCloseBtnClass,
  modalCardClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
  modalInputClass,
} = usePlatformModal();

const chapterSearch = ref('');
const epubExporting = ref(false);
const epubMessage = ref('');
const coverFailed = ref(false);
const checkingUpdates = ref(false);
const confirmDeleteNovel = ref(false);
const isDeletingNovel = ref(false);
const selectedChapterIndices = ref<number[]>([]);
const isDeletingChapters = ref(false);
const actionMessage = ref('');
const actionMessageColor = ref('text-emerald-500');

const novel = computed(() => store.selectedNovelDetail!);

const novelBatch = computed(() => {
  if (!novel.value) return null;
  return (
    store.downloadBatches.find(
      (b) => b.novelId === novel.value.id && (b.status === 'downloading' || b.status === 'queued')
    ) || null
  );
});

function goToQueue() {
  store.activeTab = 'queue';
  store.closeNovelDetail();
}

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

const downloadedCount = computed(() => {
  return store.currentChaptersList.filter((c) => c.is_downloaded).length;
});

const isAllSelected = computed(() => {
  if (filteredChapters.value.length === 0) return false;
  return filteredChapters.value.every((c) => selectedChapterIndices.value.includes(c.chapter_index));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedChapterIndices.value = [];
  } else {
    selectedChapterIndices.value = filteredChapters.value.map((c) => c.chapter_index);
  }
}

function selectOnlyDownloaded() {
  selectedChapterIndices.value = store.currentChaptersList
    .filter((c) => c.is_downloaded)
    .map((c) => c.chapter_index);
}

function toggleSelectChapter(index: number) {
  const pos = selectedChapterIndices.value.indexOf(index);
  if (pos >= 0) {
    selectedChapterIndices.value.splice(pos, 1);
  } else {
    selectedChapterIndices.value.push(index);
  }
}

async function handleDeleteNovel() {
  if (!novel.value || isDeletingNovel.value) return;
  isDeletingNovel.value = true;
  try {
    const novelTitle = novel.value.title;
    await store.deleteNovel(novel.value.id);
    actionMessageColor.value = 'text-emerald-500';
    actionMessage.value = `Deleted "${novelTitle}" from library.`;
  } catch (err: any) {
    console.error('Failed to delete novel:', err);
    actionMessageColor.value = 'text-rose-400';
    actionMessage.value = `Delete failed: ${err?.message || err}`;
  } finally {
    isDeletingNovel.value = false;
    confirmDeleteNovel.value = false;
  }
}

async function handleClearDownloadedBatch() {
  if (!novel.value || !selectedChapterIndices.value.length || isDeletingChapters.value) return;
  const count = selectedChapterIndices.value.length;
  isDeletingChapters.value = true;
  try {
    await store.deleteChapters(novel.value.id, selectedChapterIndices.value, false);
    actionMessageColor.value = 'text-emerald-500';
    actionMessage.value = `Cleared downloaded content for ${count} chapters.`;
    selectedChapterIndices.value = [];
  } catch (err: any) {
    actionMessageColor.value = 'text-rose-400';
    actionMessage.value = `Failed to clear chapters: ${err?.message || err}`;
  } finally {
    isDeletingChapters.value = false;
    setTimeout(() => { actionMessage.value = ''; }, 4000);
  }
}

async function handleDeleteRecordsBatch() {
  if (!novel.value || !selectedChapterIndices.value.length || isDeletingChapters.value) return;
  const count = selectedChapterIndices.value.length;
  if (!confirm(`Are you sure you want to remove ${count} chapter(s) from the index?`)) return;
  isDeletingChapters.value = true;
  try {
    await store.deleteChapters(novel.value.id, selectedChapterIndices.value, true);
    actionMessageColor.value = 'text-emerald-500';
    actionMessage.value = `Removed ${count} chapter(s) from chapter index.`;
    selectedChapterIndices.value = [];
  } catch (err: any) {
    actionMessageColor.value = 'text-rose-400';
    actionMessage.value = `Failed to delete chapters: ${err?.message || err}`;
  } finally {
    isDeletingChapters.value = false;
    setTimeout(() => { actionMessage.value = ''; }, 4000);
  }
}

async function handleDeleteSingleChapter(ch: Chapter) {
  if (!novel.value || isDeletingChapters.value) return;
  isDeletingChapters.value = true;
  try {
    // If downloaded, clear its content; if not downloaded, remove record
    const deleteRecord = !ch.is_downloaded;
    await store.deleteChapters(novel.value.id, [ch.chapter_index], deleteRecord);
    actionMessageColor.value = 'text-emerald-500';
    actionMessage.value = deleteRecord
      ? `Removed Chapter ${ch.chapter_index} from index.`
      : `Cleared downloaded content for Chapter ${ch.chapter_index}.`;
    const idx = selectedChapterIndices.value.indexOf(ch.chapter_index);
    if (idx >= 0) selectedChapterIndices.value.splice(idx, 1);
  } catch (err: any) {
    actionMessageColor.value = 'text-rose-400';
    actionMessage.value = `Error: ${err?.message || err}`;
  } finally {
    isDeletingChapters.value = false;
    setTimeout(() => { actionMessage.value = ''; }, 4000);
  }
}

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

async function handleCheckUpdatesForNovel() {
  if (!novel.value || checkingUpdates.value) return;
  checkingUpdates.value = true;
  actionMessage.value = '';
  try {
    const res = await store.checkForUpdates(novel.value.id);
    if (res.new_chapters_found > 0) {
      actionMessageColor.value = 'text-emerald-500';
      actionMessage.value = `Found ${res.new_chapters_found} new chapters! (Total: ${res.total_chapters})`;
    } else {
      actionMessageColor.value = 'text-blue-400';
      actionMessage.value = res.message || 'Already up to date!';
    }
  } catch (err: any) {
    actionMessageColor.value = 'text-rose-400';
    actionMessage.value = `Update check failed: ${err?.message || 'Error'}`;
  } finally {
    checkingUpdates.value = false;
    setTimeout(() => {
      actionMessage.value = '';
    }, 5000);
  }
}

async function handleEnqueueDownload() {
  if (!novel.value) return;
  if (store.currentChaptersList.length === 0) {
    await store.loadNovelChapters(novel.value.id);
  }
  const count = store.enqueueNovel(novel.value, store.currentChaptersList);
  if (count > 0) {
    actionMessageColor.value = 'text-emerald-500';
    actionMessage.value = `Enqueued batch of ${count} missing chapters to Downloader Queue!`;
  } else {
    actionMessageColor.value = 'text-amber-400';
    actionMessage.value = 'All chapters are already downloaded or queued!';
  }
  setTimeout(() => {
    actionMessage.value = '';
  }, 4000);
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
