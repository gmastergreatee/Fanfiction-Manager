// Version 4/src/core/queue.js
/**
 * Downloader Queue Manager for Fanfiction Manager Version 4
 * Provides concurrent chapter queue management, polite rate-limiting,
 * pause/resume controls, and event-driven progress reporting.
 */

const EventEmitter = require('events');

class DownloadQueueManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = Math.max(1, Math.min(10, options.concurrency || 2));
    this.delayMs = Math.max(0, options.delayMs || 300);
    this.isPaused = !!options.isPaused;

    // Queue storage
    this.queue = []; // Array of tasks
    this.activeWorkers = 0;
    this.isProcessing = false;
  }

  /**
   * Set concurrency level (number of simultaneous downloads)
   */
  setConcurrency(val) {
    this.concurrency = Math.max(1, Math.min(10, parseInt(val, 10) || 2));
    this.emit('settings-changed', this.getSettings());
    this._processNext();
  }

  /**
   * Set delay in ms between downloads per worker (polite scraping)
   */
  setDelay(ms) {
    this.delayMs = Math.max(0, parseInt(ms, 10) || 0);
    this.emit('settings-changed', this.getSettings());
  }

  /**
   * Get current queue settings
   */
  getSettings() {
    return {
      concurrency: this.concurrency,
      delayMs: this.delayMs,
      isPaused: this.isPaused,
    };
  }

  /**
   * Add a download task or batch of tasks
   */
  addTask(task) {
    const existing = this.queue.find(
      (t) => t.novelId === task.novelId && t.chapterIndex === task.chapterIndex
    );
    if (existing) {
      if (existing.status === 'completed') return existing;
      if (existing.status === 'error') {
        existing.status = 'queued';
        existing.progress = 0;
        existing.errorMessage = undefined;
      }
      this._processNext();
      return existing;
    }

    const newTask = {
      id: task.id || `${task.novelId}_ch_${task.chapterIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      novelId: task.novelId,
      novelTitle: task.novelTitle || 'Unknown Novel',
      chapterIndex: task.chapterIndex,
      chapterTitle: task.chapterTitle || `Chapter ${task.chapterIndex}`,
      sourceUrl: task.sourceUrl || '',
      status: 'queued', // queued | downloading | paused | completed | error
      progress: 0,
      errorMessage: null,
      addedAt: Date.now(),
      completedAt: null,
      fetchFn: task.fetchFn || null,
    };

    this.queue.push(newTask);
    this.emit('task-added', newTask);
    this._processNext();
    return newTask;
  }

  addBatch(tasks) {
    const added = [];
    for (const t of tasks) {
      added.push(this.addTask(t));
    }
    return added;
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.isPaused = true;
    for (const t of this.queue) {
      if (t.status === 'queued') {
        t.status = 'paused';
      }
    }
    this.emit('paused');
    this.emit('settings-changed', this.getSettings());
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.isPaused = false;
    for (const t of this.queue) {
      if (t.status === 'paused') {
        t.status = 'queued';
      }
    }
    this.emit('resumed');
    this.emit('settings-changed', this.getSettings());
    this._processNext();
  }

  /**
   * Pause a specific task
   */
  pauseTask(taskId) {
    const task = this.queue.find((t) => t.id === taskId);
    if (task && (task.status === 'queued' || task.status === 'downloading')) {
      task.status = 'paused';
      this.emit('task-updated', task);
    }
  }

  /**
   * Resume a specific task
   */
  resumeTask(taskId) {
    const task = this.queue.find((t) => t.id === taskId);
    if (task && task.status === 'paused') {
      task.status = 'queued';
      this.emit('task-updated', task);
      this._processNext();
    }
  }

  /**
   * Cancel or remove a task
   */
  removeTask(taskId) {
    const idx = this.queue.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const [removed] = this.queue.splice(idx, 1);
      this.emit('task-removed', removed);
      return removed;
    }
    return null;
  }

  /**
   * Clear all completed or errored tasks
   */
  clearCompleted() {
    this.queue = this.queue.filter((t) => t.status !== 'completed' && t.status !== 'error');
    this.emit('queue-cleared');
  }

  /**
   * Get queue snapshot & statistics
   */
  getSnapshot() {
    const total = this.queue.length;
    const queued = this.queue.filter((t) => t.status === 'queued').length;
    const downloading = this.queue.filter((t) => t.status === 'downloading').length;
    const paused = this.queue.filter((t) => t.status === 'paused').length;
    const completed = this.queue.filter((t) => t.status === 'completed').length;
    const error = this.queue.filter((t) => t.status === 'error').length;

    const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      tasks: this.queue.map((t) => ({
        id: t.id,
        novelId: t.novelId,
        novelTitle: t.novelTitle,
        chapterIndex: t.chapterIndex,
        chapterTitle: t.chapterTitle,
        sourceUrl: t.sourceUrl,
        status: t.status,
        progress: t.progress,
        errorMessage: t.errorMessage,
        addedAt: t.addedAt,
        completedAt: t.completedAt,
      })),
      stats: {
        total,
        queued,
        downloading,
        paused,
        completed,
        error,
        overallProgress,
      },
      settings: this.getSettings(),
    };
  }

  /**
   * Internal queue worker dispatcher
   */
  async _processNext() {
    if (this.isPaused) return;

    while (this.activeWorkers < this.concurrency) {
      const nextTask = this.queue.find((t) => t.status === 'queued');
      if (!nextTask) break;

      this.activeWorkers++;
      this._runTask(nextTask).finally(() => {
        this.activeWorkers--;
        this._processNext();
      });
    }
  }

  /**
   * Execute an individual download task with rate delay and error handling
   */
  async _runTask(task) {
    if (this.isPaused || task.status !== 'queued') {
      return;
    }

    task.status = 'downloading';
    task.progress = 10;
    this.emit('task-started', task);
    this.emit('task-updated', task);

    try {
      if (this.delayMs > 0) {
        await new Promise((res) => setTimeout(res, this.delayMs));
      }

      if (this.isPaused || task.status === 'paused') {
        task.status = 'paused';
        this.emit('task-updated', task);
        return;
      }

      // Execute custom fetch function if provided, or return mock success
      if (typeof task.fetchFn === 'function') {
        task.progress = 50;
        this.emit('task-updated', task);
        await task.fetchFn(task);
      }

      task.status = 'completed';
      task.progress = 100;
      task.completedAt = Date.now();
      this.emit('task-completed', task);
      this.emit('task-updated', task);
    } catch (err) {
      task.status = 'error';
      task.errorMessage = err.message || 'Download failed';
      this.emit('task-error', task, err);
      this.emit('task-updated', task);
    }
  }
}

module.exports = DownloadQueueManager;

