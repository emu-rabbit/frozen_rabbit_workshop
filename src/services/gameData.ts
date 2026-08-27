import { shallowRef, ref } from 'vue';
import { BUNDLE_NAMES, DATA_FORMAT, type BundleName, type BundleData, type DataManifest, type CachedData } from '../types/gameData';
import { readCachedData, saveCachedData, clearCachedData } from './gameDataCache';

const BASE = `${import.meta.env.BASE_URL}game-data/`;
const HASH = /^[a-f0-9]{64}$/;
export const currentDataManifest = shallowRef<DataManifest | null>(null);
export const pendingDataManifest = shallowRef<DataManifest | null>(null);
export const catalogData = shallowRef<BundleData['catalog'] | null>(null);
export const recipeData = shallowRef<BundleData['recipes'] | null>(null);
export const sourceData = shallowRef<BundleData['sources'] | null>(null);
export const dataError = ref<'catalog' | 'core' | 'update' | null>(null);
export const dataCacheAvailable = ref(true);
export const coreDataReady = ref(false);
export const dataLoading = ref(false);
export const updateDismissed = ref(false);
let initialized: Promise<void> | undefined;
let latest: Promise<DataManifest | null> | undefined;
let bytes: Partial<Record<BundleName, ArrayBuffer>> = {};
let pending: CachedData | undefined;
let initialVersion: string | undefined;
const inflight = new Map<BundleName, Promise<unknown>>();
let corePromise: Promise<void> | undefined;
let updatePromise: Promise<void> | undefined;

