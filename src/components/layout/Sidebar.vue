<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useNotes } from '../../composables/useNotes'
import logo from '../../assets/logo.png'
import packageJson from '../../../package.json'

const { t } = useI18n()
const { notes, favoritesCount, recommendedCount } = useNotes()
const version = packageJson.version

const props = defineProps<{
  currentTab: string
}>()

const emit = defineEmits<{
  'update:currentTab': [tab: string],
  'open-sponsor': []
}>()

const activeTab = computed({
  get: () => props.currentTab,
  set: (val) => emit('update:currentTab', val)
})
</script>

<template>
  <aside class="w-full bg-white dark:bg-slate-900 flex flex-col transition-all overflow-y-auto border-r border-soft-green-100 dark:border-slate-800 h-full">
    <div class="p-6 pb-2">
      <h1 class="text-lg font-bold text-soft-green-800 dark:text-soft-green-500 flex items-center gap-2 leading-tight">
        <img :src="logo" class="w-8 h-8 rounded-lg shadow-sm" alt="Logo" />
        {{ t('app.title') }}
      </h1>
      <p class="text-xs text-soft-green-600 dark:text-soft-green-600 mt-2">{{ t('app.subtitle') }}</p>
    </div>

    <nav class="flex-1 mt-6 px-4 flex flex-col gap-2">
      <button 
        @click="activeTab = 'new'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-bold"
        :class="activeTab === 'new' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
      >
        <i class="pi pi-pencil shrink-0"></i>
        <span v-html="t('nav.newNote')" class="leading-tight"></span>
      </button>

      <button 
        @click="activeTab = 'editor'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-bold"
        :class="activeTab === 'editor' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
      >
        <i class="pi pi-sliders-h shrink-0"></i>
        <span v-html="t('nav.editor')" class="leading-tight"></span>
      </button>

      <hr class="border-soft-green-100 dark:border-slate-800 my-2" />

      <button 
        @click="activeTab = 'favorites'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'favorites' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
      >
        <i class="pi pi-star shrink-0"></i>
        <span v-html="t('nav.favorites')" class="leading-tight flex-1"></span>
        <span class="ml-2 bg-soft-green-200 dark:bg-soft-green-900 text-soft-green-800 dark:text-soft-green-300 text-xs px-2 py-0.5 rounded-full shrink-0">{{ favoritesCount }}</span>
      </button>

      <button 
        @click="activeTab = 'recommended'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'recommended' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
      >
        <i class="pi pi-heart shrink-0"></i>
        <span v-html="t('nav.recommended')" class="leading-tight flex-1"></span>
        <span class="ml-2 bg-soft-green-200 dark:bg-soft-green-900 text-soft-green-800 dark:text-soft-green-300 text-xs px-2 py-0.5 rounded-full shrink-0">{{ recommendedCount }}</span>
      </button>

      <button 
        @click="activeTab = 'history'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'history' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
      >
        <i class="pi pi-book shrink-0"></i>
        <span v-html="t('nav.history')" class="leading-tight flex-1"></span>
        <span class="ml-2 bg-soft-green-200 dark:bg-soft-green-900 text-soft-green-800 dark:text-soft-green-300 text-xs px-2 py-0.5 rounded-full shrink-0">{{ notes.length }}</span>
      </button>

      <button 
        @click="activeTab = 'faq'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'faq' ? 'bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-800 dark:text-soft-green-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
      >
        <i class="pi pi-question-circle shrink-0"></i>
        <span v-html="t('nav.faq')" class="leading-tight"></span>
      </button>
      
      <div class="mt-auto"></div>
    </nav>
    
    <div class="p-4 border-t border-soft-green-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
      <div class="flex flex-col gap-3 mb-4">
        <button 
          @click="activeTab = 'settings'"
          class="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-left font-bold text-sm"
          :class="activeTab === 'settings' ? 'bg-soft-green-100 dark:bg-soft-green-950 text-soft-green-800 dark:text-soft-green-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-soft-green-50 dark:hover:bg-slate-800 hover:text-soft-green-700 dark:hover:text-soft-green-300'"
        >
          <i class="pi pi-cog text-base"></i>
          {{ t('nav.settings') }}
        </button>

        <!-- External Links -->
        <div class="flex flex-col gap-2 px-1">
          <button 
            @click="$emit('open-sponsor')"
            class="group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 dark:hover:border-rose-800/70 hover:scale-[1.02] transition-all duration-300 shadow-sm"
          >
            <i class="pi pi-heart-fill text-xs text-rose-400 dark:text-rose-500 group-hover:text-rose-400 group-hover:scale-125 transition-all"></i>
            <span class="text-[11px] font-black tracking-tight whitespace-nowrap">{{ t('nav.sponsor') }}</span>
          </button>

          <a 
            href="https://github.com/emu-rabbit/frozen_rabbit_workshop" 
            target="_blank"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-300"
          >
            <i class="pi pi-github text-xs opacity-70"></i>
            <span class="text-[11px] font-bold tracking-tight">{{ t('nav.github') }}</span>
          </a>
        </div>
      </div>

      <div class="text-[10px] text-center font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase opacity-60">
        v{{ version }}
      </div>
    </div>
  </aside>
</template>
