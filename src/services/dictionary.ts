import { shallowRef, ref, reactive } from 'vue';

// Branch can be overridden via VITE_TEAMCRAFT_BRANCH (e.g. 'master' or 'staging').
// Defaults to 'staging' which is Teamcraft's active development branch and receives
// data updates (including non-global regions like TW) before they reach 'master'.
const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;

const DICT_URLS: Record<string, string> = {
  tw: `${BASE_URL}/tw/tw-items.json`,
  zh: `${BASE_URL}/zh/zh-items.json`,
  cn: `${BASE_URL}/zh/zh-items.json`,
  en: `${BASE_URL}/items.json`,
  ja: `${BASE_URL}/ja/ja-items.json`, // Will likely 404, but handled now
};

const ICONS_URL = `${BASE_URL}/item-icons.json`;
const RECIPES_URL = `${BASE_URL}/recipes.json`;
const ENGLISH_URL = `${BASE_URL}/items.json`;
const MAPS_URL = `${BASE_URL}/maps.json`;

// tw-places.json: Provides Traditional Chinese zone/map names for gathering nodes.
const TW_PLACES_URL = `${BASE_URL}/tw/tw-places.json`;
// places.json: Provides multi-language zone names (en, ja, de, fr)
const GLOBAL_PLACES_URL = `${BASE_URL}/places.json`;

export interface Recipe {
    id: number;
    result: number;
    yields: number;
    ingredients: any;
    job: number;
    lvl: number;
    [key: string]: any;
}

export interface MockItem {
  id: number;
  name: string; // localized name
  enName?: string; // English name for cross-language search
  icon: string;
}

// Global RAM cache as reactive refs
export const globalDictionaryCache = shallowRef<MockItem[] | null>(null);
export const globalRecipesCache = shallowRef<Recipe[] | null>(null);
export const isDictionaryLoading = ref(false);

const internalEnglishCache = shallowRef<Record<string, any> | null>(null);
const internalIconsCache = shallowRef<Record<string, string> | null>(null);

/** Raw name map from the current target language — includes ALL items, not just craftable ones */
let internalRawTargetNames: Record<string, any> = {};
/** Raw icon map — includes ALL items */
let internalRawIcons: Record<string, string> = {};

/** tw-places.json cache — { [zoneId: string]: { tw: string } } */
let globalPlacesCache: Record<string, { tw?: string }> | null = null;
let placesLoadPromise: Promise<void> | null = null;

/** maps.json cache — { [mapId: string]: any } */
let globalMapsCache: Record<string, any> | null = null;
let mapsLoadPromise: Promise<void> | null = null;

let currentLanguage = 'tw';

export function setDictionaryLanguage(lang: string) {
  if (currentLanguage !== lang) {
    currentLanguage = lang;
    globalDictionaryCache.value = null; 
    globalPlacesCache = null;
    placesLoadPromise = null;
  }
}

export function getCurrentLanguage() {
  return currentLanguage;
}

async function generateFallbackItemData() {
    return [
        { id: 41234, name: '諾弗蘭特遠見釣竿（複製品）', icon: 'https://xivapi.com/i/051000/051941.png' }
    ];
}

export async function ensureDictionaryLoaded(): Promise<MockItem[]> {
  if (globalDictionaryCache.value !== null && globalRecipesCache.value !== null) {
      return globalDictionaryCache.value;
  }

  if (isDictionaryLoading.value) {
      while(isDictionaryLoading.value) {
          await new Promise(r => setTimeout(r, 100));
      }
      return globalDictionaryCache.value || [];
  }

  isDictionaryLoading.value = true;
  try {
      console.log(`[Dictionary] Starting sync for lang: ${currentLanguage}...`);
      
      const fetchQueue = [
        fetch(DICT_URLS[currentLanguage] || DICT_URLS.tw),
        fetch(ICONS_URL),
        fetch(RECIPES_URL)
      ];

      const needsEnglish = currentLanguage !== 'en' && !internalEnglishCache.value;
      if (needsEnglish) {
        fetchQueue.push(fetch(ENGLISH_URL));
      }

      const results = await Promise.all(fetchQueue);
      
      // Target Dictionary Fallback (If Target Lang 404s, we don't crash)
      let rawTargetNames: Record<string, any> = {};
      if (results[0].ok) {
        rawTargetNames = await results[0].json();
      } else {
        console.warn(`[Dictionary] Target language ${currentLanguage} data not found, falling back to English.`);
      }

      // Vital files check
      if (!results[1].ok || !results[2].ok) {
        throw new Error("Vital dictionary files (Icons or Recipes) failed to load.");
      }

      const rawIcons = await results[1].json();
      const rawRecipes: Recipe[] = await results[2].json();
      
      if (needsEnglish) {
        if (results[3].ok) {
          internalEnglishCache.value = await results[3].json();
        }
      } else if (currentLanguage === 'en') {
        internalEnglishCache.value = rawTargetNames;
      }
      
      internalIconsCache.value = rawIcons;
      internalRawIcons = rawIcons;
      internalRawTargetNames = rawTargetNames;
      globalRecipesCache.value = rawRecipes;

      const craftableIds = new Set<number>();
      for (const recipe of rawRecipes) {
          if (recipe.result) {
              craftableIds.add(recipe.result);
          }
      }

      const itemsList: MockItem[] = [];
      
      const extractName = (entry: any, langOverride?: string) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          const l = langOverride || currentLanguage;
          return entry[l] || entry['en'] || Object.values(entry)[0];
        }
        return '';
      };

      for (const id of craftableIds) {
         const idStr = id.toString();
         
         let iconUrl = '';
         const iconPath = rawIcons[idStr];
         if (iconPath) {
           iconUrl = `https://xivapi.com${iconPath}`;
         }

         const targetEntry = rawTargetNames[idStr];
         const englishEntry = internalEnglishCache.value?.[idStr];
         
         const name = extractName(targetEntry) || extractName(englishEntry) || `Item #${id}`;
         const enName = extractName(englishEntry, 'en');

         itemsList.push({ id, name, enName, icon: iconUrl });
      }
      
      globalDictionaryCache.value = itemsList;
      console.log(`[Dictionary] Sync complete. Language: ${currentLanguage}. Count: ${itemsList.length}`);
  } catch (err) {
      console.error("[Dictionary] Sync failed:", err);
      globalDictionaryCache.value = await generateFallbackItemData();
  } finally {
      isDictionaryLoading.value = false;
  }
  
  return globalDictionaryCache.value!;
}

