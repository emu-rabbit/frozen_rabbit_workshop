import { sourceData } from './gameData';

export type IslandOtherSource = 'islandGranary' | 'islandFarming' | 'islandPasture';

// Rare expedition materials, distinct from crops and pasture leavings.
// https://ffxiv.consolegameswiki.com/wiki/Island_Granary
const GRANARY_IDS = new Set([37578, 37579, 37580, 37581, 37582, 39894]);

export function getIslandOtherSource(itemId: number): IslandOtherSource | null {
  const production = sourceData.value?.islandProduction?.[itemId];
  if (production === 'crop') return 'islandFarming';
  if (production === 'pasture') return 'islandPasture';
  return GRANARY_IDS.has(itemId) ? 'islandGranary' : null;
}
