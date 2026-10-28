import type { Note } from '../../types/note';
import definitions from './generated/compositions.json';

export const craftingJobs = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'];
export const gatheringJobs = ['MIN', 'BTN', 'FSH'];
const roleJobs: Record<string, string[]> = {
  Crafting: craftingJobs,
  Gathering: gatheringJobs,
  Fending: ['PLD', 'WAR', 'DRK', 'GNB'],
  Maiming: ['DRG', 'RPR'],
  Striking: ['MNK', 'SAM'],
  Scouting: ['NIN', 'VPR'],
  Aiming: ['BRD', 'MCH', 'DNC'],
  Casting: ['BLM', 'SMN', 'RDM', 'PCT', 'BLU'],
  Healing: ['WHM', 'SCH', 'AST', 'SGE'],
};
export const combatJobs = Object.entries(roleJobs).filter(([role]) => !['Crafting', 'Gathering'].includes(role)).flatMap(([, jobs]) => jobs);
export const levelBands = [50, 60, 70, 80, 90, 100];
export type RecommendedNoteType = 'combatEquipment' | 'professionEquipment' | 'quest';
export interface RecommendedFilters {
  jobs: string[];
  levels: number[];
  types: RecommendedNoteType[];
}
export const emptyRecommendedFilters = (): RecommendedFilters => ({ jobs: [], levels: [], types: [] });

// Use composition IDs for individual sets; shared notes use their canonical English role.
// Build metadata once without touching lazy item arrays or downloading the catalog.
const compositionJobs = new Map<string, string[]>();
for (const group of definitions.groups) {
  for (const job of Object.keys(group.variants)) compositionJobs.set(`recommend_${group.base}_${job.toLowerCase()}`, [job]);
  compositionJobs.set(`recommend_${group.base}_all`, roleJobs[group.role] ?? []);
}

export function getRecommendedMetadata(note: Note) {
  const name = typeof note.name === 'string' ? note.name : note.name.en;
  const questJob = note.id.match(/^recommend_class_quests_1_60_(\w+)$/)?.[1]?.toUpperCase();
  const role = Object.keys(roleJobs).find(role => new RegExp(`\\b${role}\\b`).test(name));
  const jobs = questJob ? [questJob] : compositionJobs.get(note.id) ?? (role ? roleJobs[role]! : []);
  const type: RecommendedNoteType = questJob ? 'quest'
    : jobs.some(job => craftingJobs.includes(job) || gatheringJobs.includes(job)) ? 'professionEquipment' : 'combatEquipment';
  return {
    type,
    level: Number(name.match(/^Lv\.(\d+)/i)?.[1] ?? 0),
    jobs,
  };
}

export function createRecommendedFilter(notes: Note[]) {
  const metadata = new Map(notes.map(note => [note.id, getRecommendedMetadata(note)]));
  return (results: Note[], filters: RecommendedFilters): Note[] => results.filter(note => {
    const entry = metadata.get(note.id)!;
    return (!filters.jobs.length || filters.jobs.some(job => entry.jobs.includes(job)))
      && (!filters.levels.length || filters.levels.some(min => entry.level >= min && entry.level <= min + 9))
      && (!filters.types.length || filters.types.includes(entry.type));
  });
}
