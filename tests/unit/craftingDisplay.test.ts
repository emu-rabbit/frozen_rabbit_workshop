import { describe, expect, it } from 'vitest';
import { hasCraftingLevel } from '../../src/utils/craftingDisplay';
import { generateTodoExportHtml, type ExportContext } from '../../src/services/exportHtml';

describe('crafting level display', () => {
  it.each([0, -10, undefined])('omits levels for special or missing crafting jobs: %s', job => {
    expect(hasCraftingLevel(job)).toBe(false);
  });
  it.each([8, 9, 10, 11, 12, 13, 14, 15])('keeps levels for regular crafting jobs: %s', job => {
    expect(hasCraftingLevel(job)).toBe(true);
  });
  it.each([0, -10, 8])('uses the same level and star rule in HTML exports: %s', job => {
    const ctx: ExportContext = {
      translations: { title: '', progress: '', sectionOther: '', sectionHunt: '', sectionBuy: '',
        sectionGather: '', sectionCraft: '', targetPrice: '', buySourceVendor: '', buySourceMarket: '',
        huntSource: '', exportOfflineNote: '', copyAlarmMacro: '', alarmMacroCopied: '',
        islandGranary: '', islandFarming: '', islandPasture: '' },
      pageTitle: 'Crafting', includeMarket: false, isDarkMode: false,
      formatMoney: () => '', getLocalizedName: name => name, getJobName: name => name, renderStars: () => '★★',
    };
    const html = generateTodoExportHtml([{ key: 'craft', items: [{ id: 1, name: 'Item', quantity: 1,
      icon: '', crafting: { job, jobName: 'Crafting job', level: 50, stars: 2 } }] }], ctx);
    expect(html).toContain('Crafting job');
    if (job === 8) expect(html).toContain('Lv.50★★');
    else {
      expect(html).not.toContain('Lv.');
      expect(html).not.toContain('★★');
    }
  });
});
