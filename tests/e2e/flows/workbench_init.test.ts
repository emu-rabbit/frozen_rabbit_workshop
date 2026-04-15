import { test, expect } from '@playwright/test';
import { setupTest, searchAndSelectItem } from '../utils/test-helpers';

test.describe('E2E Flow: Workbench Initialization and Detail Drawing', () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  test('should initialize workbench with items and display detail drawers', async ({ page }) => {
    // 1. 填入筆記名稱
    await page.locator('#item-name').fill('數據初始化測試');

    // 2. 搜尋並選取物品 (鐵錠在 mock 中是可製作物品)
    await searchAndSelectItem(page, '找尋物品...', '鐵錠', '鐵錠');

    // 3. 儲存並跳轉備料台 (i18n: newNote.save = '好，把這些放上備料台！')
    await page.getByText('好，把這些放上備料台！').click();
    await expect(page).toHaveURL(/.*workbench/);

    // 4. 等待鐵錠 item card 出現（預設製作模式，會自動展開配方顯示子材料）
    const ingotCard = page.locator('.item-card', { hasText: '鐵錠' });
    await expect(ingotCard).toBeVisible({ timeout: 15000 });

    // 5. 展開詳細抽屜：用 CSS :has() 找含 pi-chevron-down 的 button（桌面/手機通用）
    //    桌面版在 .hidden.lg:flex 容器，手機版在 .lg:hidden 容器，但 icon 相同
    //    使用 filter({ visible: true }) 只點擊當前視口下可見的按鈕，避免點到被 lg:hidden/hidden 隱藏的容器
    await ingotCard.locator('button:has(i.pi-chevron-down)').filter({ visible: true }).click();

    // 6. 驗證配方詳情已展開
    //    WorkbenchView 的 i18n: workbench.view.details.craftTitle = '製作配方需求'
    await expect(page.getByText('製作配方需求')).toBeVisible({ timeout: 8000 });
    // 配方中應包含 鐵礦（mock 配方：鐵礦 x4 + 風之碎晶 x1）
    // 使用 heading role 避免 strict mode（detail drawer 內的物品名稱以 h4 顯示）
    await expect(page.getByRole('heading', { name: '鐵礦' })).toBeVisible();
  });
});
