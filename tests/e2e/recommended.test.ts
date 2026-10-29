import { test, expect, type Page } from '@playwright/test';
import { dismissAnalyticsPrompt, navigateTo } from './utils/test-helpers';
import glamourNotes from '../../src/data/recommended/glamour.json' with { type: 'json' };
import submarineNotes from '../../src/data/recommended/submarine.json' with { type: 'json' };

async function start(page: Page) {
  await dismissAnalyticsPrompt(page);
  await page.addLocatorHandler(page.getByRole('button', { name: /^(拒绝|拒否|Reject)$/ }), async button => { await button.click(); });
  await page.addInitScript(() => {
    localStorage.setItem('frozen-rabbit-initialized', 'true');
    localStorage.setItem('frozen-rabbit-migration-dismissed', 'true');
    if (!localStorage.getItem('frozen-rabbit-lang')) localStorage.setItem('frozen-rabbit-lang', 'tw');
  });
  // Keep real catalog/recipes/sources; only external market and icons are stubbed.
  await page.route('**/universalis.app/api/v2/**', route => route.fulfill({ json: { items: {}, lastUploadTime: 0 } }));
  await page.route('**/v2.xivapi.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"/>' }));
  await page.goto('./#recommended');
  await expect(page.getByTestId('recommended-notes').getByTestId('note-card')).toHaveCount(20);
}

