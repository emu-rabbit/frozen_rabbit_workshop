<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDictionaryItem } from '../../services/dictionary'
import type { Note, LocalizedString } from '../../types/note'

const { t, locale } = useI18n()

const isCopied = ref(false)

interface Props {
  note: Note | null
  id?: string // Fallback ID if note is null
  isFavorite: boolean
  draggable?: boolean
  mode?: 'history' | 'favorites' | 'recommended'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'history',
  draggable: false
})

const emit = defineEmits<{
  'toggle-favorite': [noteOrId: Note | { id: string }]
  'open-workbench': [note: Note]
}>()

// --- Computed Helpers ---

const localizedName = computed(() => {
  const name = props.note?.name
  if (!name) return ''
  if (typeof name === 'string') return name
  
  const l = locale.value as keyof LocalizedString
  return name[l] || name.en || name.tw || ''
})

const formattedDate = computed(() => {
  const date = props.note?.createdAt
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
})

// --- Methods ---

const handleToggleFavorite = () => {
  emit('toggle-favorite', props.note ? props.note : { id: props.id as string })
}

const handleExportJson = () => {
  if (!props.note) return
  
  const exportData = {
    id: props.note.id,
    name: localizedName.value,
    items: props.note.items.map(i => ({ id: i.id, quantity: i.quantity })),
    createdAt: props.note.createdAt
  }
  
  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    .then(() => {
        isCopied.value = true
        setTimeout(() => isCopied.value = false, 2000)
    })
    .catch(err => console.error('Export failed:', err))
}
</script>

<template>
  <div 
    class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-4 md:p-6 flex flex-col gap-4 md:gap-5 hover:shadow-md transition-shadow relative overflow-hidden group"
    :class="!note ? 'border-red-100 dark:border-red-950/30 bg-red-50/30 dark:bg-red-950/10' : 'border-soft-green-100 dark:border-slate-800'"
  >
    <!-- Side Accent -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="!note ? 'bg-red-400' : 'bg-lime-green-400'"
    ></div>
    
    <!-- Header Section: Title & Date & Drag Handle -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <template v-if="note">
          <h3 class="text-xl md:text-2xl font-bold text-soft-green-900 dark:text-soft-green-400 mb-1 leading-tight group-hover:text-lime-green-700 dark:group-hover:text-lime-green-500 transition-colors" :title="localizedName">
            {{ localizedName }}
          </h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-sans mt-0.5">
            <i class="pi pi-clock text-[10px]"></i> {{ formattedDate }}
          </p>
        </template>
        <template v-else>
          <div class="flex flex-col gap-1">
            <h3 class="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i> 此筆記已損毀或無法辨識
            </h3>
            <p class="text-xs text-red-400 dark:text-red-500 font-mono opacity-70">{{ id }}</p>
          </div>
        </template>
      </div>

      <!-- Drag Handle (if applicable) -->
      <div v-if="draggable && note" class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-soft-green-500 dark:hover:text-soft-green-400 transition-colors p-2 shrink-0 -mt-1 -mr-1">
        <i class="pi pi-bars text-lg"></i>
      </div>
    </div>
    
    <!-- Body Section: Items & Actions -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 border-t border-slate-50 dark:border-slate-800">
        <!-- Items List -->
        <div v-if="note" class="flex-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100/50 dark:border-slate-700/50 min-w-0">
            <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-[0.1em] flex items-center gap-2">
               <i class="pi pi-box text-[10px]"></i>
               {{ t('history.itemsCount') }} ({{note.items.length}})
            </div>
            
            <div v-if="note.items.length === 0" class="text-slate-400 text-sm italic py-2">
              {{ t('history.noItems') }}
            </div>
            
            <div v-else class="flex flex-wrap gap-2.5">
              <div 
                v-for="item in note.items" 
                :key="item.id" 
                class="bg-white dark:bg-slate-800 border border-soft-green-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm shadow-sm overflow-hidden flex items-center h-9 rounded-lg font-sans max-w-full hover:border-soft-green-400 dark:hover:border-soft-green-600 transition-colors"
              >
                <div class="h-full w-9 bg-soft-green-50/50 dark:bg-slate-900/50 border-r border-soft-green-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <img v-if="getDictionaryItem(item.id)?.icon" :alt="getDictionaryItem(item.id)?.name" :src="getDictionaryItem(item.id)?.icon" class="w-6 h-6 rounded-sm object-cover" />
                  <i v-else class="pi pi-box text-xs text-slate-300 dark:text-slate-600"></i>
                </div>
                <div class="bg-soft-green-100/80 dark:bg-soft-green-900/40 text-soft-green-900 dark:text-soft-green-400 text-xs font-black px-2 py-1 rounded-sm ml-2 shrink-0">
                  x{{ item.quantity }}
                </div>
                <div class="px-3 pr-4 min-w-0 truncate font-semibold text-soft-green-900 dark:text-soft-green-300">
                  {{ getDictionaryItem(item.id)?.name || t('history.unknownItem') }}
                </div>
              </div>
            </div>
        </div>
        <div v-else class="flex-1 flex items-center text-red-400 text-sm italic py-4">
          找不到對應的筆記資料，可能已被刪除或資料損毀。
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-2 md:gap-3 shrink-0 items-center justify-end w-full md:w-auto mt-2 md:mt-0">
          <button 
            @click="handleToggleFavorite" 
            class="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center transition-all duration-300 transform active:scale-90 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 shrink-0"
            :class="isFavorite ? 'text-orange-400' : 'text-slate-400 dark:text-slate-600 hover:text-orange-300 dark:hover:text-orange-500'"
            :title="isFavorite ? t('noteCard.removeFavorite') : t('noteCard.addFavorite')"
          >
            <i class="pi text-lg md:text-xl" :class="isFavorite ? 'pi-star-fill' : 'pi-star'"></i>
          </button>

          <button 
            v-if="note" 
            @click="handleExportJson" 
            class="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center transition-all duration-300 transform active:scale-90 rounded-full hover:bg-soft-green-50 dark:hover:bg-soft-green-900/20 text-slate-400 dark:text-slate-600 hover:text-soft-green-500 dark:hover:text-soft-green-400 shrink-0"
            :title="t('noteCard.exportNote')"
          >
            <transition name="scale" mode="out-in">
              <i v-if="isCopied" class="pi pi-check text-lg md:text-xl text-soft-green-500 dark:text-soft-green-400"></i>
              <i v-else class="pi pi-copy text-lg md:text-xl"></i>
            </transition>
          </button>

          <button 
            v-if="note" 
            @click="emit('open-workbench', note)" 
            class="flex-1 md:flex-none h-10 md:h-11 px-6 md:px-8 rounded-full flex items-center justify-center text-white bg-soft-green-500 hover:bg-soft-green-600 dark:bg-soft-green-600 dark:hover:bg-soft-green-700 shadow-md dark:shadow-none hover:shadow-lg transition-all text-xs md:text-sm font-bold gap-2 whitespace-nowrap active:scale-95"
          >
              {{ t('history.openWorkbench') }} <i class="pi pi-angle-right text-xs md:text-sm"></i>
          </button>
        </div>
    </div>
  </div>
</template>



