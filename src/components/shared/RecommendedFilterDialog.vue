<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import { craftingJobs, gatheringJobs, combatJobs, levelBands, emptyRecommendedFilters, type RecommendedFilters, type RecommendedNoteType } from '../../data/recommended/filters'

const props = defineProps<{ filters: RecommendedFilters }>()
const emit = defineEmits<{ close: []; apply: [filters: RecommendedFilters] }>()
const { t } = useI18n()
const draft = ref<RecommendedFilters>({ jobs: [...props.filters.jobs], levels: [...props.filters.levels], types: [...props.filters.types] })
const jobGroups = [
  { key: 'craftingGathering', jobs: [...craftingJobs, ...gatheringJobs] },
  { key: 'combat', jobs: combatJobs },
]
const jobsExpanded = ref(false)
const jobOptionsId = useId()
const visibleJobGroups = computed(() => jobsExpanded.value
  ? jobGroups
  : [{ key: 'craftingGathering', jobs: [...craftingJobs, ...gatheringJobs].slice(0, 6) }])
const noteTypes: RecommendedNoteType[] = ['combatEquipment', 'professionEquipment', 'quest', 'glamour', 'submarine', 'relicTools']
const choiceClass = 'flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-sm cursor-pointer has-[:checked]:border-soft-green-500 has-[:checked]:bg-soft-green-50 dark:has-[:checked]:bg-soft-green-900/30'
</script>

<template>
  <Dialog :visible="true" modal dismissableMask :header="t('recommended.filter.title')" :style="{ width: '40rem', maxWidth: 'calc(100vw - 1.5rem)' }" :draggable="false" @update:visible="emit('close')">
    <div class="flex flex-col gap-5 text-slate-700 dark:text-slate-200">
      <fieldset class="min-w-0">
        <legend class="font-bold mb-2">{{ t('recommended.filter.jobs') }}</legend>
        <div :id="jobOptionsId">
          <div v-for="group in visibleJobGroups" :key="group.key" class="mb-3 last:mb-0">
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">{{ t(`recommended.filter.${group.key}`) }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label v-for="job in group.jobs" :key="job" :class="choiceClass">
                <input v-model="draft.jobs" type="checkbox" :value="job" class="accent-soft-green-600 shrink-0" />
                <span>{{ t(`newNote.filter.jobs.${job}`) }}</span>
              </label>
            </div>
          </div>
        </div>
        <button type="button" :aria-expanded="jobsExpanded" :aria-controls="jobOptionsId" class="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-soft-green-700 dark:text-soft-green-400 hover:bg-soft-green-50 dark:hover:bg-soft-green-900/30" @click="jobsExpanded = !jobsExpanded">
          <span>{{ t(jobsExpanded ? 'recommended.filter.collapseJobs' : 'recommended.filter.expandJobs') }}</span>
          <i :class="jobsExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-xs" aria-hidden="true"></i>
        </button>
      </fieldset>
      <fieldset class="min-w-0">
        <legend class="font-bold mb-2">{{ t('recommended.filter.levels') }}</legend>
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <label v-for="min in levelBands" :key="min" :class="choiceClass">
            <input v-model="draft.levels" type="checkbox" :value="min" class="accent-soft-green-600" />
            <span>{{ min === 100 ? '100' : `${min}–${min + 9}` }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset class="min-w-0">
        <legend class="font-bold mb-2">{{ t('recommended.filter.types') }}</legend>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label v-for="type in noteTypes" :key="type" :class="choiceClass">
            <input v-model="draft.types" type="checkbox" :value="type" class="accent-soft-green-600" />
            <span>{{ t(`recommended.filter.${type}`) }}</span>
          </label>
        </div>
      </fieldset>
    </div>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2 w-full">
        <button type="button" class="mr-auto px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-soft-green-600" @click="draft = emptyRecommendedFilters()">{{ t('newNote.filter.clear') }}</button>
        <button type="button" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300" @click="emit('close')">{{ t('newNote.filter.cancel') }}</button>
        <button type="button" class="px-4 py-2 rounded-lg bg-soft-green-600 hover:bg-soft-green-700 text-white" @click="emit('apply', draft)">{{ t('recommended.filter.apply') }}</button>
      </div>
    </template>
  </Dialog>
</template>
