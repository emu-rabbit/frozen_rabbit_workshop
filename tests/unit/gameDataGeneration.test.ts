import { sourceFixture } from '../fixtures/gameData.mjs';
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateSync, gunzipSync } from 'node:zlib';
import { projectGameData, SOURCE_FILES } from '../../scripts/game-data/project.mjs';
import { downloadSnapshot, readSnapshot, REPOSITORY, SNAPSHOT_FILES } from '../../scripts/game-data/source.mjs';
import { createPackages, verifyPackages, writePackages } from '../../scripts/game-data/package.mjs';
import { parseOptions } from '../../scripts/generate-game-data.mjs';
import { applyNamePatches, readNamePatches, validateNamePatches, verifyNamePatchCatalog } from '../../scripts/game-data/name-patches.mjs';

const checkedInPatches = await readNamePatches();
function cabinPatch() {
  const patch = structuredClone(checkedInPatches[0]);
  patch.entries = patch.entries.slice(0, 1);
  return [patch];
}

const commit = 'a'.repeat(40);
const temporaryDirectories: string[] = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), 'workshop-game-data-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const directory of temporaryDirectories.splice(0)) {
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) !== path.resolve(tmpdir())
      || !path.basename(resolved).startsWith('workshop-game-data-test-')) {
      throw new Error('Refusing to remove a non-test directory');
    }
    await rm(resolved, { recursive: true, force: true });
  }
});

const fixture = sourceFixture;

function snapshot(sources = fixture()) {
  return { sources, metadata: { repository: REPOSITORY, commit, files: {} } };
}

function mockFetch(sources = fixture(), failFile?: string) {
  return vi.fn(async (url: string) => {
    if (url.startsWith('https://api.github.com/')) return Response.json({ sha: commit });
    const file = SNAPSHOT_FILES.find((candidate: string) => url.endsWith(`/${candidate}`));
    if (!file || file === failFile) return new Response('missing', { status: 404 });
    const bytes = file === 'LICENSE' ? sources[file] : file.endsWith('.index')
      ? deflateSync(JSON.stringify(sources[file])) : JSON.stringify(sources[file]);
    return new Response(bytes);
  });
}

describe('game data projection', () => {
  it('projects crop IDs and both animal rewards without classifying seeds or unrelated items', () => {
    const sources = fixture();
    sources['recipes.json'][2].ingredients.push(...[37596, 37603, 37611, 37586].map(id => ({ id, amount: 1 })));
    for (const id of [37596, 37603, 37611, 37586]) sources['items.json'][id] = { en: String(id) };
    const { bundles } = projectGameData(sources);
    expect(bundles.sources.islandProduction).toEqual({ 37596: 'crop', 37603: 'pasture', 37611: 'pasture' });
    expect(bundles.catalog.items.find((i: any) => i.id === 37596).kind).toBe('islandItem');
    expect(bundles.sources.islandProduction[37586]).toBeUndefined();
    const conflict = fixture();
    conflict['island-animals.json'][1].rewards.push(37596);
    expect(() => projectGameData(conflict)).toThrow('Conflicting island source');
    const malformed = fixture();
    malformed['island-animals.json'][1].rewards = [0];
    expect(() => projectGameData(malformed)).toThrow('island animal reward');
  });

  it('keeps the crafting closure, canonical IDs, true locale names and valid island recipes', () => {
    const sources = fixture(); const before = structuredClone(sources);
    const { bundles, diagnostics } = projectGameData(sources);
    expect(bundles.catalog.items.map((i: any) => i.id)).toEqual([10, 20, -10000]);
    expect(bundles.catalog.items[0]).toMatchObject({ id: 10, names: { tw: '劍', cn: '剑', en: 'Sword', ja: '剣' }, craftable: true, ilvl: 90, equipLevel: 50 });
    expect(bundles.catalog.items[2]).toMatchObject({ kind: 'islandBuilding', names: { en: 'Cozy Cabin I' } });
    expect(bundles.recipes.recipes.map((r: any) => r.id)).toEqual([1, 2, 'mji-building-0.0']);
    expect(bundles.recipes.recipes[0]).not.toHaveProperty('difficulty');
    expect(bundles.recipes.recipes[2].ingredients).toEqual([{ id: 20, amount: 3 }]);
    expect(diagnostics.excludedZeroRecipes).toEqual([4]);
    expect(diagnostics.removedZeroAmountIngredients).toBe(1);
    expect(bundles.sources.nodes['1'].items).toEqual([20]);
    expect(bundles.sources.monsters['1'].positions[0]).not.toHaveProperty('hp');
    expect(bundles.sources.places['2'].en).toBe('Region');
    expect(sources).toEqual(before);
  });

  it.each(SOURCE_FILES)('rejects missing or empty required source %s', (file: string) => {
    const sources = fixture();
    delete sources[file];
    expect(() => projectGameData(sources)).toThrow();
    sources[file] = file.endsWith('.index') || file === 'recipes.json' ? [] : {};
    expect(() => projectGameData(sources)).toThrow();
  });

  it('rejects malformed IDs, duplicate recipe IDs and invalid counts', () => {
    const sources = fixture();
    sources['item-search.index'][0].data.itemId = 'not-an-id';
    expect(() => projectGameData(sources)).toThrow('itemId');
    const duplicates = fixture();
    duplicates['recipes.json'][1].id = 1;
    expect(() => projectGameData(duplicates)).toThrow('duplicate recipe ID');
    const negative = fixture();
    negative['recipes.json'][0].ingredients[0].amount = -1;
    expect(() => projectGameData(negative)).toThrow('amount');
  });

});

