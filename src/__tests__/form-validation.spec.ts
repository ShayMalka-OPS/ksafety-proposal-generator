/**
 * Group 2 — Form Validation (Playwright E2E)
 * Walks through the multi-step proposal wizard and verifies:
 * - Step gates block progression when required fields are missing
 * - Products can be selected and filtered by product line
 * - Pricing table populates with correct totals
 *
 * Requires dev server on http://localhost:3000 (auto-started via playwright.config.ts)
 */
import { test, expect, Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function completeStep1(page: Page) {
  // K-Safety + On-Prem are pre-selected by default — just Continue
  await page.click('button:has-text("Continue")');
  await expect(page.locator('h2')).toContainText('Customer Information');
}

async function fillCustomerInfo(page: Page, partial = false) {
  await page.fill('input[placeholder="e.g. City of Tel Aviv"]', 'Test City');
  if (!partial) {
    await page.fill('input[placeholder="e.g. Tel Aviv"]', 'Tel Aviv');
    await page.fill('input[placeholder="e.g. Israel"]', 'Israel');
    await page.fill('input[placeholder="e.g. David Cohen"]', 'QA Tester');
    await page.fill('input[type="email"]', 'qa@test.com');
    await page.fill('input[placeholder="e.g. Tel Aviv Smart Safety Platform"]', 'QA Test Proposal');
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Proposal Form Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/proposal');
    // Step 1 heading is "Product Line & Deployment"
    await expect(page.locator('h2')).toContainText('Product Line & Deployment');
  });

  // ── Step 1 (Product & Deploy) ─────────────────────────────────────────────

  test('Step 1: All 4 product lines are visible', async ({ page }) => {
    // Use role=button to avoid matching navbar "K-Safety Proposals" text
    await expect(page.getByRole('button', { name: /K-Safety/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /K-Video/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /K-Dispatch/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /K-Analytics/i })).toBeVisible();
  });

  test('Step 1: Both deployment options are visible', async ({ page }) => {
    await expect(page.getByText('On-Premises')).toBeVisible();
    await expect(page.getByText('Cloud (SaaS/IaaS)')).toBeVisible();
  });

  test('Step 1: Can proceed — defaults are pre-selected', async ({ page }) => {
    await page.click('button:has-text("Continue")');
    await expect(page.locator('h2')).toContainText('Customer Information');
  });

  test('Step 1: Selecting K-Video advances to customer info', async ({ page }) => {
    await page.getByText('K-Video').click();
    await page.click('button:has-text("Continue")');
    await expect(page.locator('h2')).toContainText('Customer Information');
  });

  // ── Step 2 (Customer Info) ────────────────────────────────────────────────

  test('Step 2: Cannot proceed with all fields empty', async ({ page }) => {
    await completeStep1(page);
    // Continue button should be disabled (required fields empty)
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeDisabled();
  });

  test('Step 2: Cannot proceed without city', async ({ page }) => {
    await completeStep1(page);
    await page.fill('input[placeholder="e.g. City of Tel Aviv"]', 'Test City');
    // City left empty — button should stay disabled
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeDisabled();
  });

  test('Step 2: Can proceed when all required fields are filled', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await expect(page.locator('h2')).toContainText('Product Selection');
  });

  // ── Step 3 (Product Selection) ────────────────────────────────────────────

  test('Step 3: Cannot proceed without selecting any product', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await expect(page.locator('h2')).toContainText('Product Selection');
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeDisabled();
  });

  test('Step 3: K-Safety Core Platform is visible for K-Safety product line', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await expect(page.getByText('K-Safety Core Platform')).toBeVisible();
  });

  test('Step 3: Selecting a product enables Continue', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await page.getByText('K-Safety Core Platform').click();
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeEnabled();
  });

  test('Step 3: K-Video product line shows CCTV but not K-Share', async ({ page }) => {
    // Start fresh — select K-Video on step 1
    await page.getByText('K-Video').click();
    await page.click('button:has-text("Continue")');
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await expect(page.getByText('CCTV Video Channels')).toBeVisible();
    await expect(page.getByText('K-Share Mobile App')).not.toBeVisible();
  });

  // ── Step 4 (Configuration) ────────────────────────────────────────────────

  test('Step 4: No HW config shown for CCTV-only selection', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await page.getByText('CCTV Video Channels').click();
    await page.click('button:has-text("Continue")');
    // Step 4 (Configuration) — should show the "no server-side products" message
    await expect(page.getByText('no server-side products', { exact: false })).toBeVisible();
  });

  // ── Step 5 (Pricing) ──────────────────────────────────────────────────────

  test('Step 5: Pricing table shows $5,000 for Core Platform', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await page.getByText('K-Safety Core Platform').click();
    await page.click('button:has-text("Continue")');  // config
    await page.click('button:has-text("Continue")');  // pricing
    await expect(page.locator('h2')).toContainText('Pricing Summary');
    // Annual total should show $5,000
    await expect(page.getByText('$5,000').first()).toBeVisible();
  });

  test('Step 5: 5-year comparison section is visible', async ({ page }) => {
    await completeStep1(page);
    await fillCustomerInfo(page);
    await page.click('button:has-text("Continue")');
    await page.getByText('K-Safety Core Platform').click();
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await expect(page.getByText('5-Year Total Cost Comparison')).toBeVisible();
  });

});
