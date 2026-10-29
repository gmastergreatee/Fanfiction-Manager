<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div
      :class="[
        'w-full max-w-md overflow-hidden flex flex-col transition-all duration-200',
        modalContainerClass
      ]"
    >
      <!-- Header -->
      <div :class="['px-5 py-4 flex items-center justify-between shrink-0', modalHeaderClass]">
        <div class="flex items-center gap-2">
          <RotateCcw class="w-4 h-4 text-amber-500" />
          <h3 :class="modalTitleClass">Version Rollback Buffer</h3>
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
      <div class="p-5 space-y-4">
        <p class="text-xs text-text-muted">
          Fanfiction Manager automatically snapshots your code and database before every update (retaining a strict 3-version ring buffer).
          If a regression occurs, you can revert instantly.
        </p>

        <div class="space-y-2">
          <div
            v-for="snap in snapshots"
            :key="snap.id"
            :class="['p-3.5 flex items-center justify-between', modalCardClass]"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-text-primary">Version {{ snap.version }}</span>
                <span class="text-[10px] text-text-muted">{{ snap.date }}</span>
              </div>
              <span class="text-[11px] text-text-muted font-mono">{{ snap.id }}</span>
            </div>

            <button
              class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white text-xs font-semibold transition-colors"
            >
              Restore
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div :class="['px-5 py-3 flex items-center justify-end shrink-0', modalFooterClass]">
        <button
          @click="$emit('close')"
          :class="['text-xs', modalSecondaryBtnClass]"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw, X } from 'lucide-vue-next';
import { usePlatformModal } from '../composables/usePlatformModal';

defineEmits<{
  (e: 'close'): void;
}>();

const {
  modalContainerClass,
  modalHeaderClass,
  modalFooterClass,
  modalTitleClass,
  modalCloseBtnClass,
  modalCardClass,
  modalSecondaryBtnClass,
} = usePlatformModal();

const snapshots = [
  { id: 'v4.0.0_1793296000000', version: '4.0.0', date: 'Initial SQLite Upgrade' },
];
</script>
