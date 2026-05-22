<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  filterSearchableItems,
  getItemCategoryGroup,
  getOrderedEquipmentJobs,
  getSearchableItems,
  isDictionaryLoading,
  type ItemCategoryGroup,
  type MockItem
} from '../../services/dictionary'
import { vFfivClean } from '../../utils/inputUtils'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [item: MockItem]
}>()

const { t } = useI18n()

const query = ref('')
const ilvlMin = ref<number | null>(null)
const ilvlMax = ref<number | null>(null)
const equipLevelMin = ref<number | null>(null)
const equipLevelMax = ref<number | null>(null)
const selectedJob = ref('')
const selectedCategory = ref<ItemCategoryGroup | 'all'>('all')
const selectedItem = ref<MockItem | null>(null)
const results = ref<MockItem[]>([])
const allItems = ref<MockItem[]>([])
const isFiltering = ref(false)

let filterSequence = 0

const categoryOptions: Array<{ value: ItemCategoryGroup | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'newNote.filter.categories.all' },
  { value: 'weapon', labelKey: 'newNote.filter.categories.weapon' },
  { value: 'tool', labelKey: 'newNote.filter.categories.tool' },
  { value: 'armor', labelKey: 'newNote.filter.categories.armor' },
  { value: 'accessory', labelKey: 'newNote.filter.categories.accessory' },
  { value: 'medicine', labelKey: 'newNote.filter.categories.medicine' },
  { value: 'food', labelKey: 'newNote.filter.categories.food' },
  { value: 'material', labelKey: 'newNote.filter.categories.material' },
  { value: 'furniture', labelKey: 'newNote.filter.categories.furniture' },
  { value: 'other', labelKey: 'newNote.filter.categories.other' },
]

const jobOptions = computed(() => {
  const jobs = new Set<string>()
  allItems.value.forEach(item => {
    item.equipJobs?.forEach(job => jobs.add(job))
  })
  return getOrderedEquipmentJobs(jobs)
})

const getJobLabel = (job: string) => {
  const translated = t(`newNote.filter.jobs.${job}`)
  return translated === `newNote.filter.jobs.${job}` ? job : translated
}

const getCategoryLabel = (item: MockItem) => {
  return t(`newNote.filter.categories.${getItemCategoryGroup(item)}`)
}

const hasActiveFilters = computed(() => {
  return !!query.value.trim()
    || ilvlMin.value !== null
    || ilvlMax.value !== null
    || equipLevelMin.value !== null
    || equipLevelMax.value !== null
    || !!selectedJob.value
    || selectedCategory.value !== 'all'
})

const runFilter = async () => {
  const sequence = ++filterSequence
  isFiltering.value = true

  const filtered = await filterSearchableItems({
    query: query.value,
    ilvlMin: ilvlMin.value,
    ilvlMax: ilvlMax.value,
    equipLevelMin: equipLevelMin.value,
    equipLevelMax: equipLevelMax.value,
    job: selectedJob.value,
    categoryGroup: selectedCategory.value,
  })

  if (sequence === filterSequence) {
    results.value = filtered
    if (selectedItem.value && !filtered.some(item => item.id === selectedItem.value?.id)) {
      selectedItem.value = null
    }
    isFiltering.value = false
  }
}

const clearFilters = () => {
  query.value = ''
  ilvlMin.value = null
  ilvlMax.value = null
  equipLevelMin.value = null
  equipLevelMax.value = null
  selectedJob.value = ''
  selectedCategory.value = 'all'
}

const chooseItem = (item: MockItem) => {
  selectedItem.value = item
}

const confirmSelection = () => {
  if (!selectedItem.value) return
  emit('select', selectedItem.value)
  emit('close')
}

watch(() => props.visible, async (visible) => {
  if (!visible) return

  selectedItem.value = null
  isFiltering.value = true
  allItems.value = await getSearchableItems()
  await runFilter()
})

