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
  'select': [lang: string]
}>()

const selectedLang = ref<string | null>(null)

const languages = [
  { code: 'tw', name: '繁體中文', label: 'Traditional Chinese', icon: '🇹🇼' },
  { code: 'cn', name: '简体中文', label: 'Simplified Chinese', icon: '🇨🇳' },
  { code: 'en', name: 'English', label: 'English', icon: '🇺🇸' },
  { code: 'ja', name: '日本語', label: 'Japanese', icon: '🇯🇵' }
]

const handleSelect = (code: string) => {
  selectedLang.value = code
}

const confirmSelection = () => {
  if (selectedLang.value) {
    emit('select', selectedLang.value)
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <!-- Backdrop (No close on click for forced initial setup) -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
      ></div>

      <!-- Modal Container -->
      <div class="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden transform transition-all border border-soft-green-100 flex flex-col md:flex-row">
        
        <!-- Decoration / Brand Side -->
        <div class="md:w-5/12 bg-soft-green-50 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-soft-green-100 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-32 h-32 bg-lime-green-100 rounded-full -translate-x-12 -translate-y-12 opacity-50 blur-2xl"></div>
          <div class="absolute bottom-0 right-0 w-32 h-32 bg-soft-green-200 rounded-full translate-x-12 translate-y-12 opacity-50 blur-2xl"></div>
          
          <img :src="logo" class="w-24 h-24 rounded-3xl shadow-lg mb-8 relative z-10 transform hover:rotate-6 transition-transform duration-500" alt="Logo" />
          
          <h2 class="text-3xl font-black text-soft-green-900 mb-2 relative z-10">
            {{ t('welcomeModal.title') }}
          </h2>
          <p class="text-soft-green-600 font-medium relative z-10 opacity-80">
            {{ t('welcomeModal.subtitle') }}
          </p>
          
          <div class="mt-12 hidden md:block">
             <div class="flex -space-x-2">
                <div v-for="l in languages" :key="l.code" class="w-10 h-10 rounded-full bg-white border-2 border-soft-green-100 flex items-center justify-center text-lg shadow-sm">
                  {{ l.icon }}
                </div>
             </div>
          </div>
        </div>

        <!-- Selection Side -->
        <div class="md:w-7/12 p-8 md:p-12 flex flex-col">
          <p class="text-slate-500 text-sm mb-8 leading-relaxed">
            {{ t('welcomeModal.description') }}
          </p>

          <div class="grid grid-cols-1 gap-3 mb-10">
            <button 
              v-for="lang in languages" 
              :key="lang.code"
              @click="handleSelect(lang.code)"
              class="group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300"
              :class="selectedLang === lang.code 
                ? 'border-soft-green-400 bg-soft-green-50 ring-4 ring-soft-green-400/10' 
                : 'border-slate-100 hover:border-soft-green-200 hover:bg-slate-50'"
            >
              <div class="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-2xl shadow-sm transform group-hover:scale-110 transition-transform">
                {{ lang.icon }}
              </div>
              <div class="text-left">
                <div class="font-bold text-slate-800" :class="selectedLang === lang.code ? 'text-soft-green-900' : ''">
                  {{ lang.name }}
                </div>
                <div class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {{ lang.label }}
                </div>
              </div>
              <div 
                v-if="selectedLang === lang.code"
                class="ml-auto w-6 h-6 rounded-full bg-soft-green-500 text-white flex items-center justify-center"
              >
                <i class="pi pi-check text-[10px]"></i>
              </div>
            </button>
          </div>

          <button 
            @click="confirmSelection"
            :disabled="!selectedLang"
            class="w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-soft-green-200/50 transition-all duration-300 transform active:scale-[0.98]"
            :class="selectedLang 
              ? 'bg-soft-green-500 text-white hover:bg-soft-green-600 hover:-translate-y-0.5' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
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
