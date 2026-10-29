<template>
  <!-- WINDOWS 11 WINUI 3 NAVIGATION VIEW -->
  <aside
    v-if="store.platformStyle === 'windows'"
    class="hidden md:flex flex-col w-60 bg-[#1e1e1e]/90 backdrop-blur-xl border-r border-white/10 h-full select-none shrink-0 text-text-secondary transition-all"
  >
    <!-- Hamburger Header -->
    <div class="h-12 flex items-center px-4 gap-3 border-b border-white/5">
      <button class="p-1.5 rounded-md hover:bg-white/10 text-text-primary transition-colors">
        <Menu class="w-4 h-4" />
      </button>
      <span class="text-xs font-semibold text-text-primary tracking-wide">Navigation</span>
    </div>

    <!-- WinUI 3 Navigation Items -->
    <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
      <button
        @click="store.activeTab = 'library'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all relative',
          store.activeTab === 'library'
            ? 'bg-white/10 text-white font-semibold before:content-[\'\'] before:w-1 before:h-4 before:bg-accent before:rounded-full before:absolute before:left-1'
            : 'hover:bg-white/5 hover:text-text-primary'
        ]"
      >
        <BookOpen class="w-4 h-4 text-accent ml-1" />
        <span>Library</span>
        <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted font-mono">
          {{ store.novels.length }}
        </span>
      </button>

      <button
        @click="store.activeTab = 'rules'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all relative',
          store.activeTab === 'rules'
            ? 'bg-white/10 text-white font-semibold before:content-[\'\'] before:w-1 before:h-4 before:bg-accent before:rounded-full before:absolute before:left-1'
            : 'hover:bg-white/5 hover:text-text-primary'
        ]"
      >
        <Code class="w-4 h-4 text-accent ml-1" />
        <span>Site Rules</span>
        <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted font-mono">
          {{ store.rules.length }}
        </span>
      </button>

      <button
        @click="store.activeTab = 'studio'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all relative',
          store.activeTab === 'studio'
            ? 'bg-white/10 text-white font-semibold before:content-[\'\'] before:w-1 before:h-4 before:bg-accent before:rounded-full before:absolute before:left-1'
            : 'hover:bg-white/5 hover:text-text-primary'
        ]"
      >
        <Wand2 class="w-4 h-4 text-accent ml-1" />
        <span>Rule Studio (MCP)</span>
      </button>

      <button
        @click="store.activeTab = 'queue'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all relative',
          store.activeTab === 'queue'
            ? 'bg-white/10 text-white font-semibold before:content-[\'\'] before:w-1 before:h-4 before:bg-accent before:rounded-full before:absolute before:left-1'
            : 'hover:bg-white/5 hover:text-text-primary'
        ]"
      >
        <DownloadCloud class="w-4 h-4 text-accent ml-1" />
        <span>Download Queue</span>
        <span
          v-if="store.activeDownloadsCount > 0"
          class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-accent text-white font-bold animate-pulse"
        >
          {{ store.activeDownloadsCount }}
        </span>
      </button>
    </nav>

    <!-- Bottom Actions -->
    <div class="p-2 border-t border-white/5 space-y-1">
      <button
        @click="$emit('open-theme-studio')"
        class="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-text-muted hover:bg-white/5 hover:text-text-primary transition-colors"
      >
        <span class="flex items-center gap-2">
          <Palette class="w-3.5 h-3.5 text-accent" />
          <span>Platform Style</span>
        </span>
        <span class="text-[10px] font-semibold text-accent uppercase font-mono">WinUI 3</span>
      </button>

      <button
        @click="$emit('open-rollback')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-text-muted hover:bg-white/5 hover:text-text-primary transition-colors"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Rollback Buffer</span>
      </button>
    </div>
  </aside>

  <!-- MACOS SONOMA / SEQUOIA SOURCE LIST -->
  <aside
    v-else-if="store.platformStyle === 'apple'"
    class="hidden md:flex flex-col w-64 bg-surface/60 backdrop-blur-2xl border-r border-white/10 h-full select-none shrink-0 text-text-secondary transition-all"
  >
    <div class="p-3 space-y-5 flex-1 overflow-y-auto">
      <!-- Section: Library -->
      <div>
        <div class="px-3 pb-1 text-[10px] font-bold text-text-muted tracking-wider uppercase">
          Library
        </div>
        <div class="space-y-0.5">
          <button
            @click="store.activeTab = 'library'"
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              store.activeTab === 'library'
                ? 'bg-gradient-to-r from-[#007aff] to-[#0a84ff] text-white font-medium shadow-sm'
                : 'hover:bg-white/10 text-text-primary'
            ]"
          >
            <BookOpen class="w-4 h-4" />
            <span>All Novels</span>
            <span
              class="ml-auto text-[10px] px-1.5 py-0.2 rounded-full"
              :class="store.activeTab === 'library' ? 'bg-white/20 text-white' : 'text-text-muted'"
            >
              {{ store.novels.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Section: Tools & Studio -->
      <div>
        <div class="px-3 pb-1 text-[10px] font-bold text-text-muted tracking-wider uppercase">
          Tools & Studio
        </div>
        <div class="space-y-0.5">
          <button
            @click="store.activeTab = 'rules'"
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              store.activeTab === 'rules'
                ? 'bg-gradient-to-r from-[#007aff] to-[#0a84ff] text-white font-medium shadow-sm'
                : 'hover:bg-white/10 text-text-primary'
            ]"
          >
            <Code class="w-4 h-4" />
            <span>Site Rules</span>
            <span
              class="ml-auto text-[10px] px-1.5 py-0.2 rounded-full"
              :class="store.activeTab === 'rules' ? 'bg-white/20 text-white' : 'text-text-muted'"
            >
              {{ store.rules.length }}
            </span>
          </button>

          <button
            @click="store.activeTab = 'studio'"
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              store.activeTab === 'studio'
                ? 'bg-gradient-to-r from-[#007aff] to-[#0a84ff] text-white font-medium shadow-sm'
                : 'hover:bg-white/10 text-text-primary'
            ]"
          >
            <Wand2 class="w-4 h-4" />
            <span>Rule Studio (MCP)</span>
          </button>

          <button
            @click="store.activeTab = 'queue'"
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
              store.activeTab === 'queue'
                ? 'bg-gradient-to-r from-[#007aff] to-[#0a84ff] text-white font-medium shadow-sm'
                : 'hover:bg-white/10 text-text-primary'
            ]"
          >
            <DownloadCloud class="w-4 h-4" />
            <span>Download Queue</span>
            <span
              v-if="store.activeDownloadsCount > 0"
              class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-accent text-white font-bold shadow-sm"
            >
              {{ store.activeDownloadsCount }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- macOS Bottom Preferences -->
    <div class="p-3 border-t border-white/10 space-y-1">
      <button
        @click="$emit('open-theme-studio')"
        class="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
      >
        <span class="flex items-center gap-2">
          <Palette class="w-3.5 h-3.5 text-accent" />
          <span>macOS Sonoma</span>
        </span>
        <span class="text-[10px] text-accent font-medium">Customize</span>
      </button>

      <button
        @click="$emit('open-rollback')"
        class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Rollback Ring Buffer</span>
      </button>
    </div>
  </aside>

  <!-- ANDROID MATERIAL 3 NAVIGATION RAIL -->
  <aside
    v-else-if="store.platformStyle === 'android'"
    class="hidden md:flex flex-col w-20 bg-[#1d1b20] border-r border-white/5 h-full select-none shrink-0 items-center py-4 space-y-6 text-text-secondary shadow-lg z-20"
  >
    <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
      <BookOpen class="w-5 h-5" />
    </div>

    <nav class="flex-1 flex flex-col items-center gap-4 w-full">
      <button
        @click="store.activeTab = 'library'"
        class="flex flex-col items-center gap-1 group w-full"
        title="Library"
      >
        <div
          class="px-4 py-1.5 rounded-full transition-all"
          :class="store.activeTab === 'library' ? 'bg-accent/25 text-accent' : 'text-text-secondary group-hover:bg-white/5'"
        >
          <BookOpen class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-medium" :class="store.activeTab === 'library' ? 'text-accent font-bold' : 'text-text-muted'">
          Library
        </span>
      </button>

      <button
        @click="store.activeTab = 'rules'"
        class="flex flex-col items-center gap-1 group w-full"
        title="Site Rules"
      >
        <div
          class="px-4 py-1.5 rounded-full transition-all"
          :class="store.activeTab === 'rules' ? 'bg-accent/25 text-accent' : 'text-text-secondary group-hover:bg-white/5'"
        >
          <Code class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-medium" :class="store.activeTab === 'rules' ? 'text-accent font-bold' : 'text-text-muted'">
          Rules
        </span>
      </button>

      <button
        @click="store.activeTab = 'studio'"
        class="flex flex-col items-center gap-1 group w-full"
        title="Rule Studio"
      >
        <div
          class="px-4 py-1.5 rounded-full transition-all"
          :class="store.activeTab === 'studio' ? 'bg-accent/25 text-accent' : 'text-text-secondary group-hover:bg-white/5'"
        >
          <Wand2 class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-medium" :class="store.activeTab === 'studio' ? 'text-accent font-bold' : 'text-text-muted'">
          Studio
        </span>
      </button>

      <button
        @click="store.activeTab = 'queue'"
        class="flex flex-col items-center gap-1 group w-full"
        title="Downloads"
      >
        <div
          class="px-4 py-1.5 rounded-full transition-all relative"
          :class="store.activeTab === 'queue' ? 'bg-accent/25 text-accent' : 'text-text-secondary group-hover:bg-white/5'"
        >
          <DownloadCloud class="w-5 h-5" />
          <span
            v-if="store.activeDownloadsCount > 0"
            class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-ping"
          ></span>
        </div>
        <span class="text-[10px] font-medium" :class="store.activeTab === 'queue' ? 'text-accent font-bold' : 'text-text-muted'">
          Queue
        </span>
      </button>
    </nav>

    <div class="flex flex-col items-center gap-2">
      <button
        @click="$emit('open-theme-studio')"
        class="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-accent transition-colors"
        title="Material 3 Themes"
      >
        <Palette class="w-5 h-5" />
      </button>
      <button
        @click="$emit('open-rollback')"
        class="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        title="Rollback"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
    </div>
  </aside>

  <!-- LINUX GNOME LIBADWAITA SIDEBAR -->
  <aside
    v-else
    class="hidden md:flex flex-col w-60 bg-[#242424] border-r border-white/10 h-full select-none shrink-0 text-text-secondary p-3 space-y-2"
  >
    <div class="h-10 flex items-center px-2 gap-2.5 border-b border-white/5 pb-2">
      <div class="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs">
        FF
      </div>
      <span class="font-bold text-xs text-text-primary tracking-tight">Adwaita Core</span>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto">
      <button
        @click="store.activeTab = 'library'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-semibold transition-colors',
          store.activeTab === 'library'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
        ]"
      >
        <BookOpen class="w-4 h-4" />
        <span>Library</span>
        <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-white">
          {{ store.novels.length }}
        </span>
      </button>

      <button
        @click="store.activeTab = 'rules'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-semibold transition-colors',
          store.activeTab === 'rules'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
        ]"
      >
        <Code class="w-4 h-4" />
        <span>Site Rules</span>
        <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-white">
          {{ store.rules.length }}
        </span>
      </button>

      <button
        @click="store.activeTab = 'studio'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-semibold transition-colors',
          store.activeTab === 'studio'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
        ]"
      >
        <Wand2 class="w-4 h-4" />
        <span>Rule Studio (MCP)</span>
      </button>

      <button
        @click="store.activeTab = 'queue'"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-semibold transition-colors',
          store.activeTab === 'queue'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
        ]"
      >
        <DownloadCloud class="w-4 h-4" />
        <span>Downloader Queue</span>
        <span
          v-if="store.activeDownloadsCount > 0"
          class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-accent text-white font-bold"
        >
          {{ store.activeDownloadsCount }}
        </span>
      </button>
    </nav>

    <!-- Adwaita Bottom Actions -->
    <div class="pt-2 border-t border-white/5 space-y-1">
      <button
        @click="$emit('open-theme-studio')"
        class="w-full flex items-center justify-between px-3 py-2 rounded-full text-xs bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
      >
        <span class="flex items-center gap-2">
          <Palette class="w-3.5 h-3.5 text-accent" />
          <span>Libadwaita</span>
        </span>
        <span class="text-[10px] text-accent font-mono uppercase">Linux</span>
      </button>

      <button
        @click="$emit('open-rollback')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-full text-xs bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Rollback</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useLibraryStore } from '../stores/library';
import {
  BookOpen,
  Code,
  Wand2,
  DownloadCloud,
  Palette,
  RotateCcw,
  Menu,
} from 'lucide-vue-next';

defineEmits<{
  (e: 'open-theme-studio'): void;
  (e: 'open-rollback'): void;
}>();

const store = useLibraryStore();
</script>
