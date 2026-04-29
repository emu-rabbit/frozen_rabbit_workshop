import { ensurePlacesLoaded, getPlaceName, getCurrentLanguage, getMapData, ensureMapsLoaded } from './dictionary';

const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;
const SHOPS_URL = `${BASE_URL}/shops.json`;
const NPCS_URL = `${BASE_URL}/npcs.json`;
const TW_NPCS_URL = `${BASE_URL}/tw/tw-npcs.json`;

export interface VendorInfo {
  price: number;
  npcId: number;
  npcName: string;
  zoneId: number;
  zoneName: string;
  coords?: { x: number; y: number };
}

let itemToVendorsMap: Record<number, VendorInfo[]> = {};
let npcsCache: Record<string, any> | null = null;
let twNpcsCache: Record<string, any> | null = null;
let shopsCache: any[] | null = null;

let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * 確保 NPC 販售資料已載入
 */
export async function ensureVendorDataLoaded(): Promise<void> {
  // 必須確保子依賴地名與地圖快取隨時更新（特別是語言切換後）
  await Promise.all([
    ensurePlacesLoaded(),
    ensureMapsLoaded()
  ]);

  if (shopsCache !== null && npcsCache !== null && twNpcsCache !== null) return;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      console.log('[Vendor] Loading vendor data...');
      const [shopsRes, npcsRes, twNpcsRes] = await Promise.all([
        fetch(SHOPS_URL),
        fetch(NPCS_URL),
        fetch(TW_NPCS_URL),
        ensurePlacesLoaded(), // 需要地名快取
        ensureMapsLoaded(),   // 需要地圖快取，用於 Map ID 轉 PlaceName ID
      ]);

      if (!shopsRes.ok || !npcsRes.ok || !twNpcsRes.ok) {
        throw new Error('Failed to fetch vendor, NPC, or TW NPC data files');
      }

      shopsCache = await shopsRes.json();
      npcsCache = await npcsRes.json();
      twNpcsCache = await twNpcsRes.json();

      // 建立索引：itemId -> VendorInfo[]
      itemToVendorsMap = {};

      if (!Array.isArray(shopsCache)) {
        console.warn('[Vendor] shops.json is not an array, skipping indexing');
        return;
      }

      shopsCache.forEach((shop: any) => {
        if (!shop.trades || !Array.isArray(shop.trades)) return;

        const npcIds = Array.isArray(shop.npcs) ? shop.npcs : (shop.npcId ? [shop.npcId] : []);
        if (npcIds.length === 0) return;

        let bestNpcId = npcIds[0];
        let bestNpcData = npcsCache![bestNpcId];

        for (const nid of npcIds) {
          const ndata = npcsCache![nid];
          if (ndata?.position) {
            bestNpcId = nid;
            bestNpcData = ndata;
            break;
          }
        }

        const zoneId = bestNpcData?.position?.zoneid;
        const coords = bestNpcData?.position ? { x: bestNpcData.position.x, y: bestNpcData.position.y } : undefined;
        
        shop.trades.forEach((trade: any) => {
          const gilCurrency = trade.currencies?.find((c: any) => c.id === 1);
          if (!gilCurrency) return;

          const price = gilCurrency.amount;

          trade.items?.forEach((item: any) => {
            const itemId = item.id;
            if (!itemId) return;

            if (!itemToVendorsMap[itemId]) itemToVendorsMap[itemId] = [];
            
            itemToVendorsMap[itemId].push({
              price,
              npcId: Number(bestNpcId),
              npcName: '', // Will be resolved dynamically
              zoneId: zoneId || 0,
              zoneName: '', // Will be resolved dynamically
              coords
            });
          });
        });
      });

      // 針對每個 itemId，按價格升序排序
      Object.keys(itemToVendorsMap).forEach(id => {
        itemToVendorsMap[Number(id)].sort((a, b) => a.price - b.price);
      });

      console.log(`[Vendor] Data loaded. Indexed ${Object.keys(itemToVendorsMap).length} items.`);
    } catch (err) {
      console.error('[Vendor] Failed to load vendor data:', err);
      shopsCache = [];
      npcsCache = {};
      twNpcsCache = {};
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * 動態解析 NPC 名稱
 */
function getNpcName(npcId: number): string {
  const lang = getCurrentLanguage();
  if (lang === 'tw') {
    return twNpcsCache?.[npcId]?.tw || npcsCache?.[npcId]?.en || `NPC #${npcId}`;
  }
  
  const entry = npcsCache?.[npcId];
  if (!entry) return `NPC #${npcId}`;
  
  const l = lang === 'cn' || lang === 'zh' ? 'zh' : lang; // We don't have zh in npcs.json? snippet didn't show it
  // Actually, standard npcs.json usually has en, ja, fr, de.
  return entry[l] || entry['en'] || `NPC #${npcId}`;
}

/**
 * 獲取物品最划算的 NPC 販售資訊
 */
export function getBestVendor(itemId: number): VendorInfo | null {
  const vendors = itemToVendorsMap[itemId];
  if (!vendors || vendors.length === 0) return null;
  const best = { ...vendors[0] };
  
  // 動態填入語言名稱
  best.npcName = getNpcName(best.npcId);
  
  // npc 的 zoneId 其實是 Map ID，需要先過一次 maps.json 轉為 PlaceName ID
  const mapData = getMapData(best.zoneId);
  const effectivePlaceId = mapData?.placename_id || best.zoneId;
  best.zoneName = effectivePlaceId ? getPlaceName(effectivePlaceId) : 'Unknown Zone';
  
  return best;
}
