import { Page, expect } from '@playwright/test';
import {
  mockTwItems,
  mockEnItems,
  mockItemIcons,
  mockRecipes,
  mockPlaces,
  mockMaps,
} from '../data/mock-dictionary';


/**
 * 攔截字典服務的外部網路請求，改用 mock 資料。
 * 這讓測試不依賴 GitHub Raw 的網路速度，確保即時響應。
 * 必須在 page.goto() 之前呼叫。
 *
 * 對應 dictionary.ts 中的 URL 常數：
 *   BASE_URL = https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json
 *   BASE_URL_STAGING = ...staging/...
 */
export async function setupDictionaryMocks(page: Page) {
  const fulfill = (body: unknown) => ({
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  // ── 字典服務（dictionary.ts）─────────────────────────────────────────────
  await page.route('**/tw/tw-items.json', route => route.fulfill(fulfill(mockTwItems)));
  await page.route('**/zh/zh-items.json', route => route.fulfill(fulfill(mockEnItems)));
  await page.route('**/ffxiv-teamcraft/**json/items.json', route => route.fulfill(fulfill(mockEnItems)));
  await page.route('**/item-icons.json', route => route.fulfill(fulfill(mockItemIcons)));
  await page.route('**/recipes.json', route => route.fulfill(fulfill(mockRecipes)));
  await page.route('**/tw/tw-places.json', route => route.fulfill(fulfill(mockPlaces)));
  await page.route('**/ffxiv-teamcraft/**json/places.json', route => route.fulfill(fulfill(mockPlaces)));
  await page.route('**/maps.json', route => route.fulfill(fulfill(mockMaps)));

  // ── 採集服務（gathering.ts）───────────────────────────────────────────────
  // gathering-items.json: { [gatheringItemId]: { itemId, level, stars } }
  await page.route('**/gathering-items.json', route => route.fulfill(fulfill({
    '1': { itemId: 5106, level: 15, stars: 0 },
    '2': { itemId: 5107, level: 10, stars: 0 },
  })));
  // nodes.json: { [nodeId]: { items: [itemId...], type, level, zoneid, map, ... } }
  await page.route('**/nodes.json', route => route.fulfill(fulfill({
    '11': { items: [5106], level: 15, type: 2, limited: false, spawns: [], duration: 0, zoneid: 134, map: 16, x: 22, y: 18 },
    '12': { items: [5107], level: 10, type: 2, limited: false, spawns: [], duration: 0, zoneid: 134, map: 16, x: 20, y: 16 },
  })));
  await page.route('**/gathering-search-index.json', route => route.fulfill(fulfill({})));

  // ── 販售 NPC 服務（vendor.ts）─────────────────────────────────────────────
  // shops.json: NPCshop array
  await page.route('**/shops.json', route => route.fulfill(fulfill([])));
  // npcs.json: { npcId: { en: 'name', position: {...} } }
  await page.route('**/ffxiv-teamcraft/**json/npcs.json', route => route.fulfill(fulfill({})));
  // tw-npcs.json: { npcId: { tw: 'name' } }
  await page.route('**/tw/tw-npcs.json', route => route.fulfill(fulfill({})));

  // ── Universalis 市場價格 API（universalis.ts）─────────────────────────────
  // data-centers 回傳 DataCenter[]，price batch 回傳 { items: {} }
  await page.route('**/universalis.app/api/v2/data-centers', route =>
    route.fulfill(fulfill([{ name: 'Elemental', region: 'Japan', worlds: [] }]))
  );
  // 批次價格查詢 /{dc}/{ids} 回傳 { items: {} }（代表沒有市場資料，但不會 crash）
  await page.route('**/universalis.app/api/v2/**', route =>
    route.fulfill(fulfill({ items: {}, lastUploadTime: 0 }))
  );
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
export async function setupTest(page: Page) {
  // 1. 設定 localStorage（繞過 language selection modal）
  await page.addInitScript(() => {
    window.localStorage.setItem('frozen-rabbit-initialized', 'true');
    window.localStorage.setItem('frozen-rabbit-lang', 'tw');
  });

  // 2. 禁用動畫
  await disableAnimations(page);

  // 3. Mock 字典網路請求（必須在 goto 之前設定）
  await setupDictionaryMocks(page);

  // 4. 載入頁面
  await page.goto('/');

  // 5. 確認應用程式標題可見（確保 Vue 已掛載）
  await expect(
    page.getByText('冷凍兔肉的工坊').filter({ visible: true }).first()
  ).toBeVisible({ timeout: 10000 });
}