test('relic tool requirements support localized filters, collections, favorites and raw materials', async ({ page }) => {
  await start(page);
  for (const [locale, category, title, apply, name] of [
    ['tw', '工具強化任務', '篩選筆記', '套用', '莫雯卓越工具 木工師需求大總匯'],
    ['cn', '主工具强化任务', '筛选笔记', '应用', '莫雯卓越工具 刻木匠需求大总汇'],
    ['en', 'Tool Enhancement Quests', 'Filter Notes', 'Apply', 'Splendorous Tools Carpenter Complete Requirements'],
    ['ja', '主道具強化', 'ノートを絞り込む', '適用', 'モーエンツール 木工師全段階必要アイテム'],
  ] as const) {
    await page.evaluate(locale => localStorage.setItem('frozen-rabbit-lang', locale), locale);
    await page.reload();
    const view = page.getByTestId('recommended-notes');
    await view.getByRole('button', { name: title, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title });
    await dialog.getByRole('checkbox', { name: category, exact: true }).check();
    await dialog.getByRole('button', { name: apply, exact: true }).click();
    await expect(view.getByTestId('note-card')).toHaveCount(20);
    await view.getByRole('textbox').fill(name);
    await expect(view.getByTestId('note-card')).toHaveCount(1);
    await expect(view.getByRole('heading', { level: 3 })).toHaveText(name);
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.evaluate(() => localStorage.setItem('frozen-rabbit-lang', 'tw'));
  await page.reload();
  const view = page.getByTestId('recommended-notes');
  await view.getByRole('textbox').fill('莫雯卓越工具 能工巧匠需求大總匯');
  await expect(view.getByTestId('note-card')).toHaveCount(1);
  await expect(view.getByTestId('note-card')).toContainText('這張筆記裡面有 (1200)');
  await view.getByRole('textbox').fill('天鋼工具 能工巧匠需求大總匯');
  await expect(view.getByTestId('note-card')).toHaveCount(1);
  await expect(view.getByTestId('note-card')).toContainText('這張筆記裡面有 (872)');
  await view.getByRole('textbox').fill('莫雯卓越工具 木工師需求大總匯');
  await view.getByTestId('note-card').getByRole('button', { name: '加入我的收藏' }).click();
  await page.reload();
  await navigateTo(page, '收藏的小筆記');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-favorites-data')!)[0]);
  expect(saved.items).toEqual([{ id: 38756, quantity: 20 }, { id: 38764, quantity: 30 }, { id: 39773, quantity: 30 }, { id: 39781, quantity: 30 }, { id: 41254, quantity: 20 }, { id: 41262, quantity: 20 }]);
  await page.getByTestId('note-card').getByRole('button', { name: /備料台/ }).click();
  await expect(page.getByRole('heading', { name: '給收藏家的座椅', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '卓越商會特選鐵木木材', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/relic-tools-${test.info().project.name}.png` });
});

test('submersible category supports six builds, localized search, favorites and preparation', async ({ page }) => {
  await start(page);
  const note = submarineNotes.find(note => note.id === 'recommend_submarine_5124_modified')!;
  for (const [locale, category, title, apply] of [
    ['tw', '潛水艇部件', '篩選筆記', '套用'],
    ['cn', '潜水艇部件', '筛选笔记', '应用'],
    ['en', 'Submersible Components', 'Filter Notes', 'Apply'],
    ['ja', '潜水艦パーツ', 'ノートを絞り込む', '適用'],
  ] as const) {
    await page.evaluate(locale => localStorage.setItem('frozen-rabbit-lang', locale), locale);
    await page.reload();
    const view = page.getByTestId('recommended-notes');
    await view.getByRole('button', { name: title, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title });
    await dialog.getByRole('checkbox', { name: category, exact: true }).check();
    await dialog.getByRole('button', { name: apply, exact: true }).click();
    await expect(view.getByTestId('note-card')).toHaveCount(6);
    await expect(view.getByRole('heading', { level: 3 })).toHaveText(submarineNotes.map(note => note.name[locale]));
    await view.getByRole('textbox').fill(note.name[locale]);
    await expect(view.getByTestId('note-card')).toHaveCount(1);
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.evaluate(() => localStorage.setItem('frozen-rabbit-lang', 'tw'));
  await page.reload();
  const view = page.getByTestId('recommended-notes');
  await view.getByRole('textbox').fill('5124改');
  await view.getByTestId('note-card').getByRole('button', { name: '加入我的收藏' }).click();
  await page.reload();
  await navigateTo(page, '收藏的小筆記');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-favorites-data')!)[0]);
  expect(saved.items).toEqual(note.items);
  await page.getByTestId('note-card').getByRole('button', { name: /備料台/ }).click();
  await expect(page).toHaveURL(/#workbench/);
  await expect(page.getByRole('heading', { name: '希爾德拉改級船體', exact: true })).toBeVisible();
});

test('glamour category supports localized search, themes, favorites and preparation', async ({ page }) => {
  await start(page);
  const note = glamourNotes.find(note => note.items.some(item => item.id === 32799))!;
  const cases = [
    ['tw', '時裝', '篩選筆記', '套用'],
    ['cn', '时装', '筛选笔记', '应用'],
    ['en', 'Glamour', 'Filter Notes', 'Apply'],
    ['ja', 'おしゃれ装備', 'ノートを絞り込む', '適用'],
  ] as const;
  for (const [locale, category, title, apply] of cases) {
    await page.evaluate(locale => localStorage.setItem('frozen-rabbit-lang', locale), locale);
    await page.reload();
    const view = page.getByTestId('recommended-notes');
    await view.getByRole('button', { name: title, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title });
    await dialog.getByRole('checkbox', { name: category, exact: true }).check();
    await dialog.getByRole('button', { name: apply, exact: true }).click();
    await expect(view.getByTestId('note-card')).toHaveCount(20);
    await view.getByRole('textbox').fill(note.name[locale]);
    await expect(view.getByTestId('note-card')).toHaveCount(1);
    await expect(view.getByRole('heading', { level: 3 })).toHaveText(note.name[locale]);
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.evaluate(() => localStorage.setItem('frozen-rabbit-lang', 'tw'));
  await page.reload();
  const view = page.getByTestId('recommended-notes');
  await view.getByRole('textbox').fill('春意');
  await expect(view.getByTestId('note-card')).toHaveCount(1);
  await expect(view.getByRole('heading', { level: 3 })).toHaveText('春意服飾套裝');
  await expect(view.getByTestId('note-card')).toContainText('這張筆記裡面有 (4)');
  await page.screenshot({ path: `.cache/game-data/glamour-inventory/spring-${test.info().project.name}.png` });
  await view.getByRole('textbox').fill('校園');
  await expect(view.getByTestId('note-card')).toHaveCount(4);
  await expect(view.getByText('校園平頂帽', { exact: true })).toHaveCount(4);
  await expect(view.getByText('校園皮鞋', { exact: true })).toHaveCount(4);
  await view.getByRole('textbox').fill('小牛皮騎手');
  const card = view.getByTestId('note-card');
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: '加入我的收藏' }).click();
  await page.reload();
  await navigateTo(page, '收藏的小筆記');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-favorites-data')!)[0]);
  expect(saved.items).toEqual(note.items);
  await page.getByTestId('note-card').getByRole('button', { name: /備料台/ }).click();
  await expect(page).toHaveURL(/#workbench/);
  await expect(page.getByRole('heading', { name: '小牛皮騎手外套', exact: true })).toBeVisible();
});

test('note filters apply, cancel and clear independently from keyword search', async ({ page }) => {
  await start(page);
  const view = page.getByTestId('recommended-notes');
  const open = view.getByRole('button', { name: '篩選筆記' });
  await view.locator('.p-paginator-next').click();
  await open.click();
  const dialog = page.getByRole('dialog', { name: '篩選筆記' });
  await dialog.getByRole('checkbox', { name: '木工師', exact: true }).check();
  await dialog.getByRole('checkbox', { name: '巧匠職業任務', exact: true }).check();
  await dialog.getByRole('button', { name: '套用', exact: true }).click();
  await expect(view.getByTestId('note-card')).toHaveCount(1);
  await expect(view.getByRole('heading', { level: 3 })).toHaveText('木工師職業任務需求道具');
  await open.click();
  await dialog.getByRole('button', { name: '清除篩選' }).click();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(view.getByTestId('note-card')).toHaveCount(1);
  await open.click();
  await expect(dialog.getByRole('checkbox', { name: '木工師', exact: true })).toBeChecked();
  await dialog.getByRole('button', { name: '清除篩選' }).click();
  await dialog.getByRole('button', { name: '展開全部職業' }).click();
  await dialog.getByRole('checkbox', { name: '騎士', exact: true }).check();
  await dialog.getByRole('checkbox', { name: '100', exact: true }).check();
  await dialog.getByRole('checkbox', { name: '戰鬥職套裝', exact: true }).check();
  await dialog.getByRole('button', { name: '套用', exact: true }).click();
  await view.getByRole('textbox').fill('710');
  await expect(view.getByTestId('note-card')).toHaveCount(2);
  await view.getByRole('textbox').fill('no matching note');
  await expect(view.getByTestId('note-card')).toHaveCount(0);
  await open.click();
  await dialog.getByRole('button', { name: '清除篩選' }).click();
  await dialog.getByRole('button', { name: '套用', exact: true }).click();
  await expect(view.getByRole('textbox')).toHaveValue('no matching note');
  await view.getByRole('textbox').fill('');
  await expect(view.getByTestId('note-card')).toHaveCount(20);
});

test('search and applied filters survive navigation but reset on reload', async ({ page }) => {
  await start(page);
  const view = page.getByTestId('recommended-notes');
  const open = view.getByRole('button', { name: '篩選筆記' });
  const dialog = page.getByRole('dialog', { name: '篩選筆記' });
  await open.click();
  await dialog.getByRole('button', { name: '展開全部職業' }).click();
  for (const name of ['騎士', '100', '戰鬥職套裝']) {
    await dialog.getByRole('checkbox', { name, exact: true }).check();
  }
  await dialog.getByRole('button', { name: '套用', exact: true }).click();
  await view.getByRole('textbox').fill('710');
  await expect(view.getByTestId('note-card')).toHaveCount(2);
  const titles = await view.getByRole('heading', { level: 3 }).allTextContents();

  await navigateTo(page, '收藏的小筆記');
  await expect(view).toHaveCount(0);
  await page.evaluate(() => { location.hash = 'recommended'; });
  await expect(view.getByRole('textbox')).toHaveValue('710');
  await expect(view.getByRole('heading', { level: 3 })).toHaveText(titles);
  await open.click();
  await dialog.getByRole('button', { name: '展開全部職業' }).click();
  for (const name of ['騎士', '100', '戰鬥職套裝']) {
    await expect(dialog.getByRole('checkbox', { name, exact: true })).toBeChecked();
  }
  await dialog.getByRole('button', { name: '清除篩選' }).click();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await navigateTo(page, '收藏的小筆記');
  await expect(view).toHaveCount(0);
  await page.evaluate(() => { location.hash = 'recommended'; });
  await expect(view.getByRole('textbox')).toHaveValue('710');
  await expect(view.getByRole('heading', { level: 3 })).toHaveText(titles);

  await page.reload();
  await expect(view.getByRole('textbox')).toHaveValue('');
  await expect(view.getByTestId('note-card')).toHaveCount(20);
  await open.click();
  await expect(dialog.getByRole('checkbox', { checked: true })).toHaveCount(0);
});

test('note filter dialog fits all locales in light and dark themes', async ({ page }) => {
  await start(page);
  for (const locale of ['tw', 'cn', 'en', 'ja']) {
    await page.evaluate(locale => localStorage.setItem('frozen-rabbit-lang', locale), locale);
    await page.reload();
    await page.getByTestId('recommended-notes').getByRole('button', { name: /篩選筆記|筛选笔记|Filter Notes|ノートを絞り込む/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('checkbox')).toHaveCount(18);
    const toggle = dialog.getByRole('button', { name: /展開全部職業|展开全部职业|Show All Jobs|すべてのジョブを表示/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(dialog.getByRole('checkbox')).toHaveCount(45);
    const jobs = dialog.locator('fieldset').first();
    await jobs.getByRole('checkbox').last().check();
    await dialog.getByRole('button', { name: /收合職業|收起职业|Show Fewer Jobs|ジョブを折りたたむ/ }).click();
    await expect(dialog.getByRole('checkbox')).toHaveCount(18);
    await toggle.click();
    await expect(jobs.getByRole('checkbox').last()).toBeChecked();
    await dialog.getByRole('button', { name: /收合職業|收起职业|Show Fewer Jobs|ジョブを折りたたむ/ }).click();
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(dialog.getByRole('button').last()).toBeInViewport();
    }
    if (locale === 'tw') await page.screenshot({ path: `test-results/note-filters-${test.info().project.name}.png` });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('search after paging, save a complete paladin set, reload and open the workbench', { tag: '@deployment' }, async ({ page }) => {
  await start(page);
  const view = page.getByTestId('recommended-notes');
  await view.locator('.p-paginator-next').click();
  await view.getByRole('textbox').fill('710');
  await expect(view.getByTestId('note-card').first().getByRole('heading')).toHaveText('Lv.100 iLv710 騎士十二件套裝');
  await view.getByRole('textbox').fill('PLD 710');
  const card = view.getByTestId('note-card');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('heading')).toHaveText('Lv.100 iLv710 騎士十二件套裝');
  await expect(card).toContainText('這張筆記裡面有 (12)');
  await card.getByRole('button', { name: '加入我的收藏' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-favorites-data')!)[0]);
  expect(saved.items.slice(0, 2)).toEqual([{ id: 42870, quantity: 1 }, { id: 42891, quantity: 1 }]);
  expect(saved.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)).toBe(12);
  await page.reload();
  await navigateTo(page, '收藏的小筆記');
  const favorite = page.getByTestId('note-card');
  await expect(favorite.getByRole('heading')).toContainText('騎士十二件套裝');
  await favorite.getByRole('button', { name: /備料台/ }).click();
  await expect(page).toHaveURL(/#workbench/);
  await expect(page.locator('.item-card').first()).toBeVisible();
  await expect(page.getByText('Lv.100 iLv710 騎士十二件套裝', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '舊日王國寬刃劍', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '舊日王國步兵盾', exact: true })).toBeVisible();
});

test('profession mixed sets and official names work in all locales and themes', async ({ page }) => {
  await start(page);
  const cases = [
    ['tw', '木工師 720+690', '木工師十二件套裝'],
    ['cn', '刻木匠 720+690', '刻木匠十二件套装'],
    ['en', 'Carpenter 720+690', 'Carpenter 12-piece Set'],
    ['ja', '木工師 720+690', '木工師12点セット'],
  ];
  for (const [locale, query, title] of cases) {
    await page.evaluate(locale => localStorage.setItem('frozen-rabbit-lang', locale!), locale);
    await page.reload();
    const view = page.getByTestId('recommended-notes');
    await view.getByRole('textbox').fill(query!);
    await expect(view.getByTestId('note-card')).toHaveCount(1);
    await expect(view.getByRole('heading', { level: 3 })).toContainText(title!);
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    for (const dark of [false, true]) {
      await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('main').evaluate(element => { element.scrollTop = 0; });
      const open = view.getByTestId('note-card').getByRole('button').last();
      await open.scrollIntoViewIfNeeded();
      await expect(open).toBeVisible();
    }
  }
  await page.getByTestId('recommended-notes').getByRole('textbox').fill('巧匠二十六 720+690');
  await expect(page.getByTestId('note-card')).toHaveCount(1);
  await page.getByTestId('recommended-notes').getByRole('textbox').fill('大地十五 720+690');
  await expect(page.getByTestId('note-card')).toHaveCount(1);
});

test('leveling professions keep armor-only tiers separate and save complete collective equipment', async ({ page }) => {
  await start(page);
  const view = page.getByTestId('recommended-notes');
  for (const level of [51, 61]) {
    await view.getByRole('textbox').fill(`Lv.${level}`);
    await expect(view.getByTestId('note-card')).toHaveCount(2);
    for (const card of await view.getByTestId('note-card').all()) {
      await expect(card.getByRole('heading')).toContainText('五件套裝');
      await expect(card).toContainText('這張筆記裡面有 (5)');
    }
  }
  for (const level of [71, 81, 91]) {
    await view.getByRole('textbox').fill(`Lv.${level}`);
    await expect(view.getByTestId('note-card')).toHaveCount(15);
    await expect(view.getByTestId('note-card').first().getByRole('heading')).toContainText('十二件套裝');
  }
  await view.getByRole('textbox').fill('Lv.91 巧匠二十六');
  const card = view.getByTestId('note-card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('這張筆記裡面有 (26)');
  await card.getByRole('button', { name: '加入我的收藏' }).click();
  await page.reload();
  await navigateTo(page, '收藏的小筆記');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-favorites-data')!)[0]);
  expect(saved.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)).toBe(26);
  await page.getByTestId('note-card').getByRole('button', { name: /備料台/ }).click();
  await expect(page).toHaveURL(/#workbench/);
  await expect(page.locator('.item-card').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '奧闊鉻鐵手鋸', exact: true })).toBeVisible();
});
