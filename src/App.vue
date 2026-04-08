<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from './composables/useNotes'
import { useSettings } from './composables/useSettings'
import { 
  ensureDictionaryLoaded, 
  setDictionaryLanguage,
} from './services/dictionary'

// Layout
import Sidebar from './components/layout/Sidebar.vue'

// Views
import NewNoteView from './components/views/NewNoteView.vue'
import HistoryView from './components/views/HistoryView.vue'
import FavoritesView from './components/views/FavoritesView.vue'
import RecommendedView from './components/views/RecommendedView.vue'
import WorkbenchView from './components/views/WorkbenchView.vue'
import SettingsView from './components/views/SettingsView.vue'

const { locale } = useI18n()
const { language } = useSettings()
const { notes, addNote, deleteNote } = useNotes()

// Sync i18n locale and dictionary language with settings
watch(language, (newLang) => {
  locale.value = newLang
  setDictionaryLanguage(newLang)
  ensureDictionaryLoaded()
}, { immediate: true })

// State for navigation
const currentTab = ref('new') // 'new' | 'history' | 'settings' | 'favorites' | 'recommended' | 'workbench'

const handleCreateNote = (title: string, items: { id: number, quantity: number }[]) => {
  addNote(title, items)
  currentTab.value = 'workbench'
}

const handleLanguageUpdate = (val: string) => {
  if (val) language.value = val as any
}
</script>

<template>
  <div class="flex h-screen w-screen bg-soft-green-50 overflow-hidden text-slate-800 font-sans">
    <!-- Sidebar -->
    <Sidebar v-model:currentTab="currentTab" :notesCount="notes.length" />

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-y-auto relative">
      <div class="absolute top-0 right-0 w-96 h-96 bg-lime-green-100 rounded-bl-full opacity-50 -z-10 blur-3xl pointer-events-none"></div>

      <!-- Views via v-if to preserve simple typings without dynamic components casting -->
      <NewNoteView 
        v-if="currentTab === 'new'" 
        @create-note="handleCreateNote" 
      />
      
      <FavoritesView 
        v-if="currentTab === 'favorites'" 
      />
      
      <RecommendedView 
        v-if="currentTab === 'recommended'" 
      />
      
      <HistoryView 
        v-if="currentTab === 'history'" 
        :notes="notes"
        @delete-note="deleteNote"
        @open-workbench="currentTab = 'workbench'"
      />
      
      <WorkbenchView 
        v-if="currentTab === 'workbench'" 
      />
      
      <SettingsView 
        v-if="currentTab === 'settings'" 
        :language="language" 
        @update:language="handleLanguageUpdate" 
      />
    </main>
  </div>
</template>

<style>
/* Global resets for number inputs */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
input[type="number"] {
  appearance: textfield;
}

/* Custom styles for SelectButton to match theme */
.settings-lang-toggle.p-selectbutton .p-button {
  @apply bg-white border-soft-green-100 text-slate-500 py-3 px-4 transition-all duration-300;
}
.settings-lang-toggle.p-selectbutton .p-button.p-highlight {
  @apply bg-soft-green-100 border-soft-green-200 text-soft-green-800 font-bold shadow-inner;
}
.settings-lang-toggle.p-selectbutton .p-button.p-highlight::before {
  @apply bg-soft-green-400;
}
</style>
