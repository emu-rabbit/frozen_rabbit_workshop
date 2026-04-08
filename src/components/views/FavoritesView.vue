<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isDictionaryLoading } from '../../services/dictionary'
import { useNotes } from '../../composables/useNotes'
import NoteCard from '../shared/NoteCard.vue'
import draggable from 'vuedraggable'

const { t } = useI18n()

const emit = defineEmits<{
  'open-workbench': []
}>()

const { favoriteNotes, toggleFavorite, isFavorite, updateFavoriteOrder } = useNotes()

// Computed property for vuedraggable to manage the order
const favoritesList = computed({
  get: () => favoriteNotes.value,
  set: (newList) => {
    const newIds = newList.map(item => item.id)
    updateFavoriteOrder(newIds)
  }
})
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-8">
      <div class="flex items-center gap-3 mb-2 text-soft-green-800">
        <i class="pi pi-star-fill text-2xl"></i>
        <h2 class="text-3xl font-bold">{{ t('favorites.title') }}</h2>
      </div>
      <p class="text-slate-500 text-sm">{{ t('favorites.description') }}</p>
    </header>
    
    <div v-if="favoritesList.length === 0" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 flex items-center justify-center flex-col min-h-[300px]">
      <i class="pi pi-star text-5xl text-soft-green-200 mb-4"></i>
      <p class="text-soft-green-600 font-medium">{{ t('favorites.emptyTitle') }}</p>
      <p class="text-slate-400 text-sm mt-1">{{ t('favorites.emptyDescription') }}</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div v-if="isDictionaryLoading" class="flex justify-center items-center py-8">
          <i class="pi pi-spinner pi-spin text-soft-green-500 text-3xl"></i>
          <span class="ml-3 text-soft-green-700">{{ t('history.syncing') }}</span>
      </div>
      
      <draggable 
        v-else
        v-model="favoritesList" 
        item-key="id"
        handle=".drag-handle"
        class="flex flex-col gap-4"
        ghost-class="opacity-50"
        drag-class="rotate-1"
        animation="300"
      >
        <template #item="{ element }">
          <div class="transition-all">
            <NoteCard 
              :note="element.note"
              :id="element.id"
              mode="favorites"
              :is-favorite="isFavorite(element.id)"
              :draggable="true"
              @toggle-favorite="toggleFavorite"
              @open-workbench="emit('open-workbench')"
            />
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>
