import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import glamour from '../../src/data/recommended/glamour.json';
import notes, { searchRecommendedNotes } from '../../src/data/recommended';
import { getRecommendedMetadata } from '../../src/data/recommended/filters';
import type { CatalogBundle, Recipe } from '../../src/types/gameData';

const manifest = JSON.parse(readFileSync('public/game-data/manifest.json', 'utf8'));
const catalog: CatalogBundle = JSON.parse(gunzipSync(readFileSync('public/game-data/' + manifest.bundles.catalog.file)).toString());
const recipes: Recipe[] = JSON.parse(gunzipSync(readFileSync('public/game-data/' + manifest.bundles.recipes.file)).toString()).recipes;
const byId = new Map(catalog.items.map(item => [item.id, item]));
const results = new Set(recipes.map(recipe => recipe.result));

describe('curated glamour notes', () => {
  it('covers the reviewed craftable clothing, flowers and replicas without initial utility gear', () => {
    const initial = new Set([2629, 2630, 2631, 2958, 2959, 2960, 2961, 3274, 3275, 3276, 3515, 3516, 3740, 3741, 3742]);
    const expected = catalog.items.filter(item => item.craftable && item.category! >= 34 && item.category! <= 43
      && ((item.ilvl === 1 && !initial.has(item.id)) || item.names.en?.startsWith('Replica ')));
    const actual = new Set(glamour.flatMap(note => note.items.map(item => item.id)));
    expect(glamour).toHaveLength(165);
    expect(actual.size).toBe(717);
    expect([...actual].sort((a, b) => a - b)).toEqual(expected.map(item => item.id).sort((a, b) => a - b));
    for (const note of glamour) {
      expect(new Set(note.items.map(item => item.id)).size).toBe(note.items.length);
      for (const item of note.items) {
        expect(results.has(item.id), `${note.id}/${item.id}`).toBe(true);
        expect(item.quantity).toBe(1);
      }
    }
  });

  it('has four searchable titles and keeps role-named replicas in the glamour category', () => {
    for (const locale of ['tw', 'cn', 'en', 'ja'] as const) {
      expect(new Set(glamour.map(note => note.name[locale])).size).toBe(165);
      for (const note of glamour) {
        expect(note.name[locale]).not.toMatch(/undefined|未知|Unknown/);
        expect(note.name[locale]).not.toMatch(/^(時裝｜|时装｜|Glamour \||おしゃれ装備｜)/);
        expect(searchRecommendedNotes(note.name[locale])).toContainEqual(note);
      }
    }
    for (const note of glamour) {
      expect(getRecommendedMetadata(note)).toEqual({ type: 'glamour', jobs: [], level: 0 });
      expect(notes).toContainEqual(note);
    }
    expect(glamour.filter(note => note.name.tw.includes('九色合集'))).toHaveLength(27);
    expect(glamour.filter(note => note.name.en.includes('Replica '))).toHaveLength(33);
  });

  it('includes later-patch items with Chinese-derived draft titles without changing dictionary names', () => {
    const missing = new Set(glamour.flatMap(note => note.items).filter(item => !byId.get(item.id)!.names.tw).map(item => item.id));
    expect(missing.size).toBe(55);
    expect(glamour.find(note => note.items.some(item => item.id === 6979))!.name.tw).toBe('高地服飾套裝');
    const spring = glamour.filter(note => note.items.some(item => item.id === 7540 || item.id === 7541));
    expect(spring).toHaveLength(1);
    expect(spring[0]!.name.tw).toBe('春意服飾套裝');
    expect(spring[0]!.items).toEqual([7539, 7540, 7541, 7542].map(id => ({ id, quantity: 1 })));
    expect(glamour.find(note => note.items.some(item => item.id === 47258))!.name.tw).toBe('夏令禮服套裝');
    expect(glamour.find(note => note.items.some(item => item.id === 50253))!.name.tw).toBe('神話傳令官五件套裝');
    expect(glamour.find(note => note.items.some(item => item.id === 52613))!.name.tw).toBe('素色衛衣系列（三款合集）');
    expect(glamour.find(note => note.items.some(item => item.id === 51207))!.name.tw).toBe('矢車菊手鏈（九色合集）');
  });

  it('keeps series complete and repeats shared pieces for interchangeable outfit variants', () => {
    const findWith = (id: number) => glamour.filter(note => note.items.some(item => item.id === id));
    expect(findWith(14869)).toHaveLength(1);
    expect(findWith(14869)[0]!.items.map(item => item.id)).toEqual([14869, 14868, 14894]);
    expect(findWith(14868)).toEqual(findWith(14869));
    expect(findWith(14894)).toEqual(findWith(14869));
    expect(findWith(15925)[0]!.items.map(item => item.id)).toContain(15921);
    expect(findWith(15476)[0]!.items.map(item => item.id)).toEqual([15472, 15476, 15477, 15475]);
    for (const [tops, bottoms, shared] of [
      [[36838, 36841], [36839, 36842], [36837, 36840]],
      [[47920, 47919], [47922, 47928], [47921, 47923]],
    ]) {
      for (const top of tops!) {
        const variants = findWith(top);
        expect(variants).toHaveLength(2);
        for (const bottom of bottoms!) {
          expect(variants.some(note => [top, bottom, ...shared!].every(id => note.items.some(item => item.id === id)))).toBe(true);
        }
      }
    }
    for (const [anchor, shared] of [[27941,27940],[13266,13269],[13682,13685],[14830,14834],[14924,14928]]) {
      expect(findWith(anchor!)[0]!.items.map(item => item.id)).toContain(shared);
    }
    // Single-slot series are named collections, not invented top/trouser pairings.
    for (const first of [52612,52615,52618,52621,52624,52627]) {
      const collection = findWith(first);
      expect(collection).toHaveLength(1);
      expect(collection[0]!.items.map(item => item.id)).toEqual([first,first+1,first+2]);
      expect(collection[0]!.name.tw).toContain('合集');
    }
    // Dyable and ordinary-material versions of a series stay together in the list.
    for (const anchors of [[13266,13270,13682,13686],[14830,14833,14924,14927]]) {
      const indices = anchors.map(id => glamour.findIndex(note => note.items.some(item => item.id === id)));
      expect(Math.max(...indices)-Math.min(...indices)).toBe(3);
    }
  });
});