export function getDictionaryItem(id: number): MockItem | undefined {
    return globalDictionaryCache.value?.find(item => item.id === id);
}

/**
 * Looks up any item by ID using the full raw data, even if it's not in the craftable list.
 * Falls back to English name when TW name is missing.
 */
export function getRawItemData(id: number): { name: string; icon: string } {
    const idStr = id.toString();
    const targetEntry = internalRawTargetNames[idStr];
    const englishEntry = internalEnglishCache.value?.[idStr];
    
    const extractName = (entry: any, lang?: string) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
            const l = lang || 'tw';
            return entry[l] || entry['en'] || Object.values(entry)[0] as string;
        }
        return '';
    };

    const name = extractName(targetEntry) || extractName(englishEntry, 'en') || `Item #${id}`;
    const iconPath = internalRawIcons[idStr];
    const icon = iconPath ? `https://xivapi.com${iconPath}` : '';
    return { name, icon };
}

export async function getRecipes(): Promise<Recipe[]> {
    await ensureDictionaryLoaded();
    return globalRecipesCache.value || [];
}

export async function searchItems(query: string): Promise<MockItem[]> {
  const dictionary = await ensureDictionaryLoaded();
  
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  return dictionary.filter(item => {
    const mainMatch = item.name.toLowerCase().includes(normalizedQuery);
    const enMatch = item.enName ? item.enName.toLowerCase().includes(normalizedQuery) : false;
    return mainMatch || enMatch;
  }).slice(0, 50);
}

// ─── Places (Gathering Zone Names) ──────────────────────────────────────────

/**
 * Lazy-loads tw-places.json (once per session).
 * Used to display Traditional Chinese zone names for gathering nodes.
 */
export async function ensurePlacesLoaded(): Promise<void> {
  const isTW = currentLanguage === 'tw';
  if (globalPlacesCache !== null) return;
  if (placesLoadPromise) return placesLoadPromise;

  placesLoadPromise = (async () => {
    try {
      if (isTW) {
        // TW 模式同步抓取兩份，確保有完整 fallback
        const [twRes, globalRes] = await Promise.all([
          fetch(TW_PLACES_URL),
          fetch(GLOBAL_PLACES_URL)
        ]);
        
        const globalData = globalRes.ok ? await globalRes.json() : {};
        const twData = twRes.ok ? await twRes.json() : {};
        
        // 合併：TW 蓋過 Global
        globalPlacesCache = { ...globalData, ...twData };
        console.log('[Dictionary] Places data merged (TW + Global fallback).');
      } else {
        const res = await fetch(GLOBAL_PLACES_URL);
        if (!res.ok) throw new Error(`Global places fail: ${res.status}`);
        globalPlacesCache = await res.json();
        console.log('[Dictionary] Global places data loaded.');
      }
    } catch (err) {
      console.warn('[Dictionary] Failed to load places:', err);
      globalPlacesCache = {};
    } finally {
      placesLoadPromise = null;
    }
  })();

  return placesLoadPromise;
}

/**
 * Returns the Traditional Chinese name for a zone ID.
 * Falls back to English name if TW translation is missing.
 * @param zoneId - The zoneid from nodes.json
 * @param enFallback - English name to display if TW is unavailable
 */
export function getPlaceName(zoneId: number, enFallback?: string): string {
  const entry = globalPlacesCache?.[zoneId.toString()] as any;
  if (!entry) return enFallback || `Zone #${zoneId}`;
  
  if (currentLanguage === 'tw') {
    return entry.tw || enFallback || `Zone #${zoneId}`;
  }
  
  // Global places.json uses en, ja, de, fr
  const lang = currentLanguage === 'cn' || currentLanguage === 'zh' ? 'zh' : currentLanguage;
  return entry[lang] || entry['en'] || enFallback || `Zone #${zoneId}`;
}

/**
 * Lazy-loads maps.json (once per session).
 * Provides metadata for map hierarchy (region_id, placename_id).
 */
export async function ensureMapsLoaded(): Promise<void> {
  if (globalMapsCache !== null) return;
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = fetch(MAPS_URL)
    .then(r => {
      if (!r.ok) throw new Error(`maps.json fetch failed: ${r.status}`);
      return r.json();
    })
    .then(data => {
      globalMapsCache = data;
      console.log('[Dictionary] maps.json loaded.');
    })
    .catch(err => {
      console.warn('[Dictionary] Could not load maps.json:', err);
      globalMapsCache = {};
    })
    .finally(() => {
      mapsLoadPromise = null;
    });

  return mapsLoadPromise;
}

/**
 * Returns map metadata for a given map ID.
 */
export function getMapData(mapId: number): any | undefined {
  return globalMapsCache?.[mapId.toString()];
}
