import { SOURCE_FILES } from '../../scripts/game-data/project.mjs';
import { createPackages } from '../../scripts/game-data/package.mjs';
import { REPOSITORY } from '../../scripts/game-data/source.mjs';

export function sourceFixture() {
  const sources = Object.fromEntries(SOURCE_FILES.map(file => [file, { 1: {} }]));
  return Object.assign(sources, {
    'item-search.index': [
      { id: 999, data: { itemId: 10, ilvl: 90 }, en: 'Old sword', tw: '舊劍', iconId: '000001', category: 1 },
      { id: 20, en: 'Ore', zh: '矿石', ja: '鉱石', craftable: false },
      { id: 998, data: { itemId: 10 }, tw: '新劍' },
      { id: -10000, en: 'Cozy Cabin I', data: { itemId: -10000, icon: '/api/asset?path=cabin' } },
    ],
    'equipment.json': { 10: { level: 50, jobs: ['CRP'], equipSlotCategory: 1, stats: { discarded: 999 } } },
    'job-name.json': { 8: { en: 'Carpenter', tw: '木工師', zh: '刻木匠', ja: '木工師', fr: 'discarded' } },
    'item-category.json': { 1: { en: 'Weapon', tw: '武器', zh: '武器', ja: '武器' } },
    'recipes.json': [
      { id: 1, result: 10, yields: 1, job: 8, lvl: 50, stars: 2, difficulty: 999, ingredients: [{ id: 20, amount: 2 }] },
      { id: 2, result: 10, yields: 2, job: 8, lvl: 50, ingredients: [] },
      { id: 'mji-building-0.0', result: -10000, yields: 1, job: -10, lvl: 1, ingredients: [{ id: 20, amount: 3 }, { id: 30, amount: 0 }] },
      { id: 4, result: 0, yields: 0, job: 0, lvl: 0, ingredients: [] },
    ],
    'items.json': { 10: { en: 'Sword', ja: '剣' }, 20: { en: 'Ore', ja: '鉱石' }, 30: { en: 'Unused' } },
    'tw/tw-items.json': { 10: '劍', 30: '額外物品' },
    'zh/zh-items.json': { 10: { zh: '剑' } },
    'item-icons.json': { 10: '/i/000000/000001.png', 30: '/api/asset?path=extra' },
    'shops.json': [{ npcs: [1], trades: [{ currencies: [{ id: 1, amount: 5 }], items: [{ id: 20, amount: 1 }] }] }],
    'npcs.json': { 1: { en: 'Merchant', position: { zoneid: 1, x: 1, y: 2 } } },
    'nodes.json': { 1: { items: [20, 30], hiddenItems: [], type: 0, map: 1, zoneid: 1, x: 1, y: 2 } },
    'gathering-items.json': { 1: { itemId: 20, level: 1, stars: 0 } },
    'maps.json': { 1: { placename_id: 1, region_id: 2, discarded: true } },
    'places.json': { 1: { en: 'Place' }, 2: { en: 'Region' } },
    'drop-sources.json': { 20: [1] },
    'monsters.json': { 1: { positions: [{ map: 1, zoneid: 1, level: 1, hp: 999, x: 1, y: 2 }] } },
    'mobs.json': { 1: { en: 'Monster', ja: 'モンスター' } },
    'island-gathering-items.json': { 20: { itemId: 20, x: 10, y: 20 } },
    LICENSE: 'MIT License\nFixture copyright notice\nPermission is hereby granted\n',
  });
}
export function fixturePackages(sources = sourceFixture(), namePatches = []) {
  return createPackages({ sources, metadata: { repository: REPOSITORY, commit: 'a'.repeat(40), files: {} } }, namePatches);
}
