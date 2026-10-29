<template>
  <aside class="hidden md:flex flex-col w-64 bg-surface border-r border-border h-full select-none shrink-0 transition-all duration-200">
    <!-- App Branding -->
    <div class="h-16 flex items-center px-5 gap-3 border-b border-border">
      <div class="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-bold text-white shadow-md">
        FF
      </div>
      <div>
        <h1 class="text-sm font-semibold tracking-wide text-text-primary">Fanfiction Manager</h1>
        <span class="text-xs text-text-muted">Version 4.0.0-alpha</span>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="flex-1 p-3 space-y-1.5 overflow-y-auto">
      <button
        @click="store.activeTab = 'library'"
        :class="[
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
          store.activeTab === 'library'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
        ]"
      >
        <BookOpen class="w-4 h-4" />
        <span>Library</span>
        <span
          class="ml-auto text-xs px-2 py-0.5 rounded-full"
          :class="store.activeTab === 'library' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-muted'"
        >
          {{ store.novels.length }}
        </span>
      </button>

      <button
        @click="store.activeTab = 'rules'"
        :class="[
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
          store.activeTab === 'rules'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
        ]"
      >
        <Code class="w-4 h-4" />
        <span>Site Rules</span>
        <span
          class="ml-auto text-xs px-2 py-0.5 rounded-full"
          :class="store.activeTab === 'rules' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-muted'"
        >
          {{ store.rules.length }}
        </span>
      </button>

      <button
        @click="store.activeTab = 'studio'"
        :class="[
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
          store.activeTab === 'studio'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
        ]"
      >
        <Wand2 class="w-4 h-4" />
        <span>Rule Studio (MCP)</span>
      </button>

      <button
        @click="store.activeTab = 'queue'"
        :class="[
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
          store.activeTab === 'queue'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
        ]"
      >
        <DownloadCloud class="w-4 h-4" />
        <span>Downloader Queue</span>
        <span
          v-if="store.activeDownloadsCount > 0"
          class="ml-auto text-xs px-2 py-0.5 rounded-full bg-accent text-white font-semibold animate-pulse"
        >
          {{ store.activeDownloadsCount }}
        </span>
      </button>
    </nav>

    <!-- Bottom Actions: Platform Switcher, Theme Studio & Rollback -->
    <div class="p-3 border-t border-border space-y-2">
      <button
        @click="$emit('open-theme-studio')"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-text-secondary bg-surface-elevated hover:text-text-primary transition-colors"
      >
        <span class="flex items-center gap-2">
          <Palette class="w-3.5 h-3.5 text-accent" />
          <span>Platform Theme</span>
        </span>
        <span class="uppercase tracking-wider text-[10px] text-accent font-semibold">
          {{ store.platformStyle }}
        </span>
      </button>

      <button
        @click="$emit('open-rollback')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-surface-elevated transition-colors"
      >
        <RotateCcw class="w-3.5 h-3.5 text-amber-500" />
        <span>Rollback Buffer (3 Ver)</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useLibraryStore } from '../stores/library';
import { BookOpen, Code, Wand2, DownloadCloud, Palette, RotateCcw } from 'lucide-vue-next';

defineEmits<{
  (e: 'open-theme-studio'): void;
  (e: 'open-rollback'): void;
}>();

const store = useLibraryStore();
</script>

