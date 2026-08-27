<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameDataConfirmDialog from './GameDataConfirmDialog.vue'
import { catalogData, coreDataReady, dataError, pendingDataManifest, updateDismissed, loadCoreData, checkForDataUpdate, activateDataUpdate } from '../../services/gameData'
const { t } = useI18n()
const busy = ref(false)
const showActivate = ref(false)
async function retry() {
  busy.value = true
  try { if (dataError.value === 'update') await checkForDataUpdate(); else await loadCoreData() }
  catch { /* The shared error state keeps the retry visible. */ }
  finally { busy.value = false }
}
async function activate() {
  if (busy.value) return
  busy.value = true
  try { await activateDataUpdate() }
  finally { busy.value = false; showActivate.value = false }
}
</script>

<template>
  <section aria-live="polite" class="mx-4 mt-4 space-y-2 text-sm" data-testid="game-data-status">
    <div v-if="dataError" role="alert" class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 flex flex-wrap items-center gap-3">
      <span class="flex-1">{{ t(`gameData.error_${dataError}`) }}</span>
      <button class="font-bold underline disabled:opacity-50" :disabled="busy" @click="retry">{{ t('gameData.retry') }}</button>
    </div>
    <p v-else-if="!catalogData" class="text-slate-500 dark:text-slate-400">{{ t('gameData.loadingCatalog') }}</p>
    <p v-else-if="!coreDataReady" class="text-slate-500 dark:text-slate-400">{{ t('gameData.loadingCore') }}</p>
    <div v-if="pendingDataManifest && !updateDismissed" class="rounded-xl border border-soft-green-200 bg-soft-green-50 p-3 dark:border-soft-green-800 dark:bg-slate-900 flex flex-wrap items-center gap-3">
      <span class="flex-1 min-w-48">{{ t('gameData.updateReady') }}</span>
      <button class="font-bold underline" @click="showActivate = true">{{ t('gameData.apply') }}</button>
      <button class="text-slate-600 dark:text-slate-300 underline" @click="updateDismissed = true">{{ t('gameData.later') }}</button>
    </div>
  </section>
  <GameDataConfirmDialog v-model:visible="showActivate" :title="t('gameData.apply')" :message="t('gameData.reloadWarning')" :confirm-label="t('gameData.apply')" :busy="busy" @confirm="activate" />
</template>
