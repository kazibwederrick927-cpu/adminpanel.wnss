import { test, expect } from '@playwright/test'

test.describe('Book Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login')
    
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

    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display dashboard with books', async ({ page }) => {
    // Mock books data
    await page.route('**/rest/v1/books*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Test Book',
            author: 'Test Author',
            subject: 'Mathematics',
            level: 'O-Level',
            featured: true,
            upload_date: new Date().toISOString()
          }
        ]),
        headers: { 'content-range': '0-0/1' }
      })
    })

    await page.goto('/dashboard')
    
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Test Book')).toBeVisible()
    await expect(page.locator('text=Test Author')).toBeVisible()
  })

  test('should navigate to create book page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('text=Add Book')
    
    await expect(page).toHaveURL('/books/new')
    await expect(page.locator('text=Add New Book')).toBeVisible()
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('input[name="author"]')).toBeVisible()
  })

  test('should create a new book', async ({ page }) => {
    await page.goto('/books/new')
    
    // Fill form
    await page.fill('input[name="title"]', 'New Test Book')
    await page.fill('input[name="author"]', 'New Test Author')
    await page.selectOption('select[name="subject"]', 'Mathematics')
    await page.selectOption('select[name="level"]', 'O-Level')
    
    // Mock file upload
    const fileInput = page.locator('input[type="file"][accept=".pdf"]')
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content')
    })
    
    // Mock upload endpoint
    await page.route('**/functions/v1/upload-and-insert', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          book: {
            id: '2',
            title: 'New Test Book',
            author: 'New Test Author',
            subject: 'Mathematics',
            level: 'O-Level'
          }
        })
      })
    })
    
    await page.click('button[type="submit"]')
    
    // Should show success and redirect
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should view book details', async ({ page }) => {
    // Mock book data
    await page.route('**/rest/v1/books*', (route) => {
      if (route.request().url().includes('eq.id')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            title: 'Test Book',
            author: 'Test Author',
            subject: 'Mathematics',
            level: 'O-Level',
            description: 'Test description',
            featured: true,
            upload_date: new Date().toISOString()
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              title: 'Test Book',
              author: 'Test Author',
              subject: 'Mathematics',
              level: 'O-Level',
              featured: true,
              upload_date: new Date().toISOString()
            }
          ]),
          headers: { 'content-range': '0-0/1' }
        })
      }
    })
    
    await page.goto('/dashboard')
    await page.click('text=Test Book')
    
    await expect(page).toHaveURL('/books/1')
    await expect(page.locator('text=Test Book')).toBeVisible()
    await expect(page.locator('text=Test Author')).toBeVisible()
    await expect(page.locator('text=Mathematics')).toBeVisible()
    await expect(page.locator('text=O-Level')).toBeVisible()
  })

  test('should edit a book', async ({ page }) => {
    // Mock book data
    await page.route('**/rest/v1/books*', (route) => {
      if (route.request().url().includes('eq.id')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            title: 'Test Book',
            author: 'Test Author',
            subject: 'Mathematics',
            level: 'O-Level',
            description: 'Test description',
            featured: true,
            upload_date: new Date().toISOString()
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              title: 'Test Book',
              author: 'Test Author',
              subject: 'Mathematics',
              level: 'O-Level',
              featured: true,
              upload_date: new Date().toISOString()
            }
          ]),
          headers: { 'content-range': '0-0/1' }
        })
      }
    })
    
    await page.goto('/dashboard')
    await page.click('text=Test Book')
    await page.click('text=Edit')
    
    await expect(page).toHaveURL('/books/1/edit')
    await expect(page.locator('text=Edit Book')).toBeVisible()
    
    // Update title
    await page.fill('input[name="title"]', 'Updated Test Book')
    
    // Mock update endpoint
    await page.route('**/rest/v1/books*', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: '1',
            title: 'Updated Test Book',
            author: 'Test Author',
            subject: 'Mathematics',
            level: 'O-Level'
          }])
        })
      }
    })
    
    await page.click('button[type="submit"]')
    
    // Should redirect to book detail page
    await expect(page).toHaveURL('/books/1', { timeout: 10000 })
  })

  test('should delete a book', async ({ page }) => {
    // Mock book data
    await page.route('**/rest/v1/books*', (route) => {
      if (route.request().url().includes('eq.id')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            title: 'Test Book',
            author: 'Test Author',
            subject: 'Mathematics',
            level: 'O-Level',
            featured: true,
            upload_date: new Date().toISOString()
          })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              title: 'Test Book',
              author: 'Test Author',
              subject: 'Mathematics',
              level: 'O-Level',
              featured: true,
              upload_date: new Date().toISOString()
            }
          ]),
          headers: { 'content-range': '0-0/1' }
        })
      }
    })
    
    await page.goto('/dashboard')
    
    // Mock delete endpoint
    await page.route('**/functions/v1/delete-book-and-files', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Book deleted successfully'
        })
      })
    })
    
    // Handle prompt for confirmation
    page.on('dialog', dialog => dialog.accept('Test Book'))
    
    await page.click('text=Delete')
    
    // Should show success message
    await expect(page.locator('text=Book deleted successfully')).toBeVisible({ timeout: 5000 })
  })
})
