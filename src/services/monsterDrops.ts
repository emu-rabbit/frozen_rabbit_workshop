import { ensurePlacesLoaded, getPlaceName, ensureMapsLoaded, getMapData, getCurrentLanguage } from './dictionary';

const TEAMCRAFT_BRANCH = import.meta.env.VITE_TEAMCRAFT_BRANCH ?? 'staging';
const BASE_URL = `https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/${TEAMCRAFT_BRANCH}/libs/data/src/lib/json`;
const DROP_SOURCES_URL = `${BASE_URL}/drop-sources.json`;
const MONSTERS_URL = `${BASE_URL}/monsters.json`;
const MOBS_URL = `${BASE_URL}/mobs.json`;
const TW_MOBS_URL = `${BASE_URL}/tw/tw-mobs.json`;
const ZH_MOBS_URL = `${BASE_URL}/zh/zh-mobs.json`;

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

interface MonsterRaw {
  baseid?: number;
  positions?: MonsterPositionRaw[];
}

type LocalizedMobName = {
  en?: string;
  ja?: string;
  tw?: string;
  zh?: string;
  [key: string]: string | undefined;
};

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

let dropSourcesCache: Record<string, number[]> | null = null;
let monstersCache: Record<string, MonsterRaw> | null = null;
let mobsCache: Record<string, LocalizedMobName> | null = null;
let twMobsCache: Record<string, LocalizedMobName> | null = null;
let zhMobsCache: Record<string, LocalizedMobName> | null = null;
let loadPromise: Promise<void> | null = null;

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

export async function ensureMonsterDropDataLoaded(): Promise<void> {
  await Promise.all([ensurePlacesLoaded(), ensureMapsLoaded()]);

  if (dropSourcesCache !== null && monstersCache !== null && mobsCache !== null) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      console.log('[MonsterDrops] Loading monster drop data...');
      const [dropRes, monstersRes, mobsRes, twMobsRes, zhMobsRes] = await Promise.all([
        fetch(DROP_SOURCES_URL),
        fetch(MONSTERS_URL),
        fetch(MOBS_URL),
        fetch(TW_MOBS_URL),
        fetch(ZH_MOBS_URL),
      ]);

      if (!dropRes.ok || !monstersRes.ok || !mobsRes.ok) {
        throw new Error('Failed to fetch monster drop data files');
      }

      const [dropSources, monsters, mobs, twMobs, zhMobs] = await Promise.all([
        dropRes.json(),
        monstersRes.json(),
        mobsRes.json(),
        twMobsRes.ok ? twMobsRes.json() : Promise.resolve({}),
        zhMobsRes.ok ? zhMobsRes.json() : Promise.resolve({}),
      ]);

      dropSourcesCache = dropSources;
      monstersCache = monsters;
      mobsCache = mobs;
      twMobsCache = twMobs;
      zhMobsCache = zhMobs;
      console.log('[MonsterDrops] Monster drop data loaded.');
    } catch (err) {
      console.error('[MonsterDrops] Failed to load monster drop data:', err);
      dropSourcesCache = {};
      monstersCache = {};
      mobsCache = {};
      twMobsCache = {};
      zhMobsCache = {};
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

function getMonsterName(monsterId: number): string {
  const key = String(monsterId);
  const lang = getCurrentLanguage();

  if (lang === 'tw') {
    return twMobsCache?.[key]?.tw || mobsCache?.[key]?.en || `Monster #${monsterId}`;
  }

  if (lang === 'cn') {
    return zhMobsCache?.[key]?.zh || mobsCache?.[key]?.en || `Monster #${monsterId}`;
  }

  if (lang === 'ja') {
    return mobsCache?.[key]?.ja || mobsCache?.[key]?.en || `Monster #${monsterId}`;
  }

  return mobsCache?.[key]?.en || `Monster #${monsterId}`;
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
  if (!dropSourcesCache || !monstersCache || !mobsCache) return null;

  const monsterIds = dropSourcesCache[String(itemId)];
  if (!monsterIds || monsterIds.length === 0) return null;

  const drops = monsterIds.map(monsterId => {
    const monster = monstersCache?.[String(monsterId)];
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
