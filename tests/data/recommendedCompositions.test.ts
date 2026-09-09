import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import notes, { baseRecommendedNotes, searchRecommendedNotes } from '../../src/data/recommended';
import definitions from '../../src/data/recommended/generated/compositions.json';
import { composeNotes } from '../../src/data/recommended/compose';
import { createNoteSearch } from '../../src/utils/noteSearch';
import type { CatalogBundle } from '../../src/types/gameData';
import type { Note } from '../../src/types/note';

const manifest = JSON.parse(readFileSync('public/game-data/manifest.json', 'utf8'));
const catalog: CatalogBundle = JSON.parse(gunzipSync(readFileSync('public/game-data/' + manifest.bundles.catalog.file)).toString());
const byId = new Map(catalog.items.map(item => [item.id, item]));
const find = (query: string) => {
  const results = searchRecommendedNotes(query);
  expect(results, query).toHaveLength(1);
  return results[0]!;
};
const quantity = (note: Note) => note.items.reduce((sum, item) => sum + item.quantity, 0);

describe('ready-to-use recommended sets', () => {
  it('uses plain set names in all four locales', () => {
    for (const note of composeNotes(baseRecommendedNotes, definitions.groups, definitions.jobs)) {
      for (const name of Object.values(note.name)) expect(name).not.toMatch(/[（()）]/);
    }
    expect(find('騎士十二 710').name).toMatchObject({ tw: 'Lv.100 iLv710 騎士十二件套裝' });
  });

  it('puts composed job and tool sets before shared gear in searches, preserving order within each group', () => {
    const baseIds = new Set(baseRecommendedNotes.map(note => note.id));
    for (const query of ['', '   ', '100', '710', '巧匠 750', '大地 720+690']) {
      const results = searchRecommendedNotes(query);
      const expected = notes.filter(note => results.includes(note));
      expect(results).toEqual([
        ...expected.filter(note => !baseIds.has(note.id)),
        ...expected.filter(note => baseIds.has(note.id)),
      ]);
      expect(results.some(note => baseIds.has(note.id))).toBe(true);
      expect(results.some(note => !baseIds.has(note.id))).toBe(true);
    }
    expect(searchRecommendedNotes('')).toBe(searchRecommendedNotes('   '));
  });

  it('uses Chinese piece counts and consistent level prefixes in every recommended title', () => {
    for (const note of notes) {
      if (typeof note.name === 'string') throw new Error('Expected localized recommended name');
      for (const name of Object.values(note.name)) expect(name).toMatch(/^Lv\.\d+ iLv\d+/);
      expect(note.name.tw).not.toMatch(/\d+件/);
      expect(note.name.cn).not.toMatch(/\d+件/);
      expect(note.name.tw).toMatch(/件套裝$/);
      expect(note.name.cn).toMatch(/件套装$/);
    }
  });

  it('retains every existing note with stable and unique new identities', () => {
    const originals = readdirSync('src/data/recommended').filter(file => file.endsWith('.json'))
      .flatMap(file => JSON.parse(readFileSync('src/data/recommended/' + file, 'utf8')));
    expect(baseRecommendedNotes).toHaveLength(123);
    expect(notes).toHaveLength(503);
    expect(new Set(notes.map(note => note.id)).size).toBe(notes.length);
    for (const original of originals) expect(notes.find(note => note.id === original.id)).toEqual(original);
  });

  it('orders each priority group by equipment level, then highest item level, in default and searched lists', () => {
    const baseIds = new Set(baseRecommendedNotes.map(note => note.id));
    const key = (note: Note) => {
      if (typeof note.name === 'string') throw new Error('Expected localized recommended name');
      const [level, grades] = note.name.tw.split(' ');
      return [baseIds.has(note.id) ? 1 : 0, Number(level!.slice(3)), Math.max(...grades!.slice(3).split('+').map(Number))];
    };
    for (const query of ['', '   ', '巧匠', '大地', 'Lv.60']) {
      const results = searchRecommendedNotes(query);
      for (let i = 1; i < results.length; i++) {
        const previous = key(results[i - 1]!);
        const current = key(results[i]!);
        const firstDifference = current.map((value, index) => value - previous[index]!).find(value => value !== 0);
        expect(firstDifference ?? 0, `${query}: ${results[i - 1]!.id} -> ${results[i]!.id}`).toBeGreaterThanOrEqual(0);
      }
    }
    // A newer leveling tier can have a lower iLv than the preceding endgame tier.
    const crafting = searchRecommendedNotes('巧匠二十六');
    expect(crafting.indexOf(find('Lv.80 巧匠二十六'))).toBeLessThan(crafting.indexOf(find('Lv.81 巧匠二十六')));
    const sharedArmor = searchRecommendedNotes('巧匠');
    expect(sharedArmor.indexOf(find('Lv.60 巧匠十件'))).toBeLessThan(sharedArmor.indexOf(find('Lv.61 巧匠五件')));
    // i190+195 must sort after the standalone i190 base in the underlying level/grade order.
    expect(notes.indexOf(find('Lv.60 巧匠十件'))).toBeLessThan(notes.indexOf(find('Lv.60 巧匠二十六')));
  });

  it('keeps level 51 and 61 professions as five armor pieces without tool or accessory compositions', () => {
    for (const [level, ilvl] of [[51, 65], [61, 180]]) {
      const tier = notes.filter(note => typeof note.name !== 'string' && note.name.tw.startsWith(`Lv.${level} `));
      expect(tier).toHaveLength(2);
      for (const note of tier) {
        expect(quantity(note)).toBe(5);
        expect(note.name).toMatchObject({ tw: expect.stringContaining('五件套裝') });
        expect(note.items.map(item => byId.get(item.id)!.equipSlotCategory)).toEqual([3, 4, 5, 7, 8]);
        expect(definitions.groups.some(group => group.base === note.id)).toBe(false);
        for (const item of note.items) {
          expect(byId.get(item.id)).toMatchObject({ craftable: true, equipLevel: level, ilvl });
          expect(item.quantity).toBe(1);
        }
      }
    }
    // Level 51 gear permits every class, so class eligibility cannot distinguish its intended use.
    expect(find('Lv.51 巧匠').items.map(item => item.id)).toEqual([11955, 11960, 11965, 11973, 11978]);
    expect(find('Lv.51 大地').items.map(item => item.id)).toEqual([11983, 11988, 11993, 12001, 12006]);
  });

  it('offers complete same-tier leveling equipment for all eleven professions and both collectives', () => {
    const jobs = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL', 'MIN', 'BTN', 'FSH'];
    for (const [level, ilvl] of [[71, 330], [81, 480], [91, 610]]) {
      const tier = notes.filter(note => typeof note.name !== 'string' && note.name.tw.startsWith(`Lv.${level} `));
      expect(tier).toHaveLength(15);
      for (const note of tier) {
        for (const item of note.items) expect(byId.get(item.id)).toMatchObject({ craftable: true, equipLevel: level, ilvl });
        expect(note.items.filter(item => byId.get(item.id)!.equipSlotCategory === 12)).toEqual([
          { id: expect.any(Number), quantity: 2 },
        ]);
      }
      for (const job of jobs) {
        const note = tier.find(note => note.id.endsWith(`_${job.toLowerCase()}`))!;
        expect(note, `${level}/${job}`).toBeDefined();
        expect(quantity(note)).toBe(job === 'FSH' ? 11 : 12);
      }
      expect(quantity(find(`Lv.${level} 巧匠二十六`))).toBe(26);
      expect(quantity(find(`Lv.${level} 大地十五`))).toBe(15);
      for (const role of ['巧匠', '大地']) expect(quantity(find(`Lv.${level} ${role}十件`))).toBe(10);
      const results = searchRecommendedNotes(`Lv.${level}`);
      expect(results.slice(0, 13).every(note => !baseRecommendedNotes.includes(note))).toBe(true);
      expect(results.slice(13).every(note => baseRecommendedNotes.includes(note))).toBe(true);
    }
  });

  it('has craftable, compatible equipment in the right slots for every generated job set', () => {
    for (const group of definitions.groups) {
      for (const job of Object.keys(group.variants)) {
        const note = notes.find(note => note.id === `recommend_${group.base}_${job.toLowerCase()}`)!;
        const slots: Record<number, number> = {};
        for (const item of note.items) {
          const data = byId.get(item.id)!;
          expect(data, `${note.id}/${item.id}`).toBeDefined();
          expect(data.craftable).toBe(true);
          expect(data.equipJobs, `${note.id}/${item.id}`).toContain(job);
          expect(data.equipLevel).toBeLessThanOrEqual(Number(group.prefix.match(/Lv\.(\d+)/)![1]));
          const slot = data.equipSlotCategory!;
          slots[slot] = (slots[slot] ?? 0) + item.quantity;
          expect(item.quantity).toBe(slot === 12 ? 2 : 1);
        }
        expect(new Set(note.items.map(item => item.id)).size).toBe(note.items.length);
        expect(slots[1] ?? slots[13]).toBe(1);
        const tools = ['Crafting', 'Gathering'].includes(group.role);
        expect(slots[2] ?? 0).toBe(job === 'PLD' || (tools && job !== 'FSH') ? 1 : 0);
        for (const slot of [3, 4, 5, 7, 8]) expect(slots[slot]).toBe(1);
        const upgradeOnly = group.prefix === 'Lv.100 iLv720';
        for (const slot of [9, 10, 11, 12]) expect(slots[slot] ?? 0).toBe(upgradeOnly ? 0 : slot === 12 ? 2 : 1);
        const grades = [...new Set(note.items.map(item => byId.get(item.id)!.ilvl))].sort();
        const prefix = typeof note.name === 'string' ? '' : note.name.en.split(' ')[1]!;
        expect(prefix.replace('iLv', '').split('+').map(Number).sort()).toEqual(grades);
        expect(typeof note.name).toBe('object');
        if (typeof note.name !== 'string') {
          expect(note.name.en).toContain(`${quantity(note)}-piece Set`);
          for (const locale of ['tw', 'cn', 'en', 'ja'] as const) expect(note.name[locale]).toContain(definitions.jobs[job as keyof typeof definitions.jobs][locale]);
        }
      }
    }
  });

  it('includes sword and shield, both rings, and the correct caster weapon without manual editing', () => {
    const pld = find('騎士十二 710');
    expect(quantity(pld)).toBe(12);
    expect(pld.items.slice(0, 2)).toEqual([{ id: 42870, quantity: 1 }, { id: 42891, quantity: 1 }]);
    const blm = find('黑魔道士 710');
    expect(quantity(blm)).toBe(11);
    expect(blm.items[0]).toEqual({ id: 42876, quantity: 1 });
    expect(blm.items.filter(item => byId.get(item.id)!.equipSlotCategory === 12)).toEqual([{ id: 42946, quantity: 2 }]);
  });

  it('includes complete profession and collective mixed sets, without inventing a fisher off hand', () => {
    expect(quantity(find('木工師 720+690'))).toBe(12);
    expect(quantity(find('巧匠二十六 720+690'))).toBe(26);
    expect(quantity(find('大地十五 720+690'))).toBe(15);
    expect(quantity(find('漁師 720+690'))).toBe(11);
    for (const group of definitions.groups.filter(group => ['Crafting', 'Gathering'].includes(group.role))) {
      const all = notes.find(note => note.id === `recommend_${group.base}_all`)!;
      const toolIds = all.items.filter(item => [1, 2].includes(byId.get(item.id)!.equipSlotCategory!));
      expect(toolIds).toHaveLength(group.role === 'Crafting' ? 16 : 5);
      expect(quantity(all)).toBe((group.prefix === 'Lv.100 iLv720' ? 5 : 10) + toolIds.length);
    }
  });

  it('serializes self-contained favorites and isolates mutable item arrays from shared bases', () => {
    const generated = composeNotes(baseRecommendedNotes, definitions.groups, definitions.jobs);
    const selected = generated.find(note => note.name && typeof note.name !== 'string' && note.name.tw.includes('木工師十二') && note.name.tw.includes('720+690'))!;
    const snapshot = JSON.parse(JSON.stringify(selected));
    expect(snapshot.items).toEqual(selected.items);
    expect(snapshot.items).toHaveLength(11);
    const original = JSON.stringify(baseRecommendedNotes);
    selected.items[2]!.quantity = 99;
    expect(JSON.stringify(baseRecommendedNotes)).toBe(original);
    expect(snapshot.items[2].quantity).toBe(1);
    expect(composeNotes(baseRecommendedNotes, definitions.groups, definitions.jobs).find(note => note.id === selected.id)!.items).toEqual(snapshot.items);
  });

  it('searches all official locales, abbreviations and full-width input without reading item lists', () => {
    expect(find('ＰＬＤ　７１０').id).toBe(find('騎士十二 710').id);
    expect(searchRecommendedNotes('騎士 710')).toContain(find('騎士十二 710'));
    expect(find('Black Mage 710').id).toBe(find('黑魔道士 710').id);
    expect(find('刻木匠 720+690').id).toBe(find('木工師 720+690').id);
    expect(find('木工師 12 720+690').id).toBe(find('Carpenter 720+690').id);
    expect(find('ナイト 710').id).toBe(find('騎士十二 710').id);
    expect(searchRecommendedNotes('不存在的職業')).toHaveLength(0);
    expect(searchRecommendedNotes('')).toHaveLength(notes.length);
    const unread: Note = { id: 'lazy', name: 'Lazy note', createdAt: '', get items() { throw new Error('Search expanded items'); } };
    expect(createNoteSearch([unread])('lazy')).toEqual([unread]);
  });

  it('keeps the compact registry smaller than duplicated note bodies and reproducible offline', () => {
    const compact = readFileSync('src/data/recommended/generated/compositions.json');
    const expanded = Buffer.from(JSON.stringify(composeNotes(baseRecommendedNotes, definitions.groups, definitions.jobs)));
    expect(compact.byteLength).toBeLessThan(expanded.byteLength / 4);
    expect(gzipSync(compact).byteLength).toBeLessThan(gzipSync(expanded).byteLength);
    execFileSync(process.execPath, ['scripts/generate-recommended.mjs', '--verify']);
  });
});
