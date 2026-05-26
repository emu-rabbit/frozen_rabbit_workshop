<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import logo from '../../assets/logo.png'

const { t } = useI18n()

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'preview-language': [lang: string]
  'select': [lang: string]
}>()

const selectedLang = ref<string | null>(null)

const languages = [
  { code: 'tw', name: '繁體中文', label: 'Traditional Chinese', badge: 'TW' },
  { code: 'cn', name: '简体中文', label: 'Simplified Chinese', badge: 'CN' },
  { code: 'en', name: 'English', label: 'English', badge: 'EN' },
  { code: 'ja', name: '日本語', label: 'Japanese', badge: 'JP' }
]

const handleSelect = (code: string) => {
  selectedLang.value = code
  emit('preview-language', code)
}

const confirmSelection = () => {
  if (selectedLang.value) {
    emit('select', selectedLang.value)
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-3 sm:p-6">
      <!-- Backdrop (No close on click for forced initial setup) -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
      ></div>

      <!-- Modal Container -->
      <div class="relative w-full min-w-0 max-w-md max-h-[calc(100dvh-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transform transition-all border border-soft-green-100 dark:border-slate-800">
        <div class="p-5 sm:p-6">
          <div class="flex min-w-0 items-center gap-4">
            <img :src="logo" class="h-12 w-12 shrink-0 rounded-2xl shadow-md" alt="Logo" />
            <div class="min-w-0">
              <h2 class="max-w-full text-[1.35rem] sm:text-2xl font-black text-soft-green-900 dark:text-soft-green-400 break-words leading-tight">
                {{ t('welcomeModal.title') }}
              </h2>
              <p class="mt-1 max-w-full text-sm text-soft-green-600 dark:text-soft-green-500 font-medium break-words leading-snug">
                {{ t('welcomeModal.subtitle') }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2.5 mt-4">
            <button
              v-for="lang in languages"
              :key="lang.code"
              @click="handleSelect(lang.code)"
              class="group relative flex min-w-0 items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all duration-200"
              :class="selectedLang === lang.code
                ? 'border-soft-green-400 dark:border-soft-green-600 bg-soft-green-50 dark:bg-soft-green-900/20'
                : 'border-slate-100 dark:border-slate-800 hover:border-soft-green-200 dark:hover:border-soft-green-700 hover:bg-slate-50 dark:hover:bg-slate-800'"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                {{ lang.badge }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate font-bold text-slate-800 dark:text-slate-200" :class="selectedLang === lang.code ? 'text-soft-green-900 dark:text-soft-green-300' : ''">
                  {{ lang.name }}
                </div>
                <div class="truncate text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                  {{ lang.label }}
                </div>
              </div>
              <div
                v-if="selectedLang === lang.code"
                class="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-soft-green-500 text-white"
              >
                <i class="pi pi-check text-[10px]"></i>
              </div>
            </button>
          </div>

          <button
            @click="confirmSelection"
            :disabled="!selectedLang"
            class="mt-4 w-full min-w-0 rounded-xl px-4 py-3 font-black text-base shadow-lg shadow-soft-green-200/40 transition-all duration-200 active:scale-[0.98] dark:shadow-none"
            :class="selectedLang
              ? 'bg-soft-green-500 dark:bg-soft-green-600 text-white hover:bg-soft-green-600 dark:hover:bg-soft-green-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'"
          >
            {{ t('welcomeModal.confirm') }}
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.9) translateY(30px);
}
</style>
