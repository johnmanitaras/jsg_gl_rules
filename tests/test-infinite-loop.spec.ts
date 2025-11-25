import { test, expect } from '@playwright/test';

test('Check for infinite loop when adding rule', async ({ page }) => {
  // Track GraphQL requests
  const graphqlRequests = new Map<string, number>();
  const requestLog: Array<{ url: string; query: string; timestamp: number }> = [];

  // Intercept network requests
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('graphql') || url.includes('hasura')) {
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          const query = data.query || '';

          // Extract query name
          let queryName = 'unknown';
          const match = query.match(/query\s+(\w+)|mutation\s+(\w+)/);
          if (match) {
            queryName = match[1] || match[2] || 'unknown';
          }

          // Track count
          const count = graphqlRequests.get(queryName) || 0;
          graphqlRequests.set(queryName, count + 1);

          requestLog.push({
            url,
            query: queryName,
            timestamp: Date.now()
          });

          console.log(`[${count + 1}] GraphQL Request: ${queryName}`);
        } catch {
          // Ignore parse errors
        }
      }
    }
  });

  console.log('\n=== Starting Test ===\n');

  // Navigate to app
  console.log('Navigating to app...');
  await page.goto('http://localhost:5184/');

  // Wait for login page
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Login
  console.log('Logging in...');
  await page.fill('input[type="email"]', 'manus@secretagentsocks.com');
  await page.fill('input[type="password"]', 'claude123');
  await page.click('button[type="submit"]');

  // Wait for app to load
  console.log('Waiting for app to load...');
  await page.waitForTimeout(2000);

  // Clear request log after initial load
  graphqlRequests.clear();
  requestLog.length = 0;
  console.log('\n=== Cleared initial load requests ===\n');

  // Click "New Profile" button
  console.log('Clicking New Profile button...');
  await page.click('button:has-text("New Profile"), button:has-text("Create Profile")');

  // Wait for modal
  await page.waitForSelector('input[type="text"]', { timeout: 5000 });

  // Enter profile name
  console.log('Entering profile name...');
  await page.fill('input[type="text"]', 'Test Profile');

  // Wait a bit to see if there are any requests
  await page.waitForTimeout(1000);

  console.log('\n=== Clicking Add Rule ===\n');

  // Click "Add Rule" button
  await page.click('button:has-text("Add Rule")');

  // Wait for rule type selector to appear
  await page.waitForTimeout(500);

  console.log('Selecting Default rule type...');

  // Scroll to make Default Rule button visible (it's at the bottom of the list)
  // Use getByRole to target the specific button, not the informational text
  const defaultRuleOption = page.getByRole('button', { name: /Default Rule/i });
  await defaultRuleOption.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Click on Default Rule option
  await defaultRuleOption.click();

  // Wait for the form to appear
  await page.waitForTimeout(1000);

  console.log('\n=== After selecting rule type - waiting 5 seconds ===\n');

  // Wait 5 seconds and monitor requests
  await page.waitForTimeout(5000);

  // Enter commission rate
  console.log('Entering commission rate...');
  await page.fill('input[type="number"]', '25');

  // Wait a moment
  await page.waitForTimeout(500);

  // Click the "Add Rule" button inside the form to save the rule (using btn-primary class)
  console.log('\n=== Clicking Add Rule button in the form to save the rule ===\n');
  await page.click('button.btn-primary:has-text("Add Rule")');

  // Wait and monitor for infinite loop
  console.log('\n=== After adding rule - waiting 5 seconds to monitor for infinite loop ===\n');
  await page.waitForTimeout(5000);

  console.log('\n=== Test Complete ===\n');
  console.log('=== Request Summary ===');
  console.log(`Total GraphQL requests: ${requestLog.length}`);
  console.log('\nRequests by type:');

  graphqlRequests.forEach((count, name) => {
    console.log(`  ${name}: ${count} times`);
  });

  // Check for infinite loops (more than 3 of the same query is suspicious)
  console.log('\n=== Infinite Loop Check ===');
  let hasInfiniteLoop = false;

  graphqlRequests.forEach((count, name) => {
    if (count > 3) {
      console.log(`⚠️  WARNING: ${name} called ${count} times - POSSIBLE INFINITE LOOP!`);
      hasInfiniteLoop = true;
    }
  });

  if (!hasInfiniteLoop) {
    console.log('✅ No infinite loops detected');
  }

  // Show timeline
  console.log('\n=== Request Timeline ===');
  if (requestLog.length > 0) {
    const startTime = requestLog[0].timestamp;
    requestLog.forEach((req) => {
      const elapsed = ((req.timestamp - startTime) / 1000).toFixed(2);
      console.log(`[${elapsed}s] ${req.query}`);
    });
  } else {
    console.log('No requests logged');
  }

  // Fail test if infinite loop detected
  expect(hasInfiniteLoop).toBe(false);
});
