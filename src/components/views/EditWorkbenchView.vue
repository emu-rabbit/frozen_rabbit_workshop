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
    .then(() => alert(locale.value === 'cn' ? '笔记 JSON 已导出至剪贴板！' : '筆記 JSON 已匯出至剪貼簿！'))
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
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 mb-2">{{ t('editor.title') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('editor.description') }}</p>
    </header>

    <!-- Initial Import State -->
    <div v-if="!editorDraft.isEditing" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 flex flex-col gap-6">
        <div class="flex flex-col gap-3">
            <label class="font-bold text-soft-green-900 text-lg ml-1">{{ t('editor.importLabel') }}</label>
            <Textarea 
                v-model="editorDraft.rawJson" 
                rows="10" 
                :placeholder="t('editor.importPlaceholder')"
                class="w-full !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl font-mono text-sm p-4 bg-slate-50"
            />
            <p v-if="errorMessage" class="text-red-500 text-sm ml-1 flex items-center gap-1">
                <i class="pi pi-exclamation-circle"></i> {{ errorMessage }}
            </p>
        </div>
        <button 
            @click="handleLoadJson(false)" 
            :disabled="!editorDraft.rawJson.trim()"
            class="w-full justify-center bg-soft-green-500 hover:bg-soft-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-2 text-lg"
        >
            <i class="pi pi-download"></i> {{ t('editor.loadButton') }}
        </button>
    </div>

    <!-- Editing State -->
    <div v-else class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-5 md:p-8">
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <label for="editor-note-name" class="font-bold text-soft-green-900 text-lg ml-1">{{ t('newNote.labelTitle') }} <span class="text-red-400">*</span></label>
          <InputText 
            v-ffiv-clean
            id="editor-note-name" 
            v-model="editorDraft.noteTitle" 
            :placeholder="t('newNote.placeholderTitle')" 
            class="w-full !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl"
            size="large"
          />
        </div>
        
        <div class="flex flex-col gap-4 mt-2">
          <div class="ml-1 flex items-center justify-between">
            <div>
                <h3 class="font-bold text-soft-green-900 text-lg">{{ t('newNote.itemsTitle') }}</h3>
                <p class="text-sm text-slate-500">{{ t('newNote.itemsDescription') }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div 
              v-for="(row, index) in editorDraft.searchRows" 
              :key="row.id"
              class="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100"
            >
              <div class="flex items-center gap-3">
                  <div class="w-8 h-8 flex items-center justify-center bg-soft-green-100 text-soft-green-600 rounded-lg shrink-0 font-bold">
                    {{ index + 1 }}
                  </div>
                  <div class="sm:hidden flex-1">
                    <button @click="removeSearchRow(index)" class="float-right text-slate-300 hover:text-red-400 p-1">
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
                      input: { class: 'w-full !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl py-2 px-3' }
                    }"
                  >
                    <template #option="slotProps">
                        <div class="flex items-center gap-3 w-full">
                            <img v-if="slotProps.option.icon" :alt="slotProps.option.name" :src="slotProps.option.icon" class="w-6 h-6 object-cover rounded-sm shadow-sm" />
                            <div class="pi pi-box w-6 h-6 flex items-center justify-center text-slate-400 bg-slate-100 rounded-sm" v-else></div>
                            <div class="flex-1 truncate text-sm">{{ slotProps.option.name }}</div>
                        </div>
                    </template>
                  </AutoComplete>
                  <div v-if="row.selectedItem" class="mt-2 text-[12px] text-soft-green-700 bg-soft-green-100 border border-soft-green-200 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-2 max-w-full font-sans">
                    <img v-if="row.selectedItem.icon" :src="row.selectedItem.icon" class="w-4 h-4 rounded-sm" />
                    <span class="truncate font-medium">ID: {{ row.selectedItem.id }}</span>
                  </div>
              </div>

              <div class="flex items-center justify-between sm:justify-start gap-2">
                  <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm shrink-0">
                    <button @click="row.quantity = Math.max(1, row.quantity - 1)" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50" :disabled="row.quantity <= 1">
                      <i class="pi pi-minus text-sm"></i>
                    </button>
                    <input type="number" v-model.number="row.quantity" min="1" class="w-10 text-center text-sm font-medium focus:outline-none appearance-none bg-transparent" />
                    <button @click="row.quantity++" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                      <i class="pi pi-plus text-sm"></i>
                    </button>
                  </div>
                  <button @click="removeSearchRow(index)" class="hidden sm:flex w-10 h-10 rounded-lg items-center justify-center text-slate-400 hover:bg-neutral-100 hover:text-red-500 transition-colors shrink-0">
                    <i class="pi pi-trash"></i>
                  </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
            <button @click="addSearchRow" :disabled="!canAddRow" class="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-xl transition-all duration-300 font-medium text-sm" :class="canAddRow ? 'border-soft-green-300 text-soft-green-600 hover:bg-soft-green-50 hover:border-soft-green-400' : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50/50'">
              <i class="pi pi-plus"></i> {{ t('newNote.addRow') }}
            </button>
            
            <button @click="isMergeDialogOpen = true" class="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300 rounded-xl transition-all duration-300 font-medium text-sm">
              <i class="pi pi-clone"></i> {{ t('editor.mergeButton') }}
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-8 pt-6 border-t border-soft-green-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <label class="flex items-center gap-3 cursor-pointer group select-none">
              <div class="relative flex items-center justify-center">
                <input type="checkbox" v-model="editorDraft.shouldFavorite" class="peer appearance-none w-6 h-6 border-2 border-soft-green-200 rounded-lg checked:bg-soft-green-500 checked:border-soft-green-500 transition-all duration-300" />
                <i class="pi pi-check absolute text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-300 pointer-events-none text-xs font-bold"></i>
              </div>
              <span class="text-slate-600 font-medium group-hover:text-soft-green-700 transition-colors">{{ t('newNote.addToFavorites') }}</span>
            </label>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <button @click="handleExportJson" :disabled="!editorDraft.noteTitle" class="group flex items-center gap-0 hover:gap-3 px-3 py-3 rounded-xl font-bold text-soft-green-600 border-2 border-soft-green-100 hover:border-soft-green-200 hover:bg-soft-green-50 transition-all duration-500 active:scale-95 disabled:opacity-50 overflow-hidden" :title="t('newNote.copyJson')">
                <i class="pi pi-copy text-xl"></i>
                <span class="max-w-0 group-hover:max-w-[300px] opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-500 text-sm">
                  {{ t('newNote.copyJson') }}
                </span>
              </button>
              
              <button @click="handleCreateNote" :disabled="!editorDraft.noteTitle" class="flex-1 md:flex-none justify-center bg-soft-green-500 hover:bg-soft-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 md:px-8 py-3.5 rounded-xl font-bold shadow-md transition-all duration-300 transform active:scale-95 flex items-center gap-2 text-base md:text-lg">
                <i class="pi pi-save"></i> {{ t('newNote.save') }}
              </button>
            </div>
        </div>
      </div>
    </div>

    <!-- Simple Merge Dialog (Overlay) -->
    <div v-if="isMergeDialogOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="isMergeDialogOpen = false"></div>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-soft-green-50">
                <h3 class="font-bold text-soft-green-800 flex items-center gap-2">
                    <i class="pi pi-clone"></i> {{ t('editor.mergeButton') }}
                </h3>
                <button @click="isMergeDialogOpen = false" class="text-slate-400 hover:text-slate-600 transition-colors">
                    <i class="pi pi-times"></i>
                </button>
            </div>
            <div class="p-6 flex flex-col gap-4">
                <p class="text-sm text-slate-500">粘貼您想要合併進來的筆記 JSON，相同物品的數量將會自動相加。</p>
                <Textarea 
                    v-model="mergeRawJson" 
                    rows="8" 
                    :placeholder="t('editor.importPlaceholder')"
                    class="w-full !border-soft-green-200 focus:!border-soft-green-500 !ring-soft-green-500 rounded-xl font-mono text-xs p-4 bg-slate-50"
                />
            </div>
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button @click="isMergeDialogOpen = false" class="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                <button @click="confirmMerge" :disabled="!mergeRawJson.trim()" class="px-6 py-2 rounded-lg font-bold bg-soft-green-500 text-white hover:bg-soft-green-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all">確認合併</button>
            </div>
        </div>
    </div>

  </div>
</template>
