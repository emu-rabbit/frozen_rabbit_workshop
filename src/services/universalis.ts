/**
 * universalis.ts
 * 
 * Universalis Market Board API integration.
 * - Session cache + 5-min TTL per item per datacenter
 * - Batch fetch (up to 100 items per request)
 * - Rate limit: 25 req/s, 8 concurrent — a single batch call is well within limits
 */

import { ref, readonly } from 'vue';

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIVERSALIS_BASE = 'https://universalis.app/api/v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** DEBUG: 暫時用來模擬 Universalis API 掛掉時的情境。設置為 true 即可觸發假性 CORS 網路阻擋錯誤。 */
export const DEBUG_SIMULATE_API_ERROR = false;

/** All available data centers fetched from Universalis. */
export interface DataCenter {
  name: string;
  region: string;
  worlds: number[];
}

/** Price data for a single item. */
export interface ItemPrice {
  itemId: number;
  minPriceNQ: number | null;
  minPriceHQ: number | null;
  currentAveragePrice: number | null;
  currentAveragePriceNQ: number | null;
  currentAveragePriceHQ: number | null;
  listings: MarketListing[];
  lastUploadTime: number; // Unix ms
  worldName?: string;     // present for single-world queries
  dcName?: string;
}

export interface MarketListing {
  pricePerUnit: number;
  quantity: number;
  hq: boolean;
  worldName?: string;
  worldID?: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: ItemPrice;
  expiresAt: number; // Date.now() + TTL
}

/** Session-level price cache: `{dc}:{itemId}` → CacheEntry */
const priceCache = new Map<string, CacheEntry>();

/** Currently active requests: `{dc}:{itemId}` → Promise<ItemPrice> */
const inflightRequests = new Map<string, Promise<ItemPrice>>();

function cacheKey(dc: string, itemId: number) {
  return `${dc}:${itemId}`;
}

function getCached(dc: string, itemId: number): ItemPrice | null {
  const entry = priceCache.get(cacheKey(dc, itemId));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    priceCache.delete(cacheKey(dc, itemId));
    return null;
  }
  return entry.data;
}

