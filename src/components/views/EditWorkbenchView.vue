<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchItems, ensureDictionaryLoaded, getDictionaryItem } from '../../services/dictionary'
import { useDrafts } from '../../composables/useDrafts'
import { vFfivClean } from '../../utils/inputUtils'

import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'
import Textarea from 'primevue/textarea'

const { t, locale } = useI18n()
const { editorDraft, resetEditorDraft } = useDrafts()

const isCopied = ref(false)

const emit = defineEmits<{
  'create-note': [title: string, items: { id: number, quantity: number }[], shouldFavorite: boolean]
}>()

// --- Local UI State ---
const errorMessage = ref('')
const isMergeDialogOpen = ref(false)
const mergeRawJson = ref('')

// --- Logic ---

const handleLoadJson = async (append = false) => {
  try {
    errorMessage.value = ''
    const data = JSON.parse(append ? editorDraft.rawJson : editorDraft.rawJson) // Using the global draft
    
    // Basic validation
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid format')
    }

    await ensureDictionaryLoaded()

    if (!append) {
      editorDraft.noteTitle = data.name || t('editor.defaultMergedName')
      editorDraft.searchRows = []
    } else {
      // Per user request: Change name to "Merged Unnamed Note" upon merge
      editorDraft.noteTitle = t('editor.defaultMergedName')
    }

    const existingRows = [...editorDraft.searchRows]

    for (const itemData of data.items) {
      const itemMetadata = getDictionaryItem(itemData.id)
      if (!itemMetadata) continue

      // Merge logic: check if id already exists in our current rows
      const existingRow = existingRows.find(r => r.selectedItem?.id === itemData.id)
      if (existingRow) {
        existingRow.quantity += (itemData.quantity || 1)
      } else {
        existingRows.push({
          id: crypto.randomUUID(),
          query: '',
          quantity: itemData.quantity || 1,
          selectedItem: itemMetadata,
          suggestions: [],
          searching: false,
          searchedEmpty: false
        })
      }
    }

    editorDraft.searchRows = existingRows
    editorDraft.isEditing = true
    editorDraft.rawJson = '' // Clear textarea for next merge
  } catch (err) {
    console.error('JSON parse error:', err)
    errorMessage.value = t('editor.invalidJson')
  }
}

const onSearch = async (event: any, index: number) => {
  const row = editorDraft.searchRows[index]
  if (!row) return
  row.searching = true
  row.searchedEmpty = false
  row.query = event.query || ''
  const results = await searchItems(row.query)
  row.suggestions = results
  row.searching = false
  if (results.length === 0 && row.query.trim() !== '') {
    row.searchedEmpty = true
  }
}

