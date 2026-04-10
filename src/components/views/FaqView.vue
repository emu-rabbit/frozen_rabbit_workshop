<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()
</script>

<template>
  <div class="p-8 max-w-4xl w-full mx-auto">
    <header class="mb-10">
      <h2 class="text-3xl font-bold text-soft-green-800 mb-2">{{ t('faq.title') }}</h2>
      <p class="text-slate-500 text-sm leading-relaxed">{{ t('faq.description') }}</p>
    </header>

    <div class="flex flex-col gap-6">
      <div 
        v-for="(item, index) in tm('faq.items')" 
        :key="index"
        class="bg-white rounded-2xl shadow-sm border border-soft-green-100 overflow-hidden hover:shadow-md transition-all duration-300"
      >
        <div class="p-6">
          <div class="flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-soft-green-100 text-soft-green-600 flex items-center justify-center shrink-0 font-bold text-lg">
              Q
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-soft-green-900 leading-tight mb-4">
                {{ item.q }}
              </h3>
              
              <div class="flex gap-4 pt-4 border-t border-soft-green-50">
                <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 font-bold text-lg">
                  A
                </div>
                <div class="flex-1 text-slate-600 leading-relaxed py-1">
                  {{ item.a }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="mt-12 pt-8 border-t border-soft-green-100 text-center">
      <p class="text-sm text-slate-400">
        還有其他疑問嗎？歡迎透過 GitHub 回報或聯繫站長！
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* Potential custom animations for FAQ items */
.faq-item-enter-active, .faq-item-leave-active {
  transition: all 0.5s ease;
}
.faq-item-enter-from, .faq-item-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