describe('island name patches', () => {
  it('changes only the requested locale after name merging without mutating the source', () => {
    const sources = fixture();
    const before = structuredClone(sources);
    const projected = projectGameData(sources);
    const patched = applyNamePatches(projected.bundles, cabinPatch());
    const expected = structuredClone(projected.bundles);
    expected.catalog.items.find((item: any) => item.id === -10000).names.tw = '小島木屋 I';
    expect(patched.bundles).toEqual(expected);
    expect(patched.report.applied).toEqual(['island-names-tw/-10000/tw']);
    expect(sources).toEqual(before);
    expect(projected.bundles.catalog.items[2].names).toEqual({ en: 'Cozy Cabin I' });
    expect(applyNamePatches(projected.bundles, []).bundles).toEqual(projected.bundles);
    expect(applyNamePatches(patched.bundles, cabinPatch()).report.upstreamResolved).toHaveLength(1);
  });

  it.each(['item discontinuity', 'recipe discontinuity', 'english rename', 'translation conflict'])('rejects %s before changing any input', scenario => {
    const bundles = projectGameData(fixture()).bundles;
    if (scenario === 'item discontinuity') bundles.catalog.items = bundles.catalog.items.filter((i: any) => i.id !== -10000);
    if (scenario === 'recipe discontinuity') bundles.recipes.recipes[2].result = -10010;
    if (scenario === 'english rename') bundles.catalog.items[2].names.en = 'Different building';
    if (scenario === 'translation conflict') bundles.catalog.items[2].names.tw = '另一個名稱';
    const before = structuredClone(bundles);
    expect(() => applyNamePatches(bundles, cabinPatch())).toThrow(/Name patch/);
    expect(bundles).toEqual(before);
  });

  it.each(['item-search.index', 'items.json', 'tw/tw-items.json'])('recognizes upstream translations from %s', file => {
    const sources = fixture();
    if (file === 'item-search.index') sources[file].find((i: any) => i.id === -10000).tw = '小島木屋 I';
    else sources[file][-10000] = { tw: '小島木屋 I' };
    const result = applyNamePatches(projectGameData(sources).bundles, cabinPatch());
    expect(result.report.applied).toEqual([]);
    expect(result.report.upstreamResolved).toEqual(['island-names-tw/-10000/tw']);
  });

  it('rejects duplicate targets and malformed provenance or entity mappings', () => {
    const patches = cabinPatch();
    expect(() => validateNamePatches([...patches, ...patches])).toThrow('Duplicate name patch ID');
    const duplicate = structuredClone(patches[0]); duplicate.id = 'other';
    expect(() => validateNamePatches([...patches, duplicate])).toThrow('Duplicate name patch target');
    for (const mutate of [
      (p: any) => { p.source.commit = 'missing'; },
      (p: any) => { p.locale = 'en'; },
      (p: any) => { p.entries[0].itemId = -10010; },
      (p: any) => { p.entries[0].recipeId = 'mji-building-1.0'; },
      (p: any) => { p.entries[0].value = ''; },
      (p: any) => { delete p.entries[0].expected; },
    ]) {
      const invalid = cabinPatch(); mutate(invalid[0]);
      expect(() => validateNamePatches(invalid)).toThrow('Invalid name patch');
    }
  });

  it('versions patch content, verifies catalog values offline and retains an unpatched previous manifest', async () => {
    const old = createPackages(snapshot());
    const patches = cabinPatch();
    const next = createPackages(snapshot(), patches);
    expect(createPackages(snapshot(), patches)).toEqual(next);
    expect(next.manifest.version).not.toBe(old.manifest.version);
    expect(next.manifest.bundles.recipes).toEqual(old.manifest.bundles.recipes);
    expect(next.manifest.bundles.sources).toEqual(old.manifest.bundles.sources);
    const catalog = JSON.parse(gunzipSync(next.assets.get(next.manifest.bundles.catalog.file)).toString('utf8'));
    expect(() => verifyNamePatchCatalog(next.manifest, catalog, patches)).not.toThrow();
    const changed = cabinPatch(); changed[0].reason += ' Reviewed.';
    expect(() => verifyNamePatchCatalog(next.manifest, catalog, changed)).toThrow('run data:generate');
    expect(createPackages(snapshot(), changed).manifest.version).not.toBe(next.manifest.version);
    delete catalog.items.find((i: any) => i.id === -10000).names.tw;
    expect(() => verifyNamePatchCatalog(next.manifest, catalog, patches)).toThrow('Generated name patch missing');
    const directory = await temporaryDirectory();
    await writePackages(directory, old); await writePackages(directory, next);
    expect(await verifyPackages(directory)).toEqual(next.manifest);
    expect(JSON.parse(await readFile(path.join(directory, 'previous-manifest.json'), 'utf8'))).toEqual(old.manifest);
  });
});

