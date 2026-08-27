import { getPlaceName, getMapData, localizeData } from './dictionary';
import { sourceData } from './gameData';
import type { SourceBundle } from '../types/gameData';
export interface GatheringInfo {
  island?: boolean;
  type: number;        // 0=採礦工, 1=園藝工, 2=釣魚人
  jobName: string;
  level: number;
  stars: number;
  zoneName?: string;
  parentZoneName?: string;
  regionName?: string;
  x?: number;
  y?: number;
  isLimited: boolean;  // 是否為定時節點
  spawns: number[];    // 艾俄澤亞出沒時間 (0-23)
  duration: number;    // 持續時間 (艾俄澤亞分鐘)
}


let indexed: SourceBundle | null = null;
let fullItemToNodesMap: Record<number, number[]> = {};
let itemToGatheringData: Record<number, { level: number; stars: number }> = {};
const GATHER_JOB_NAMES: Record<number, string> = {
  0: 'jobs.min',
  1: 'jobs.min',
  2: 'jobs.btn',
  3: 'jobs.btn',
  4: 'jobs.fsh',
};


export function getGatheringInfo(itemId: number): GatheringInfo | null {
  const data = sourceData.value;
  if (!data) return null;
  const island = data.islandGathering[itemId];
  if (island) return { island: true, type: -10, jobName: 'jobs.islandGathering', level: 0, stars: 0,
    zoneName: localizeData({ tw: '無人島', cn: '无人岛', en: 'Island Sanctuary', ja: '無人島' }),
    x: island.x, y: island.y, isLimited: false, spawns: [], duration: 0 };
  if (indexed !== data) {
    indexed = data; fullItemToNodesMap = {}; itemToGatheringData = {};
    for (const entry of Object.values(data.gatheringItems)) itemToGatheringData[entry.itemId] = entry;
    for (const [key, node] of Object.entries(data.nodes)) for (const id of [...node.items, ...node.hiddenItems]) {
      (fullItemToNodesMap[id] ||= []).push(Number(key));
    }
  }
  const nodesCache = data.nodes;

  // 使用完整反向索引，並保留上游節點順序與既有第一個來源的選擇方式。
  const nodeIds = fullItemToNodesMap[itemId];
  if (!nodeIds || nodeIds.length === 0) return null;

  const node = nodesCache[nodeIds[0]];

  if (!node) return null;

  // 映射地名
  const zoneName = node.zoneid ? getPlaceName(node.zoneid, node.mapName) : node.mapName;
  
  // 映射階層地名 (Parent & Region)
  let parentZoneName: string | undefined;
  let regionName: string | undefined;

  if (node.map) {
      const mapData = getMapData(node.map);
      if (mapData) {
          if (mapData.placename_id) {
              parentZoneName = getPlaceName(mapData.placename_id);
          }
          if (mapData.region_id) {
              regionName = getPlaceName(mapData.region_id);
          }
      }
  }

  // 優先使用項目特定的 level/stars，若無則從節點資料中提取
  const itemData = itemToGatheringData[itemId];
  const level = itemData?.level || node.level || 1;
  const stars = itemData?.stars || node.stars || 0;

  return {
    type: node.type,
    jobName: GATHER_JOB_NAMES[node.type] || '採集',
    level,
    stars,
    zoneName,
    parentZoneName,
    regionName,
    x: node.x,
    y: node.y,
    isLimited: !!node.limited || !!node.spawns?.length,
    spawns: node.spawns || [],
    duration: node.duration || 0,
  };
}
