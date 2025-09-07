import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Clear localStorage to start with fresh state
  await page.evaluate(() => localStorage.clear());
});

const CONTACT_ITEMS = [
  { name: 'John Doe', email: 'john.doe@example.com' },
  { name: 'Jane Smith', email: 'jane.smith@example.com' },
  { name: 'Bob Johnson', email: 'bob.johnson@example.com' },
  { name: 'Alice Brown', email: 'alice.brown@example.com' },
  { name: 'Charlie Wilson', email: 'charlie.wilson@example.com' },
  { name: 'Diana Davis', email: 'diana.davis@example.com' }
] as const;

test.describe('Contact Form', () => {
  test('should allow me to add contact items', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const submitButton = page.getByTestId('submit-button');

    // Create 1st contact
    await nameInput.fill(CONTACT_ITEMS[0].name);
    await emailInput.fill(CONTACT_ITEMS[0].email);
    await submitButton.click();

    // Check that contact appears in list
    await expect(page.getByTestId('contact-name')).toContainText(CONTACT_ITEMS[0].name);
    await expect(page.getByTestId('contact-email')).toContainText(CONTACT_ITEMS[0].email);

    // Create 2nd contact
    await nameInput.fill(CONTACT_ITEMS[1].name);
    await emailInput.fill(CONTACT_ITEMS[1].email);
    await submitButton.click();

    // Check both contacts exist
    await expect(page.getByTestId('contact-name')).toHaveCount(2);
    await checkNumberOfContactsInLocalStorage(page, 2);
  });

  test('should clear input fields when a contact is added', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const submitButton = page.getByTestId('submit-button');

    // Create one contact
    await nameInput.fill(CONTACT_ITEMS[0].name);
    await emailInput.fill(CONTACT_ITEMS[0].email);
    await submitButton.click();

    // Check that inputs are cleared
    await expect(nameInput).toBeEmpty();
    await expect(emailInput).toBeEmpty();
    await checkNumberOfContactsInLocalStorage(page, 1);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    const submitButton = page.getByTestId('submit-button');
    
    // Try to submit without filling fields
    await submitButton.click();

    // Check for validation errors
    await expect(page.locator('.error-message')).toHaveCount(2);
    await expect(page.locator('#name-error')).toContainText('Name is required');
    await expect(page.locator('#email-error')).toContainText('Email is required');
  });

  test('should validate email format', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const submitButton = page.getByTestId('submit-button');

    await nameInput.fill('Test User');
    await emailInput.fill('invalid-email');
    await submitButton.click();

    // Check for email validation error
    await expect(page.locator('#email-error')).toContainText('Please enter a valid email address');
  });

  test('should reset form when reset button is clicked', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const resetButton = page.getByTestId('reset-button');

    // Fill in form data
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');

    // Click reset
    await resetButton.click();

    // Check that fields are cleared
    await expect(nameInput).toBeEmpty();
    await expect(emailInput).toBeEmpty();
  });
});

test.describe('Contact List', () => {
  test.beforeEach(async ({ page }) => {
    // Create some test contacts first
    await createDefaultContacts(page);
    await checkNumberOfContactsInLocalStorage(page, 3);
  });

  test('should display contacts in alphabetical order', async ({ page }) => {
    const contactNames = await page.getByTestId('contact-name').allTextContents();
    const sortedNames = [...contactNames].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    expect(contactNames).toEqual(sortedNames);
  });

  test('should show empty message when no contacts exist', async ({ page }) => {
    // Clear all contacts by refreshing and clearing storage
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('#empty-message')).toContainText('No contacts yet');
  });

  test('should allow me to edit a contact', async ({ page }) => {
    const editButtons = page.getByTestId('edit-button');
    await editButtons.first().click();

    // Form should be populated with contact data
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    
    await expect(nameInput).not.toBeEmpty();
    await expect(emailInput).not.toBeEmpty();

    // Update the contact
    await nameInput.fill('Updated Name');
    await emailInput.fill('updated@example.com');
    await page.getByTestId('submit-button').click();

    // Check that contact was updated
    await expect(page.getByTestId('contact-name')).toContainText('Updated Name');
    await expect(page.getByTestId('contact-email')).toContainText('updated@example.com');
  });

  test('should allow me to delete a contact', async ({ page }) => {
    const initialCount = await page.getByTestId('contact-item').count();
    
    // Accept the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    const deleteButtons = page.getByTestId('delete-button');
    await deleteButtons.first().click();

    // Check that contact count decreased
    await expect(page.getByTestId('contact-item')).toHaveCount(initialCount - 1);
    await checkNumberOfContactsInLocalStorage(page, initialCount - 1);
  });

  test('should cancel delete when user rejects confirmation', async ({ page }) => {
    const initialCount = await page.getByTestId('contact-item').count();
    
    // Dismiss the confirmation dialog
    page.on('dialog', dialog => dialog.dismiss());
    
    const deleteButtons = page.getByTestId('delete-button');
    await deleteButtons.first().click();

    // Check that contact count stayed the same
    await expect(page.getByTestId('contact-item')).toHaveCount(initialCount);
  });
});

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    // Create enough contacts to trigger pagination (6 contacts > 5 per page)
    await createManyContacts(page);
  });

  test('should show pagination when more than 5 contacts exist', async ({ page }) => {
    await expect(page.getByTestId('pagination')).toBeVisible();
    await expect(page.locator('.pagination button')).toHaveCount(4); // Previous, 1, 2, Next
  });

  test('should display correct pagination info', async ({ page }) => {
    await expect(page.getByTestId('pagination-info')).toContainText('Showing 1-5 of 6 contacts');
  });

  test('should navigate to next page', async ({ page }) => {
    const nextButton = page.locator('.pagination button').filter({ hasText: 'Next' });
    await nextButton.click();

    // Should show remaining contact on page 2
    await expect(page.getByTestId('pagination-info')).toContainText('Showing 6-6 of 6 contacts');
    await expect(page.getByTestId('contact-item')).toHaveCount(1);
  });

  test('should navigate to previous page', async ({ page }) => {
    // Go to page 2 first
    const nextButton = page.locator('.pagination button').filter({ hasText: 'Next' });
    await nextButton.click();

    // Then go back to page 1
    const prevButton = page.locator('.pagination button').filter({ hasText: 'Previous' });
    await prevButton.click();

    await expect(page.getByTestId('pagination-info')).toContainText('Showing 1-5 of 6 contacts');
    await expect(page.getByTestId('contact-item')).toHaveCount(5);
  });

  test('should disable previous button on first page', async ({ page }) => {
    const prevButton = page.locator('.pagination button').filter({ hasText: 'Previous' });
    await expect(prevButton).toBeDisabled();
  });

  test('should disable next button on last page', async ({ page }) => {
    const nextButton = page.locator('.pagination button').filter({ hasText: 'Next' });
    await nextButton.click();

    await expect(nextButton).toBeDisabled();
  });
});

