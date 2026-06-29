import { test, expect } from '@playwright/test'

const VALID_RUT = '11111111-1'
const VALID_PHONE = '91234567'
const VALID_PASSWORD = 'Test1234'

async function navigateToStep4(page: import('@playwright/test').Page) {
  await page.goto('/registro')

  // Step 1: RUT
  await page.getByPlaceholder('12345678-9').fill(VALID_RUT)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Paso 2 de 7')).toBeVisible()

  // Step 2: Phone + birth date (defaults ok)
  await page.locator('#phone').fill(VALID_PHONE)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Paso 3 de 7')).toBeVisible()

  // Step 3: Password
  await page.locator('#password').fill(VALID_PASSWORD)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Paso 4 de 7')).toBeVisible()
}

test.describe('Wizard step 4 — Face Liveness', () => {
  test('renders the FaceLiveness component with start button', async ({ page }) => {
    await navigateToStep4(page)

    await expect(page.getByRole('heading', { name: /Verificación facial/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Iniciar verificación/i })).toBeVisible()
  })

  test('shows description text', async ({ page }) => {
    await navigateToStep4(page)

    await expect(page.getByText(/confirmar que eres una persona real/i)).toBeVisible()
  })

  test('shows requirements list with icons', async ({ page }) => {
    await navigateToStep4(page)

    await expect(page.getByText(/Centra tu cara en el óvalo/i)).toBeVisible()
    await expect(page.getByText(/Buena iluminación frontal/i)).toBeVisible()
    await expect(page.getByText(/Sin lentes, gorros o máscaras/i)).toBeVisible()
  })

  test('Continuar is disabled until liveness is completed', async ({ page }) => {
    await navigateToStep4(page)

    const continuar = page.getByRole('button', { name: /Continuar/ })
    await expect(continuar).toBeDisabled()
  })

  test('shows progress bar and "Validando tu rostro" when session starts', async ({ page }) => {
    await page.route('**/face-liveness/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'mock-progress-session' }),
      })
    })

    await navigateToStep4(page)
    await page.getByRole('button', { name: /Iniciar verificación/i }).click()

    await expect(page.locator('[data-testid="liveness-validating"]')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Validando tu rostro/i)).toBeVisible()
    await expect(page.locator('.liveness-progress-bar')).toBeVisible()
  })
})