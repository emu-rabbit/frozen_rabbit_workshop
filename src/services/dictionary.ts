import { shallowRef, ref } from 'vue';

// Branch can be overridden via VITE_TEAMCRAFT_BRANCH (e.g. 'master' or 'staging').
// Defaults to 'staging' so non-global regions such as TW get Teamcraft updates early.
const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;

const ITEM_SEARCH_INDEX_URL = `${BASE_URL}/item-search.index`;
const EQUIPMENT_URL = `${BASE_URL}/equipment.json`;
const JOB_NAMES_URL = `${BASE_URL}/job-name.json`;
const SEARCH_CATEGORIES_URL = `${BASE_URL}/search-category.json`;
const RECIPES_URL = `${BASE_URL}/recipes.json`;
const ICONS_URL = `${BASE_URL}/item-icons.json`;
const ENGLISH_URL = `${BASE_URL}/items.json`;
const MAPS_URL = `${BASE_URL}/maps.json`;
const TW_PLACES_URL = `${BASE_URL}/tw/tw-places.json`;
const GLOBAL_PLACES_URL = `${BASE_URL}/places.json`;

const DICT_URLS: Record<string, string> = {
  tw: `${BASE_URL}/tw/tw-items.json`,
  zh: `${BASE_URL}/zh/zh-items.json`,
  cn: `${BASE_URL}/zh/zh-items.json`,
  en: `${BASE_URL}/items.json`,
  ja: `${BASE_URL}/ja/ja-items.json`,
};

export interface Recipe {
  id: number;
  result: number;
  yields: number;
  ingredients: any;
  job: number;
  lvl: number;
  stars?: number;
  [key: string]: any;
}

export interface MockItem {
  id: number;
  name: string;
  enName?: string;
  icon: string;
  ilvl?: number;
  category?: number;
  categoryName?: string;
  craftable?: boolean;
  equipLevel?: number;
  equipJobs?: string[];
  equipSlotCategory?: number;
}

interface RawSearchIndexItem {
  id: number | string;
  en?: string;
  de?: string;
  ja?: string;
  fr?: string;
  ko?: string;
  zh?: string;
  tw?: string;
  iconId?: string;
  category?: number;
  ilvl?: number;
  craftable?: boolean;
  data?: {
    itemId?: number;
    icon?: string;
    ilvl?: number;
  };
}

interface EquipmentData {
  equipSlotCategory?: number;
  level?: number;
  jobs?: string[];
}

type LocalizedEntry = Record<string, string>;

export const globalDictionaryCache = shallowRef<MockItem[] | null>(null);
export const globalRecipesCache = shallowRef<Recipe[] | null>(null);
export const isDictionaryLoading = ref(false);
export const isDisplayMetadataLoading = ref(false);
export const isRecipeDataLoading = ref(false);
export const isWorkbenchDataPreloading = ref(false);

const internalItemByIdCache = shallowRef<Map<number, MockItem>>(new Map());

let rawSearchIndexCache: RawSearchIndexItem[] | null = null;
let equipmentCache: Record<string, EquipmentData> | null = null;
let jobNamesCache: Record<string, LocalizedEntry> | null = null;
let searchCategoriesCache: Record<string, LocalizedEntry> | null = null;
let searchIndexLoadPromise: Promise<MockItem[]> | null = null;
let displayMetadataLoadPromise: Promise<void> | null = null;
let displayMetadataLanguage: string | null = null;
let recipeLoadPromise: Promise<Recipe[]> | null = null;
let workbenchPreloadPromise: Promise<void> | null = null;

let globalPlacesCache: Record<string, { tw?: string; [key: string]: any }> | null = null;
let placesLoadPromise: Promise<void> | null = null;
let globalMapsCache: Record<string, any> | null = null;
let mapsLoadPromise: Promise<void> | null = null;

let currentLanguage = 'tw';

function normalizeLanguage(lang = currentLanguage) {
  return lang === 'cn' ? 'zh' : lang;
}

function getLocalizedEntry(entry: LocalizedEntry | undefined): string {
  if (!entry) return '';
  const lang = normalizeLanguage();
  return entry[lang] || entry.en || entry.tw || entry.zh || entry.ja || Object.values(entry)[0] || '';
}

