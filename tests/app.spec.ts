import { test, expect } from '@playwright/test'

test.describe('App Perfil', () => {
  test('landing page redirects to registro', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/registro/)
  })

  test('registro page shows wizard step 1', async ({ page }) => {
    await page.goto('/registro')
    await expect(page.getByText('RUT')).toBeVisible()
    await expect(page.getByPlaceholder('12345678-9')).toBeVisible()
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Iniciar Sesión')).toBeVisible()
    await expect(page.getByPlaceholder('12345678-9')).toBeVisible()
  })

  test('registro wizard navigation', async ({ page }) => {
    await page.goto('/registro')

    await expect(page.getByText('Paso 1 de 7')).toBeVisible()

    await page.getByPlaceholder('12345678-9').fill('12345678-9')
    await page.getByRole('button', { name: 'Continuar' }).click()

    await expect(page.getByText('Paso 2 de 7')).toBeVisible()
    await expect(page.getByText('Teléfono')).toBeVisible()
  })

  test('registro success page renders', async ({ page }) => {
    await page.goto('/registro/exito')
    await expect(page.getByText('¡Registro exitoso!')).toBeVisible()
    await expect(page.getByText('Recibirás un código de verificación por WhatsApp')).toBeVisible()
  })

  test('rut validation shows error for invalid rut', async ({ page }) => {
    await page.goto('/registro')

    await page.getByPlaceholder('12345678-9').fill('12345678-1')
    await page.getByRole('button', { name: 'Continuar' }).click()

    await expect(page.getByText('RUT inválido')).toBeVisible()
  })
})