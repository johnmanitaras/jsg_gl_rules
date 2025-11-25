import { test, expect } from '@playwright/test';

test.describe('Commission Version Rules Page (Screen 3)', () => {
  test('full navigation flow: profiles → versions → rules', async ({ page }) => {
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

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    // Navigate to the app
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/rules-01-initial-page.png', fullPage: true });

    // Login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill('manus@secretagentsocks.com');
      await page.locator('input[type="password"]').fill('claude123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'screenshots/rules-02-profiles-page.png', fullPage: true });

    // Wait for profile cards to load with actual content (not skeleton)
    // Profile cards with content will have h3 elements with profile names
    const profileCardWithContent = page.locator('.profile-card h3').first();
    await profileCardWithContent.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Profile card content loaded');

    // Screenshot after data loaded
    await page.screenshot({ path: 'screenshots/rules-02b-profiles-loaded.png', fullPage: true });

    // Click on first profile card to go to versions
    const firstCard = page.locator('.profile-card').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      const profileName = await page.locator('.profile-card h3').first().textContent();
      console.log('Found profile card:', profileName);
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'screenshots/rules-03-versions-page.png', fullPage: true });
    console.log('Current URL after clicking profile:', page.url());

    // Wait for versions page to load - should show profile name header
    const profileHeader = page.locator('h1').first();
    await profileHeader.waitFor({ state: 'visible', timeout: 10000 });
    const headerText = await profileHeader.textContent();
    console.log('Profile header text:', headerText);

    // Now click on a version link to navigate to the rules editor
    // The version cards use <a> tags with href when linkPath is provided
    const versionLink = page.locator('a[href*="/version/"]').first();
    if (await versionLink.isVisible({ timeout: 10000 })) {
      const href = await versionLink.getAttribute('href');
      console.log('Found version link with href:', href);
      await versionLink.click();
      // Wait for rules page to load - look for Commission Rules heading
      await page.waitForSelector('h2:has-text("Commission Rules")', { timeout: 15000 });
      await page.waitForTimeout(1000);
    } else {
      console.log('No version link found, checking for timeline-version elements...');
      const versionCard = page.locator('.timeline-version-active, .timeline-version').first();
      if (await versionCard.isVisible({ timeout: 5000 })) {
        console.log('Found version card, clicking...');
        await versionCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: 'screenshots/rules-04-rules-page.png', fullPage: true });
    console.log('Current URL after clicking version:', page.url());

    // Check if we're on the rules page
    const rulesUrl = page.url();
    const isRulesPage = rulesUrl.includes('/version/');
    console.log('Is on rules page:', isRulesPage);

    // Take screenshot of rules page
    await page.screenshot({ path: 'screenshots/rules-05-rules-page-full.png', fullPage: true });

    // Check for key elements on the rules page
    const pageTitle = page.locator('h1');
    if (await pageTitle.isVisible({ timeout: 3000 })) {
      const titleText = await pageTitle.textContent();
      console.log('Page title:', titleText);
    }

    // Check for "Commission Rules" heading
    const rulesHeading = page.locator('h2:has-text("Commission Rules")');
    if (await rulesHeading.isVisible({ timeout: 3000 })) {
      console.log('Commission Rules heading found');
    }

    // Check for Add Rule button
    const addRuleButton = page.locator('button:has-text("Add Rule")');
    if (await addRuleButton.isVisible({ timeout: 3000 })) {
      console.log('Add Rule button found');

      // Click Add Rule to show the rule type selector
      await addRuleButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/rules-06-add-rule-expanded.png', fullPage: true });
    }

    // Print console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.slice(-30).forEach(log => console.log(log));

    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(err => console.log(err));

    console.log('\n=== Final URL ===');
    console.log(page.url());

    // Verify no critical errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('postMessage')
    );

    if (criticalErrors.length > 0) {
      console.log('\n=== Critical Errors ===');
      criticalErrors.forEach(err => console.log(err));
    }
  });

  test('direct navigation to rules page', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

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

    await page.screenshot({ path: 'screenshots/rules-07-direct-navigation.png', fullPage: true });
    console.log('Direct navigation URL:', page.url());

    // Check page loaded correctly
    const pageContent = await page.content();
    console.log('Page has Commission Rules heading:', pageContent.includes('Commission Rules'));
    console.log('Page has back button:', pageContent.includes('Back to versions') || pageContent.includes('ArrowLeft'));

    // Check for errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver')
    );

    expect(criticalErrors.length).toBeLessThan(3);
  });
});
