<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const close = () => {
  emit('update:visible', false)
}

const handleSponsor = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
  close()
}

const koFiUrl = 'https://ko-fi.com/emu_rabbit2526'
// ECPay URL will be provided by user later, placeholder for now
const ecPayUrl = 'https://p.ecpay.com.tw/683FE99'
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        @click="close"
      ></div>

      <!-- Modal Container -->
      <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden transform transition-all border border-soft-green-100 dark:border-slate-800">
        <!-- Close Button (Mobile) -->
        <button 
          @click="close"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 lg:hidden"
        >
          <i class="pi pi-times"></i>
        </button>

        <div class="flex flex-col md:flex-row">
          <!-- Left Content (Visual/Intro) -->
          <div class="md:w-5/12 bg-soft-green-50 dark:bg-slate-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-soft-green-100 dark:border-slate-800">
            <div>
              <div class="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-soft-green-100 dark:border-slate-700">
                <i class="pi pi-heart-fill text-3xl text-rose-500"></i>
              </div>
              <h2 class="text-2xl font-black text-soft-green-900 dark:text-soft-green-400 leading-tight mb-4">
                {{ t('sponsorModal.title') }}
              </h2>
              <p class="text-sm text-soft-green-700 dark:text-slate-400 leading-relaxed opacity-80">
                {{ t('sponsorModal.description', { email: 'mausu2526@gmail.com' }) }}
              </p>
            </div>
            
            <div class="hidden md:block mt-8">
              <div class="flex items-center gap-2 text-soft-green-600 dark:text-soft-green-500 text-[10px] font-bold tracking-widest uppercase">
                <i class="pi pi-lock text-[8px]"></i>
                Secure Donation
              </div>
            </div>
          </div>

          <!-- Right Content (Selection) -->
          <div class="md:w-7/12 p-8">
            <div class="hidden md:flex justify-end mb-4">
              <button @click="close" class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <i class="pi pi-times text-xl"></i>
              </button>
            </div>

            <div class="space-y-4">
              <!-- TW (ECPay) -->
              <button 
                @click="handleSponsor(ecPayUrl)"
                class="w-full group text-left p-5 rounded-2xl border-2 border-soft-green-100 dark:border-slate-800 hover:border-soft-green-400 dark:hover:border-soft-green-600 hover:bg-soft-green-50 dark:hover:bg-soft-green-900/20 transition-all duration-300 relative overflow-hidden"
              >
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-lime-500 text-white flex items-center justify-center shrink-0 shadow-md transform group-hover:scale-110 transition-transform">
                    <i class="pi pi-credit-card text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-black text-soft-green-900 dark:text-soft-green-400 group-hover:text-soft-green-800 dark:group-hover:text-soft-green-300 transition-colors">
                      {{ t('sponsorModal.twProvider') }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      {{ t('sponsorModal.twDesc') }}
                    </p>
                  </div>
                  <div class="ml-auto self-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <i class="pi pi-chevron-right text-soft-green-500 dark:text-soft-green-400"></i>
                  </div>
                </div>
              </button>

              <!-- Global (Ko-fi) -->
              <button 
                @click="handleSponsor(koFiUrl)"
                class="w-full group text-left p-5 rounded-2xl border-2 border-rose-100 dark:border-rose-950/30 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-300 relative overflow-hidden"
              >
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md transform group-hover:scale-110 transition-transform">
                    <i class="pi pi-globe text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-black text-slate-900 dark:text-slate-100 group-hover:text-rose-900 dark:group-hover:text-rose-400 transition-colors">
                      {{ t('sponsorModal.globalProvider') }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      {{ t('sponsorModal.globalDesc') }}
                    </p>
                  </div>
                  <div class="ml-auto self-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <i class="pi pi-chevron-right text-rose-500 dark:text-rose-400"></i>
                  </div>
                </div>
              </button>
            </div>

            <p class="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-8 font-medium italic">
              * Every contribution helps keep the rabbit cold and the freezer running.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: translateY(20px);
}
</style>
