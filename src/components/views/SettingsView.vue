<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import { useSettings } from '../../composables/useSettings'
import { dataCenters, ensureDataCentersLoaded, setSelectedDC } from '../../services/universalis'

const { t } = useI18n()
const { language, debugMode, marketRegion, marketDC } = useSettings()

defineProps<{
  language: string
}>()

const emit = defineEmits<{
  'update:language': [value: string]
}>()

const langOptions = [
  { label: '繁體中文', value: 'tw' },
  { label: '简体中文', value: 'cn' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' }
]

// Market Settings Logic
const dcLoading = ref(false)

onMounted(async () => {
  dcLoading.value = true
  try {
    await ensureDataCentersLoaded()
    
    // Safety check: Ensure current selection matches available data
    const regionExists = regionOptions.value.some(r => r.value === marketRegion.value)
    if (!regionExists && regionOptions.value.length > 0) {
      marketRegion.value = regionOptions.value[0].value
    } else {
        // Even if region exists, check if DC exists in that region
        const dcExists = filteredDCs.value.some(dc => dc.value === marketDC.value)
        if (!dcExists && filteredDCs.value.length > 0) {
            marketDC.value = filteredDCs.value[0].value
        }
    }
  } finally {
    dcLoading.value = false
  }
})

const regionOptions = computed(() => {
  const regions = [...new Set(dataCenters.value.map(dc => dc.region))]
  return regions.map(r => ({ 
    label: t(`settings.regions.${r}`) || r, 
    value: r 
  }))
})

const filteredDCs = computed(() => {
  return dataCenters.value
    .filter(dc => dc.region === marketRegion.value)
    .map(dc => ({ label: dc.name, value: dc.name }))
})

// When switching region, reset DC to the first available in that region
watch(marketRegion, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    const firstDC = filteredDCs.value[0]?.value
    if (firstDC) {
      marketDC.value = firstDC
    }
  }
})

// Sync the Universalis service whenever DC changes
watch(marketDC, (newVal) => {
  if (newVal) {
    setSelectedDC(newVal)
  }
}, { immediate: true })
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('settings.title') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('settings.description') }}</p>
    </header>

    <div class="flex flex-col gap-6">
      <!-- Language Settings -->
      <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 mb-1">
                <i class="pi pi-language text-xl"></i>
                <label class="font-bold text-lg">{{ t('settings.language') }}</label>
              </div>
              <SelectButton 
                :modelValue="language" 
                @update:modelValue="emit('update:language', $event)" 
                :options="langOptions" 
                optionLabel="label" 
                optionValue="value" 
                aria-labelledby="basic" 
                class="settings-lang-toggle" 
              />
          </div>
      </div>

      <!-- Market Data Settings -->
      <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 text-soft-green-900">
                  <i class="pi pi-database text-xl"></i>
                  <label class="font-bold text-lg">{{ t('settings.marketTitle') }}</label>
                </div>
                <div v-if="dcLoading" class="flex items-center gap-2 text-slate-400 text-xs">
                  <i class="pi pi-spinner pi-spin"></i>
                  <span>Syncing...</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Region Selector -->
                <div class="flex flex-col gap-2">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{{ t('settings.marketRegion') }}</span>
                  <Dropdown 
                    v-model="marketRegion" 
                    :options="regionOptions" 
                    optionLabel="label" 
                    optionValue="value"
                    :loading="dcLoading"
                    :disabled="dcLoading"
                    class="w-full !border-soft-green-100 !rounded-xl"
                  />
                </div>

                <!-- DC Selector -->
                <div class="flex flex-col gap-2">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{{ t('settings.marketDC') }}</span>
                  <Dropdown 
                    v-model="marketDC" 
                    :options="filteredDCs" 
                    optionLabel="label" 
                    optionValue="value"
                    :loading="dcLoading"
                    :disabled="dcLoading"
                    class="w-full !border-soft-green-100 !rounded-xl"
                  />
                </div>
              </div>

              <div class="bg-soft-green-50 p-4 rounded-xl border border-soft-green-100 flex gap-3">
                <i class="pi pi-info-circle text-soft-green-600 mt-0.5"></i>
                <p class="text-sm text-soft-green-800 leading-relaxed">{{ t('settings.marketDesc') }}</p>
              </div>
          </div>
      </div>

      <!-- Debug Mode Settings (Temporarily Hidden) -->
      <div v-if="false" class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between gap-4">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-3 text-soft-green-900 mb-1">
                  <i class="pi pi-cog text-xl"></i>
                  <label class="font-bold text-lg cursor-pointer" for="debug-toggle">{{ t('settings.debugMode') }}</label>
                </div>
                <p class="text-slate-500 text-sm">{{ t('settings.debugModeDesc') }}</p>
              </div>
              
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="debug-toggle" v-model="debugMode" class="sr-only peer">
                <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-soft-green-500"></div>
              </label>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles moved to App.vue or kept here as plain CSS if needed, 
   but @apply in child components often triggers IDE warnings. 
   Moving back to App.vue for global consistency. */
</style>
