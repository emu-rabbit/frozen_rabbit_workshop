import { ref, computed, watch, reactive } from 'vue';
import { useNotes } from './useNotes';
import { 
  ensureDictionaryLoaded, 
  globalRecipesCache, 
  getDictionaryItem,
  getRawItemData
} from '../services/dictionary';
import type { Recipe } from '../services/dictionary';
import { fetchItemPrices } from '../services/universalis';
import { ensureGatheringDataLoaded, getGatheringInfo } from '../services/gathering';

export interface CraftingInfo {
  job: number;
  jobName: string;
  level: number;
  stars: number;
  yields: number;
  ingredients: { id: number; amount: number }[];
}

export interface WorkbenchItem {
  id: number;
  name: string;
  icon: string;
  canCraft: boolean;
  canGather: boolean;
  marketPrice: number | null;
  priceFetched: boolean;
  crafting: CraftingInfo | null;
  gathering: any | null; // GatheringInfo from gathering.ts
}

export interface ItemDecision {
  buy: number;
  craft: number;
  gather: number;
  other: number;
}

export function useWorkbench() {
  const { activeWorkbenchNote } = useNotes();
  
  const CRYSTAL_IDS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  
  const workbenchItems = ref<Record<number, WorkbenchItem>>({});
  const decisions = reactive<Record<string, ItemDecision>>({});
  const isLoading = ref(false);

  // 職稱映射（可用於 CraftingInfo）
  const CRAFT_JOB_NAMES: Record<number, string> = {
    8: 'jobs.crp', 9: 'jobs.bsm', 10: 'jobs.arm', 11: 'jobs.gsm',
    12: 'jobs.lwr', 13: 'jobs.wvr', 14: 'jobs.alc', 15: 'jobs.cul'
  };

  /**
   * 智慧型初始化單個項目的決策
   */
  const initSingleItemDecision = (id: number, demand: number) => {
    if (decisions[String(id)]) return;
    const itemData = workbenchItems.value[id];
    
    if (CRYSTAL_IDS.has(id)) {
        decisions[String(id)] = { buy: 0, craft: 0, gather: 0, other: demand };
    } else if (itemData?.canCraft) {
        decisions[String(id)] = { buy: 0, craft: demand, gather: 0, other: 0 };
    } else if (itemData?.canGather) {
        decisions[String(id)] = { buy: 0, craft: 0, gather: demand, other: 0 };
    } else {
        decisions[String(id)] = { buy: demand, craft: 0, gather: 0, other: 0 };
    }
  };

  /**
   * 初始化備料台狀況
   */
  const initialize = async () => {
    if (!activeWorkbenchNote.value) return;
    
    isLoading.value = true;
    try {
      // 1. 確保基礎資料載入
      await Promise.all([
        ensureDictionaryLoaded(),
        ensureGatheringDataLoaded()
      ]);

      // 1.5 強力清除決策與物品緩存 (確保完全重建樹狀結構)
      Object.keys(decisions).forEach(k => delete decisions[k]);
      workbenchItems.value = {};

      // 2. 獲取初始項目資料
      const rootIds = activeWorkbenchNote.value.items.map(i => i.id);
      await refreshItemsData(rootIds);

      // 3. 初始分配根節點決策
      activeWorkbenchNote.value.items.forEach(item => {
        initSingleItemDecision(item.id, item.quantity);
      });

      // 4. 針對目前已展開的所有項目（如果有）進行補完初始化
      // 這是修復「重置後清空但 activeItemIds 未變動導致 watch 不觸發」的關鍵
      activeItemIds.value.forEach(id => {
          initSingleItemDecision(id, totalDemands.value[id] || 0);
      });

      await fetchPrices(activeItemIds.value);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 刷新物品詳細資料 (Recipe, Gathering)
   */
  const refreshItemsData = async (ids: number[]) => {
    for (const id of ids) {
      if (workbenchItems.value[id]) continue;

      const dictItem = getDictionaryItem(id);
      const recipe = globalRecipesCache.value?.find(r => r.result === id);
      const gather = getGatheringInfo(id);

      const crafting: CraftingInfo | null = recipe ? {
        job: recipe.job,
        jobName: CRAFT_JOB_NAMES[recipe.job] || '製作',
        level: recipe.lvl,
        stars: recipe.stars || 0,
        yields: recipe.yields || 1,
        // ingredients 是陣列格式： [{id, amount, quality}]
        ingredients: (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ing: any) => ({
          id: ing.id,
          amount: ing.amount
        }))
      } : null;

      // 備料台可以出現任何物品（含水晶、礦石）
      // 優先從「可製作物品快取」取得，若找不到再從全量資料取得
      // 注意：getDictionaryItem 只含可製作成品；getRawItemData 查詢全量 items.json
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
        gathering: gather
      };
    }
  };

  /**
   * 批次獲取價格
   */
  const fetchPrices = async (ids: number[]) => {
    // 這裡暫不自動判斷 DC/Server，由 universalis.ts 內部處理 (預設 Elemental)
    const prices = await fetchItemPrices(ids);
    ids.forEach(id => {
      const item = workbenchItems.value[id];
      if (item) {
        // Fix: prices is a Map, use .get(id)
        const priceData = prices.get(id);
        item.marketPrice = priceData?.currentAveragePrice ?? null;
        item.priceFetched = true;
      }
    });
  };

  /**
   * 計算目前所有產生的需求 (BFS)
   * 回傳：Record<itemId, totalDemand>
   */
  const totalDemands = computed(() => {
    const demands: Record<number, number> = {};
    if (!activeWorkbenchNote.value) return demands;

    // 1. 從 Note 基礎需求開始
    activeWorkbenchNote.value.items.forEach(item => {
      demands[item.id] = (demands[item.id] || 0) + item.quantity;
    });

    // 2. BFS 遍歷決策導致的連鎖需求
    const queue = activeWorkbenchNote.value.items.map(i => i.id);
    const processed = new Set<number>();
    
    let head = 0;
    while (head < queue.length) {
      const currentId = queue[head++];
      if (processed.has(currentId)) continue;
      processed.add(currentId);

      // 統一使用字串鍵值存取 decisions 以確保 Vue 響應式追蹤穩定
      const decision = decisions[String(currentId)];
      if (!decision || decision.craft <= 0) continue;

      // 使用同步快取的 Recipe 資料進行展開，避免非同步載入導致的死結
      const recipe = globalRecipesCache.value?.find(r => r.result === currentId);
      if (!recipe) continue;

      // 每個成品製作次數 = 需求數 / 單次產量 (無條件進位)
      const yields = recipe.yields || 1;
      const craftCount = Math.ceil(decision.craft / yields);

      // ingredients 是陣列格式： [{id, amount, quality}]
      const ings: {id: number; amount: number}[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
      ings.forEach(ing => {
        const ingId = ing.id;
        const requiredAmt = ing.amount * craftCount;
        demands[ingId] = (demands[ingId] || 0) + requiredAmt;
        
        // 加入隊列繼續展開
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

    // 從 Note 原始項目開始保持順序
    const rootIds = activeWorkbenchNote.value?.items.map(i => i.id) || [];
    const queue = [...rootIds];

    let head = 0;
    while (head < queue.length) {
      const id = queue[head++];
      if (seen.has(id)) continue;
      
      if (demands[id] > 0) {
        seen.add(id);
        ids.push(id);
        
        // 如果這個項目有製作決策，且我們有配方快取，則將其材料加入隊列
        const decision = decisions[String(id)];
        if (decision && decision.craft > 0) {
          const recipe = globalRecipesCache.value?.find(r => r.result === id);
          if (recipe) {
            // ingredients 是陣列格式： [{id, amount, quality}]
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

        // 1. 成品項目最優先
        if (isRootA !== isRootB) return isRootA ? -1 : 1;
        // 2. 碎晶/水晶最後面
        if (isCrystalA !== isCrystalB) return isCrystalA ? 1 : -1;
        // 3. 可製作優先於不可製作 (材料部分)
        if (itemA?.canCraft !== itemB?.canCraft) return itemA?.canCraft ? -1 : 1;
        // 4. 可採集優先於不可採集
        if (itemA?.canGather !== itemB?.canGather) return itemA?.canGather ? -1 : 1;
        
        return 0; // 保持原有 BFS 相對序
    });
  });

  /**
   * 當新材料被展開時，確保其資料、價格以及決策物件被初始化
   */
  watch(activeItemIds, async (newIds) => {
    // 1. 初始化遺失的決策物件
    newIds.forEach(id => {
      initSingleItemDecision(id, totalDemands.value[id] || 0);
    });

    // 2. 獲取遺失的物品詳細資料
    const missingDataIds = newIds.filter(id => !workbenchItems.value[id]);
    if (missingDataIds.length > 0) {
      await refreshItemsData(missingDataIds);
    }
    
    // 3. 獲取遺失的價格資料
    const missingPriceIds = newIds.filter(id => !workbenchItems.value[id]?.priceFetched);
    if (missingPriceIds.length > 0) {
      await fetchPrices(missingPriceIds);
    }
  }, { immediate: true, deep: true });

  return {
    workbenchItems,
    decisions,
    totalDemands,
    activeItemIds,
    isLoading,
    initialize
  };
}
