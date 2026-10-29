<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden select-none">
    <!-- PLATFORM-SPECIFIC HEADER -->

    <!-- Windows 11 Header -->
    <header
      v-if="store.platformStyle === 'windows'"
      class="h-14 px-6 border-b border-white/5 flex items-center justify-between gap-4 bg-[#202020]/90 backdrop-blur-xl shrink-0"
    >
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search library..."
          class="w-full pl-9 pr-3 py-1.5 bg-[#2b2b2b] border border-white/10 rounded-md text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors font-sans"
        />
      </div>

      <!-- Windows Segmented Buttons -->
      <div class="flex items-center gap-1 bg-[#2b2b2b] p-0.5 rounded-md border border-white/10">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="store.activeFilter = filter.id"
          :class="[
            'px-3 py-1 rounded text-xs font-medium transition-colors font-sans',
            store.activeFilter === filter.id
              ? 'bg-accent text-white shadow-xs font-semibold'
              : 'text-text-muted hover:text-text-primary'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>

    <!-- macOS Sonoma Header -->
    <header
      v-else-if="store.platformStyle === 'apple'"
      class="h-14 px-6 border-b border-white/10 flex items-center justify-between gap-4 bg-surface/50 backdrop-blur-2xl shrink-0"
    >
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search novels..."
          class="w-full pl-9 pr-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all shadow-xs"
        />
      </div>

      <!-- macOS Segmented Control Pill -->
      <div class="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/10 backdrop-blur-md">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="store.activeFilter = filter.id"
          :class="[
            'px-3.5 py-1 rounded-full text-xs transition-all',
            store.activeFilter === filter.id
              ? 'bg-gradient-to-r from-[#007aff] to-[#0a84ff] text-white font-medium shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>

    <!-- Android Material 3 Header -->
    <header
      v-else-if="store.platformStyle === 'android'"
      class="h-16 px-6 border-b border-white/5 flex items-center justify-between gap-4 bg-[#1d1b20] shrink-0 shadow-xs"
    >
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search fanfiction..."
          class="w-full pl-11 pr-4 py-2.5 bg-[#2b2930] rounded-full text-xs text-text-primary placeholder-text-muted focus:outline-none ring-1 ring-white/10 focus:ring-accent transition-all"
        />
      </div>

      <!-- Material 3 Filter Chips -->
      <div class="flex items-center gap-2">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="store.activeFilter = filter.id"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors',
            store.activeFilter === filter.id
              ? 'bg-accent/20 border-accent text-accent font-bold'
              : 'border-white/10 bg-[#2b2930] text-text-secondary hover:text-text-primary'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>

    <!-- Linux Libadwaita Header -->
    <header
      v-else
      class="h-14 px-6 border-b border-white/10 flex items-center justify-between gap-4 bg-[#242424] shrink-0"
    >
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Type to search..."
          class="w-full pl-9 pr-3 py-1.5 bg-[#2d2d2d] border border-white/10 rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div class="flex items-center gap-1 bg-[#2d2d2d] p-1 rounded-full border border-white/10">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="store.activeFilter = filter.id"
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
            store.activeFilter === filter.id
              ? 'bg-accent text-white shadow-xs'
              : 'text-text-muted hover:text-text-primary'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>

    <!-- MAIN NOVEL GRID VIEWPORT -->
    <main class="flex-1 overflow-y-auto p-6 relative">
      <div v-if="store.filteredNovels.length === 0" class="h-full flex flex-col items-center justify-center text-center p-8">
        <BookOpen class="w-12 h-12 text-text-muted mb-3 opacity-40" />
        <h3 class="text-base font-semibold text-text-secondary mb-1">No Novels Found</h3>
        <p class="text-xs text-text-muted max-w-sm">
          {{ store.searchQuery ? 'Try adjusting your search query.' : 'Add your first novel via URL or site rules.' }}
        </p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        <article
          v-for="novel in store.filteredNovels"
          :key="novel.id"
          @click="store.openNovelDetail(novel)"
          :class="cardClasses"
        >
          <!-- Cover Container -->
          <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-elevated">
            <!-- Platform-Specific Badge -->
            <div :class="badgeClasses">
              {{ novel.downloaded_chapters }} / {{ novel.total_chapters }} ch
            </div>

            <img
              v-if="hasValidCover(novel)"
              :src="getCoverUrl(novel)"
              :alt="novel.title"
              @error="handleCoverError(novel.id)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-elevated via-surface to-surface-elevated p-4 text-center border-b border-border/40"
            >
              <BookOpen class="w-8 h-8 text-accent/60 mb-2.5 opacity-80" />
              <span class="text-xs font-medium text-text-primary line-clamp-3 leading-snug">{{ novel.title }}</span>
              <span class="text-[10px] text-text-muted mt-2 line-clamp-1 font-mono">{{ novel.author || 'Web Novel' }}</span>
            </div>
          </div>

          <!-- Novel Information -->
          <div class="p-3.5 flex flex-col flex-1">
            <h3 class="text-xs font-semibold text-text-primary line-clamp-2 mb-1 group-hover:text-accent transition-colors leading-tight">
              {{ novel.title }}
            </h3>
            <p class="text-[11px] text-text-muted line-clamp-1 mb-2 font-mono">
              {{ novel.author || 'Web Novel' }}
            </p>

            <!-- Progress Bar -->
            <div class="mt-auto w-full bg-surface-elevated h-1 rounded-full overflow-hidden">
              <div
                class="bg-accent h-full transition-all duration-300"
                :style="{ width: `${getProgress(novel)}%` }"
              ></div>
            </div>
          </div>
        </article>
      </div>

      <!-- Android Floating Action Button (FAB) -->
      <button
        v-if="store.platformStyle === 'android'"
        @click="store.activeTab = 'rules'"
        class="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-accent text-[#381e72] shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
        title="Add Novel via Site Rules"
      >
        <Plus class="w-7 h-7 stroke-[2.5]" />
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLibraryStore } from '../stores/library';
import { Search, BookOpen, Plus } from 'lucide-vue-next';
import type { Novel } from '../types';

