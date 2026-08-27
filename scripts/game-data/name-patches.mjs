import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HASH_PATTERN, SHA_PATTERN, sha256 } from './source.mjs';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// This first patch schema only supports Traditional Chinese island names.
export function validateNamePatches(patches) {
  if (!Array.isArray(patches)) throw new Error('Name patches must be an array');
  const ids = new Set(), targets = new Set();
  for (const patch of patches) {
    if (!patch || patch.schemaVersion !== 1 || !nonempty(patch.id) || !/^[a-z0-9-]+$/.test(patch.id)
      || patch.locale !== 'tw'
      || !nonempty(patch.reason) || !/^\d{4}-\d{2}-\d{2}$/.test(patch.verifiedAt || '')
      || !SHA_PATTERN.test(patch.teamcraftCommit || '')
      || !/^[\w.-]+\/[\w.-]+$/.test(patch.source?.repository || '')
      || !SHA_PATTERN.test(patch.source?.commit || '')
      || !['MJIBuilding.csv', 'MJILandmark.csv', 'MJIText.csv'].every(file => HASH_PATTERN.test(patch.source?.files?.[file] || ''))
      || !Array.isArray(patch.entries) || !patch.entries.length) {
      throw new Error(`Invalid name patch: ${patch?.id || 'unknown'}`);
    }
    if (ids.has(patch.id)) throw new Error(`Duplicate name patch ID: ${patch.id}`);
    ids.add(patch.id);
    for (const entry of patch.entries) {
      const building = entry?.table === 'MJIBuilding.csv';
      const validRow = typeof entry?.row === 'string' && (building ? /^\d+\.\d+$/.test(entry.row) : /^\d+$/.test(entry.row));
      const parts = validRow ? entry.row.split('.').map(Number) : [];
      const itemId = building ? -10000 - parts[0] * 100 - parts[1] * 10 : -11000 - parts[0] * 10;
      const recipeId = `mji-${building ? 'building' : 'landmark'}-${entry?.row}`;
      if (!entry || !['MJIBuilding.csv', 'MJILandmark.csv'].includes(entry.table) || !validRow
        || !Number.isSafeInteger(entry.itemId) || entry.itemId >= 0 || entry.itemId !== itemId
        || entry.recipeId !== recipeId || !nonempty(entry.expectedEnglish)
        || !(entry.expected === null || nonempty(entry.expected)) || !nonempty(entry.value)
        || !Number.isSafeInteger(entry.textId) || entry.textId <= 0) {
        throw new Error(`Invalid name patch entry: ${patch.id}/${entry?.itemId}`);
      }
      const target = `${entry.itemId}/${patch.locale}`;
      if (targets.has(target)) throw new Error(`Duplicate name patch target: ${target}`);
      targets.add(target);
    }
  }
  return [...patches].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export async function readNamePatches(directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/game-data-patches')) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
  return validateNamePatches(await Promise.all(files.map(async file => JSON.parse(await readFile(path.join(directory, file), 'utf8')))));
}

export function describeNamePatches(patches) {
  const ordered = validateNamePatches(patches);
  return ordered.length ? { sha256: sha256(Buffer.from(JSON.stringify(ordered))), ids: ordered.map(patch => patch.id) } : undefined;
}

export function applyNamePatches(bundles, patches) {
  const ordered = validateNamePatches(patches);
  const items = new Map(bundles.catalog.items.map(item => [item.id, item]));
  const recipes = new Map(bundles.recipes.recipes.map(recipe => [recipe.id, recipe]));
  const replacements = new Map();
  const report = { applied: [], upstreamResolved: [] };
  for (const patch of ordered) for (const entry of patch.entries) {
    const item = items.get(entry.itemId), recipe = recipes.get(entry.recipeId);
    const label = `${patch.id}/${entry.itemId}/${patch.locale}`;
    if (!item || item.kind !== 'islandBuilding' || item.names.en !== entry.expectedEnglish
      || recipe?.result !== entry.itemId || recipe.job !== -10) {
      throw new Error(`Name patch target changed or missing: ${label}`);
    }
    const current = item.names[patch.locale] ?? null;
    if (current === entry.value) { report.upstreamResolved.push(label); continue; }
    if (current !== entry.expected) {
      throw new Error(`Name patch conflict: ${label}; expected ${JSON.stringify(entry.expected)}, found ${JSON.stringify(current)}`);
    }
    const updated = replacements.get(item.id) || { ...item, names: { ...item.names } };
    updated.names[patch.locale] = entry.value;
    replacements.set(item.id, updated);
    report.applied.push(label);
  }
  return {
    bundles: { ...bundles, catalog: { ...bundles.catalog, items: bundles.catalog.items.map(item => replacements.get(item.id) || item) } },
    report,
  };
}

// CLI verification compares only the current generation with today's patch files.
// Previous generations remain independently verifiable after patches change or retire.
export function verifyNamePatchCatalog(manifest, catalog, patches) {
  if (JSON.stringify(manifest.patches) !== JSON.stringify(describeNamePatches(patches))) {
    throw new Error('Name patches differ from generated data; run data:generate');
  }
  const items = new Map(catalog.items.map(item => [item.id, item]));
  for (const patch of patches) for (const entry of patch.entries) {
    const item = items.get(entry.itemId);
    if (item?.names[patch.locale] !== entry.value || item.names.en !== entry.expectedEnglish) {
      throw new Error(`Generated name patch missing: ${patch.id}/${entry.itemId}`);
    }
  }
}
