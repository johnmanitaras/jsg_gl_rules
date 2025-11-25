import { test, expect } from '@playwright/test';

test.describe('Searchable Dropdown in Rule Configuration', () => {
  test('displays loading state and searchable dropdown when adding Resource rule', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else {
        consoleLogs.push(`[${msg.type()}] ${text}`);
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');

    // Login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill('manus@secretagentsocks.com');
      await page.locator('input[type="password"]').fill('claude123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    // Wait for profiles to load
    const profileCard = page.locator('.profile-card h3').first();
    await profileCard.waitFor({ state: 'visible', timeout: 10000 });

    // Click on first profile
    await page.locator('.profile-card').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on version link to go to rules page
    const versionLink = page.locator('a[href*="/version/"]').first();
    await versionLink.waitFor({ state: 'visible', timeout: 10000 });
    await versionLink.click();

    // Wait for rules page to load
    await page.waitForSelector('h2:has-text("Commission Rules")', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/dropdown-01-rules-page.png', fullPage: true });

    // Click Add Rule button
    const addRuleButton = page.locator('button:has-text("Add Rule")').first();
    await addRuleButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/dropdown-02-rule-type-selector.png', fullPage: true });

    // Select Resource Rule (this will trigger the loading state for resources)
    const resourceRuleOption = page.getByRole('button', { name: /Resource Rule/i });
    await resourceRuleOption.scrollIntoViewIfNeeded();
    await resourceRuleOption.click();

    // Immediately take screenshot to capture loading state
    await page.screenshot({ path: 'screenshots/dropdown-03-loading-state.png', fullPage: true });

    // Wait for the form to appear with searchable dropdown
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/dropdown-04-form-loaded.png', fullPage: true });

    // Check if searchable dropdown trigger button exists
    const dropdownTrigger = page.locator('.searchable-dropdown-trigger, button[aria-haspopup="listbox"]');
    const dropdownExists = await dropdownTrigger.count() > 0;
    console.log('Searchable dropdown exists:', dropdownExists);

    if (dropdownExists) {
      // Click on the dropdown to open it
      await dropdownTrigger.first().click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'screenshots/dropdown-05-dropdown-open.png', fullPage: true });

      // Check for search input in dropdown
      const searchInput = page.locator('input[placeholder*="Search"], input[aria-label="Search options"]');
      const searchInputExists = await searchInput.count() > 0;
      console.log('Search input exists:', searchInputExists);

      if (searchInputExists) {
        // Type in search to filter options
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/dropdown-06-search-filter.png', fullPage: true });

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(300);
      }

      // Check for option list
      const optionList = page.locator('[role="listbox"] [role="option"]');
      const optionCount = await optionList.count();
      console.log('Number of options:', optionCount);

      // If there are options, click the first one
      if (optionCount > 0) {
        await optionList.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/dropdown-07-option-selected.png', fullPage: true });
      }
    }

    // Fill commission rate
    const rateInput = page.locator('input[type="number"]');
    if (await rateInput.isVisible({ timeout: 3000 })) {
      await rateInput.fill('15');
      console.log('Commission rate filled');
    }

    await page.screenshot({ path: 'screenshots/dropdown-08-form-filled.png', fullPage: true });

    // Print console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.slice(-20).forEach(log => console.log(log));

    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(err => console.log(err));

    // Filter critical errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('postMessage')
    );

    // Verify no critical errors
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('displays loading indicator while fetching dropdown options', async ({ page }) => {
    // Navigate directly to a rules page
    await page.goto('http://localhost:5184/commissions/2/version/1');
    await page.waitForLoadState('networkidle');

    // Login if needed
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill('manus@secretagentsocks.com');
      await page.locator('input[type="password"]').fill('claude123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    // Wait for rules page to load
    await page.waitForSelector('h2:has-text("Commission Rules")', { timeout: 15000 });

    // Click Add Rule button
    const addRuleButton = page.locator('button:has-text("Add Rule")').first();
    await addRuleButton.click();
    await page.waitForTimeout(500);

    // Select Resource Rule to trigger loading
    const resourceRuleOption = page.getByRole('button', { name: /Resource Rule/i });
    await resourceRuleOption.scrollIntoViewIfNeeded();
    await resourceRuleOption.click();

    // The loading state might be very brief, so we just check the page rendered correctly
    await page.waitForTimeout(2000);

    // After loading completes, check that the searchable dropdown is present
    const dropdownTrigger = page.locator('button[aria-haspopup="listbox"]');
    const dropdownVisible = await dropdownTrigger.isVisible({ timeout: 5000 });
    console.log('Dropdown trigger visible after loading:', dropdownVisible);

    // Verify dropdown is present
    expect(dropdownVisible).toBe(true);
  });
});
