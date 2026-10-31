<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
    <!-- Top Action Header -->
    <header class="h-16 px-6 border-b border-border flex items-center justify-between gap-4 bg-surface/50 backdrop-blur-sm shrink-0 select-none">
      <div class="flex items-center gap-3">
        <DownloadCloud class="w-5 h-5 text-accent" />
        <div>
          <h2 class="text-sm font-semibold text-text-primary">Downloader Queue</h2>
          <span class="text-[11px] text-text-muted">
            {{ activeBatchesCount }} active batch{{ activeBatchesCount === 1 ? '' : 'es' }} • {{ completedBatchesCount }} completed • {{ totalChaptersInQueue }} chapters total
          </span>
        </div>
      </div>

      <!-- Controls: Pause All, Resume All, Clear Completed -->
      <div class="flex items-center gap-2">
        <button
          v-if="!store.queueSettings.isPaused"
          @click="store.pauseQueue()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-medium text-amber-500 transition-colors cursor-pointer"
          title="Pause All Downloads"
        >
          <Pause class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Pause All</span>
        </button>

        <button
          v-else
          @click="store.resumeQueue()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-xs font-medium text-white transition-colors cursor-pointer"
          title="Resume All Downloads"
        >
          <Play class="w-3.5 h-3.5 fill-white" />
          <span class="hidden sm:inline">Resume All</span>
        </button>

        <button
          @click="store.clearCompletedQueue()"
          :disabled="completedBatchesCount === 0"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border text-xs font-medium text-text-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Clear Finished Batches"
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
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer',
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
      <div v-if="store.downloadBatches.length > 0" class="space-y-1.5 select-none">
        <div class="flex justify-between text-xs text-text-muted">
          <span>Overall Batch Queue Progress ({{ overallPercentage }}%)</span>
          <span>{{ completedChaptersTotal }} / {{ totalChaptersInQueue }} Chapters</span>
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
        v-if="store.downloadBatches.length === 0"
        class="p-12 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center select-none"
      >
        <div class="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted mb-3">
          <DownloadCloud class="w-6 h-6 opacity-40" />
        </div>
        <h3 class="text-sm font-semibold text-text-primary mb-1">Queue is Empty</h3>
        <p class="text-xs text-text-muted max-w-sm">
          Select any novel from your Library and click "Download Missing Chapters" to batch fetch chapters in continuous groups.
        </p>
      </div>

      <!-- Batch Cards List (Continuous Chapters are Batched into a Single Entry) -->
      <div v-else class="space-y-4 select-none">
        <div
          v-for="batch in store.downloadBatches"
          :key="batch.id"
          class="p-4 rounded-2xl bg-surface border border-border space-y-3.5 transition-all hover:border-accent/30"
        >
          <!-- Batch Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 flex-wrap min-w-0">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                :class="statusBadgeClasses(batch.status)"
              >
                {{ batch.status }}
              </span>
              <h4 class="text-sm font-bold text-text-primary truncate">
                {{ batch.novelTitle }}
              </h4>
              <span class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-text-secondary">
                Batch: Ch. {{ batch.startChapter }} – {{ batch.endChapter }} ({{ batch.totalChapters }} chapters)
              </span>
            </div>

            <!-- Batch Action Controls -->
            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <!-- Pause / Resume Batch -->
              <button
                v-if="batch.status === 'queued' || batch.status === 'downloading'"
                @click="store.pauseBatch(batch.id)"
                class="p-1.5 rounded-lg bg-surface-elevated hover:bg-border text-amber-500 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Pause Batch"
              >
                <Pause class="w-3.5 h-3.5" />
                <span class="text-[11px] font-medium hidden md:inline">Pause</span>
              </button>
              <button
                v-else-if="batch.status === 'paused'"
                @click="store.resumeBatch(batch.id)"
                class="p-1.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Resume Batch"
              >
                <Play class="w-3.5 h-3.5 fill-white" />
                <span class="text-[11px] font-medium hidden md:inline">Resume</span>
              </button>

              <!-- Retry Errored Chapters -->
              <button
                v-if="batch.failedChapters > 0"
                @click="store.retryBatchErrors(batch.id)"
                class="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Retry Failed Chapters"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span class="text-[11px] font-medium hidden md:inline">Retry ({{ batch.failedChapters }})</span>
              </button>

              <!-- Expand / Collapse Chapters Drawer -->
              <button
                @click="store.toggleExpandBatch(batch.id)"
                class="p-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-secondary hover:text-text-primary text-xs flex items-center gap-1 cursor-pointer transition-colors"
                :title="batch.isExpanded ? 'Hide Details' : 'Show Chapter Details'"
              >
                <component :is="batch.isExpanded ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
                <span class="text-[11px] font-medium hidden md:inline">{{ batch.isExpanded ? 'Collapse' : 'Details' }}</span>
              </button>

              <!-- Delete / Remove Batch -->
              <button
                @click="store.removeBatch(batch.id)"
                class="p-1.5 rounded-lg bg-surface-elevated hover:bg-border text-text-muted hover:text-rose-500 text-xs cursor-pointer transition-colors"
                title="Remove Batch from Queue"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Aggregate Progress Bar -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-muted">
                {{ batch.completedChapters }} of {{ batch.totalChapters }} chapters completed
              </span>
              <span class="font-bold text-text-primary">
                {{ Math.round((batch.completedChapters / (batch.totalChapters || 1)) * 100) }}%
              </span>
            </div>
            <div class="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border/40">
              <div
                class="h-full transition-all duration-300"
                :class="batch.status === 'error' && batch.completedChapters === 0 ? 'bg-rose-500' : 'bg-accent'"
                :style="{ width: `${Math.round((batch.completedChapters / (batch.totalChapters || 1)) * 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Batch Live Sub-Status -->
          <div class="flex items-center justify-between text-xs text-text-muted pt-0.5">
            <div class="flex items-center gap-2 truncate">
              <span v-if="batch.status === 'downloading'" class="text-accent flex items-center gap-1.5 font-medium truncate">
                <Loader2 class="w-3.5 h-3.5 animate-spin shrink-0" />
                <span class="truncate">Currently downloading: Ch. {{ batch.activeChapterIndex }} - {{ batch.activeChapterTitle || '' }}</span>
              </span>
              <span v-else-if="batch.status === 'completed'" class="text-emerald-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
                <span>All {{ batch.totalChapters }} chapters downloaded successfully</span>
              </span>
              <span v-else-if="batch.status === 'paused'" class="text-amber-500 flex items-center gap-1.5 font-medium">
                <Pause class="w-3.5 h-3.5 shrink-0" />
                <span>Batch download paused</span>
              </span>
              <span v-else-if="batch.status === 'error'" class="text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                <span>{{ batch.failedChapters }} chapter(s) failed to download</span>
              </span>
              <span v-else class="text-text-muted">
                Queued • Waiting for available worker
              </span>
            </div>

            <span v-if="batch.failedChapters > 0" class="text-rose-400 text-[11px] font-semibold shrink-0 ml-2">
              {{ batch.failedChapters }} Failed
            </span>
          </div>

          <!-- Expandable Chapter Breakdown Drawer -->
          <div
            v-if="batch.isExpanded"
            class="pt-3 border-t border-border/60 space-y-1.5 animate-in fade-in duration-150"
          >
            <div class="flex items-center justify-between text-[11px] text-text-muted mb-2 px-1">
              <span>Chapter Breakdown ({{ batch.tasks.length }} items)</span>
              <span>Individual Status</span>
            </div>

            <div class="max-h-56 overflow-y-auto space-y-1.5 pr-1.5">
              <div
                v-for="task in batch.tasks"
                :key="task.id"
                class="px-3 py-2 rounded-xl bg-surface-elevated/70 border border-border/40 flex items-center justify-between text-xs hover:border-accent/30 transition-colors"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    :class="statusBadgeClasses(task.status)"
                  >
                    {{ task.status }}
                  </span>
                  <span class="font-medium text-text-primary truncate">
                    Ch. {{ task.chapterIndex }}: {{ task.chapterTitle }}
                  </span>
                </div>

                <div class="flex items-center gap-2 shrink-0 ml-2">
                  <span v-if="task.status === 'downloading'" class="text-[10px] text-accent font-semibold flex items-center gap-1">
                    <Loader2 class="w-3 h-3 animate-spin" />
                    <span>{{ task.progress }}%</span>
                  </span>
                  <span v-else-if="task.status === 'completed'" class="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 class="w-3 h-3" />
                    <span>Ready</span>
                  </span>
                  <span v-else-if="task.status === 'error'" class="text-[10px] text-rose-400 font-semibold truncate max-w-[120px]" :title="task.errorMessage || 'Error'">
                    Failed
                  </span>

                  <!-- Individual Task Pause/Resume -->
                  <button
                    v-if="task.status === 'queued' || task.status === 'paused'"
                    @click="store.togglePauseTask(task.id)"
                    class="p-1 rounded bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-[10px]"
                    :title="task.status === 'paused' ? 'Resume Chapter' : 'Pause Chapter'"
                  >
                    <Play v-if="task.status === 'paused'" class="w-3 h-3 text-accent" />
                    <Pause v-else class="w-3 h-3 text-amber-500" />
                  </button>

                  <!-- Remove single task -->
                  <button
                    @click="store.removeQueueTask(task.id)"
                    class="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-rose-500 text-[10px]"
                    title="Remove from batch"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
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
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next';

const store = useLibraryStore();

const activeBatchesCount = computed(() => {
  return store.downloadBatches.filter((b) => b.status === 'downloading' || b.status === 'queued').length;
});

const completedBatchesCount = computed(() => {
  return store.downloadBatches.filter((b) => b.status === 'completed').length;
});

const totalChaptersInQueue = computed(() => {
  return store.downloadBatches.reduce((acc, b) => acc + b.totalChapters, 0);
});

const completedChaptersTotal = computed(() => {
  return store.downloadBatches.reduce((acc, b) => acc + b.completedChapters, 0);
});

const overallPercentage = computed(() => {
  if (totalChaptersInQueue.value === 0) return 0;
  return Math.round((completedChaptersTotal.value / totalChaptersInQueue.value) * 100);
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
