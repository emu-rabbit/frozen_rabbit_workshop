const fs = require('fs');
const path = require('path');

const recommendedDir = path.join(__dirname, '../src/data/recommended');
const files = fs.readdirSync(recommendedDir).filter(f => f.endsWith('.json'));

const translationTable = {
  '禦敵': { cn: '御敌', en: 'Fending', ja: 'タンク' },
  '制敵': { cn: '制敌', en: 'Maiming', ja: 'メレー' },
  '強襲': { cn: '强袭', en: 'Striking', ja: 'メレー' },
  '游擊': { cn: '游击', en: 'Scouting', ja: 'メレー' },
  '精準': { cn: '精准', en: 'Aiming', ja: 'レンジ' },
  '詠咒': { cn: '咏咒', en: 'Casting', ja: 'キャス' },
  '治癒': { cn: '治愈', en: 'Healing', ja: 'ヒラ' },
  '大地': { cn: '大地', en: 'Gathering', ja: 'ギャザラー' },
  '巧匠': { cn: '巧匠', en: 'Crafting', ja: 'クラフター' },
  '主副手': { cn: '主副手', en: 'Tools', ja: '主副道具' },
};

const numberMap = {
  '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
  '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
  '十一': '11', '十二': '12', '十三': '13', '十四': '14', '十五': '15', '十六': '16'
};

function hasChinese(text) {
    if (!text) return false;
    return /[\u4e00-\u9fa5]/.test(text);
}

function translate(text) {
  let tw = text;
  let cn = text;
  let en = text;
  let ja = text;

  // 1. Handle base keywords
  for (const [key, val] of Object.entries(translationTable)) {
    if (tw.includes(key)) {
      cn = cn.replace(new RegExp(key, 'g'), val.cn);
      en = en.replace(new RegExp(key, 'g'), val.en + ' ');
      ja = ja.replace(new RegExp(key, 'g'), val.ja);
    }
  }

  // 2. Handle numbers (Chinese characters to digits for EN/JA, keep for CN)
  const sortedNumKeys = Object.keys(numberMap).sort((a, b) => b.length - a.length);
  for (const key of sortedNumKeys) {
      const val = numberMap[key];
      const numRegex = new RegExp(key + '(?=件套|套裝|件)', 'g');
      // DO NOT replace in cn (keep Chinese numbers like 十, 十六)
      en = en.replace(numRegex, val);
      ja = ja.replace(numRegex, val);
  }

  // 3. Handle units (Zero-Leakage)
  const setRegex = /(\d+)件(套裝|套)?/g;
  // For en/ja, we already converted numbers to digits above if they were Chinese.
  // This regex handles both already-digits and newly-converted-digits.
  en = en.replace(setRegex, (m, n) => `${n}-piece Set`);
  ja = ja.replace(setRegex, (m, n) => `${n}点セット`);

  // Special handle for cn units (Traditional to Simplified)
  cn = cn.replace(/件套裝/g, '件套装').replace(/件套/g, '件套');

  // 4. Handle remaining common Chinese characters
  cn = cn.replace(/套裝/g, '套装');
  en = en.replace(/套裝/g, 'Set');
  ja = ja.replace(/套裝/g, 'セット');

  // Final cleanup for English spacing
  en = en.replace(/\s+/g, ' ').trim();
  
  // Final Zero-Leakage check
  if (hasChinese(en)) en = en.replace(/[\u4e00-\u9fa5]/g, '').trim();
  if (hasChinese(ja)) ja = ja.replace(/[\u4e00-\u9fa5]/g, '').trim();

  // Basic Traditional to Simplified for CN
  cn = cn.replace(/製/g, '制').replace(/裝/g, '装').replace(/備/g, '备').replace(/筆/g, '笔').replace(/記/g, '记');

  return { tw, cn, en, ja };
}

files.forEach(file => {
  const filePath = path.join(recommendedDir, file);
  console.log(`Processing ${file}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.trim().startsWith('{') && content.trim().includes('}{')) {
      content = '[' + content.replace(/}\{/g, '},{') + ']';
  }

  let data;
  try {
      data = JSON.parse(content);
  } catch (e) {
      console.error(`Failed to parse ${file}: ${e.message}`);
      return;
  }

  if (Array.isArray(data)) {
      data.forEach(note => {
          if (typeof note.name === 'string') {
              note.name = translate(note.name);
          } else if (note.name && note.name.tw) {
              // Re-translate but respect user's manual CN if possible?
              // No, the user wants me to fix CN to not use digits.
              note.name = translate(note.name.tw);
          }
      });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
});

console.log('Update src/data/recommended/index.ts...');
const indexFile = path.join(recommendedDir, 'index.ts');
const uniqueFiles = [...new Set(files)];
uniqueFiles.sort();

let indexContent = "import type { Note } from '../../types/note';\n\n";
uniqueFiles.forEach((f, i) => {
    const varName = f.replace('.json', '').replace(/-/g, '_');
    indexContent += `import ${varName} from './${f}';\n`;
});

indexContent += '\nconst allRecommendedNotes: Note[] = [\n';
uniqueFiles.forEach(f => {
    const varName = f.replace('.json', '').replace(/-/g, '_');
    indexContent += `  ...(${varName} as Note[]),\n`;
});
indexContent += '].sort((a, b) => {\n';
indexContent += '  const getILv = (n: Note) => {\n';
indexContent += '    const name = typeof n.name === "string" ? n.name : n.name.tw;\n';
indexContent += '    const match = name.match(/iLv(\\d+)/i);\n';
indexContent += '    return match ? parseInt(match[1]) : 0;\n';
indexContent += '  };\n';
indexContent += '  return getILv(a) - getILv(b);\n';
indexContent += '});\n\nexport default allRecommendedNotes;\n';

fs.writeFileSync(indexFile, indexContent, 'utf8');

console.log('Done.');
