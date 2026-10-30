<template>
  <div
    :class="[
      'h-screen w-screen flex flex-col bg-canvas text-text-primary overflow-hidden select-none',
      appFrameClass
    ]"
    :data-platform="store.platformStyle"
  >
    <!-- Native Window Titlebar & Platform Chrome (Hidden in Reader mode) -->
    <TitleBar
      v-if="store.activeTab !== 'reader'"
      @open-theme-studio="showThemeStudio = true"
    />

    <!-- Main Workspace Container -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden relative">
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
          <div class="max-w-5xl mx-auto space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-text-primary">Site Scraping Rules</h2>
                <p class="text-xs text-text-muted mt-0.5">Extraction definitions for multi-tier headless and webview scraping.</p>
              </div>
              <button
                @click="store.activeTab = 'studio'"
                class="px-3.5 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shadow-sm"
              >
                Open Rule Studio
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="rule in store.rules"
                :key="rule.guid"
                class="p-4 rounded-xl bg-surface border border-border flex flex-col hover:border-accent/40 transition-colors shadow-xs"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-text-primary">{{ rule.rule_name }}</h3>
                  <span class="text-[10px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-md font-mono uppercase">
                    {{ rule.parser_type }}
                  </span>
                </div>
                <code class="text-xs text-text-muted font-mono bg-surface-elevated p-2 rounded-lg break-all">
                  {{ rule.url_regex }}
                </code>
                <div class="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                  <span class="text-[10px] text-text-muted font-mono">v{{ rule.version || 1 }}</span>
                  <div class="flex items-center gap-1.5">
                    <button
                      @click="handleOpenRuleInWebview(rule)"
                      class="px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Open Webview for testing this rule"
                    >
                      <Globe class="w-3 h-3" />
                      <span>Webview</span>
                    </button>
                    <button
                      @click="store.openRuleInTester(rule)"
                      class="px-2.5 py-1 rounded-lg bg-accent/15 hover:bg-accent text-accent hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Open this rule in Extraction Rule Tester Workbench"
                    >
                      <Play class="w-3 h-3 fill-current" />
                      <span>Open in Tester</span>
                    </button>
                  </div>
                </div>
              </div>
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
        v-if="store.activeTab !== 'reader' && store.platformStyle === 'android'"
        @open-theme-studio="showThemeStudio = true"
      />
    </div>

    <!-- Modals & Drawers -->
    <NovelDetailModal />
    <ThemeStudioModal v-if="showThemeStudio" @close="showThemeStudio = false" />
    <RollbackModal v-if="showRollback" @close="showRollback = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Play, Globe } from 'lucide-vue-next';
import { useLibraryStore } from './stores/library';
import TitleBar from './components/TitleBar.vue';
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

const appFrameClass = computed(() => {
  switch (store.platformStyle) {
    case 'windows':
      return 'border border-white/10';
    case 'apple':
      return 'border border-white/15';
    case 'linux':
      return 'border border-white/10';
    case 'android':
    default:
      return 'border border-white/5';
  }
});

function handleOpenRuleInWebview(rule: Rule) {
  store.openRuleInTester(rule);
  const match = store.novels.find((n) => {
    try {
      return new RegExp(rule.url_regex).test(n.source_url);
    } catch {
      return false;
    }
  });
  const target = match?.source_url || (rule.url_regex.includes('webnovel') ? 'https://www.webnovel.com' : 'https://www.royalroad.com');
  store.openTestWebview(target, `Fanfiction Manager - Webview (${rule.rule_name})`);
}

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
      author: 'Web Novel',
      cover_url: '',
      cover_local_path: '/covers/0e229d89-3901-4770-ade3-d0f16b6376f2.png',
      summary: 'Ethan Kane never felt human. He studied people the way others studied equations...',
      source_url: 'https://www.webnovel.com/book/dc-all-for-one_35753547900730105',
      rule_guid: '4795a493-2a6e-4234-8dec-307b06129cd6',
      total_chapters: 90,
      downloaded_chapters: 90,
      check_updates: true,
    },
    {
      id: '052a3ee0-507f-4e6b-8473-3d479d7d2c62',
      title: 'Naruto: I Traveled with a Max Level Account',
      author: '萌音芊芊 (Mengyin Qianqian)',
      cover_url: '',
      cover_local_path: '/covers/052a3ee0-507f-4e6b-8473-3d479d7d2c62.png',
      summary: 'Takuya accidentally travels to the world of Naruto with a max-level game account...',
      source_url: 'https://www.webnovel.com/book/naruto-i-traveled-with-a-max-level-account_30396090005426505',
      rule_guid: '4795a493-2a6e-4234-8dec-307b06129cd6',
      total_chapters: 374,
      downloaded_chapters: 368,
      check_updates: true,
    },
  ];

  const sampleRules: Rule[] = [
    {
      guid: '4795a493-2a6e-4234-8dec-307b06129cd6',
      rule_name: 'WebNovel.com Headless Rule',
      url_regex: 'https?:\\/\\/(?:www\\.)?webnovel\\.com\\/book\\/.*',
      parser_type: 'headless',
      version: 1,
    },
    {
      guid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      rule_name: 'Fanfiction.net Fast-Path',
      url_regex: 'https?:\\/\\/(?:www\\.)?fanfiction\\.net\\/s\\/.*',
      parser_type: 'headless',
      version: 1,
    },
  ];

  store.setNovels(sampleNovels);
  store.setRules(sampleRules);
});
</script>
