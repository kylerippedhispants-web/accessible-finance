import { expect, test } from '@playwright/test';

for (const [type, containerId, addId] of [
  ['income', 'incomeRows', 'addIncome'],
  ['expenses', 'expenseRows', 'addExpense'],
]) {
  test(`cash-flow ${type} removal keeps keyboard focus in the edited list`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/cash-flow?edition=ca');
    const rows = page.locator(`#${containerId} .flow-row`);
    await expect(rows.first()).toBeVisible();
    // Exercise middle, last, first, and finally the only remaining row.
    const initialCount = await rows.count();
    for (const index of [1, initialCount - 2, ...Array(initialCount - 2).fill(0)]) {
      const count = await rows.count();
      const removedName = await rows.nth(index).locator('[data-field="name"]').inputValue();
      await rows.nth(index).getByRole('button', { name: /^Remove / }).focus();
      await page.keyboard.press('Enter');
      await expect(rows).toHaveCount(count - 1);
      await expect(page.locator('#cashFlowNotice')).toHaveText(`${removedName} removed.`);
      if (count > 1) {
        await expect(rows.nth(Math.min(index, count - 2)).locator('[data-field="name"]')).toBeFocused();
      } else {
        await expect(page.locator(`#${addId}`)).toBeFocused();
      }
    }
    await page.keyboard.press('Enter');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('[data-field="name"]')).toBeFocused();
  });
}

for (const width of [320, 768, 1440]) {
  test(`public pages and planner share three local fonts and heading roles at ${width}px`, async ({ page, context, baseURL }) => {
    const externalFonts: string[] = [];
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') externalFonts.push(url.hostname);
      return url.origin === new URL(baseURL!).origin ? route.continue() : route.abort();
    });
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/guides/rebalancing', '/about', '/articles', '/cash-flow', '/us/', '/planner/']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const typography = await page.evaluate(async () => {
        await document.fonts.ready;
        const heading = getComputedStyle(document.querySelector('h1')!);
        return {
          loadedFamilies: [...new Set(Array.from(document.fonts)
            .filter((face) => face.status === 'loaded')
            .map((face) => face.family.replaceAll(/["']/g, '')))].sort(),
          body: getComputedStyle(document.body).fontFamily.split(',')[0].replaceAll(/["']/g, '').trim(),
          heading: heading.fontFamily.split(',')[0].replaceAll(/["']/g, '').trim(),
          headingSize: Number.parseFloat(heading.fontSize),
          headingLineHeight: Number.parseFloat(heading.lineHeight) / Number.parseFloat(heading.fontSize),
          fitsViewport: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        };
      });
      expect(typography, path).toMatchObject({
        loadedFamilies: ['Instrument Serif', 'Inter', 'Literata'],
        body: 'Literata',
        heading: 'Instrument Serif',
        headingSize: width <= 600 ? 40 : width <= 768 ? 48 : 64,
        fitsViewport: true,
      });
      expect(typography.headingLineHeight, path).toBeCloseTo(1.08, 2);
    }
    expect(externalFonts).toEqual([]);
  });
}

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
