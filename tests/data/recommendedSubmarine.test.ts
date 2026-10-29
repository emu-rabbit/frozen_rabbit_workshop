import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import notes, { searchRecommendedNotes } from '../../src/data/recommended';
import submarines from '../../src/data/recommended/submarine.json';
import { createRecommendedFilter, getRecommendedMetadata } from '../../src/data/recommended/filters';
import type { CatalogBundle, BundleData } from '../../src/types/gameData';

const manifest = JSON.parse(readFileSync('public/game-data/manifest.json', 'utf8'));
const catalog: CatalogBundle = JSON.parse(gunzipSync(readFileSync('public/game-data/' + manifest.bundles.catalog.file)).toString());
const recipes: BundleData['recipes'] = JSON.parse(gunzipSync(readFileSync('public/game-data/' + manifest.bundles.recipes.file)).toString());

describe('submersible recommended notes', () => {
  it('maps numeric codes to hull, stern, bow and bridge with four modified parts for 5124改', () => {
    const classes = ['Shark', 'Unkiu', 'Whale', 'Coelacanth', 'Syldra'];
    const slots = ['Pressure Hull', 'Stern', 'Bow', 'Bridge'];
    expect(submarines.map(note => note.name.tw)).toEqual(['1111潛水艇', '3124潛水艇', '1121潛水艇', '3113潛水艇', '5124改潛水艇', '5142潛水艇']);
    for (const note of submarines) {
      expect(notes).toContainEqual(note);
      expect(note.items).toHaveLength(4);
      const code = note.name.tw.slice(0, 4);
      note.items.forEach((entry, index) => {
        const expectedName = (code === '5124' ? 'Modified ' : '') + classes[Number(code[index]) - 1] + '-class ' + slots[index];
        expect(catalog.items.find(item => item.id === entry.id)).toMatchObject({ names: { en: expectedName }, craftable: true });
        expect(recipes.recipes.some(recipe => recipe.result === entry.id)).toBe(true);
        expect(entry.quantity).toBe(1);
      });
      expect(getRecommendedMetadata(note)).toEqual({ type: 'submarine', level: 0, jobs: [] });
      for (const locale of ['tw', 'cn', 'en', 'ja'] as const) {
        expect(searchRecommendedNotes(note.name[locale])).toEqual([note]);
      }
    }
    expect(createRecommendedFilter(notes)(notes, { jobs: [], levels: [], types: ['submarine'] })).toEqual(submarines);
  });
});
