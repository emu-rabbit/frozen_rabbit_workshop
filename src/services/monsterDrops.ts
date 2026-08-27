import { getPlaceName, getMapData, localizeData } from './dictionary';
import { sourceData } from './gameData';
interface MonsterPositionRaw {
  map?: number;
  zoneid?: number;
  level?: number;
  hp?: number;
  fate?: number;
  x?: number;
  y?: number;
  z?: number;
}


export interface MonsterDropPosition {
  mapId?: number;
  zoneId?: number;
  level: number;
  x?: number;
  y?: number;
  z?: number;
  fate?: number;
  regionName?: string;
  zoneName?: string;
  parentZoneName?: string;
}

export interface MonsterDropInfo {
  monsterId: number;
  monsterName: string;
  level: number;
  regionName?: string;
  zoneName?: string;
  parentZoneName?: string;
  mapId?: number;
  zoneId?: number;
  positions: MonsterDropPosition[];
}

function isKnownLevel(level: number | null | undefined): level is number {
  return typeof level === 'number' && Number.isFinite(level) && level > 0;
}

function compareKnownLevelAsc(a: number | null | undefined, b: number | null | undefined): number {
  const aKnown = isKnownLevel(a);
  const bKnown = isKnownLevel(b);
  if (aKnown !== bKnown) return aKnown ? -1 : 1;
  if (aKnown && bKnown && a !== b) return a - b;
  return 0;
}

function getLowestKnownLevel(positions: MonsterDropPosition[]): number {
  const levels = positions.map(position => position.level).filter(isKnownLevel);
  return levels.length > 0 ? Math.min(...levels) : 0;
}

function getMonsterName(monsterId: number): string {
  return localizeData(sourceData.value?.mobs[monsterId], 'Monster #' + monsterId);
}

function resolvePosition(position: MonsterPositionRaw): MonsterDropPosition {
  const mapId = position.map;
  const mapData = mapId ? getMapData(mapId) : undefined;
  const zoneId = position.zoneid ?? mapData?.placename_id;
  const zoneName = zoneId ? getPlaceName(zoneId) : undefined;
  const parentZoneName = mapData?.placename_id ? getPlaceName(mapData.placename_id) : zoneName;
  const regionName = mapData?.region_id ? getPlaceName(mapData.region_id) : undefined;

  return {
    mapId,
    zoneId,
    level: position.level || 0,
    x: position.x,
    y: position.y,
    z: position.z,
    fate: position.fate,
    regionName,
    zoneName,
    parentZoneName,
  };
}

function sortPositions(a: MonsterDropPosition, b: MonsterDropPosition): number {
  const aIsFate = a.fate && a.fate !== 0 ? 1 : 0;
  const bIsFate = b.fate && b.fate !== 0 ? 1 : 0;
  if (aIsFate !== bIsFate) return aIsFate - bIsFate;

  const levelSort = compareKnownLevelAsc(a.level, b.level);
  if (levelSort !== 0) return levelSort;

  const aHasCoords = a.x !== undefined && a.y !== undefined ? 1 : 0;
  const bHasCoords = b.x !== undefined && b.y !== undefined ? 1 : 0;
  if (aHasCoords !== bHasCoords) return bHasCoords - aHasCoords;

  if ((a.regionName || '') !== (b.regionName || '')) return (a.regionName || '').localeCompare(b.regionName || '');
  if ((a.parentZoneName || '') !== (b.parentZoneName || '')) return (a.parentZoneName || '').localeCompare(b.parentZoneName || '');
  if ((a.zoneName || '') !== (b.zoneName || '')) return (a.zoneName || '').localeCompare(b.zoneName || '');
  return 0;
}

function sortDrops(a: MonsterDropInfo, b: MonsterDropInfo): number {
  const aPos = a.positions[0];
  const bPos = b.positions[0];
  if (!aPos && !bPos) return a.monsterId - b.monsterId;
  if (!aPos) return 1;
  if (!bPos) return -1;

  const posSort = sortPositions(aPos, bPos);
  if (posSort !== 0) return posSort;
  return a.monsterName.localeCompare(b.monsterName);
}

export function getMonsterDropInfo(itemId: number): MonsterDropInfo[] | null {
  if (!sourceData.value) return null;

  const monsterIds = sourceData.value.drops[itemId];
  if (!monsterIds || monsterIds.length === 0) return null;

  const drops = monsterIds.map(monsterId => {
    const monster = sourceData.value?.monsters[monsterId];
    const positions = (monster?.positions || [])
      .map(resolvePosition)
      .sort(sortPositions);
    const primary = positions[0];
    const level = getLowestKnownLevel(positions);

    return {
      monsterId,
      monsterName: getMonsterName(monsterId),
      level,
      regionName: primary?.regionName,
      zoneName: primary?.zoneName,
      parentZoneName: primary?.parentZoneName,
      mapId: primary?.mapId,
      zoneId: primary?.zoneId,
      positions,
    };
  });

  return drops.sort(sortDrops);
}

export function getMonsterDropPreferredLevel(drops: MonsterDropInfo[] | null | undefined): number | null {
  if (!drops || drops.length === 0) return null;
  const levels = drops.map(drop => drop.level).filter(isKnownLevel);
  if (levels.length === 0) return null;
  return Math.min(...levels);
}

export function getMonsterDropMaxLevel(drops: MonsterDropInfo[] | null | undefined): number | null {
  return getMonsterDropPreferredLevel(drops);
}