async function hash(bytes: ArrayBuffer): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
}
export async function validateManifest(value: DataManifest): Promise<DataManifest> {
  if (!value || value.formatVersion !== DATA_FORMAT || value.generator !== 'frozen-rabbit-workshop-game-data'
    || !HASH.test(value.version) || value.source?.repository !== 'ffxiv-teamcraft/ffxiv-teamcraft'
    || !/^[a-f0-9]{40}$/.test(value.source?.commit)) throw new Error('Invalid game data manifest');
  for (const name of BUNDLE_NAMES) {
    const d = value.bundles?.[name];
    if (!d || !HASH.test(d.sha256) || d.file !== `${name}.${d.sha256}.bin` || d.encoding !== 'gzip'
      || !Number.isSafeInteger(d.bytes) || d.bytes <= 0 || !Number.isSafeInteger(d.jsonBytes)
      || d.jsonBytes <= 0 || d.jsonBytes > 128 * 1024 * 1024) throw new Error('Invalid bundle descriptor');
  }
  if (value.patches !== undefined && (!value.patches || !HASH.test(value.patches.sha256)
    || !Array.isArray(value.patches.ids) || !value.patches.ids.length
    || !value.patches.ids.every(id => typeof id === 'string' && /^[a-z0-9-]+$/.test(id))
    || new Set(value.patches.ids).size !== value.patches.ids.length)) throw new Error('Invalid name patch descriptor');
  const identity = { formatVersion: value.formatVersion, source: value.source, bundles: value.bundles, notice: value.notice,
    ...(value.patches !== undefined ? { patches: value.patches } : {}) };
  if (await hash(new TextEncoder().encode(JSON.stringify(identity)).buffer) !== value.version) throw new Error('Manifest checksum mismatch');
  return value;
}
async function fetchManifest(): Promise<DataManifest> {
  const response = await fetch(`${BASE}manifest.json`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
  return validateManifest(await response.json());
}
export async function decodeBundle<K extends BundleName>(manifest: DataManifest, name: K, buffer: ArrayBuffer): Promise<BundleData[K]> {
  const d = manifest.bundles[name];
  if (buffer.byteLength !== d.bytes || await hash(buffer) !== d.sha256) throw new Error(`${name}: checksum mismatch`);
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  const json = await new Response(stream).arrayBuffer();
  if (json.byteLength !== d.jsonBytes) throw new Error(`${name}: size mismatch`);
  const value = JSON.parse(new TextDecoder().decode(json));
  if (value.formatVersion !== DATA_FORMAT) throw new Error(`${name}: incompatible format`);
  const records = name === 'catalog' ? value.items : name === 'recipes' ? value.recipes : value.nodes && Object.values(value.nodes);
  if (!Array.isArray(records) || records.length !== d.records) throw new Error(`${name}: invalid records`);
  if (name === 'sources' && value.islandProduction !== undefined) {
    const production = value.islandProduction;
    if (!production || typeof production !== 'object' || Array.isArray(production)
      || Object.entries(production).some(([id, type]) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))
        || (type !== 'crop' && type !== 'pasture'))) throw new Error('sources: invalid island production');
  }
  return value;
}
async function download(manifest: DataManifest, name: BundleName): Promise<ArrayBuffer> {
  const response = await fetch(`${BASE}${manifest.bundles[name].file}`, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.arrayBuffer();
}
async function initialize(): Promise<void> {
  if (!initialized) initialized = (async () => {
    const stored = await readCachedData();
    let cached = stored?.active;
    if (stored?.pending) {
      try {
        const candidate = stored.pending;
        await validateManifest(candidate.manifest);
        // Before activating a staged version, check the complete compressed set.
        // Recipe/source JSON is still decoded only during phase two.
        await Promise.all(BUNDLE_NAMES.map(async name => {
          const buffer = candidate.bytes[name];
          const descriptor = candidate.manifest.bundles[name];
          if (!(buffer instanceof ArrayBuffer) || buffer.byteLength !== descriptor.bytes
            || await hash(buffer) !== descriptor.sha256) throw new Error('Corrupt pending cache');
        }));
        cached = candidate;
      } catch (error) { console.warn('[GameData] Ignoring damaged pending data', error); }
    }
    if (cached) {
      try {
        await validateManifest(cached.manifest);
        if (!BUNDLE_NAMES.every(n => cached.bytes[n] instanceof ArrayBuffer)) throw new Error('Incomplete cached version');
        currentDataManifest.value = cached.manifest; bytes = cached.bytes; initialVersion = cached.manifest.version;
      } catch { await clearCachedData(); }
    }
    latest = fetchManifest().catch(error => { console.warn('[GameData] Version check failed', error); return null; });
    if (!currentDataManifest.value) {
      currentDataManifest.value = await latest;
      if (!currentDataManifest.value) throw new Error('No usable game data');
      initialVersion = currentDataManifest.value.version;
    }
  })().catch(error => { initialized = undefined; throw error; });
  return initialized;
}
async function load<K extends BundleName>(name: K): Promise<BundleData[K]> {
  const existing = name === 'catalog' ? catalogData.value : name === 'recipes' ? recipeData.value : sourceData.value;
  if (existing) return existing as BundleData[K];
  if (!inflight.has(name)) inflight.set(name, (async () => {
    await initialize();
    const manifest = currentDataManifest.value!;
    let value: BundleData[K] | undefined;
    if (bytes[name]) {
      try { value = await decodeBundle(manifest, name, bytes[name]!); }
      catch { delete bytes[name]; }
    }
    if (!value) {
      const downloaded = await download(manifest, name);
      value = await decodeBundle(manifest, name, downloaded);
      bytes[name] = downloaded;
    }
    if (name === 'catalog') catalogData.value = value as BundleData['catalog'];
    if (name === 'recipes') recipeData.value = value as BundleData['recipes'];
    if (name === 'sources') sourceData.value = value as BundleData['sources'];
    return value;
  })().finally(() => inflight.delete(name)));
  return inflight.get(name) as Promise<BundleData[K]>;
}
export async function loadCatalog(): Promise<BundleData['catalog']> {
  dataLoading.value = true;
  try { const value = await load('catalog'); if (dataError.value === 'catalog') dataError.value = null; return value; }
  catch (error) { dataError.value = 'catalog'; console.warn('[GameData] Catalog failed', error); throw error; }
  finally { dataLoading.value = false; }
}
export async function loadCoreData(): Promise<void> {
  if (!corePromise) corePromise = (async () => {
    await loadCatalog();
    await Promise.all([load('recipes'), load('sources')]);
    coreDataReady.value = true;
    if (dataError.value === 'core') dataError.value = null;
    dataCacheAvailable.value = await saveCachedData('active', { manifest: currentDataManifest.value!, bytes: bytes as CachedData['bytes'] }, initialVersion);
    void checkForDataUpdate();
  })().catch(error => { if (dataError.value !== 'catalog') dataError.value = 'core'; corePromise = undefined; throw error; });
  return corePromise;
}
export async function checkForDataUpdate(): Promise<void> {
  if (!updatePromise) updatePromise = (async () => {
    try {
      const manifest = await (latest || fetchManifest());
      latest = undefined;
      if (!manifest) throw new Error('Version check unavailable');
      if (manifest.version === currentDataManifest.value?.version) { if (dataError.value === 'update') dataError.value = null; return; }
      const candidate = {} as CachedData['bytes'];
      await Promise.all(BUNDLE_NAMES.map(async name => {
        const buffer = await download(manifest, name);
        await decodeBundle(manifest, name, buffer);
        candidate[name] = buffer;
      }));
      pending = { manifest, bytes: candidate };
      dataCacheAvailable.value = await saveCachedData('pending', pending, currentDataManifest.value?.version);
      pendingDataManifest.value = manifest; updateDismissed.value = false;
      if (dataError.value === 'update') dataError.value = null;
    } catch (error) { dataError.value = 'update'; console.warn('[GameData] Update failed', error); }
    finally { if (dataError.value === 'update') updatePromise = undefined; }
  })();
  return updatePromise;
}
export async function activateDataUpdate(): Promise<void> {
  if (!pending) return;
  await saveCachedData('active', pending, currentDataManifest.value?.version);
  window.location.reload();
}
export async function repairDataCache(): Promise<void> {
  await clearCachedData();
  window.location.reload();
}
