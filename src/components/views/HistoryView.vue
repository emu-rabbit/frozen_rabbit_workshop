<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { isDictionaryLoading } from '../../services/dictionary'
import { useNotes } from '../../composables/useNotes'
import NoteCard from '../shared/NoteCard.vue'

const { t } = useI18n()

const emit = defineEmits<{
  'open-workbench': []
}>()

const { notes, toggleFavorite, isFavorite } = useNotes()
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('history.title') }}</h2>
      <p class="text-slate-500 text-sm mb-4">{{ t('history.description') }}</p>
      
      <!-- Auto delete warning -->
      <div v-if="notes.length > 0" class="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-start gap-3 mt-4 text-orange-600 text-sm">
        <i class="pi pi-info-circle mt-0.5"></i>
        <span>{{ t('history.autoDeleteWarning') }}</span>
      </div>
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
      
      <div v-else class="flex flex-col gap-4">
        <NoteCard 
          v-for="note in notes" 
          :key="note.id" 
          :note="note"
          mode="history"
          :is-favorite="isFavorite(note.id)"
          @toggle-favorite="toggleFavorite"
          @open-workbench="emit('open-workbench')"
        />
      </div>
    </div>
  </div>
</template>