function getLocalizedItemName(item: RawSearchIndexItem): string {
  const lang = normalizeLanguage();
  return (item as any)[lang] || item.en || item.tw || item.zh || item.ja || `Item #${getCanonicalItemId(item)}`;
}

function getCanonicalItemId(item: RawSearchIndexItem): number {
  return item.data?.itemId ?? Number(item.id);
}

function getSearchIndexIcon(item: RawSearchIndexItem): string {
  if (item.data?.icon) return `https://xivapi.com${item.data.icon}`;

  if (item.iconId) {
    const folder = item.iconId.slice(0, 3).padEnd(3, '0');
    return `https://xivapi.com/i/${folder}000/${item.iconId}_hr1.png`;
  }

  return '';
}

function normalizeIconUrl(iconPath?: string): string {
  if (!iconPath) return '';
  return iconPath.startsWith('http') ? iconPath : `https://xivapi.com${iconPath}`;
}

function getCategoryName(categoryId?: number): string | undefined {
  if (!categoryId) return undefined;
  const name = getLocalizedEntry(searchCategoriesCache?.[String(categoryId)]);
  return name || undefined;
}

function rebuildDictionaryCacheFromSearchIndex() {
  if (!rawSearchIndexCache) return;

  const itemMap = new Map<number, MockItem>();

  rawSearchIndexCache.forEach(item => {
    const itemId = getCanonicalItemId(item);
    if (!Number.isFinite(itemId)) return;

    const equipment = equipmentCache?.[String(itemId)];
    const existing = itemMap.get(itemId);
    itemMap.set(itemId, {
      ...(existing || {}),
      id: itemId,
      name: getLocalizedItemName(item),
      enName: item.en || existing?.enName,
      icon: getSearchIndexIcon(item) || existing?.icon || '',
      ilvl: item.ilvl ?? item.data?.ilvl ?? existing?.ilvl,
      category: item.category ?? existing?.category,
      categoryName: getCategoryName(item.category) || existing?.categoryName,
      craftable: !!item.craftable || !!existing?.craftable,
      equipLevel: equipment?.level ?? existing?.equipLevel,
      equipJobs: equipment?.jobs ?? existing?.equipJobs,
      equipSlotCategory: equipment?.equipSlotCategory ?? existing?.equipSlotCategory,
    });
  });

  const items = Array.from(itemMap.values());
  globalDictionaryCache.value = items;
  internalItemByIdCache.value = itemMap;
}

async function readDeflatedJson<T>(response: Response): Promise<T> {
  if (!('DecompressionStream' in globalThis)) {
    throw new Error('This browser cannot decompress Teamcraft item-search.index.');
  }

  const stream = response.body?.pipeThrough(new DecompressionStream('deflate'));
  if (!stream) throw new Error('Compressed item index response has no body.');
  return new Response(stream).json();
}

async function generateFallbackItemData(): Promise<MockItem[]> {
  return [
    {
      id: 41234,
      name: 'Item #41234',
      enName: 'Item #41234',
      icon: 'https://xivapi.com/i/051000/051941.png',
      craftable: true,
    },
  ];
}

