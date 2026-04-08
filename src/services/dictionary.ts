import { shallowRef, ref } from 'vue';

const BASE_URL = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json';
const DICT_URLS: Record<string, string> = {
  tw: `${BASE_URL}/tw/tw-items.json`,
  zh: `${BASE_URL}/zh/zh-items.json`,
  en: `${BASE_URL}/items.json`,
  ja: `${BASE_URL}/ja/ja-items.json`, // Will likely 404, but handled now
};

const ICONS_URL = `${BASE_URL}/item-icons.json`;
const RECIPES_URL = `${BASE_URL}/recipes.json`;
const ENGLISH_URL = `${BASE_URL}/items.json`;

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
