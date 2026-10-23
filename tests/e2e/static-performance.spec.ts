import { expect, test } from '@playwright/test';

test('public pages and planner load their real fonts without a third-party font connection', async ({ page, context, baseURL }) => {
  const externalFonts: string[] = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') externalFonts.push(url.hostname);
    return url.origin === new URL(baseURL!).origin ? route.continue() : route.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/guides/compound-interest', '/planner/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const loadedFamilies = await page.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts).filter((face) => face.status === 'loaded').map((face) => face.family.replaceAll('"', ''));
    });
    expect(loadedFamilies).toEqual(expect.arrayContaining(['Instrument Serif', 'Literata', 'Inter']));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(externalFonts).toEqual([]);
});

test('homepage hero and mobile sections are visible even before JavaScript runs', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  await context.route('**/*', (route) => new URL(route.request().url()).origin === new URL(baseURL!).origin ? route.continue() : route.abort());
  const page = await context.newPage();
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const hero = page.locator('.hero > div').first();
    await expect(hero).toHaveCSS('opacity', '1');
    await expect(hero).toHaveCSS('transform', 'none');
    await expect(page.locator('.hero h1')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(page.locator('.tools-head')).toHaveCSS('opacity', '1');
    await expect(page.locator('.tools-head')).toHaveCSS('transform', 'none');
  } finally {
    await context.close();
  }
});

test('mobile cash flow loads no diagram code until opened and recovers from a blocked request', async ({ page, context, baseURL }) => {
  const diagramRequests: string[] = [];
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('cdn.jsdelivr.net/npm/d3')) diagramRequests.push(url);
    return new URL(url).origin === new URL(baseURL!).origin ? route.continue() : route.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cash-flow');
  const map = page.locator('#cashFlowMap');
  await expect(map).not.toHaveAttribute('open');
  await expect(page.locator('#summaryIncome')).toHaveText('$5,000');
  await page.locator('#income-amount-0').fill('6000');
  await expect(page.locator('#summaryIncome')).toHaveText('$6,500');
  await map.scrollIntoViewIfNeeded();
  expect(diagramRequests).toEqual([]);
  await map.locator('summary').click();
  await expect(page.locator('#chartError')).toBeVisible();
  expect(diagramRequests).toHaveLength(1);
  await expect(page.locator('#sankeyFrame')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#summaryIncome')).toHaveText('$6,500');
  await page.getByRole('button', { name: 'Retry visual money map' }).click();
  await expect(page.locator('#chartError')).toBeVisible();
  expect(diagramRequests).toHaveLength(2);
  await expect(map.locator('summary')).toBeFocused();
});
