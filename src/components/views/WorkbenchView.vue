<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotes } from '../../composables/useNotes'

const { t, locale } = useI18n()
const { activeWorkbenchNote } = useNotes()

// --- Mock Data Structure ---
interface RecipeIngredient {
  id: string | number
  quantity: number
}

interface ItemMock {
  id: string | number
  name: string
  icon: string
  canBuy: boolean
  canCraft: boolean
  canGather: boolean
  buyPrice?: number
  craftJob?: string
  craftLevel?: number
  gatherJob?: string
  gatherLevel?: number
  recipe?: RecipeIngredient[]
}

const items: Record<string, ItemMock> = {
  '31541': {
    id: '31541',
    name: '精金大弓',
    icon: 'https://xivapi.com/i/031000/031541.png',
    canBuy: true,
    canCraft: true,
    canGather: false,
    buyPrice: 150000,
    craftJob: '刻木匠',
    craftLevel: 90,
    recipe: [
      { id: '32707', quantity: 3 },
      { id: '32729', quantity: 1 }
    ]
  },
  '32707': {
    id: '32707',
    name: '精金木材',
    icon: 'https://xivapi.com/i/022000/022401.png',
    canBuy: true,
    canCraft: true,
    canGather: false,
    buyPrice: 12000,
    craftJob: '刻木匠',
    craftLevel: 90,
    recipe: [
      { id: '32700', quantity: 4 }
    ]
  },
  '32729': {
    id: '32729',
    name: '纖維弦',
    icon: 'https://xivapi.com/i/021000/021301.png',
    canBuy: true,
    canCraft: true,
    canGather: false,
    buyPrice: 5000,
    craftJob: '裁縫師',
    craftLevel: 88,
    recipe: [
      { id: '32730', quantity: 2 }
    ]
  },
  '32700': {
    id: '32700',
    name: '精金原木',
    icon: 'https://xivapi.com/i/022000/022402.png',
    canBuy: true,
    canCraft: false,
    canGather: true,
    buyPrice: 3500,
    gatherJob: '園藝工',
    gatherLevel: 90
  },
  '32730': {
    id: '32730',
    name: '虹綿',
    icon: 'https://xivapi.com/i/021000/021302.png',
    canBuy: true,
    canCraft: true, 
    canGather: true,
    buyPrice: 2000,
    craftJob: '裁縫師',
    craftLevel: 88,
    gatherJob: '園藝工',
    gatherLevel: 88,
    recipe: [
      { id: 'boll', quantity: 5 }
    ]
  },
  'boll': {
    id: 'boll',
    name: '虹綿之實',
    icon: 'https://xivapi.com/i/021000/021303.png',
    canBuy: true,
    canCraft: false,
    canGather: true,
    buyPrice: 500,
    gatherJob: '園藝工',
    gatherLevel: 88
  }
}

// Add legacy keys for demo
items['bow'] = items['31541']
items['wood'] = items['32707']
items['string'] = items['32729']
items['log'] = items['32700']
items['cotton'] = items['32730']

// Ensure all IDs are strings in the map
Object.keys(items).forEach(k => {
    if (items[k].id) items[items[k].id.toString()] = items[k]
})

// --- State ---
const rootDemands = ref<{ id: string | number, quantity: number }[]>([])
const decisions = reactive<Record<string, { buy: number, craft: number, gather: number, other: number }>>({})

const initDecisions = (id: string | number) => {
  const sid = id.toString()
  if (!decisions[sid]) {
    decisions[sid] = { buy: 0, craft: 0, gather: 0, other: 0 }
  }
}

const getItem = (id: string | number) => {
    const sid = id.toString()
    return items[sid] || {
        id: sid,
        name: `項目 #${sid}`,
        icon: `https://xivapi.com/i/000000/000001.png`,
        canBuy: true,
        canCraft: true,
        canGather: true,
        buyPrice: 1000,
        craftJob: '專家',
        craftLevel: 1,
        gatherJob: '專家',
        gatherLevel: 1
    }
}

const getLocalizedName = (name: any) => {
    if (typeof name === 'string') return name
    // Fallback order: current locale -> tw -> en -> ja
    const l = locale.value as any
    return name[l] || name.tw || name.en || name.ja || 'Unknown'
}

