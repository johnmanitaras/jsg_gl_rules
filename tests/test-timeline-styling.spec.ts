import { test } from '@playwright/test';

test.describe('Timeline Styling Test', () => {
  test('capture timeline screenshot and check console', async ({ page }) => {
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
    await page.goto('http://localhost:5183');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-initial-page.png', fullPage: true });

    // Login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill('manus@secretagentsocks.com');
      await page.locator('input[type="password"]').fill('claude123');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for auth and data load
    }

    await page.screenshot({ path: 'screenshots/02-after-login.png', fullPage: true });

    // Wait for profile cards to appear with actual content
    // Look for text that indicates profile data
    console.log('Looking for profile cards...');

    // Wait for any text content in the cards
    await page.waitForTimeout(2000);

    // Get page HTML to debug
    const html = await page.content();
    console.log('Page has profile-card class:', html.includes('profile-card'));

    // Take screenshot of profiles page
    await page.screenshot({ path: 'screenshots/03-profiles-page.png', fullPage: true });

    // Click on the first profile card to navigate to timeline
    const firstCard = page.locator('.profile-card').first();
    if (await firstCard.isVisible({ timeout: 5000 })) {
      console.log('Found profile card, clicking...');
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('No profile card found');
    }

    // Take screenshot of timeline page
    await page.screenshot({ path: 'screenshots/04-timeline-page.png', fullPage: true });
    console.log('Current URL:', page.url());

    // Debug: Get version card information
    const versionCard = page.locator('.timeline-version-active, .timeline-version').first();
    if (await versionCard.isVisible({ timeout: 3000 })) {
      const cardInfo = await versionCard.evaluate((el) => {
        // Get the card's own computed style
        const cardStyle = window.getComputedStyle(el);

        // Get the motion.div parent (absolute positioned container)
        const motionDiv = el.closest('.group');
        const motionStyle = motionDiv ? window.getComputedStyle(motionDiv) : null;

        // Get bounding rectangles
        const cardRect = el.getBoundingClientRect();
        const motionRect = motionDiv ? motionDiv.getBoundingClientRect() : null;

        // Get inline styles from motion.div
        const inlineTop = motionDiv ? (motionDiv as HTMLElement).style.top : 'N/A';
        const inlineHeight = motionDiv ? (motionDiv as HTMLElement).style.height : 'N/A';

        return {
          card: {
            height: cardStyle.height,
            position: cardStyle.position,
            rect: { height: cardRect.height, top: cardRect.top }
          },
          motionDiv: {
            computedTop: motionStyle?.top,
            computedHeight: motionStyle?.height,
            computedPosition: motionStyle?.position,
            inlineTop,
            inlineHeight,
            rect: motionRect ? { height: motionRect.height, top: motionRect.top } : null
          }
        };
      });
      console.log('Version card details:', JSON.stringify(cardInfo, null, 2));
    }

    // Count months rendered
    const monthCount = await page.locator('.h-10').count();
    console.log('Month rows rendered:', monthCount);

    // Check lane container border
    const laneContainer = page.locator('.divide-x.rounded-lg.border').first();
    if (await laneContainer.isVisible({ timeout: 3000 })) {
      const borderInfo = await laneContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          border: style.border,
          borderColor: style.borderColor,
          borderStyle: style.borderStyle,
          borderWidth: style.borderWidth
        };
      });
      console.log('Lane container border:', JSON.stringify(borderInfo, null, 2));
    }

    // Hover over version card to capture edit/delete buttons
    if (await versionCard.isVisible()) {
      await versionCard.hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/05-version-hover.png', fullPage: true });

      // Check action button styling
      const buttonCount = await page.locator('.group button').count();
      console.log('Action buttons found:', buttonCount);

      // Hover over the edit button specifically to show hover state
      const editButton = page.locator('.group button').first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.hover();
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'screenshots/06-edit-button-hover.png', fullPage: true });
      }

      // Hover over delete button
      const deleteButton = page.locator('.group button').last();
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.hover();
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'screenshots/07-delete-button-hover.png', fullPage: true });
      }
    }

    // If we're still on the same page, try navigating directly to profile 2
    if (!page.url().includes('/commissions/')) {
      console.log('Navigating directly to a profile timeline...');
      await page.goto('http://localhost:5183/commissions/2');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/05-direct-navigation.png', fullPage: true });
    }

    // Print console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.slice(-30).forEach(log => console.log(log));

    console.log('\n=== Console Errors ===');
    consoleErrors.forEach(err => console.log(err));

    console.log('\n=== Final URL ===');
    console.log(page.url());
  });
});
