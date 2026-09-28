import { test, expect } from '@playwright/test';
import { setupTest, searchAndSelectItem } from '../utils/test-helpers';

test.describe('E2E Flow: Recursive Calculation and Reset', () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test('should handle recursive demand calculation and reset state', async ({ page }) => {
    // 1. 建立一筆包含可製作物品 (鐵錠) 的筆記
    await page.locator('#item-name').fill('遞迴測試筆記');
    await searchAndSelectItem(page, '找尋物品...', '鐵錠', '鐵錠');
    await page.locator('input[type="number"]').fill('10');

    // 儲存 (i18n: newNote.save = '好，把這些放上備料台！')
    await page.getByText('好，把這些放上備料台！').click();
    await expect(page).toHaveURL(/.*workbench/);

    // 2. 等待備料台載入
    //    Mock 配方：鐵錠 = 鐵礦x4 + 風之碎晶x1
    //    鐵錠(root) 預設「製作」→ 自動展開 → 出現 鐵礦 + 風之碎晶
    //    初始應有 3 張 item-card：鐵錠、鐵礦、風之碎晶
    const ingotCard = page.locator('.item-card', { hasText: '鐵錠' });
    await expect(ingotCard).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.item-card')).toHaveCount(3);

    // 3. 將鐵錠設為「購買」（craft=0, buy=max）→ 遞迴需求消失，只剩鐵錠本身
    //    source grid 欄位：buy(nth 0), craft(nth 1), gather(nth 2), other(nth 3)
    //    << (nth 0) = Min，>> (nth 1) = Max
    const craftCell = ingotCard.locator('.grid > div').nth(1); // craft 欄
    await craftCell.locator('button').nth(0).click(); // << 設 craft=0

    const buyCell = ingotCard.locator('.grid > div').nth(0); // buy 欄
    await buyCell.locator('button').nth(1).click(); // >> 設 buy=max=10

    // 4. 遞迴需求消失 → 只剩鐵錠 1 張卡
    await expect(page.locator('.item-card')).toHaveCount(1, { timeout: 8000 });
    await expect(page.getByRole('heading', { name: '鐵礦' })).not.toBeVisible();

    // 5. 測試重設（i18n: workbench.view.button.reset = '重設'）
    //    重設後回到預設值：鐵錠 → 製作，展開回 3 張
    const rejectAnalytics = page.getByRole('button', { name: '拒絕', exact: true });
    if (await rejectAnalytics.isVisible()) await rejectAnalytics.click();
    await page.getByText('重設').click();
    await expect(page.locator('.item-card')).toHaveCount(3, { timeout: 8000 });
    await expect(page.getByRole('heading', { name: '鐵礦' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '風之碎晶' })).toBeVisible();
  });

  test('allows splitting a full craft allocation into craft and existing stock', async ({ page }) => {
    await page.locator('#item-name').fill('庫存與製作分配測試');
    await searchAndSelectItem(page, '找尋物品...', '鐵錠', '鐵錠');
    await page.locator('input[type="number"]').fill('30');
    await page.getByText('好，把這些放上備料台！').click();
    await expect(page).toHaveURL(/.*workbench/);

    const ingotCard = page.locator('.item-card').filter({ has: page.locator('h3').getByText('鐵錠', { exact: true }) });
    const oreCard = page.locator('.item-card').filter({ has: page.locator('h3').getByText('鐵礦', { exact: true }) });
    const craftInput = ingotCard.locator('.grid > div').nth(1).locator('input');
    const stockInput = ingotCard.locator('.grid > div').nth(3).locator('input');
    const oreBuyInput = oreCard.locator('input[type="number"]').first();
    const oreStockInput = oreCard.locator('input[type="number"]').nth(3);
    await expect(craftInput).toHaveValue('30');
    await expect(oreBuyInput).toHaveValue('120');

    await oreBuyInput.fill('100');
    await oreBuyInput.blur();
    await expect(oreBuyInput).toHaveValue('100');
    await craftInput.fill('20');
    await craftInput.blur();
    await expect(craftInput).toHaveValue('20');
    await expect(oreBuyInput).toHaveValue('80');
    await stockInput.fill('10');
    await stockInput.blur();
    await expect(craftInput).toHaveValue('20');
    await expect(stockInput).toHaveValue('10');
    await expect(page.getByRole('button', { name: '生成待辦清單' })).toBeEnabled();

    await oreBuyInput.fill('70');
    await oreBuyInput.blur();
    await oreStockInput.fill('10');
    await oreStockInput.blur();
    await craftInput.fill('10');
    await craftInput.blur();
    await stockInput.fill('20');
    await stockInput.blur();
    await expect(oreBuyInput).toHaveValue('70');
    await expect(oreStockInput).toHaveValue('10');
    await expect(page.getByRole('button', { name: '生成待辦清單' })).toBeDisabled();
  });
});
