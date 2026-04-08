<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isDictionaryLoading, getDictionaryItem } from '../../services/dictionary'

const { t, locale } = useI18n()

const props = defineProps<{
  notes: any[]
}>()

const emit = defineEmits<{
  'open-workbench': []
  'delete-note': [id: string]
}>()

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return t('history.unknownDate')
  
  return new Intl.DateTimeFormat(locale.value === 'tw' ? 'zh-TW' : locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('history.title') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('history.description') }}</p>
    </header>
    
    <div v-if="notes.length === 0" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 flex items-center justify-center flex-col min-h-[300px]">
      <i class="pi pi-inbox text-5xl text-soft-green-200 mb-4"></i>
      <p class="text-soft-green-600 font-medium">{{ t('history.emptyTitle') }}</p>
      <p class="text-slate-400 text-sm mt-1">{{ t('history.emptyDescription') }}</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="isDictionaryLoading" class="flex justify-center items-center py-8">
          <i class="pi pi-spinner pi-spin text-soft-green-500 text-3xl"></i>
          <span class="ml-3 text-soft-green-700">{{ t('history.syncing') }}</span>
      </div>
      
      <div v-else v-for="note in notes" :key="note.id" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-lime-green-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div class="md:w-48 shrink-0">
          <h3 class="text-xl font-bold text-soft-green-900 mb-2 leading-tight truncate" :title="note.name">{{ note.name }}</h3>
          <p class="text-xs text-slate-500 flex items-center gap-1.5 font-sans whitespace-nowrap">
            <i class="pi pi-clock text-[10px]"></i> {{ formatDate(note.createdAt) }}
          </p>
        </div>
        
        <div class="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 min-w-0">
            <div class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{{ t('history.itemsCount') }} ({{note.items.length}})</div>
            <div v-if="note.items.length === 0" class="text-slate-400 text-sm italic py-2">{{ t('history.noItems') }}</div>
            <div v-else class="flex flex-wrap gap-2">
              <div v-for="item in note.items" :key="item.id" class="bg-white border border-soft-green-200 text-slate-700 text-sm shadow-sm overflow-hidden flex items-center h-8 rounded-lg font-sans max-w-full">
                <div class="h-full w-8 bg-soft-green-50 border-r border-soft-green-100 flex items-center justify-center shrink-0">
                  <img v-if="getDictionaryItem(item.id)?.icon" :src="getDictionaryItem(item.id)?.icon" class="w-5 h-5 rounded-sm object-cover" />
                  <i v-else class="pi pi-box text-xs text-slate-300"></i>
                </div>
                <div class="bg-soft-green-100 text-soft-green-800 text-xs font-bold px-2 py-0.5 rounded ml-2 shrink-0">x{{ item.quantity }}</div>
                <div class="px-2 pr-3 min-w-0 truncate font-medium">{{ getDictionaryItem(item.id)?.name || t('history.unknownItem') }}</div>
              </div>
            </div>
        </div>
        
        <div class="flex gap-2 shrink-0 items-center">
          <button @click="emit('delete-note', note.id)" class="w-10 h-10 rounded-full flex items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="刪除筆記">
            <i class="pi pi-trash"></i>
          </button>
          <button @click="emit('open-workbench')" class="w-36 h-10 rounded-full flex items-center justify-center text-white bg-soft-green-500 hover:bg-soft-green-600 shadow-sm transition-colors text-sm font-bold gap-2 whitespace-nowrap">
            {{ t('history.openWorkbench') }} <i class="pi pi-angle-right text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
