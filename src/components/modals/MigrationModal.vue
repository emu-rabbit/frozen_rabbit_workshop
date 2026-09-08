<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import MigrationImport from '../shared/MigrationImport.vue'
import logo from '../../assets/logo.png'
import { MIGRATION_DISMISSED_KEY } from '../../services/migration'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; imported: [] }>()
const { t } = useI18n()
const dismissed = ref(false)
const storageError = ref(false)
function remember() {
  try {
    window.localStorage.setItem(MIGRATION_DISMISSED_KEY, String(dismissed.value))
    storageError.value = false
  } catch { storageError.value = true }
}
</script>

<template>
  <Dialog :visible="visible" modal :closable="false" :close-on-escape="false" :header="t('migration.title')" :style="{ width: '30rem', maxWidth: 'calc(100vw - 2rem)' }"
    :pt="{
      root: { class: '!rounded-3xl !border-soft-green-200 !bg-white !shadow-2xl dark:!border-slate-700 dark:!bg-slate-900 overflow-hidden' },
      header: { class: '!p-6 bg-gradient-to-br from-soft-green-100 via-soft-green-50 to-white dark:from-soft-green-900/40 dark:via-slate-900 dark:to-slate-900' },
      content: { class: '!px-6 !pb-6 !pt-2' },
      footer: { class: '!px-6 !py-4 border-t border-soft-green-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/40' },
      mask: { class: 'backdrop-blur-sm' }
    }">
    <template #header>
      <div class="flex items-start gap-4">
        <div class="relative shrink-0">
          <img :src="logo" alt="" class="h-14 w-14 rounded-2xl shadow-sm ring-4 ring-white/70 dark:ring-slate-800" />
          <span class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-soft-green-600 text-white ring-2 ring-white dark:ring-slate-900" aria-hidden="true"><i class="pi pi-home text-xs" /></span>
        </div>
        <div class="min-w-0">
          <h2 class="text-xl font-black leading-tight text-soft-green-900 dark:text-soft-green-300">{{ t('migration.title') }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{{ t('migration.description') }}</p>
        </div>
      </div>
    </template>
    <MigrationImport @imported="emit('imported')" />
    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <label class="flex cursor-pointer items-center gap-2 py-2 text-sm text-slate-500 dark:text-slate-400"><input v-model="dismissed" type="checkbox" class="h-4 w-4 accent-soft-green-600" @change="remember" />{{ t('migration.dismiss') }}</label>
        <button type="button" class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-soft-green-300 hover:text-soft-green-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-soft-green-600" @click="emit('update:visible', false)">{{ t('migration.later') }}</button>
        <p v-if="storageError" role="alert" class="w-full text-sm text-red-600 dark:text-red-300">{{ t('migration.errors.preference') }}</p>
      </div>
    </template>
  </Dialog>
</template>
