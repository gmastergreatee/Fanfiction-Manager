<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div
      :class="[
        'w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl',
        modalContainerClass
      ]"
    >
      <!-- Modal Header -->
      <div :class="['px-6 py-4 flex items-center justify-between shrink-0', modalHeaderClass]">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-accent/15 text-accent">
            <Plus class="w-4 h-4" />
          </div>
          <div>
            <h2 :class="modalTitleClass">Add New Novel</h2>
            <p class="text-[11px] text-text-muted mt-0.5">Import from web URL or author manually</p>
          </div>
        </div>
        <button
          @click="handleClose"
          :class="modalCloseBtnClass"
          title="Close dialog"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
        <!-- URL Input -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-text-primary flex items-center justify-between">
            <span>Novel Webpage URL</span>
            <span class="text-[10px] text-text-muted font-normal">Supports RoyalRoad, WebNovel, AO3, ScribbleHub, etc.</span>
          </label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Globe class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                v-model="novelUrl"
                type="url"
                placeholder="https://www.royalroad.com/fiction/12345/..."
                @keyup.enter="handleAddNovel"
                :class="['w-full pl-9 pr-3 py-2 text-xs focus:outline-none', modalInputClass]"
                autofocus
              />
            </div>
            <button
              v-if="canPaste"
              @click="handlePaste"
              type="button"
              class="px-3 py-2 rounded-lg bg-surface-elevated hover:bg-white/10 border border-white/10 text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 shrink-0"
              title="Paste from clipboard"
            >
              <Clipboard class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Paste</span>
            </button>
          </div>
        </div>

        <!-- Optional Manual Overrides Accordion -->
        <div class="pt-1 border-t border-white/5">
          <button
            type="button"
            @click="showCustomMetadata = !showCustomMetadata"
            class="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <component :is="showCustomMetadata ? ChevronDown : ChevronRight" class="w-3.5 h-3.5" />
            <span>{{ showCustomMetadata ? 'Hide custom title / author' : 'Customize title / author (optional)' }}</span>
          </button>

          <div v-if="showCustomMetadata" class="mt-3 space-y-3 p-3.5 rounded-xl bg-surface-elevated/40 border border-white/5">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-text-muted block">Custom Title (optional)</label>
              <input
                v-model="customTitle"
                type="text"
                placeholder="Leave blank to auto-detect from webpage"
                :class="['w-full px-3 py-1.5 text-xs focus:outline-none', modalInputClass]"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-text-muted block">Custom Author (optional)</label>
              <input
                v-model="customAuthor"
                type="text"
                placeholder="Leave blank to auto-detect from webpage"
                :class="['w-full px-3 py-1.5 text-xs focus:outline-none', modalInputClass]"
              />
            </div>
          </div>
        </div>

        <!-- Error Notification -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-medium">{{ errorMessage }}</p>
            <p v-if="errorMessage.includes('challenge') || errorMessage.includes('Cloudflare')" class="text-[11px] text-text-muted">
              Tip: Sites protected by Cloudflare can also be opened in Rule Studio companion Webview to resolve challenges.
            </p>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div :class="['px-6 py-4 flex items-center justify-end gap-2.5 shrink-0', modalFooterClass]">
        <button
          type="button"
          @click="handleClose"
          :disabled="isSubmitting"
          :class="modalSecondaryBtnClass"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleAddNovel"
          :disabled="isSubmitting || !novelUrl.trim()"
          :class="['flex items-center gap-2 font-semibold', modalPrimaryBtnClass, { 'opacity-50 cursor-not-allowed': isSubmitting || !novelUrl.trim() }]"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Plus v-else class="w-4 h-4" />
          <span>{{ isSubmitting ? 'Importing Novel...' : 'Add Novel' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  X,
  Plus,
  Globe,
  Clipboard,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next';
import { usePlatformModal } from '../composables/usePlatformModal';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'added', novel: any): void;
}>();

const {
  store,
  modalContainerClass,
  modalHeaderClass,
  modalFooterClass,
  modalTitleClass,
  modalCloseBtnClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
  modalInputClass,
} = usePlatformModal();

const novelUrl = ref('');
const customTitle = ref('');
const customAuthor = ref('');
const showCustomMetadata = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      novelUrl.value = text.trim();
    }
  } catch (err) {
    console.warn('Clipboard read error:', err);
  }
}

function handleClose() {
  if (isSubmitting.value) return;
  errorMessage.value = '';
  emit('close');
}

async function handleAddNovel() {
  if (!novelUrl.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const novel = await store.addNovel(
      novelUrl.value.trim(),
      customTitle.value.trim() || undefined,
      customAuthor.value.trim() || undefined
    );
    novelUrl.value = '';
    customTitle.value = '';
    customAuthor.value = '';
    showCustomMetadata.value = false;
    emit('added', novel);
    emit('close');
    // Open novel details immediately so user can see chapters
    store.openNovelDetail(novel);
  } catch (err: any) {
    console.error('Failed to add novel:', err);
    errorMessage.value = err?.message || String(err) || 'Failed to import novel from URL';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
