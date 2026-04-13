import { ensurePlacesLoaded, getPlaceName } from './dictionary';

const BASE_URL_STAGING = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/staging/libs/data/src/lib/json';
const SHOPS_URL = `${BASE_URL_STAGING}/shops.json`;
const NPCS_URL = `${BASE_URL_STAGING}/npcs.json`;
const TW_NPCS_URL = `${BASE_URL_STAGING}/tw/tw-npcs.json`;

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

        // 獲取該商店對應的 NPC 列表
        const npcIds = Array.isArray(shop.npcs) ? shop.npcs : (shop.npcId ? [shop.npcId] : []);
        if (npcIds.length === 0) return;

        // 一個商店可能有多個 NPC，我們先抓第一個有位置資訊的或是第一個
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
        
        // 解析 NPC 名稱
        const twName = twNpcsCache![bestNpcId]?.tw;
        const enName = bestNpcData?.en;
        const npcName = twName || enName || `NPC #${bestNpcId}`;
        const zoneName = zoneId ? getPlaceName(zoneId) : 'Unknown Zone';

        shop.trades.forEach((trade: any) => {
          // 尋找 Gil (ID: 1) 貨幣
          const gilCurrency = trade.currencies?.find((c: any) => c.id === 1);
          if (!gilCurrency) return;

          const price = gilCurrency.amount;

          // 這個交易提供的所有物品
          trade.items?.forEach((item: any) => {
            const itemId = item.id;
            if (!itemId) return;

            if (!itemToVendorsMap[itemId]) itemToVendorsMap[itemId] = [];
            
            itemToVendorsMap[itemId].push({
              price,
              npcId: Number(bestNpcId),
              npcName,
              zoneId: zoneId || 0,
              zoneName,
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
 * 獲取物品最划算的 NPC 販售資訊
 */
export function getBestVendor(itemId: number): VendorInfo | null {
  const vendors = itemToVendorsMap[itemId];
  if (!vendors || vendors.length === 0) return null;
  // 由於已排序，第一個即為最低價
  return vendors[0];
}
