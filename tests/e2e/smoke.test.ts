import { test, expect } from '@playwright/test';
import { setupTest, navigateTo } from './utils/test-helpers';

test('home and sidebar navigation preserve the deployment path', { tag: '@deployment' }, async ({ page }) => {
  await setupTest(page);
  await expect(page).toHaveTitle(/冷凍兔肉的工坊/);
  await expect(page.locator('#item-name')).toBeVisible();
  const path = new URL(page.url()).pathname;

  for (const [label, hash] of [['翻開舊筆記', '#history'], ['筆記工作台', '#editor'], ['寫張新筆記', '#new']]) {
    await navigateTo(page, label!);
    await expect(page).toHaveURL(url => url.pathname === path && url.hash === hash);
  }
  await expect(page.locator('#item-name')).toBeVisible();
});
