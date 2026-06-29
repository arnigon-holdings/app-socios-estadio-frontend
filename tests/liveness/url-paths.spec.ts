import { test, expect } from '@playwright/test'

const VALID_RUT = '11111111-1'
const VALID_PHONE = '91234567'
const VALID_PASSWORD = 'Test1234'

async function navigateToStep4(page: import('@playwright/test').Page) {
  await page.goto('/registro')
  await page.getByPlaceholder('12345678-9').fill(VALID_RUT)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Paso 2 de 7')).toBeVisible()
  await page.locator('#phone').fill(VALID_PHONE)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Paso 3 de 7')).toBeVisible()
  await page.locator('#password').fill(VALID_PASSWORD)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Paso 4 de 7')).toBeVisible()
}

test.describe('Liveness URL paths', () => {
  test('POST /face-liveness/sessions is hit with single (non-duplicated) path', async ({ page }) => {
    const capturedPaths: string[] = []

    await page.route('**/face-liveness/**', async (route) => {
      const url = new URL(route.request().url())
      capturedPaths.push(url.pathname)

      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sessionId: 'mock-session-id' }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: 'mock-session-id',
            status: 'SUCCEEDED',
            confidence: 95,
            referenceImage: { bytes: '' },
            auditImages: [],
          }),
        })
      }
    })

    await navigateToStep4(page)
    await page.getByRole('button', { name: /Iniciar verificación/i }).click()

    await expect.poll(() => capturedPaths.length, { timeout: 5000 }).toBeGreaterThan(0)

    const duplicated = capturedPaths.filter((p) => p.includes('/face-liveness/face-liveness'))
    expect(duplicated, `paths with duplicated segment: ${JSON.stringify(capturedPaths)}`).toHaveLength(0)

    const sessionPost = capturedPaths.find((p) => p.endsWith('/face-liveness/sessions'))
    expect(sessionPost, `expected POST /face-liveness/sessions, got: ${JSON.stringify(capturedPaths)}`).toBeDefined()
  })
})