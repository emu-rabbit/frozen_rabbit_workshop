import { ref, computed, watch, reactive } from 'vue';
import { useNotes } from './useNotes';
import { 
  ensureDictionaryLoaded, 
  globalRecipesCache, 
  getDictionaryItem,
  getRawItemData,
  setDictionaryLanguage
} from '../services/dictionary';
import type { Recipe } from '../services/dictionary';
import { fetchItemPrices, selectedDC } from '../services/universalis';
import type { MarketListing } from '../services/universalis';
import { calculateSimulatedPrice, calculateMarketStats } from '../utils/marketPricing';
import { ensureGatheringDataLoaded, getGatheringInfo } from '../services/gathering';
import { ensureVendorDataLoaded, getBestVendor } from '../services/vendor';
import type { VendorInfo } from '../services/vendor';
import { useI18n } from 'vue-i18n';
import { useSettings } from './useSettings';

export interface CraftingInfo {
  job: number;
  jobName: string;
  level: number;
  stars: number;
  yields: number;
  ingredients: { id: number; amount: number; name: any; icon: string }[];
}

export interface WorkbenchItem {
  id: number;
  name: string;
  icon: string;
  canCraft: boolean;
  canGather: boolean;
  marketPrice: number | null;
  priceFetched: boolean;
  lastUploadTime?: number;
  listings?: MarketListing[];
  crafting: CraftingInfo | null;
  gathering: any | null; // GatheringInfo from gathering.ts
  vendorInfo: VendorInfo | null;
  marketStats?: {
    minPrice: number | null;
    q1Price: number | null;
    medianPrice: number | null;
    worldName: string | null;
  };
  purchaseInfo?: PurchaseInfo;
}

export interface PurchaseInfo {
  type: 'market' | 'vendor';
  vendor?: VendorInfo | null;
  worldName?: string | null;
}

export interface ItemDecision {
  buy: number;
  craft: number;
  gather: number;
  other: number;
}

export interface TodoItem {
  sectionKey: 'other' | 'buy' | 'gather' | 'craft';
  id: number;
  quantity: number;
  name: any;
  icon: string;
  marketPrice: number | null;
  purchaseInfo?: PurchaseInfo;
  gathering?: any;
  crafting?: any;
}

export interface TodoSection {
  key: 'other' | 'buy' | 'gather' | 'craft';
  items: TodoItem[];
}

// --- Shared State (Singleton) ---
const CRYSTAL_IDS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
const CRAFT_JOB_NAMES: Record<number, string> = {
  8: 'jobs.crp', 9: 'jobs.bsm', 10: 'jobs.arm', 11: 'jobs.gsm',
  12: 'jobs.lwr', 13: 'jobs.wvr', 14: 'jobs.alc', 15: 'jobs.cul'
};

const workbenchItems = ref<Record<number, WorkbenchItem>>({});
const decisions = reactive<Record<string, ItemDecision>>({});
const isLoading = ref(false);
const lastNoteId = ref<string | null>(null);
const lastDC = ref<string | null>(null);
const lastLocale = ref<string | null>(null);

// Todo List State
const todoChecked = reactive<Record<string, boolean>>({});
const todoOrder = reactive<Record<string, number[]>>({});

/**
 * 智慧型初始化單個項目的決策
 * 根據使用者要求：成品優先製作，展開的材料優先購買，水晶優先庫存
 */
const initSingleItemDecision = (id: number, demand: number, isRoot: boolean = false) => {
  if (decisions[String(id)]) return;
  const itemData = workbenchItems.value[id];
  
  if (CRYSTAL_IDS.has(id)) {
      // 水晶類選擇庫存 (other)
      decisions[String(id)] = { buy: 0, craft: 0, gather: 0, other: demand };
  } else if (isRoot) {
      // 成品優先選擇製作
      if (itemData?.canCraft) {
          decisions[String(id)] = { buy: 0, craft: demand, gather: 0, other: 0 };
      } else if (itemData?.canGather) {
          decisions[String(id)] = { buy: 0, craft: 0, gather: demand, other: 0 };
      } else {
          decisions[String(id)] = { buy: demand, craft: 0, gather: 0, other: 0 };
      }
  } else {
      // 展開的材料優先選擇購買
      decisions[String(id)] = { buy: demand, craft: 0, gather: 0, other: 0 };
  }
};

/**
 * 刷新物品詳細資料 (Recipe, Gathering)
 */
