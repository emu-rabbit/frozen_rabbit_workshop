import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mockGamePackages, setupTest, searchAndSelectItem, navigateTo } from './utils/test-helpers';

async function badgeStyle(locator: Locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    return [style.color, style.backgroundColor, style.borderColor, style.borderRadius, style.fontSize, style.padding];
  });
}

async function storedVersion(page: Page, key = 'active') {
  return page.evaluate(async key => {
    return new Promise<string | null>((resolve, reject) => {
      const open = indexedDB.open('frozen-rabbit-workshop:data:/frozen_rabbit_workshop/', 1);
      // Inspection must not create an empty DB before the application's schema upgrade.
      open.onupgradeneeded = () => { open.transaction?.abort(); resolve(null); };
      open.onerror = () => open.error?.name === 'AbortError' ? resolve(null) : reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains('versions')) { db.close(); resolve(null); return; }
        const request = db.transaction('versions').objectStore('versions').get(key);
        request.onsuccess = () => { db.close(); resolve(request.result?.manifest?.version || null); };
        request.onerror = () => { db.close(); reject(request.error); };
      };
    });
  }, key).catch(error => {
    if (String(error).includes('Execution context was destroyed')) return null;
    throw error;
  });
}
test('search works before phase two; island materials reach gathering and other todos', async ({ page }) => {
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await setupTest(page, () => page.route('**/game-data/sources.*', async route => { await hold; await route.fallback(); }));
  await page.locator('#item-name').fill('無人島備料測試');
  await searchAndSelectItem(page, '找尋物品...', 'Cozy Cabin', 'Cozy Cabin I');
  await expect(page.getByTestId('game-data-status')).toHaveCount(0);
  release();
  await page.getByText('好，把這些放上備料台！').click();
  await expect(page.locator('.item-card', { hasText: 'Cozy Cabin I' })).toBeVisible();
  await expect(page.locator('.item-card', { hasText: 'Cozy Cabin I' }).getByText('開拓建造', { exact: true }).first()).toBeVisible();
  const log = page.locator('.item-card').filter({ has: page.getByRole('heading', { name: '無人島棕櫚原木', exact: true }) });
  const garnet = page.locator('.item-card').filter({ has: page.getByRole('heading', { name: '無人島石榴石原石', exact: true }) });
  await expect(log).toBeVisible(); await expect(garnet).toBeVisible();
  const granaryBadge = garnet.getByText('屯貨倉庫', { exact: true });
  await expect(granaryBadge).toBeVisible();
  expect(await badgeStyle(granaryBadge)).toEqual(await badgeStyle(log.getByText('開拓採集', { exact: true }).first()));
  await expect(log.locator('input[type=number]').nth(2)).toHaveValue('10');
  await expect(garnet.locator('input[type=number]').nth(3)).toHaveValue('3');
  await expect(page.getByText('無人島其他來源', { exact: true })).toHaveCount(0);
  await expect(page.getByText('僅計算所選階段，不包含前置建設或解鎖需求。', { exact: true })).toHaveCount(0);
  await expect(page.getByText('時間估算不包含無人島建設、製作與採集。', { exact: true })).toHaveCount(0);
  for (const index of [0, 1, 2]) await expect(garnet.locator('input[type=number]').nth(index)).toBeDisabled();
  // Production previews show analytics consent; dismiss it before using the bottom action bar.
  const rejectAnalytics = page.getByRole('button', { name: '拒絕', exact: true });
  if (await rejectAnalytics.isVisible()) await rejectAnalytics.click();
  await page.getByRole('button', { name: /待辦/ }).click();
  await expect(page).toHaveURL(/#todo/);
  await expect(page.getByText('開拓建造', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '無人島石榴石原石', exact: true })).toBeVisible();
  await expect(page.getByText('無人島其他來源', { exact: true })).toHaveCount(0);
  await expect(page.getByText('開拓採集', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('X:18.4 Y:24.3', { exact: true }).filter({ visible: true })).toBeVisible();
  const todoGranary = page.getByText('屯貨倉庫', { exact: true }).filter({ visible: true });
  const todoGathering = page.getByText('開拓採集', { exact: true }).filter({ visible: true });
  await expect(todoGranary).toBeVisible();
  for (const dark of [false, true]) {
    await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
    expect(await badgeStyle(todoGranary)).toEqual(await badgeStyle(todoGathering));
    await page.screenshot({ path: '.cache/game-data/island-todo-' + test.info().project.name.replace(/ /g, '-') + (dark ? '-dark' : '') + '.png', fullPage: true, animations: 'disabled' });
  }
  await page.locator('button').filter({ has: page.locator('i.pi-download') }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /確認下載 HTML/ }).click();
  const html = await readFile((await (await downloading).path())!, 'utf8');
  expect(html).toContain('屯貨倉庫');
  expect(html).toContain('開拓建造');
  expect(html).not.toContain('無人島其他來源');
});
test('warm startup only checks the manifest and makes no upstream requests', async ({ page }) => {
  await setupTest(page);
  await expect.poll(() => storedVersion(page)).toBe(mockGamePackages().manifest.version);
  await expect(page.getByTestId('game-data-status')).toHaveCount(0);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.reload();
  await expect(page.getByPlaceholder('找尋物品...')).toBeVisible();
  await navigateTo(page, '工坊設置');
  await expect(page.getByText(mockGamePackages().manifest.version.slice(0, 12), { exact: true })).toBeVisible();
  expect(requests.filter(url => url.endsWith('/manifest.json'))).toHaveLength(1);
  expect(requests.filter(url => /\/game-data\/.*\.bin$/.test(url))).toHaveLength(0);
  expect(requests.filter(url => url.includes('raw.githubusercontent.com'))).toHaveLength(0);
});
for (const activate of [false, true]) test(`complete update is ${activate ? 'confirmed and reloaded' : 'deferred until the next opening'}`, async ({ page }) => {
  await setupTest(page);
  const old = mockGamePackages(); const next = mockGamePackages('新版鐵錠');
  await expect.poll(() => storedVersion(page)).toBe(old.manifest.version);
  await page.route('**/game-data/**', route => {
    const file = new URL(route.request().url()).pathname.split('/').pop()!;
    if (file === 'manifest.json') return route.fulfill({ json: next.manifest });
    const body = next.assets.get(file) || old.assets.get(file);
    return body ? route.fulfill({ body, contentType: 'application/octet-stream' }) : route.fulfill({ status: 404 });
  });
  await page.reload();
  await expect(page.getByText('新遊戲資料已下載完成。', { exact: true })).toBeVisible();
  await expect.poll(() => storedVersion(page, 'pending')).toBe(next.manifest.version);
  expect(await storedVersion(page)).toBe(old.manifest.version);
  await page.locator('#item-name').fill('尚未儲存的草稿');
  if (activate) {
    await page.getByRole('button', { name: '套用並重新整理', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '套用並重新整理', exact: true });
    await expect(dialog).toContainText('未保存');
    await dialog.getByRole('button', { name: '取消', exact: true }).last().click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#item-name')).toHaveValue('尚未儲存的草稿');
    expect(await storedVersion(page)).toBe(old.manifest.version);
    await page.getByRole('button', { name: '套用並重新整理', exact: true }).click();
    await dialog.getByRole('button', { name: '套用並重新整理', exact: true }).click();
  } else {
    await page.getByRole('button', { name: '下次開啟再套用', exact: true }).click();
    await expect(page.getByTestId('game-data-status')).toHaveCount(0);
    await expect(page.locator('#item-name')).toHaveValue('尚未儲存的草稿');
    expect(await storedVersion(page)).toBe(old.manifest.version);
    await page.reload();
  }
  await expect.poll(() => storedVersion(page)).toBe(next.manifest.version);
  await expect.poll(() => storedVersion(page, 'pending')).toBeNull();
  await searchAndSelectItem(page, '找尋物品...', '新版鐵錠', '新版鐵錠');
});
test('a failed core download offers retry and never saves an incomplete cache', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined }); });
  await setupTest(page);
  let fail = true;
  await page.route('**/game-data/sources.*', route => fail ? route.fulfill({ status: 503 }) : route.fallback());
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('配方或素材來源');
  fail = false;
  await page.getByRole('button', { name: '重試', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await navigateTo(page, '工坊設置');
  await expect(page.getByText('無法保存裝置快取，目前使用線上資料；不影響筆記與收藏。')).toBeVisible();
});
test('real checked-in packages load through the actual static server', async ({ page }) => {
  const upstream: string[] = [];
  page.on('request', request => { if (request.url().includes('raw.githubusercontent.com')) upstream.push(request.url()); });
  await page.addInitScript(() => {
    localStorage.setItem('frozen-rabbit-initialized', 'true'); localStorage.setItem('frozen-rabbit-lang', 'tw');
  });
  await page.goto('./');
  await expect.poll(() => storedVersion(page)).toMatch(/^[a-f0-9]{64}$/);
  await searchAndSelectItem(page, '找尋物品...', 'Cozy Cabin', 'Cozy Cabin I');
  expect(upstream).toEqual([]);
  await navigateTo(page, '工坊設置');
  await expect(page.getByRole('heading', { name: '遊戲快取資料', exact: true })).toBeVisible();
  await page.screenshot({ path: `.cache/game-data/settings-${test.info().project.name.replace(/ /g, '-')}.png`, fullPage: true });
});