watch(activeWorkbenchNote, (note) => {
    if (!note) return
    rootDemands.value = []
    for (const key in decisions) { delete decisions[key] }
    
    note.items.forEach(item => {
        const id = item.id.toString()
        rootDemands.value.push({ id, quantity: item.quantity })
        initDecisions(id)
        const mockItem = getItem(id)
        if (mockItem.canCraft) {
            decisions[id].craft = item.quantity
        } else if (mockItem.canBuy) {
            decisions[id].buy = item.quantity
        }
    })
}, { immediate: true })

const computedRequirements = computed(() => {
  const requirements: Record<string, number> = {}
  rootDemands.value.forEach(d => {
    const sid = d.id.toString()
    requirements[sid] = (requirements[sid] || 0) + d.quantity
  })

  const sequence = ['31541', '32707', '32729', '32700', '32730', 'boll', 'bow', 'wood', 'string', 'log', 'cotton']
  sequence.forEach(id => {
    const sid = id.toString()
    const totalNeeded = requirements[sid] || 0
    if (totalNeeded > 0) {
        initDecisions(sid)
        const craftQty = decisions[sid]?.craft || 0
        const item = items[sid]
        if (item?.recipe) {
          item.recipe.forEach(ing => {
            const isid = ing.id.toString()
            requirements[isid] = (requirements[isid] || 0) + (ing.quantity * craftQty)
          })
        }
    }
  })
  return requirements
})

const getUnallocated = (id: string) => {
  const needed = computedRequirements.value[id] || 0
  initDecisions(id)
  const d = decisions[id]
  const sum = (d?.buy || 0) + (d?.craft || 0) + (d?.gather || 0) + (d?.other || 0)
  return needed - sum
}

const activeItemsIds = computed(() => {
    const ids = new Set<string>()
    Object.entries(computedRequirements.value).forEach(([id, qty]) => { if (qty > 0) ids.add(id) })
    return Array.from(ids)
})

const formatMoney = (val: number) => { return new Intl.NumberFormat().format(val) + ' G' }

const summary = computed(() => {
    let totalCost = 0
    let jobs = new Set<string>()
    Object.keys(decisions).forEach(id => {
        const item = getItem(id)
        const d = decisions[id]
        totalCost += (d.buy * (item.buyPrice || 0))
        if (d.craft && item.craftJob) jobs.add(`${item.craftJob} Lv.${item.craftLevel}`)
        if (d.gather && item.gatherJob) jobs.add(`${item.gatherJob} Lv.${item.gatherLevel}`)
    })
    return { totalCost, jobs: Array.from(jobs) }
})

const updateDecision = (id: string, key: 'buy' | 'craft' | 'gather' | 'other', delta: number) => {
    initDecisions(id)
    const current = decisions[id][key]
    decisions[id][key] = Math.max(0, current + delta)
}

const setDecisionRaw = (id: string, key: 'buy' | 'craft' | 'gather' | 'other', val: number) => {
    initDecisions(id)
    decisions[id][key] = Math.max(0, isNaN(val) ? 0 : val)
}

const expandedItems = ref<Record<string, boolean>>({})
const toggleExpand = (id: string) => { expandedItems.value[id] = !expandedItems.value[id] }
</script>