const refreshItemsData = async (ids: number[]) => {
  for (const id of ids) {
    if (workbenchItems.value[id]) continue;

    const recipe = globalRecipesCache.value?.find(r => r.result === id);
    const gather = getGatheringInfo(id);
    const vendor = getBestVendor(id);

    const crafting: CraftingInfo | null = recipe ? {
      job: recipe.job,
      jobName: CRAFT_JOB_NAMES[recipe.job] || '製作',
      level: recipe.lvl,
      stars: recipe.stars || 0,
      yields: recipe.yields || 1,
      ingredients: (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ing: any) => {
        const ingInfo = getDictionaryItem(ing.id) ?? getRawItemData(ing.id);
        return {
          id: ing.id,
          amount: ing.amount,
          name: ingInfo.name, // LocalizedString or string
          icon: ingInfo.icon
        };
      })
    } : null;

    const itemInfo = getDictionaryItem(id) ?? getRawItemData(id);

    workbenchItems.value[id] = {
      id,
      name: itemInfo.name,
      icon: itemInfo.icon,
      canCraft: !!recipe,
      canGather: !!gather,
      marketPrice: null,
      priceFetched: false,
      crafting,
      gathering: gather,
      vendorInfo: vendor
    };
  }
};

const { marketCostStrategy } = useSettings();

/**
 * 根據策略計算單一項目的有效價格
 */
const updateItemEffectivePrice = (item: WorkbenchItem) => {
    if (!item.priceFetched) return;
    
    let baseMarketPrice: number | null = null;
    const stats = item.marketStats;
    
    if (stats) {
        if (marketCostStrategy.value === 'aggressive') {
            baseMarketPrice = stats.minPrice;
        } else if (marketCostStrategy.value === 'balanced') {
            baseMarketPrice = stats.q1Price;
        } else if (marketCostStrategy.value === 'conservative') {
            baseMarketPrice = stats.medianPrice;
        }
    }

    const npcPrice = item.vendorInfo?.price ?? Infinity;
    
    // 取兩者最低
    const finalPrice = Math.min(baseMarketPrice ?? Infinity, npcPrice);
    item.marketPrice = finalPrice === Infinity ? null : finalPrice;

    // 判斷採購來源 (均等時 NPC 優先)
    if (npcPrice !== Infinity && (baseMarketPrice === null || npcPrice <= baseMarketPrice)) {
        item.purchaseInfo = { type: 'vendor', vendor: item.vendorInfo };
    } else if (baseMarketPrice !== null) {
        item.purchaseInfo = { type: 'market', worldName: stats?.worldName };
    } else {
        item.purchaseInfo = undefined;
    }
};

/**
 * 批次獲取價格
 */
const fetchPrices = async (ids: number[]) => {
  const currentDC = selectedDC.value;
  const prices = await fetchItemPrices(ids);
  
  // 校驗：如果在請求期間大區發生變動，則捨棄此次過時的回傳
  if (selectedDC.value !== currentDC) {
    console.warn(`[Workbench] DC changed from "${currentDC}" to "${selectedDC.value}" during fetch, discarding stale data.`);
    return;
  }

  ids.forEach(id => {
    const item = workbenchItems.value[id];
    if (item) {
      const priceData = prices.get(id);
      item.listings = priceData?.listings || [];
      
      item.lastUploadTime = priceData?.lastUploadTime ?? 0;
      item.priceFetched = true;

      // Calculate Market Stats for the detail drawer
      item.marketStats = calculateMarketStats(item.listings || []);

      // 根據策略更新有效價格
      updateItemEffectivePrice(item);
    }
  });
};

// 監聽策略變更，即時更新所有價格
watch(marketCostStrategy, () => {
    Object.values(workbenchItems.value).forEach(item => {
        updateItemEffectivePrice(item);
    });
});

/**
 * 計算目前所有產生的需求 (BFS)
 */
