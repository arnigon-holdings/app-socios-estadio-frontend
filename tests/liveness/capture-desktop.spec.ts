import { test } from '@playwright/test'

const VALID_RUT = '11111111-1'
const VALID_PHONE = '91234567'
const VALID_PASSWORD = 'Test1234'

async function navigateToStep4(page: import('@playwright/test').Page) {
  await page.goto('/registro')
  await page.getByPlaceholder('12345678-9').fill(VALID_RUT)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.locator('#phone').fill(VALID_PHONE)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.locator('#password').fill(VALID_PASSWORD)
  await page.getByRole('button', { name: 'Continuar' }).click()
}

async function mockSession(page: import('@playwright/test').Page) {
  await page.route('**/face-liveness/sessions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: 'desktop-mock-session' }),
    })
  })
}

test('desktop idle state 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await navigateToStep4(page)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/desktop-idle.png', fullPage: true })
})

test('desktop loading state 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await mockSession(page)
  await page.route('**/face-liveness/sessions', async (route) => {
    await new Promise((r) => setTimeout(r, 1500))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: 'desktop-loading' }),
    })
  })
  await navigateToStep4(page)
  await page.getByRole('button', { name: /Iniciar verificación/i }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'screenshots/desktop-loading.png', fullPage: true })
})

test('desktop detector state 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await mockSession(page)
  await navigateToStep4(page)
  await page.getByRole('button', { name: /Iniciar verificación/i }).click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'screenshots/desktop-detector.png', fullPage: true })
})

test('desktop error state 1280x800', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.route('**/face-liveness/sessions', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    })
  })
  await navigateToStep4(page)
  await page.getByRole('button', { name: /Iniciar verificación/i }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'screenshots/desktop-error.png', fullPage: true })
})

test('tablet 768x1024 idle', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await navigateToStep4(page)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/tablet-idle.png', fullPage: true })
})

test('mobile 375x812 idle', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await navigateToStep4(page)
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'screenshots/mobile-idle.png', fullPage: true })
})

test('desktop validating state — progress bar + detector (no white wrapper)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await mockSession(page)
  await navigateToStep4(page)
  await page.getByRole('button', { name: /Iniciar verificación/i }).click()
  await page.waitForSelector('[data-testid="liveness-validating"]', { timeout: 5000 })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'screenshots/desktop-validating.png', fullPage: true })
})