<template>
  <div class="workbench-container pb-40 min-h-screen">
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
                <img v-for="d in rootDemands.slice(0, 3)" :key="d.id" :src="getItem(d.id).icon" class="w-10 h-10 rounded-lg border-2 border-white shadow-sm ring-1 ring-soft-green-50" />
            </div>
        </div>
      </header>

      <div class="flex flex-col gap-6">
        <TransitionGroup name="list">
          <div 
            v-for="id in activeItemsIds" 
            :key="id" 
            class="item-card bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-xl group"
            :class="getUnallocated(id) !== 0 ? 'border-orange-200' : 'border-slate-100'"
          >
            <div class="p-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-6">
                <!-- Icon & Info -->
                <div class="flex items-center gap-4 min-w-0 w-full lg:w-1/3">
                    <div class="relative w-16 h-16 shrink-0">
                        <img :src="getItem(id).icon" class="w-full h-full rounded-2xl shadow-md border border-slate-50" />
                        <div class="absolute -bottom-2 -right-2 bg-soft-green-600 text-white text-sm font-black px-2.5 py-1 rounded-xl border-2 border-white shadow-md z-10">
                           x{{ computedRequirements[id] }}
                        </div>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-lg font-black text-slate-900 truncate tracking-tight">{{ getItem(id).name }}</h3>
                        <div class="flex flex-wrap gap-2 mt-1.5">
                            <span v-if="getItem(id).canBuy" class="text-[15px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200/50">
                                {{ formatMoney(getItem(id).buyPrice!) }}
                            </span>
                            <span v-if="getItem(id).canCraft" class="text-[15px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                                {{ getItem(id).craftJob }} Lv.{{ getItem(id).craftLevel }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Source Allocation - GRID VIEW -->
                <div class="flex-1 min-w-0">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <!-- BUY -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2" :class="{ 'opacity-20 pointer-events-none grayscale': !getItem(id).canBuy }">
                           <span class="text-[15px] font-black text-slate-400 uppercase tracking-widest">購買</span>
                           <div class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'buy', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[id].buy" @blur="setDecisionRaw(id, 'buy', decisions[id].buy)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'buy', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>

                        <!-- CRAFT -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2" :class="{ 'opacity-20 pointer-events-none grayscale': !getItem(id).canCraft }">
                           <span class="text-[15px] font-black text-indigo-400 uppercase tracking-widest">製作</span>
                           <div class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'craft', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[id].craft" @blur="setDecisionRaw(id, 'craft', decisions[id].craft)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'craft', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>

                        <!-- GATHER -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2" :class="{ 'opacity-20 pointer-events-none grayscale': !getItem(id).canGather }">
                           <span class="text-[15px] font-black text-amber-500 uppercase tracking-widest">採集</span>
                           <div class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'gather', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[id].gather" @blur="setDecisionRaw(id, 'gather', decisions[id].gather)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
                               <button @click="updateDecision(id, 'gather', 1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">+</button>
                           </div>
                        </div>

                        <!-- OTHER -->
                        <div class="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                           <span class="text-[15px] font-black text-emerald-500 uppercase tracking-widest">其他</span>
                           <div class="flex items-center gap-2">
                               <button @click="updateDecision(id, 'other', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-soft-green-400 flex items-center justify-center font-bold text-xs">-</button>
                               <input type="number" v-model.number="decisions[id].other" @blur="setDecisionRaw(id, 'other', decisions[id].other)" class="w-8 text-center text-sm font-black focus:outline-none bg-transparent" />
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
                <!-- Details (simplified) -->
                 <div class="flex gap-4">
                    <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1">
                        <span class="text-[15px] font-black text-slate-400 block mb-1">採集來源</span>
                        <div class="text-[18px] font-bold text-slate-600">{{ getItem(id).gatherJob }} Lv.{{ getItem(id).gatherLevel }}</div>
                    </div>
                    <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1">
                        <span class="text-[15px] font-black text-slate-400 block mb-1">製作職業</span>
                        <div class="text-[18px] font-bold text-slate-600">{{ getItem(id).craftJob }} Lv.{{ getItem(id).craftLevel }}</div>
                    </div>
                 </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <div v-if="!activeWorkbenchNote || activeItemsIds.length === 0" class="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-soft-green-50">
          <i class="pi pi-briefcase text-6xl text-soft-green-50 mb-4"></i>
          <p class="text-slate-400 font-bold text-lg">目前沒有備料計畫</p>
      </div>
    </div>

    <!-- Summary Sticky Footer -->
    <div v-if="activeWorkbenchNote && activeItemsIds.length > 0" class="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-md border-t border-soft-green-100 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)] py-5 px-8 flex flex-col md:flex-row items-center justify-between gap-6 z-40">
        <div class="flex items-center gap-8 text-left">
            <div class="flex flex-col">
                <span class="text-[15px] font-black text-slate-400 uppercase tracking-widest mb-0.5">總工程預算</span>
                <span class="text-2xl font-black text-soft-green-600 font-mono">{{ formatMoney(summary.totalCost) }}</span>
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

.workbench-container { background: #fcfdfc; }

input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }
</style>
