<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

interface FaqItem {
  q: string
  a: string
}

const faqItems = computed(() => tm('faq.items') as FaqItem[])
</script>

<template>
  <div class="px-4 py-8 md:p-8 max-w-3xl w-full mx-auto pb-24">
    <header class="mb-6 md:mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-soft-green-800 mb-2">{{ t('nav.faq') }}</h2>
      <p class="text-slate-500 text-sm">{{ t('settings.description') }}</p>
    </header>

    <div class="flex flex-col gap-6">
      <div 
        v-for="(item, index) in faqItems" 
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
                <div class="flex-1 text-slate-600 leading-relaxed py-1" v-html="item.a">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="mt-12 pt-8 border-t border-soft-green-100 text-center">
      <p class="text-sm text-slate-400">
        {{ t('faq.footer', { email: 'mausu2526@gmail.com' }) }}
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
