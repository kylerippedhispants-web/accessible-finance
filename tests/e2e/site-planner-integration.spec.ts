import { expect, test } from '@playwright/test';

const demoStorageKey = 'accessibleFinancePlannerDemoV1';

test.beforeEach(async ({ context, baseURL }) => {
  const localOrigin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === localOrigin) return route.continue();
    return route.abort();
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('accessibleFinanceRegion', window.location.pathname.startsWith('/us/') ? 'us' : 'ca');
  });
});

test('unconfigured preview keeps demo edits instead of sending visitors to unavailable sign-in', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/planner/');
  await expect(page.getByRole('heading', { name: 'Cloud saving is unavailable here.', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create account', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Try the fictional demo', exact: true }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);
  await page.getByRole('link', { name: 'Profile & settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep exploring the fictional demo.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit demo to sign in', exact: true })).toHaveCount(0);

  const savedBeforeEdit = await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey);
  expect(savedBeforeEdit).not.toBeNull();
  await page.getByRole('textbox', { name: 'Plan name (required)', exact: true }).fill('Fictional preview draft');
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled();
  await page.getByRole('link', { name: 'Continue demo', exact: true }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);
  await page.getByRole('link', { name: 'Profile & settings', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Plan name (required)', exact: true })).toHaveValue('Fictional preview draft');
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey)).toBe(savedBeforeEdit);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Saved for this browser session. Nothing was uploaded.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Plan name (required)', exact: true })).toHaveValue('Fictional preview draft');
});

test('website visitors can try a plan and read guides without losing an unsaved draft', async ({ page, baseURL }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('[aria-labelledby="planning-journey-title"]')).toBeVisible();
  await page.locator('.planning-journey').screenshot({ path: testInfo.outputPath('learning-and-planner.png') });
  await page.getByRole('link', { name: 'Open the FIRE planner', exact: true }).click();
  await expect(page).toHaveURL(new URL('/planner/', baseURL!).href);
  await page.getByRole('button', { name: 'Try the fictional demo', exact: true }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);

  await page.getByRole('link', { name: 'Income', exact: true }).click();
  const savedBeforeEdit = await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey);
  expect(savedBeforeEdit).not.toBeNull();
  await page.getByRole('button', { name: 'Add income', exact: true }).click();
  await page.getByLabel('Income name').fill('Integration sample income');
  await page.getByRole('spinbutton', { name: /^Amount/ }).fill('500');
  await page.getByLabel('Frequency').selectOption('monthly');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Integration sample income', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled();

  const guideLink = page.locator('#planner-sidebar').getByRole('link', { name: /Educational guides/ });
  const [guideTab] = await Promise.all([
    page.waitForEvent('popup'),
    guideLink.click(),
  ]);
  await guideTab.waitForLoadState('domcontentloaded');
  await expect(guideTab).toHaveURL(new URL('/articles.html', baseURL!).href);
  expect(await guideTab.evaluate(() => window.opener === null)).toBe(true);
  expect(await guideTab.evaluate((key) => sessionStorage.getItem(key), demoStorageKey)).toBeNull();

  await expect(page).toHaveURL(/\/planner\/income$/);
  await expect(page.getByRole('heading', { name: 'Integration sample income', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey)).toBe(savedBeforeEdit);
  await guideTab.close();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Saved for this browser session. Nothing was uploaded.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Integration sample income', exact: true })).toBeVisible();
});

test('exiting a dirty demo uses one clear confirmation and cancellation preserves the draft', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/planner/');
  await page.getByRole('button', { name: 'Try the fictional demo', exact: true }).click();
  await page.getByRole('link', { name: 'Profile & settings', exact: true }).click();
  await page.getByRole('textbox', { name: 'Plan name (required)', exact: true }).fill('Fictional draft to keep');
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled();
  const storedSession = await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey);
  expect(storedSession).not.toBeNull();

  const confirmations: string[] = [];
  let acceptExit = false;
  page.on('dialog', async (dialog) => {
    confirmations.push(dialog.message());
    if (acceptExit) await dialog.accept();
    else await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Exit Demo Mode', exact: true }).click();
  expect(confirmations).toHaveLength(1);
  expect(confirmations[0]).toContain('remove its fictional session data');
  expect(confirmations[0]).toContain('Unsaved demo edits will also be removed.');
  await expect(page.getByRole('textbox', { name: 'Plan name (required)', exact: true })).toHaveValue('Fictional draft to keep');
  expect(await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey)).toBe(storedSession);

  acceptExit = true;
  await page.getByRole('button', { name: 'Exit Demo Mode', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Try the fictional demo', exact: true })).toBeVisible();
  expect(confirmations).toHaveLength(2);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey)).toBeNull();
});

test('the mobile website menu opens the planner and both entry pages fit 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  const journey = page.locator('[aria-labelledby="planning-journey-title"]');
  await journey.scrollIntoViewIfNeeded();
  await expect(journey).toBeVisible();
  expect(await journey.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'FIRE Planner', exact: true }).click();
  await expect(page).toHaveURL(/\/planner\/$/);
  await expect(page.getByRole('button', { name: 'Try the fictional demo', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Planner', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.locator('.landing-nav').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.locator('.landing-principles').scrollIntoViewIfNeeded();
  expect(await page.locator('.principle-grid').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

for (const path of ['/fire.html', '/cash-flow.html', '/guides/budgeting-without-rigidity.html']) {
  test(`${path} connects to the root Canadian planner`, async ({ page, baseURL }) => {
    await page.goto(path);
    const bridgeLink = page.locator('#planner-bridge').getByRole('link', { name: 'Explore the Canadian planner', exact: true });
    await expect(bridgeLink).toHaveAttribute('href', new URL('/planner/', baseURL!).href);
    await bridgeLink.click();
    await expect(page).toHaveURL(new URL('/planner/', baseURL!).href);
    await expect(page.getByRole('button', { name: 'Try the fictional demo', exact: true })).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), demoStorageKey)).toBeNull();
  });
}

test('the US edition identifies the planner as Canadian and links outside the US folder', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/us/');
  const plannerLink = page.locator('.nav-links').getByRole('link', { name: 'Canadian Planner', exact: true });
  await expect(plannerLink).toHaveAttribute('href', new URL('/planner/', baseURL!).href);
  await plannerLink.click();
  await expect(page).toHaveURL(new URL('/planner/', baseURL!).href);
  await expect(page.getByText('Free Canadian financial planner', { exact: true })).toBeVisible();
});
