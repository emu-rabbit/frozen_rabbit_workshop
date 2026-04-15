import { test, expect } from '@playwright/test';
import { setupTest, navigateTo } from './utils/test-helpers';

test.describe('Baseline Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // 1. 初始化環境 (設定 localStorage, 導向首頁, 禁用動畫)
    await setupTest(page);
  });

  test('should load the homepage and display the correct title', async ({ page }) => {
    // 驗證主標題是否可見
    const title = page.getByText('冷凍兔肉的工坊').filter({ visible: true }).first();
    await expect(title).toBeVisible();
    await expect(page).toHaveTitle(/Frozen Rabbit Workshop/);
  });

  test('sidebar should contain core navigation items', async ({ page, viewport }) => {
    // 如果是手機版尺寸，navigateTo 會自動處理漢堡選單
    const isMobile = viewport && viewport.width < 1024;
    
    // 檢查側邊欄內的文字 (如果是桌面版則直接檢查，手機版會先點開)
    if (isMobile) {
        await page.locator('button i.pi-bars').click();
    }
    
    const sidebar = page.locator('aside').filter({ visible: true });
    await expect(sidebar.getByText('寫張新筆記')).toBeVisible();
    await expect(sidebar.getByText('翻開舊筆記')).toBeVisible();
    await expect(sidebar.getByText('筆記工作台')).toBeVisible();
  });

  test('should navigate between core tabs safely', async ({ page }) => {
    // 1. 使用 Helper 導向筆記工作台 (自動適配手機/桌面)
    await navigateTo(page, '筆記工作台');
    await expect(page).toHaveURL(/.*editor/);
    
    // 2. 導向寫張新筆記
    await navigateTo(page, '寫張新筆記');
    await expect(page).toHaveURL(/.*new/);
  });

  test('initial language should match tw locale', async ({ page }) => {
    // 確保介面上的「筆記工作台」使用的是繁體中文
    const target = page.getByText('筆記工作台').filter({ visible: true }).first();
    await expect(target).toBeVisible();
  });
});
