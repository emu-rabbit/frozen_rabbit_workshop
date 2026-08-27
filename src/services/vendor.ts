import { getPlaceName, localizeData } from './dictionary';
import { sourceData } from './gameData';
export interface VendorInfo {
  price: number;
  npcId: number;
  npcName: string;
  zoneId: number;
  zoneName: string;
  coords?: { x: number; y: number };
}


function resolveVendorInfo(vendor: VendorInfo): VendorInfo {
  const resolved = { ...vendor };
  
  // 動態填入語言名稱
  resolved.npcName = localizeData(sourceData.value?.npcs[resolved.npcId], 'NPC #' + resolved.npcId);
  
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
  return mergeVendorsWithSameDisplay((sourceData.value?.vendors[itemId] || []).map(v => resolveVendorInfo({ ...v, npcName: '', zoneName: '' })));
}

/**
 * 獲取物品最划算的 NPC 販售資訊
 */
export function getBestVendor(itemId: number): VendorInfo | null {
  return getVendors(itemId)[0] || null;
}
