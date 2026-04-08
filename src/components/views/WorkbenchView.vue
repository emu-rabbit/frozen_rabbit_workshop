<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('workbench.title') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('workbench.description') }}</p>
    </header>
    <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
        <i class="pi pi-cog pi-spin text-5xl text-soft-green-300 mb-4"></i>
        <p class="text-soft-green-700 font-bold text-lg mb-2">{{ t('workbench.wipTitle') }}</p>
        <p class="text-slate-500 text-sm max-w-md">{{ t('workbench.wipDescription') }}</p>
    </div>
  </div>
</template>