function setCache(dc: string, price: ItemPrice) {
  priceCache.set(cacheKey(dc, price.itemId), {
    data: price,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ─── State ────────────────────────────────────────────────────────────────────
import { useSettings } from '../composables/useSettings'
const { marketDC } = useSettings()

const _dataCenters = ref<DataCenter[]>([]);
const _isFetchingPrices = ref(false);
const _isPriceError = ref(false);
const _isRetrying = ref(false);

export const dataCenters = readonly(_dataCenters);
export const selectedDC = readonly(marketDC);
export const isFetchingPrices = readonly(_isFetchingPrices);
export const isPriceError = readonly(_isPriceError);
export const isRetrying = readonly(_isRetrying);

const activeAbortControllers = new Set<AbortController>();

export function abortPriceFetch() {
  for (const ac of activeAbortControllers) {
    ac.abort('UserCancelled');
  }
  activeAbortControllers.clear();
}

// ─── Data Center Management ───────────────────────────────────────────────────

const FALLBACK_DATA_CENTERS: DataCenter[] = [
  { "name": "Elemental", "region": "Japan", "worlds": [45, 49, 50, 58, 68, 72, 90, 94] },
  { "name": "Gaia", "region": "Japan", "worlds": [43, 46, 51, 59, 69, 76, 92, 98] },
  { "name": "Mana", "region": "Japan", "worlds": [23, 28, 44, 47, 48, 61, 70, 96] },
  { "name": "Aether", "region": "North-America", "worlds": [40, 54, 57, 63, 65, 73, 79, 99] },
  { "name": "Primal", "region": "North-America", "worlds": [35, 53, 55, 64, 77, 78, 93, 95] },
  { "name": "Chaos", "region": "Europe", "worlds": [39, 71, 80, 83, 85, 97, 400, 401] },
  { "name": "Light", "region": "Europe", "worlds": [33, 36, 42, 56, 66, 67, 402, 403] },
  { "name": "Crystal", "region": "North-America", "worlds": [34, 37, 41, 62, 74, 75, 81, 91] },
  { "name": "Materia", "region": "Oceania", "worlds": [21, 22, 86, 87, 88] },
  { "name": "Meteor", "region": "Japan", "worlds": [24, 29, 30, 31, 32, 52, 60, 82] },
  { "name": "Dynamis", "region": "North-America", "worlds": [404, 405, 406, 407, 408, 409, 410, 411] },
  { "name": "NA Cloud DC (Beta)", "region": "NA-Cloud-DC", "worlds": [3000, 3001] },
  { "name": "陆行鸟", "region": "中国", "worlds": [1167, 1081, 1042, 1044, 1060, 1173, 1174, 1175] },
  { "name": "莫古力", "region": "中国", "worlds": [1172, 1076, 1171, 1170, 1113, 1121, 1166, 1176] },
  { "name": "猫小胖", "region": "中国", "worlds": [1043, 1169, 1106, 1045, 1177, 1178, 1179] },
  { "name": "豆豆柴", "region": "中国", "worlds": [1192, 1183, 1180, 1186, 1201] },
  { "name": "한국", "region": "한국", "worlds": [2075, 2076, 2077, 2078, 2080] },
  { "name": "陸行鳥", "region": "繁中服", "worlds": [4028, 4029, 4030, 4031, 4032, 4033, 4034, 4035] }
];

let _dcFetchPromise: Promise<DataCenter[]> | null = null;

/** Fetches and caches the full list of Universalis data centers (once per session). */
export async function ensureDataCentersLoaded(): Promise<DataCenter[]> {
  // Always start with fallback data if empty, ensuring UI is never empty
  if (_dataCenters.value.length === 0) {
    _dataCenters.value = [...FALLBACK_DATA_CENTERS];
  }

  if (_dcFetchPromise) return _dcFetchPromise;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  _dcFetchPromise = fetch(`${UNIVERSALIS_BASE}/data-centers`, { signal: controller.signal })
    .then(r => {
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error('Failed to fetch data centers');
      return r.json() as Promise<DataCenter[]>;
    })
    .then(list => {
      // Update with fresh data from API
      _dataCenters.value = list;
      return list;
    })
    .catch(err => {
      clearTimeout(timeoutId);
      console.warn('[Universalis] Failed to refresh data centers, using fallbacks:', err.message);
      // Return existing (fallback) data instead of throwing, making the error silent to UI
      return _dataCenters.value;
    })
    .finally(() => {
      _dcFetchPromise = null;
    });

  return _dcFetchPromise;
}

/** Persists the selected data center to settings. */
export function setSelectedDC(dc: string) {
  marketDC.value = dc;
  // Invalidate the existing cache when DC changes
  priceCache.clear();
  inflightRequests.clear();
}

// ─── Price Fetching ───────────────────────────────────────────────────────────

function parseItemPrice(itemId: number, raw: any): ItemPrice {
  const safeData = raw || {};
  const listings: MarketListing[] = (safeData.listings || []).map((l: any) => ({
    pricePerUnit: l.pricePerUnit ?? 0,
    quantity: l.quantity ?? 0,
    hq: !!l.hq,
    worldName: l.worldName,
    worldID: l.worldID
  })).sort((a: MarketListing, b: MarketListing) => a.pricePerUnit - b.pricePerUnit);

  return {
    itemId,
    minPriceNQ: (safeData.minPriceNQ && safeData.minPriceNQ > 0) ? safeData.minPriceNQ : null,
    minPriceHQ: (safeData.minPriceHQ && safeData.minPriceHQ > 0) ? safeData.minPriceHQ : null,
    currentAveragePrice: (safeData.currentAveragePrice && safeData.currentAveragePrice > 0) ? safeData.currentAveragePrice : null,
    currentAveragePriceNQ: (safeData.currentAveragePriceNQ && safeData.currentAveragePriceNQ > 0) ? safeData.currentAveragePriceNQ : null,
    currentAveragePriceHQ: (safeData.currentAveragePriceHQ && safeData.currentAveragePriceHQ > 0) ? safeData.currentAveragePriceHQ : null,
    listings,
    lastUploadTime: safeData.lastUploadTime ?? 0,
    worldName: safeData.worldName,
    dcName: safeData.dcName,
  };
}

/**
 * Fetches prices for the given item IDs from Universalis.
 * - Returns cached results for items still within TTL.
 * - Deduplicates concurrent requests for the same item.
 * - Batches uncached items (max 100 per request) into one API call.
 */
export async function fetchItemPrices(
  itemIds: number[]
): Promise<Map<number, ItemPrice>> {
  const dc = marketDC.value;
  const result = new Map<number, ItemPrice>();

  // Ensure unique IDs to avoid redundant work
  const uniqueIds = Array.from(new Set(itemIds));
  if (!uniqueIds.length) return result;

  const toFetch: number[] = [];
  const awaitingInflight: { id: number; promise: Promise<ItemPrice> }[] = [];

  for (const id of uniqueIds) {
    const cached = getCached(dc, id);
    if (cached) {
      result.set(id, cached);
      continue;
    }

    const inflight = inflightRequests.get(cacheKey(dc, id));
    if (inflight) {
      awaitingInflight.push({ id, promise: inflight });
      continue;
    }

    toFetch.push(id);
  }


  if (awaitingInflight.length > 0) {
    try {
      const prices = await Promise.all(awaitingInflight.map(a => a.promise));
      awaitingInflight.forEach((a, index) => {
        result.set(a.id, prices[index]);
      });
    } catch (err: any) {
      // Inflight requests were rejected (e.g. by another call being aborted).
      // This is expected during cancellation - treat it as a soft failure and continue.
      // If toFetch is empty, we'll return a partial result below.
      console.warn('[Universalis] Inflight request failed or was cancelled:', err?.message);
      if (!toFetch.length) {
        // All items were inflight and they got cancelled - mark as error and bail out gracefully
        _isPriceError.value = true;
        return result;
      }
    }
  }

  if (!toFetch.length) return result;

  _isFetchingPrices.value = true;
  _isPriceError.value = false;
  _isRetrying.value = false;

  const localAbortController = new AbortController();
  activeAbortControllers.add(localAbortController);

  try {
    const BATCH_SIZE = 100;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);

      // Create deferred promises for this batch to track in inflightRequests
      const resolvers: Record<number, (val: ItemPrice) => void> = {};
      const rejecters: Record<number, (reason: any) => void> = {};

      batch.forEach(id => {
        const promise = new Promise<ItemPrice>((resolve, reject) => {
          resolvers[id] = resolve;
          rejecters[id] = reject;
        });
        inflightRequests.set(cacheKey(dc, id), promise);
      });

      try {
        let attempt = 0;
        const delays = [2000, 4000, 8000];

        while (true) {
          if (localAbortController.signal.aborted) {
            const abortErr = new Error('UserCancelled');
            batch.forEach(id => { try { rejecters[id](abortErr); } catch { } });
            throw abortErr;
          }

          try {
            if (DEBUG_SIMULATE_API_ERROR) {
              throw new TypeError('Failed to fetch (Simulated CORS blocked)');
            }

            const encodedDC = encodeURIComponent(dc);
            const url = `${UNIVERSALIS_BASE}/${encodedDC}/${batch.join(',')}`;

            const timeoutController = new AbortController();
            const timeoutId = setTimeout(() => timeoutController.abort(), 5000); // 5 seconds

            // Link the global abort controller with the timeout controller
            const abortHandler = () => timeoutController.abort('UserCancelled');
            localAbortController.signal.addEventListener('abort', abortHandler);

            let resp: Response;
            try {
              resp = await fetch(url, { signal: timeoutController.signal });
            } finally {
              clearTimeout(timeoutId);
              localAbortController.signal.removeEventListener('abort', abortHandler);
            }

            if (!resp.ok) {
              // 404 is common for non-marketable items (like collectibles); treat as empty result instead of crash
              if (resp.status === 404) {
                console.log(`[Universalis] 404 for item(s) ${batch.join(',')}, treating as unmarketable.`);
                batch.forEach(id => {
                  const emptyPrice = parseItemPrice(id, null);
                  setCache(dc, emptyPrice);
                  result.set(id, emptyPrice);
                  resolvers[id](emptyPrice);
                });
                break; // Break retry loop
              }
              throw new Error(`Universalis returned ${resp.status}`);
            }

            const json = await resp.json();

            if (batch.length === 1) {
              const price = parseItemPrice(batch[0], json);
              setCache(dc, price);
              result.set(batch[0], price);
              resolvers[batch[0]](price);
            } else {
              const items: Record<string, any> = json.items ?? {};
              batch.forEach(id => {
                const raw = items[String(id)];
                // items map might omit unmarketable items even on a 200 response
                const price = parseItemPrice(id, raw || null);
                setCache(dc, price);
                result.set(id, price);
                resolvers[id](price);
              });
            }
            break; // Break retry loop on success
          } catch (err: any) {
            if (err === 'UserCancelled' || err?.message === 'UserCancelled' || localAbortController.signal.aborted) {
              const abortErr = new Error('UserCancelled');
              batch.forEach(id => { try { rejecters[id](abortErr); } catch { } });
              throw abortErr;
            }

            if (attempt >= 3) {
              batch.forEach(id => { try { rejecters[id](err); } catch { } });
              throw err;
            }

            _isRetrying.value = true;
            console.warn(`[Universalis] API fetch failed, retrying in ${delays[attempt]}ms (attempt ${attempt + 1}/3)...`, err);

            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(resolve, delays[attempt]);
              const onAbort = () => {
                clearTimeout(timer);
                reject(new Error('UserCancelled'));
              };
              if (localAbortController.signal.aborted) return onAbort();
              localAbortController.signal.addEventListener('abort', onAbort, { once: true });
            });

            attempt++;
          }
        }
      } finally {
        batch.forEach(id => inflightRequests.delete(cacheKey(dc, id)));
      }
    }
  } catch (err: any) {
    if (err?.message !== 'UserCancelled') {
      console.error('[Universalis] Price fetch failed:', err);
    } else {
      console.log('[Universalis] Price fetch aborted by user.');
    }
    _isPriceError.value = true;
  } finally {
    _isFetchingPrices.value = false;
    _isRetrying.value = false;
    activeAbortControllers.delete(localAbortController);
  }

  return result;
}

/**
 * Clears the entire price cache (e.g. when user manually refreshes).
 */
export function clearPriceCache() {
  priceCache.clear();
}

/**
 * Returns a human-readable "last updated X min ago" string for an item.
 */
export function formatLastUpdate(data: { lastUploadTime?: number }): string {
  if (!data.lastUploadTime) return '—';
  const now = Date.now();
  const diffMs = now - data.lastUploadTime;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '剛剛';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} 小時前`;
  return `${Math.floor(diffH / 24)} 天前`;
}
