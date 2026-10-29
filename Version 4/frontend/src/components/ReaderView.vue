<template>
  <div
    class="relative flex-1 flex flex-col h-full overflow-hidden select-text transition-colors duration-200"
    :class="readerThemeClasses"
  >
    <!-- Floating Reader HUD (Auto-Hides on Scroll or Toggle) -->
    <header
      v-show="showHUD"
      class="absolute top-0 inset-x-0 h-14 bg-surface/90 backdrop-blur-md border-b border-border px-5 flex items-center justify-between z-20 transition-transform duration-200"
    >
      <button
        @click="store.closeReader()"
        class="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Library</span>
      </button>

      <div class="text-center px-4 max-w-md truncate">
        <h4 class="text-xs font-semibold truncate">{{ store.activeNovel?.title }}</h4>
        <span class="text-[10px] text-text-muted truncate">{{ store.currentChapter?.title }}</span>
      </div>

      <!-- Controls: Theme, Font Size -->
      <div class="flex items-center gap-2">
        <button
          @click="store.setReaderFontSize(store.readerFontSize - 1)"
          class="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
          title="Decrease Font Size"
        >
          <Minus class="w-3.5 h-3.5" />
        </button>
        <span class="text-xs font-semibold w-6 text-center">{{ store.readerFontSize }}</span>
        <button
          @click="store.setReaderFontSize(store.readerFontSize + 1)"
          class="p-1.5 rounded-lg hover:bg-surface-elevated text-text-secondary hover:text-text-primary"
          title="Increase Font Size"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>

        <div class="w-px h-4 bg-border mx-1"></div>

        <button
          @click="cycleReaderTheme"
          class="px-2.5 py-1 text-xs rounded-lg bg-surface-elevated text-text-secondary hover:text-text-primary uppercase tracking-wider font-semibold"
        >
          {{ store.readerTheme }}
        </button>
      </div>
    </header>

    <!-- Chapter Content Area -->
    <main
      @click="toggleHUD"
      class="flex-1 overflow-y-auto px-6 md:px-16 py-20 max-w-3xl mx-auto w-full leading-relaxed font-serif"
      :style="{ fontSize: `${store.readerFontSize}px` }"
    >
      <h1 class="text-xl md:text-2xl font-bold mb-6 text-center font-sans">
        {{ store.currentChapter?.title || 'Chapter Title' }}
      </h1>

      <div
        v-if="store.currentChapter?.content_html"
        class="chapter-content space-y-4"
        v-html="store.currentChapter.content_html"
      ></div>

      <div v-else class="text-center py-16 text-text-muted text-sm font-sans">
        No chapter content loaded. Please select a downloaded chapter.
      </div>

      <!-- Bottom Next / Prev Navigation -->
      <nav class="flex items-center justify-between pt-12 pb-8 border-t border-border/40 mt-12 font-sans">
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span class="text-xs text-text-muted">
          Chapter {{ store.currentChapter?.chapter_index || 1 }}
        </span>

        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>Next</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLibraryStore } from '../stores/library';
import { ArrowLeft, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { ReaderTheme } from '../types';

const store = useLibraryStore();
const showHUD = ref(true);

const THEMES: ReaderTheme[] = ['dark', 'oled', 'sepia', 'light'];

function toggleHUD() {
  showHUD.value = !showHUD.value;
}

function cycleReaderTheme() {
  const currentIndex = THEMES.indexOf(store.readerTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  store.setReaderTheme(THEMES[nextIndex]);
}

const readerThemeClasses = computed(() => {
  switch (store.readerTheme) {
    case 'oled':
      return 'bg-black text-neutral-200';
    case 'sepia':
      return 'bg-[#fbf0d9] text-[#5f4b32]';
    case 'light':
      return 'bg-white text-neutral-800';
    case 'dark':
    default:
      return 'bg-[#18181b] text-neutral-200';
  }
});
</script>

