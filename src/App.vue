<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from './composables/useNotes'
import { useSettings } from './composables/useSettings'
import { 
  ensureDictionaryLoaded, 
  setDictionaryLanguage,
} from './services/dictionary'
import { loadLocaleMessages } from './i18n'

// Layout
import Sidebar from './components/layout/Sidebar.vue'
import SponsorModal from './components/modals/SponsorModal.vue'
import LanguageSelectModal from './components/modals/LanguageSelectModal.vue'

// Views (Code Splitting)
const NewNoteView = defineAsyncComponent(() => import('./components/views/NewNoteView.vue'))
const EditWorkbenchView = defineAsyncComponent(() => import('./components/views/EditWorkbenchView.vue'))
const HistoryView = defineAsyncComponent(() => import('./components/views/HistoryView.vue'))
const FavoritesView = defineAsyncComponent(() => import('./components/views/FavoritesView.vue'))
const RecommendedView = defineAsyncComponent(() => import('./components/views/RecommendedView.vue'))
const WorkbenchView = defineAsyncComponent(() => import('./components/views/WorkbenchView.vue'))
const SettingsView = defineAsyncComponent(() => import('./components/views/SettingsView.vue'))
const TodoListView = defineAsyncComponent(() => import('./components/views/TodoListView.vue'))
const FaqView = defineAsyncComponent(() => import('./components/views/FaqView.vue'))
const ChangelogView = defineAsyncComponent(() => import('./components/views/ChangelogView.vue'))
import logo from './assets/logo.png'

const { t, locale } = useI18n()
const { language, initialized, isDarkMode } = useSettings()
const { addNote, activeWorkbenchNote, notes } = useNotes()

// Sync Dark Mode
watch(isDarkMode, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })

// Sync i18n locale and dictionary language with settings
watch(language, async (newLang) => {
  await loadLocaleMessages(newLang)
  locale.value = newLang
  setDictionaryLanguage(newLang)
  ensureDictionaryLoaded()
}, { immediate: true })

// State for navigation
const currentTab = ref('new') // 'new' | 'editor' | 'history' | 'settings' | 'favorites' | 'recommended' | 'workbench' | 'todo'
const mainContainer = ref<HTMLElement | null>(null)
const isMobileMenuOpen = ref(false)
const isSponsorModalOpen = ref(false)
const isLanguageModalOpen = ref(!initialized.value)

// URL Hash Sync
const syncTabFromHash = () => {
  const hash = window.location.hash.replace('#', '')
  const validTabs = ['new', 'editor', 'history', 'settings', 'favorites', 'recommended', 'workbench', 'todo', 'faq', 'changelog']
  if (hash && validTabs.includes(hash)) {
    currentTab.value = hash
  }
}

const handleHashChange = () => {
  syncTabFromHash()
}

onMounted(() => {
  syncTabFromHash()
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange)
})

// Update hash when tab changes internally
watch(currentTab, (newTab) => {
  if (window.location.hash !== `#${newTab}`) {
    window.location.hash = newTab
  }
})

// Scroll to top when tab changes
watch(currentTab, () => {
  isMobileMenuOpen.value = false
  if (mainContainer.value) {
    mainContainer.value.scrollTo({ top: 0, behavior: 'auto' })
  }
})

// Handle data-loss fallback (e.g. page refresh while on workbench/todo)
watch([currentTab, activeWorkbenchNote], ([newTab, activeNote]) => {
  if ((newTab === 'workbench' || newTab === 'todo') && !activeNote) {
    console.warn(`[App] Data lost for tab "${newTab}", redirecting to home.`);
    currentTab.value = 'new'
  }
}, { immediate: true })

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

const handleLanguageSelect = (lang: string) => {
  language.value = lang as any
  initialized.value = true
  isLanguageModalOpen.value = false
}
</script>

<template>
  <div class="flex h-screen w-screen bg-soft-green-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 font-sans relative">
    <!-- Mobile Header -->
    <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-soft-green-100 dark:border-slate-800/50 flex items-center justify-between px-6 z-50">
      <div class="flex items-center gap-2">
        <img :src="logo" class="w-8 h-8 rounded-lg shadow-sm" alt="Logo" />
        <span class="font-bold text-soft-green-800 dark:text-soft-green-500 tracking-tight">{{ t('app.title') }}</span>
      </div>
      <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="w-10 h-10 rounded-xl bg-soft-green-50 dark:bg-slate-800 text-soft-green-600 dark:text-soft-green-400 flex items-center justify-center border border-soft-green-100 dark:border-slate-700 active:scale-95 transition-all">
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
      class="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-[70] lg:relative lg:w-72 lg:z-0 lg:translate-x-0 transition-transform duration-300 ease-out flex shadow-2xl lg:shadow-none"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <Sidebar v-model:currentTab="currentTab" @open-sponsor="isSponsorModalOpen = true" class="w-full h-full" />
    </aside>

    <!-- Main Content -->
    <main ref="mainContainer" class="flex-1 flex flex-col overflow-y-auto relative pt-16 lg:pt-0">
      <div class="absolute top-0 right-0 w-96 h-96 bg-lime-green-100 dark:bg-soft-green-900/20 rounded-bl-full opacity-50 -z-10 blur-3xl pointer-events-none"></div>

      <!-- Views via v-if to preserve simple typings without dynamic components casting -->
      <NewNoteView 
        v-if="currentTab === 'new'" 
        @create-note="handleCreateNote" 
      />

      <EditWorkbenchView 
        v-if="currentTab === 'editor'" 
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

      <ChangelogView 
        v-if="currentTab === 'changelog'" 
      />
    </main>

    <!-- Global Modals -->
    <SponsorModal v-model:visible="isSponsorModalOpen" />
    <LanguageSelectModal 
      v-model:visible="isLanguageModalOpen" 
      @select="handleLanguageSelect"
    />
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

/* Specific for settings lang toggle */
.settings-lang-toggle.p-selectbutton .p-button {
  @apply py-3 px-4 transition-all duration-300 !important;
}
</style>
