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

/** All available data centers fetched from Universalis. */
export interface DataCenter {
  name: string;
  region: string;
  worlds: number[];
}

/** Price data for a single item. */
export interface ItemPrice {
  itemId: number;
  minPriceNQ: number;
  minPriceHQ: number;
  currentAveragePriceNQ: number;
  currentAveragePriceHQ: number;
  lastUploadTime: number; // Unix ms
  worldName?: string;     // present for single-world queries
  dcName?: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: ItemPrice;
  expiresAt: number; // Date.now() + TTL
}

/** Session-level price cache: `{dc}:{itemId}` → CacheEntry */
const priceCache = new Map<string, CacheEntry>();

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

const _dataCenters = ref<DataCenter[]>([]);
const _selectedDC = ref<string>(
  localStorage.getItem('universalis_dc') ?? '陸行鳥'
);
const _isFetchingPrices = ref(false);
const _isPriceError = ref(false);

export const dataCenters = readonly(_dataCenters);
export const selectedDC = readonly(_selectedDC);
export const isFetchingPrices = readonly(_isFetchingPrices);
export const isPriceError = readonly(_isPriceError);

// ─── Data Center Management ───────────────────────────────────────────────────

let _dcFetchPromise: Promise<DataCenter[]> | null = null;

/** Fetches and caches the full list of Universalis data centers (once per session). */
export async function ensureDataCentersLoaded(): Promise<DataCenter[]> {
  if (_dataCenters.value.length > 0) return _dataCenters.value;
  if (_dcFetchPromise) return _dcFetchPromise;

  _dcFetchPromise = fetch(`${UNIVERSALIS_BASE}/data-centers`)
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch data centers');
      return r.json() as Promise<DataCenter[]>;
    })
    .then(list => {
      _dataCenters.value = list;
      return list;
    })
    .finally(() => {
      _dcFetchPromise = null;
    });

  return _dcFetchPromise;
}

/** Persists the selected data center to localStorage. */
export function setSelectedDC(dc: string) {
  _selectedDC.value = dc;
  localStorage.setItem('universalis_dc', dc);
  // Invalidate the existing cache when DC changes
  priceCache.clear();
}

// ─── Price Fetching ───────────────────────────────────────────────────────────

function parseItemPrice(itemId: number, raw: any): ItemPrice {
  return {
    itemId,
    minPriceNQ: raw.minPriceNQ ?? 0,
    minPriceHQ: raw.minPriceHQ ?? 0,
    currentAveragePriceNQ: raw.currentAveragePriceNQ ?? 0,
    currentAveragePriceHQ: raw.currentAveragePriceHQ ?? 0,
    lastUploadTime: raw.lastUploadTime ?? 0,
    worldName: raw.worldName,
    dcName: raw.dcName,
  };
}

/**
 * Fetches prices for the given item IDs from Universalis.
 * - Returns cached results for items still within TTL.
 * - Batches uncached items (max 100 per request) into one API call.
 * - Should be called when the Workbench opens.
 */
export async function fetchItemPrices(
  itemIds: number[]
): Promise<Map<number, ItemPrice>> {
  const dc = _selectedDC.value;
  const result = new Map<number, ItemPrice>();

  if (!itemIds.length) return result;

  // Separate cached vs. needs-fetch
  const toFetch: number[] = [];
  for (const id of itemIds) {
    const cached = getCached(dc, id);
    if (cached) {
      result.set(id, cached);
    } else {
      toFetch.push(id);
    }
  }

  if (!toFetch.length) return result;

  _isFetchingPrices.value = true;
  _isPriceError.value = false;

  try {
    // Universalis supports up to 100 IDs per request (comma-separated)
    const BATCH_SIZE = 100;
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const encodedDC = encodeURIComponent(dc);
      const url = `${UNIVERSALIS_BASE}/${encodedDC}/${batch.join(',')}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Universalis returned ${resp.status} for DC "${dc}"`);
      }

      const json = await resp.json();

      if (batch.length === 1) {
        // Single-item response shape
        const price = parseItemPrice(batch[0], json);
        setCache(dc, price);
        result.set(batch[0], price);
      } else {
        // Multi-item response shape: { items: { [itemId]: {...} }, unresolvedItems: [...] }
        const items: Record<string, any> = json.items ?? {};
        for (const [idStr, raw] of Object.entries(items)) {
          const id = parseInt(idStr, 10);
          const price = parseItemPrice(id, raw);
          setCache(dc, price);
          result.set(id, price);
        }
        // unresolvedItems are just items with no market data — skip silently
      }
    }
  } catch (err) {
    console.error('[Universalis] Price fetch failed:', err);
    _isPriceError.value = true;
  } finally {
    _isFetchingPrices.value = false;
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
export function formatLastUpdate(price: ItemPrice): string {
  if (!price.lastUploadTime) return '—';
  const diffMs = Date.now() - price.lastUploadTime;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '剛剛';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} 小時前`;
  return `${Math.floor(diffH / 24)} 天前`;
}
