import { test, expect, type Page } from '@playwright/test';
import { dismissAnalyticsPrompt, navigateTo } from './utils/test-helpers';

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
