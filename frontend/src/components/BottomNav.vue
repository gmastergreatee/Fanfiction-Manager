<template>
  <nav class="md:hidden flex items-center justify-around h-16 bg-surface/90 backdrop-blur-md border-t border-border px-2 z-30 select-none pb-safe">
    <button
      @click="store.activeTab = 'library'"
      :class="[
        'flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors',
        store.activeTab === 'library' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      ]"
    >
      <BookOpen class="w-5 h-5" />
      <span class="text-[11px] mt-0.5 font-medium">Library</span>
    </button>

    <button
      @click="store.activeTab = 'rules'"
      :class="[
        'flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors',
        store.activeTab === 'rules' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      ]"
    >
      <Code class="w-5 h-5" />
      <span class="text-[11px] mt-0.5 font-medium">Rules</span>
    </button>

    <button
      @click="store.activeTab = 'studio'"
      :class="[
        'flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors',
        store.activeTab === 'studio' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      ]"
    >
      <Wand2 class="w-5 h-5" />
      <span class="text-[11px] mt-0.5 font-medium">Studio</span>
    </button>

    <button
      @click="store.activeTab = 'queue'"
      :class="[
        'flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors relative',
        store.activeTab === 'queue' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      ]"
    >
      <div class="relative">
        <DownloadCloud class="w-5 h-5" />
        <span
          v-if="store.activeDownloadsCount > 0"
          class="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-accent text-white"
        >
          {{ store.activeDownloadsCount }}
        </span>
      </div>
      <span class="text-[11px] mt-0.5 font-medium">Queue</span>
    </button>

    <button
      @click="$emit('open-theme-studio')"
      class="flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-text-muted hover:text-text-secondary transition-colors"
    >
      <Palette class="w-5 h-5" />
      <span class="text-[11px] mt-0.5 font-medium">Theme</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useLibraryStore } from '../stores/library';
import { BookOpen, Code, Wand2, DownloadCloud, Palette } from 'lucide-vue-next';

defineEmits<{
  (e: 'open-theme-studio'): void;
}>();

const store = useLibraryStore();
</script>

