<template>
  <!-- WINDOWS 11 FLUENT TITLEBAR -->
  <header
    v-if="store.platformStyle === 'windows'"
    class="h-10 bg-[#1f1f1f]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 shrink-0 select-none text-xs text-text-secondary z-30"
  >
    <div class="flex items-center gap-2.5">
      <div class="w-5 h-5 rounded bg-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
        FF
      </div>
      <span class="font-semibold text-text-primary text-[11px] font-sans">Fanfiction Manager</span>
      <span class="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-text-muted font-mono">v4.0.0</span>
    </div>

    <!-- Center Drag Region -->
    <div class="flex-1 h-full mx-4 flex items-center justify-center cursor-default">
      <div class="flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] text-text-muted hover:bg-white/10 transition-colors">
        <Sparkles class="w-3 h-3 text-accent" />
        <span>WinUI 3 Fluent Experience</span>
      </div>
    </div>

    <!-- Right: Window Caption Controls -->
    <div class="flex items-center h-full -mr-3">
      <button
        @click="$emit('open-theme-studio')"
        class="h-full px-3 flex items-center gap-1.5 hover:bg-white/10 text-text-muted hover:text-text-primary text-[11px] transition-colors"
        title="Theme Studio"
      >
        <Palette class="w-3.5 h-3.5 text-accent" />
        <span class="hidden sm:inline">Theme</span>
      </button>

      <button
        @click="minimizeWindow"
        class="h-full w-11 flex items-center justify-center hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
        title="Minimize"
      >
        <Minus class="w-3.5 h-3.5" />
      </button>
      <button
        @click="maximizeWindow"
        class="h-full w-11 flex items-center justify-center hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
        title="Maximize"
      >
        <Square class="w-3 h-3" />
      </button>
      <button
        @click="closeWindow"
        class="h-full w-11 flex items-center justify-center hover:bg-[#c42b1c] hover:text-white text-text-muted transition-colors"
        title="Close"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </header>

  <!-- MACOS SONOMA / SEQUOIA LIQUID TITLEBAR -->
  <header
    v-else-if="store.platformStyle === 'apple'"
    class="h-12 bg-surface/70 backdrop-blur-2xl border-b border-white/15 flex items-center justify-between px-4 shrink-0 select-none text-xs text-text-secondary z-30"
  >
    <!-- Left: Traffic Light Buttons -->
    <div class="flex items-center gap-2 w-28 group">
      <button
        @click="closeWindow"
        class="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center shadow-xs transition-opacity hover:opacity-90"
        title="Close"
      >
        <X class="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <button
        @click="minimizeWindow"
        class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center shadow-xs transition-opacity hover:opacity-90"
        title="Minimize"
      >
        <Minus class="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <button
        @click="maximizeWindow"
        class="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center shadow-xs transition-opacity hover:opacity-90"
        title="Zoom / Fullscreen"
      >
        <Maximize2 class="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>

    <!-- Center: macOS Window Title -->
    <div class="flex items-center gap-2">
      <BookOpen class="w-3.5 h-3.5 text-accent" />
      <span class="font-medium text-text-primary text-[13px] tracking-tight">Fanfiction Manager</span>
      <span class="text-[10px] text-text-muted font-normal">• {{ activeTabLabel }}</span>
    </div>

    <!-- Right: macOS Action Pills -->
    <div class="flex items-center gap-2 w-28 justify-end">
      <button
        @click="$emit('open-theme-studio')"
        class="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-text-primary text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
      >
        <Palette class="w-3 h-3 text-accent" />
        <span>Theme</span>
      </button>
    </div>
  </header>

  <!-- ANDROID MATERIAL 3 TOP APP BAR -->
  <header
    v-else-if="store.platformStyle === 'android'"
    class="h-16 bg-[#1d1b20] border-b border-white/5 flex items-center justify-between px-5 shrink-0 select-none text-text-primary z-30 shadow-md"
  >
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
        <BookOpen class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-base font-medium tracking-tight text-text-primary">Fanfiction Manager</h2>
        <span class="text-[11px] text-accent font-medium">Material Design 3</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="$emit('open-theme-studio')"
        class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        title="Theme & Platform"
      >
        <Palette class="w-5 h-5 text-accent" />
      </button>
    </div>
  </header>

  <!-- LINUX GNOME LIBADWAITA HEADERBAR -->
  <header
    v-else
    class="h-12 bg-[#242424] border-b border-white/10 flex items-center justify-between px-4 shrink-0 select-none text-xs text-text-secondary z-30"
  >
    <div class="flex items-center gap-2 w-32">
      <span class="w-2.5 h-2.5 rounded-full bg-accent"></span>
      <span class="font-semibold text-text-primary text-xs">Libadwaita</span>
    </div>

    <!-- Center Title -->
    <div class="font-bold text-text-primary text-xs">
      Fanfiction Manager
    </div>

    <!-- Right: GNOME Close Button -->
    <div class="flex items-center gap-2 w-32 justify-end">
      <button
        @click="$emit('open-theme-studio')"
        class="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[11px] text-text-primary font-medium flex items-center gap-1 transition-colors"
      >
        <Palette class="w-3 h-3 text-accent" />
        <span>Theme</span>
      </button>
      <button
        @click="closeWindow"
        class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-text-primary flex items-center justify-center transition-colors"
        title="Close"
      >
        <X class="w-3 h-3" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLibraryStore } from '../stores/library';
import {
  Minus,
  Square,
  X,
  Maximize2,
  BookOpen,
  Palette,
  Sparkles,
} from 'lucide-vue-next';

defineEmits<{
  (e: 'open-theme-studio'): void;
}>();

const store = useLibraryStore();

const activeTabLabel = computed(() => {
  switch (store.activeTab) {
    case 'library':
      return 'Library';
    case 'rules':
      return 'Site Rules';
    case 'studio':
      return 'Rule Studio';
    case 'queue':
      return 'Downloader Queue';
    case 'reader':
      return 'Reader';
    default:
      return 'Dashboard';
  }
});

async function minimizeWindow() {
  if (window.__TAURI_INTERNALS__) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().minimize();
    } catch (e) {
      console.warn('Tauri minimize error:', e);
    }
  }
}

async function maximizeWindow() {
  if (window.__TAURI_INTERNALS__) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().toggleMaximize();
    } catch (e) {
      console.warn('Tauri toggleMaximize error:', e);
    }
  }
}

async function closeWindow() {
  if (window.__TAURI_INTERNALS__) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().close();
    } catch (e) {
      console.warn('Tauri close error:', e);
    }
  }
}
</script>
