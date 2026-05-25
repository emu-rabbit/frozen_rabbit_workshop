<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'open-settings': []
}>()

const close = () => {
  emit('update:visible', false)
}

const openSettings = () => {
  emit('open-settings')
}
</script>

<template>
  <Transition name="market-reminder">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" @click="close"></div>

      <section class="relative w-full max-w-md overflow-hidden rounded-2xl border border-soft-green-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div class="mb-5 flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soft-green-50 text-soft-green-600 dark:bg-soft-green-950/40 dark:text-soft-green-300">
            <i class="pi pi-database text-xl"></i>
          </div>

          <div class="min-w-0">
            <h2 class="text-lg font-black text-slate-800 dark:text-slate-100">
              {{ t('marketSetupReminder.title') }}
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ t('marketSetupReminder.description') }}
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          {{ t('marketSetupReminder.note') }}
        </div>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            @click="close"
          >
            {{ t('marketSetupReminder.later') }}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-soft-green-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-soft-green-200/50 transition-all hover:bg-soft-green-600 active:scale-[0.98] dark:bg-soft-green-600 dark:shadow-none dark:hover:bg-soft-green-700"
            @click="openSettings"
          >
            <i class="pi pi-arrow-right text-xs"></i>
            {{ t('marketSetupReminder.openSettings') }}
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
