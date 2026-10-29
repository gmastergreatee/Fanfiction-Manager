import { computed } from 'vue';
import { useLibraryStore } from '../stores/library';

export function usePlatformModal() {
  const store = useLibraryStore();

  const modalContainerClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'bg-[#202020]/95 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10';
      case 'apple':
        return 'bg-[#28282b]/85 backdrop-blur-3xl border border-white/25 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.65)] ring-1 ring-white/20';
      case 'android':
        return 'bg-[#2b2930] border border-white/10 rounded-[28px] shadow-2xl';
      case 'linux':
      default:
        return 'bg-[#2c2c2c] border border-white/20 rounded-xl shadow-2xl ring-1 ring-black/40';
    }
  });

  const modalHeaderClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'border-b border-white/10 bg-white/[0.02]';
      case 'apple':
        return 'border-b border-white/15 bg-white/[0.04]';
      case 'android':
        return 'border-b border-white/5 bg-transparent';
      case 'linux':
      default:
        return 'border-b border-white/10 bg-[#242424]/70';
    }
  });

  const modalFooterClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'border-t border-white/10 bg-white/[0.02]';
      case 'apple':
        return 'border-t border-white/15 bg-white/[0.04]';
      case 'android':
        return 'border-t border-white/5 bg-transparent';
      case 'linux':
      default:
        return 'border-t border-white/10 bg-[#242424]/70';
    }
  });

  const modalTitleClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'font-sans text-sm font-semibold text-white tracking-tight';
      case 'apple':
        return 'font-sans text-sm font-medium text-white/95 tracking-tight';
      case 'android':
        return 'font-sans text-base font-medium text-[#e6e1e5]';
      case 'linux':
      default:
        return 'font-sans text-xs font-bold text-white';
    }
  });

  const modalCloseBtnClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'p-1.5 rounded hover:bg-[#c42b1c] hover:text-white text-text-muted transition-colors';
      case 'apple':
        return 'w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors shadow-xs';
      case 'android':
        return 'w-9 h-9 rounded-full hover:bg-white/10 text-white/80 flex items-center justify-center transition-colors';
      case 'linux':
      default:
        return 'w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors';
    }
  });

  const modalCardClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all';
      case 'apple':
        return 'rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 shadow-xs transition-all';
      case 'android':
        return 'rounded-2xl border border-transparent bg-[#36343b] hover:bg-[#413f47] transition-all';
      case 'linux':
      default:
        return 'rounded-lg border border-white/15 bg-[#242424] hover:border-white/30 transition-all';
    }
  });

  const modalPrimaryBtnClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'rounded-md bg-accent hover:bg-accent-hover text-white px-4 py-2 border border-accent/40 font-semibold shadow-sm transition-all';
      case 'apple':
        return 'rounded-lg bg-[#007aff] hover:bg-[#0071e3] text-white px-4 py-1.5 shadow-sm font-medium transition-all';
      case 'android':
        return 'rounded-full bg-accent hover:opacity-90 text-white px-6 py-2.5 shadow-md font-semibold transition-all';
      case 'linux':
      default:
        return 'rounded-md bg-[#3584e4] hover:bg-[#1c71d8] text-white px-4 py-2 shadow-sm font-semibold transition-all';
    }
  });

  const modalSecondaryBtnClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'rounded-md border border-white/10 bg-white/[0.03] text-text-secondary hover:bg-white/[0.08] hover:text-white px-4 py-2 font-medium transition-all';
      case 'apple':
        return 'rounded-lg border border-white/15 bg-white/10 text-text-secondary hover:bg-white/15 hover:text-white px-4 py-1.5 shadow-xs font-medium transition-all';
      case 'android':
        return 'rounded-full border border-transparent bg-[#36343b] text-text-secondary hover:bg-[#413f47] hover:text-white px-6 py-2.5 font-medium transition-all';
      case 'linux':
      default:
        return 'rounded-md border border-white/15 bg-[#242424] text-text-secondary hover:bg-white/10 hover:text-white px-4 py-2 font-medium transition-all';
    }
  });

  const modalInputClass = computed(() => {
    switch (store.platformStyle) {
      case 'windows':
        return 'rounded-md bg-white/[0.05] border border-white/15 focus:border-accent text-white placeholder-text-muted';
      case 'apple':
        return 'rounded-lg bg-white/10 border border-white/20 focus:border-[#007aff] text-white placeholder-text-muted';
      case 'android':
        return 'rounded-full bg-[#36343b] border border-transparent focus:border-accent text-white placeholder-text-muted';
      case 'linux':
      default:
        return 'rounded-lg bg-[#242424] border border-white/20 focus:border-[#3584e4] text-white placeholder-text-muted';
    }
  });

  return {
    store,
    modalContainerClass,
    modalHeaderClass,
    modalFooterClass,
    modalTitleClass,
    modalCloseBtnClass,
    modalCardClass,
    modalPrimaryBtnClass,
    modalSecondaryBtnClass,
    modalInputClass,
  };
}

