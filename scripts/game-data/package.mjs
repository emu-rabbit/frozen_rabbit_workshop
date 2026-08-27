import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { FORMAT_VERSION, projectGameData } from './project.mjs';
import { HASH_PATTERN, REPOSITORY, SHA_PATTERN, sha256 } from './source.mjs';
import { applyNamePatches, describeNamePatches, validateNamePatches } from './name-patches.mjs';

export const GENERATOR = 'frozen-rabbit-workshop-game-data';
const BUNDLE_NAMES = ['catalog', 'recipes', 'sources'];
const GENERATED_FILE = /^(catalog|recipes|sources|NOTICE)\.[a-f0-9]{64}\.(bin|txt)$/;

export function createPackages({ sources, metadata }, namePatches = []) {
  namePatches = validateNamePatches(namePatches);
  if (metadata.repository !== REPOSITORY || !SHA_PATTERN.test(metadata.commit)) {
    throw new Error('Invalid source identity');
  }
  const projected = projectGameData(sources);
  const { bundles, report } = applyNamePatches(projected.bundles, namePatches);
  const patches = describeNamePatches(namePatches);
  const diagnostics = { ...projected.diagnostics, ...(patches ? { namePatches: report } : {}) };
  const assets = new Map();
  const descriptors = {};
  for (const name of BUNDLE_NAMES) {
    const json = Buffer.from(JSON.stringify(bundles[name]));
    const bytes = gzipSync(json, { level: 9 });
    const hash = sha256(bytes);
    const file = `${name}.${hash}.bin`;
    assets.set(file, bytes);
    descriptors[name] = {
      file,
      sha256: hash,
      bytes: bytes.length,
      jsonBytes: json.length,
      encoding: 'gzip',
      records: name === 'sources' ? Object.keys(bundles.sources.nodes).length : (bundles[name].items || bundles[name].recipes).length,
    };
  }
  const notice = Buffer.from([
    'Frozen Rabbit Workshop game data',
    `Source: https://github.com/${REPOSITORY}/tree/${metadata.commit}`,
    'Modified: selected fields, canonical IDs, four-language normalization and gzip packaging.',
    ...namePatches.map(patch => `Name patch ${patch.id}: https://github.com/${patch.source.repository}/tree/${patch.source.commit} (see data/game-data-patches for rows and checksums).`),
    'Game content and trademarks remain the property of their respective owners.',
    'FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.',
    'Game content: © SQUARE ENIX',
    '',
    'Original Teamcraft license follows:',
    sources.LICENSE.trim(),
    '',
  ].join('\n'));
  const noticeHash = sha256(notice);
  const noticeFile = `NOTICE.${noticeHash}.txt`;
  assets.set(noticeFile, notice);
  const identity = {
    formatVersion: FORMAT_VERSION,
    source: metadata,
    bundles: descriptors,
    notice: { file: noticeFile, bytes: notice.length, sha256: noticeHash },
    ...(patches ? { patches } : {}),
  };
  const manifest = {
    generator: GENERATOR,
    version: sha256(Buffer.from(JSON.stringify(identity))),
    ...identity,
    diagnostics,
  };
  return { manifest, assets };
}

