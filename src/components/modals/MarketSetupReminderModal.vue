<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropdown from 'primevue/dropdown'
import { useSettings } from '../../composables/useSettings'
import { dataCenters, setSelectedDC } from '../../services/universalis'

const { t } = useI18n()
const { marketRegion, marketDC } = useSettings()

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const regionOptions = computed(() => {
  const regions = [...new Set(dataCenters.value.map(dc => dc.region))]
  return regions.map(region => ({
    label: t(`settings.regions.${region}`) || region,
    value: region
  }))
})

const filteredDCs = computed(() => {
  return dataCenters.value
    .filter(dc => dc.region === marketRegion.value)
    .map(dc => ({ label: dc.name, value: dc.name }))
})

const close = () => {
  emit('update:visible', false)
}

watch(marketRegion, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    const firstDC = filteredDCs.value[0]?.value
    if (firstDC) {
      marketDC.value = firstDC
    }
  }
})

watch(marketDC, (newVal) => {
  if (newVal) {
    setSelectedDC(newVal)
  }
}, { immediate: true })
</script>

<template>
  <Transition name="market-reminder">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" @click="close"></div>

      <section class="relative w-full max-w-md overflow-hidden rounded-2xl border border-soft-green-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div class="mb-4 min-w-0">
          <h2 class="flex min-w-0 items-center gap-2 text-lg font-black text-slate-800 dark:text-slate-100">
            <i class="pi pi-database text-sm text-soft-green-600 dark:text-soft-green-300"></i>
            <span class="min-w-0 truncate">{{ t('marketSetupReminder.title') }}</span>
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ t('marketSetupReminder.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dropdown
            v-model="marketRegion"
            :options="regionOptions"
            optionLabel="label"
            optionValue="value"
            :aria-label="t('settings.marketRegion')"
            class="w-full !rounded-xl !border-emerald-100 dark:!border-slate-800"
            :pt="{
              root: { class: 'dark:bg-slate-950 dark:border-slate-800' },
              input: { class: 'dark:text-slate-300' },
              trigger: { class: 'dark:text-slate-500' },
              panel: { class: 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300' },
              item: { class: 'dark:text-slate-300 dark:hover:bg-slate-800' }
            }"
          />

          <Dropdown
            v-model="marketDC"
            :options="filteredDCs"
            optionLabel="label"
            optionValue="value"
            :aria-label="t('settings.marketDC')"
            class="w-full !rounded-xl !border-emerald-100 dark:!border-slate-800"
            :pt="{
              root: { class: 'dark:bg-slate-950 dark:border-slate-800' },
              input: { class: 'dark:text-slate-300' },
              trigger: { class: 'dark:text-slate-500' },
              panel: { class: 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300' },
              item: { class: 'dark:text-slate-300 dark:hover:bg-slate-800' }
            }"
          />
        </div>

        <div class="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            @click="close"
          >
            {{ t('marketSetupReminder.later') }}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-soft-green-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-soft-green-200/40 transition-all hover:bg-soft-green-600 active:scale-[0.98] dark:bg-soft-green-600 dark:shadow-none dark:hover:bg-soft-green-700"
            @click="close"
          >
            <i class="pi pi-check text-xs"></i>
            {{ t('marketSetupReminder.confirm') }}
          </button>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.market-reminder-enter-active,
.market-reminder-leave-active {
  transition: opacity 0.2s ease;
}

.market-reminder-enter-active section,
.market-reminder-leave-active section {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.market-reminder-enter-from,
.market-reminder-leave-to,
.market-reminder-enter-from section,
.market-reminder-leave-to section {
  opacity: 0;
}

.market-reminder-enter-from section,
.market-reminder-leave-to section {
  transform: translateY(12px) scale(0.98);
}
</style>
