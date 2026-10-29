<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div
      :class="[
        'w-full max-w-lg overflow-hidden flex flex-col transition-all duration-200',
        modalContainerClass
      ]"
    >
      <!-- Header -->
      <div :class="['px-5 py-4 flex items-center justify-between shrink-0', modalHeaderClass]">
        <div class="flex items-center gap-2">
          <Palette class="w-4 h-4 text-accent" />
          <h3 :class="modalTitleClass">Theme Studio & Customizer</h3>
        </div>
        <button
          @click="$emit('close')"
          :class="modalCloseBtnClass"
          title="Close"
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
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="platform in platforms"
              :key="platform.id"
              @click="store.setPlatform(platform.id)"
              :class="[
                'p-3.5 text-left flex flex-col gap-1 transition-all',
                modalCardClass,
                store.platformStyle === platform.id ? activePlatformBorder : ''
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-text-primary">{{ platform.name }}</span>
                <span
                  v-if="store.platformStyle === platform.id"
                  class="w-2 h-2 rounded-full bg-accent"
                ></span>
              </div>
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
                'py-2 px-3 text-xs font-semibold text-center transition-all',
                modalSecondaryBtnClass,
                store.themeMode === mode.id ? '!bg-accent !text-white shadow-sm !border-accent' : ''
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
      <div :class="['px-5 py-3 flex items-center justify-end shrink-0', modalFooterClass]">
        <button
          @click="$emit('close')"
          :class="['text-xs', modalPrimaryBtnClass]"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Palette, X } from 'lucide-vue-next';
import { usePlatformModal } from '../composables/usePlatformModal';
import type { PlatformStyle, ThemeMode } from '../types';

defineEmits<{
  (e: 'close'): void;
}>();

const {
  store,
  modalContainerClass,
  modalHeaderClass,
  modalFooterClass,
  modalTitleClass,
  modalCloseBtnClass,
  modalCardClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} = usePlatformModal();

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

const activePlatformBorder = computed(() => {
  switch (store.platformStyle) {
    case 'windows':
      return '!border-accent !bg-accent/15 ring-1 ring-accent';
    case 'apple':
      return '!border-[#007aff] !bg-[#007aff]/20 ring-1 ring-[#007aff] shadow-sm';
    case 'android':
      return '!border-accent !bg-accent/20 ring-2 ring-accent';
    case 'linux':
    default:
      return '!border-[#3584e4] !bg-[#3584e4]/25 ring-1 ring-[#3584e4]';
  }
});

function setAccent(color: string) {
  document.documentElement.style.setProperty('--accent-primary', color);
}
</script>
