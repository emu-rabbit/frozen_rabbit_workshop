import { ensurePlacesLoaded, getPlaceName, getCurrentLanguage } from './dictionary';

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
  await ensurePlacesLoaded();

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

        const npcIds = Array.isArray(shop.npcs) ? shop.npcs : (shop.npcId ? [shop.npcId] : []);
        if (npcIds.length === 0) return;
        
        shop.trades.forEach((trade: any) => {
          const gilCurrency = trade.currencies?.find((c: any) => c.id === 1);
          if (!gilCurrency) return;

          const price = gilCurrency.amount;

          trade.items?.forEach((item: any) => {
            const itemId = item.id;
            if (!itemId) return;

            if (!itemToVendorsMap[itemId]) itemToVendorsMap[itemId] = [];
            
            npcIds.forEach((npcId: number | string) => {
              const npcData = npcsCache![npcId];
              const zoneId = npcData?.position?.zoneid;
              const coords = npcData?.position ? { x: npcData.position.x, y: npcData.position.y } : undefined;
              const normalizedNpcId = Number(npcId);
              const alreadyIndexed = itemToVendorsMap[itemId].some(vendor =>
                vendor.npcId === normalizedNpcId && vendor.price === price
              );

              if (alreadyIndexed) return;

              itemToVendorsMap[itemId].push({
                price,
                npcId: normalizedNpcId,
                npcName: '', // Will be resolved dynamically
                zoneId: zoneId || 0,
                zoneName: '', // Will be resolved dynamically
                coords
              });
            });
          });
        });
      });

      // 針對每個 itemId，按價格升序排序
      Object.keys(itemToVendorsMap).forEach(id => {
        itemToVendorsMap[Number(id)].sort((a, b) => a.price - b.price || a.npcId - b.npcId);
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
 * 解析 NPC 販售資訊的動態語系欄位
 */
function resolveVendorInfo(vendor: VendorInfo): VendorInfo {
  const resolved = { ...vendor };
  
  // 動態填入語言名稱
  resolved.npcName = getNpcName(resolved.npcId);
  
  // Teamcraft NPC position.zoneid is already the display place id. Do not
  // reinterpret it through maps.json because overlapping ids can point elsewhere.
  resolved.zoneName = resolved.zoneId ? getPlaceName(resolved.zoneId) : 'Unknown Zone';
  
  return resolved;
}

function getVendorDisplayKey(vendor: VendorInfo): string {
  const coordsKey = vendor.coords
    ? `${vendor.coords.x.toFixed(1)},${vendor.coords.y.toFixed(1)}`
    : '';

  return [
    vendor.npcName,
    vendor.price,
    vendor.zoneName,
    coordsKey
  ].join('|');
}

function mergeVendorsWithSameDisplay(vendors: VendorInfo[]): VendorInfo[] {
  const seen = new Set<string>();

  return vendors.filter(vendor => {
    const key = getVendorDisplayKey(vendor);
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

/**
 * 獲取物品所有 NPC 販售資訊，已按價格升序排序
 */
export function getVendors(itemId: number): VendorInfo[] {
  return mergeVendorsWithSameDisplay((itemToVendorsMap[itemId] || []).map(resolveVendorInfo));
}

/**
 * 獲取物品最划算的 NPC 販售資訊
 */
export function getBestVendor(itemId: number): VendorInfo | null {
  return getVendors(itemId)[0] || null;
}
