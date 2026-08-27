import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { sourceData } from '../../src/services/gameData';
import { getIslandOtherSource } from '../../src/services/islandSources';
import { generateTodoExportHtml, type ExportContext } from '../../src/services/exportHtml';
import { getCraftJobName } from '../../src/composables/useWorkbench';
import type { BundleData, BundleName } from '../../src/types/gameData';
import tw from '../../src/i18n/locales/tw';
import cn from '../../src/i18n/locales/cn';
import en from '../../src/i18n/locales/en';
import ja from '../../src/i18n/locales/ja';

afterEach(() => { sourceData.value = null; });

describe('island source coverage', () => {
  it('covers every island item in the checked-in snapshot', () => {
    const manifest = JSON.parse(readFileSync('public/game-data/manifest.json', 'utf8'));
    const read = <K extends BundleName>(name: K): BundleData[K] => JSON.parse(gunzipSync(readFileSync(`public/game-data/${manifest.bundles[name].file}`)).toString('utf8'));
    const catalog = read('catalog'), recipes = read('recipes');
    sourceData.value = read('sources');
    const counts: Record<string, number> = {};
    const unknown: number[] = [];
    for (const item of catalog.items.filter(item => item.kind !== 'item')) {
      const recipe = recipes.recipes.find(recipe => recipe.result === item.id);
      const source = recipe ? getCraftJobName(recipe) : sourceData.value.islandGathering[item.id]
        ? 'gather' : getIslandOtherSource(item.id);
      if (!source) unknown.push(item.id);
      else counts[source] = (counts[source] || 0) + 1;
    }
    expect(unknown).toEqual([]);
    expect(counts).toMatchObject({ islandFarming: 20, islandPasture: 9, islandGranary: 6, gather: 44,
      'jobs.islandCrafting': 28, 'jobs.islandWorkshop': 81, 'jobs.islandConstruction': 25 });
    expect(getIslandOtherSource(37596)).toBe('islandFarming');
    expect(getIslandOtherSource(37611)).toBe('islandPasture');
    expect(getIslandOtherSource(4779)).toBeNull();
  });

  it('supports old bundles and does not infer crops from names or ID ranges', () => {
    expect(getIslandOtherSource(37596)).toBeNull();
    sourceData.value = {} as BundleData['sources'];
    expect(getIslandOtherSource(37603)).toBeNull();
    expect(getIslandOtherSource(37579)).toBe('islandGranary');
  });

  it.each([tw, cn, en, ja])('exports all source labels in each locale for desktop and mobile', locale => {
    const sources = ['islandFarming', 'islandPasture', 'islandGranary'] as const;
    const ctx: ExportContext = {
      translations: { ...locale.gameData, title: '', progress: '', sectionOther: '', sectionHunt: '',
        sectionBuy: '', sectionGather: '', sectionCraft: '', targetPrice: '', buySourceVendor: '',
        buySourceMarket: '', huntSource: '', exportOfflineNote: '', copyAlarmMacro: '', alarmMacroCopied: '' },
      pageTitle: 'Island', includeMarket: false, isDarkMode: false,
      formatMoney: () => '', getLocalizedName: name => name, getJobName: name => name, renderStars: () => '',
    };
    const html = generateTodoExportHtml([{ key: 'other', items: sources.map((islandSource, id) => ({
      id, islandSource, name: `Item ${id}`, quantity: 1, icon: '',
    })) }], ctx);
    for (const source of sources) expect(html.split(locale.gameData[source])).toHaveLength(3);
  });
});
