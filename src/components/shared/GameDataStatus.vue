<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import GameDataConfirmDialog from './GameDataConfirmDialog.vue'
import { dataError, pendingDataManifest, updateDismissed, loadCoreData, checkForDataUpdate, activateDataUpdate } from '../../services/gameData'
const { t } = useI18n()
const busy = ref(false)
const headingId = useId()
const showActivate = computed({
  get: () => !!pendingDataManifest.value && !updateDismissed.value,
  set: visible => { if (!visible) updateDismissed.value = true }
})
async function retry() {
  if (busy.value) return
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
  <section v-if="dataError" class="mx-auto w-full max-w-4xl shrink-0 px-4 pt-6 md:px-8 md:pt-8" data-testid="game-data-status">
    <div role="alert" :aria-labelledby="headingId" :aria-busy="busy" class="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-4 rounded-2xl border border-soft-green-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" aria-hidden="true">
        <i :class="dataError === 'update' ? 'pi pi-cloud' : 'pi pi-exclamation-triangle'" class="text-lg"></i>
      </span>
      <div class="min-w-0">
        <h2 :id="headingId" class="text-sm font-bold leading-6 text-slate-800 dark:text-slate-100">{{ t(`gameData.errorTitle_${dataError}`) }}</h2>
        <p class="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{{ t(`gameData.error_${dataError}`) }}</p>
      </div>
      <button type="button" :disabled="busy" class="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-soft-green-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-soft-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soft-green-500 disabled:cursor-wait disabled:opacity-60 dark:bg-soft-green-600 dark:hover:bg-soft-green-700 sm:col-span-1" @click="retry">
        <i :class="busy ? 'pi pi-spinner pi-spin' : 'pi pi-refresh'" class="text-xs" aria-hidden="true"></i>
        {{ t(busy ? 'gameData.retrying' : 'gameData.retry') }}
      </button>
    </div>
  </section>
  <GameDataConfirmDialog v-model:visible="showActivate" :title="t('gameData.updateReady')" :message="t('gameData.reloadWarning')" :confirm-label="t('gameData.apply')" :cancel-label="t('gameData.later')" :busy="busy" @confirm="activate" />
</template>
