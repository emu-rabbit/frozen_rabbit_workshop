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
  <div class="px-4 py-8 md:p-8 max-w-4xl w-full mx-auto pb-24">
    <header class="mb-6 md:mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 mb-2">{{ t('settings.title') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('settings.description') }}</p>
    </header>

    <div class="flex flex-col gap-6">
      <!-- Language Settings -->
      <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 mb-1">
                <i class="pi pi-language text-xl"></i>
                <label class="font-bold text-lg">{{ t('settings.language') }}</label>
              </div>
              <div class="overflow-x-auto no-scrollbar -mx-1 px-1">
                  <SelectButton 
                    :modelValue="language" 
                    @update:modelValue="emit('update:language', $event)" 
                    :options="langOptions" 
                    optionLabel="label" 
                    optionValue="value" 
                    aria-labelledby="basic" 
                    class="settings-lang-toggle whitespace-nowrap min-w-max" 
                  />
              </div>
          </div>
      </div>

      <!-- Market Data Settings -->
      <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 text-soft-green-900">
                  <i class="pi pi-database text-xl"></i>
                  <label class="font-bold text-base md:text-lg">{{ t('settings.marketTitle') }}</label>
                </div>
                <div v-if="dcLoading" class="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs">
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
          <!-- ... existing debug toggle ... -->
        </div>

        <!-- About & Credits Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-5 md:p-8 hover:shadow-md transition-shadow">
            <div class="flex flex-col gap-6">
                <div class="flex items-center gap-3 text-soft-green-900">
                  <i class="pi pi-info-circle text-xl"></i>
                  <label class="font-bold text-lg">{{ t('settings.about.title') }}</label>
                </div>
                
                <p class="text-slate-500 text-sm -mt-3 leading-relaxed">{{ t('settings.about.description') }}</p>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-2">
                  <a href="https://universalis.app" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-soft-green-200 hover:shadow-sm transition-all group">
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-black text-slate-700 text-sm tracking-tight group-hover:text-soft-green-700 truncate">Universalis</span>
                      <span class="text-[10px] text-slate-400 font-medium truncate">{{ t('settings.about.universalis') }}</span>
                    </div>
                    <i class="pi pi-external-link text-[10px] text-slate-300 group-hover:text-soft-green-500 shrink-0"></i>
                  </a>

                  <a href="https://ffxivteamcraft.com" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-soft-green-200 hover:shadow-sm transition-all group">
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-black text-slate-700 text-sm tracking-tight group-hover:text-soft-green-700 truncate">Teamcraft</span>
                      <span class="text-[10px] text-slate-400 font-medium truncate">{{ t('settings.about.teamcraft') }}</span>
                    </div>
                    <i class="pi pi-external-link text-[10px] text-slate-300 group-hover:text-soft-green-500 shrink-0"></i>
                  </a>

                  <a href="https://xivapi.com" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-soft-green-200 hover:shadow-sm transition-all group">
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-black text-slate-700 text-sm tracking-tight group-hover:text-soft-green-700 truncate">XIVAPI</span>
                      <span class="text-[10px] text-slate-400 font-medium truncate">{{ t('settings.about.xivapi') }}</span>
                    </div>
                    <i class="pi pi-external-link text-[10px] text-slate-300 group-hover:text-soft-green-500 shrink-0"></i>
                  </a>
                </div>
            </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
