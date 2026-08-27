import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { downloadSnapshot, readSnapshot } from './game-data/source.mjs';
import { createPackages, verifyPackages, writePackages } from './game-data/package.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function parseOptions(args) {
  const { values } = parseArgs({
    args,
    options: {
      ref: { type: 'string' },
      output: { type: 'string' },
      'source-dir': { type: 'string' },
      verify: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });
  if (values['source-dir'] && values.ref) throw new Error('Use either --ref or --source-dir, not both.');
  if (values.verify && (values.ref || values['source-dir'])) {
    throw new Error('--verify checks existing packages without a source or network request.');
  }
  return values;
}

function printSummary(manifest) {
  console.log(`Data version: ${manifest.version}`);
  console.log(`Source commit: ${manifest.source.commit}`);
  console.table(Object.entries(manifest.bundles).map(([name, entry]) => ({
    bundle: name,
    records: entry.records,
    'gzip MB': (entry.bytes / 1_000_000).toFixed(3),
    'JSON MB': (entry.jsonBytes / 1_000_000).toFixed(3),
  })));
  if (manifest.diagnostics.missingRecipeItemIds.length) {
    console.warn('Source recipe IDs without item metadata:', manifest.diagnostics.missingRecipeItemIds.join(', '));
  }
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args);
  if (options.help) {
    console.log(`Usage: npm run data:generate -- [options]
  --ref <branch-or-commit>  Teamcraft ref, defaults to staging; resolved once to a full SHA.
  --source-dir <directory> Rebuild offline from a verified local source snapshot.
  --output <directory>     Dedicated output directory, defaults to public/game-data.
  --verify                 Verify existing manifest, hashes and gzip packages offline.

Source snapshots: .cache/game-data/<commit>/ (ignored by Git).
See docs/game-data.md for the manual staging and production workflow.`);
    return;
  }
  const output = options.output ? path.resolve(options.output) : path.join(ROOT, 'public/game-data');
  if (options.verify) {
    printSummary(await verifyPackages(output));
    console.log('Package verification passed.');
    return;
  }
  const snapshot = options['source-dir']
    ? await readSnapshot(path.resolve(options['source-dir']))
    : await downloadSnapshot({
      ref: options.ref || 'staging',
      cacheRoot: path.join(ROOT, '.cache/game-data'),
      token: process.env.GITHUB_TOKEN,
    });
  const packages = createPackages(snapshot);
  await writePackages(output, packages);
  printSummary(packages.manifest);
  console.log(`Written and verified: ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`[game-data] ${error.message}`);
    process.exitCode = 1;
  });
}
