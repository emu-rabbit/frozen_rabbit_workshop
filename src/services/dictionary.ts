import { shallowRef, ref } from 'vue';

const BASE_URL = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json';
// The tw/ locale directory lives on the `staging` branch
const BASE_URL_STAGING = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/staging/libs/data/src/lib/json';

const DICT_URLS: Record<string, string> = {
  tw: `${BASE_URL_STAGING}/tw/tw-items.json`,
  zh: `${BASE_URL}/zh/zh-items.json`,
  cn: `${BASE_URL}/zh/zh-items.json`,
  en: `${BASE_URL}/items.json`,
  ja: `${BASE_URL}/ja/ja-items.json`, // Will likely 404, but handled now
};

const ICONS_URL = `${BASE_URL}/item-icons.json`;
const RECIPES_URL = `${BASE_URL}/recipes.json`;
const ENGLISH_URL = `${BASE_URL}/items.json`;

// tw-places.json: Provides Traditional Chinese zone/map names for gathering nodes.
// Key: zoneid (string) → { tw: "繁中地名" }
const TW_PLACES_URL = `${BASE_URL_STAGING}/tw/tw-places.json`;

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

let currentLanguage = 'tw';

export function setDictionaryLanguage(lang: string) {
  if (currentLanguage !== lang) {
    currentLanguage = lang;
    globalDictionaryCache.value = null; 
  }
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
  if (globalPlacesCache !== null) return;
  if (placesLoadPromise) return placesLoadPromise;

  placesLoadPromise = fetch(TW_PLACES_URL)
    .then(r => {
      if (!r.ok) throw new Error(`tw-places.json fetch failed: ${r.status}`);
      return r.json();
    })
    .then(data => {
      globalPlacesCache = data;
      console.log('[Dictionary] tw-places.json loaded.');
    })
    .catch(err => {
      console.warn('[Dictionary] Could not load tw-places.json:', err);
      globalPlacesCache = {}; // fallback to empty so we don't keep retrying
    })
    .finally(() => {
      placesLoadPromise = null;
    });

  return placesLoadPromise;
}

/**
 * Returns the Traditional Chinese name for a zone ID.
 * Falls back to English name if TW translation is missing.
 * @param zoneId - The zoneid from nodes.json
 * @param enFallback - English name to display if TW is unavailable
 */
export function getPlaceName(zoneId: number, enFallback?: string): string {
  const entry = globalPlacesCache?.[zoneId.toString()];
  return entry?.tw || enFallback || `Zone #${zoneId}`;
}
