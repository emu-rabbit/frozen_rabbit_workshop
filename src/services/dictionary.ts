import { shallowRef, ref } from 'vue';

const SOURCE_URLS = {
  tw: 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/tw/tw-items.json',
};

const ICONS_URL = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/item-icons.json';
const RECIPES_URL = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/recipes.json';

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
  icon: string;
}

// Global RAM cache as reactive refs
export const globalDictionaryCache = shallowRef<MockItem[] | null>(null);
export const globalRecipesCache = shallowRef<Recipe[] | null>(null);
export const isDictionaryLoading = ref(false);

const currentLanguage: keyof typeof SOURCE_URLS = 'tw';

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
      // Loop wait until loading finished by another caller
      while(isDictionaryLoading.value) {
          await new Promise(r => setTimeout(r, 100));
      }
      return globalDictionaryCache.value || [];
  }

  isDictionaryLoading.value = true;
  try {
      console.log(`[Dictionary] Starting download of huge datasets for lang: ${currentLanguage}...`);
      
      const [namesResponse, iconsResponse, recipesResponse] = await Promise.all([
        fetch(SOURCE_URLS[currentLanguage]),
        fetch(ICONS_URL),
        fetch(RECIPES_URL)
      ]);

      if (!namesResponse.ok || !iconsResponse.ok || !recipesResponse.ok) {
          throw new Error(`Failed to fetch dictionary data.`);
      }
      
      const rawNames = await namesResponse.json();
      const rawIcons = await iconsResponse.json();
      const rawRecipes: Recipe[] = await recipesResponse.json();
      
      // Cache recipes globally
      globalRecipesCache.value = rawRecipes;

      // Build Set of craftable Item IDs
      const craftableSet = new Set<number>();
      for (const recipe of rawRecipes) {
          if (recipe.result) {
              craftableSet.add(recipe.result);
          }
      }

      const itemsList: MockItem[] = [];
      const keys = Object.keys(rawNames);
      
      for (const idStr of keys) {
         const id = parseInt(idStr, 10);
         
         // CRAFTER'S FILTER: Only keep if the item is a recipe result
         if (!craftableSet.has(id)) {
             continue;
         }

         const itemDoc = rawNames[idStr];
         let finalName = '';
         if (typeof itemDoc === 'string') finalName = itemDoc;
         else if (itemDoc[currentLanguage]) finalName = itemDoc[currentLanguage];
         else if (itemDoc['en']) finalName = itemDoc['en']; // default
         
         if (finalName) {
             let iconUrl = '';
             let iconPath = rawIcons[idStr];
             if (iconPath) {
                 iconUrl = `https://xivapi.com${iconPath}`;
             }
             itemsList.push({
                 id,
                 name: finalName,
                 icon: iconUrl
             });
         }
      }
      
      globalDictionaryCache.value = itemsList;
      console.log(`[Dictionary] Download complete! Parsed ${itemsList.length} craftable items to RAM cache. Recipes count: ${globalRecipesCache.value.length}`);
  } catch (err) {
      console.error("[Dictionary] Download failed, dropping down to fallback dictionary:", err);
      globalDictionaryCache.value = await generateFallbackItemData();
  } finally {
      isDictionaryLoading.value = false;
  }
  
  return globalDictionaryCache.value!;
}

// Reactivity helper
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
  
  // Return early items max 50 to prevent freezing the UI.
  return dictionary.filter(item => 
    item.name.toLowerCase().includes(normalizedQuery)
  ).slice(0, 50);
}
