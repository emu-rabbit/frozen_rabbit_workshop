const fs = require('fs');
const path = require('path');

const recommendedPath = 'src/data/recommended';
const files = fs.readdirSync(recommendedPath).filter(f => f.endsWith('.json'));

const mapping = {
  'tw': {
    '禦敵': { cn: '御敌', en: 'Fending', ja: 'タンク' },
    '制敵': { cn: '制敌', en: 'Maiming', ja: 'メレー' },
    '強襲': { cn: '强袭', en: 'Striking', ja: 'メレー' },
    '游擊': { cn: '游击', en: 'Scouting', ja: 'メレー' },
    '精準': { cn: '精准', en: 'Aiming', ja: 'レンジ' },
    '詠咒': { cn: '咏咒', en: 'Casting', ja: 'キャス' },
    '治癒': { cn: '治愈', en: 'Healing', ja: 'ヒラ' },
    '大地': { cn: '大地', en: 'Gathering', ja: 'ギャザラー' },
    '巧匠': { cn: '巧匠', en: 'Crafting', ja: 'クラフター' }
  }
};

function processName(nameObjOrStr) {
  let tw = '';
  if (typeof nameObjOrStr === 'string') {
    tw = nameObjOrStr;
  } else if (nameObjOrStr && nameObjOrStr.tw) {
    tw = nameObjOrStr.tw;
  } else {
    return nameObjOrStr;
  }

  const result = {
    tw: tw,
    cn: tw,
    en: tw,
    ja: tw
  };

  // Applied keyword translations
  for (const [kw, trans] of Object.entries(mapping.tw)) {
    if (tw.includes(kw)) {
      result.cn = result.cn.replace(kw, trans.cn);
      result.en = result.en.replace(kw, trans.en + ' '); // Add space for EN
      result.ja = result.ja.replace(kw, trans.ja);
    }
  }

  // Handle generic terms
  result.cn = result.cn.replace(/十件套裝/g, '十件套装').replace(/件套裝/g, '件套装');
  result.en = result.en.replace(/十件套裝/g, '10-piece Set').replace(/件套裝/g, '-piece Set');
  result.ja = result.ja.replace(/十件套裝/g, '10点セット').replace(/件套裝/g, '点セット');

  // Specific cleanup for EN spacing (e.g. "Fending 10-piece" vs "Fending10-piece")
  result.en = result.en.replace(/\s+/g, ' ').trim();
  
  // Ensure "10-piece Set" is correctly formatted
  result.en = result.en.replace(/([A-Za-z]+)(\d+-piece Set)/, '$1 $2');

  return result;
}

files.forEach(file => {
  const filePath = path.join(recommendedPath, file);
  let rawContent = fs.readFileSync(filePath, 'utf8').trim();
  
  let data;
  try {
    // Attempt to parse normally
    data = JSON.parse(rawContent);
  } catch (e) {
    // If it fails, check if it's the "multiple objects" broken format
    if (rawContent.startsWith('{') && !rawContent.startsWith('[')) {
      try {
        // Fix: Wrap in [] and add commas between }{
        const fixedRaw = '[' + rawContent.replace(/\}\s*\{/g, '},{') + ']';
        data = JSON.parse(fixedRaw);
        console.log(`Repaired structural issue in ${file}`);
      } catch (err) {
        console.error(`Failed to parse ${file} even after attempted repair:`, err.message);
        return;
      }
    } else {
      console.error(`Error parsing ${file}:`, e.message);
      return;
    }
  }

  if (Array.isArray(data)) {
    data.forEach(note => {
      if (note.name) {
        note.name = processName(note.name);
      }
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Processed ${file}`);
  }
});

console.log('All files processed.');
