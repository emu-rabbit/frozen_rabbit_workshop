import type { LocalizedString, Note, NoteItem } from '../../types/note';
import definitions from './generated/compositions.json';

const jobs = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'] as const;
const collective: LocalizedString = { tw: '能工巧匠', cn: '能工巧匠', en: 'Crafting', ja: 'クラフター' };
const numerals = ['一', '二', '三', '四', '五', '六'];

// Item IDs follow the job order above; quantities assume the highest collectability reward.
// Keep quest requirements independent of craftability: non-craftable items are valid too.
// Sources and exchange thresholds are documented in docs/recommended-notes.md.
export const relicToolRequirements = [
  {
    id: 'splendorous', level: 90,
    name: { tw: '莫雯卓越工具', cn: '莫雯卓越工具', en: 'Splendorous Tools', ja: 'モーエンツール' },
    stages: [
      { quantity: 20, items: [38756, 38757, 38758, 38759, 38760, 38761, 38762, 38763] },
      { quantity: 30, items: [38764, 38765, 38766, 38767, 38768, 38769, 38770, 38771] },
      { quantity: 30, items: [39773, 39774, 39775, 39776, 39777, 39778, 39779, 39780] },
      { quantity: 30, items: [39781, 39782, 39783, 39784, 39785, 39786, 39787, 39788] },
      { quantity: 20, items: [41254, 41255, 41256, 41257, 41258, 41259, 41260, 41261] },
      { quantity: 20, items: [41262, 41263, 41264, 41265, 41266, 41267, 41268, 41269] },
    ],
  },
  {
    id: 'skysteel', level: 80,
    name: { tw: '天鋼工具', cn: '天钢工具', en: 'Skysteel Tools', ja: 'スカイスチールツール' },
    stages: [
      { quantity: 20, items: [29645, 29646, 29647, 29648, 29649, 29650, 29651, 29652] },
      { quantity: 30, items: [29653, 29654, 29655, 29656, 29657, 29658, 29659, 29660] },
      { quantity: 18, items: [31101, 31102, 31103, 31104, 31105, 31106, 31107, 31108] },
      { quantity: 21, items: [31109, 31110, 31111, 31112, 31113, 31114, 31115, 31116] },
      { quantity: 20, items: [31750, 31751, 31752, 31753, 31754, 31755, 31756, 31757] },
    ],
  },
];

export function mergeRelicRequirements(groups: NoteItem[][]): NoteItem[] {
  const quantities = new Map<number, number>();
  for (const items of groups) {
    for (const item of items) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

export const relicToolMetadata = new Map<string, { level: number; jobs: string[] }>();
const relicToolNotes: Note[] = relicToolRequirements.flatMap(series => {
  const makeNote = (suffix: string, job: string, stage: number | null, getItems: () => NoteItem[]): Note => {
    const id = `recommend_relic_${series.id}_${suffix}`;
    const names = job === 'all' ? collective : definitions.jobs[job as keyof typeof definitions.jobs];
    relicToolMetadata.set(id, { level: series.level, jobs: job === 'all' ? [...jobs] : [job] });
    let items: NoteItem[] | undefined;
    return {
      id,
      name: {
        tw: `${series.name.tw}/${names.tw}${stage === null ? '需求大總匯' : `第${numerals[stage]}階段需求`}`,
        cn: `${series.name.cn}/${names.cn}${stage === null ? '需求大总汇' : `第${numerals[stage]}阶段需求`}`,
        en: `${series.name.en}/${names.en} ${stage === null ? 'Complete Requirements' : `Stage ${stage + 1} Requirements`}`,
        ja: `${series.name.ja}/${names.ja}${stage === null ? '全段階必要アイテム' : `第${stage + 1}段階必要アイテム`}`,
      },
      get items() { return items ??= getItems(); },
      createdAt: '2026-10-29T00:00:00.000Z',
    };
  };
  const stages = series.stages.map((stage, index) => makeNote(`${index + 1}_all`, 'all', index,
    () => stage.items.map(id => ({ id, quantity: stage.quantity }))));
  const jobTotals = jobs.map((job, jobIndex) => makeNote(job.toLowerCase(), job, null,
    () => mergeRelicRequirements(series.stages.map(stage => [{ id: stage.items[jobIndex]!, quantity: stage.quantity }]))));
  return [...stages, ...jobTotals, makeNote('all', 'all', null,
    () => mergeRelicRequirements(stages.map(note => note.items)))];
});

export default relicToolNotes;
