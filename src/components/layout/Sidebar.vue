<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useNotes } from '../../composables/useNotes'

const { t } = useI18n()
const { notes, favoritesCount } = useNotes()

const props = defineProps<{
  currentTab: string
}>()

const emit = defineEmits<{
  'update:currentTab': [tab: string]
}>()

const activeTab = computed({
  get: () => props.currentTab,
  set: (val) => emit('update:currentTab', val)
})
</script>

<template>
  <aside class="w-64 bg-white shadow-lg border-r border-soft-green-100 flex flex-col transition-all overflow-y-auto">
    <div class="p-6 pb-2">
      <h1 class="text-lg font-bold text-soft-green-800 flex items-center gap-2 leading-tight">
        <i class="pi pi-compass text-2xl text-lime-green-600"></i>
        {{ t('app.title') }}
      </h1>
      <p class="text-xs text-soft-green-600 mt-2">{{ t('app.subtitle') }}</p>
    </div>

    <nav class="flex-1 mt-6 px-4 flex flex-col gap-2">
      <button 
        @click="activeTab = 'new'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-bold"
        :class="activeTab === 'new' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
      >
        <i class="pi pi-pencil shrink-0"></i>
        <span v-html="t('nav.newNote')" class="leading-tight"></span>
      </button>

      <hr class="border-soft-green-100 my-2" />

      <button 
        @click="activeTab = 'favorites'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'favorites' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
      >
        <i class="pi pi-star shrink-0"></i>
        <span v-html="t('nav.favorites')" class="leading-tight flex-1"></span>
        <span v-if="favoritesCount > 0" class="ml-2 bg-soft-green-200 text-soft-green-800 text-xs px-2 py-0.5 rounded-full shrink-0">{{ favoritesCount }}</span>
      </button>

      <button 
        @click="activeTab = 'recommended'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'recommended' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
      >
        <i class="pi pi-heart shrink-0"></i>
        <span v-html="t('nav.recommended')" class="leading-tight"></span>
      </button>

      <button 
        @click="activeTab = 'history'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
        :class="activeTab === 'history' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
      >
        <i class="pi pi-book shrink-0"></i>
        <span v-html="t('nav.history')" class="leading-tight flex-1"></span>
        <span v-if="notes.length > 0" class="ml-2 bg-soft-green-200 text-soft-green-800 text-xs px-2 py-0.5 rounded-full shrink-0">{{ notes.length }}</span>
      </button>
      
      <div class="mt-auto"></div>
    </nav>
    
    <div class="p-4 border-t border-soft-green-50">
      <button 
        @click="activeTab = 'settings'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium w-full"
        :class="activeTab === 'settings' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
      >
        <i class="pi pi-cog"></i>
        {{ t('nav.settings') }}
      </button>
      <div class="text-xs text-center text-slate-400 mt-4">
        v0.2.0-beta
      </div>
    </div>
  </aside>
</template>
