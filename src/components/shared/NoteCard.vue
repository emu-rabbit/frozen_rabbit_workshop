<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getDictionaryItem } from '../../services/dictionary'
import type { Note, LocalizedString } from '../../types/note'

const { t, locale } = useI18n()
const isDev = import.meta.env.DEV

defineProps<{
  note: Note | null
  id?: string // Fallback ID if note is null
  isFavorite: boolean
  draggable?: boolean
}>()

const emit = defineEmits<{
  'toggle-favorite': [id: string]
  'delete': [id: string]
  'open-workbench': [id: string]
}>()

const getLocalizedName = (name: string | LocalizedString | undefined) => {
  if (!name) return ''
  if (typeof name === 'string') return name
  
  const l = locale.value as keyof LocalizedString
  return (name as LocalizedString)[l] || (name as LocalizedString).en || (name as LocalizedString).tw || ''
}

const copyAsJson = (note: Note) => {
  const currentName = typeof note.name === 'string' ? note.name : (note.name as LocalizedString)[locale.value as keyof LocalizedString] || ''
  
  const recommendedFormat = {
    id: 'recommend_XXXXX',
    name: {
      tw: locale.value === 'tw' ? currentName : '',
      cn: locale.value === 'cn' ? currentName : '',
      en: locale.value === 'en' ? currentName : '',
      ja: locale.value === 'ja' ? currentName : ''
    },
    items: note.items,
    createdAt: new Date().toISOString()
  }
  
  navigator.clipboard.writeText(JSON.stringify(recommendedFormat, null, 2))
    .then(() => alert('已複製站長推薦格式 JSON 到剪貼簿！\n請記得手動修改 ID 的 XXXXX 部分。'))
    .catch(err => console.error('無法複製:', err))
}

const formatDate = (date: Date | string) => {
  if (!date) return ''
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
  <div class="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden group"
    :class="!note ? 'border-red-100 bg-red-50/30' : 'border-soft-green-100'">
    
    <div v-if="draggable && note" class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-soft-green-500 transition-colors p-2 -ml-2">
      <i class="pi pi-bars"></i>
    </div>

    <div class="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="!note ? 'bg-red-400' : 'bg-lime-green-400'"></div>
    
    <div class="md:w-48 shrink-0">
      <template v-if="note">
        <h3 class="text-xl font-bold text-soft-green-900 mb-2 leading-tight truncate" :title="getLocalizedName(note.name)">
          {{ getLocalizedName(note.name) }}
        </h3>
        <p class="text-xs text-slate-400 flex items-center gap-1.5 font-sans whitespace-nowrap mt-1">
          <i class="pi pi-clock text-[10px]"></i> {{ formatDate(note.createdAt) }}
        </p>
      </template>
      <template v-else>
        <h3 class="text-lg font-bold text-red-600 mb-1 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i> 此筆記已損毀或無法辨識
        </h3>
        <p class="text-xs text-red-400 font-mono">{{ id }}</p>
      </template>
    </div>
    
    <div v-if="note" class="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 min-w-0">
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
    <div v-else class="flex-1 flex items-center text-red-400 text-sm italic">
      找不到對應的筆記資料，可能已被刪除或資料損毀。
    </div>
    
    <div class="flex gap-2 shrink-0 items-center">
      <!-- Dev Only: Copy for Recommendation -->
      <button 
        v-if="isDev && note"
        @click="copyAsJson(note)"
        class="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:bg-soft-green-50 hover:text-soft-green-500 transition-colors"
        title="複製為站長推薦格式 (JSON)"
      >
        <i class="pi pi-copy"></i>
      </button>

      <button 
        @click="emit('toggle-favorite', note?.id || (id as string))" 
        class="w-10 h-10 flex items-center justify-center transition-all duration-300 transform active:scale-90"
        :class="isFavorite ? 'text-orange-400' : 'text-slate-300 hover:text-orange-300'"
        :title="isFavorite ? t('noteCard.removeFavorite') : t('noteCard.addFavorite')"
      >
        <i class="pi" :class="isFavorite ? 'pi-star-fill' : 'pi-star'"></i>
      </button>

      <template v-if="note && note.id.startsWith('history_')">
        <button @click="emit('delete', note.id)" class="w-10 h-10 rounded-full flex items-center justify-center text-red-200 hover:bg-red-50 hover:text-red-500 transition-colors" :title="t('noteCard.delete')">
          <i class="pi pi-trash"></i>
        </button>
      </template>

      <button v-if="note" @click="emit('open-workbench', note.id)" class="w-36 h-10 rounded-full flex items-center justify-center text-white bg-soft-green-500 hover:bg-soft-green-600 shadow-sm transition-colors text-sm font-bold gap-2 whitespace-nowrap">
          {{ t('history.openWorkbench') }} <i class="pi pi-angle-right text-sm"></i>
      </button>
    </div>
  </div>
</template>


