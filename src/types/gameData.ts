export type DataLocale = 'tw' | 'cn' | 'en' | 'ja';
export type DataNames = Partial<Record<DataLocale, string>>;
export type BundleName = 'catalog' | 'recipes' | 'sources';
export const BUNDLE_NAMES: BundleName[] = ['catalog', 'recipes', 'sources'];
export const DATA_FORMAT = 2;
export interface BundleDescriptor {
  file: string; sha256: string; bytes: number; jsonBytes: number; encoding: 'gzip'; records: number;
}
export interface DataManifest {
  generator: string; formatVersion: number; version: string;
  source: { repository: string; commit: string; files: Record<string, { bytes: number; sha256: string }> };
  bundles: Record<BundleName, BundleDescriptor>;
  notice: { file: string; sha256: string; bytes: number };
  patches?: { sha256: string; ids: string[] };
}
export interface CatalogItem {
  id: number; names: DataNames; icon: string; craftable: boolean;
  kind: 'item' | 'islandItem' | 'islandBuilding';
  ilvl?: number; category?: number; equipLevel?: number; equipJobs?: string[]; equipSlotCategory?: number;
}
export interface Recipe {
  id: number | string; result: number; yields: number; job: number; lvl: number; stars?: number;
  ingredients: { id: number; amount: number }[];
}
export interface CatalogBundle {
  formatVersion: number; items: CatalogItem[]; jobNames: Record<string, DataNames>; categories: Record<string, DataNames>;
}
export interface GatheringNode {
  items: number[]; hiddenItems: number[]; type: number; level?: number; stars?: number;
  zoneid?: number; map?: number; mapName?: string; x?: number; y?: number;
  limited?: boolean; spawns?: number[]; duration?: number;
}
export interface MonsterPosition {
  map?: number; zoneid?: number; level?: number; fate?: number; x?: number; y?: number; z?: number;
}
export interface SourceBundle {
  formatVersion: number;
  gatheringItems: Record<string, { itemId: number; level: number; stars: number }>;
  nodes: Record<string, GatheringNode>;
  maps: Record<string, { placename_id?: number; region_id?: number }>;
  places: Record<string, DataNames>;
  vendors: Record<string, { price: number; npcId: number; zoneId: number; coords?: { x: number; y: number } }[]>;
  npcs: Record<string, DataNames>; drops: Record<string, number[]>;
  monsters: Record<string, { positions: MonsterPosition[] }>; mobs: Record<string, DataNames>;
  islandGathering: Record<string, { itemId: number; x: number; y: number; z?: number; radius?: number }>;
}
export interface BundleData {
  catalog: CatalogBundle;
  recipes: { formatVersion: number; recipes: Recipe[] };
  sources: SourceBundle;
}
export interface CachedData {
  manifest: DataManifest;
  bytes: Record<BundleName, ArrayBuffer>;
}
