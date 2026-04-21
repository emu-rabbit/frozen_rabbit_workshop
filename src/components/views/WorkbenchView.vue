<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from '../../composables/useNotes'
import { useWorkbench } from '../../composables/useWorkbench'
import { formatLastUpdate, isPriceError, isRetrying, abortPriceFetch } from '../../services/universalis'

const { t, locale } = useI18n()
const { activeWorkbenchNote } = useNotes()
const { 
  workbenchItems, 
  decisions, 
  totalDemands, 
  activeItemIds, 
  isLoading, 
  hasMismatch,
  initialize 
} = useWorkbench()

const emit = defineEmits(['generate-todo'])

onMounted(() => {
  initialize()
})

// Watch for note changes to re-initialize
watch(activeWorkbenchNote, () => {
  initialize()
})

watch(locale, () => {
  initialize()
})

const getLocalizedName = (name: any) => {
    if (typeof name === 'string') return name
    if (!name) return 'Unknown'
    const l = locale.value as any
    return name[l] || name.tw || name.en || name.ja || Object.values(name)[0]
}

const getUnallocated = (id: number) => {
  const needed = totalDemands.value[id] || 0
  const d = decisions[String(id)]
  if (!d) return needed
  const sum = (d.buy || 0) + (d.craft || 0) + (d.gather || 0) + (d.other || 0)
  return needed - sum
}

const formatMoney = (val: number | null) => { 
    if (val === null) return t('workbench.view.status.nonePrice')
    return new Intl.NumberFormat().format(Math.floor(val)) + ' Gil' 
}

const summary = computed(() => {
    let totalCost = 0
    let totalTime = 0
    // Track max requirements per job: { jobName: { level, stars } }
    let maxCraft = new Map<string, { level: number, stars: number }>()
    let maxGather = new Map<string, { level: number, stars: number }>()
    let hasUnknownPrice = false

    activeItemIds.value.forEach(id => {
        const item = workbenchItems.value[id]
        const d = decisions[String(id)]
        if (!item || !d) return
        
        // 1. 金錢成本
        if (d.buy > 0) {
            if (item.marketPrice !== null) {
                totalCost += (d.buy * item.marketPrice)
            } else {
                hasUnknownPrice = true
            }
        }
        
        // 2. 時間成本與職業清單
        if (d.craft > 0 && item.crafting) {
            const current = maxCraft.get(item.crafting.jobName)
            if (!current || item.crafting.level > current.level || (item.crafting.level === current.level && item.crafting.stars > current.stars)) {
                maxCraft.set(item.crafting.jobName, { level: item.crafting.level, stars: item.crafting.stars })
            }
            const craftCount = Math.ceil(d.craft / item.crafting.yields)
            totalTime += craftCount * (item.crafting.stars > 0 ? 60 : 30)
        }
        
        if (d.gather > 0 && item.gathering) {
            const current = maxGather.get(item.gathering.jobName)
            if (!current || item.gathering.level > current.level || (item.gathering.level === current.level && item.gathering.stars > current.stars)) {
                maxGather.set(item.gathering.jobName, { level: item.gathering.level, stars: item.gathering.stars })
            }
            totalTime += (d.gather * 5)
        }
    })

    const craftJobs = Array.from(maxCraft.entries()).map(([name, req]) => `${name}|${req.level}|${req.stars}`)
    const gatherJobs = Array.from(maxGather.entries()).map(([name, req]) => `${name}|${req.level}|${req.stars}`)

    return { totalCost, totalTime, craftJobs, gatherJobs, hasUnknownPrice }
})

const updateDecision = (id: number, key: 'buy' | 'craft' | 'gather' | 'other', delta: number) => {
    if (!decisions[String(id)]) return
    if (delta > 0) {
        // 全量投入 (Max)：歸零其他，設定此項為需求總額
        const total = totalDemands.value[id] || 0
        decisions[String(id)].buy = 0
        decisions[String(id)].craft = 0
        decisions[String(id)].gather = 0
        decisions[String(id)].other = 0
        ;(decisions[String(id)] as any)[key] = total
    } else {
        // 歸零 (Min)
        ;(decisions[String(id)] as any)[key] = 0
    }
}

const setDecisionRaw = (id: number, key: 'buy' | 'craft' | 'gather' | 'other', val: number) => {
    if (!decisions[String(id)]) return
    ;(decisions[String(id)] as any)[key] = Math.max(0, isNaN(val) ? 0 : val)
}

