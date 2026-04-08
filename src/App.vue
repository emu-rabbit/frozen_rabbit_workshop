<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from './composables/useNotes'
import { useSettings, type Language } from './composables/useSettings'
import { 
  searchItems, 
  ensureDictionaryLoaded, 
  getDictionaryItem, 
  isDictionaryLoading, 
  setDictionaryLanguage,
  type MockItem 
} from './services/dictionary'
import { useDebounceFn } from '@vueuse/core'

// PrimeVue components
import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'
import SelectButton from 'primevue/selectbutton'

const { t, locale } = useI18n()
const { language } = useSettings()
const { notes, addNote, deleteNote } = useNotes()

// Sync i18n locale and dictionary language with settings
watch(language, (newLang) => {
  locale.value = newLang
  setDictionaryLanguage(newLang)
  ensureDictionaryLoaded()
}, { immediate: true })

// State for navigation
const currentTab = ref('new') // 'new' | 'history' | 'settings'

// Note creation states
const noteTitle = ref('')

interface SearchRow {
  id: string; // Used as key for v-for
  query: string; // The raw typed string
  selectedItem: MockItem | null; // The chosen item object
  quantity: number; // Item count
  suggestions: MockItem[]; // Results returned from API
  searching: boolean; // Loading state
  searchedEmpty: boolean; // True if API returned no results
}

const searchRows = ref<SearchRow[]>([{
  id: crypto.randomUUID(),
  query: '',
  quantity: 1,
  selectedItem: null,
  suggestions: [],
  searching: false,
  searchedEmpty: false
}])

// Debounced search logic for AutoComplete
const onSearch = useDebounceFn(async (event: any, index: number) => {
  const row = searchRows.value[index]
  if (!row) return
  
  row.searching = true
  row.searchedEmpty = false
  
  const results = await searchItems(event.query)
  row.suggestions = results
  row.searching = false
  
  if (results.length === 0 && event.query.trim() !== '') {
    row.searchedEmpty = true
  }
}, 400)

const addSearchRow = () => {
  const lastRow = searchRows.value[searchRows.value.length - 1]
  if (lastRow && !lastRow.selectedItem) {
    return
  }
  searchRows.value.push({
    id: crypto.randomUUID(),
    query: '',
    quantity: 1,
    selectedItem: null,
    suggestions: [],
    searching: false,
    searchedEmpty: false
  })
}

const removeSearchRow = (index: number) => {
  searchRows.value.splice(index, 1)
  if (searchRows.value.length === 0) {
    addSearchRow()
  }
}

const canAddRow = computed(() => {
  if (searchRows.value.length === 0) return true;
  const lastRow = searchRows.value[searchRows.value.length - 1]
  return !!lastRow.selectedItem
})

