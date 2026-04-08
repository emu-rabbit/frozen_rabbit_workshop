<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SelectButton from 'primevue/selectbutton'

const { t } = useI18n()

const props = defineProps<{
  language: string
}>()

const emit = defineEmits<{
  'update:language': [value: string]
}>()

const langOptions = [
  { label: '繁體中文', value: 'tw' },
  { label: '简体中文', value: 'zh' },
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

    <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8">
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
              <label class="font-bold text-soft-green-900 text-lg">{{ t('settings.language') }}</label>
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
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles moved to App.vue or kept here as plain CSS if needed, 
   but @apply in child components often triggers IDE warnings. 
   Moving back to App.vue for global consistency. */
</style>
