<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-border flex items-center justify-between">
        <div class="flex items-center gap-2">
          <RotateCcw class="w-4 h-4 text-amber-500" />
          <h3 class="text-sm font-semibold text-text-primary">Version Rollback Buffer</h3>
        </div>
        <button
          @click="$emit('close')"
          class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
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
            class="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between"
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
      <div class="px-5 py-3 border-t border-border flex items-center justify-end bg-surface-elevated/50">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-surface-elevated text-text-secondary text-xs font-semibold hover:text-text-primary transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RotateCcw, X } from 'lucide-vue-next';

defineEmits<{
  (e: 'close'): void;
}>();

const snapshots = [
  { id: 'v4.0.0_1793296000000', version: '4.0.0', date: 'Initial SQLite Upgrade' },
];
</script>

