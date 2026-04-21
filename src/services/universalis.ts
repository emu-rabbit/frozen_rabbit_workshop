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

let _dcFetchPromise: Promise<DataCenter[]> | null = null;

/** Fetches and caches the full list of Universalis data centers (once per session). */
export async function ensureDataCentersLoaded(): Promise<DataCenter[]> {
  if (_dataCenters.value.length > 0) return _dataCenters.value;
  if (_dcFetchPromise) return _dcFetchPromise;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  _dcFetchPromise = fetch(`${UNIVERSALIS_BASE}/data-centers`, { signal: controller.signal })
    .then(r => {
      clearTimeout(timeoutId);
      if (!r.ok) throw new Error('Failed to fetch data centers');
      return r.json() as Promise<DataCenter[]>;
    })
    .then(list => {
      _dataCenters.value = list;
      return list;
    })
    .catch(err => {
      clearTimeout(timeoutId);
      throw err;
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
      if (err?.message === 'UserCancelled') {
        throw err;
      }
      console.error('[Universalis] Inflight price fetch failed:', err);
      // Let it fail gracefully; the primary fetch loop will also fail gracefully and we don't crash.
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
      _isPriceError.value = true;
    } else {
      console.log('[Universalis] Price fetch aborted by user.');
    }
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
