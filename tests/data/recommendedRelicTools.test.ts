import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import notes, { searchRecommendedNotes } from '../../src/data/recommended';
import relics, { mergeRelicRequirements, relicToolRequirements } from '../../src/data/recommended/relicTools';
import { createRecommendedFilter, getRecommendedMetadata } from '../../src/data/recommended/filters';
import type { BundleData } from '../../src/types/gameData';

const manifest = JSON.parse(readFileSync('public/game-data/manifest.json', 'utf8'));
const readBundle = (name: 'catalog' | 'recipes') => JSON.parse(gunzipSync(readFileSync('public/game-data/' + manifest.bundles[name].file)).toString());
const catalog: BundleData['catalog'] = readBundle('catalog');
const recipes: BundleData['recipes'] = readBundle('recipes');
const jobs = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'];
const filter = createRecommendedFilter(notes);

describe('relic tool quest requirements', () => {
  it('provides eight job collections per series, collective upgrades and two complete collections', () => {
    expect(relics).toHaveLength(29);
    expect(relicToolRequirements.map(series => series.stages.map(stage => stage.quantity))).toEqual([
      [20, 30, 30, 30, 20, 20], [20, 30, 18, 21, 20],
    ]);
    for (const series of relicToolRequirements) {
      const stageTotals = [];
      series.stages.forEach((stage, index) => {
        const collective = relics.find(note => note.id === `recommend_relic_${series.id}_${index + 1}_all`)!;
        expect(collective.items).toHaveLength(8);
        expect(collective.items.reduce((sum, item) => sum + item.quantity, 0)).toBe(stage.quantity * 8);
        stageTotals.push(...collective.items);
        jobs.forEach((job, jobIndex) => {
          expect(relics.some(note => note.id === `recommend_relic_${series.id}_${index + 1}_${job.toLowerCase()}`)).toBe(false);
          const note = relics.find(note => note.id === `recommend_relic_${series.id}_${job.toLowerCase()}`)!;
          expect(note.items).toHaveLength(series.stages.length);
          expect(note.items[index]).toEqual(collective.items[jobIndex]);
          const recipe = recipes.recipes.filter(recipe => recipe.result === note.items[index]!.id);
          expect(recipe).toHaveLength(1);
          expect(recipe[0]).toMatchObject({ job: jobIndex + 8, lvl: series.level, yields: 1 });
          expect(getRecommendedMetadata(note)).toEqual({ type: 'relicTools', level: series.level, jobs: [job] });
        });
      });
      const total = relics.find(note => note.id === `recommend_relic_${series.id}_all`)!;
      expect(total.items).toEqual(mergeRelicRequirements([stageTotals]));
      expect(total.items).toHaveLength(series.stages.length * 8);
      expect(getRecommendedMetadata(total).jobs).toEqual(jobs);
    }
  });

  it('indexes all four locales, job abbreviations, series levels and the separate note type', () => {
    for (const note of relics) {
      expect(notes).toContain(note);
      if (typeof note.name === 'string') throw new Error('Expected four locales');
      for (const locale of ['tw', 'cn', 'en', 'ja'] as const) expect(searchRecommendedNotes(note.name[locale])).toEqual([note]);
    }
    expect(filter(notes, { jobs: [], levels: [], types: ['relicTools'] })).toEqual(relics);
    expect(filter(notes, { jobs: ['CRP'], levels: [90], types: ['relicTools'] })).toHaveLength(8);
    expect(filter(notes, { jobs: ['CUL'], levels: [80], types: ['relicTools'] })).toHaveLength(7);
    expect(filter(notes, { jobs: ['MIN'], levels: [], types: ['relicTools'] })).toHaveLength(0);
    expect(filter(searchRecommendedNotes('CRP Stage 6'), { jobs: [], levels: [], types: ['relicTools'] })).toHaveLength(1);
    expect(searchRecommendedNotes('莫雯卓越工具/木工師第一階段需求')).toHaveLength(0);
    expect(searchRecommendedNotes('莫雯卓越工具/木工師需求大總匯')).toHaveLength(1);
  });

  it('keeps non-craftable materials in the recipe closure and merges them without filtering', () => {
    const rawIds = [29661, 31117, 31758, 38748];
    for (const id of rawIds) {
      expect(catalog.items.find(item => item.id === id)).toMatchObject({ craftable: false });
      expect(recipes.recipes.some(recipe => relics.some(note => note.items.some(item => item.id === recipe.result))
        && recipe.ingredients.some(ingredient => ingredient.id === id))).toBe(true);
    }
    expect(mergeRelicRequirements([[{ id: 29661, quantity: 20 }], [{ id: 29661, quantity: 30 }]]))
      .toEqual([{ id: 29661, quantity: 50 }]);
    const individual = relics.find(note => note.id === 'recommend_relic_splendorous_crp')!;
    const collective = relics.find(note => note.id === 'recommend_relic_splendorous_all')!;
    expect(individual.items[0]).not.toBe(collective.items[0]);
    expect(JSON.parse(JSON.stringify(individual)).items).toEqual(individual.items);
  });
});
