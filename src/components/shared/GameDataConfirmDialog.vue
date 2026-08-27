<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'

const { t } = useI18n()
const headingId = useId()
const messageId = useId()
const visible = defineModel<boolean>('visible', { required: true })
defineProps<{ title: string; message: string; confirmLabel: string; busy: boolean }>()
defineEmits<{ confirm: [] }>()
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :aria-labelledby="headingId"
    :aria-describedby="messageId"
    :draggable="false"
    :closable="!busy"
    :close-on-escape="!busy"
    :dismissable-mask="!busy"
    :close-button-props="{ 'aria-label': t('gameData.cancel'), severity: 'secondary', text: true }"
    class="!w-[calc(100%-2rem)] !max-w-lg !rounded-2xl !border-soft-green-100 !bg-white dark:!border-slate-800 dark:!bg-slate-900 !shadow-2xl"
    :pt="{
      mask: { class: '!bg-slate-900/45 backdrop-blur-sm' },
      header: { class: '!p-5 sm:!px-6 !rounded-t-2xl bg-soft-green-50 dark:bg-slate-950 border-b border-soft-green-100 dark:border-slate-800 !gap-3' },
      pcCloseButton: { root: { class: '!shrink-0 !w-8 !h-8 !p-0 !bg-transparent !border-transparent !shadow-none !text-slate-400 hover:!bg-slate-100 hover:!text-slate-600 dark:!text-slate-500 dark:hover:!bg-slate-800 dark:hover:!text-slate-300' } },
      content: { class: '!px-5 sm:!px-6 !pt-5 !pb-6' },
      footer: { class: '!px-5 sm:!px-6 !pb-5 !flex-col-reverse sm:!flex-row !items-stretch sm:!items-center !gap-2' }
    }"
  >
    <template #header>
      <h3 :id="headingId" class="flex items-center gap-3 font-bold text-lg text-soft-green-800 dark:text-soft-green-400 min-w-0">
        <span>{{ title }}</span>
      </h3>
    </template>
    <p :id="messageId" class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{{ message }}</p>
    <template #footer>
      <button type="button" autofocus :disabled="busy" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-50 focus-visible:outline-soft-green-400/60 focus-visible:outline-offset-2" @click="visible = false">
        {{ t('gameData.cancel') }}
      </button>
      <button type="button" :disabled="busy" class="inline-flex items-center justify-center gap-2 rounded-xl bg-soft-green-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-soft-green-600 dark:bg-soft-green-600 dark:hover:bg-soft-green-700 disabled:opacity-50 disabled:cursor-not-allowed" @click="$emit('confirm')">
        <i v-if="busy" class="pi pi-spinner pi-spin text-xs" aria-hidden="true"></i>
        {{ confirmLabel }}
      </button>
    </template>
  </Dialog>
</template>