export function setDictionaryLanguage(lang: string) {
  if (currentLanguage === lang) return;

  currentLanguage = lang;
  if (rawSearchIndexCache) {
    rebuildDictionaryCacheFromSearchIndex();
    displayMetadataLanguage = null;
  } else {
    globalDictionaryCache.value = null;
    internalItemByIdCache.value = new Map();
  }

  globalPlacesCache = null;
  placesLoadPromise = null;
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export async function ensureSearchIndexLoaded(): Promise<MockItem[]> {
  if (globalDictionaryCache.value !== null) return globalDictionaryCache.value;
  if (searchIndexLoadPromise) return searchIndexLoadPromise;

  isDictionaryLoading.value = true;
  searchIndexLoadPromise = (async () => {
    try {
      console.log(`[Dictionary] Loading search index for lang: ${currentLanguage}...`);
      const [indexRes, equipmentRes, jobNamesRes, categoriesRes] = await Promise.all([
        fetch(ITEM_SEARCH_INDEX_URL),
        fetch(EQUIPMENT_URL),
        fetch(JOB_NAMES_URL),
        fetch(SEARCH_CATEGORIES_URL),
      ]);

      if (!indexRes.ok || !equipmentRes.ok || !jobNamesRes.ok || !categoriesRes.ok) {
        throw new Error('Search index metadata failed to load.');
      }

      const [searchIndex, equipment, jobNames, categories] = await Promise.all([
        readDeflatedJson<RawSearchIndexItem[]>(indexRes),
        equipmentRes.json(),
        jobNamesRes.json(),
        categoriesRes.json(),
      ]);

      rawSearchIndexCache = searchIndex;
      equipmentCache = equipment;
      jobNamesCache = jobNames;
      searchCategoriesCache = categories;
      rebuildDictionaryCacheFromSearchIndex();
      console.log(`[Dictionary] Search index ready. Count: ${globalDictionaryCache.value?.length || 0}`);
    } catch (err) {
      console.error('[Dictionary] Search index failed:', err);
      globalDictionaryCache.value = await generateFallbackItemData();
      internalItemByIdCache.value = new Map(globalDictionaryCache.value.map(item => [item.id, item]));
    } finally {
      isDictionaryLoading.value = false;
      searchIndexLoadPromise = null;
    }

    return globalDictionaryCache.value!;
  })();

  return searchIndexLoadPromise;
}

export async function ensureDisplayMetadataLoaded(): Promise<void> {
  const normalizedCurrentLanguage = normalizeLanguage();
  if (displayMetadataLanguage === normalizedCurrentLanguage) return;
  if (displayMetadataLoadPromise) return displayMetadataLoadPromise;

  isDisplayMetadataLoading.value = true;
  displayMetadataLoadPromise = (async () => {
    try {
      await ensureSearchIndexLoaded();

      const needsEnglish = normalizedCurrentLanguage !== 'en';
      const fetchQueue = [
        fetch(DICT_URLS[currentLanguage] || DICT_URLS.tw),
        fetch(ICONS_URL),
      ];

      if (needsEnglish) {
        fetchQueue.push(fetch(ENGLISH_URL));
      }

      const [targetRes, iconsRes, englishRes] = await Promise.all(fetchQueue);
      if (!iconsRes.ok) throw new Error('Item icons failed to load.');

      const targetNames: Record<string, LocalizedEntry | string> = targetRes.ok ? await targetRes.json() : {};
      const iconMap: Record<string, string> = await iconsRes.json();
      const englishNames: Record<string, LocalizedEntry | string> = needsEnglish && englishRes?.ok ? await englishRes.json() : targetNames;

      const itemMap = new Map(internalItemByIdCache.value);
      const allIds = new Set([
        ...Object.keys(targetNames),
        ...Object.keys(englishNames),
        ...Object.keys(iconMap),
      ]);

      allIds.forEach(idStr => {
        const id = Number(idStr);
        if (!Number.isFinite(id)) return;

        const existing = itemMap.get(id);
        const targetEntry = targetNames[idStr];
        const englishEntry = englishNames[idStr];
        const localizedName = getLocalizedEntry(typeof targetEntry === 'string' ? { en: targetEntry } : targetEntry);
        const englishName = getLocalizedEntry(typeof englishEntry === 'string' ? { en: englishEntry } : englishEntry);
        const icon = normalizeIconUrl(iconMap[idStr]);

        itemMap.set(id, {
          ...(existing || {
            id,
            name: localizedName || englishName || `Item #${id}`,
            icon,
            craftable: false,
          }),
          name: localizedName || existing?.name || englishName || `Item #${id}`,
          enName: existing?.enName || englishName || undefined,
          icon: existing?.icon || icon,
        });
      });

      internalItemByIdCache.value = itemMap;
      globalDictionaryCache.value = Array.from(itemMap.values());
      displayMetadataLanguage = normalizedCurrentLanguage;
    } catch (err) {
      console.error('[Dictionary] Display metadata failed:', err);
    } finally {
      isDisplayMetadataLoading.value = false;
      displayMetadataLoadPromise = null;
    }
  })();

  return displayMetadataLoadPromise;
}

export async function ensureRecipeDataLoaded(): Promise<Recipe[]> {
  if (globalRecipesCache.value !== null) return globalRecipesCache.value;
  if (recipeLoadPromise) return recipeLoadPromise;

  isRecipeDataLoading.value = true;
  recipeLoadPromise = (async () => {
    try {
      const res = await fetch(RECIPES_URL);
      if (!res.ok) throw new Error('Recipes failed to load.');
      globalRecipesCache.value = await res.json();
    } catch (err) {
      console.error('[Dictionary] Recipe data failed:', err);
      globalRecipesCache.value = [];
    } finally {
      isRecipeDataLoading.value = false;
      recipeLoadPromise = null;
    }

    return globalRecipesCache.value || [];
  })();

  return recipeLoadPromise;
}

export async function ensureDictionaryLoaded(): Promise<MockItem[]> {
  const [dictionary] = await Promise.all([
    ensureSearchIndexLoaded(),
    ensureRecipeDataLoaded(),
  ]);
  return dictionary;
}

export function preloadWorkbenchData(loaders: Array<() => Promise<unknown>> = []): Promise<void> {
  if (workbenchPreloadPromise) return workbenchPreloadPromise;

  isWorkbenchDataPreloading.value = true;
  workbenchPreloadPromise = ensureSearchIndexLoaded()
    .then(async () => {
      await Promise.all([
        ensureRecipeDataLoaded(),
        ...loaders.map(loader => loader()),
      ]);
    })
    .catch(err => {
      console.warn('[Dictionary] Workbench preload failed:', err);
    })
    .finally(() => {
      isWorkbenchDataPreloading.value = false;
      workbenchPreloadPromise = null;
    });

  return workbenchPreloadPromise;
}

export function getDictionaryItem(id: number): MockItem | undefined {
  return internalItemByIdCache.value.get(id) ?? globalDictionaryCache.value?.find(item => item.id === id);
}

export function getRawItemData(id: number): { name: string; icon: string } {
  const indexed = getDictionaryItem(id);
  if (indexed) return { name: indexed.name, icon: indexed.icon };

  return { name: `Item #${id}`, icon: '' };
}

export async function getRecipes(): Promise<Recipe[]> {
  return ensureRecipeDataLoaded();
}

export function getJobName(jobId: number): string {
  return getLocalizedEntry(jobNamesCache?.[String(jobId)]) || `Job #${jobId}`;
}

export async function searchItems(query: string): Promise<MockItem[]> {
  const dictionary = await ensureSearchIndexLoaded();

  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  return dictionary.filter(item => {
    if (!item.craftable) return false;

    const mainMatch = item.name.toLowerCase().includes(normalizedQuery);
    const enMatch = item.enName ? item.enName.toLowerCase().includes(normalizedQuery) : false;
    return mainMatch || enMatch;
  }).slice(0, 100);
}

export async function ensurePlacesLoaded(): Promise<void> {
  const isTW = currentLanguage === 'tw';
  if (globalPlacesCache !== null) return;
  if (placesLoadPromise) return placesLoadPromise;

  placesLoadPromise = (async () => {
    try {
      if (isTW) {
        const [twRes, globalRes] = await Promise.all([
          fetch(TW_PLACES_URL),
          fetch(GLOBAL_PLACES_URL),
        ]);

        const globalData = globalRes.ok ? await globalRes.json() : {};
        const twData = twRes.ok ? await twRes.json() : {};
        globalPlacesCache = { ...globalData, ...twData };
      } else {
        const res = await fetch(GLOBAL_PLACES_URL);
        if (!res.ok) throw new Error(`Global places fail: ${res.status}`);
        globalPlacesCache = await res.json();
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

export function getPlaceName(zoneId: number, enFallback?: string): string {
  const entry = globalPlacesCache?.[zoneId.toString()];
  if (!entry) return enFallback || `Zone #${zoneId}`;

  if (currentLanguage === 'tw') {
    return entry.tw || enFallback || `Zone #${zoneId}`;
  }

  const lang = normalizeLanguage();
  return entry[lang] || entry.en || enFallback || `Zone #${zoneId}`;
}

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
    })
    .catch(err => {
      console.warn('[Dictionary] Could not load maps:', err);
      globalMapsCache = {};
    })
    .finally(() => {
      mapsLoadPromise = null;
    });

  return mapsLoadPromise;
}

export function getMapData(mapId: number): any | undefined {
  return globalMapsCache?.[mapId.toString()];
}