test.describe('Data Persistence', () => {
  test('should persist contacts in localStorage', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const submitButton = page.getByTestId('submit-button');

    // Create a contact
    await nameInput.fill(CONTACT_ITEMS[0].name);
    await emailInput.fill(CONTACT_ITEMS[0].email);
    await submitButton.click();

    // Reload the page
    await page.reload();

    // Contact should still be there
    await expect(page.getByTestId('contact-name')).toContainText(CONTACT_ITEMS[0].name);
    await expect(page.getByTestId('contact-email')).toContainText(CONTACT_ITEMS[0].email);
  });

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    // Corrupt the localStorage data
    await page.evaluate(() => {
      localStorage.setItem('contacts', 'invalid-json');
    });

    await page.reload();

    // Should show empty message instead of crashing
    await expect(page.locator('#empty-message')).toContainText('No contacts yet');
  });
});

test.describe('UI/UX', () => {
  test('should have proper page title', async ({ page }) => {
    await expect(page).toHaveTitle('Simple CRUD App');
  });

  test('should have header with correct title', async ({ page }) => {
    await expect(page.locator('header h1')).toContainText('Contact Manager');
  });

  test('should display footer at bottom', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('2025 Simple CRUD App');
  });

  test('should focus on name input after successful form submission', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const submitButton = page.getByTestId('submit-button');

    await nameInput.fill(CONTACT_ITEMS[0].name);
    await emailInput.fill(CONTACT_ITEMS[0].email);
    await submitButton.click();

    // Name input should be focused after submission
    await expect(nameInput).toBeFocused();
  });

  test('should show success message after adding contact', async ({ page }) => {
    const nameInput = page.getByTestId('name-input');
    const emailInput = page.getByTestId('email-input');
    const submitButton = page.getByTestId('submit-button');

    await nameInput.fill(CONTACT_ITEMS[0].name);
    await emailInput.fill(CONTACT_ITEMS[0].email);
    await submitButton.click();

    await expect(page.locator('.form-message.success')).toContainText('Contact added successfully');
  });
});

// Helper functions
async function createDefaultContacts(page: Page) {
  const nameInput = page.getByTestId('name-input');
  const emailInput = page.getByTestId('email-input');
  const submitButton = page.getByTestId('submit-button');

  for (const contact of CONTACT_ITEMS.slice(0, 3)) {
    await nameInput.fill(contact.name);
    await emailInput.fill(contact.email);
    await submitButton.click();
    
    // Wait for success message to appear and disappear
    await page.waitForTimeout(500);
  }
}

async function createManyContacts(page: Page) {
  const nameInput = page.getByTestId('name-input');
  const emailInput = page.getByTestId('email-input');
  const submitButton = page.getByTestId('submit-button');

  for (const contact of CONTACT_ITEMS) {
    await nameInput.fill(contact.name);
    await emailInput.fill(contact.email);
    await submitButton.click();
    
    // Wait for success message to appear and disappear
    await page.waitForTimeout(300);
  }
}

async function checkNumberOfContactsInLocalStorage(page: Page, expected: number) {
  return await page.waitForFunction((expectedCount) => {
    const contacts = localStorage.getItem('contacts');
    if (!contacts) return expectedCount === 0;
    try {
      return JSON.parse(contacts).length === expectedCount;
    } catch {
      return false;
    }
  }, expected);
}