export async function verifyPackages(directory, suppliedManifest) {
  const manifest = suppliedManifest || JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.generator !== GENERATOR || manifest.formatVersion !== FORMAT_VERSION) {
    throw new Error('Unrecognized game-data manifest or format version');
  }
  if (manifest.source?.repository !== REPOSITORY || !SHA_PATTERN.test(manifest.source?.commit)) {
    throw new Error('Invalid manifest source');
  }
  if (manifest.patches !== undefined && (!manifest.patches || !HASH_PATTERN.test(manifest.patches.sha256)
    || !Array.isArray(manifest.patches.ids) || !manifest.patches.ids.length
    || !manifest.patches.ids.every(id => typeof id === 'string' && /^[a-z0-9-]+$/.test(id))
    || new Set(manifest.patches.ids).size !== manifest.patches.ids.length)) throw new Error('Invalid name patch descriptor');
  const identity = {
    formatVersion: manifest.formatVersion,
    source: manifest.source,
    bundles: manifest.bundles,
    notice: manifest.notice,
    ...(manifest.patches !== undefined ? { patches: manifest.patches } : {}),
  };
  if (sha256(Buffer.from(JSON.stringify(identity))) !== manifest.version) {
    throw new Error('Manifest version checksum mismatch');
  }
  for (const name of [...BUNDLE_NAMES, 'notice']) {
    const entry = name === 'notice' ? manifest.notice : manifest.bundles?.[name];
    if (!entry || !HASH_PATTERN.test(entry.sha256) || !GENERATED_FILE.test(entry.file)) {
      throw new Error(`Invalid file descriptor: ${name}`);
    }
    const prefix = name === 'notice' ? 'NOTICE' : name;
    const extension = name === 'notice' ? 'txt' : 'bin';
    if (entry.file !== `${prefix}.${entry.sha256}.${extension}`) throw new Error(`Invalid file name: ${name}`);
    const bytes = await readFile(path.join(directory, entry.file));
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) {
      throw new Error(`Package checksum mismatch: ${entry.file}`);
    }
    if (name === 'notice') continue;
    if (entry.encoding !== 'gzip') throw new Error(`Unsupported encoding: ${name}`);
    const json = gunzipSync(bytes, { maxOutputLength: 128 * 1024 * 1024 });
    if (json.length !== entry.jsonBytes) throw new Error(`JSON size mismatch: ${name}`);
    const data = JSON.parse(json.toString('utf8'));
    const records = name === 'sources' ? Object.values(data.nodes || {}) : name === 'recipes' ? data.recipes : data.items;
    if (data.formatVersion !== FORMAT_VERSION || !Array.isArray(records)
      || records.length !== entry.records) {
      throw new Error(`Invalid package contents: ${name}`);
    }
  }
  if (!suppliedManifest) {
    let previous;
    try { previous = JSON.parse(await readFile(path.join(directory, 'previous-manifest.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (previous) await verifyPackages(directory, previous);
  }
  return manifest;
}

async function atomicWrite(target, bytes) {
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

export async function writePackages(outputDirectory, packages) {
  const directory = path.resolve(outputDirectory);
  await mkdir(directory, { recursive: true });
  const existing = await readdir(directory);
  if (existing.some(file => !['manifest.json', 'previous-manifest.json'].includes(file) && !GENERATED_FILE.test(file))) {
    throw new Error('Output directory contains unrelated files; use a dedicated game-data directory.');
  }
  const current = existing.includes('manifest.json') ? await verifyPackages(directory) : null;
  let previous = existing.includes('previous-manifest.json')
    ? await verifyPackages(directory, JSON.parse(await readFile(path.join(directory, 'previous-manifest.json'), 'utf8'))) : null;
  for (const [file, bytes] of packages.assets) {
    if (!GENERATED_FILE.test(file)) throw new Error(`Unsafe generated file name: ${file}`);
    const target = path.join(directory, file);
    try {
      const current = await readFile(target);
      if (!current.equals(bytes)) throw new Error(`Existing content-addressed file is corrupted: ${file}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await atomicWrite(target, bytes);
    }
  }
  // Verify files on disk before replacing the single pointer to the active data version.
  await verifyPackages(directory, packages.manifest);
  if (current && current.version !== packages.manifest.version) {
    previous = current;
    await atomicWrite(path.join(directory, 'previous-manifest.json'), `${JSON.stringify(previous, null, 2)}\n`);
  }
  const serialized = `${JSON.stringify(packages.manifest, null, 2)}\n`;
  await atomicWrite(path.join(directory, 'manifest.json'), serialized);
  const keep = new Set(['manifest.json', 'previous-manifest.json', ...packages.assets.keys()]);
  if (previous) [...Object.values(previous.bundles), previous.notice].forEach(entry => keep.add(entry.file));
  for (const file of await readdir(directory)) {
    if (GENERATED_FILE.test(file) && !keep.has(file)) await unlink(path.join(directory, file));
  }
  return packages.manifest;
}
