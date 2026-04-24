<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { changelogData } from '../../data/changelog'
import type { LocalizedString } from '../../types/note'

const { t, locale } = useI18n()

const getLocalized = (text: string | LocalizedString) => {
  if (typeof text === 'string') return text;
  const l = locale.value as keyof LocalizedString;
  return text[l] || text.tw || text.en || text.ja || Object.values(text)[0];
}
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-3xl w-full mx-auto pb-24">
    <header class="mb-8 md:mb-10">
      <div class="flex items-center gap-3 mb-2">
        <a href="#settings" class="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-soft-green-500 hover:shadow-sm flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700">
          <i class="pi pi-arrow-left text-xs"></i>
        </a>
        <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400">{{ t('changelog.title') }}</h2>
      </div>
      <p class="text-slate-500 dark:text-slate-400 text-sm ml-11">{{ t('changelog.description') }}</p>
    </header>

    <div class="relative ml-4 md:ml-6 border-l-2 border-soft-green-200 dark:border-slate-800 flex flex-col gap-8 pb-8">
      <div 
        v-for="(release, index) in changelogData" 
        :key="release.version"
        class="relative pl-8 md:pl-10"
      >
        <!-- Timeline dot -->
        <div 
          class="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-soft-green-50 dark:border-slate-950 flex items-center justify-center"
          :class="index === 0 ? 'bg-soft-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-slate-400 dark:bg-slate-600'"
        ></div>
        
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group">
          <div class="px-5 py-4 border-b border-soft-green-50 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <h3 class="text-lg font-black tracking-tight" :class="index === 0 ? 'text-soft-green-600 dark:text-soft-green-400' : 'text-slate-700 dark:text-slate-300'">
              {{ t('changelog.version', { v: release.version }) }}
              <span v-if="index === 0" class="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-soft-green-100 dark:bg-soft-green-900/50 text-soft-green-700 dark:text-soft-green-300">Latest</span>
            </h3>
            <span class="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <i class="pi pi-calendar text-[10px]"></i>
              {{ release.date }}
            </span>
          </div>
          <div class="p-5">
            <ul class="flex flex-col gap-3">
              <li v-for="(change, cIndex) in release.changes" :key="cIndex" class="flex items-start gap-3">
                <i class="pi pi-check-circle text-soft-green-500 dark:text-soft-green-600 mt-0.5 shrink-0 text-sm"></i>
                <span class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{{ getLocalized(change) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
