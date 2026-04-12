<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from '../../composables/useNotes'
import NoteCard from '../shared/NoteCard.vue'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import { isDictionaryLoading } from '../../services/dictionary'
import type { LocalizedString } from '../../types/note'
import { useDebounceFn } from '@vueuse/core'

const { t } = useI18n()
const { recommendedNotes, toggleFavorite, isFavorite } = useNotes()

const emit = defineEmits<{
  'open-workbench': [note: any]
}>()

const searchQuery = ref('')
const first = ref(0)
const rows = ref(20)


const filteredNotes = computed(() => {
  const rawQuery = searchQuery.value.trim().toLowerCase()
  if (!rawQuery) return recommendedNotes

  // Split query into tokens by whitespace
  const tokens = rawQuery.split(/\s+/).filter(t => t.length > 0)

  return recommendedNotes.filter(note => {
    // Collect all available text for this note to search against
    const searchableTexts: string[] = []
    if (typeof note.name === 'string') {
      searchableTexts.push(note.name.toLowerCase())
    } else {
      const loc = note.name as LocalizedString
      if (loc.tw) searchableTexts.push(loc.tw.toLowerCase())
      if (loc.cn) searchableTexts.push(loc.cn.toLowerCase())
      if (loc.en) searchableTexts.push(loc.en.toLowerCase())
      if (loc.ja) searchableTexts.push(loc.ja.toLowerCase())
    }
    
    // Requirement: EVERY token must be found in AT LEAST ONE of the translations
    return tokens.every(token => 
      searchableTexts.some(text => text.includes(token))
    )
  })
})

const pagedNotes = computed(() => {
  return filteredNotes.value.slice(first.value, first.value + rows.value)
})

// Debounce search intentionally to let user type before resetting page
const onSearchInput = useDebounceFn(() => {
  first.value = 0 // Reset to page 1 on new search
}, 300)

const onSearchValueUpdate = (val: string | undefined) => {
  searchQuery.value = val || ''
  onSearchInput()
}
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-4xl w-full mx-auto pb-24">
    <header class="mb-6">
      <div class="flex items-center gap-3 mb-2 text-soft-green-800">
        <i class="pi pi-thumbs-up-fill text-xl md:text-2xl"></i>
        <h2 class="text-2xl md:text-3xl font-bold">{{ t('recommended.title') }}</h2>
      </div>
      <p class="text-slate-500 text-sm mb-4 md:mb-6">{{ t('recommended.description') }}</p>

      <span class="relative block">
        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <InputText 
          :modelValue="searchQuery"
          @update:modelValue="onSearchValueUpdate"
          :placeholder="t('recommended.searchPlaceholder')" 
          class="w-full !pl-11 !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl bg-white shadow-sm"
          size="large"
        />
        <i v-if="searchQuery" @click="onSearchValueUpdate('')" class="pi pi-times absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 cursor-pointer p-2 -mr-2"></i>
      </span>
    </header>

    <div v-if="filteredNotes.length === 0" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 flex items-center justify-center flex-col min-h-[300px]">
      <i class="pi pi-search text-5xl text-soft-green-200 mb-4"></i>
      <p class="text-soft-green-600 font-medium">{{ t('recommended.emptyTitle') }}</p>
      <p class="text-slate-400 text-sm mt-1">{{ t('recommended.emptyDescription') }}</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="isDictionaryLoading" class="flex justify-center items-center py-8">
          <i class="pi pi-spinner pi-spin text-soft-green-500 text-3xl"></i>
          <span class="ml-3 text-soft-green-700">{{ t('history.syncing') }}</span>
      </div>
      
      <div v-else class="flex flex-col gap-4 relative">
        <NoteCard 
          v-for="note in pagedNotes" 
          :key="note.id" 
          :note="note"
          mode="recommended"
          :is-favorite="isFavorite(note.id)"
          @toggle-favorite="toggleFavorite"
          @open-workbench="emit('open-workbench', $event)"
        />
      </div>

      <div v-if="filteredNotes.length > rows" class="mt-4 flex justify-center">
        <Paginator 
          v-model:first="first" 
          :rows="rows" 
          :totalRecords="filteredNotes.length"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          class="!bg-transparent border-none p-0"
        />
      </div>
    </div>
  </div>
</template>
