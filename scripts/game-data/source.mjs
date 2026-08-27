import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { SOURCE_FILES, object } from './project.mjs';

export const REPOSITORY = 'ffxiv-teamcraft/ffxiv-teamcraft';
export const DATA_PATH = 'libs/data/src/lib/json';
export const SHA_PATTERN = /^[a-f0-9]{40}$/;
export const HASH_PATTERN = /^[a-f0-9]{64}$/;
export const SNAPSHOT_FILES = [...SOURCE_FILES, 'LICENSE'];

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function decodeSource(file, bytes) {
  if (file === 'LICENSE') {
    const license = bytes.toString('utf8');
    if (!license.includes('MIT License') || !license.includes('Permission is hereby granted')
      || !license.includes('copyright notice')) {
      throw new Error('Upstream LICENSE changed or is not recognized; review it before packaging.');
    }
    return license;
  }
  const json = file.endsWith('.index') ? inflateSync(bytes, { maxOutputLength: 128 * 1024 * 1024 }) : bytes;
  try {
    return JSON.parse(json.toString('utf8'));
  } catch (error) {
    throw new Error(`${file}: invalid JSON`, { cause: error });
  }
}

export async function readSnapshot(directory) {
  const metadata = JSON.parse(await readFile(path.join(directory, 'source.json'), 'utf8'));
  if (metadata.repository !== REPOSITORY || !SHA_PATTERN.test(metadata.commit)) {
    throw new Error('Invalid snapshot repository or commit in source.json');
  }
  object(metadata.files, 'source.json.files');
  const sources = {};
  for (const file of SNAPSHOT_FILES) {
    const expected = metadata.files[file];
    if (!expected || !HASH_PATTERN.test(expected.sha256)) throw new Error(`Missing snapshot checksum: ${file}`);
    const bytes = await readFile(path.join(directory, file));
    if (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256) {
      throw new Error(`Snapshot checksum mismatch: ${file}`);
    }
    sources[file] = decodeSource(file, bytes);
  }
  return { sources, metadata };
}

async function fetchBytes(url, fetchImpl, token) {
  const headers = { 'User-Agent': 'FrozenRabbitWorkshop-data-generator' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function downloadSnapshot({ ref = 'staging', cacheRoot, fetchImpl = fetch, token, log = console.log }) {
  let commit = ref;
  if (!SHA_PATTERN.test(commit)) {
    const bytes = await fetchBytes(
      `https://api.github.com/repos/${REPOSITORY}/commits/${encodeURIComponent(ref)}`,
      fetchImpl, token,
    );
    commit = JSON.parse(bytes.toString('utf8')).sha;
  }
  if (!SHA_PATTERN.test(commit)) throw new Error('GitHub did not return a full commit SHA');
  const directory = path.resolve(cacheRoot, commit);
  log(`Teamcraft snapshot: ${commit}`);

  // Reuse only a complete, checksum-verified snapshot. A partial download has no source.json.
  let metadata;
  try { metadata = JSON.parse(await readFile(path.join(directory, 'source.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (metadata && (metadata.commit !== commit || metadata.repository !== REPOSITORY)) throw new Error('Snapshot identity mismatch');
  metadata ||= { repository: REPOSITORY, commit, files: {} };
  const missing = [];
  for (const file of SNAPSHOT_FILES) {
    if (!metadata.files[file]) { missing.push(file); continue; }
    const bytes = await readFile(path.join(directory, file));
    if (sha256(bytes) !== metadata.files[file].sha256 || bytes.length !== metadata.files[file].bytes) throw new Error(`Snapshot checksum mismatch: ${file}`);
  }
  if (missing.length) {
    await mkdir(directory, { recursive: true });
    // Small fixed batches avoid opening a connection for every file at once.
    for (let index = 0; index < missing.length; index += 3) {
      const batch = missing.slice(index, index + 3);
      const results = await Promise.allSettled(batch.map(async file => {
        const relative = file === 'LICENSE' ? file : `${DATA_PATH}/${file}`;
        const url = `https://raw.githubusercontent.com/${REPOSITORY}/${commit}/${relative}`;
        const bytes = await fetchBytes(url, fetchImpl);
        decodeSource(file, bytes);
        const target = path.join(directory, file);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, bytes);
        return [file, { bytes: bytes.length, sha256: sha256(bytes) }];
      }));
      const failure = results.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
      for (const result of results) {
        const [file, info] = result.value;
        metadata.files[file] = info;
        log(`Downloaded ${file}: ${info.bytes.toLocaleString('en-US')} bytes`);
      }
    }
    await writeFile(path.join(directory, 'source.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  }
  const snapshot = await readSnapshot(directory);
  if (snapshot.metadata.commit !== commit) throw new Error('Snapshot commit does not match requested commit');
  return { ...snapshot, directory };
}
