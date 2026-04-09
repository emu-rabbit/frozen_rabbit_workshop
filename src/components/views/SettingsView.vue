<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SelectButton from 'primevue/selectbutton'
import { useSettings } from '../../composables/useSettings'

const { t } = useI18n()
const { debugMode } = useSettings()

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
