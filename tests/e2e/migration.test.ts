import { test, expect } from '@playwright/test'
import { setupDictionaryMocks } from './utils/test-helpers'

const note = { id: 'moved-note', name: '搬家測試', items: [{ id: 5057, quantity: 2 }], createdAt: '2026-09-07T00:00:00.000Z' }
const file = { name: 'workshop.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
  format: 'frozen-rabbit-workshop-backup', version: 1,
  data: { 'frozen-rabbit-notes': JSON.stringify([note]), 'frozen-rabbit-lang': 'en', 'frozen-rabbit-market-region': 'Japan', 'frozen-rabbit-market-dc': 'Mana' }
})) }

test.beforeEach(async ({ page }) => { await setupDictionaryMocks(page) })

test('moving notice precedes onboarding and dismissal persists only when checked', async ({ page }) => {
  await page.goto('./')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('我們搬家了')
  await expect(page.getByText('Traditional Chinese', { exact: true })).toBeHidden()
  await expect(dialog.getByRole('link')).toHaveAttribute('href', 'https://emu-rabbit.github.io/gleaner/')
  await dialog.getByRole('button', { name: '稍後再說' }).click()
  await expect(page.getByText('Traditional Chinese', { exact: true })).toBeVisible()
  await page.reload()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: '稍後再說' }).click()
  await page.reload()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Traditional Chinese', { exact: true })).toBeVisible()
})

test('imports in the notice, skips onboarding and supports repeat imports in settings', async ({ page }) => {
  await page.goto('./')
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles(file)
  await expect(dialog.getByRole('status')).toContainText('歷史筆記 1 筆')
  await expect(dialog.locator('input[type=file]')).toHaveValue(/workshop\.json$/)
  await expect(dialog.getByRole('combobox')).toBeHidden()
  await expect(dialog.getByText('未儲存的編輯與備料分配將消失。')).toBeHidden()
  await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  await dialog.getByRole('button', { name: '匯入並重新載入' }).click()
  await expect(page).toHaveTitle(/Crafting Prep Tool/)
  await expect(page.locator('.p-dialog')).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('frozen-rabbit-migration-dismissed'))).toBe('true')
  expect(await page.evaluate(() => localStorage.getItem('frozen-rabbit-analytics-consent'))).toBeNull()
  const reject = page.getByRole('button', { name: 'Reject', exact: true })
  if (await reject.isVisible()) await reject.click()
  await expect(page.getByText('Traditional Chinese', { exact: true })).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('frozen-rabbit-market-dc'))).toBe('Mana')
  await page.goto('./#settings')
  await page.locator('input[type=file]').setInputFiles(file)
  await expect(page.getByRole('status').filter({ hasText: 'history notes' })).toContainText('1 history notes')
  await expect(page.locator('input[type=file]')).toHaveValue(/workshop\.json$/)
  await expect(page.getByRole('combobox').filter({ has: page.locator('option[value="keep"]') })).toBeHidden()
  await page.getByRole('button', { name: 'Import and reload' }).click()
  await expect(page.getByRole('heading', { name: 'Import data from the old site' })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('frozen-rabbit-notes')!))).toEqual([note])
})

for (const lang of ['tw', 'cn', 'en', 'ja']) {
  test(`notice fits the viewport in ${lang} dark mode and rejects damaged files`, async ({ page }, testInfo) => {
    await page.addInitScript(lang => {
      localStorage.setItem('frozen-rabbit-lang', lang)
      localStorage.setItem('frozen-rabbit-dark-mode', 'true')
    }, lang)
    await page.goto('./')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type=file]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
    await expect(dialog.getByRole('alert')).toBeVisible()
    const box = await dialog.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    await page.screenshot({ path: testInfo.outputPath(`migration-${lang}.png`) })
    expect(await page.evaluate(() => localStorage.getItem('frozen-rabbit-initialized'))).not.toBe('true')
  })
}
