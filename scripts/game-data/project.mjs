// Data-only projection. Keep browser loading, IndexedDB and publishing outside this module.
export const FORMAT_VERSION = 2;
export const SOURCE_FILES = [
  'item-search.index', 'equipment.json', 'job-name.json', 'item-category.json',
  'recipes.json', 'items.json', 'tw/tw-items.json', 'zh/zh-items.json', 'item-icons.json',
  'gathering-items.json', 'nodes.json', 'maps.json', 'places.json', 'tw/tw-places.json', 'zh/zh-places.json',
  'shops.json', 'npcs.json', 'tw/tw-npcs.json', 'zh/zh-npcs.json',
  'drop-sources.json', 'monsters.json', 'mobs.json', 'tw/tw-mobs.json', 'zh/zh-mobs.json',
  'island-gathering-items.json',
];
export const LOCALES = ['tw', 'cn', 'en', 'ja'];

export function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}: expected an object`);
  }
  return value;
}

function array(value, label, nonempty = false) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) {
    throw new Error(`${label}: expected ${nonempty ? 'a nonempty' : 'an'} array`);
  }
  return value;
}

function number(value, label, { integer = true, min = 0 } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || (integer && !Number.isSafeInteger(value)) || value < min) {
    throw new Error(`${label}: invalid number ${JSON.stringify(value)}`);
  }
  return value;
}

function id(value, label) {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) value = Number(value);
  return number(value, label, { min: Number.MIN_SAFE_INTEGER });
}

function text(value, label) {
  if (typeof value !== 'string') throw new Error(`${label}: expected a string`);
  return value;
}

function optionalNumber(value, label) {
  return value === undefined || value === null ? undefined : number(value, label);
}

// Retain only Workshop's four languages. Missing translations stay missing.
function names(entry, label, stringLocale = 'en') {
  if (typeof entry === 'string') return entry ? { [stringLocale]: entry } : {};
  object(entry, label);
  const result = {};
  for (const locale of LOCALES) {
    const value = entry[locale === 'cn' ? 'zh' : locale];
    if (value !== undefined && value !== null) {
      text(value, `${label}.${locale}`);
      if (value) result[locale] = value;
    }
  }
  return result;
}

function localizedTable(table, label) {
  return Object.fromEntries(Object.entries(table).map(([key, entry]) => [key, names(entry, `${label}[${key}]`)]));
}

export function normalizeIcon(iconPath = '') {
  const path = text(iconPath, 'icon').trim();
  if (!path) return '';
  if (path.startsWith('https://xivapi.com/api/asset')) {
    return `https://v2.xivapi.com${path.slice('https://xivapi.com'.length)}`;
  }
  if (path.startsWith('/api/asset')) return `https://v2.xivapi.com${path}`;
  if (path.startsWith('api/asset')) return `https://v2.xivapi.com/${path}`;
  return path.startsWith('http') ? path : `https://xivapi.com${path}`;
}

function searchIcon(entry) {
  if (entry.data?.icon) return normalizeIcon(entry.data.icon);
  if (!entry.iconId) return '';
  const iconId = text(entry.iconId, 'item-search.index.iconId');
  const folder = iconId.slice(0, 3).padEnd(3, '0');
  return normalizeIcon(`/i/${folder}000/${iconId}_hr1.png`);
}

const pick = (entry, keys) => Object.fromEntries(keys.filter(k => entry[k] !== undefined).map(k => [k, entry[k]]));

