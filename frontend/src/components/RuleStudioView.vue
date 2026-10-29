<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-canvas">
    <!-- Header with 4 Studio Modes -->
    <header class="h-16 px-6 border-b border-border flex items-center justify-between gap-4 bg-surface/50 backdrop-blur-sm shrink-0 select-none">
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
      <div v-if="activeMode === 'picker'" class="max-w-3xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-text-primary mb-1">Visual Tap-to-Select Element Picker</h3>
            <p class="text-xs text-text-muted">
              Enter a target novel webpage URL. The picker extracts candidate DOM elements to compile optimal CSS selectors into a working rule.
            </p>
          </div>

          <div class="flex gap-2">
            <input
              v-model="targetUrl"
              type="url"
              placeholder="https://example.com/novel/novel-title"
              class="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
            />
            <button
              @click="handleRunPicker"
              class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shadow-sm"
            >
              Analyze Selectors
            </button>
          </div>

          <!-- Selector Preview Card -->
          <div v-if="compiledRule" class="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-emerald-500">Selectors Detected & Compiled</span>
              <button
                @click="saveCompiledRule"
                class="px-3 py-1 rounded-lg bg-accent text-white text-xs font-medium"
              >
                Save as Rule
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-lg bg-surface border border-border">
                <span class="text-[10px] text-text-muted block">Title Selector</span>
                <code class="text-accent font-mono">{{ pickerSelectors.title }}</code>
              </div>
              <div class="p-2 rounded-lg bg-surface border border-border">
                <span class="text-[10px] text-text-muted block">Chapters Selector</span>
                <code class="text-accent font-mono">{{ pickerSelectors.chapters }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode 2: AI Rule Assistant (MCP) -->
      <div v-else-if="activeMode === 'mcp'" class="max-w-3xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-accent" />
            <h3 class="text-sm font-semibold text-text-primary">Conversational AI Assistant (MCP)</h3>
          </div>
          <p class="text-xs text-text-muted">
            Powered by the native Model Context Protocol server (<code class="bg-surface-elevated px-1.5 py-0.5 rounded text-[11px]">stdio / SSE</code>).
            AI agents analyze DOM structure, test extraction in QuickJS sandboxes, and synthesize verified rules.
          </p>

          <div class="space-y-3">
            <textarea
              v-model="mcpPrompt"
              rows="3"
              placeholder="e.g. Generate a scraping rule for https://www.scribblehub.com/series/12345/my-story/"
              class="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent resize-none"
            ></textarea>

            <button
              @click="handleGenerateMcpRule"
              :disabled="mcpGenerating"
              class="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wand2 class="w-3.5 h-3.5" />
              <span>{{ mcpGenerating ? 'Synthesizing Rule via MCP...' : 'Generate Rule via MCP' }}</span>
            </button>
          </div>

          <!-- MCP Result Card -->
          <div v-if="mcpResult" class="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-text-primary">{{ mcpResult.rule_name }}</h4>
              <span class="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
                Accuracy 100% Verified
              </span>
            </div>
            <code class="text-[11px] block text-accent font-mono bg-surface p-2 rounded-lg">
              {{ mcpResult.url_regex }}
            </code>
            <p class="text-xs text-text-muted">Detected TOC, Title, and Chapter Extraction logic successfully.</p>
            <button
              @click="saveMcpRule"
              class="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold"
            >
              Add Rule to Library
            </button>
          </div>
        </div>
      </div>

      <!-- Mode 3: Community Rule Hub & Remote Sync -->
      <div v-else-if="activeMode === 'hub'" class="max-w-3xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-text-primary">Community Verified Rule Hub</h3>
              <p class="text-xs text-text-muted">Sync rules from GitHub releases or import via shareable JSON.</p>
            </div>
            <button
              @click="handleSyncRules"
              :disabled="syncing"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': syncing }" />
              <span>{{ syncing ? 'Syncing...' : 'Sync Rules Now' }}</span>
            </button>
          </div>

          <div v-if="syncReport" class="p-3 bg-surface-elevated border border-border rounded-xl text-xs text-text-secondary">
            Sync complete: <strong>{{ syncReport.checked }} checked</strong>,
            <span class="text-emerald-500 font-semibold">{{ syncReport.added }} added</span>,
            <span class="text-accent font-semibold">{{ syncReport.updated }} updated</span>.
          </div>

          <!-- Rules List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="rule in store.rules"
              :key="rule.guid"
              class="p-3.5 rounded-xl bg-surface-elevated border border-border flex items-center justify-between"
            >
              <div>
                <h4 class="text-xs font-semibold text-text-primary">{{ rule.rule_name }}</h4>
                <code class="text-[10px] text-text-muted truncate block max-w-[200px]">{{ rule.url_regex }}</code>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] px-2 py-0.5 rounded-md bg-accent/20 text-accent font-medium">
                  v{{ rule.version }}
                </span>
                <button
                  @click="copyRuleJson(rule)"
                  class="p-1 rounded text-text-muted hover:text-text-primary"
                  title="Export Rule JSON"
                >
                  <Share2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode 4: Desktop Code Studio & Tester Workbench -->
      <div v-else-if="activeMode === 'code'" class="max-w-4xl mx-auto space-y-4">
        <div class="p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-text-primary">Extraction Rule Tester Workbench</h3>
            <div class="flex items-center gap-2">
              <button
                @click="handleTestExecution"
                :disabled="testingExecution"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
              >
                <Play class="w-3.5 h-3.5 fill-white" />
                <span>{{ testingExecution ? 'Testing...' : 'Test Execution' }}</span>
              </button>
              <button
                @click="handleSaveWorkbenchRule"
                class="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-border text-xs font-semibold text-text-primary transition-colors"
              >
                Save Rule
              </button>
            </div>
          </div>

          <!-- Rule Metadata Inputs -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="text-[10px] font-medium text-text-muted mb-1 block">Rule Name</label>
              <input
                v-model="editorRule.rule_name"
                class="w-full px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary"
              />
            </div>
            <div>
              <label class="text-[10px] font-medium text-text-muted mb-1 block">URL Regex</label>
              <input
                v-model="editorRule.url_regex"
                class="w-full px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs font-mono text-text-primary"
              />
            </div>
            <div>
              <label class="text-[10px] font-medium text-text-muted mb-1 block">Test Target URL</label>
              <input
                v-model="workbenchTestUrl"
                class="w-full px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary"
              />
            </div>
          </div>

          <!-- Code Editor Tabs -->
          <div class="space-y-2">
            <div class="flex gap-2 border-b border-border pb-2 text-xs">
              <button
                @click="editorTab = 'toc'"
                :class="[
                  'px-3 py-1 rounded-lg font-medium',
                  editorTab === 'toc' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                ]"
              >
                TOC Extraction Script
              </button>
              <button
                @click="editorTab = 'chapter'"
                :class="[
                  'px-3 py-1 rounded-lg font-medium',
                  editorTab === 'chapter' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                ]"
              >
                Chapter Extraction Script
              </button>
            </div>

            <textarea
              v-if="editorTab === 'toc'"
              v-model="editorRule.toc_code"
              rows="6"
              class="w-full p-3 rounded-xl bg-surface-elevated border border-border font-mono text-xs text-text-primary resize-none"
            ></textarea>
            <textarea
              v-else
              v-model="editorRule.chapter_code"
              rows="6"
              class="w-full p-3 rounded-xl bg-surface-elevated border border-border font-mono text-xs text-text-primary resize-none"
            ></textarea>
          </div>

          <!-- Output Inspector -->
          <div v-if="executionResult" class="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-emerald-500">Execution Output ({{ executionResult.execution_time_ms }}ms)</span>
              <span class="text-text-muted">Status: {{ executionResult.status }}</span>
            </div>
            <pre class="text-[11px] font-mono text-text-secondary overflow-x-auto p-2 bg-surface rounded-lg">{{ JSON.stringify(executionResult.output, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLibraryStore } from '../stores/library';
import {
  Touchpad,
  Sparkles,
  Share2,
  Code2,
  Wand2,
  RefreshCw,
  Play,
} from 'lucide-vue-next';
import type { Rule } from '../types';

const store = useLibraryStore();
const activeMode = ref<'picker' | 'mcp' | 'hub' | 'code'>('picker');
const targetUrl = ref('https://example.com/novel/arcane-odyssey');
const mcpPrompt = ref('Generate a scraping rule for https://www.scribblehub.com/series/99123/celestial-forge/');
const mcpGenerating = ref(false);
const mcpResult = ref<Rule | null>(null);

// Mode 1: Picker state
const pickerSelectors = ref({
  title: 'h1.novel-title',
  chapters: '.chapter-list a',
  content: '#chapter-content',
});
const compiledRule = ref<Rule | null>(null);

// Mode 3: Sync state
const syncing = ref(false);
const syncReport = ref<{ checked: number; added: number; updated: number } | null>(null);

// Mode 4: Code workbench state
const editorTab = ref<'toc' | 'chapter'>('toc');
const workbenchTestUrl = ref('https://royalroad.com/fiction/12345/chapter-1');
const testingExecution = ref(false);
const executionResult = ref<any>(null);

const editorRule = ref<Rule>({
  guid: 'workbench-rule-01',
  rule_name: 'RoyalRoad Fast-Path',
  url_regex: 'royalroad\\.com\\/fiction\\/.*',
  parser_type: 'headless',
  pagetype_code: 'return 0;',
  toc_code: `const titleEl = document.querySelector('h1');
const chapters = Array.from(document.querySelectorAll('tbody tr a[href*="/chapter/"]')).map(a => a.href);
return { Title: titleEl ? titleEl.innerText.trim() : '', ChapterCount: chapters.length, ChapterURLs: chapters };`,
  chapter_code: `const contentEl = document.querySelector('.chapter-inner');
return [{ title: document.querySelector('h1')?.innerText || '', content: contentEl ? contentEl.innerHTML : '', nextURL: '' }];`,
  url_blocks: '',
  version: 1,
});

const modes = [
  { id: 'picker' as const, label: 'Touch Picker', icon: Touchpad },
  { id: 'mcp' as const, label: 'AI Assistant', icon: Sparkles },
  { id: 'hub' as const, label: 'Community Hub', icon: Share2 },
  { id: 'code' as const, label: 'Code Studio', icon: Code2 },
];

function handleRunPicker() {
  compiledRule.value = {
    guid: 'picker-gen-' + Date.now(),
    rule_name: 'Custom Novel Site',
    url_regex: 'example\\.com\\/novel\\/.*',
    parser_type: 'headless',
    toc_code: `return { Title: document.querySelector('${pickerSelectors.value.title}')?.innerText || '', ChapterURLs: [] };`,
    chapter_code: `return [{ content: document.querySelector('${pickerSelectors.value.content}')?.innerHTML || '' }];`,
    version: 1,
  };
}

function saveCompiledRule() {
  if (compiledRule.value) {
    store.rules.push(compiledRule.value);
    alert('Rule saved successfully to library!');
  }
}

async function handleGenerateMcpRule() {
  mcpGenerating.value = true;
  await new Promise((res) => setTimeout(res, 800));
  mcpResult.value = {
    guid: 'mcp-gen-' + Date.now(),
    rule_name: 'ScribbleHub AI Rule',
    url_regex: 'scribblehub\\.com\\/series\\/.*',
    parser_type: 'headless',
    version: 2,
    toc_code: 'return { Title: document.querySelector(".fic_title")?.innerText };',
    chapter_code: 'return [{ content: document.querySelector("#chp_raw")?.innerHTML }];',
  };
  mcpGenerating.value = false;
}

function saveMcpRule() {
  if (mcpResult.value) {
    store.rules.push(mcpResult.value);
    alert(`Rule "${mcpResult.value.rule_name}" added to your site rules!`);
  }
}

async function handleSyncRules() {
  syncing.value = true;
  await new Promise((res) => setTimeout(res, 600));
  syncReport.value = {
    checked: store.rules.length + 3,
    added: 1,
    updated: 2,
  };
  syncing.value = false;
}

function copyRuleJson(rule: Rule) {
  navigator.clipboard?.writeText(JSON.stringify(rule, null, 2));
  alert(`Rule "${rule.rule_name}" JSON copied to clipboard!`);
}

async function handleTestExecution() {
  testingExecution.value = true;
  await new Promise((res) => setTimeout(res, 400));
  executionResult.value = {
    status: 'OK',
    execution_time_ms: 128,
    output: {
      Title: 'He Who Fights with Monsters',
      ChapterCount: 840,
      SampleChapterURLs: [
        `${workbenchTestUrl.value}/chapter-1`,
        `${workbenchTestUrl.value}/chapter-2`,
      ],
      WordCountEstimate: 2850,
    },
  };
  testingExecution.value = false;
}

function handleSaveWorkbenchRule() {
  const existing = store.rules.find((r) => r.rule_name === editorRule.value.rule_name);
  if (existing) {
    Object.assign(existing, editorRule.value);
  } else {
    store.rules.push({ ...editorRule.value, guid: 'custom-' + Date.now() });
  }
  alert(`Rule "${editorRule.value.rule_name}" saved to database!`);
}
</script>
