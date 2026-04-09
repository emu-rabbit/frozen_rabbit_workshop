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

let isLoading = false;
let loadPromise: Promise<void> | null = null;

const GATHER_JOB_NAMES: Record<number, string> = {
  0: '採礦工',
  1: '園藝工',
  2: '釣魚人',
  3: '釣魚人',
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
      console.log('[Gathering] Data loaded successfully.');
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
  if (!gatheringItemsCache || !nodesCache) return null;

  const nodeIds = gatheringItemsCache[itemId];
  if (!nodeIds || nodeIds.length === 0) return null;

  // 優先選擇等級最高且資訊最完整的節點，或者簡單取第一個
  const nodeId = nodeIds[0];
  const node = nodesCache[nodeId];

  if (!node) return null;

  // 映射地名
  const zoneName = getPlaceName(node.zoneid, node.mapName);

  return {
    type: node.type,
    jobName: GATHER_JOB_NAMES[node.type] || '採集',
    level: node.lvl || 1,
    stars: node.stars || 0,
    zoneName: zoneName,
    x: node.x,
    y: node.y,
    isLimited: !!node.limited || (node.spawns && node.spawns.length > 0),
    spawns: node.spawns || [],
    duration: node.duration || 0,
  };
}
