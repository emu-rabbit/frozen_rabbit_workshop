<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from '../../composables/useNotes'
import { useWorkbench } from '../../composables/useWorkbench'

const { t, locale } = useI18n()
const { activeWorkbenchNote } = useNotes()
const { 
  workbenchItems, 
  decisions, 
  totalDemands, 
  activeItemIds, 
  isLoading, 
  initialize 
} = useWorkbench()

onMounted(() => {
  initialize()
})

// Watch for note changes to re-initialize
watch(activeWorkbenchNote, () => {
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
    if (val === null) return '無上架'
    return new Intl.NumberFormat().format(Math.floor(val)) + ' Gil' 
}

const summary = computed(() => {
    let totalCost = 0
    let jobs = new Set<string>()
    let hasUnknownPrice = false
    activeItemIds.value.forEach(id => {
        const item = workbenchItems.value[id]
        const d = decisions[String(id)]
        if (!item || !d) return
        
        if (d.buy > 0) {
            if (item.marketPrice !== null) {
                totalCost += (d.buy * item.marketPrice)
            } else {
                hasUnknownPrice = true
            }
        }
        
        if (d.craft && item.crafting) {
            jobs.add(`${item.crafting.jobName} Lv.${item.crafting.level}${item.crafting.stars > 0 ? '★'.repeat(item.crafting.stars) : ''}`)
        }
        
        if (d.gather && item.gathering) {
            jobs.add(`${item.gathering.jobName} Lv.${item.gathering.level}${item.gathering.stars > 0 ? '★'.repeat(item.gathering.stars) : ''}`)
        }
    })
    return { totalCost, jobs: Array.from(jobs), hasUnknownPrice }
})

const updateDecision = (id: number, key: 'buy' | 'craft' | 'gather' | 'other', delta: number) => {
    if (!decisions[String(id)]) return
    const current = (decisions[String(id)] as any)[key]
    ;(decisions[String(id)] as any)[key] = Math.max(0, current + delta)
}

const setDecisionRaw = (id: number, key: 'buy' | 'craft' | 'gather' | 'other', val: number) => {
    if (!decisions[String(id)]) return
    ;(decisions[String(id)] as any)[key] = Math.max(0, isNaN(val) ? 0 : val)
}

const expandedItems = ref<Record<number, boolean>>({})
const toggleExpand = (id: number) => { expandedItems.value[id] = !expandedItems.value[id] }

// Helper for stars display
const renderStars = (count: number) => '★'.repeat(count)
</script>

<template>
  <div class="workbench-container min-h-screen">
    <div class="p-6 max-w-6xl w-full mx-auto">
      <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 class="text-3xl font-black text-soft-green-950 mb-1 drop-shadow-sm">{{ t('workbench.title') }}</h2>
          <p class="text-slate-500 font-bold text-sm opacity-80">{{ t('workbench.description') }}</p>
        </div>
        <div v-if="activeWorkbenchNote" class="bg-white/70 backdrop-blur-md px-6 py-4 rounded-3xl border border-soft-green-100 shadow-lg flex items-center gap-6">
            <div class="flex flex-col min-w-0">
                <span class="text-[15px] font-black text-soft-green-400 uppercase tracking-widest mb-0.5">正在備料</span>
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

      <div v-if="isLoading" class="py-20 text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-soft-green-500 mb-4"></i>
          <p class="text-slate-400 font-bold">正在載入真實資料與市場價格...</p>
      </div>

      <div v-else class="flex flex-col gap-6 pb-96">
        <TransitionGroup name="list">
          <div 
            v-for="id in activeItemIds" 
            :key="id" 
            class="item-card bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-xl group"
            :class="getUnallocated(id) !== 0 ? 'border-orange-200' : 'border-slate-100'"
          >
            <div class="p-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
                <!-- Icon & Info -->
                <div class="flex items-center gap-4 min-w-0 w-full lg:w-1/3">
                    <div class="relative w-16 h-16 shrink-0">
                        <img :src="workbenchItems[id]?.icon" class="w-full h-full rounded-2xl shadow-md border border-slate-50" />
                        <div class="absolute -bottom-2 -right-2 bg-soft-green-600 text-white text-sm font-black px-2.5 py-1 rounded-xl border-2 border-white shadow-md z-10">
                           x{{ totalDemands[id] }}
                        </div>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-lg font-black text-slate-900 truncate tracking-tight">{{ workbenchItems[id]?.name }}</h3>
                        <div class="flex flex-wrap gap-2 mt-1.5">
                            <!-- Price Badge -->
                            <span class="text-[15px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200/50">
                                {{ formatMoney(workbenchItems[id]?.marketPrice) }}
                            </span>
                            <!-- Crafting Badge -->
                            <span v-if="workbenchItems[id]?.crafting" class="text-[15px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                                {{ workbenchItems[id]?.crafting?.jobName }} Lv.{{ workbenchItems[id]?.crafting?.level }}{{ renderStars(workbenchItems[id]?.crafting?.stars) }}
                            </span>
                            <!-- Gathering Badge -->
                            <span v-if="workbenchItems[id]?.gathering" class="text-[15px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-bold border border-amber-100">
                                {{ workbenchItems[id]?.gathering?.jobName }} Lv.{{ workbenchItems[id]?.gathering?.level }}{{ renderStars(workbenchItems[id]?.gathering?.stars) }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Source Allocation - GRID VIEW -->
                <div class="flex-1 min-w-0">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         <!-- BUY -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                           <span class="text-[15px] font-black text-slate-400 uppercase tracking-widest">購買</span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'buy', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[String(id)].buy" @blur="setDecisionRaw(id, 'buy', decisions[String(id)].buy)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'buy', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>

                        <!-- CRAFT -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2" :class="{ 'opacity-20 pointer-events-none grayscale': !workbenchItems[id]?.canCraft }">
                           <span class="text-[15px] font-black text-indigo-400 uppercase tracking-widest">製作</span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'craft', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[String(id)].craft" @blur="setDecisionRaw(id, 'craft', decisions[String(id)].craft)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'craft', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>

                        <!-- GATHER -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2" :class="{ 'opacity-20 pointer-events-none grayscale': !workbenchItems[id]?.canGather }">
                           <span class="text-[15px] font-black text-amber-500 uppercase tracking-widest">採集</span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'gather', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[String(id)].gather" @blur="setDecisionRaw(id, 'gather', decisions[String(id)].gather)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'gather', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>

                        <!-- OTHER -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                           <span class="text-[15px] font-black text-emerald-500 uppercase tracking-widest">庫存</span>
                           <div v-if="decisions[String(id)]" class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'other', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[String(id)].other" @blur="setDecisionRaw(id, 'other', decisions[String(id)].other)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'other', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>
                    </div>
                </div>

                <!-- Status & Expand -->
                <div class="flex items-center gap-3 w-full lg:w-auto lg:shrink-0 justify-end">
                    <div class="h-12 px-4 min-w-[100px] rounded-xl flex items-center justify-center text-xs font-black shadow-sm border transition-colors"
                        :class="getUnallocated(id) === 0 ? 'bg-soft-green-500 text-white border-soft-green-600' : (getUnallocated(id) > 0 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200')"
                    >
                        <i v-if="getUnallocated(id) === 0" class="pi pi-check text-sm"></i>
                        <span v-else>
                           {{ getUnallocated(id) > 0 ? `還缺 ${getUnallocated(id)} 個` : `超出 ${Math.abs(getUnallocated(id))} 個` }}
                        </span>
                    </div>

                    <button @click="toggleExpand(id)" class="w-12 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-colors">
                        <i class="pi text-sm" :class="expandedItems[id] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </button>
                </div>
            </div>

            <div v-show="expandedItems[id]" class="border-t border-slate-50 bg-slate-50/20 p-6">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-if="workbenchItems[id]?.gathering" class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <span class="text-[13px] font-black text-slate-400 block mb-2 uppercase tracking-wider">採集地點與詳情</span>
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-bold">{{ workbenchItems[id].gathering.jobName }} Lv.{{ workbenchItems[id].gathering.level }}</span>
                            <span v-if="workbenchItems[id].gathering.isLimited" class="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold flex items-center gap-1">
                                <i class="pi pi-clock scale-75"></i> 限時
                            </span>
                        </div>
                        <div class="text-[16px] font-bold text-slate-700 mb-1">
                            {{ workbenchItems[id].gathering.zoneName || '未知地點' }}
                            <span v-if="workbenchItems[id].gathering.x" class="text-slate-400 text-sm ml-1">({{ workbenchItems[id].gathering.x.toFixed(1) }}, {{ workbenchItems[id].gathering.y.toFixed(1) }})</span>
                        </div>
                        <div v-if="workbenchItems[id].gathering.spawns.length > 0" class="text-xs text-slate-500 font-bold">
                            出現時間: {{ workbenchItems[id].gathering.spawns.join(', ') }} (持續 {{ workbenchItems[id].gathering.duration / 60 }} 小時)
                        </div>
                    </div>
                    <div v-if="workbenchItems[id]?.crafting" class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <span class="text-[13px] font-black text-slate-400 block mb-2 uppercase tracking-wider">製作配方需求</span>
                        <div class="mb-3">
                            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-bold">{{ workbenchItems[id].crafting.jobName }} Lv.{{ workbenchItems[id].crafting.level }}{{ renderStars(workbenchItems[id].crafting.stars) }}</span>
                            <span class="text-slate-400 text-xs font-bold ml-2">單次產量: {{ workbenchItems[id].crafting.yields }}</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                             <div v-for="ing in workbenchItems[id].crafting.ingredients" :key="ing.id" class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                 <img :src="`https://xivapi.com/i/000000/000001.png`" class="w-4 h-4 opacity-50" /> <!-- ing icon is harder to get here without more lookups -->
                                 <span class="text-[11px] font-bold text-slate-500">Item #{{ ing.id }} x{{ ing.amount }}</span>
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
          <p class="text-slate-400 font-bold text-lg">目前沒有備料計畫</p>
      </div>
    </div>

    <!-- Summary Sticky Footer -->
    <div v-if="activeWorkbenchNote && activeItemIds.length > 0" class="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-soft-green-100 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)] py-5 px-8 flex flex-col md:flex-row items-center justify-between gap-6 z-40">
        <div class="flex items-center gap-8 text-left">
            <div class="flex flex-col">
                <span class="text-[15px] font-black text-slate-400 uppercase tracking-widest mb-0.5">總工程預算</span>
                <span v-if="summary.hasUnknownPrice" class="text-2xl font-black text-orange-500 italic">無法預估</span>
                <span v-else class="text-2xl font-black text-soft-green-600 font-mono">{{ formatMoney(summary.totalCost) }}</span>
            </div>
            <div class="h-10 w-px bg-slate-100 hidden md:block"></div>
            <div class="hidden md:flex flex-wrap gap-1.5 max-w-[300px]">
                <span v-for="job in summary.jobs" :key="job" class="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold border border-indigo-100">{{ job }}</span>
            </div>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
            <button class="flex-1 md:flex-none h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
                <i class="pi pi-sync"></i> 重設
            </button>
            <button class="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-soft-green-600 text-white font-black shadow-lg shadow-soft-green-100 hover:bg-soft-green-700 active:scale-95 transition-all flex items-center justify-center gap-3 text-base">
                <i class="pi pi-list"></i> 生成製作清單 <i class="pi pi-arrow-right scale-90"></i>
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.item-card { transform-origin: center; }
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px); }

.workbench-container {
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
}

input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }
</style>
