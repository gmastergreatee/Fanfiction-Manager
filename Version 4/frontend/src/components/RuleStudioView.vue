<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
    <!-- Header with 4 Studio Modes -->
    <header class="h-16 px-6 border-b border-border flex items-center justify-between gap-4 bg-surface/50 backdrop-blur-sm shrink-0">
      <div>
        <h2 class="text-sm font-semibold text-text-primary">Rule Studio & Workbench</h2>
        <span class="text-xs text-text-muted">Author, test, and generate extraction rules</span>
      </div>

      <!-- Mode Selector -->
      <div class="flex items-center gap-1.5 bg-surface-elevated/60 p-1 rounded-xl border border-border">
        <button
          v-for="mode in modes"
          :key="mode.id"
          @click="activeMode = mode.id"
          :class="[
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            activeMode === mode.id
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          ]"
        >
          <component :is="mode.icon" class="w-3.5 h-3.5" />
          <span>{{ mode.label }}</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 overflow-y-auto p-6">
      <!-- Mode 1: Visual Tap-to-Select Picker -->
      <div v-if="activeMode === 'picker'" class="max-w-2xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border">
          <h3 class="text-sm font-semibold text-text-primary mb-1">Visual Tap-to-Select Element Picker</h3>
          <p class="text-xs text-text-muted mb-4">
            Enter a target webpage URL. The visual overlay script will inject into the live view, allowing you to tap Title, Cover, and Chapter links to automatically compute CSS selectors.
          </p>

          <div class="flex gap-2">
            <input
              v-model="targetUrl"
              type="url"
              placeholder="https://example.com/novel/novel-title"
              class="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
            />
            <button
              class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm"
            >
              Launch Picker
            </button>
          </div>
        </div>
      </div>

      <!-- Mode 2: AI Rule Assistant (MCP) -->
      <div v-else-if="activeMode === 'mcp'" class="max-w-2xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border">
          <div class="flex items-center gap-2 mb-2">
            <Sparkles class="w-4 h-4 text-accent" />
            <h3 class="text-sm font-semibold text-text-primary">Conversational AI Assistant (MCP)</h3>
          </div>
          <p class="text-xs text-text-muted mb-4">
            Powered by the native Model Context Protocol server (<code class="bg-surface-elevated px-1.5 py-0.5 rounded text-[11px]">stdio / SSE</code>).
            AI agents analyze DOM structure, test extraction in QuickJS sandboxes, and compile complete rules.
          </p>

          <div class="space-y-3">
            <textarea
              v-model="mcpPrompt"
              rows="3"
              placeholder="e.g. Generate a scraping rule for https://www.scribblehub.com/series/12345/my-story/"
              class="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none"
            ></textarea>
            <button
              class="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Wand2 class="w-3.5 h-3.5" />
              <span>Generate Rule via MCP</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mode 3: Community Rule Hub & QR Sync -->
      <div v-else-if="activeMode === 'hub'" class="max-w-3xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border">
          <h3 class="text-sm font-semibold text-text-primary mb-1">Community Verified Rules</h3>
          <p class="text-xs text-text-muted mb-4">
            Install curated rules from the official GitHub repository or scan a QR code to transfer rules directly between your desktop and mobile phone.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="rule in store.rules"
              :key="rule.guid"
              class="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between"
            >
              <div>
                <h4 class="text-xs font-semibold text-text-primary">{{ rule.rule_name }}</h4>
                <code class="text-[10px] text-text-muted">{{ rule.url_regex }}</code>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-accent/20 text-accent font-medium">
                v{{ rule.version }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode 4: Desktop Code Studio & DevTools -->
      <div v-else-if="activeMode === 'code'" class="h-full flex flex-col space-y-4">
        <div class="flex-1 p-5 rounded-2xl bg-surface border border-border flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-text-primary">Advanced Rule Code Editor</h3>
            <span class="text-xs text-text-muted">Desktop Native WebView / Monaco</span>
          </div>
          <div class="flex-1 bg-surface-elevated rounded-xl p-4 font-mono text-xs text-text-secondary overflow-y-auto border border-border">
            <pre>// JavaScript rule extractor code
export function extractTOC(document) {
  const title = document.querySelector('h1.novel-title')?.innerText?.trim();
  const coverUrl = document.querySelector('.novel-cover img')?.getAttribute('src');
  const chapters = Array.from(document.querySelectorAll('.chapter-list a')).map(a => a.href);
  return { title, coverUrl, chapters };
}</pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLibraryStore } from '../stores/library';
import { Touchpad, Sparkles, Share2, Code2, Wand2 } from 'lucide-vue-next';

const store = useLibraryStore();
const activeMode = ref<'picker' | 'mcp' | 'hub' | 'code'>('picker');
const targetUrl = ref('');
const mcpPrompt = ref('');

const modes = [
  { id: 'picker' as const, label: 'Touch Picker', icon: Touchpad },
  { id: 'mcp' as const, label: 'AI Assistant', icon: Sparkles },
  { id: 'hub' as const, label: 'Community Hub', icon: Share2 },
  { id: 'code' as const, label: 'Code Studio', icon: Code2 },
];
</script>