const totalDemands = computed(() => {
  const demands: Record<number, number> = {};
  const { activeWorkbenchNote } = useNotes();
  if (!activeWorkbenchNote.value) return demands;

  activeWorkbenchNote.value.items.forEach(item => {
    demands[item.id] = (demands[item.id] || 0) + item.quantity;
  });

  const queue = activeWorkbenchNote.value.items.map(i => i.id);
  const processed = new Set<number>();
  
  let head = 0;
  while (head < queue.length) {
    const currentId = queue[head++];
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    const decision = decisions[String(currentId)];
    if (!decision || decision.craft <= 0) continue;

    const recipe = globalRecipesCache.value?.find(r => r.result === currentId);
    if (!recipe) continue;

    const yields = recipe.yields || 1;
    const craftCount = Math.ceil(decision.craft / yields);

    const ings: {id: number; amount: number}[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    ings.forEach(ing => {
      const ingId = ing.id;
      const requiredAmt = ing.amount * craftCount;
      demands[ingId] = (demands[ingId] || 0) + requiredAmt;
      
      if (!processed.has(ingId)) {
        queue.push(ingId);
      }
    });
  }

  return demands;
});

/**
 * 計算渲染順序 (BFS 序)
 */
const activeItemIds = computed(() => {
  const ids: number[] = [];
  const demands = totalDemands.value;
  const seen = new Set<number>();
  const { activeWorkbenchNote } = useNotes();

  const rootIds = activeWorkbenchNote.value?.items.map(i => i.id) || [];
  const queue = [...rootIds];

  let head = 0;
  while (head < queue.length) {
    const id = queue[head++];
    if (seen.has(id)) continue;
    
    if (demands[id] > 0) {
      seen.add(id);
      ids.push(id);
      
      const decision = decisions[String(id)];
      if (decision && decision.craft > 0) {
        const recipe = globalRecipesCache.value?.find(r => r.result === id);
        if (recipe) {
          const ings: {id: number}[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
          ings.forEach(ing => {
             if (!seen.has(ing.id)) queue.push(ing.id);
          });
        }
      }
    }
  }

  return ids.sort((a, b) => {
      const itemA = workbenchItems.value[a];
      const itemB = workbenchItems.value[b];
      const isRootA = rootIds.includes(a);
      const isRootB = rootIds.includes(b);
      const isCrystalA = CRYSTAL_IDS.has(a);
      const isCrystalB = CRYSTAL_IDS.has(b);

      const getWeight = (id: number, item: any, isRoot: boolean, isCrystal: boolean) => {
          if (isRoot) return 0;
          if (isCrystal) return 4;
          if (item?.canCraft) return 1;
          if (item?.canGather) return 2;
          return 3;
      };

      const wA = getWeight(a, itemA, isRootA, isCrystalA);
      const wB = getWeight(b, itemB, isRootB, isCrystalB);

      if (wA !== wB) return wA - wB;

      if (wA === 1 || wA === 2) {
          const metaA = wA === 1 ? itemA?.crafting : itemA?.gathering;
          const metaB = wA === 1 ? itemB?.crafting : itemB?.gathering;
          if (metaA && metaB) {
              if (metaB.level !== metaA.level) return metaB.level - metaA.level;
              if (metaB.stars !== metaA.stars) return metaB.stars - metaA.stars;
              const jobA = wA === 1 ? metaA.job : metaA.type;
              const jobB = wA === 1 ? metaB.job : metaB.type;
              if (jobA !== jobB) return jobA - jobB;
          }
      } else if (wA === 4) {
          return b - a;
      }

      return 0;
  });
});

/**
 * 生成代辦清單結構資料
 */
const generateTodoSections = computed(() => {
  const sections: Record<string, TodoItem[]> = {
    other: [],
    buy: [],
    gather: [],
    craft: []
  };

  activeItemIds.value.forEach(id => {
    const item = workbenchItems.value[id];
    const d = decisions[String(id)];
    if (!item || !d) return;

    if (d.other > 0) {
      sections.other.push({
        sectionKey: 'other', id, quantity: d.other,
        name: item.name, icon: item.icon, marketPrice: null
      });
    }

    if (d.buy > 0) {
      sections.buy.push({
        sectionKey: 'buy', id, quantity: d.buy,
        name: item.name, icon: item.icon, 
        marketPrice: item.marketPrice,
        purchaseInfo: item.purchaseInfo
      });
    }

    if (d.gather > 0) {
      sections.gather.push({
        sectionKey: 'gather', id, quantity: d.gather,
        name: item.name, icon: item.icon, marketPrice: null,
        gathering: item.gathering
      });
    }

    if (d.craft > 0) {
      sections.craft.push({
        sectionKey: 'craft', id, quantity: d.craft,
        name: item.name, icon: item.icon, marketPrice: null,
        crafting: item.crafting
      });
    }
  });

  sections.craft.sort((a, b) => {
      const indexA = activeItemIds.value.indexOf(a.id);
      const indexB = activeItemIds.value.indexOf(b.id);
      return indexB - indexA;
  });

  sections.buy.sort((a, b) => {
      const infoA = a.purchaseInfo;
      const infoB = b.purchaseInfo;
      if (!infoA && !infoB) return 0;
      if (!infoA) return 1;
      if (!infoB) return -1;

      // 1. Group by Type (Market vs Vendor)
      if (infoA.type !== infoB.type) {
          return infoA.type === 'market' ? -1 : 1;
      }

      // 2a. Within Market: group by worldName
      if (infoA.type === 'market') {
          return (infoA.worldName || '').localeCompare(infoB.worldName || '');
      }

      // 2b. Within Vendor: group by Zone then NPC Name
      const zoneA = infoA.vendor?.zoneName || '';
      const zoneB = infoB.vendor?.zoneName || '';
      if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);

      const npcA = infoA.vendor?.npcName || '';
      const npcB = infoB.vendor?.npcName || '';
      return npcA.localeCompare(npcB);
  });

  sections.gather.sort((a, b) => {
      const gA = a.gathering;
      const gB = b.gathering;
      if (!gA && !gB) return 0;
      if (!gA) return 1;
      if (!gB) return -1;

      // 1. Group by Region -> Parent Zone -> Zone
      const regA = gA.regionName || '';
      const regB = gB.regionName || '';
      if (regA !== regB) return regA.localeCompare(regB);

      const pZoneA = gA.parentZoneName || '';
      const pZoneB = gB.parentZoneName || '';
      if (pZoneA !== pZoneB) return pZoneA.localeCompare(pZoneB);

      const zoneA = gA.zoneName || '';
      const zoneB = gB.zoneName || '';
      if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);

      // 2. Sub-sort by Job and Level
      if (gA.jobName !== gB.jobName) return gA.jobName.localeCompare(gB.jobName);
      return (gB.level || 0) - (gA.level || 0);
  });

  const result: TodoSection[] = [
    { key: 'other', items: sections.other },
    { key: 'buy', items: sections.buy },
    { key: 'gather', items: sections.gather },
    { key: 'craft', items: sections.craft }
  ];

  result.forEach(s => {
    const order = todoOrder[s.key];
    if (order && order.length > 0) {
       s.items.sort((a, b) => {
           const idxA = order.indexOf(a.id);
           const idxB = order.indexOf(b.id);
           if (idxA === -1 && idxB === -1) return 0;
           if (idxA === -1) return 1;
           if (idxB === -1) return -1;
           return idxA - idxB;
       });
    }
  });

  return result.filter(s => s.items.length > 0);
});

