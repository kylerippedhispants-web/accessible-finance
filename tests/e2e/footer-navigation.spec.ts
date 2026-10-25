import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
});

for (const path of ['/', '/articles', '/guides/compound-interest', '/cash-flow?edition=ca', '/cash-flow?edition=us', '/us/', '/us/accounts', '/start-here', '/journal']) {
  test(`footer navigation matches the header edition and fits narrow screens on ${path}`, async ({ page }) => {
    await page.goto(path);
    const footer = page.locator('footer.shared-footer');
    await expect(footer).toBeVisible();
    const groups = await page.locator('.nav-links .nav-group').evaluateAll((nodes) => nodes.map((node) => ({
      label: node.querySelector('summary')!.textContent!.trim(),
      links: Array.from(node.querySelectorAll('a')).map((link) => ({ label: link.textContent!.trim(), href: link.href })),
    })));
    for (const group of groups) {
      const column = footer.getByRole('navigation', { name: `${group.label} footer links`, exact: true });
      for (const link of group.links) {
        await expect(column.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.href);
      }
    }
    const planner = page.locator('.nav-links [data-planner-link]');
    await expect(footer.locator('[data-planner-link]')).toHaveText((await planner.innerText()).trim());
    await expect(footer.locator('[data-planner-link]')).toHaveAttribute('href', (await planner.getAttribute('href'))!);
    await expect(footer.getByRole('link', { name: 'Guide Library', exact: true })).toHaveCount(0);
    await expect(footer.getByRole('link', { name: 'All guides', exact: true })).toHaveCount(path.includes('/us') || path.includes('edition=us') ? 0 : 1);
    const about = footer.getByRole('navigation', { name: 'About footer links', exact: true });
    for (const name of ['About', 'Editorial standards', 'Contact & corrections', 'Subscribe', 'Instagram', 'Privacy', 'Disclaimer']) {
      await expect(about.getByRole('link', { name, exact: true })).toHaveCount(1);
    }
    await expect(footer.locator('[data-region-rewards]')).toHaveAttribute('href', path.includes('/us') || path.includes('edition=us') ? /\/us\/rewards\.html$/ : /\/earn\.html$/);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await footer.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await footer.locator('.footer-col a').evaluateAll((links) => links.every((link) => {
        const box = link.getBoundingClientRect();
        return box.height >= 44 && box.left >= 0 && box.right <= innerWidth;
      }))).toBe(true);
    }
  });
}

for (const path of ['/', '/start-here', '/journal']) {
  test(`rebuilt footer Subscribe opens and restores keyboard focus on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(path);
    const originalUrl = page.url();
    const subscribe = page.locator('footer.shared-footer').getByRole('link', { name: 'Subscribe', exact: true });
    await subscribe.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#nlOverlay')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close newsletter signup', exact: true })).toBeFocused();
    await expect(page).toHaveURL(originalUrl);
    await page.keyboard.press('Escape');
    await expect(page.locator('#nlOverlay')).toBeHidden();
    await expect(subscribe).toBeFocused();
  });
}

test('footer keeps the remembered US edition and supports keyboard subscription with visible focus', async ({ page }) => {
  await page.goto('/cash-flow?edition=us');
  await page.evaluate(() => localStorage.setItem('accessibleFinanceRegion', 'us'));
  await page.goto('/cash-flow');
  await page.setViewportSize({ width: 320, height: 900 });
  const footer = page.locator('footer.shared-footer');
  await expect(footer.getByRole('link', { name: 'U.S. tax estimate', exact: true })).toHaveAttribute('href', /\/us\/tax-calculator\.html$/);
  await expect(footer.getByRole('link', { name: 'Cash flow', exact: true })).toHaveAttribute('href', /edition=us$/);
  await expect(footer.getByRole('link', { name: 'Canadian Planner', exact: true })).toHaveAttribute('href', /\/planner\/$/);
  const subscribe = footer.getByRole('link', { name: 'Subscribe', exact: true });
  await subscribe.focus();
  await expect(subscribe).toBeFocused();
  expect(await subscribe.evaluate((link) => getComputedStyle(link).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close newsletter signup', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(subscribe).toBeFocused();
  const accessibility = await new AxeBuilder({ page }).include('footer.shared-footer').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});
