<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { GLEANER_URL, MAX_BACKUP_BYTES, MigrationError, parseBackup, prepareImport, commitImport, type BackupData, type ConflictPolicy } from '../../services/migration'

const { t } = useI18n()
const data = ref<BackupData | null>(null)
const policy = ref<ConflictPolicy>('keep')
const plan = ref<ReturnType<typeof prepareImport> | null>(null)
const error = ref('')
const detail = ref('')
const busy = ref(false)
const emit = defineEmits<{ imported: [] }>()
const message = computed(() => error.value ? t(`migration.errors.${error.value}`, { detail: detail.value }) : '')
function report(cause: unknown) {
  error.value = cause instanceof MigrationError ? cause.code : 'storage'
  detail.value = cause instanceof MigrationError ? cause.detail : ''
}
function preview() {
  plan.value = null
  error.value = ''
  try { if (data.value) plan.value = prepareImport(data.value, window.localStorage, policy.value) }
  catch (cause) { report(cause) }
}
async function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  busy.value = true
  data.value = null
  plan.value = null
  error.value = ''
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new MigrationError('tooLarge')
    data.value = parseBackup(await file.text())
    preview()
  } catch (cause) { report(cause) }
  finally { busy.value = false }
}
function restore() {
  if (!plan.value || busy.value) return
  try {
    commitImport(plan.value, window.localStorage)
    emit('imported')
    window.location.reload()
  } catch (cause) { report(cause); plan.value = null }
}
</script>

<template>
  <div class="space-y-4 text-sm">
    <p class="leading-relaxed text-slate-600 dark:text-slate-300">{{ t('migration.instructions') }}</p>
    <a :href="GLEANER_URL" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 font-bold text-soft-green-700 underline dark:text-soft-green-300">
      {{ t('migration.link') }} <i class="pi pi-external-link text-xs" />
    </a>
    <label class="block space-y-3 rounded-xl border border-dashed border-soft-green-200 bg-soft-green-50/50 p-4 font-bold dark:border-slate-600 dark:bg-slate-800/40">
      <span>{{ t('migration.choose') }}</span>
      <input type="file" accept=".json,application/json" :disabled="busy" class="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-soft-green-100 file:px-3 file:py-2 file:text-soft-green-900 dark:file:bg-slate-700 dark:file:text-slate-100" @change="selectFile" @cancel="selectFile" />
    </label>
    <p v-if="message" role="alert" class="break-words text-red-700 dark:text-red-300">{{ message }}</p>
    <div v-if="plan" class="space-y-3 rounded-xl border border-soft-green-100 bg-soft-green-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <p role="status">{{ t('migration.summary', plan.counts) }}</p>
      <p v-if="plan.historyTrimmed" class="text-xs text-slate-600 dark:text-slate-300">{{ t('migration.historyLimit') }}</p>
      <label v-if="plan.counts.conflicts > 0" class="block space-y-2">
        <span>{{ t('migration.policy', plan.counts) }}</span>
        <select v-model="policy" class="block w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-900" @change="preview">
          <option value="keep">{{ t('migration.keep') }}</option>
          <option value="backup">{{ t('migration.backup') }}</option>
        </select>
      </label>
      <p class="text-xs leading-relaxed">{{ t('migration.reloadWarning') }}</p>
      <button type="button" class="w-full rounded-xl bg-soft-green-600 px-4 py-3 font-bold text-white hover:bg-soft-green-700" :disabled="busy" @click="restore">{{ t('migration.import') }}</button>
    </div>
  </div>
</template>
