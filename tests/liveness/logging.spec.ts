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

type ConsoleMessage = {
  type: string
  text: string
}

async function captureConsole(page: import('@playwright/test').Page): Promise<ConsoleMessage[]> {
  const messages: ConsoleMessage[] = []
  page.on('console', (msg) => {
    messages.push({ type: msg.type(), text: msg.text() })
  })
  page.on('pageerror', (err) => {
    messages.push({ type: 'pageerror', text: err.message })
  })
  return messages
}

test.describe('Liveness logging', () => {
  test('logs createSession:start and createSession:success on happy path', async ({ page }) => {
    const messages = await captureConsole(page)

    await page.route('**/face-liveness/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'logged-session-id' }),
      })
    })

    await navigateToStep4(page)
    await page.getByRole('button', { name: /Iniciar verificación/i }).click()

    await expect.poll(() => messages.some((m) => m.text.includes('createSession:start')), { timeout: 5000 }).toBe(true)
    await expect.poll(() => messages.some((m) => m.text.includes('createSession:success')), { timeout: 5000 }).toBe(true)

    const startLog = messages.find((m) => m.text.includes('createSession:start'))
    expect(startLog?.text).toContain('/face-liveness/sessions')
    expect(startLog?.text).toContain('POST')

    const successLog = messages.find((m) => m.text.includes('createSession:success'))
    expect(successLog?.text).toContain('logged-session-id')
  })

  test('logs createSession:http_error with status + body when API returns 500', async ({ page }) => {
    const messages = await captureConsole(page)

    await page.route('**/face-liveness/sessions', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await navigateToStep4(page)
    await page.getByRole('button', { name: /Iniciar verificación/i }).click()

    await expect.poll(() => messages.some((m) => m.text.includes('createSession:http_error')), { timeout: 5000 }).toBe(true)

    const errorLog = messages.find((m) => m.text.includes('createSession:http_error'))
    expect(errorLog?.text).toContain('500')
    expect(errorLog?.text).toContain('Internal Server Error')

    await expect(page.getByTestId('liveness-error')).toBeVisible()
    await expect(page.getByRole('button', { name: /Reintentar/i })).toBeVisible()
  })

  test('logs createSession:network_error when fetch fails', async ({ page }) => {
    const messages = await captureConsole(page)

    await page.route('**/face-liveness/sessions', async (route) => {
      await route.abort('connectionrefused')
    })

    await navigateToStep4(page)
    await page.getByRole('button', { name: /Iniciar verificación/i }).click()

    await expect.poll(() => messages.some((m) => m.text.includes('createSession:network_error')), { timeout: 5000 }).toBe(true)

    const errorLog = messages.find((m) => m.text.includes('createSession:network_error'))
    expect(errorLog?.type).toBe('error')
    expect(errorLog?.text).toContain('Failed to fetch')

    await expect(page.getByTestId('liveness-error')).toBeVisible()
    await expect(page.getByText(/Sin conexión/i)).toBeVisible()
  })

  test('no uncaught pageerrors on idle → loading transition', async ({ page }) => {
    const pageerrors: string[] = []
    page.on('pageerror', (err) => pageerrors.push(err.message))

    await page.route('**/face-liveness/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'no-errors-session' }),
      })
    })

    await navigateToStep4(page)
    await page.getByRole('button', { name: /Iniciar verificación/i }).click()

    await expect.poll(() => pageerrors.length, { timeout: 2000 }).toBe(0)
  })
})