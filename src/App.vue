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
import SponsorModal from './components/modals/SponsorModal.vue'

// Views
import NewNoteView from './components/views/NewNoteView.vue'
import HistoryView from './components/views/HistoryView.vue'
import FavoritesView from './components/views/FavoritesView.vue'
import RecommendedView from './components/views/RecommendedView.vue'
import WorkbenchView from './components/views/WorkbenchView.vue'
import SettingsView from './components/views/SettingsView.vue'
import TodoListView from './components/views/TodoListView.vue'
import FaqView from './components/views/FaqView.vue'
import logo from './assets/logo.png'

const { t, locale } = useI18n()
const { language } = useSettings()
const { addNote, activeWorkbenchNote, notes } = useNotes()

// Sync i18n locale and dictionary language with settings
watch(language, (newLang) => {
  locale.value = newLang
  setDictionaryLanguage(newLang)
  ensureDictionaryLoaded()
}, { immediate: true })

// State for navigation
const currentTab = ref('new') // 'new' | 'history' | 'settings' | 'favorites' | 'recommended' | 'workbench' | 'todo'
const mainContainer = ref<HTMLElement | null>(null)
const isMobileMenuOpen = ref(false)
const isSponsorModalOpen = ref(false)

// Scroll to top when tab changes
watch(currentTab, () => {
  isMobileMenuOpen.value = false
  if (mainContainer.value) {
    mainContainer.value.scrollTo({ top: 0, behavior: 'auto' })
  }
})

const handleCreateNote = (title: string, items: { id: number, quantity: number }[], shouldFavorite: boolean) => {
  addNote(title, items, shouldFavorite)
  // The newly added note is at the top of the list
  const newNote = notes.value[0]
  if (newNote) {
    activeWorkbenchNote.value = newNote
  }
  currentTab.value = 'workbench'
}

const handleOpenWorkbench = (note: any) => {
  activeWorkbenchNote.value = note
  currentTab.value = 'workbench'
}

const handleLanguageUpdate = (val: string) => {
  if (val) language.value = val as any
}
</script>

<template>
  <div class="flex h-screen w-screen bg-soft-green-50 overflow-hidden text-slate-800 font-sans relative">
    <!-- Mobile Header -->
    <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-soft-green-100 flex items-center justify-between px-6 z-50">
      <div class="flex items-center gap-2">
        <img :src="logo" class="w-8 h-8 rounded-lg shadow-sm" alt="Logo" />
        <span class="font-bold text-soft-green-800 tracking-tight">{{ t('app.title') }}</span>
      </div>
      <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="w-10 h-10 rounded-xl bg-soft-green-50 text-soft-green-600 flex items-center justify-center border border-soft-green-100 active:scale-95 transition-all">
        <i class="pi" :class="isMobileMenuOpen ? 'pi-times' : 'pi-bars'"></i>
      </button>
    </header>

    <!-- Sidebar & Drawer -->
    <div 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
      :class="isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click="isMobileMenuOpen = false"
    ></div>

    <aside 
      class="fixed inset-y-0 left-0 w-72 bg-white z-[70] lg:relative lg:w-64 lg:z-0 lg:translate-x-0 transition-transform duration-300 ease-out flex shadow-2xl lg:shadow-none"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <Sidebar v-model:currentTab="currentTab" @open-sponsor="isSponsorModalOpen = true" class="w-full h-full" />
    </aside>

    <!-- Main Content -->
    <main ref="mainContainer" class="flex-1 flex flex-col overflow-y-auto relative pt-16 lg:pt-0">
      <div class="absolute top-0 right-0 w-96 h-96 bg-lime-green-100 rounded-bl-full opacity-50 -z-10 blur-3xl pointer-events-none"></div>

      <!-- Views via v-if to preserve simple typings without dynamic components casting -->
      <NewNoteView 
        v-if="currentTab === 'new'" 
        @create-note="handleCreateNote" 
      />
      
      <FavoritesView 
        v-if="currentTab === 'favorites'" 
        @open-workbench="handleOpenWorkbench"
      />
      
      <RecommendedView 
        v-if="currentTab === 'recommended'" 
        @open-workbench="handleOpenWorkbench"
      />
      
      <HistoryView 
        v-if="currentTab === 'history'" 
        @open-workbench="handleOpenWorkbench"
      />
      
      <WorkbenchView 
        v-if="currentTab === 'workbench'" 
        @generate-todo="currentTab = 'todo'"
      />

      <TodoListView
        v-if="currentTab === 'todo'"
        @back="currentTab = 'workbench'"
      />
      
      <FaqView
        v-if="currentTab === 'faq'"
      />
      
      <SettingsView 
        v-if="currentTab === 'settings'" 
        :language="language" 
        @update:language="handleLanguageUpdate" 
      />
    </main>

    <!-- Global Modals -->
    <SponsorModal v-model:visible="isSponsorModalOpen" />
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

/* Prevent layout shift when scrollbar appears */
main {
  scrollbar-gutter: stable;
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
