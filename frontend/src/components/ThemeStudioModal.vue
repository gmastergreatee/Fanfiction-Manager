<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-border flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Palette class="w-4 h-4 text-accent" />
          <h3 class="text-sm font-semibold text-text-primary">Theme Studio & Customizer</h3>
        </div>
        <button
          @click="$emit('close')"
          class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
        <!-- Platform Aesthetic Selector -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
            Platform Design System
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="platform in platforms"
              :key="platform.id"
              @click="store.setPlatform(platform.id)"
              :class="[
                'p-3 rounded-xl border text-left flex flex-col gap-1 transition-all',
                store.platformStyle === platform.id
                  ? 'border-accent bg-accent/10 shadow-sm'
                  : 'border-border bg-surface-elevated hover:border-text-muted'
              ]"
            >
              <span class="text-xs font-semibold text-text-primary">{{ platform.name }}</span>
              <span class="text-[10px] text-text-muted">{{ platform.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Theme Mode: Dark, OLED, Light -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
            Color Mode
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="mode in modes"
              :key="mode.id"
              @click="store.setTheme(mode.id)"
              :class="[
                'py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all',
                store.themeMode === mode.id
                  ? 'border-accent bg-accent text-white shadow-sm'
                  : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
              ]"
            >
              {{ mode.name }}
            </button>
          </div>
        </div>

        <!-- Custom Color Variables (Live Mutation) -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
            Custom Accent Color
          </label>
          <div class="flex items-center gap-2">
            <button
              v-for="color in presetColors"
              :key="color"
              @click="setAccent(color)"
              class="w-7 h-7 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-border flex items-center justify-end bg-surface-elevated/50">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from '../stores/library';
import { Palette, X } from 'lucide-vue-next';
import type { PlatformStyle, ThemeMode } from '../types';

defineEmits<{
  (e: 'close'): void;
}>();

const store = useLibraryStore();

const platforms: { id: PlatformStyle; name: string; desc: string }[] = [
  { id: 'windows', name: 'Windows 11 Fluent', desc: 'Mica, Acrylic glass & Segoe UI' },
  { id: 'apple', name: 'Apple Cupertino', desc: 'macOS & iOS frosted glass & SF Pro' },
  { id: 'android', name: 'Android Material 3', desc: 'Tonal elevation & Roboto font' },
  { id: 'linux', name: 'Linux Libadwaita', desc: 'GNOME dark surfaces & Cantarell' },
];

const modes: { id: ThemeMode; name: string }[] = [
  { id: 'dark', name: 'Dark' },
  { id: 'oled', name: 'OLED Black' },
  { id: 'light', name: 'Light' },
];

const presetColors = ['#0078d4', '#0a84ff', '#3584e4', '#d0bcff', '#10b981', '#f59e0b', '#ec4899'];

function setAccent(color: string) {
  document.documentElement.style.setProperty('--accent-primary', color);
}
</script>

