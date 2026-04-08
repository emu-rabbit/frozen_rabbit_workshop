<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('nav.recommended') }}</h2>
      <p class="text-slate-500 text-sm">施工中：站長精選的實用製作清單</p>
    </header>
    <div class="bg-white rounded-2xl shadow-sm border border-soft-green-100 p-8 text-center text-slate-400 font-bold min-h-[300px] flex items-center justify-center">
        即將推出！
    </div>
  </div>
</template>
