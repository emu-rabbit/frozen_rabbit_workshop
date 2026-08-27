<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameDataConfirmDialog from './GameDataConfirmDialog.vue'
import { currentDataManifest, pendingDataManifest, dataCacheAvailable, updateDismissed, repairDataCache } from '../../services/gameData'
const { t } = useI18n()
const busy = ref(false)
const showRepair = ref(false)
async function repair() {
  if (busy.value) return
  busy.value = true
  try { await repairDataCache() }
  finally { busy.value = false; showRepair.value = false }
}
</script>
<template>
  <section aria-labelledby="game-data-heading" class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-soft-green-100 dark:border-slate-800 p-5 md:p-8 hover:shadow-md transition-shadow">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3 text-soft-green-900 dark:text-soft-green-400 mb-1">
        <i class="pi pi-box text-xl" aria-hidden="true"></i>
        <h3 id="game-data-heading" class="font-bold text-lg">{{ t('gameData.title') }}</h3>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed -mt-3 px-1">
        {{ t('gameData.cacheDescription') }}
        <span class="inline-block">{{ t('gameData.version') }}：<code class="break-all" :title="currentDataManifest?.version">{{ currentDataManifest?.version.slice(0, 12) || '—' }}</code></span>
      </p>
      <p v-if="!dataCacheAvailable" class="text-sm leading-relaxed text-amber-700 dark:text-amber-300">{{ t('gameData.cacheUnavailable') }}</p>
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 mt-2">
        <button v-if="pendingDataManifest" type="button" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-soft-green-50 dark:bg-soft-green-900/30 text-soft-green-700 dark:text-soft-green-400 font-bold text-sm hover:bg-soft-green-100 dark:hover:bg-soft-green-900/50 hover:shadow-sm border border-soft-green-200 dark:border-soft-green-800 transition-all" @click="updateDismissed = false">
          <i class="pi pi-download text-xs shrink-0" aria-hidden="true"></i>
          {{ t('gameData.updateReady') }}
        </button>
        <button type="button" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-soft-green-50 dark:bg-soft-green-900/30 text-soft-green-700 dark:text-soft-green-400 font-bold text-sm hover:bg-soft-green-100 dark:hover:bg-soft-green-900/50 hover:shadow-sm border border-soft-green-200 dark:border-soft-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed" :disabled="busy" @click="showRepair = true">
          <i class="pi pi-refresh text-xs shrink-0" aria-hidden="true"></i>
          {{ t('gameData.repair') }}
        </button>
      </div>
    </div>
  </section>
  <GameDataConfirmDialog v-model:visible="showRepair" :title="t('gameData.repair')" :message="t('gameData.repairWarning')" :confirm-label="t('gameData.repairConfirm')" :busy="busy" @confirm="repair" />
</template>