test('repair redownloads game data without removing notes, favorites or settings', async ({ page }) => {
  const note = { id: 'preserved', name: '保留的筆記', items: [{ id: 5057, quantity: 2 }], createdAt: '2026-08-27T00:00:00Z' };
  await setupTest(page);
  await page.evaluate(note => {
    for (const key of ['frozen-rabbit-notes', 'frozen-rabbit-favorites-data']) localStorage.setItem(key, JSON.stringify([note]));
  }, note);
  await page.reload();
  await expect.poll(() => storedVersion(page)).toBe(mockGamePackages().manifest.version);
  await navigateTo(page, '工坊設置');
  const requests: string[] = []; page.on('request', r => requests.push(r.url()));
  await expect(page.getByRole('region', { name: '遊戲快取資料' }).locator('xpath=following-sibling::*[1]')).toContainText('關於與致謝');
  const repairButton = page.getByRole('button', { name: '清除遊戲資料快取並重新下載', exact: true });
  // Keyboard entry makes focus restoration observable on Safari too, where mouse clicks do not focus buttons.
  await repairButton.focus();
  await repairButton.press('Enter');
  const dialog = page.getByRole('dialog', { name: '清除遊戲資料快取並重新下載', exact: true });
  await expect(dialog).toContainText('不會刪除筆記、收藏或設定');
  await expect(dialog).toContainText('頁面將重新整理');
  await dialog.getByRole('button', { name: '取消', exact: true }).last().click();
  await expect(dialog).toHaveCount(0);
  await expect(repairButton).toBeFocused();
  expect(requests.filter(url => /\/game-data\/.*\.bin$/.test(url))).toHaveLength(0);
  expect(await storedVersion(page)).toBe(mockGamePackages().manifest.version);
  await repairButton.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await repairButton.click();
  await page.screenshot({ path: `.cache/game-data/repair-dialog-${test.info().project.name.replace(/ /g, '-')}.png`, fullPage: true });
  await dialog.getByRole('button', { name: '重新下載並重新整理', exact: true }).click();
  await expect.poll(() => requests.filter(url => /\/game-data\/.*\.bin$/.test(url)).length).toBe(3);
  await expect.poll(() => storedVersion(page)).toBe(mockGamePackages().manifest.version);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-notes') || '[]'))).toEqual([note]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-favorites-data') || '[]'))).toEqual([note]);
  expect(await page.evaluate(() => localStorage.getItem('frozen-rabbit-lang'))).toBe('tw');
});

test('a successful search retry also starts phase two after an initial catalog failure', async ({ page }) => {
  let fail = true;
  await setupTest(page, () => page.route('**/game-data/catalog.*', route => fail ? route.fulfill({ status: 503 }) : route.fallback()));
  await expect(page.getByRole('alert')).toContainText('物品資料載入失敗');
  fail = false;
  await searchAndSelectItem(page, '找尋物品...', '鐵錠', '鐵錠');
  await expect.poll(() => storedVersion(page)).toBe(mockGamePackages().manifest.version);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