watch([query, ilvlMin, ilvlMax, equipLevelMin, equipLevelMax, selectedJob, selectedCategory], () => {
  if (props.visible) {
    runFilter()
  }
})
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>

    <div class="relative z-10 my-auto w-full min-w-0 max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-soft-green-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      <div class="px-4 sm:px-5 md:px-6 py-4 border-b border-soft-green-100 dark:border-slate-800 bg-soft-green-50 dark:bg-slate-950 flex items-center justify-between gap-3 sm:gap-4">
        <div class="min-w-0">
          <h3 class="font-bold text-lg text-soft-green-800 dark:text-soft-green-400 flex items-center gap-2 min-w-0">
            <i class="pi pi-filter"></i>
            <span class="truncate">{{ t('newNote.filter.title') }}</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ t('newNote.filter.description') }}</p>
        </div>
        <button @click="emit('close')" class="w-9 h-9 shrink-0 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors" :title="t('newNote.filter.close')">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] min-h-0 overflow-y-auto lg:overflow-hidden">
        <aside class="min-w-0 p-4 sm:p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 lg:overflow-y-auto">
          <div class="flex flex-col gap-4">
            <label class="flex min-w-0 flex-col gap-1.5">
              <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.keyword') }}</span>
              <input
                v-ffiv-clean
                v-model="query"
                type="text"
                class="filter-input"
                :placeholder="t('newNote.searchPlaceholder')"
              />
            </label>

            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <label class="flex min-w-0 flex-col gap-1.5">
                <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.ilvlMin') }}</span>
                <input v-model.number="ilvlMin" type="number" min="0" class="filter-input" />
              </label>
              <label class="flex min-w-0 flex-col gap-1.5">
                <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.ilvlMax') }}</span>
                <input v-model.number="ilvlMax" type="number" min="0" class="filter-input" />
              </label>
            </div>

            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <label class="flex min-w-0 flex-col gap-1.5">
                <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.equipLevelMin') }}</span>
                <input v-model.number="equipLevelMin" type="number" min="0" class="filter-input" />
              </label>
              <label class="flex min-w-0 flex-col gap-1.5">
                <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.equipLevelMax') }}</span>
                <input v-model.number="equipLevelMax" type="number" min="0" class="filter-input" />
              </label>
            </div>

            <label class="flex min-w-0 flex-col gap-1.5">
              <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.job') }}</span>
              <select v-model="selectedJob" class="filter-input">
                <option value="">{{ t('newNote.filter.allJobs') }}</option>
                <option v-for="job in jobOptions" :key="job" :value="job">{{ getJobLabel(job) }}</option>
              </select>
            </label>

            <label class="flex min-w-0 flex-col gap-1.5">
              <span class="text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{{ t('newNote.filter.category') }}</span>
              <select v-model="selectedCategory" class="filter-input">
                <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                  {{ t(option.labelKey) }}
                </option>
              </select>
            </label>

            <button
              @click="clearFilters"
              :disabled="!hasActiveFilters"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {{ t('newNote.filter.clear') }}
            </button>
          </div>
        </aside>

        <section class="min-w-0 p-4 sm:p-5 md:p-6 min-h-0 flex flex-col">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="text-sm text-slate-500 dark:text-slate-400">
              {{ t('newNote.filter.resultCount', { count: results.length }) }}
            </div>
            <i v-if="isFiltering || isDictionaryLoading" class="pi pi-spinner pi-spin text-soft-green-500"></i>
          </div>

          <div class="min-h-[320px] max-h-[52vh] overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <button
              v-for="item in results"
              :key="item.id"
              type="button"
              @click="chooseItem(item)"
              class="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 flex items-center gap-3 hover:bg-white dark:hover:bg-slate-900 transition-colors"
              :class="selectedItem?.id === item.id ? 'bg-soft-green-50 dark:bg-soft-green-900/20 ring-1 ring-inset ring-soft-green-300 dark:ring-soft-green-800' : ''"
            >
              <img v-if="item.icon" :src="item.icon" :alt="item.name" class="w-9 h-9 rounded-md object-cover shrink-0 shadow-sm" />
              <div v-else class="pi pi-box w-9 h-9 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0"></div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
                  <span>ID {{ item.id }}</span>
                  <span v-if="item.ilvl !== undefined"> · {{ t('newNote.filter.ilvlShort') }} {{ item.ilvl }}</span>
                  <span v-if="item.equipLevel !== undefined"> · {{ t('newNote.filter.equipLevelShort') }} {{ item.equipLevel }}</span>
                  <span> · {{ getCategoryLabel(item) }}</span>
                </div>
              </div>
              <i v-if="selectedItem?.id === item.id" class="pi pi-check text-soft-green-600 dark:text-soft-green-400"></i>
            </button>

            <div v-if="!isFiltering && results.length === 0" class="min-h-[360px] flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">
              <i class="pi pi-search text-3xl text-slate-300 dark:text-slate-700 mb-3"></i>
              <p class="font-bold">{{ t('newNote.filter.emptyTitle') }}</p>
              <p class="text-sm mt-1">{{ t('newNote.filter.emptyDescription') }}</p>
            </div>
          </div>
        </section>
      </div>

      <div class="px-4 sm:px-5 md:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button @click="emit('close')" class="w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {{ t('newNote.filter.cancel') }}
        </button>
        <button
          @click="confirmSelection"
          :disabled="!selectedItem"
          class="w-full sm:w-auto px-6 py-2 rounded-lg font-bold bg-soft-green-500 dark:bg-soft-green-600 text-white hover:bg-soft-green-600 dark:hover:bg-soft-green-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {{ t('newNote.filter.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 0.5rem;
  border: 1px solid rgb(187 247 208);
  background: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(15 23 42);
  outline: none;
}

.filter-input:focus {
  border-color: rgb(34 197 94);
}

:global(html.dark .filter-input) {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
  color: rgb(241 245 249);
  color-scheme: dark;
}

:global(html.dark .filter-input::placeholder) {
  color: rgb(100 116 139);
}

:global(html.dark .filter-input option) {
  background: rgb(15 23 42);
  color: rgb(241 245 249);
}
</style>
