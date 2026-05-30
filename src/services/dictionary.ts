import { shallowRef, ref } from 'vue';

// Branch can be overridden via VITE_TEAMCRAFT_BRANCH (e.g. 'master' or 'staging').
// Defaults to 'staging' so non-global regions such as TW get Teamcraft updates early.
const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;

const ITEM_SEARCH_INDEX_URL = `${BASE_URL}/item-search.index`;
const EQUIPMENT_URL = `${BASE_URL}/equipment.json`;
const JOB_NAMES_URL = `${BASE_URL}/job-name.json`;
const ITEM_CATEGORIES_URL = `${BASE_URL}/item-category.json`;
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
  id: number | string;
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

export type ItemCategoryGroup = 'weapon' | 'tool' | 'armor' | 'accessory' | 'medicine' | 'food' | 'material' | 'furniture' | 'other';

export interface ItemFilterCriteria {
  query?: string;
  ilvlMin?: number | null;
  ilvlMax?: number | null;
  equipLevelMin?: number | null;
  equipLevelMax?: number | null;
  job?: string;
  categoryGroup?: ItemCategoryGroup | 'all';
}

// Keep the filter aligned with Teamcraft TW job-name coverage and the in-game
// character window grouping instead of sorting abbreviations alphabetically.
export const EQUIPMENT_JOB_ORDER = [
  'GLA', 'PLD', 'MRD', 'WAR', 'DRK', 'GNB',
  'CNJ', 'WHM', 'SCH', 'AST', 'SGE',
  'PGL', 'MNK', 'LNC', 'DRG', 'ROG', 'NIN', 'SAM', 'RPR', 'VPR',
  'ARC', 'BRD', 'MCH', 'DNC',
  'THM', 'BLM', 'ACN', 'SMN', 'RDM', 'BLU', 'PCT',
  'CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'LWR', 'WVR', 'ALC', 'CUL',
  'MIN', 'BTN', 'FSH',
] as const;

const HIDDEN_EQUIPMENT_JOBS = new Set(['ADV', 'BST']);
const EQUIPMENT_JOB_ORDER_INDEX = new Map<string, number>(
  EQUIPMENT_JOB_ORDER.map((job, index) => [job, index])
);

const ITEM_CATEGORY_GROUPS: Record<ItemCategoryGroup, Set<number>> = {
  weapon: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 84, 87, 88, 89, 96, 97, 98, 105, 106, 107, 108, 109, 110, 111]),
  tool: new Set([12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 99]),
  armor: new Set([34, 35, 36, 37, 38]),
  accessory: new Set([40, 41, 42, 43]),
  medicine: new Set([44]),
  food: new Set([46]),
  material: new Set([45, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 58]),
  furniture: new Set([57, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 95]),
  other: new Set([33, 39, 59, 60, 61, 62, 63, 64, 81, 82, 83, 85, 86, 90, 91, 92, 93, 94, 100, 101, 102, 103, 104, 112, 113, 114, 115]),
};