const handleCreateNote = () => {
  if (!noteTitle.value) return;
  
  const validItems = searchRows.value
    .filter(row => row.selectedItem !== null)
    .map(row => ({
      id: row.selectedItem!.id,
      quantity: row.quantity
    }))

  addNote(noteTitle.value, validItems)
  
  noteTitle.value = ''
  searchRows.value = [{
    id: crypto.randomUUID(),
    query: '',
    quantity: 1,
    selectedItem: null,
    suggestions: [],
    searching: false,
    searchedEmpty: false
  }]
  currentTab.value = 'history'
}

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return t('history.unknownDate')
  
  // Format based on locale
  return new Intl.DateTimeFormat(locale.value === 'tw' ? 'zh-TW' : locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

const langOptions = [
  { label: '繁體中文', value: 'tw' },
  { label: '简体中文', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' }
]
</script>

<template>
  <div class="flex h-screen w-screen bg-soft-green-50 overflow-hidden text-slate-800 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow-lg border-r border-soft-green-100 flex flex-col transition-all overflow-y-auto">
      <div class="p-6 pb-2">
        <h1 class="text-lg font-bold text-soft-green-800 flex items-center gap-2 leading-tight">
          <i class="pi pi-compass text-2xl text-lime-green-600"></i>
          {{ t('app.title') }}
        </h1>
        <p class="text-xs text-soft-green-600 mt-2">{{ t('app.subtitle') }}</p>
      </div>

      <nav class="flex-1 mt-6 px-4 flex flex-col gap-2">
        <button 
          @click="currentTab = 'new'"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
          :class="currentTab === 'new' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
        >
          <i class="pi pi-plus-circle"></i>
          {{ t('nav.newNote') }}
        </button>

        <button 
          @click="currentTab = 'history'"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium"
          :class="currentTab === 'history' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
        >
          <i class="pi pi-book"></i>
          {{ t('nav.history') }}
          <span v-if="notes.length > 0" class="ml-auto bg-soft-green-200 text-soft-green-800 text-xs px-2 py-0.5 rounded-full">{{ notes.length }}</span>
        </button>

        <button 
          @click="currentTab = 'settings'"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left font-medium mt-auto mb-4"
          :class="currentTab === 'settings' ? 'bg-soft-green-100 text-soft-green-800 shadow-sm' : 'text-slate-600 hover:bg-soft-green-50 hover:text-soft-green-700'"
        >
          <i class="pi pi-cog"></i>
          {{ t('nav.settings') }}
        </button>
      </nav>
      
      <div class="p-4 border-t border-soft-green-50">
        <div class="text-xs text-center text-slate-400">
          v0.2.0-beta
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-y-auto relative">
      <div class="absolute top-0 right-0 w-96 h-96 bg-lime-green-100 rounded-bl-full opacity-50 -z-10 blur-3xl pointer-events-none"></div>

      <!-- NEW NOTE TAB -->
      <div class="p-8 max-w-4xl w-full mx-auto" v-if="currentTab === 'new'">
        <header class="mb-8">
          <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('newNote.title') }}</h2>
          <p class="text-slate-500 text-sm">{{ t('newNote.description') }}</p>
        </header>

        <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8">
          <div class="flex flex-col gap-8">
            <div class="flex flex-col gap-2">
              <label for="item-name" class="font-bold text-soft-green-900 text-lg ml-1">{{ t('newNote.labelTitle') }} <span class="text-red-400">*</span></label>
              <InputText 
                id="item-name" 
                v-model="noteTitle" 
                :placeholder="t('newNote.placeholderTitle')" 
                class="w-full !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl"
                size="large"
              />
            </div>
            
            <div class="flex flex-col gap-4 mt-2">
              <div class="ml-1">
                <h3 class="font-bold text-soft-green-900 text-lg">{{ t('newNote.itemsTitle') }}</h3>
                <p class="text-sm text-slate-500">{{ t('newNote.itemsDescription') }}</p>
              </div>

              <div class="flex flex-col gap-3">
                <div 
                  v-for="(row, index) in searchRows" 
                  :key="row.id"
                  class="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100"
                >
                  <div class="w-10 h-10 flex items-center justify-center bg-soft-green-100 text-soft-green-600 rounded-lg shrink-0 mt-0.5">
                    {{ index + 1 }}
                  </div>

                  <div class="flex-1 min-w-0">
                     <AutoComplete 
                        v-model="row.selectedItem" 
                        :suggestions="row.suggestions" 
                        @complete="onSearch($event, index)"
                        :delay="0" 
                        optionLabel="name" 
                        :placeholder="t('newNote.searchPlaceholder')" 
                        class="w-full"
                        :pt="{
                          input: { class: 'w-full !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl py-2 px-3' }
                        }"
                      >
                        <template #option="slotProps">
                            <div class="flex items-center gap-3 w-full">
                                <img v-if="slotProps.option.icon" :alt="slotProps.option.name" :src="slotProps.option.icon" class="w-6 h-6 object-cover rounded-sm shadow-sm" />
                                <div class="pi pi-box w-6 h-6 flex items-center justify-center text-slate-400 bg-slate-100 rounded-sm" v-else></div>
                                <div class="flex-1 truncate">{{ slotProps.option.name }}</div>
                            </div>
                        </template>
                        <template #empty>
                            <div class="p-3 text-slate-500 text-sm flex items-center gap-2">
                              <i v-if="row.searching" class="pi pi-spinner pi-spin"></i>
                              <i v-else-if="row.searchedEmpty" class="pi pi-exclamation-triangle text-orange-400"></i>
                              <span v-if="row.searching">{{ t('newNote.searching') }}</span>
                              <span v-else-if="row.searchedEmpty">{{ t('newNote.notFound') }}</span>
                              <span v-else>{{ t('newNote.initialSearch') }}</span>
                            </div>
                        </template>
                      </AutoComplete>

                      <div v-if="row.selectedItem" class="mt-2 text-sm text-soft-green-700 bg-soft-green-100 border border-soft-green-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 max-w-full font-sans">
                        <img v-if="row.selectedItem.icon" :src="row.selectedItem.icon" class="w-4 h-4 rounded-sm" />
                        <span class="truncate font-medium">ID: {{ row.selectedItem.id }}</span>
                      </div>
                  </div>

                  <div class="flex items-center gap-1 mt-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm shrink-0">
                    <button @click="row.quantity = Math.max(1, row.quantity - 1)" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50" :disabled="row.quantity <= 1">
                      <i class="pi pi-minus text-sm"></i>
                    </button>
                    <input type="number" v-model.number="row.quantity" min="1" class="w-12 text-center text-sm font-medium focus:outline-none appearance-none bg-transparent" />
                    <button @click="row.quantity++" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                      <i class="pi pi-plus text-sm"></i>
                    </button>
                  </div>

                  <button @click="removeSearchRow(index)" class="w-10 h-10 mt-0.5 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>

              <div>
                <button @click="addSearchRow" :disabled="!canAddRow" class="flex items-center gap-2 px-4 py-2 mt-2 border-2 border-dashed rounded-xl transition-all duration-300 font-medium text-sm" :class="canAddRow ? 'border-soft-green-300 text-soft-green-600 hover:bg-soft-green-50 hover:border-soft-green-400' : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50/50'">
                  <i class="pi pi-plus"></i> {{ t('newNote.addRow') }}
                </button>
                <p v-if="!canAddRow" class="text-xs text-orange-400 mt-2 ml-1">{{ t('newNote.rowHint') }}</p>
              </div>
            </div>

            <div class="mt-8 pt-6 border-t border-soft-green-100 flex justify-end">
               <button @click="handleCreateNote" :disabled="!noteTitle" class="bg-soft-green-500 hover:bg-soft-green-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all duration-300 transform active:scale-95 flex items-center gap-2 text-lg">
                 <i class="pi pi-save"></i> {{ t('newNote.save') }}
               </button>
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORY TAB -->
      <div class="p-8 max-w-4xl w-full mx-auto" v-if="currentTab === 'history'">
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
          
          <div v-else v-for="note in notes" :key="note.id" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-lime-green-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="md:w-1/3 pr-4">
              <h3 class="text-xl font-bold text-soft-green-900 mb-2 leading-tight">{{ note.name }}</h3>
              <p class="text-xs text-slate-500 flex items-center gap-1.5 font-sans">
                <i class="pi pi-clock text-[10px]"></i> {{ formatDate(note.createdAt) }}
              </p>
            </div>
            
            <div class="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 w-full">
               <div class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{{ t('history.itemsCount') }} ({{note.items.length}})</div>
               <div v-if="note.items.length === 0" class="text-slate-400 text-sm italic py-2">{{ t('history.noItems') }}</div>
               <div v-else class="flex flex-wrap gap-2">
                 <div v-for="item in note.items" :key="item.id" class="bg-white border border-soft-green-200 text-slate-700 text-sm shadow-sm overflow-hidden flex items-center h-8 rounded-lg font-sans">
                   <div class="h-full w-8 bg-soft-green-50 border-r border-soft-green-100 flex items-center justify-center shrink-0">
                     <img v-if="getDictionaryItem(item.id)?.icon" :src="getDictionaryItem(item.id)?.icon" class="w-5 h-5 rounded-sm object-cover" />
                     <i v-else class="pi pi-box text-xs text-slate-300"></i>
                   </div>
                   <div class="bg-soft-green-100 text-soft-green-800 text-xs font-bold px-2 py-0.5 rounded ml-2">x{{ item.quantity }}</div>
                   <div class="px-2 pr-3 min-w-0 truncate font-medium">{{ getDictionaryItem(item.id)?.name || t('history.unknownItem') }}</div>
                 </div>
               </div>
            </div>
            
            <div class="flex gap-2">
              <button @click="deleteNote(note.id)" class="w-10 h-10 rounded-full flex items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SETTINGS TAB -->
      <div class="p-8 max-w-4xl w-full mx-auto" v-if="currentTab === 'settings'">
        <header class="mb-8">
          <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('settings.title') }}</h2>
          <p class="text-slate-500 text-sm">{{ t('settings.description') }}</p>
        </header>

        <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8">
           <div class="flex flex-col gap-6">
              <div class="flex flex-col gap-3">
                 <label class="font-bold text-soft-green-900 text-lg">{{ t('settings.language') }}</label>
                 <SelectButton v-model="language" :options="langOptions" optionLabel="label" optionValue="value" aria-labelledby="basic" class="settings-lang-toggle" />
              </div>
           </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
/* Global resets for number inputs */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
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
