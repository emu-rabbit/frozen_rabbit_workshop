import { computed, ref } from 'vue';
import { catalogData, recipeData, sourceData, loadCatalog, loadCoreData, dataLoading } from './gameData';
import type { CatalogItem, DataNames, DataLocale } from '../types/gameData';
export type { Recipe } from '../types/gameData';
export interface DictionaryItem extends Omit<CatalogItem, 'names'> { name: string; enName?: string; categoryName?: string }
export const currentLanguage = ref<DataLocale>('tw');
export const isDictionaryLoading = dataLoading;
export const globalRecipesCache = computed(() => recipeData.value?.recipes ?? null);
export const globalDictionaryCache = computed(() => (catalogData.value?.items || []).map(localizeItem));
const itemById = computed(() => new Map(globalDictionaryCache.value.map(item => [item.id, item])));
export function setDictionaryLanguage(lang: string) { currentLanguage.value = (lang === 'zh' ? 'cn' : lang) as DataLocale; }
export function getCurrentLanguage() { return currentLanguage.value; }
export function localizeData(names: DataNames | undefined, fallback = ''): string { return names?.[currentLanguage.value] || names?.en || fallback; }
function localizeItem(item: CatalogItem): DictionaryItem {
  const { names, ...data } = item;
  return { ...data, name: localizeData(names, unknownName()), enName: names.en,
    categoryName: item.category ? localizeData(catalogData.value?.categories[item.category]) || undefined : undefined };
}
function unknownName() { return { tw: '未知的物品', cn: '未知的物品', en: 'Unknown item', ja: '不明なアイテム' }[currentLanguage.value] || 'Unknown item'; }
export function getDictionaryItem(id: number): DictionaryItem {
  return itemById.value.get(id) || { id, name: unknownName(), icon: '', craftable: false, kind: 'item' };
}
export async function ensureCatalogLoaded() { await loadCatalog(); return globalDictionaryCache.value; }
export const ensureWorkbenchDataLoaded = loadCoreData;
export function getJobName(id: number) { return localizeData(catalogData.value?.jobNames[id], 'Job #' + id); }
export function getPlaceName(id: number, fallback?: string) { return localizeData(sourceData.value?.places[id], fallback || 'Zone #' + id); }
export function getMapData(id: number) { return sourceData.value?.maps[id]; }
export async function searchItems(query: string): Promise<DictionaryItem[]> {
  await ensureCatalogLoaded();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return globalDictionaryCache.value.filter(item => item.craftable && (item.name.toLowerCase().includes(q) || item.enName?.toLowerCase().includes(q))).slice(0, 100);
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


export function getItemCategoryGroup(item: DictionaryItem): ItemCategoryGroup {
  const category = item.category;
  if (category === undefined) return 'other';

  for (const [group, categoryIds] of Object.entries(ITEM_CATEGORY_GROUPS)) {
    if (categoryIds.has(category)) return group as ItemCategoryGroup;
  }

  return 'other';
}

export async function getSearchableItems(): Promise<DictionaryItem[]> {
  await ensureCatalogLoaded();
  return (globalDictionaryCache.value || []).filter(item => item.craftable);
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

export async function filterSearchableItems(criteria: ItemFilterCriteria): Promise<DictionaryItem[]> {
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
