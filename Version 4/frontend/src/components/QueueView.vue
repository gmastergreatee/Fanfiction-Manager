<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
    <!-- Top Action Header -->
    <header class="h-16 px-6 border-b border-border flex items-center justify-between gap-4 bg-surface/50 backdrop-blur-sm shrink-0 select-none">
      <div class="flex items-center gap-3">
        <DownloadCloud class="w-5 h-5 text-accent" />
        <div>
          <h2 class="text-sm font-semibold text-text-primary">Downloader Queue</h2>
          <span class="text-[11px] text-text-muted">
            {{ activeCount }} active • {{ completedCount }} completed • {{ store.downloadQueue.length }} total
          </span>
        </div>
      </div>

      <!-- Controls: Pause All, Resume All, Clear Completed -->
      <div class="flex items-center gap-2">
        <button
          v-if="!store.queueSettings.isPaused"
          @click="store.pauseQueue()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-medium text-amber-500 transition-colors"
          title="Pause All Downloads"
        >
          <Pause class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Pause All</span>
        </button>

        <button
          v-else
          @click="store.resumeQueue()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-medium text-white transition-colors"
          title="Resume All Downloads"
        >
          <Play class="w-3.5 h-3.5 fill-white" />
          <span class="hidden sm:inline">Resume All</span>
        </button>

        <button
          @click="store.clearCompletedQueue()"
          :disabled="completedCount === 0 && errorCount === 0"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-medium text-text-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Clear Finished & Errored"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Clear Finished</span>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Rate Throttling & Concurrency Toolbar -->
      <div class="p-4 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Gauge class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-xs font-semibold text-text-primary">Polite Scraping & Rate Limits</h3>
            <p class="text-[11px] text-text-muted">Configure concurrent threads and delay to prevent server rate limiting</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-xs">
          <!-- Concurrency -->
          <div class="flex items-center gap-2">
            <span class="text-text-muted">Workers:</span>
            <div class="flex bg-surface-elevated rounded-lg p-0.5 border border-border">
              <button
                v-for="c in [1, 2, 3, 5]"
                :key="c"
                @click="store.setQueueConcurrency(c)"
                :class="[
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                  store.queueSettings.concurrency === c
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                ]"
              >
                {{ c }}x
              </button>
            </div>
          </div>

          <!-- Delay Slider -->
          <div class="flex items-center gap-2">
            <span class="text-text-muted">Delay:</span>
            <select
              :value="store.queueSettings.delayMs"
              @change="(e: any) => store.setQueueDelay(parseInt(e.target.value))"
              class="bg-surface-elevated border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              <option :value="0">0ms (Aggressive)</option>
              <option :value="200">200ms (Fast)</option>
              <option :value="500">500ms (Balanced)</option>
              <option :value="1000">1.0s (Polite)</option>
              <option :value="2000">2.0s (Safe)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Queue Overall Progress Bar -->
      <div v-if="store.downloadQueue.length > 0" class="space-y-1.5 select-none">
        <div class="flex justify-between text-xs text-text-muted">
          <span>Overall Progress ({{ overallPercentage }}%)</span>
          <span>{{ completedCount }} / {{ store.downloadQueue.length }} Chapters</span>
        </div>
        <div class="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border/40">
          <div
            class="bg-accent h-full transition-all duration-300"
            :style="{ width: `${overallPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="store.downloadQueue.length === 0"
        class="p-12 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center select-none"
      >
        <div class="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted mb-3">
          <DownloadCloud class="w-6 h-6 opacity-40" />
        </div>
        <h3 class="text-sm font-semibold text-text-primary mb-1">Queue is Empty</h3>
        <p class="text-xs text-text-muted max-w-sm">
          Select any novel from your Library and click "Download Missing Chapters" to batch fetch chapters.
        </p>
      </div>

      <!-- Task Cards List -->
      <div v-else class="space-y-2.5 select-none">
        <div
          v-for="task in store.downloadQueue"
          :key="task.id"
          class="p-3.5 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-accent/30 transition-colors"
        >
          <!-- Task Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                :class="statusBadgeClasses(task.status)"
              >
                {{ task.status }}
              </span>
              <h4 class="text-xs font-semibold text-text-primary truncate">{{ task.novelTitle }}</h4>
            </div>
            <p class="text-[11px] text-text-muted truncate">
              Ch. {{ task.chapterIndex }}: {{ task.chapterTitle }}
            </p>

            <!-- Per-task Progress Bar -->
            <div class="mt-2 w-full bg-surface-elevated h-1 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-300"
                :class="task.status === 'error' ? 'bg-rose-500' : 'bg-accent'"
                :style="{ width: `${task.progress}%` }"
              ></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              v-if="task.status === 'queued' || task.status === 'downloading' || task.status === 'paused'"
              @click="store.togglePauseTask(task.id)"
              class="p-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-secondary hover:text-text-primary text-xs"
              :title="task.status === 'paused' ? 'Resume' : 'Pause'"
            >
              <Play v-if="task.status === 'paused'" class="w-3.5 h-3.5 text-accent" />
              <Pause v-else class="w-3.5 h-3.5 text-amber-500" />
            </button>

            <button
              @click="store.removeQueueTask(task.id)"
              class="p-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-muted hover:text-rose-500 text-xs"
              title="Remove Task"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLibraryStore } from '../stores/library';
import {
  DownloadCloud,
  Pause,
  Play,
  Trash2,
  Gauge,
  X,
} from 'lucide-vue-next';

const store = useLibraryStore();

const activeCount = computed(() => {
  return store.downloadQueue.filter((t) => t.status === 'downloading' || t.status === 'queued').length;
});

const completedCount = computed(() => {
  return store.downloadQueue.filter((t) => t.status === 'completed').length;
});

const errorCount = computed(() => {
  return store.downloadQueue.filter((t) => t.status === 'error').length;
});

const overallPercentage = computed(() => {
  if (store.downloadQueue.length === 0) return 0;
  return Math.round((completedCount.value / store.downloadQueue.length) * 100);
});

function statusBadgeClasses(status: string) {
  switch (status) {
    case 'downloading':
      return 'bg-accent/15 text-accent animate-pulse';
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-500';
    case 'paused':
      return 'bg-amber-500/15 text-amber-500';
    case 'error':
      return 'bg-rose-500/15 text-rose-500';
    case 'queued':
    default:
      return 'bg-surface-elevated text-text-muted';
  }
}
</script>

