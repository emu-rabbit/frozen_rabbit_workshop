<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDictionaryItem } from '../../services/dictionary'
import type { Note, LocalizedString } from '../../types/note'

const { t, locale } = useI18n()

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
  'open-workbench': [id: string]
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
</script>

<template>
  <div 
    class="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden group"
    :class="!note ? 'border-red-100 bg-red-50/30' : 'border-soft-green-100'"
  >
    <!-- Side Accent -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="!note ? 'bg-red-400' : 'bg-lime-green-400'"
    ></div>
    
    <!-- Drag Handle -->
    <div v-if="draggable && note" class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-soft-green-500 transition-colors p-2 -ml-2 shrink-0">
      <i class="pi pi-bars"></i>
    </div>

    <!-- Note Info -->
    <div class="md:w-48 shrink-0">
      <template v-if="note">
        <h3 class="text-xl font-bold text-soft-green-900 mb-2 leading-tight truncate" :title="localizedName">
          {{ localizedName }}
        </h3>
        <p class="text-xs text-slate-400 flex items-center gap-1.5 font-sans whitespace-nowrap mt-1">
          <i class="pi pi-clock text-[10px]"></i> {{ formattedDate }}
        </p>
      </template>
      <template v-else>
        <h3 class="text-lg font-bold text-red-600 mb-1 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i> 此筆記已損毀或無法辨識
        </h3>
        <p class="text-xs text-red-400 font-mono">{{ id }}</p>
      </template>
    </div>
    
    <!-- Item List / Content -->
    <div v-if="note" class="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 min-w-0">
        <div class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
          {{ t('history.itemsCount') }} ({{note.items.length}})
        </div>
        
        <div v-if="note.items.length === 0" class="text-slate-400 text-sm italic py-2">
          {{ t('history.noItems') }}
        </div>
        
        <div v-else class="flex flex-wrap gap-2">
          <div 
            v-for="item in note.items" 
            :key="item.id" 
            class="bg-white border border-soft-green-200 text-slate-700 text-sm shadow-sm overflow-hidden flex items-center h-8 rounded-lg font-sans max-w-full"
          >
            <div class="h-full w-8 bg-soft-green-50 border-r border-soft-green-100 flex items-center justify-center shrink-0">
              <img v-if="getDictionaryItem(item.id)?.icon" :src="getDictionaryItem(item.id)?.icon" class="w-5 h-5 rounded-sm object-cover" />
              <i v-else class="pi pi-box text-xs text-slate-300"></i>
            </div>
            <div class="bg-soft-green-100 text-soft-green-800 text-xs font-bold px-2 py-0.5 rounded ml-2 shrink-0">
              x{{ item.quantity }}
            </div>
            <div class="px-2 pr-3 min-w-0 truncate font-medium">
              {{ getDictionaryItem(item.id)?.name || t('history.unknownItem') }}
            </div>
          </div>
        </div>
    </div>
    <div v-else class="flex-1 flex items-center text-red-400 text-sm italic">
      找不到對應的筆記資料，可能已被刪除或資料損毀。
    </div>
    
    <!-- Actions -->
    <div class="flex gap-2 shrink-0 items-center">
      <button 
        @click="handleToggleFavorite" 
        class="w-10 h-10 flex items-center justify-center transition-all duration-300 transform active:scale-90"
        :class="isFavorite ? 'text-orange-400' : 'text-slate-300 hover:text-orange-300'"
        :title="isFavorite ? t('noteCard.removeFavorite') : t('noteCard.addFavorite')"
      >
        <i class="pi" :class="isFavorite ? 'pi-star-fill' : 'pi-star'"></i>
      </button>

      <button 
        v-if="note" 
        @click="emit('open-workbench', note.id)" 
        class="w-36 h-10 rounded-full flex items-center justify-center text-white bg-soft-green-500 hover:bg-soft-green-600 shadow-sm transition-colors text-sm font-bold gap-2 whitespace-nowrap"
      >
          {{ t('history.openWorkbench') }} <i class="pi pi-angle-right text-sm"></i>
      </button>
    </div>
  </div>
</template>



