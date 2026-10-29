<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header with Filters & Search -->
    <header class="h-16 px-6 border-b border-border flex items-center justify-between gap-4 bg-surface/50 backdrop-blur-sm shrink-0">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search novels by title or author..."
          class="w-full pl-10 pr-4 py-2 bg-surface-elevated/70 border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <!-- Filter Pills -->
      <div class="flex items-center gap-1.5 bg-surface-elevated/50 p-1 rounded-xl border border-border">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="store.activeFilter = filter.id"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            store.activeFilter === filter.id
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          ]"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>

    <!-- Novel Cards Grid -->
    <main class="flex-1 overflow-y-auto p-6">
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
          class="group flex flex-col bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-accent/50 hover:shadow-lg transition-all duration-200"
        >
          <!-- Cover Image Container -->
          <div class="relative aspect-[2/3] w-full bg-surface-elevated overflow-hidden">
            <img
              v-if="novel.cover_local_path"
              :src="novel.cover_local_path"
              :alt="novel.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-elevated p-4 text-center">
              <span class="text-xs font-medium text-text-muted line-clamp-3">{{ novel.title }}</span>
            </div>

            <!-- Downloaded Badge -->
            <div class="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white">
              {{ novel.downloaded_chapters }} / {{ novel.total_chapters }} ch
            </div>
          </div>

          <!-- Novel Info -->
          <div class="p-3.5 flex flex-col flex-1">
            <h3 class="text-xs font-semibold text-text-primary line-clamp-2 mb-1 group-hover:text-accent transition-colors">
              {{ novel.title }}
            </h3>
            <p class="text-[11px] text-text-muted line-clamp-1 mb-2">
              {{ novel.author || 'Unknown Author' }}
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from '../stores/library';
import { Search, BookOpen } from 'lucide-vue-next';
import type { Novel } from '../types';

const store = useLibraryStore();

const filters = [
  { id: 'all' as const, label: 'All' },
  { id: 'downloaded' as const, label: 'Downloaded' },
  { id: 'updating' as const, label: 'Updating' },
];

function getProgress(novel: Novel): number {
  if (!novel.total_chapters || novel.total_chapters === 0) return 0;
  return Math.min(100, Math.round((novel.downloaded_chapters / novel.total_chapters) * 100));
}
</script>