describe('snapshot downloads and package integrity', () => {
  it('pins every raw URL to one commit, keeps API credentials private and reuses verified snapshots', async () => {
    const cacheRoot = await temporaryDirectory();
    const fetchImpl = mockFetch();
    const downloaded = await downloadSnapshot({ cacheRoot, fetchImpl, token: 'test-token', log: () => {} });
    expect(fetchImpl).toHaveBeenCalledTimes(SNAPSHOT_FILES.length + 1);
    const calls = fetchImpl.mock.calls as unknown as Array<[string, { headers: Record<string, string> }]>;
    expect(calls[0][1].headers.Authorization).toBe('Bearer test-token');
    for (const [url, options] of calls.slice(1)) {
      expect(url).toContain(`/${commit}/`);
      expect(options.headers).not.toHaveProperty('Authorization');
    }
    const reused = await downloadSnapshot({ ref: commit, cacheRoot, fetchImpl, log: () => {} });
    expect(fetchImpl).toHaveBeenCalledTimes(SNAPSHOT_FILES.length + 1);
    expect(reused.sources).toEqual(fixture());
    await writeFile(path.join(downloaded.directory, 'items.json'), '{}');
    await expect(readSnapshot(downloaded.directory)).rejects.toThrow('checksum mismatch');
  });

  it('does not mark partial or unrecognized-license downloads as complete', async () => {
    for (const sources of [fixture(), { ...fixture(), LICENSE: 'different license' }]) {
      const cacheRoot = await temporaryDirectory();
      const fetchImpl = mockFetch(sources, sources.LICENSE === 'different license' ? undefined : 'items.json');
      await expect(downloadSnapshot({ ref: commit, cacheRoot, fetchImpl, log: () => {} })).rejects.toThrow();
      await expect(readFile(path.join(cacheRoot, commit, 'source.json'))).rejects.toMatchObject({ code: 'ENOENT' });
    }
  });

  it('produces reproducible gzip packages and preserves the original license', () => {
    const first = createPackages(snapshot());
    const second = createPackages(snapshot());
    expect(first).toEqual(second);
    const descriptor = first.manifest.bundles.recipes;
    const recipes = JSON.parse(gunzipSync(first.assets.get(descriptor.file)).toString());
    expect(recipes.recipes).toHaveLength(3);
    expect(first.assets.get(first.manifest.notice.file).toString()).toContain(fixture().LICENSE.trim());
    const changed = snapshot();
    changed.sources['recipes.json'][0].yields = 2;
    expect(createPackages(changed).manifest.version).not.toBe(first.manifest.version);
  });

  it('verifies bytes and publishes the manifest only after every asset passes', async () => {
    const directory = await temporaryDirectory();
    const packages = createPackages(snapshot());
    await writePackages(directory, packages);
    expect(await verifyPackages(directory)).toEqual(packages.manifest);
    const original = await readFile(path.join(directory, 'manifest.json'), 'utf8');
    await writePackages(directory, packages);
    expect(await readFile(path.join(directory, 'manifest.json'), 'utf8')).toBe(original);
    const broken = structuredClone(packages.manifest);
    broken.version = '0'.repeat(64);
    await expect(writePackages(directory, { ...packages, manifest: broken })).rejects.toThrow('version checksum');
    expect(await readFile(path.join(directory, 'manifest.json'), 'utf8')).toBe(original);
    await writeFile(path.join(directory, packages.manifest.bundles.catalog.file), 'corrupted');
    await expect(verifyPackages(directory)).rejects.toThrow('checksum mismatch');
    await expect(writePackages(directory, packages)).rejects.toThrow('checksum mismatch');
  });

  it('refuses unrelated output directories and incompatible CLI arguments', async () => {
    const directory = await temporaryDirectory();
    await writeFile(path.join(directory, 'keep.txt'), 'keep');
    await expect(writePackages(directory, createPackages(snapshot()))).rejects.toThrow('unrelated files');
    expect(await readFile(path.join(directory, 'keep.txt'), 'utf8')).toBe('keep');
    expect(() => parseOptions(['--ref', 'staging', '--source-dir', 'snapshot'])).toThrow('either');
    expect(() => parseOptions(['--verify', '--ref', 'staging'])).toThrow('without a source');
    expect(() => parseOptions(['--unknown'])).toThrow();
  });
  it('retains exactly the current and previous generation and does not rotate on identical regeneration', async () => {
    const directory = await temporaryDirectory();
    const versions = [];
    for (const label of ['One', 'Two', 'Three']) {
      const sources = fixture(); sources['items.json'][10].en = label;
      const packages = createPackages(snapshot(sources)); versions.push(packages);
      await writePackages(directory, packages);
    }
    const previous = JSON.parse(await readFile(path.join(directory, 'previous-manifest.json'), 'utf8'));
    expect(previous.version).toBe(versions[1].manifest.version);
    await verifyPackages(directory, previous);
    const files = await readdir(directory);
    expect(files).not.toContain(versions[0].manifest.bundles.catalog.file);
    expect(files).toContain(versions[1].manifest.bundles.catalog.file);
    await writePackages(directory, versions[2]);
    expect(JSON.parse(await readFile(path.join(directory, 'previous-manifest.json'), 'utf8'))).toEqual(previous);
  });
});

it.skipIf(!process.env.GAME_DATA_SOURCE_DIR)('covers every real recipe and recommended item without runtime upstream data', async () => {
  const { sources } = await readSnapshot(path.resolve(process.env.GAME_DATA_SOURCE_DIR!));
  const { bundles } = projectGameData(sources);
  const ids = new Set(bundles.catalog.items.map((i: any) => i.id));
  expect(ids.has(0)).toBe(false);
  expect(bundles.recipes.recipes.filter((r: any) => r.result < 0)).toHaveLength(25);
  for (const r of bundles.recipes.recipes) {
    expect(ids.has(r.result)).toBe(true);
    for (const i of r.ingredients) { expect(ids.has(i.id)).toBe(true); expect(i.amount).toBeGreaterThan(0); }
  }
  for (const id of [3, 5, 9, 11, 15, 17, 37579, 37580, 37582, 37578, 39894]) expect(ids.has(id)).toBe(true);
  for (const file of (await readdir('src/data/recommended')).filter(f => f.endsWith('.json'))) {
    const notes = JSON.parse(await readFile(path.join('src/data/recommended', file), 'utf8'));
    for (const note of notes) for (const item of note.items) expect(ids.has(item.id)).toBe(true);
  }
}, 60_000);
