<template>
  <div class="h-screen w-screen flex flex-col md:flex-row bg-canvas text-text-primary overflow-hidden select-none">
    <!-- Desktop Sidebar (Hidden when in Reader mode) -->
    <Sidebar
      v-if="store.activeTab !== 'reader'"
      @open-theme-studio="showThemeStudio = true"
      @open-rollback="showRollback = true"
    />

    <!-- Main Viewport -->
    <div class="flex-1 flex flex-col h-full overflow-hidden relative">
      <!-- Library Grid -->
      <NovelGrid v-if="store.activeTab === 'library'" />

      <!-- Rules View -->
      <div v-else-if="store.activeTab === 'rules'" class="flex-1 p-6 overflow-y-auto">
        <h2 class="text-base font-semibold mb-4">Site Scraping Rules</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="rule in store.rules"
            :key="rule.guid"
            class="p-4 rounded-2xl bg-surface border border-border flex flex-col"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold text-text-primary">{{ rule.rule_name }}</h3>
              <span class="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                {{ rule.parser_type }}
              </span>
            </div>
            <code class="text-xs text-text-muted font-mono bg-surface-elevated p-2 rounded-lg break-all">
              {{ rule.url_regex }}
            </code>
          </div>
        </div>
      </div>

      <!-- Rule Studio View -->
      <RuleStudioView v-else-if="store.activeTab === 'studio'" />

      <!-- Downloader Queue View -->
      <QueueView v-else-if="store.activeTab === 'queue'" />

      <!-- Reader Mode -->
      <ReaderView v-else-if="store.activeTab === 'reader'" />
    </div>

    <!-- Mobile Bottom Navigation (Hidden when in Reader mode) -->
    <BottomNav
      v-if="store.activeTab !== 'reader'"
      @open-theme-studio="showThemeStudio = true"
    />

    <!-- Modals & Drawers -->
    <NovelDetailModal />
    <ThemeStudioModal v-if="showThemeStudio" @close="showThemeStudio = false" />
    <RollbackModal v-if="showRollback" @close="showRollback = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLibraryStore } from './stores/library';
import Sidebar from './components/Sidebar.vue';
import BottomNav from './components/BottomNav.vue';
import NovelGrid from './components/NovelGrid.vue';
import ReaderView from './components/ReaderView.vue';
import RuleStudioView from './components/RuleStudioView.vue';
import QueueView from './components/QueueView.vue';
import NovelDetailModal from './components/NovelDetailModal.vue';
import ThemeStudioModal from './components/ThemeStudioModal.vue';
import RollbackModal from './components/RollbackModal.vue';
import type { Novel, Rule } from './types';

const store = useLibraryStore();
const showThemeStudio = ref(false);
const showRollback = ref(false);

onMounted(async () => {
  // Check if running in Tauri 2.0 runtime
  if (window.__TAURI_INTERNALS__) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const novels = await invoke<Novel[]>('get_all_novels');
      const rules = await invoke<Rule[]>('get_all_rules');
      store.setNovels(novels);
      store.setRules(rules);
      return;
    } catch (e) {
      console.warn('Tauri IPC command failed, falling back to local storage/node bridge:', e);
    }
  }

  // Fallback for Electron / Browser preview
  const sampleNovels: Novel[] = [
    {
      id: '0e229d89-3901-4770-ade3-d0f16b6376f2',
      title: 'DC: All for One',
      author: 'Original Author',
      cover_url: '',
      cover_local_path: 'covers/0e229d89-3901-4770-ade3-d0f16b6376f2.png',
      summary: 'Ethan Kane never felt human until one violent moment changed everything. He discovered his innate ability...',
      source_url: 'https://example.com/novel/dc-all-for-one',
      total_chapters: 90,
      downloaded_chapters: 90,
      check_updates: true,
    },
    {
      id: '81bd638a-d669-4d47-96e7-141dfb470eb6',
      title: 'One Piece: With Sign-in System',
      author: 'Unknown',
      cover_url: '',
      cover_local_path: 'covers/81bd638a-d669-4d47-96e7-141dfb470eb6.png',
      summary: 'Traversing the world of One Piece with an almighty sign-in check-in system.',
      source_url: 'https://example.com/novel/one-piece-sign-in',
      total_chapters: 256,
      downloaded_chapters: 256,
      check_updates: true,
    },
    {
      id: '052a3ee0-507f-4e6b-8473-3d479d7d2c62',
      title: 'Marvel: The Iron Magus',
      author: 'Stan Lee Legacy',
      cover_url: '',
      cover_local_path: 'covers/052a3ee0-507f-4e6b-8473-3d479d7d2c62.png',
      summary: 'Tony Stark learns mystical sorcery from the Ancient One alongside Stephen Strange.',
      source_url: 'https://example.com/novel/iron-magus',
      total_chapters: 142,
      downloaded_chapters: 142,
      check_updates: true,
    },
    {
      id: 'da0c4034-e5e2-45f9-956e-396669583771',
      title: 'Harry Potter and the Methods of Rationality',
      author: 'Eliezer Yudkowsky',
      cover_url: '',
      cover_local_path: 'covers/da0c4034-e5e2-45f9-956e-396669583771.png',
      summary: 'Petunia married an Oxford professor of biochemistry, and Harry grew up reading science and science fiction.',
      source_url: 'https://hpmor.com',
      total_chapters: 122,
      downloaded_chapters: 122,
      check_updates: false,
    },
  ];

  const sampleRules: Rule[] = [
    { guid: '1', rule_name: 'WebNovel.com', url_regex: 'webnovel\\.com\\/book\\/.*', parser_type: 'headless', version: 3 },
    { guid: '2', rule_name: 'RoyalRoad.com', url_regex: 'royalroad\\.com\\/fiction\\/.*', parser_type: 'headless', version: 2 },
    { guid: '3', rule_name: 'ArchiveOfOurOwn (AO3)', url_regex: 'archiveofourown\\.org\\/works\\/.*', parser_type: 'headless', version: 4 },
    { guid: '4', rule_name: 'FanFiction.net', url_regex: 'fanfiction\\.net\\/s\\/.*', parser_type: 'webview', version: 5 },
    { guid: '5', rule_name: 'ScribbleHub.com', url_regex: 'scribblehub\\.com\\/series\\/.*', parser_type: 'headless', version: 2 },
  ];

  store.setNovels(sampleNovels);
  store.setRules(sampleRules);
});
</script>

