import type { Note } from '../types/note';

const normalize = (value: string) => value.normalize('NFKC').toLowerCase();

/** Build once; keystrokes only compare tokens with cached text, never items or the game catalog. */
export function createNoteSearch(
  notes: Note[],
  aliases: ReadonlyMap<string, string> = new Map(),
  priorities: ReadonlyMap<string, number> = new Map(),
) {
  const index = notes.map(note => ({
    note,
    text: normalize([
      ...(typeof note.name === 'string' ? [note.name] : Object.values(note.name)),
      aliases.get(note.id) ?? '',
    ].join(' ')),
  })).sort((a, b) => (priorities.get(a.note.id) ?? 1) - (priorities.get(b.note.id) ?? 1));
  return (query: string): Note[] => {
    const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
    return tokens.length ? index.filter(entry => tokens.every(token => entry.text.includes(token))).map(entry => entry.note) : notes;
  };
}
