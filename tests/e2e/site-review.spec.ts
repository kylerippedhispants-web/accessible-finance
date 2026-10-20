import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, baseURL, page }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  // Make reveal-on-scroll content available to the contrast check as well.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const publicPages = [
  '/', '/start-here', '/articles', '/guides/compound-interest',
  '/guides/tfsa-vs-rrsp', '/fire', '/tax-calculator', '/cash-flow?edition=ca',
  '/wealth-rank', '/about', '/contact', '/journal', '/earn', '/us/',
  '/us/accounts', '/us/fire', '/us/tax-calculator', '/us/rewards',
];

for (const width of [320, 768, 1440]) {
  test(`public pages reflow and pass automated accessibility checks at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const path of publicPages) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.locator('h1'), path).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), path).toBe(true);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations, `${path} at ${width}px`).toEqual([]);
    }
  });
}

test('skip and guide contents links move keyboard focus without reduced-motion animation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#main-content')))).toBe(true);

  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/guides/compound-interest');
  const contents = page.locator('details').filter({ has: page.locator('a[href^="#"]') }).first();
  if (await contents.count()) {
    await contents.locator('summary').click();
    const link = contents.locator('a[href^="#"]').first();
    const id = (await link.getAttribute('href'))!.slice(1);
    await link.click();
    await expect(page.locator(`[id="${id}"]`)).toBeFocused();
  } else {
    const link = page.locator('main a[href^="#"]').first();
    const id = (await link.getAttribute('href'))!.slice(1);
    await link.click();
    await expect(page.locator(`[id="${id}"]`)).toBeFocused();
  }
});

test('desktop guide contents stays available after following a section link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/guides/compound-interest');
  const contents = page.locator('.toc');
  const link = contents.locator('a[href^="#"]').first();
  await link.click();
  await expect(contents).toHaveAttribute('open', '');
  await expect(contents.locator('a[href^="#"]').last()).toBeVisible();
});

test('grouped desktop navigation and narrow newsletter remain keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const nav = page.locator('.nav-links');
  await nav.getByText('Tools', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link', { name: 'Canadian tax estimate' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Canadian tax estimate' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(nav.getByText('Tools', { exact: true })).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Canadian tax estimate' })).toBeHidden();

  await page.setViewportSize({ width: 320, height: 640 });
  const menuButton = page.getByRole('button', { name: 'Open menu', exact: true });
  await menuButton.click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'Subscribe', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Subscribe on Substack (opens a new tab)' })).toBeInViewport();
  await expect(dialog.locator('iframe')).toBeHidden();
  expect(await dialog.locator('.nl-modal').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(menuButton).toBeFocused();
  await page.locator('#newsletter').scrollIntoViewIfNeeded();
  await expect(page.locator('#newsletter').getByRole('link', { name: 'Subscribe on Substack (opens a new tab)' })).toBeVisible();

  await menuButton.click();
  await page.locator('#mobile-menu').getByRole('link', { name: 'Subscribe', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(dialog.locator('iframe')).toHaveAttribute('src', 'https://accessiblefinance.substack.com/embed');
});

test('pretty URLs preserve edition links, planner bridges, and footer topic filters', async ({ page }) => {
  await page.goto('/cash-flow?edition=us');
  const links = await page.locator('a[href*="cash-flow"]').evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).href));
  expect(links.length).toBeGreaterThan(0);
  expect(links.every((link) => new URL(link).searchParams.get('edition') === 'us')).toBe(true);
  await expect(page.locator('#planner-bridge')).toBeVisible();
  await page.goto('/guides/compound-interest');
  await expect(page.locator('#planner-bridge')).toBeVisible();
  await expect(page.locator('footer').getByRole('link', { name: 'Beginner', exact: true })).toHaveAttribute('href', /articles\.html\?cat=beginner$/);
  await expect(page.locator('footer').getByRole('link', { name: 'Intermediate', exact: true })).toHaveAttribute('href', /articles\.html\?cat=intermediate$/);
});

test('cash flow keeps the remembered US edition when its URL has no query', async ({ page }) => {
  await page.goto('/cash-flow?edition=us');
  await page.evaluate(() => localStorage.setItem('accessibleFinanceRegion', 'us'));
  await page.goto('/cash-flow');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('button', { name: 'Edition: United States. Choose edition', exact: true })).toBeVisible();
  await page.locator('.nav-links summary').filter({ hasText: 'Tools' }).click();
  await expect(page.locator('.nav-links').getByRole('link', { name: 'U.S. tax estimate' })).toBeVisible();
  await expect(page.locator('.nav-links').getByRole('link', { name: 'Cash flow', exact: true })).toHaveAttribute('href', /edition=us$/);
});
