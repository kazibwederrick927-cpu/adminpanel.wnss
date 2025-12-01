import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Wampeewo Ntakke SS')
    await expect(page.locator('h3')).toContainText('Sign In')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should toggle between sign in and sign up', async ({ page }) => {
    await expect(page.locator('h3')).toContainText('Sign In')
    
    await page.click('text=Don\'t have an account? Sign up')
    await expect(page.locator('h3')).toContainText('Create Admin Account')
    
    await page.click('text=Already have an account? Sign in')
    await expect(page.locator('h3')).toContainText('Sign In')
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]')
    
    // HTML5 validation should prevent form submission
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message (mocked in test environment)
    await expect(page.locator('text=Authentication failed')).toBeVisible({ timeout: 5000 })
  })

  test('should send magic link', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('text=Send Magic Link')
    
    // Should show success message
    await expect(page.locator('text=Magic link sent!')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should allow access to dashboard after login', async ({ page }) => {
    // Mock successful login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password')
    
    // Mock the authentication success
    await page.route('**/auth/v1/token', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          user: { id: '123', email: 'admin@example.com' }
        })
      })
    })

    await page.route('**/rest/v1/profiles*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          role: 'admin',
          full_name: 'Admin User'
        })
      })
    })

    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
})
