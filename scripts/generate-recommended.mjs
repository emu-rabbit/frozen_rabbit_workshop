import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => JSON.parse(readFileSync(root + path, 'utf8'));
const manifest = read('public/game-data/manifest.json');
const catalog = JSON.parse(gunzipSync(readFileSync(root + 'public/game-data/' + manifest.bundles.catalog.file)));
const byId = new Map(catalog.items.map(item => [item.id, item]));
const locales = ['tw', 'cn', 'en', 'ja'];
const localeData = await Promise.all(locales.map(locale => import(`../src/i18n/locales/${locale}.ts`)));
const roles = {
  Fending: ['PLD', 'WAR', 'DRK', 'GNB'], Maiming: ['DRG', 'RPR'],
  Striking: ['MNK', 'SAM'], Scouting: ['NIN', 'VPR'], Aiming: ['BRD', 'MCH', 'DNC'],
  Casting: ['BLM', 'SMN', 'RDM', 'PCT'], Healing: ['WHM', 'SCH', 'AST', 'SGE'],
  Crafting: ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'],
  Gathering: ['MIN', 'BTN', 'FSH'],
};
const jobs = Object.fromEntries(Object.values(roles).flat().map(job => [job,
  Object.fromEntries(locales.map((locale, index) => [locale, localeData[index].default.newNote.filter.jobs[job]])),
]));
// Reviewed original crafted weapons, excluding the alternate glowing primal weapons at i110.
const weapons110 = new Set([9082, 9083, 9084, 9085, 9086, 9087, 9088, 9089, 9090, 9091, 9092, 10412, 10474, 10536, 20378, 20379]);
// Corrections apply only to new composed notes. Existing curated notes remain byte-for-byte intact.
const corrections = { 'lv100_ilv770.json': { 46068: 49307 }, 'lv60_ilv255.json': { 19613: 18086 } };
// These leveling tiers intentionally offer only five armor pieces. Never fill gaps with older tools.
const standaloneFiles = new Set(['lv51_ilv65.json', 'lv61_ilv180.json']);
const groups = [];
for (const file of readdirSync(root + 'src/data/recommended').filter(file => file.endsWith('.json')).sort()) {
  if (standaloneFiles.has(file)) continue;
  for (const base of read('src/data/recommended/' + file)) {
    const role = Object.keys(roles).find(role => base.name.en.includes(role) && !base.name.en.includes('Tool'));
    if (!role) continue;
    const level = Number(base.name.tw.match(/Lv\.?\s*(\d+)/i)[1]);
    const ilvl = Number(base.name.tw.match(/iLv(\d+)/i)[1]);
    const tools = ['Crafting', 'Gathering'].includes(role);
    const replacements = corrections[file] || {};
    const items = base.items.map(item => ({ ...item, id: replacements[item.id] || item.id }));
    const variants = {};
    for (const job of roles[role]) {
      // End-of-expansion crafted tools have distinct main/off-hand grades in these older tiers.
      const grades = tools && ilvl === 190 ? [195, 195] : tools && ilvl === 340 ? [345, 325] : [ilvl, ilvl];
      const candidates = slot => catalog.items.filter(item => item.craftable && item.equipLevel <= level &&
        item.ilvl === grades[slot === 2 ? 1 : 0] && item.equipJobs?.includes(job) &&
        (slot === 2 ? item.equipSlotCategory === 2 : [1, 13].includes(item.equipSlotCategory)) &&
        (tools || ilvl !== 110 || weapons110.has(item.id)));
      const main = candidates(1);
      if (!main.length) continue; // No craftable weapon for this job/tier: do not invent a set.
      const off = (tools && job !== 'FSH') || job === 'PLD' ? candidates(2) : [];
      if (main.length !== 1 || (((tools && job !== 'FSH') || job === 'PLD') && off.length !== 1)) {
        throw new Error(`Ambiguous or missing tools: ${file}/${job}`);
      }
      if (items.some(item => !byId.get(item.id)?.equipJobs?.includes(job))) throw new Error(`Incompatible base: ${file}/${job}`);
      variants[job] = [...main, ...off].map(item => item.id);
    }
    if (!Object.keys(variants).length) throw new Error(`No variants: ${base.id}`);
    const group = { base: base.id, role, variants };
    if (Object.keys(replacements).length) group.replace = replacements;
    // Name every grade present; do not silently label mixed-grade sets as a single grade.
    const grades = [...new Set([...items.map(item => byId.get(item.id).ilvl), ...Object.values(variants).flat().map(id => byId.get(id).ilvl)])];
    group.prefix = `Lv.${level} iLv${grades.join('+')}`;
    const prefixes = {};
    for (const [job, ids] of Object.entries(variants)) {
      const jobGrades = [...new Set([...items.map(item => byId.get(item.id).ilvl), ...ids.map(id => byId.get(id).ilvl)])];
      const prefix = `Lv.${level} iLv${jobGrades.join('+')}`;
      if (prefix !== group.prefix) prefixes[job] = prefix;
    }
    if (Object.keys(prefixes).length) group.prefixes = prefixes;
    if (tools && Object.keys(variants).length !== roles[role].length) throw new Error(`Incomplete profession group: ${file}`);
    groups.push(group);
  }
}
const result = JSON.stringify({ sourceCommit: manifest.source.commit, jobs, groups }, null, 2) + '\n';
const output = 'src/data/recommended/generated/compositions.json';
if (process.argv.includes('--verify')) {
  if (readFileSync(root + output, 'utf8') !== result) throw new Error('Recommended compositions are stale; run npm run notes:generate');
} else {
  mkdirSync(root + 'src/data/recommended/generated', { recursive: true });
  writeFileSync(root + output, result);
}
console.log(`${groups.length} shared sets; ${groups.reduce((sum, group) => sum + Object.keys(group.variants).length + (['Crafting', 'Gathering'].includes(group.role) ? 1 : 0), 0)} composed notes; ${Buffer.byteLength(result)} bytes`);
