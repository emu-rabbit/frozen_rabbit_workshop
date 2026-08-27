// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { fixturePackages, sourceFixture } from '../fixtures/gameData.mjs';
const cache = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), clear: vi.fn() }));
vi.mock('../../src/services/gameDataCache', () => ({ readCachedData: cache.read, saveCachedData: cache.save, clearCachedData: cache.clear }));
function cached(packages: any) {
  return { manifest: packages.manifest, bytes: Object.fromEntries(Object.entries(packages.manifest.bundles).map(([name, d]: [string, any]) => [name, Uint8Array.from(packages.assets.get(d.file)).buffer])) };
}
function network(packages: any, fail?: string) {
  return vi.fn(async (url: string) => {
    const file = url.split('/').pop()!;
    if (file === 'manifest.json') return Response.json(packages.manifest);
    if (fail && file.startsWith(fail)) return new Response('unavailable', { status: 503 });
    const bytes = packages.assets.get(file);
    return bytes ? new Response(bytes) : new Response('', { status: 404 });
  });
}
beforeEach(() => { vi.resetModules(); cache.read.mockReset().mockResolvedValue(null); cache.save.mockReset().mockResolvedValue(true); cache.clear.mockReset().mockResolvedValue(true); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('loads only catalog for phase one, then deduplicates and persists a complete version', async () => {
  const packages = fixturePackages(); const fetch = network(packages); vi.stubGlobal('fetch', fetch);
  const data = await import('../../src/services/gameData');
  await Promise.all([data.loadCatalog(), data.loadCatalog()]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(data.recipeData.value).toBeNull(); expect(data.sourceData.value).toBeNull(); expect(cache.save).not.toHaveBeenCalled();
  await Promise.all([data.loadCoreData(), data.loadCoreData()]); await data.checkForDataUpdate();
  expect(fetch).toHaveBeenCalledTimes(4);
  expect(data.coreDataReady.value).toBe(true);
  expect(cache.save.mock.calls[0][0]).toBe('active');
  expect(Object.keys(cache.save.mock.calls[0][1].bytes).sort()).toEqual(['catalog','recipes','sources']);
});
it('uses cached data without downloading unchanged packages', async () => {
  const packages = fixturePackages(); cache.read.mockResolvedValue({ active: cached(packages) });
  const fetch = network(packages); vi.stubGlobal('fetch', fetch);
  const data = await import('../../src/services/gameData');
  await data.loadCoreData(); await data.checkForDataUpdate();
  expect(fetch).toHaveBeenCalledTimes(1); expect(data.pendingDataManifest.value).toBeNull();
});
it('stages an entire update without changing the running catalog or recipes', async () => {
  const old = fixturePackages(); const sources = sourceFixture(); sources['items.json'][10].en = 'Updated sword';
  const next = fixturePackages(sources); cache.read.mockResolvedValue({ active: cached(old) }); vi.stubGlobal('fetch', network(next));
  const data = await import('../../src/services/gameData');
  await data.loadCoreData(); await data.checkForDataUpdate();
  expect(data.currentDataManifest.value?.version).toBe(old.manifest.version);
  expect(data.catalogData.value?.items[0].names.en).toBe('Sword');
  expect(data.pendingDataManifest.value?.version).toBe(next.manifest.version);
  expect(cache.save.mock.calls.at(-1)?.[0]).toBe('pending');
});
it('never stages a partial update and keeps the old complete data usable', async () => {
  const old = fixturePackages(); const sources = sourceFixture(); sources['recipes.json'][0].yields = 2;
  cache.read.mockResolvedValue({ active: cached(old) }); vi.stubGlobal('fetch', network(fixturePackages(sources), 'sources.'));
  const data = await import('../../src/services/gameData');
  await data.loadCoreData(); await data.checkForDataUpdate();
  expect(data.coreDataReady.value).toBe(true); expect(data.pendingDataManifest.value).toBeNull();
  expect(data.dataError.value).toBe('update'); expect(cache.save.mock.calls.map(c => c[0])).toEqual(['active']);
});
it('retries failed phase two without discarding the usable catalog', async () => {
  const packages = fixturePackages(); vi.stubGlobal('fetch', network(packages, 'sources.'));
  const data = await import('../../src/services/gameData');
  await expect(data.loadCoreData()).rejects.toThrow('503');
  expect(data.coreDataReady.value).toBe(false); expect(data.catalogData.value).not.toBeNull(); expect(cache.save).not.toHaveBeenCalled();
  vi.stubGlobal('fetch', network(packages)); await data.loadCoreData(); await data.checkForDataUpdate();
  expect(data.coreDataReady.value).toBe(true); expect(data.dataError.value).toBeNull();
});
it('redownloads corrupted cached bytes and verifies them before use', async () => {
  const packages = fixturePackages(); const record = cached(packages); record.bytes.catalog = new ArrayBuffer(3);
  cache.read.mockResolvedValue({ active: record }); const fetch = network(packages); vi.stubGlobal('fetch', fetch);
  const data = await import('../../src/services/gameData'); await data.loadCoreData(); await data.checkForDataUpdate();
  expect(fetch).toHaveBeenCalledTimes(2); expect(data.catalogData.value?.items).toHaveLength(3);
});
it('rejects invalid manifest identities and truncated packages', async () => {
  const packages = fixturePackages(); const data = await import('../../src/services/gameData');
  await expect(data.validateManifest({ ...packages.manifest, version: '0'.repeat(64) })).rejects.toThrow('checksum');
  await expect(data.decodeBundle(packages.manifest, 'catalog', new ArrayBuffer(1))).rejects.toThrow('checksum');
});
it('continues with same-site data when persistence fails', async () => {
  cache.save.mockResolvedValue(false); vi.stubGlobal('fetch', network(fixturePackages()));
  const data = await import('../../src/services/gameData'); await data.loadCoreData(); await data.checkForDataUpdate();
  expect(data.coreDataReady.value).toBe(true); expect(data.dataCacheAvailable.value).toBe(false);
});
it('keeps a complete cache usable when the version endpoint is offline', async () => {
  cache.read.mockResolvedValue({ active: cached(fixturePackages()) }); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const data = await import('../../src/services/gameData'); await data.loadCoreData(); await data.checkForDataUpdate();
  expect(data.coreDataReady.value).toBe(true); expect(data.dataError.value).toBe('update');
});
it('falls back to the active version if a pending cache was damaged while the page was closed', async () => {
  const old = fixturePackages(); const nextSources = sourceFixture(); nextSources['items.json'][10].en = 'Next';
  const pending = cached(fixturePackages(nextSources)); pending.bytes.sources = new ArrayBuffer(2);
  cache.read.mockResolvedValue({ active: cached(old), pending });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const data = await import('../../src/services/gameData'); await data.loadCoreData(); await data.checkForDataUpdate();
  expect(data.currentDataManifest.value?.version).toBe(old.manifest.version);
  expect(data.coreDataReady.value).toBe(true);
  expect(cache.clear).not.toHaveBeenCalled();
});
