<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { t } = useI18n();

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [val: boolean];
  'export': [includeMarket: boolean];
}>();

const includeMarket = ref(false);

const close = () => {
    emit('update:visible', false);
};

const handleExport = () => {
    emit('export', includeMarket.value);
    close();
};
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity cursor-pointer"
        @click="close"
      ></div>

      <!-- Modal Container -->
      <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden transform transition-all border border-soft-green-100 dark:border-slate-800 flex flex-col md:flex-row">
        
        <!-- Decoration / Brand Side -->
        <div class="md:w-5/12 bg-soft-green-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-soft-green-100 dark:border-slate-800 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-32 h-32 bg-lime-green-100 dark:bg-lime-green-900/20 rounded-full -translate-x-12 -translate-y-12 opacity-50 blur-2xl"></div>
          <div class="absolute bottom-0 right-0 w-32 h-32 bg-soft-green-200 dark:bg-soft-green-900/20 rounded-full translate-x-12 translate-y-12 opacity-50 blur-2xl"></div>
          
          <div class="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 shadow-lg mb-8 relative z-10 flex items-center justify-center text-soft-green-500 border border-soft-green-100 dark:border-slate-700 transform hover:scale-105 transition-transform duration-500">
             <i class="pi pi-download text-5xl"></i>
          </div>
          
          <h2 class="text-2xl font-black text-soft-green-900 dark:text-soft-green-400 mb-2 relative z-10 leading-tight">
            {{ t('exportModal.title') }}
          </h2>
        </div>

        <!-- Selection Side -->
        <div class="md:w-7/12 p-8 flex flex-col">
          <!-- Close Button -->
          <button @click="close" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
              <i class="pi pi-times"></i>
          </button>
            
          <p class="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium">
            {{ t('exportModal.description') }}
          </p>

          <div class="grid grid-cols-1 gap-3 mb-10">
            <label class="group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer"
              :class="includeMarket 
                ? 'border-soft-green-400 dark:border-soft-green-600 bg-soft-green-50 dark:bg-soft-green-900/20 ring-4 ring-soft-green-400/10' 
                : 'border-slate-100 dark:border-slate-800 hover:border-soft-green-200 dark:hover:border-soft-green-700 hover:bg-slate-50 dark:hover:bg-slate-800'"
            >
              <input type="checkbox" v-model="includeMarket" class="hidden">
              <div class="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shrink-0"
                   :class="includeMarket ? 'border-soft-green-500 bg-soft-green-500 dark:bg-soft-green-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-transparent'">
                <i class="pi pi-check text-xs"></i>
              </div>
              <div class="text-left">
                <div class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-0.5" :class="includeMarket ? 'text-soft-green-900 dark:text-soft-green-300' : ''">
                  {{ t('exportModal.includeMarket') }}
                </div>
                <div class="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {{ t('exportModal.includeMarketDesc') }}
                </div>
              </div>
            </label>
          </div>

          <div class="mt-auto pt-4">
              <button 
                @click="handleExport"
                class="w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-soft-green-200/50 dark:shadow-none transition-all duration-300 transform active:scale-[0.98] bg-soft-green-500 dark:bg-soft-green-600 text-white hover:bg-soft-green-600 dark:hover:bg-soft-green-700 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <i class="pi pi-file-export"></i>
                {{ t('exportModal.confirm') }}
              </button>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.95) translateY(20px);
}
</style>
