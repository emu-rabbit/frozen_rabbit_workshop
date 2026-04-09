import { ensurePlacesLoaded, getPlaceName } from './dictionary';

const BASE_URL_STAGING = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/staging/libs/data/src/lib/json';
const GATHERING_ITEMS_URL = `${BASE_URL_STAGING}/gathering-items.json`;
const NODES_URL = `${BASE_URL_STAGING}/nodes.json`;

export interface GatheringInfo {
  type: number;        // 0=採礦工, 1=園藝工, 2=釣魚人
  jobName: string;
  level: number;
  stars: number;
  zoneName?: string;
  x?: number;
  y?: number;
  isLimited: boolean;  // 是否為定時節點
  spawns: number[];    // 艾俄澤亞出沒時間 (0-23)
  duration: number;    // 持續時間 (艾俄澤亞分鐘)
}

let gatheringItemsCache: Record<number, number[]> | null = null; // itemId -> [nodeId1, nodeId2]
let nodesCache: Record<number, any> | null = null; // nodeId -> details
/** 
 * 全量反向索引: itemId -> nodeId[] 
 * 透過遍歷 nodes.json 建立，用於涵蓋碎晶、礦石等基礎素材
 */
let fullItemToNodesMap: Record<number, number[]> = {};
/** Item-specific gathering data (level, stars) */
let itemToGatheringData: Record<number, { level: number, stars: number }> = {};

let isLoading = false;
let loadPromise: Promise<void> | null = null;

const GATHER_JOB_NAMES: Record<number, string> = {
  0: 'jobs.min',
  1: 'jobs.btn',
  2: 'jobs.fsh',
  3: 'jobs.fsh',
};

/**
 * 確保採集資料已載入
 */
export async function ensureGatheringDataLoaded(): Promise<void> {
  if (gatheringItemsCache !== null && nodesCache !== null) return;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      console.log('[Gathering] Loading gathering data...');
      const [itemsRes, nodesRes] = await Promise.all([
        fetch(GATHERING_ITEMS_URL),
        fetch(NODES_URL),
        ensurePlacesLoaded(), // 同步載入地名
      ]);

      if (!itemsRes.ok || !nodesRes.ok) {
        throw new Error('Failed to fetch gathering data files');
      }

      gatheringItemsCache = await itemsRes.json();
      nodesCache = await nodesRes.json();

      // 建立全量反向索引 與 項目特定資料
      fullItemToNodesMap = {};
      itemToGatheringData = {};
      
      Object.entries(gatheringItemsCache || {}).forEach(([_, entry]: [any, any]) => {
          if (entry.itemId) {
              itemToGatheringData[entry.itemId] = {
                  level: entry.level || 0,
                  stars: entry.stars || 0
              };
          }
      });

      Object.entries(nodesCache || {}).forEach(([nodeIdStr, node]) => {
          const nodeId = parseInt(nodeIdStr, 10);
          const itemIds: number[] = node.items || [];
          const hiddenIds: number[] = node.hiddenItems || [];
          
          [...itemIds, ...hiddenIds].forEach(itemId => {
              if (!fullItemToNodesMap[itemId]) fullItemToNodesMap[itemId] = [];
              if (!fullItemToNodesMap[itemId].includes(nodeId)) {
                  fullItemToNodesMap[itemId].push(nodeId);
              }
          });
      });

      console.log('[Gathering] Data loaded and index built.');
    } catch (err) {
      console.error('[Gathering] Failed to load gathering data:', err);
      gatheringItemsCache = {};
      nodesCache = {};
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * 根據物品 ID 取得採集資訊
 */
export function getGatheringInfo(itemId: number, locale: string = 'tw'): GatheringInfo | null {
  if (!nodesCache) return null;

  // 1. 優先從全量索引中找 nodeIds (涵蓋範圍最廣)
  // 2. 若無，則嘗試從 gatheringItemsCache (Teamcraft 預設映射) 中找
  let nodeIds = fullItemToNodesMap[itemId];
  if (!nodeIds || nodeIds.length === 0) {
      nodeIds = (gatheringItemsCache || {})[itemId];
  }
  
  if (!nodeIds || nodeIds.length === 0) return null;

  // 排序節點：優先選擇有坐標的、等級最接近的 (這裡簡單取第一個，或篩選合法節點)
  let nodeId = nodeIds[0];
  let node = nodesCache[nodeId];

  if (!node) return null;

  // 映射地名
  const zoneName = getPlaceName(node.zoneid, node.mapName);
  
  // 優先使用項目特定的 level/stars，若無則從節點資料中提取
  const itemData = itemToGatheringData[itemId];
  const level = itemData?.level || node.level || 1;
  const stars = itemData?.stars || node.stars || 0;

  return {
    type: node.type,
    jobName: GATHER_JOB_NAMES[node.type] || '採集',
    level,
    stars,
    zoneName: zoneName,
    x: node.x,
    y: node.y,
    isLimited: !!node.limited || (node.spawns && node.spawns.length > 0),
    spawns: node.spawns || [],
    duration: node.duration || 0,
  };
}