const store = useLibraryStore();
const failedCovers = ref<Record<string, boolean>>({});

const filters = [
  { id: 'all' as const, label: 'All' },
  { id: 'downloaded' as const, label: 'Downloaded' },
  { id: 'updating' as const, label: 'Updating' },
];

const cardClasses = computed(() => {
  switch (store.platformStyle) {
    case 'windows':
      return 'group flex flex-col bg-[#272727] border border-white/10 rounded-md overflow-hidden cursor-pointer hover:border-accent hover:translate-y-[-2px] hover:shadow-xl transition-all duration-150';
    case 'apple':
      return 'group flex flex-col bg-surface/80 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 shadow-md ring-1 ring-white/5';
    case 'android':
      return 'group flex flex-col bg-[#2b2930] border border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:bg-[#333039] hover:shadow-2xl transition-all duration-200';
    case 'linux':
    default:
      return 'group flex flex-col bg-[#2c2c2c] border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-accent hover:bg-[#323232] transition-all duration-200';
  }
});

const badgeClasses = computed(() => {
  switch (store.platformStyle) {
    case 'windows':
      return 'absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white z-10 shadow-sm pointer-events-none';
    case 'apple':
      return 'absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xl text-[10px] font-medium text-white z-10 shadow-sm pointer-events-none border border-white/10';
    case 'android':
      return 'absolute top-2.5 right-2.5 px-3 py-0.5 rounded-full bg-accent text-[#381e72] text-[10px] font-bold z-10 shadow-md pointer-events-none';
    case 'linux':
    default:
      return 'absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-[#1e1e1e]/90 text-[10px] font-semibold text-white z-10 shadow-sm pointer-events-none border border-white/10';
  }
});

function hasValidCover(novel: Novel): boolean {
  if (failedCovers.value[novel.id]) return false;
  return Boolean(novel.cover_local_path || novel.cover_url);
}

function getCoverUrl(novel: Novel): string {
  const raw = novel.cover_local_path || novel.cover_url || '';
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

function handleCoverError(novelId: string) {
  failedCovers.value[novelId] = true;
}

function getProgress(novel: Novel): number {
  if (!novel.total_chapters || novel.total_chapters === 0) return 0;
  return Math.min(100, Math.round((novel.downloaded_chapters / novel.total_chapters) * 100));
}
</script>