export function getOrderedEquipmentJobs(jobs: Iterable<string>): string[] {
  return Array.from(new Set(jobs))
    .filter(job => job && !HIDDEN_EQUIPMENT_JOBS.has(job))
    .sort((a, b) => {
      const orderA = EQUIPMENT_JOB_ORDER_INDEX.get(a) ?? Number.MAX_SAFE_INTEGER;
      const orderB = EQUIPMENT_JOB_ORDER_INDEX.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
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
let itemCategoriesCache: Record<string, LocalizedEntry> | null = null;
let searchIndexLoadPromise: Promise<MockItem[]> | null = null;
let displayMetadataLoadPromise: Promise<void> | null = null;
let displayMetadataLanguage: string | null = null;
let recipeLoadPromise: Promise<Recipe[]> | null = null;
let recipeResultIdsCache: Set<number> | null = null;
let recipeResultIdsSource: Recipe[] | null = null;
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
  const name = getLocalizedEntry(itemCategoriesCache?.[String(categoryId)]);
  return name || undefined;
}

function getRecipeResultIds(): Set<number> | null {
  const recipes = globalRecipesCache.value;
  if (!recipes) return null;
  if (recipeResultIdsCache && recipeResultIdsSource === recipes) return recipeResultIdsCache;

  recipeResultIdsSource = recipes;
  recipeResultIdsCache = new Set(
    recipes
      .map(recipe => Number(recipe.result))
      .filter(result => Number.isFinite(result))
  );
  return recipeResultIdsCache;
}

function setRecipeCache(recipes: Recipe[]) {
  globalRecipesCache.value = recipes;
  recipeResultIdsSource = null;
  getRecipeResultIds();

  if (rawSearchIndexCache) {
    rebuildDictionaryCacheFromSearchIndex();
  }
}

function isCraftableItem(item: Pick<MockItem, 'id' | 'craftable'>): boolean {
  return !!item.craftable || !!getRecipeResultIds()?.has(item.id);
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
      craftable: !!item.craftable || !!existing?.craftable || !!getRecipeResultIds()?.has(itemId),
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
        fetch(ITEM_CATEGORIES_URL),
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
      itemCategoriesCache = categories;
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
      setRecipeCache(await res.json());
    } catch (err) {
      console.error('[Dictionary] Recipe data failed:', err);
      setRecipeCache([]);
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
  await Promise.all([
    ensureSearchIndexLoaded(),
    ensureRecipeDataLoaded(),
  ]);

  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  return (globalDictionaryCache.value || []).filter(item => {
    if (!isCraftableItem(item)) return false;

    const mainMatch = item.name.toLowerCase().includes(normalizedQuery);
    const enMatch = item.enName ? item.enName.toLowerCase().includes(normalizedQuery) : false;
    return mainMatch || enMatch;
  }).slice(0, 100);
}

export function getItemCategoryGroup(item: MockItem): ItemCategoryGroup {
  const category = item.category;
  if (category === undefined) return 'other';

  for (const [group, categoryIds] of Object.entries(ITEM_CATEGORY_GROUPS)) {
    if (categoryIds.has(category)) return group as ItemCategoryGroup;
  }

  return 'other';
}

export async function getSearchableItems(): Promise<MockItem[]> {
  await Promise.all([
    ensureSearchIndexLoaded(),
    ensureRecipeDataLoaded(),
  ]);
  return (globalDictionaryCache.value || []).filter(isCraftableItem);
}

function matchesNumberRange(value: number | undefined, min?: number | null, max?: number | null): boolean {
  const hasMin = typeof min === 'number' && Number.isFinite(min);
  const hasMax = typeof max === 'number' && Number.isFinite(max);

  if (!hasMin && !hasMax) return true;
  if (value === undefined || value === null) return false;
  if (hasMin && value < min!) return false;
  if (hasMax && value > max!) return false;

  return true;
}

export async function filterSearchableItems(criteria: ItemFilterCriteria): Promise<MockItem[]> {
  const items = await getSearchableItems();
  const normalizedQuery = criteria.query?.trim().toLowerCase() ?? '';
  const categoryGroup = criteria.categoryGroup ?? 'all';
  const job = criteria.job?.trim();

  return items
    .filter(item => {
      if (normalizedQuery) {
        const mainMatch = item.name.toLowerCase().includes(normalizedQuery);
        const enMatch = item.enName ? item.enName.toLowerCase().includes(normalizedQuery) : false;
        if (!mainMatch && !enMatch) return false;
      }

      if (!matchesNumberRange(item.ilvl, criteria.ilvlMin, criteria.ilvlMax)) return false;
      if (!matchesNumberRange(item.equipLevel, criteria.equipLevelMin, criteria.equipLevelMax)) return false;

      if (job && !(item.equipJobs || []).includes(job)) return false;
      if (categoryGroup !== 'all' && getItemCategoryGroup(item) !== categoryGroup) return false;

      return true;
    })
    .sort((a, b) => {
      const ilvlDiff = (b.ilvl ?? 0) - (a.ilvl ?? 0);
      if (ilvlDiff !== 0) return ilvlDiff;

      const equipLevelDiff = (b.equipLevel ?? 0) - (a.equipLevel ?? 0);
      if (equipLevelDiff !== 0) return equipLevelDiff;

      return a.id - b.id;
    })
    .slice(0, 300);
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
    return entry.tw || entry.en || enFallback || `Zone #${zoneId}`;
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
