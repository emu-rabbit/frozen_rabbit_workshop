import { Page, expect } from '@playwright/test';
import { sourceFixture, fixturePackages } from '../../fixtures/gameData.mjs';
import {
  mockTwItems,
  mockEnItems,
  mockItemIcons,
  mockRecipes,
  mockItemSearchIndex,
  mockEquipment,
  mockJobNames,
  mockSearchCategories,
  mockPlaces,
  mockMaps,
} from '../data/mock-dictionary';


/** Same-site packages are built with the production generator, never upstream runtime mocks. */
export function mockGamePackages(ingotName = '鐵錠') {
  const sources = sourceFixture();
  Object.assign(sources, {
    'item-search.index': [...mockItemSearchIndex, { id: -10000, en: 'Cozy Cabin I', data: { itemId: -10000, icon: '/api/asset?path=cabin' } }],
    'equipment.json': { 1: {}, ...mockEquipment }, 'job-name.json': mockJobNames, 'item-category.json': mockSearchCategories,
    'items.json': { ...mockEnItems, 37561: { en: 'Island Palm Log' }, 37579: { en: 'Raw Island Garnet' } },
    'tw/tw-items.json': { ...mockTwItems, 5057: ingotName, 37561: '無人島棕櫚原木', 37579: '無人島石榴石原石' },
    'item-icons.json': mockItemIcons,
    'recipes.json': [...mockRecipes, { id: 'mji-building-0.0', result: -10000, yields: 1, job: -10, lvl: 1, ingredients: [{ id: 37561, amount: 10 }, { id: 37579, amount: 3 }] }],
    'places.json': mockPlaces, 'maps.json': mockMaps,
    'gathering-items.json': { 1: { itemId: 5106, level: 15, stars: 0 }, 2: { itemId: 5107, level: 10, stars: 0 } },
    'nodes.json': {
      11: { items: [5106], level: 15, type: 2, zoneid: 134, map: 16, x: 22, y: 18 },
      12: { items: [5107], level: 10, type: 2, zoneid: 134, map: 16, x: 20, y: 16 }
    },
    'island-gathering-items.json': { 37561: { itemId: 37561, x: 18.39, y: 24.26 } }
  });
  return fixturePackages(sources);
}
export async function setupDictionaryMocks(page: Page) {
  const packages = mockGamePackages();
  await page.route('**/game-data/**', route => {
    const file = new URL(route.request().url()).pathname.split('/').pop()!;
    if (file === 'manifest.json') return route.fulfill({ json: packages.manifest });
    const body = packages.assets.get(file);
    return body ? route.fulfill({ contentType: 'application/octet-stream', body }) : route.fulfill({ status: 404 });
  });
  await page.route('**/raw.githubusercontent.com/**', route => route.abort());
  await page.route('**/universalis.app/api/v2/**', route => route.fulfill({ json: { items: {}, lastUploadTime: 0 } }));
  await page.route('**/universalis.app/api/v2/data-centers', route => route.abort());
}

/**
 * 在 PrimeVue AutoComplete 中搜尋並選取物品。
 *
 * PrimeVue AutoComplete 需要逐字觸發 input 事件，
 * 不能用 fill()，必須用 pressSequentially() 來觸發 @complete callback。
 * 有了字典 mock，這個操作應在 1-2 秒內完成。
 */
export async function searchAndSelectItem(
  page: Page,
  placeholder: string,
  query: string,
  itemText: string
) {
  const input = page.getByPlaceholder(placeholder);
  await input.click();
  await input.pressSequentially(query, { delay: 80 });
  // 等待 overlay 面板出現（class 在 PrimeVue v4 改為 p-autocomplete-overlay）
  await page.locator('.p-autocomplete-overlay').waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('.p-autocomplete-overlay').getByText(itemText).first().click();
}

/**
 * 禁用 CSS 動畫與過渡，提升 E2E 測試穩定度。
 * 注意：只禁用 transition，保留 animation-duration 以避免影響 PrimeVue 的 JS hooks。
 */
export async function disableAnimations(page: Page) {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      *, *::before, *::after {
        transition-duration: 0ms !important;
        animation-duration: 1ms !important;
      }
    `;
    document.head.appendChild(style);
  });
}

/**
 * 智慧側邊欄導航（支援桌面與手機版）
 */
export async function navigateTo(page: Page, tabName: string) {
  const isMobile = await page.evaluate(() => window.innerWidth < 1024);

  if (isMobile) {
    const menuBtn = page.locator('button i.pi-bars').filter({ visible: true }).first();
    await menuBtn.click();
    // 手機版展開後可能有多個 aside（外層 drawer + 內層 content），用 first() 避免 strict mode
    await expect(page.locator('aside').filter({ visible: true }).first()).toBeVisible();
  }

  const targetBtn = page.locator('aside').filter({ visible: true }).first().getByText(tabName).first();
  await targetBtn.click();

  if (isMobile) {
    try {
      await expect(page.locator('aside').filter({ visible: true }).first()).not.toBeVisible({ timeout: 2000 });
    } catch {
      // 若沒自動關閉，忽略
    }
  }
}

/**
 * 通用基礎設定：跳過啟動視窗、設定語系、禁用動畫、mock 字典請求。
 * 所有 flow tests 的 beforeEach 都應呼叫此函式。
 */
export async function setupTest(page: Page, beforeGoto?: () => Promise<void>) {
  // 1. 設定 localStorage（繞過 language selection modal）
  await page.addInitScript(() => {
    window.localStorage.setItem('frozen-rabbit-initialized', 'true');
    window.localStorage.setItem('frozen-rabbit-lang', 'tw');
  });

  // 2. 禁用動畫
  await disableAnimations(page);

  // 3. Mock 字典網路請求（必須在 goto 之前設定）
  await setupDictionaryMocks(page);
  await beforeGoto?.();

  // 4. 載入頁面
  await page.goto('./');

  // 5. 確認應用程式標題可見（確保 Vue 已掛載）
  await expect(
    page.getByText('冷凍兔肉的工坊').filter({ visible: true }).first()
  ).toBeVisible({ timeout: 10000 });
}
