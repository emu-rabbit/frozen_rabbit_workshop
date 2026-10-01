import { readFile } from 'node:fs/promises';

export function validateUpdateSummary(summary) {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)
    || Object.keys(summary).length !== 4
    || !['tw', 'cn', 'en', 'ja'].every(locale => Array.isArray(summary[locale])
      && summary[locale].length > 0 && summary[locale].length <= 10
      && summary[locale].every(line => typeof line === 'string' && line.trim().length > 0 && line.length <= 300))
    || new Set(Object.values(summary).map(lines => lines.length)).size !== 1) {
    throw new Error('Invalid four-language game-data update summary');
  }
  return summary;
}

export async function readUpdateSummary(commit, required = true) {
  const entries = JSON.parse(await readFile(new URL('../../data/game-data-updates.json', import.meta.url), 'utf8'));
  const summary = entries[commit];
  if (summary === undefined && !required) return undefined;
  if (summary === undefined) throw new Error(`Add a verified four-language update summary for ${commit} to data/game-data-updates.json before packaging.`);
  return validateUpdateSummary(summary);
}
