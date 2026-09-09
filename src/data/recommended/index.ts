import type { Note } from '../../types/note';
import { composeNotes } from './compose';
import compositions from './generated/compositions.json';
import { createNoteSearch } from '../../utils/noteSearch';

import lv100_ilv690 from './lv100_ilv690.json';
import lv100_ilv710 from './lv100_ilv710.json';
import lv100_ilv720 from './lv100_ilv720.json';
import lv100_ilv720_690 from './lv100_ilv720_690.json';
import lv100_ilv740 from './lv100_ilv740.json';
import lv100_ilv750 from './lv100_ilv750.json';
import lv100_ilv770 from './lv100_ilv770.json';
import lv50_ilv110 from './lv50_ilv110.json';
import lv50_ilv115 from './lv50_ilv115.json';
import lv60_ilv190 from './lv60_ilv190.json';
import lv60_ilv255 from './lv60_ilv255.json';
import lv60_ilv255_250 from './lv60_ilv255_250.json';
import lv70_ilv340 from './lv70_ilv340.json';
import lv70_ilv380 from './lv70_ilv380.json';
import lv70_ilv385 from './lv70_ilv385.json';
import lv80_ilv490 from './lv80_ilv490.json';
import lv80_ilv510 from './lv80_ilv510.json';
import lv80_ilv515 from './lv80_ilv515.json';
import lv90_ilv620 from './lv90_ilv620.json';
import lv90_ilv640 from './lv90_ilv640.json';
import lv90_ilv645 from './lv90_ilv645.json';
import lv51_ilv65 from './lv51_ilv65.json';
import lv61_ilv180 from './lv61_ilv180.json';
import lv71_ilv330 from './lv71_ilv330.json';
import lv81_ilv480 from './lv81_ilv480.json';
import lv91_ilv610 from './lv91_ilv610.json';

export const baseRecommendedNotes: Note[] = [
  ...(lv100_ilv690 as Note[]),
  ...(lv100_ilv710 as Note[]),
  ...(lv100_ilv720 as Note[]),
  ...(lv100_ilv720_690 as Note[]),
  ...(lv100_ilv740 as Note[]),
  ...(lv100_ilv750 as Note[]),
  ...(lv100_ilv770 as Note[]),
  ...(lv50_ilv110 as Note[]),
  ...(lv50_ilv115 as Note[]),
  ...(lv60_ilv190 as Note[]),
  ...(lv60_ilv255 as Note[]),
  ...(lv60_ilv255_250 as Note[]),
  ...(lv70_ilv340 as Note[]),
  ...(lv70_ilv380 as Note[]),
  ...(lv70_ilv385 as Note[]),
  ...(lv80_ilv490 as Note[]),
  ...(lv80_ilv510 as Note[]),
  ...(lv80_ilv515 as Note[]),
  ...(lv90_ilv620 as Note[]),
  ...(lv90_ilv640 as Note[]),
  ...(lv90_ilv645 as Note[]),
  ...(lv51_ilv65 as Note[]),
  ...(lv61_ilv180 as Note[]),
  ...(lv71_ilv330 as Note[]),
  ...(lv81_ilv480 as Note[]),
  ...(lv91_ilv610 as Note[]),
];

const allRecommendedNotes: Note[] = [
  ...baseRecommendedNotes,
  ...composeNotes(baseRecommendedNotes, compositions.groups, compositions.jobs),
].map(note => {
  // Parse once without materializing items; mixed sets sort by their highest listed grade.
  const name = typeof note.name === 'string' ? note.name : note.name.tw;
  const level = Number(name.match(/^Lv\.(\d+)/i)?.[1] ?? 0);
  const grades = name.match(/iLv(\d+(?:\+\d+)*)/i)?.[1];
  const ilvl = grades ? Math.max(...grades.split('+').map(Number)) : 0;
  return { note, level, ilvl };
}).sort((a, b) => a.level - b.level || a.ilvl - b.ilvl).map(entry => entry.note);

const aliases = new Map<string, string>();
const searchPriorities = new Map<string, number>();
for (const group of compositions.groups) {
  for (const job of [...Object.keys(group.variants), 'all']) {
    aliases.set(`recommend_${group.base}_${job.toLowerCase()}`, job === 'all' ? Object.keys(group.variants).join(' ') : job);
    searchPriorities.set(`recommend_${group.base}_${job.toLowerCase()}`, 0);
  }
}
export const searchRecommendedNotes = createNoteSearch(allRecommendedNotes, aliases, searchPriorities);

export default allRecommendedNotes;
