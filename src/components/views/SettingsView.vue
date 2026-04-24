<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import { useSettings } from '../../composables/useSettings'
import { dataCenters, ensureDataCentersLoaded, setSelectedDC } from '../../services/universalis'

const { t } = useI18n()
const { language, debugMode, marketRegion, marketDC, marketCostStrategy, isDarkMode } = useSettings()

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

const strategyOptions = computed(() => [
  { label: t('settings.marketStrategyAggressive'), value: 'aggressive' },
  { label: t('settings.marketStrategyBalanced'), value: 'balanced' },
  { label: t('settings.marketStrategyConservative'), value: 'conservative' }
])

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
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 dark:text-soft-green-400 mb-2">{{ t('settings.title') }}</h2>
      <p class="text-slate-500 dark:text-slate-400 text-sm">{{ t('settings.description') }}</p>
    </header>

    <div class="flex flex-col gap-6">
      <!-- Appearance Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-palette text-xl"></i>
                <label class="font-bold text-lg">{{ t('settings.appearanceTitle') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ t('settings.appearanceDesc') }}</p>

              <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div class="flex flex-col">
                      <span class="font-bold text-slate-700 dark:text-slate-200">{{ t('settings.darkMode') }}</span>
                      <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('settings.darkModeDesc') }}</span>
                  </div>
                  <button 
                    @click="isDarkMode = !isDarkMode" 
                    class="w-14 h-8 rounded-full transition-all duration-300 relative"
                    :class="isDarkMode ? 'bg-soft-green-500' : 'bg-slate-300 dark:bg-slate-700'"
                  >
                    <div 
                        class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center overflow-hidden"
                        :class="isDarkMode ? 'left-7' : 'left-1'"
                    >
                        <i :class="isDarkMode ? 'pi pi-moon text-soft-green-600' : 'pi pi-sun text-amber-500'" class="text-[10px]"></i>
                    </div>
                  </button>
              </div>
          </div>
      </div>

      <!-- Language Settings -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                <i class="pi pi-language text-xl"></i>
                <label class="font-bold text-lg">{{ t('settings.language') }}</label>
              </div>

              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ t('settings.languageDesc') }}</p>

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
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
          <div class="flex flex-col gap-8">
              <!-- Sub-section 1: Market Data Source -->
              <div class="flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400">
                      <i class="pi pi-database text-xl"></i>
                      <label class="font-bold text-lg">{{ t('settings.marketTitle') }}</label>
                    </div>
                    <div v-if="dcLoading" class="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs">
                      <i class="pi pi-spinner pi-spin"></i>
                      <span>Syncing...</span>
                    </div>
                  </div>

                  <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ t('settings.marketDesc') }}</p>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Region Selector -->
                    <div class="flex flex-col gap-2">
                      <Dropdown 
                        v-model="marketRegion" 
                        :options="regionOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        :loading="dcLoading"
                        :disabled="dcLoading"
                        class="w-full !border-emerald-100 dark:!border-slate-800 !rounded-xl"
                        :pt="{
                          root: { class: 'dark:bg-slate-950 dark:border-slate-800' },
                          input: { class: 'dark:text-slate-300' },
                          trigger: { class: 'dark:text-slate-500' },
                          panel: { class: 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300' },
                          item: { class: 'dark:text-slate-300 dark:hover:bg-slate-800' }
                        }"
                      />
                    </div>

                    <!-- DC Selector -->
                    <div class="flex flex-col gap-2">
                      <Dropdown 
                        v-model="marketDC" 
                        :options="filteredDCs" 
                        optionLabel="label" 
                        optionValue="value"
                        :loading="dcLoading"
                        :disabled="dcLoading"
                        class="w-full !border-emerald-100 dark:!border-slate-800 !rounded-xl"
                        :pt="{
                          root: { class: 'dark:bg-slate-950 dark:border-slate-800' },
                          input: { class: 'dark:text-slate-300' },
                          trigger: { class: 'dark:text-slate-500' },
                          panel: { class: 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300' },
                          item: { class: 'dark:text-slate-300 dark:hover:bg-slate-800' }
                        }"
                      />
                    </div>
                  </div>
              </div>

              <!-- Separator -->
              <div class="border-t border-slate-100 dark:border-slate-800 -mx-5 md:-mx-8"></div>

              <!-- Sub-section 2: Market Strategy Selection -->
              <div class="flex flex-col gap-4">
                  <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400">
                    <i class="pi pi-chart-line text-xl"></i>
                    <label class="font-bold text-lg">{{ t('settings.marketStrategyTitle') }}</label>
                  </div>
                  
                  <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ t('settings.marketStrategyDesc') }}</p>
                  
                  <div class="overflow-x-auto no-scrollbar -mx-1 px-1">
                    <SelectButton 
                      v-model="marketCostStrategy" 
                      :options="strategyOptions" 
                      optionLabel="label" 
                      optionValue="value" 
                      class="settings-lang-toggle whitespace-nowrap min-w-max"
                    />
                  </div>
              </div>
          </div>
      </div>

      <!-- Debug Mode Settings (Temporarily Hidden) -->
        <div v-if="false" class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-8 hover:shadow-md transition-shadow">
          <!-- ... existing debug toggle ... -->
        </div>

        <!-- About & Credits Section -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
            <div class="flex flex-col gap-6">
                <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400">
                  <i class="pi pi-info-circle text-xl"></i>
                  <label class="font-bold text-lg">{{ t('settings.about.title') }}</label>
                </div>
                
                <p class="text-slate-500 dark:text-slate-400 text-sm -mt-3 leading-relaxed">{{ t('settings.about.description') }}</p>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-2">
                  <a href="https://universalis.app" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50 hover:border-soft-green-200 dark:hover:border-soft-green-900 hover:shadow-sm transition-all group">
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight group-hover:text-soft-green-700 dark:group-hover:text-soft-green-400 truncate">Universalis</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{{ t('settings.about.universalis') }}</span>
                    </div>
                    <i class="pi pi-external-link text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-soft-green-500 shrink-0"></i>
                  </a>

                  <a href="https://ffxivteamcraft.com" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50 hover:border-soft-green-200 dark:hover:border-soft-green-900 hover:shadow-sm transition-all group">
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight group-hover:text-soft-green-700 dark:group-hover:text-soft-green-400 truncate">Teamcraft</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{{ t('settings.about.teamcraft') }}</span>
                    </div>
                    <i class="pi pi-external-link text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-soft-green-500 shrink-0"></i>
                  </a>

                  <a href="https://xivapi.com" target="_blank" class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800/50 hover:border-soft-green-200 dark:hover:border-soft-green-900 hover:shadow-sm transition-all group">
                    <div class="flex flex-col gap-0.5 min-w-0">
                      <span class="font-black text-slate-700 dark:text-slate-200 text-sm tracking-tight group-hover:text-soft-green-700 dark:group-hover:text-soft-green-400 truncate">XIVAPI</span>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{{ t('settings.about.xivapi') }}</span>
                    </div>
                    <i class="pi pi-external-link text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-soft-green-500 shrink-0"></i>
                  </a>
                </div>
            </div>
        </div>

        <!-- Version & Updates Section -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
                  <i class="pi pi-history text-xl"></i>
                  <label class="font-bold text-lg">{{ t('settings.changelogTitle') }}</label>
                </div>

                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">{{ t('settings.changelogDesc') }}</p>

                <div class="flex mt-2">
                  <a href="#changelog" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-soft-green-50 dark:bg-soft-green-900/30 text-soft-green-700 dark:text-soft-green-400 font-bold text-sm hover:bg-soft-green-100 dark:hover:bg-soft-green-900/50 hover:shadow-sm border border-soft-green-200 dark:border-soft-green-800 transition-all">
                    <i class="pi pi-external-link text-xs"></i>
                    {{ t('settings.changelogLink') }}
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
