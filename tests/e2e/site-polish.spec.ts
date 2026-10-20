import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, baseURL }) => {
  const localOrigin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === localOrigin) return route.continue();
    return route.abort();
  });
});

for (const { path, edition } of [
  { path: '/guides/compound-interest.html', edition: 'Canada' },
  { path: '/us/accounts.html', edition: 'United States' },
  { path: '/cash-flow.html?edition=us', edition: 'United States' },
]) {
  test(`a first visit to ${path} uses its edition without blocking the page`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(path);
    await expect(page).toHaveURL(new URL(path, baseURL!).href);
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: `Edition: ${edition}. Choose edition`, exact: true })).toBeVisible();
    await expect(page.locator('.region-overlay')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/region-dialog-open/);
    expect(await page.evaluate(() => localStorage.getItem('accessibleFinanceRegion'))).toBeNull();
  });
}

test('edition switchers remember a home preference while direct guide links keep their edition', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/guides/compound-interest.html');
  await page.getByRole('button', { name: 'Edition: Canada. Choose edition', exact: true }).click();
  await page.getByRole('option', { name: /United States/ }).click();
  await expect(page).toHaveURL(new URL('/us/index.html', baseURL!).href);
  expect(await page.evaluate(() => localStorage.getItem('accessibleFinanceRegion'))).toBe('us');

  await page.goto('/guides/compound-interest.html');
  await expect(page).toHaveURL(new URL('/guides/compound-interest.html', baseURL!).href);
  await expect(page.getByRole('button', { name: 'Edition: Canada. Choose edition', exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL(new URL('/us/index.html', baseURL!).href);
  await page.getByRole('button', { name: 'Edition: United States. Choose edition', exact: true }).click();
  await page.getByRole('option', { name: /Canada/ }).click();
  await expect(page).toHaveURL(new URL('/index.html', baseURL!).href);
  expect(await page.evaluate(() => localStorage.getItem('accessibleFinanceRegion'))).toBe('ca');
});

test('guide search combines with the selected topic and recovers from an empty result', async ({ page }) => {
  await page.goto('/articles.html?cat=canadian');
  const search = page.getByRole('searchbox', { name: 'Search guides', exact: true });
  const results = page.getByRole('status');
  const visibleCards = page.locator('#articlesGrid .card:visible');
  await expect(page.getByRole('button', { name: 'Canadian', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(results).toHaveText('Showing 7 of 7 guides.');

  await search.fill('  TfSa  ');
  await expect(results).toHaveText('Showing 3 of 3 guides.');
  await expect(visibleCards).toHaveCount(3);
  await expect(page.locator('.featured-wrap')).toBeHidden();
  expect(await visibleCards.evaluateAll((cards) => cards.every((card) => (card as HTMLElement).dataset.cat === 'canadian'))).toBe(true);

  await page.getByRole('button', { name: 'Money Systems', exact: true }).click();
  await expect(search).toHaveValue('  TfSa  ');
  await expect(results).toHaveText('No guides match. Try another search or choose All Topics.');
  await expect(page.locator('#emptyState')).toBeVisible();
  await expect(visibleCards).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Load More Guides', exact: true })).toBeHidden();

  await search.fill('');
  await expect(results).toHaveText('Showing 1 of 1 guide.');
  await expect(page.locator('#emptyState')).toBeHidden();
  await expect(visibleCards).toHaveCount(1);
  await expect(visibleCards.first()).toContainText('Budgeting for People Who Hate Budgeting');
  await page.getByRole('button', { name: 'All Topics', exact: true }).click();
  await search.fill('compound interest');
  await expect(results).toHaveText('Showing 2 of 2 guides.');
  await expect(visibleCards).toHaveCount(2);
  await expect(visibleCards.first()).toContainText('Compound Interest');
  await expect(visibleCards.nth(1)).toContainText('Fees: Compound Interest in Reverse');
});

test('guide counts include the featured guide and update as more results are loaded', async ({ page }) => {
  await page.goto('/articles.html?cat=unknown-topic');
  const results = page.getByRole('status');
  const visibleCards = page.locator('#articlesGrid .card:visible');
  await expect(results).toHaveText('Showing 10 of 42 guides.');
  await expect(visibleCards).toHaveCount(9);
  await expect(page.locator('.featured-wrap')).toBeVisible();
  await page.getByRole('button', { name: 'Load More Guides', exact: true }).click();
  await expect(results).toHaveText('Showing 19 of 42 guides.');
  await expect(visibleCards).toHaveCount(18);
  await page.getByRole('searchbox', { name: 'Search guides', exact: true }).fill('speculating');
  await expect(results).toHaveText('Showing 1 of 1 guide.');
  await expect(visibleCards).toHaveCount(0);
  await expect(page.locator('.featured-wrap')).toBeVisible();
  await expect(page.locator('#emptyState')).toBeHidden();
});

test('the tablet menu can scroll to its last action without scrolling the page', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.goto('/articles.html');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  const menu = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  await expect(menu).toBeVisible();
  await menu.getByText('Tools', { exact: true }).click();
  expect(await menu.evaluate((element) => getComputedStyle(element).overflowY)).toBe('auto');
  expect(await menu.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  const lastAction = menu.getByRole('link', { name: 'Subscribe', exact: true });
  await lastAction.scrollIntoViewIfNeeded();
  await expect(lastAction).toBeInViewport();
  expect(await menu.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await lastAction.click();
  await expect(page.getByRole('button', { name: 'Close newsletter signup', exact: true })).toBeVisible();
  await expect(page.locator('#hamburger')).toHaveAttribute('aria-expanded', 'false');
});

test('phone readers see the topic scroll hint and can reach the final filter', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/articles.html');
  await expect(page.getByText('Scroll to explore all topics', { exact: false })).toBeVisible();
  const filters = page.getByRole('group', { name: 'Filter guides', exact: true });
  expect(await filters.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await filters.getByRole('button', { name: 'Intermediate', exact: true }).click();
  await expect(filters.getByRole('button', { name: 'Intermediate', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
