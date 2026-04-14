import { test, expect } from '@playwright/test';

test.describe('Baseline Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // 預先設定 localStorage，跳過歡迎視窗與語系選擇
    await page.addInitScript(() => {
      window.localStorage.setItem('frozen-rabbit-initialized', 'true');
      window.localStorage.setItem('frozen-rabbit-lang', 'tw');
    });
  });

  test('should load the homepage and display the correct title', async ({ page, viewport }) => {
    await page.goto('/');

    // 不論手機還是電腦版，標題都應該在畫面上
    const title = page.getByText('冷凍兔肉的工坊').filter({ visible: true }).first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('sidebar should contain core navigation items', async ({ page, viewport }) => {
    await page.goto('/');

    // 如果是手機版尺寸，需要先點開漢堡選單
    const isMobile = viewport && viewport.width < 1024;
    if (isMobile) {
      // 點擊右上角漢堡選單按鈕 (pi-bars)
      await page.locator('button i.pi-bars').click();
    }

    // 現在檢查側邊欄內的文字
    const sidebar = page.locator('aside').filter({ visible: true });
    await expect(sidebar.getByText('寫張新筆記')).toBeVisible();
    await expect(sidebar.getByText('翻開舊筆記')).toBeVisible();
  });

  test('initial language should match tw locale', async ({ page, viewport }) => {
    await page.goto('/');
    
    // 如果是手機版尺寸，點開選單
    if (viewport && viewport.width < 1024) {
      await page.locator('button i.pi-bars').click();
    }

    // 檢查特定的繁體中文按鈕文字是否存在於畫面上
    await expect(page.getByText('筆記工作台').filter({ visible: true })).toBeVisible();
  });
});