export function projectGameData(sources) {
  for (const file of SOURCE_FILES) {
    if (['recipes.json', 'item-search.index', 'shops.json'].includes(file)) array(sources[file], file, true);
    else {
      object(sources[file], file);
      if (!Object.keys(sources[file]).length) throw new Error(`${file}: empty source`);
    }
  }
  const diagnostics = { excludedZeroRecipes: [], removedZeroAmountIngredients: 0, missingRecipeItemIds: [] };
  const seen = new Set();
  const islandIds = new Set(Object.keys(sources['island-gathering-items.json']).map(Number));
  const recipes = [];
  for (const r of sources['recipes.json']) {
    if (!['number', 'string'].includes(typeof r.id) || !String(r.id)) throw new Error('Invalid recipe ID');
    if (seen.has(String(r.id))) throw new Error(`duplicate recipe ID ${r.id}`);
    seen.add(String(r.id));
    const result = id(r.result, 'recipe.result');
    if (result === 0) { diagnostics.excludedZeroRecipes.push(r.id); continue; }
    if (result < 0 && r.job !== -10) throw new Error(`Unknown negative recipe result: ${result}`);
    const ingredients = array(r.ingredients, 'recipe.ingredients').map(i => ({
      id: number(i.id, 'ingredient.id', { min: 1 }), amount: number(i.amount, 'ingredient.amount'),
    })).filter(i => {
      if (i.amount === 0) diagnostics.removedZeroAmountIngredients++;
      return i.amount > 0;
    });
    if (r.job === -10) [result, ...ingredients.map(i => i.id)].forEach(i => islandIds.add(i));
    recipes.push({ id: r.id, result, yields: number(r.yields, 'recipe.yields', { min: 1 }),
      job: number(r.job, 'recipe.job', { min: -10 }), lvl: number(r.lvl, 'recipe.lvl'),
      stars: optionalNumber(r.stars, 'recipe.stars'), ingredients });
  }
  const results = new Set(recipes.map(r => r.result));
  const wanted = new Set(recipes.flatMap(r => [r.result, ...r.ingredients.map(i => i.id)]));
  const index = new Map();
  for (const entry of sources['item-search.index']) {
    const itemId = id(entry.data?.itemId ?? entry.id, 'search.itemId');
    if (!wanted.has(itemId)) continue;
    const previous = index.get(itemId);
    index.set(itemId, {
      ...previous, id: itemId, names: { ...previous?.names, ...names(entry, 'search') },
      icon: searchIcon(entry) || previous?.icon || '',
      ilvl: entry.ilvl ?? entry.data?.ilvl ?? previous?.ilvl,
      category: entry.category ?? previous?.category,
    });
  }
  const items = [];
  // Preserve search order; append any recipe-only metadata after it.
  for (const itemId of new Set([...index.keys(), ...wanted])) {
    const entry = index.get(itemId) || { id: itemId, names: {}, icon: '' };
    for (const [file, locale] of [['items.json', 'en'], ['tw/tw-items.json', 'tw'], ['zh/zh-items.json', 'cn']]) {
      if (sources[file][itemId] !== undefined) Object.assign(entry.names, names(sources[file][itemId], file, locale));
    }
    if (!Object.keys(entry.names).length) diagnostics.missingRecipeItemIds.push(itemId);
    const equipment = sources['equipment.json'][itemId];
    items.push({ ...entry, icon: normalizeIcon(sources['item-icons.json'][itemId] || '') || entry.icon,
      craftable: results.has(itemId), kind: itemId < 0 ? 'islandBuilding' : islandIds.has(itemId) ? 'islandItem' : 'item',
      equipLevel: equipment?.level, equipJobs: equipment?.jobs, equipSlotCategory: equipment?.equipSlotCategory });
  }
  if (diagnostics.missingRecipeItemIds.length) throw new Error(`Missing recipe item metadata: ${diagnostics.missingRecipeItemIds.join(', ')}`);

  const mapIds = new Set(), placeIds = new Set();
  const nodes = {};
  for (const [key, node] of Object.entries(sources['nodes.json'])) {
    const nodeItems = (node.items || []).filter(i => wanted.has(i));
    const hiddenItems = (node.hiddenItems || []).filter(i => wanted.has(i));
    if (!nodeItems.length && !hiddenItems.length) continue;
    nodes[key] = { ...pick(node, ['type', 'level', 'stars', 'zoneid', 'map', 'mapName', 'x', 'y', 'limited', 'spawns', 'duration']), items: nodeItems, hiddenItems };
    if (node.map) mapIds.add(node.map);
    if (node.zoneid) placeIds.add(node.zoneid);
  }
  const gatheringItems = Object.fromEntries(Object.entries(sources['gathering-items.json'])
    .filter(([, v]) => wanted.has(v.itemId)).map(([key, v]) => [key, pick(v, ['itemId', 'level', 'stars'])]));
  const vendors = {}, npcIds = new Set();
  for (const shop of sources['shops.json']) {
    const ids = Array.isArray(shop.npcs) ? shop.npcs : shop.npcId ? [shop.npcId] : [];
    for (const trade of shop.trades || []) {
      const gil = trade.currencies?.find(c => c.id === 1);
      if (!gil) continue;
      for (const item of trade.items || []) {
        if (!wanted.has(item.id)) continue;
        for (const rawId of ids) {
          const npcId = Number(rawId), position = sources['npcs.json'][npcId]?.position;
          const rows = vendors[item.id] ||= [];
          if (rows.some(v => v.npcId === npcId && v.price === gil.amount)) continue;
          rows.push({ price: gil.amount, npcId, zoneId: position?.zoneid || 0,
            coords: position ? { x: position.x, y: position.y } : undefined });
          npcIds.add(npcId);
          if (position?.zoneid) placeIds.add(position.zoneid);
        }
      }
    }
  }
  for (const rows of Object.values(vendors)) rows.sort((a,b) => a.price - b.price || a.npcId - b.npcId);
  const drops = Object.fromEntries(Object.entries(sources['drop-sources.json']).filter(([key]) => wanted.has(Number(key))));
  const monsterIds = new Set(Object.values(drops).flat());
  const monsters = {};
  for (const monsterId of monsterIds) {
    monsters[monsterId] = { positions: (sources['monsters.json'][monsterId]?.positions || []).map(p => {
      if (p.map) mapIds.add(p.map);
      if (p.zoneid) placeIds.add(p.zoneid);
      return pick(p, ['map', 'zoneid', 'level', 'fate', 'x', 'y', 'z']);
    }) };
  }
  const maps = {};
  for (const mapId of mapIds) {
    const map = sources['maps.json'][mapId];
    if (!map) continue;
    maps[mapId] = pick(map, ['placename_id', 'region_id']);
    if (map.placename_id) placeIds.add(map.placename_id);
    if (map.region_id) placeIds.add(map.region_id);
  }
  const mergedNames = (ids, file, suffix) => Object.fromEntries([...ids].map(key => {
    const result = {};
    for (const [source, locale] of [[file, 'en'], [`tw/tw-${suffix}.json`, 'tw'], [`zh/zh-${suffix}.json`, 'cn']]) {
      if (sources[source]?.[key] !== undefined) Object.assign(result, names(sources[source][key], source, locale));
    }
    return [key, result];
  }));
  return { bundles: {
    catalog: { formatVersion: FORMAT_VERSION, items,
      jobNames: localizedTable(sources['job-name.json'], 'jobs'), categories: localizedTable(sources['item-category.json'], 'categories') },
    recipes: { formatVersion: FORMAT_VERSION, recipes },
    sources: { formatVersion: FORMAT_VERSION, gatheringItems, nodes, maps,
      places: mergedNames(placeIds, 'places.json', 'places'), vendors,
      npcs: mergedNames(npcIds, 'npcs.json', 'npcs'), drops, monsters,
      mobs: mergedNames(monsterIds, 'mobs.json', 'mobs'),
      islandGathering: Object.fromEntries(Object.entries(sources['island-gathering-items.json']).filter(([key]) => wanted.has(Number(key)))) },
  }, diagnostics };
}
