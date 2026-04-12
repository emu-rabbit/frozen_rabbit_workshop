<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchItems, type MockItem } from '../../services/dictionary'
import { useDebounceFn } from '@vueuse/core'

import InputText from 'primevue/inputtext'
import AutoComplete from 'primevue/autocomplete'

const { t, locale } = useI18n()

const emit = defineEmits<{
  'create-note': [title: string, items: { id: number, quantity: number }[], shouldFavorite: boolean]
}>()

const noteTitle = ref('')
const shouldFavorite = ref(false)

interface SearchRow {
  id: string
  query: string
  selectedItem: MockItem | null
  quantity: number
  suggestions: MockItem[]
  searching: boolean
  searchedEmpty: boolean
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

const onSearch = async (event: any, index: number) => {
  const row = searchRows.value[index]
  if (!row) return
  
  row.searching = true
  row.searchedEmpty = false
  
  // Update query string for focus tracking if needed
  row.query = event.query || ''
  
  const results = await searchItems(row.query)
  row.suggestions = results
  row.searching = false
  
  if (results.length === 0 && row.query.trim() !== '') {
    row.searchedEmpty = true
  }
}

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

const handleExportJson = () => {
  if (!noteTitle.value) return;

  const validItems = searchRows.value
    .filter(row => row.selectedItem !== null)
    .map(row => ({
      id: row.selectedItem!.id,
      quantity: row.quantity
    }))

  const exportData = {
    id: crypto.randomUUID(),
    name: noteTitle.value,
    items: validItems,
    createdAt: new Date().toISOString()
  }
  
  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    .then(() => alert(locale.value === 'cn' ? '笔记 JSON 已导出至剪贴板！' : '筆記 JSON 已匯出至剪貼簿！'))
    .catch(err => console.error('Export failed:', err))
}

const handleCreateNote = () => {
  if (!noteTitle.value) return;
  
  const validItems = searchRows.value
    .filter(row => row.selectedItem !== null)
    .map(row => ({
      id: row.selectedItem!.id,
      quantity: row.quantity
    }))

  emit('create-note', noteTitle.value, validItems, shouldFavorite.value)
  
  noteTitle.value = ''
  shouldFavorite.value = false
  searchRows.value = [{
    id: crypto.randomUUID(),
    query: '',
    quantity: 1,
    selectedItem: null,
    suggestions: [],
    searching: false,
    searchedEmpty: false
  }]
}
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-4xl w-full mx-auto">
    <header class="mb-6 md:mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 mb-2">{{ t('newNote.title') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('newNote.description') }}</p>
    </header>

    <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-5 md:p-8">
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

          <div class="flex flex-col gap-4">
            <div 
              v-for="(row, index) in searchRows" 
              :key="row.id"
              class="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100"
            >
              <div class="flex items-center gap-3">
                  <div class="w-8 h-8 flex items-center justify-center bg-soft-green-100 text-soft-green-600 rounded-lg shrink-0 font-bold">
                    {{ index + 1 }}
                  </div>
                  
                  <div class="sm:hidden flex-1">
                    <button v-if="searchRows.length > 1" @click="removeSearchRow(index)" class="float-right text-slate-300 hover:text-red-400 p-1">
                        <i class="pi pi-trash"></i>
                    </button>
                  </div>
              </div>

              <div class="flex-1 min-w-0">
                  <AutoComplete 
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

          <div>
            <button @click="addSearchRow" :disabled="!canAddRow" class="flex items-center gap-2 px-4 py-2 mt-2 border-2 border-dashed rounded-xl transition-all duration-300 font-medium text-sm" :class="canAddRow ? 'border-soft-green-300 text-soft-green-600 hover:bg-soft-green-50 hover:border-soft-green-400' : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50/50'">
              <i class="pi pi-plus"></i> {{ t('newNote.addRow') }}
            </button>
            <p v-if="!canAddRow" class="text-xs text-orange-400 mt-2 ml-1">{{ t('newNote.rowHint') }}</p>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-soft-green-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <label class="flex items-center gap-3 cursor-pointer group select-none">
              <div class="relative flex items-center justify-center">
                <input type="checkbox" v-model="shouldFavorite" class="peer appearance-none w-6 h-6 border-2 border-soft-green-200 rounded-lg checked:bg-soft-green-500 checked:border-soft-green-500 transition-all duration-300" />
                <i class="pi pi-check absolute text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-300 pointer-events-none text-xs font-bold"></i>
              </div>
              <span class="text-slate-600 font-medium group-hover:text-soft-green-700 transition-colors">{{ t('newNote.addToFavorites') }}</span>
            </label>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <button 
                @click="handleExportJson" 
                :disabled="!noteTitle"
                class="group flex items-center gap-0 hover:gap-3 px-3 py-3 rounded-xl font-bold text-soft-green-600 border-2 border-soft-green-100 hover:border-soft-green-200 hover:bg-soft-green-50 transition-all duration-500 active:scale-95 disabled:opacity-50 overflow-hidden"
                :title="t('newNote.copyJson')"
              >
                <i class="pi pi-copy text-xl"></i>
                <span class="max-w-0 group-hover:max-w-[300px] opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all duration-500 text-sm">
                  {{ t('newNote.copyJson') }}
                </span>
              </button>
              
              <button @click="handleCreateNote" :disabled="!noteTitle" class="flex-1 md:flex-none justify-center bg-soft-green-500 hover:bg-soft-green-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-6 md:px-8 py-3.5 rounded-xl font-bold shadow-md transition-all duration-300 transform active:scale-95 flex items-center gap-2 text-base md:text-lg">
                <i class="pi pi-save"></i> {{ t('newNote.save') }}
              </button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
