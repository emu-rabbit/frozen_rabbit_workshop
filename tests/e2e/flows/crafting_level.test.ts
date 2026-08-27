import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { sourceFixture, fixturePackages } from '../../fixtures/gameData.mjs';
import { setupTest, searchAndSelectItem } from '../utils/test-helpers';

for (const job of [0, 8]) test(`crafting job ${job} displays only meaningful levels`, async ({ page }) => {
  const sources = sourceFixture();
  // The generator fixture uses ID 10, which the workbench reserves for crystals.
  for (const entry of sources['item-search.index']) {
    if (entry.data?.itemId === 10) entry.data.itemId = 100;
  }
  for (const file of ['items.json', 'tw/tw-items.json', 'zh/zh-items.json', 'item-icons.json', 'equipment.json']) {
    sources[file][100] = sources[file][10];
  }
  for (const recipe of sources['recipes.json'].filter((recipe: any) => recipe.result === 10)) {
    recipe.result = 100;
    recipe.job = job;
    recipe.lvl = 50;
    recipe.stars = 2;
  }
  const packages = fixturePackages(sources);
  await setupTest(page, () => page.route('**/game-data/**', route => {
    const file = new URL(route.request().url()).pathname.split('/').pop()!;
    if (file === 'manifest.json') return route.fulfill({ json: packages.manifest });
    return route.fulfill({ body: packages.assets.get(file), contentType: 'application/octet-stream' });
  }));
  await page.locator('#item-name').fill('製作等級顯示測試');
  await searchAndSelectItem(page, '找尋物品...', '劍', '劍');
  await page.getByText('好，把這些放上備料台！').click();
  const card = page.locator('.item-card').filter({ has: page.getByRole('heading', { name: '劍', exact: true }) });
  await expect(card).toBeVisible();
  await card.locator('button:has(i.pi-chevron-down)').filter({ visible: true }).click();
  const name = job === 0 ? '公會合建' : '木工師';
  const labels = page.locator('span').filter({ hasText: name, visible: true });
  if (job === 0) {
    await expect(labels).toHaveCount(2); // Card and expanded details; no level requirement in the footer.
    for (const label of await labels.all()) await expect(label).toHaveText(name);
  } else {
    // The required-job summary is hidden on mobile.
    await expect(labels).toHaveCount(page.viewportSize()!.width < 640 ? 2 : 3);
    for (const label of await labels.all()) await expect(label).toContainText('Lv.50');
  }
  await page.getByRole('button', { name: /待辦/ }).click();
  await expect(page).toHaveURL(/#todo/);
  const todoLabel = page.locator('span').filter({ hasText: name, visible: true });
  if (job === 0) await expect(todoLabel).toHaveText(name);
  else await expect(page.getByText(/Lv\.50/).filter({ visible: true })).toBeVisible();
  await page.locator('button').filter({ has: page.locator('i.pi-download') }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /確認下載 HTML/ }).click();
  const html = await readFile((await (await downloading).path())!, 'utf8');
  if (job === 0) {
    expect(html).toContain(name);
    expect(html).not.toContain(`${name} Lv.`);
    expect(html).not.toContain('Lv.50');
  } else expect(html).toContain('Lv.50');
});
