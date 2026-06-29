import { test, expect } from '@playwright/test'

test.describe('Liveness smoke', () => {
  test('registro page loads and shows wizard step 1', async ({ page }) => {
    await page.goto('/registro')
    await expect(page.getByText('Paso 1 de 7')).toBeVisible()
    await expect(page.getByPlaceholder('12345678-9')).toBeVisible()
  })

  test('navigates from step 1 to step 2 with valid RUT', async ({ page }) => {
    await page.goto('/registro')
    await page.getByPlaceholder('12345678-9').fill('11111111-1')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText('Paso 2 de 7')).toBeVisible()
  })
})