const addSearchRow = () => {
  editorDraft.searchRows.push({
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
  editorDraft.searchRows.splice(index, 1)
  if (editorDraft.searchRows.length === 0) {
    editorDraft.isEditing = false // Back to import if everything is gone
  }
}

const canAddRow = computed(() => {
  if (editorDraft.searchRows.length === 0) return true;
  const lastRow = editorDraft.searchRows[editorDraft.searchRows.length - 1]
  return !!lastRow.selectedItem
})

const handleExportJson = () => {
  if (!editorDraft.noteTitle) return;
  const validItems = editorDraft.searchRows
    .filter(row => row.selectedItem !== null)
    .map(row => ({ id: row.selectedItem!.id, quantity: row.quantity }))

  const exportData = {
    id: crypto.randomUUID(),
    name: editorDraft.noteTitle,
    items: validItems,
    createdAt: new Date().toISOString()
  }
  
  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    .then(() => {
        isCopied.value = true
        setTimeout(() => isCopied.value = false, 2000)
    })
    .catch(err => console.error('Export failed:', err))
}

const handleCreateNote = () => {
  if (!editorDraft.noteTitle) return;
  const validItems = editorDraft.searchRows
    .filter(row => row.selectedItem !== null)
    .map(row => ({ id: row.selectedItem!.id, quantity: row.quantity }))

  emit('create-note', editorDraft.noteTitle, validItems, editorDraft.shouldFavorite)
  
  resetEditorDraft()
}

const confirmMerge = () => {
    editorDraft.rawJson = mergeRawJson.value
    handleLoadJson(true)
    isMergeDialogOpen.value = false
    mergeRawJson.value = ''
}

</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-4xl w-full mx-auto pb-24">
    <header class="mb-6 md:mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400 mb-2">{{ t('editor.title') }}</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm">{{ t('editor.description') }}</p>
    </header>

    <!-- Initial Import State -->
    <div v-if="!editorDraft.isEditing" class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-8 flex flex-col gap-6">
        <div class="flex flex-col gap-3">
            <label class="font-bold text-soft-green-900 dark:text-soft-green-400 text-lg ml-1">{{ t('editor.importLabel') }}</label>
            <Textarea 
                v-model="editorDraft.rawJson" 
                rows="10" 
                :placeholder="t('editor.importPlaceholder')"
                class="w-full !border-soft-green-200 dark:!border-slate-700 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl font-mono text-sm p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
            />
            <p v-if="errorMessage" class="text-red-500 dark:text-red-400 text-sm ml-1 flex items-center gap-1">
                <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
            </p>
        </div>
        <button 
            @click="handleLoadJson(false)" 
            :disabled="!editorDraft.rawJson.trim()"
            class="w-full justify-center bg-soft-green-500 dark:bg-soft-green-600 hover:bg-soft-green-600 dark:hover:bg-soft-green-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-2 text-lg"
        >
            <i class="pi pi-download"></i> {{ t('editor.loadButton') }}
        </button>
    </div>

    <!-- Editing State -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8">
      <div class="flex flex-col gap-8">
        <div class="flex items-center justify-between">
            <h3 class="font-bold text-soft-green-800 dark:text-soft-green-400 text-xl">{{ t('editor.title') }} ({{ t('nav.editor') }})</h3>
            <button @click="resetEditorDraft()" class="text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1">
                <i class="pi pi-undo"></i> {{ t('editor.backToImport') }}
            </button>
        </div>

        <div class="flex flex-col gap-2">
          <label for="editor-note-name" class="font-bold text-soft-green-900 dark:text-soft-green-400 text-lg ml-1">{{ t('newNote.labelTitle') }} <span class="text-red-400">*</span></label>
          <InputText 
            v-ffiv-clean
            id="editor-note-name" 
            v-model="editorDraft.noteTitle" 
            :placeholder="t('newNote.placeholderTitle')" 
            class="w-full !border-soft-green-200 dark:!border-slate-700 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl dark:bg-slate-800 dark:text-slate-200"
            size="large"
          />
        </div>
        
        <div class="flex flex-col gap-4 mt-2">
          <div class="ml-1 flex items-center justify-between">
            <div>
                <h3 class="font-bold text-soft-green-900 dark:text-soft-green-400 text-lg">{{ t('newNote.itemsTitle') }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ t('newNote.itemsDescription') }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div 
              v-for="(row, index) in editorDraft.searchRows" 
              :key="row.id"
              class="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700"
            >
              <div class="flex items-center gap-3">
                  <div class="w-8 h-8 flex items-center justify-center bg-soft-green-100 dark:bg-soft-green-900/40 text-soft-green-600 dark:text-soft-green-400 rounded-lg shrink-0 font-bold">
                    {{ index + 1 }}
                  </div>
                  <div class="sm:hidden flex-1">
                    <button @click="removeSearchRow(index)" class="float-right text-slate-300 dark:text-slate-600 hover:text-red-400 p-1">
                        <i class="pi pi-trash"></i>
                    </button>
                  </div>
              </div>

              <div class="flex-1 min-w-0">
                  <AutoComplete 
                    v-ffiv-clean
                    v-model="row.selectedItem" 
                    :suggestions="row.suggestions" 
                    @complete="onSearch($event, index)"
                    completeOnFocus
                    :minQueryLength="0"
                    :delay="400" 
                    optionLabel="name" 
                    :placeholder="t('newNote.searchPlaceholder')" 
                    class="w-full"
                    :pt="{
                      input: { 
                        class: 'w-full bg-white dark:!bg-slate-950 border-soft-green-200 dark:!border-slate-800 text-slate-900 dark:!text-white focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl py-2 px-3 placeholder:dark:text-slate-600'
                      },
                      panel: {
                        class: 'dark:!bg-slate-900 dark:!border-slate-800 dark:!text-slate-100'
                      },
                      list: {
                        class: 'dark:!bg-slate-900'
                      },
                      item: {
                        class: 'dark:!text-slate-300 dark:hover:!bg-slate-800'
                      },
                      emptyMessage: {
                        class: 'dark:!bg-slate-900 dark:!text-slate-400'
                      }
                    }"
                  >
                    <template #option="slotProps">
                        <div class="flex items-center gap-3 w-full">
                            <img v-if="slotProps.option.icon" :alt="slotProps.option.name" :src="slotProps.option.icon" class="w-6 h-6 object-cover rounded-sm shadow-sm" />
                            <div class="pi pi-box w-6 h-6 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-sm" v-else></div>
                            <div class="flex-1 truncate text-sm">{{ slotProps.option.name }}</div>
                        </div>
                    </template>
                  </AutoComplete>
                  <div v-if="row.selectedItem" class="mt-2 text-[12px] text-soft-green-700 dark:text-soft-green-300 bg-soft-green-50 dark:bg-soft-green-900/30 border border-soft-green-100 dark:border-soft-green-800/50 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-2 max-w-full font-sans shadow-sm">
                    <img v-if="row.selectedItem.icon" :src="row.selectedItem.icon" class="w-4 h-4 rounded-sm" />
                    <span class="truncate font-bold tracking-tight">ID: {{ row.selectedItem.id }}</span>
                  </div>
              </div>

              <div class="flex items-center justify-between sm:justify-start gap-2">
                  <div class="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-sm shrink-0">
                    <button @click="row.quantity = Math.max(1, row.quantity - 1)" class="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50" :disabled="row.quantity <= 1">
                      <i class="pi pi-minus text-sm"></i>
                    </button>
                    <input type="number" v-model.number="row.quantity" min="1" class="w-10 text-center text-sm font-medium focus:outline-none appearance-none bg-transparent dark:text-slate-200" />
                    <button @click="row.quantity++" class="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                      <i class="pi pi-plus text-sm"></i>
                    </button>
                  </div>
                  <button @click="removeSearchRow(index)" class="hidden sm:flex w-10 h-10 rounded-lg items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-red-500 transition-colors shrink-0">
                    <i class="pi pi-trash"></i>
                  </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
            <button @click="addSearchRow" :disabled="!canAddRow" class="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-xl transition-all duration-300 font-medium text-sm" :class="canAddRow ? 'border-soft-green-300 dark:border-soft-green-900/60 text-soft-green-600 dark:text-soft-green-400 hover:bg-soft-green-50 dark:hover:bg-soft-green-950/20 hover:border-soft-green-400' : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/30'">
              <i class="pi pi-plus"></i> {{ t('newNote.addRow') }}
            </button>
            
            <button @click="isMergeDialogOpen = true" class="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-sky-200 dark:border-sky-900/60 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:border-sky-300 rounded-xl transition-all duration-300 font-medium text-sm">
              <i class="pi pi-clone"></i> {{ t('editor.mergeButton') }}
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-8 pt-6 border-t border-soft-green-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <label class="flex items-center gap-3 cursor-pointer group select-none">
              <div class="relative flex items-center justify-center">
                <input type="checkbox" v-model="editorDraft.shouldFavorite" class="peer appearance-none w-6 h-6 border-2 border-soft-green-200 dark:border-slate-700 rounded-lg checked:bg-soft-green-500 checked:border-soft-green-500 transition-all duration-300" />
                <i class="pi pi-check absolute text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-300 pointer-events-none text-xs font-bold"></i>
              </div>
              <span class="text-slate-600 dark:text-slate-400 font-medium group-hover:text-soft-green-700 dark:group-hover:text-soft-green-400 transition-colors">{{ t('newNote.addToFavorites') }}</span>
            </label>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <button @click="handleExportJson" :disabled="!editorDraft.noteTitle" class="group flex items-center gap-0 hover:gap-3 px-3 py-3 rounded-xl font-bold text-soft-green-600 dark:text-soft-green-400 border-2 border-soft-green-100 dark:border-slate-800 hover:border-soft-green-200 dark:hover:border-soft-green-700 hover:bg-soft-green-50 dark:hover:bg-soft-green-950/20 transition-all duration-500 active:scale-95 disabled:opacity-50 overflow-hidden" :title="t('newNote.copyJson')">
                <transition name="scale" mode="out-in">
                  <i v-if="isCopied" class="pi pi-check text-xl text-soft-green-600 dark:text-soft-green-400"></i>
                  <i v-else class="pi pi-copy text-xl"></i>
                </transition>
                <span class="max-w-0 group-hover:max-w-[300px] opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-500 text-sm">
                  {{ t('newNote.copyJson') }}
                </span>
              </button>
              
              <button @click="handleCreateNote" :disabled="!editorDraft.noteTitle" class="flex-1 md:flex-none justify-center bg-soft-green-500 dark:bg-soft-green-600 hover:bg-soft-green-600 dark:hover:bg-soft-green-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white px-6 md:px-8 py-3.5 rounded-xl font-bold shadow-md transition-all duration-300 transform active:scale-95 flex items-center gap-2 text-base md:text-lg">
                <i class="pi pi-save"></i> {{ t('newNote.save') }}
              </button>
            </div>
        </div>
      </div>
    </div>

    <!-- Simple Merge Dialog (Overlay) -->
    <div v-if="isMergeDialogOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isMergeDialogOpen = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border dark:border-slate-800">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-soft-green-50 dark:bg-slate-950">
                <h3 class="font-bold text-soft-green-800 dark:text-soft-green-400 flex items-center gap-2">
                    <i class="pi pi-clone"></i> {{ t('editor.mergeButton') }}
                </h3>
                <button @click="isMergeDialogOpen = false" class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <i class="pi pi-times"></i>
                </button>
            </div>
            <div class="p-6 flex flex-col gap-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">粘貼您想要合併進來的筆記 JSON，相同物品的數量將會自動相加。</p>
                <Textarea 
                    v-model="mergeRawJson" 
                    rows="8" 
                    :placeholder="t('editor.importPlaceholder')"
                    class="w-full !border-soft-green-200 dark:!border-slate-700 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl font-mono text-xs p-4 bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
                />
            </div>
            <div class="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button @click="isMergeDialogOpen = false" class="px-4 py-2 rounded-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">取消</button>
                <button @click="confirmMerge" :disabled="!mergeRawJson.trim()" class="px-6 py-2 rounded-lg font-bold bg-soft-green-500 dark:bg-soft-green-600 text-white hover:bg-soft-green-600 dark:hover:bg-soft-green-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-all">確認合併</button>
            </div>
        </div>
    </div>

  </div>
</template>
