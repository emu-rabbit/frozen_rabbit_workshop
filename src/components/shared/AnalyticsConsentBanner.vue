<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getAnalyticsConsent,
  isAnalyticsAvailable,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from '../../services/analytics'

const props = defineProps<{
  paused: boolean
}>()

const { locale } = useI18n()
const consent = ref<AnalyticsConsent | null>(
  isAnalyticsAvailable() ? getAnalyticsConsent() : 'denied'
)

const copy = computed(() => {
  const lang = String(locale.value)

  if (lang === 'tw') {
    return {
      message: '本站使用 Google Analytics 了解使用情況並改善工具。',
      accept: '接受',
      reject: '拒絕',
    }
  }

  if (lang === 'cn') {
    return {
      message: '本站使用 Google Analytics 了解使用情况并改善工具。',
      accept: '接受',
      reject: '拒绝',
    }
  }

  if (lang === 'ja') {
    return {
      message: 'このサイトは改善のため Google Analytics を使用します。',
      accept: '許可',
      reject: '拒否',
    }
  }

  return {
    message: 'This site uses Google Analytics to improve the tool.',
    accept: 'Accept',
    reject: 'Reject',
  }
})

const isVisible = computed(() => isAnalyticsAvailable() && !props.paused && !consent.value)

const choose = (value: AnalyticsConsent) => {
  consent.value = value
  setAnalyticsConsent(value)
}
</script>

<template>
  <Transition name="analytics-consent">
    <div
      v-if="isVisible"
      class="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-xl items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
      role="dialog"
      aria-live="polite"
    >
      <p class="min-w-0 flex-1 leading-snug">
        {{ copy.message }}
      </p>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="rounded-md px-2 py-1 font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          @click="choose('denied')"
        >
          {{ copy.reject }}
        </button>
        <button
          type="button"
          class="rounded-md bg-soft-green-500 px-2.5 py-1 font-bold text-white transition-colors hover:bg-soft-green-600 dark:bg-soft-green-600 dark:hover:bg-soft-green-500"
          @click="choose('granted')"
        >
          {{ copy.accept }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.analytics-consent-enter-active,
.analytics-consent-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.analytics-consent-enter-from,
.analytics-consent-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