// --- Composable Function ---
export function useWorkbench() {
  const { activeWorkbenchNote } = useNotes();
  const { locale } = useI18n();

  /**
   * 初始化備料台狀況
   */
  const initialize = async (force: boolean = false) => {
    if (!activeWorkbenchNote.value) return;
    
    const currentDC = selectedDC.value;
    const currentLocale = locale.value;
    
    const isNewNote = activeWorkbenchNote.value.id !== lastNoteId.value;
    const isNewDC = currentDC !== lastDC.value;
    const isNewLocale = currentLocale !== lastLocale.value;

    // 如果都不變，且已有資料，則跳過初始化 (除非是強制的 reset)
    if (!force && !isNewNote && !isNewDC && !isNewLocale && Object.keys(workbenchItems.value).length > 0) {
        return;
    }

    isLoading.value = true;
    try {
      await Promise.all([
        ensureDictionaryLoaded(),
        ensureGatheringDataLoaded(),
        ensureVendorDataLoaded()
      ]);

      if (isNewNote || force) {
          // 情況 A：切換新筆記或強制重設 -> 全量重設決策與緩存
          if (force) console.log(`[Workbench] Forced reset for note: ${activeWorkbenchNote.value.id}`);
          else console.log(`[Workbench] Initializing new note: ${activeWorkbenchNote.value.id}`);
          
          Object.keys(decisions).forEach(k => delete decisions[k]);
          Object.keys(todoChecked).forEach(k => delete todoChecked[k]);
          Object.keys(todoOrder).forEach(k => delete todoOrder[k]);
          workbenchItems.value = {};
      } else if (isNewDC) {
          // 情況 B：同一份筆記但大區變更 -> 只重設價格標記與數值，保留決策
          console.log(`[Workbench] DC changed (${lastDC.value} -> ${currentDC}), refreshing prices.`);
          Object.values(workbenchItems.value).forEach(item => {
              item.priceFetched = false;
              item.marketPrice = null;
              item.listings = [];
          });
      } else if (isNewLocale) {
          // 情況 C：語言變更 -> 清除辭典語言設定並重設物品名稱快取，保留決策
          console.log(`[Workbench] Locale changed (${lastLocale.value} -> ${currentLocale}), refreshing item names.`);
          setDictionaryLanguage(currentLocale);
          workbenchItems.value = {};
      }

      lastNoteId.value = activeWorkbenchNote.value.id;
      lastDC.value = currentDC;
      lastLocale.value = currentLocale;

      // 2. 獲取初始項目資料
      const rootIds = activeWorkbenchNote.value.items.map(i => i.id);
      await refreshItemsData(rootIds);

      // 3. 初始分配根節點決策 (僅在切換新筆記或是強制重設時需要在此執行)
      if (isNewNote || force) {
          activeWorkbenchNote.value.items.forEach(item => {
            initSingleItemDecision(item.id, item.quantity, true);
          });
      }

      // 4. 初始化展開項目的決策 (會觸發 activeItemIds 變化)
      activeItemIds.value.forEach(id => {
          const isRoot = activeWorkbenchNote.value?.items.some(ri => ri.id === id) || false;
          initSingleItemDecision(id, totalDemands.value[id] || 0, isRoot);
      });

      await refreshItemsData(activeItemIds.value);
      
      // 5. 發起價格抓取 (fetchPrices 內部已有版本校驗)
      await fetchPrices(activeItemIds.value);
    } catch (err) {
      console.error('[Workbench] Initialization failed:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 監聽決策變化，重設代辦清單勾選狀態
   */
  watch(decisions, () => {
    // 僅在有真正內容時才清除，避免初始化時誤觸
    if (Object.keys(todoChecked).length > 0) {
        Object.keys(todoChecked).forEach(k => delete todoChecked[k]);
    }
  }, { deep: true });

  /**
   * 當新材料被展開時，確保其資料、價格以及決策物件被初始化
   */
  watch(activeItemIds, async (newIds) => {
    if (isLoading.value) return; 
    
    const missingDataIds = newIds.filter(id => !workbenchItems.value[id]);
    if (missingDataIds.length > 0) {
      await refreshItemsData(missingDataIds);
    }

    newIds.forEach(id => {
      const isRoot = activeWorkbenchNote.value?.items.some(ri => ri.id === id) || false;
      initSingleItemDecision(id, totalDemands.value[id] || 0, isRoot);
    });
    
    const missingPriceIds = newIds.filter(id => !workbenchItems.value[id]?.priceFetched);
    if (missingPriceIds.length > 0) {
      await fetchPrices(missingPriceIds);
    }
  }, { immediate: true, deep: true });

  /**
   * 監聽總需求變化，動態更新模擬購買成本
   */
  watch(totalDemands, (newDemands) => {
    Object.keys(newDemands).forEach(idStr => {
      const id = Number(idStr);
      const item = workbenchItems.value[id];
      const newTotal = newDemands[id] || 0;

      // 1. 動態更新市場價格與獲取預估
      if (item && item.listings && item.listings.length > 0) {
        item.marketPrice = calculateSimulatedPrice(
          item.listings,
          newTotal,
          item.marketPrice
        );
      }

      // 2. 智慧補位邏輯：如果使用者將此材料全量投入單一來源，則自動跟隨需求變動
      const d = decisions[idStr];
      if (d) {
        const categories: (keyof ItemDecision)[] = ['buy', 'craft', 'gather', 'other'];
        const activeCategories = categories.filter(cat => d[cat] > 0);
        
        // 只有在原先恰好只有一個來源大於 0 的情況下才自動補位
        if (activeCategories.length === 1) {
          const activeCat = activeCategories[0];
          if (d[activeCat] !== newTotal) {
             d[activeCat] = newTotal;
          }
        } else if (activeCategories.length === 0 && newTotal > 0) {
           // 特殊情況：如果原本是 0（可能是剛出現的新項目），則套用預設邏輯
           const isRoot = activeWorkbenchNote.value?.items.some(ri => ri.id === id) || false;
           initSingleItemDecision(id, newTotal, isRoot);
        }
      }
    });
  }, { deep: true });

  const hasMismatch = computed(() => {
    return activeItemIds.value.some(id => {
        const needed = totalDemands.value[id] || 0;
        const d = decisions[String(id)];
        if (!d) return needed !== 0;
        const sum = (d.buy || 0) + (d.craft || 0) + (d.gather || 0) + (d.other || 0);
        return Math.abs(needed - sum) > 0.001;
    });
  });

  return {
    workbenchItems, decisions, totalDemands, activeItemIds,
    isLoading, hasMismatch, todoChecked, todoOrder,
    generateTodoSections, initialize
  };
}