const handleReset = () => {
    expandedItems.value = {}
    initialize(true)
}

const expandedItems = ref<Record<number, boolean>>({})
const toggleExpand = (id: number) => { expandedItems.value[id] = !expandedItems.value[id] }

// Helper for stars display
const renderStars = (count: number) => '★'.repeat(count)

const formatTime = (seconds: number) => {
    if (seconds <= 0) return `0 ${t('workbench.view.summary.mins')}`
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    
    let res = ''
    if (h > 0) res += `${h} ${t('workbench.view.summary.hours')} `
    if (m > 0 || h > 0) res += `${m} ${t('workbench.view.summary.mins')} `
    // 只有在不到一小時的情況下才顯示秒
    if (h === 0 && s > 0) res += `${s} ${t('workbench.view.summary.secs')}`
    return res.trim()
}
</script>

<template>
  <div class="workbench-container min-h-screen">
    <div class="px-4 py-6 md:p-6 max-w-6xl w-full mx-auto">
      <header class="mb-6 md:mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 class="text-3xl font-black text-soft-green-950 mb-1 drop-shadow-sm">{{ t('workbench.title') }}</h2>
          <p class="text-slate-500 font-bold text-sm opacity-80">{{ t('workbench.description') }}</p>
        </div>
        <div v-if="activeWorkbenchNote" class="bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-soft-green-100 shadow-lg flex items-center gap-6">
            <div class="flex flex-col min-w-0">
                <span class="text-[15px] font-black text-soft-green-400 uppercase tracking-widest mb-0.5">{{ t('workbench.view.prepping') }}</span>
                <span class="font-black text-soft-green-900 text-lg truncate max-w-[200px]">{{ getLocalizedName(activeWorkbenchNote.name) }}</span>
            </div>
            <div class="h-10 w-px bg-soft-green-100"></div>
            <div class="flex -space-x-2">
                <img v-for="item in activeWorkbenchNote.items.slice(0, 3)" :key="item.id" :src="workbenchItems[item.id]?.icon" class="w-10 h-10 rounded-lg border-2 border-white shadow-sm ring-1 ring-soft-green-50" />
                <div v-if="activeWorkbenchNote.items.length > 3" class="w-10 h-10 rounded-lg bg-slate-100 border-2 border-white shadow-sm ring-1 ring-soft-green-50 flex items-center justify-center">
                    <span class="text-[10px] font-black text-slate-400">+{{ activeWorkbenchNote.items.length - 3 }}</span>
                </div>
            </div>
        </div>
      </header>

      <div v-if="isLoading" class="py-20 flex flex-col items-center justify-center text-center px-4">
          <i class="pi pi-spin pi-spinner text-4xl text-soft-green-500 mb-4"></i>
          <p class="text-slate-400 font-bold mb-4">{{ t('workbench.view.analyzing') }}</p>
          
          <transition name="fade">
              <div v-if="isRetrying" class="relative group mt-6">
                  <!-- Glassmorphic Banner - Darker & Sharper -->
                  <div class="bg-white/80 backdrop-blur-xl border-2 border-soft-green-200/50 rounded-[2.5rem] p-8 flex flex-col items-center gap-5 shadow-[0_30px_60px_-15px_rgba(20,50,30,0.1)] ring-1 ring-white max-w-md mx-auto overflow-hidden">
                      <!-- Decorative Background Glow -->
                      <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-soft-green-300/20 blur-3xl rounded-full pointer-events-none"></div>
                      
                      <div class="flex flex-col items-center gap-2">
                          <div class="flex items-center gap-3 text-soft-green-800">
                              <i class="pi pi-sync text-xl animate-spin" style="animation-duration: 3s"></i>
                              <h4 class="text-base font-black tracking-tight">
                                  {{ t('workbench.view.retrying') }}
                              </h4>
                          </div>
                          <p class="text-[12px] font-bold text-slate-400 mt-1">
                              {{ t('workbench.view.retryHint') }}
                          </p>
                      </div>

                      <button 
                        @click="abortPriceFetch" 
                        class="group/btn relative px-8 py-3.5 bg-gradient-to-br from-soft-green-500 to-soft-green-600 hover:from-soft-green-600 hover:to-soft-green-700 text-white rounded-2xl text-[13px] font-black transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
                      >
                          <i class="pi pi-forward text-base"></i>
                          {{ t('workbench.view.cancelRetry') }}
                      </button>
                  </div>
              </div>
          </transition>
      </div>

      <div v-else class="flex flex-col gap-6 pb-96">
        <transition name="fade">
            <div v-if="isPriceError" class="bg-red-50/80 border border-red-100 rounded-2xl px-5 py-4 flex items-start gap-4 text-red-600 shadow-sm">
                <i class="pi pi-wifi text-2xl mt-0.5"></i>
                <div>
                    <h4 class="font-black text-[15px] mb-1">{{ t('workbench.view.status.priceErrorTitle') }}</h4>
                    <p class="text-[13px] font-bold opacity-80 leading-relaxed">
                        {{ t('workbench.view.status.priceErrorDesc') }}
                    </p>
                </div>
            </div>
        </transition>

        <TransitionGroup name="list">
          <div 
            v-for="id in activeItemIds" 
            :key="id" 
            class="item-card bg-white border rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-xl group"
            :class="getUnallocated(id) !== 0 ? 'border-red-400 border-2 shadow-[0_0_25px_-5px_rgba(239,68,68,0.15)] bg-red-50/5' : 'border-slate-100'"
          >
            <div class="p-4 md:p-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6">
                <!-- Icon & Info -->
                <div class="flex items-center gap-4 min-w-0 w-full lg:w-[35%]">
                    <div class="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                        <img :src="workbenchItems[id]?.icon" class="w-full h-full rounded-xl md:rounded-2xl shadow-md border border-slate-50" />
                        <div class="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-soft-green-600 text-white text-xs md:text-sm font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg md:rounded-xl border-2 border-white shadow-md z-10">
                           x{{ totalDemands[id] }}
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="text-base md:text-lg font-black text-slate-900 truncate tracking-tight">{{ workbenchItems[id]?.name }}</h3>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                            <!-- Price Badge -->
                            <span class="text-[12px] md:text-[14px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold border border-slate-200/50">
                                {{ formatMoney(workbenchItems[id]?.marketPrice) }}
                            </span>
                            <!-- Crafting Badge -->
                            <span v-if="workbenchItems[id]?.crafting" class="text-[12px] md:text-[14px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold border border-indigo-100">
                                {{ t(workbenchItems[id]?.crafting?.jobName) }} Lv.{{ workbenchItems[id]?.crafting?.level }}{{ renderStars(workbenchItems[id]?.crafting?.stars) }}
                            </span>
                            <!-- Gathering Badge -->
                            <span v-if="workbenchItems[id]?.gathering" class="text-[12px] md:text-[14px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-bold border border-amber-100">
                                {{ t(workbenchItems[id]?.gathering?.jobName) }} Lv.{{ workbenchItems[id]?.gathering?.level }}{{ renderStars(workbenchItems[id]?.gathering?.stars) }}
                            </span>
                        </div>
                    </div>
                    
                    <button @click="toggleExpand(id)" class="lg:hidden w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-colors shrink-0">
                        <i class="pi text-xs" :class="expandedItems[id] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </button>
                </div>

                <!-- Source Allocation - GRID VIEW -->
                <div class="flex-1 min-w-0">
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                         <!-- BUY -->
                        <div class="p-2 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center gap-1.5 md:gap-2 transition-all duration-200"
                             :class="decisions[String(id)]?.buy > 0 ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-100 shadow-sm' : 'bg-slate-50/80 border-slate-200'">
                           <span class="text-[11px] md:text-[13px] font-black uppercase tracking-tighter text-center leading-none" :class="decisions[String(id)]?.buy > 0 ? 'text-slate-600' : 'text-slate-400'">{{ t('workbench.view.source.buy') }}</span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-1.5 md:gap-2">
                               <button @click="updateDecision(id, 'buy', -1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-slate-500 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-left scale-75"></i></button>
                               <input type="number" v-model.number="decisions[String(id)].buy" @blur="setDecisionRaw(id, 'buy', decisions[String(id)].buy)" class="w-8 md:w-10 h-6 md:h-7 text-center text-xs md:text-sm font-black focus:outline-none bg-white border border-slate-300 rounded-md" />
                               <button @click="updateDecision(id, 'buy', 1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-slate-500 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-right scale-75"></i></button>
                           </div>
                        </div>

                        <!-- CRAFT -->
                        <div class="relative p-2 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center gap-1.5 md:gap-2 transition-all duration-200" 
                             :class="[!workbenchItems[id]?.canCraft ? 'opacity-30 grayscale pointer-events-none' : (decisions[String(id)]?.craft > 0 ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-50 shadow-sm' : 'bg-slate-50/80 border-slate-200')]">
                           <span class="text-[11px] md:text-[13px] font-black uppercase tracking-tighter text-center leading-none" :class="decisions[String(id)]?.craft > 0 ? 'text-indigo-600' : 'text-indigo-400'">
                               {{ !workbenchItems[id]?.canCraft ? t('workbench.view.source.cannotCraft') : t('workbench.view.source.craft') }}
                           </span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-1.5 md:gap-2">
                               <button @click="updateDecision(id, 'craft', -1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-left scale-75"></i></button>
                               <input type="number" v-model.number="decisions[String(id)].craft" @blur="setDecisionRaw(id, 'craft', decisions[String(id)].craft)" class="w-8 md:w-10 h-6 md:h-7 text-center text-xs md:text-sm font-black focus:outline-none bg-white border border-slate-300 rounded-md" />
                               <button @click="updateDecision(id, 'craft', 1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-right scale-75"></i></button>
                           </div>
                        </div>

                        <!-- GATHER -->
                        <div class="relative p-2 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center gap-1.5 md:gap-2 transition-all duration-200"
                             :class="[!workbenchItems[id]?.canGather ? 'opacity-30 grayscale pointer-events-none' : (decisions[String(id)]?.gather > 0 ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-50 shadow-sm' : 'bg-slate-50/80 border-slate-200')]">
                           <span class="text-[11px] md:text-[13px] font-black uppercase tracking-tighter text-center leading-none" :class="decisions[String(id)]?.gather > 0 ? 'text-amber-600' : 'text-amber-500'">
                               {{ !workbenchItems[id]?.canGather ? t('workbench.view.source.cannotGather') : t('workbench.view.source.gather') }}
                           </span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-1.5 md:gap-2">
                               <button @click="updateDecision(id, 'gather', -1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-amber-400 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-left scale-75"></i></button>
                               <input type="number" v-model.number="decisions[String(id)].gather" @blur="setDecisionRaw(id, 'gather', decisions[String(id)].gather)" class="w-8 md:w-10 h-6 md:h-7 text-center text-xs md:text-sm font-black focus:outline-none bg-white border border-slate-300 rounded-md" />
                               <button @click="updateDecision(id, 'gather', 1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-amber-400 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-right scale-75"></i></button>
                           </div>
                        </div>

                        <!-- OTHER -->
                        <div class="p-2 md:p-3 rounded-xl md:rounded-2xl border flex flex-col items-center gap-1.5 md:gap-2 transition-all duration-200"
                             :class="decisions[String(id)]?.other > 0 ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-50 shadow-sm' : 'bg-slate-50/80 border-slate-200'">
                           <span class="text-[11px] md:text-[13px] font-black uppercase tracking-tighter text-center leading-none" :class="decisions[String(id)]?.other > 0 ? 'text-emerald-600' : 'text-emerald-500'">{{ t('workbench.view.source.other') }}</span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-1.5 md:gap-2">
                               <button @click="updateDecision(id, 'other', -1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-emerald-400 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-left scale-75"></i></button>
                               <input type="number" v-model.number="decisions[String(id)].other" @blur="setDecisionRaw(id, 'other', decisions[String(id)].other)" class="w-8 md:w-10 h-6 md:h-7 text-center text-xs md:text-sm font-black focus:outline-none bg-white border border-slate-300 rounded-md" />
                               <button @click="updateDecision(id, 'other', 1)" class="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border border-slate-300 hover:border-emerald-400 flex items-center justify-center font-bold text-xs transition-colors shadow-sm"><i class="pi pi-angle-double-right scale-75"></i></button>
                           </div>
                        </div>
                    </div>
                </div>

                <!-- Status & Expand -->
                <div class="hidden lg:flex items-center gap-3 shrink-0 justify-end">
                    <button @click="toggleExpand(id)" class="w-12 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-colors">
                        <i class="pi text-sm" :class="expandedItems[id] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </button>
                </div>
            </div>

            <!-- Mismatch Row -->
            <div v-if="getUnallocated(id) !== 0" class="px-6 pb-5 -mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="bg-red-50/80 border border-red-100 rounded-2xl px-5 py-3.5 flex items-center gap-3 text-red-600 shadow-sm">
                    <i class="pi pi-exclamation-circle text-xl shrink-0"></i>
                    <span class="text-[13px] font-bold leading-relaxed">
                        {{ t('workbench.view.status.mismatch') }}
                    </span>
                </div>
            </div>

            <div v-show="expandedItems[id]" class="border-t border-slate-50 bg-slate-50/20 p-4 md:p-8">
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <!-- NPC VENDOR CARD (ORDERED FIRST) -->
                    <div v-if="workbenchItems[id]?.vendorInfo" class="group/card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center text-white shadow-lg shadow-slate-100">
                                <i class="pi pi-shopping-bag scale-90"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-[11px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">{{ t('workbench.view.details.vendorTitle') }}</span>
                                <span class="text-[14px] font-bold text-slate-700 truncate block">{{ workbenchItems[id].vendorInfo.npcName }}</span>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex flex-col min-w-0">
                                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">{{ t('todo.targetPrice') }}</span>
                                    <span class="text-base md:text-lg font-black text-slate-700 font-mono tracking-tighter truncate">{{ new Intl.NumberFormat().format(workbenchItems[id].vendorInfo.price) }} Gil</span>
                                </div>
                                <i class="pi pi-verified text-slate-300 text-xl opacity-50 shrink-0"></i>
                            </div>

                            <div class="flex items-start gap-2 bg-slate-50/50 rounded-xl px-3 py-3 border border-slate-100/30">
                                <i class="pi pi-map-marker text-slate-400 text-xs mt-0.5"></i>
                                <div class="flex-1 min-w-0">
                                    <div class="text-xs font-bold text-slate-700 truncate mb-1">{{ workbenchItems[id].vendorInfo.zoneName }}</div>
                                    <div v-if="workbenchItems[id].vendorInfo.coords" class="text-[11px] font-black text-slate-400 font-mono">
                                        X: {{ workbenchItems[id].vendorInfo.coords.x.toFixed(1) }}, Y: {{ workbenchItems[id].vendorInfo.coords.y.toFixed(1) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- MARKET BOARD STATS CARD -->
                    <div class="group/card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center text-white shadow-lg shadow-slate-100">
                                <i class="pi pi-chart-bar scale-90"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-[11px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">{{ t('workbench.view.details.mbTitle') }}</span>
                                <span class="text-[14px] font-bold text-slate-700 truncate block">
                                    {{ workbenchItems[id]?.marketStats?.worldName || t('settings.marketDC') }}
                                </span>
                            </div>
                            <div v-if="workbenchItems[id]?.priceFetched" class="text-[10px] font-bold text-slate-300 italic uppercase">
                                {{ formatLastUpdate(workbenchItems[id]) }}
                            </div>
                        </div>

                        <div v-if="workbenchItems[id]?.marketStats?.minPrice" class="space-y-4">
                            <div class="flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                <div class="flex flex-wrap items-center justify-between gap-1">
                                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ t('todo.targetPrice') }} (Min)</span>
                                    <span class="text-base md:text-lg font-black text-slate-700 font-mono tracking-tighter truncate">{{ new Intl.NumberFormat().format(workbenchItems[id].marketStats.minPrice) }} Gil</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2 md:gap-3">
                                <div class="flex flex-col p-2 md:p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 min-w-0">
                                    <span class="text-[9px] font-black text-slate-400 uppercase mb-1 truncate">{{ t('workbench.view.details.q1Price') }}</span>
                                    <span class="text-[11px] md:text-[13px] font-black text-slate-600 font-mono truncate">{{ new Intl.NumberFormat().format(workbenchItems[id].marketStats.q1Price ?? 0) }}</span>
                                </div>
                                <div class="flex flex-col p-2 md:p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 min-w-0">
                                    <span class="text-[9px] font-black text-slate-400 uppercase mb-1 truncate">{{ t('workbench.view.details.medianPrice') }}</span>
                                    <span class="text-[11px] md:text-[13px] font-black text-slate-600 font-mono truncate">{{ new Intl.NumberFormat().format(workbenchItems[id].marketStats.medianPrice ?? 0) }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="!workbenchItems[id]?.priceFetched" class="flex flex-col items-center justify-center py-6 opacity-30">
                            <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
                            <span class="text-xs font-bold">{{ t('workbench.view.analyzing') }}</span>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center py-6 text-slate-300">
                            <i class="pi pi-info-circle text-2xl mb-2"></i>
                            <span class="text-xs font-bold">{{ t('workbench.view.details.noListings') }}</span>
                        </div>
                    </div>

                    <!-- GATHERING CARD -->
                    <div v-if="workbenchItems[id]?.gathering" class="group/card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                                <i class="pi pi-map scale-90"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-[11px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">{{ t('workbench.view.details.gatherTitle') }}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-[14px] font-bold text-slate-700 truncate">{{ workbenchItems[id].gathering.zoneName || t('workbench.view.details.unknownZone') }}</span>
                                    <span v-if="workbenchItems[id].gathering.isLimited" class="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-black flex items-center gap-1 shrink-0">
                                        <i class="pi pi-clock scale-75"></i> {{ t('workbench.view.details.limited') }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div v-if="workbenchItems[id].gathering.parentZoneName && workbenchItems[id].gathering.parentZoneName !== workbenchItems[id].gathering.zoneName" class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100/50">
                                <i class="pi pi-map-marker text-slate-400 text-xs"></i>
                                <span class="text-xs font-bold text-slate-600 truncate">{{ workbenchItems[id].gathering.parentZoneName }}</span>
                            </div>

                            <div class="flex items-center justify-between text-xs px-1">
                                <span class="text-slate-400 font-bold uppercase tracking-tighter">{{ t(workbenchItems[id].gathering.jobName) }} Lv.{{ workbenchItems[id].gathering.level }}{{ renderStars(workbenchItems[id].gathering.stars) }}</span>
                                <span v-if="workbenchItems[id].gathering.x" class="text-soft-green-600 font-black font-mono">({{ workbenchItems[id].gathering.x.toFixed(1) }}, {{ workbenchItems[id].gathering.y.toFixed(1) }})</span>
                            </div>

                            <div v-if="workbenchItems[id].gathering.spawns.length > 0" class="bg-amber-50/50 rounded-xl p-3 border border-amber-100/30">
                                <span class="text-[10px] font-black text-amber-600/70 block mb-1.5 uppercase tracking-widest">{{ t('workbench.view.details.spawnTime') }}</span>
                                <div class="flex flex-wrap gap-1.5">
                                    <span v-for="st in workbenchItems[id].gathering.spawns" :key="st" class="px-2 py-0.5 bg-white border border-amber-200 text-amber-700 rounded-md text-[11px] font-black shadow-sm">{{ st }}:00</span>
                                </div>
                                <div class="text-[10px] font-bold text-amber-600/60 mt-2 italic text-right">
                                    {{ t('workbench.view.details.duration', { n: workbenchItems[id].gathering.duration / 60 }) }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CRAFTING CARD -->
                    <div v-if="workbenchItems[id]?.crafting" class="group/card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <i class="pi pi-hammer scale-90"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="text-[11px] font-black text-slate-400 block uppercase tracking-wider mb-0.5">{{ t('workbench.view.details.craftTitle') }}</span>
                                <span class="text-[14px] font-bold text-slate-700 truncate block">
                                    {{ t(workbenchItems[id].crafting.jobName) }} Lv.{{ workbenchItems[id].crafting.level }}{{ renderStars(workbenchItems[id].crafting.stars) }}
                                </span>
                            </div>
                            <div class="flex flex-col items-end shrink-0">
                                <span class="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{{ t('workbench.view.details.yield') }}</span>
                                <span class="text-sm font-black text-indigo-600">x{{ workbenchItems[id].crafting.yields }}</span>
                            </div>
                        </div>

                        <div class="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                             <div v-for="ing in workbenchItems[id].crafting.ingredients" :key="ing.id" class="flex items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                                 <img :src="ing.icon" class="w-8 h-8 rounded-lg shadow-sm border border-white" />
                                 <div class="flex-1 min-w-0">
                                     <div class="text-[12px] font-bold text-slate-700 truncate leading-tight">{{ getLocalizedName(ing.name) }}</div>
                                     <div class="text-[10px] font-bold text-slate-400 mt-0.5">ID: #{{ ing.id }}</div>
                                 </div>
                                 <div class="text-sm font-black text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                     x{{ ing.amount }}
                                 </div>
                             </div>
                        </div>
                    </div>
                 </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div v-if="!activeWorkbenchNote || activeItemIds.length === 0" class="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-soft-green-50">
          <i class="pi pi-briefcase text-6xl text-soft-green-50 mb-4"></i>
          <p class="text-slate-400 font-bold text-lg">{{ t('workbench.view.emptyTitle') }}</p>
      </div>
    </div>

    <!-- Summary Sticky Footer -->
    <div v-if="activeWorkbenchNote && activeItemIds.length > 0" class="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/95 backdrop-blur-md border-t border-soft-green-100 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)] p-4 md:py-5 md:px-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 z-40">
        <div class="flex items-center md:items-center gap-4 md:gap-8 text-left overflow-x-auto no-scrollbar md:overflow-visible pb-2 md:pb-0">
            <div class="flex flex-col shrink-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-[12px] md:text-[15px] font-black text-slate-400 uppercase tracking-widest">{{ t('workbench.view.summary.budgetTitle') }}</span>
                    <i class="pi pi-info-circle text-slate-300 text-[10px] md:text-xs cursor-help" :title="t('workbench.view.tooltip.budget')"></i>
                </div>
                <span v-if="summary.hasUnknownPrice" class="text-xl md:text-2xl font-black text-orange-500 italic leading-none">{{ t('workbench.view.summary.cannotEstimate') }}</span>
                <span v-else class="text-xl md:text-2xl font-black text-soft-green-600 font-mono leading-none">{{ formatMoney(summary.totalCost) }}</span>
            </div>
            <div class="h-8 md:h-10 w-px bg-slate-100 shrink-0"></div>
            <div class="flex flex-col shrink-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-[12px] md:text-[15px] font-black text-slate-400 uppercase tracking-widest">{{ t('workbench.view.summary.time') }}</span>
                    <i class="pi pi-info-circle text-slate-300 text-[10px] md:text-xs cursor-help" :title="t('workbench.view.tooltip.time')"></i>
                </div>
                <span class="text-xl md:text-2xl font-black text-soft-green-600 font-mono leading-none">{{ formatTime(summary.totalTime) }}</span>
            </div>
            <div class="h-8 md:h-10 w-px bg-slate-100 shrink-0 hidden sm:block"></div>
            <div class="hidden sm:flex flex-wrap gap-1 md:gap-1.5 max-w-[200px] md:max-w-[400px]">
                <span v-for="jobRaw in summary.craftJobs" :key="jobRaw" class="text-[11px] md:text-[15px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold border border-indigo-100 whitespace-nowrap">
                    {{ t(jobRaw.split('|')[0]) }} Lv.{{ jobRaw.split('|')[1] }}{{ renderStars(parseInt(jobRaw.split('|')[2])) }}
                </span>
                <span v-for="jobRaw in summary.gatherJobs" :key="jobRaw" class="text-[11px] md:text-[15px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-bold border border-amber-100 whitespace-nowrap">
                    {{ t(jobRaw.split('|')[0]) }} Lv.{{ jobRaw.split('|')[1] }}{{ renderStars(parseInt(jobRaw.split('|')[2])) }}
                </span>
            </div>
        </div>
        
        <div class="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <!-- Mismatch warning next to button -->
            <transition name="fade">
                <div v-if="hasMismatch" class="hidden xl:flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="text-xs font-bold">{{ t('workbench.view.status.mismatch') }}</span>
                </div>
            </transition>

            <button @click="handleReset" class="flex-1 md:flex-none h-10 md:h-12 px-4 md:px-6 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs md:text-sm">
                <i class="pi pi-sync"></i> {{ t('workbench.view.button.reset') }}
            </button>
            <button @click="$emit('generate-todo')" 
                    :disabled="hasMismatch || isLoading"
                    class="flex-[2] md:flex-none h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-soft-green-600 text-white font-black shadow-lg shadow-soft-green-100 hover:bg-soft-green-700 active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 disabled:cursor-not-allowed disabled:scale-100 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
                <i class="pi pi-list"></i> {{ t('workbench.view.button.generateList') }} <i class="pi pi-arrow-right scale-90"></i>
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.item-card { transform-origin: center; }
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Custom scrollbar reset */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.workbench-container {
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
}

input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }

/* Custom Scrollbar for Ingredient Lists */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}
</style>
