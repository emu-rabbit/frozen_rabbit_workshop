import type { LocalizedString, Note, NoteItem } from '../../types/note';

export interface CompositionGroup {
  base: string;
  role: string;
  prefix: string;
  prefixes?: Partial<Record<string, string>>;
  variants: Partial<Record<string, number[]>>;
  replace?: Partial<Record<string, number>>;
}

const numeral = (n: number): string => {
  const digits = '零一二三四五六七八九';
  if (n < 10) return digits[n]!;
  return (n >= 20 ? digits[Math.floor(n / 10)] : '') + '十' + (n % 10 ? digits[n % 10] : '');
};

const collectiveNames: Record<string, LocalizedString> = {
  Crafting: { tw: '巧匠', cn: '巧匠', en: 'Crafting', ja: 'クラフター' },
  Gathering: { tw: '大地', cn: '大地', en: 'Gathering', ja: 'ギャザラー' },
};

export function composeNotes(bases: Note[], groups: CompositionGroup[], jobs: Record<string, LocalizedString>): Note[] {
  const byId = new Map(bases.map(note => [note.id, note]));
  return groups.flatMap(group => {
    const base = byId.get(group.base);
    if (!base) throw new Error(`Missing recommended base: ${group.base}`);
    const entries = Object.entries(group.variants).filter((entry): entry is [string, number[]] => entry[1] !== undefined);
    if (collectiveNames[group.role]) entries.push(['all', [...new Set(entries.flatMap(([, ids]) => ids))]]);
    return entries.map(([job, ids]) => {
      const prefix = group.prefixes?.[job] ?? group.prefix;
      const count = base.items.reduce((sum, item) => sum + item.quantity, 0) + ids.length;
      const names = job === 'all' ? collectiveNames[group.role]! : jobs[job]!;
      let items: NoteItem[] | undefined;
      // Search/counts never expand the shared equipment. First render/export/use materializes only this note.
      return {
        id: `recommend_${base.id}_${job.toLowerCase()}`,
        name: {
          tw: `${prefix} ${names.tw}${numeral(count)}件套裝`,
          cn: `${prefix} ${names.cn}${numeral(count)}件套装`,
          en: `${prefix} ${names.en} ${count}-piece Set`,
          ja: `${prefix} ${names.ja}${count}点セット`,
        },
        get items() {
          return items ??= [
            ...ids.map(id => ({ id, quantity: 1 })),
            ...base.items.map(item => ({ ...item, id: group.replace?.[item.id] ?? item.id })),
          ];
        },
        createdAt: '2026-09-09T00:00:00.000Z',
      };
    });
  });
}
