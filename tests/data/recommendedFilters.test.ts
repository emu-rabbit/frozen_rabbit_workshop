import { describe, expect, it } from 'vitest';
import notes, { searchRecommendedNotes } from '../../src/data/recommended';
import { combatJobs, craftingJobs, gatheringJobs, levelBands, createRecommendedFilter, emptyRecommendedFilters, getRecommendedMetadata } from '../../src/data/recommended/filters';

const filter = createRecommendedFilter(notes);
describe('recommended note filters', () => {
  it('classifies every note and preserves search ordering without filters', () => {
    expect(craftingJobs.length + gatheringJobs.length).toBe(11);
    expect(combatJobs).toContain('BLU');
    for (const note of notes) {
      const metadata = getRecommendedMetadata(note);
      if (metadata.type === 'glamour' || metadata.type === 'submarine') {
        expect(metadata.jobs).toEqual([]);
        expect(metadata.level).toBe(0);
        continue;
      }
      expect(metadata.jobs.length, note.id).toBeGreaterThan(0);
      if (metadata.type !== 'quest') expect(metadata.level, note.id).toBeGreaterThanOrEqual(50);
    }
    const results = searchRecommendedNotes('710');
    expect(filter(results, emptyRecommendedFilters())).toEqual(results);
  });
  it('combines job, wearable-level band and type, including shared sets', () => {
    const results = filter(notes, { jobs: ['CRP'], levels: [50], types: ['professionEquipment'] });
    expect(results).toHaveLength(1); // Lv.51 armor belongs to the 50–59 band.
    expect(results.every(note => getRecommendedMetadata(note).jobs.includes('CRP'))).toBe(true);
    expect(results.some(note => getRecommendedMetadata(note).level === 51)).toBe(true);
    expect(filter(notes, { jobs: ['CRP'], levels: [], types: ['quest'] })).toHaveLength(1);
    expect(filter(notes, { jobs: ['CRP'], levels: [50], types: ['quest'] })).toHaveLength(0);
  });
  it('unions selections within a group and intersects them with keyword search', () => {
    const results = filter(searchRecommendedNotes('710'), { jobs: ['PLD', 'WAR'], levels: [100], types: [] });
    expect(results).toHaveLength(3); // Two individual sets plus their shared Fending set.
    expect(filter(searchRecommendedNotes('710'), { jobs: ['CRP'], levels: [], types: [] })).toHaveLength(0);
  });
  it('offers only populated level bands from 50 and separates combat and profession sets', () => {
    expect(levelBands).toEqual([50, 60, 70, 80, 90, 100]);
    for (const level of levelBands) {
      const results = filter(notes, { jobs: [], levels: [level], types: [] });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(note => {
        const actual = getRecommendedMetadata(note).level;
        return actual >= level && actual < level + 10;
      })).toBe(true);
    }
    const battle = filter(notes, { jobs: [], levels: [], types: ['combatEquipment'] });
    const professions = filter(notes, { jobs: [], levels: [], types: ['professionEquipment'] });
    expect(battle.length).toBeGreaterThan(0);
    expect(professions.length).toBeGreaterThan(0);
    expect(battle.every(note => getRecommendedMetadata(note).jobs.every(job => combatJobs.includes(job)))).toBe(true);
    expect(professions.every(note => getRecommendedMetadata(note).jobs.every(job => [...craftingJobs, ...gatheringJobs].includes(job)))).toBe(true);
    const quests = filter(notes, { jobs: [], levels: [], types: ['quest'] });
    const glamour = filter(notes, { jobs: [], levels: [], types: ['glamour'] });
    expect(glamour).toHaveLength(165);
    expect(glamour.every(note => note.id.startsWith('recommend_glamour_'))).toBe(true);
    expect(filter(searchRecommendedNotes('小牛皮'), { jobs: [], levels: [], types: ['glamour'] })).toHaveLength(1);
    expect(filter(glamour, { jobs: ['PLD'], levels: [], types: ['glamour'] })).toHaveLength(0);
    expect(filter(glamour, { jobs: [], levels: [50], types: ['glamour'] })).toHaveLength(0);
    const submarines = filter(notes, { jobs: [], levels: [], types: ['submarine'] });
    expect(submarines).toHaveLength(6);
    expect(filter(submarines, { jobs: ['ARM'], levels: [], types: ['submarine'] })).toHaveLength(0);
    expect(filter(submarines, { jobs: [], levels: [50], types: ['submarine'] })).toHaveLength(0);
    const relics = filter(notes, { jobs: [], levels: [], types: ['relicTools'] });
    expect(relics).toHaveLength(29);
    expect(battle.length + professions.length + quests.length + glamour.length + submarines.length + relics.length).toBe(notes.length);
  });
});
