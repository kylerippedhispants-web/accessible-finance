import { expect, test } from '@playwright/test';

const referralUrl = 'https://www.wealthsimple.com/invite/BZJM-A';
const dismissalKey = 'af-wealthsimple-referral-dismissed';

test.beforeEach(async ({ context, baseURL }) => {
  const siteOrigin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => (
    new URL(route.request().url()).origin === siteOrigin ? route.continue() : route.abort()
  ));
});

test('first visit shows a desktop referral without interrupting site navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const offer = page.locator('#wealthsimple-referral');
  await expect(offer).toBeVisible();
  await expect(offer).toHaveCSS('position', 'fixed');
  await expect(offer.getByRole('heading', { name: 'New to Wealthsimple?' })).toBeVisible();
  await expect(offer).toContainText(/Accessible Finance may (receive|earn) a (referral )?(reward|benefit)/i);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();

  const nav = page.locator('.site-nav');
  await nav.getByText('Learn', { exact: true }).click();
  await nav.getByRole('link', { name: 'All guides', exact: true }).click();
  await expect(page).toHaveURL(/\/articles(?:\.html)?$/);
  await expect(offer).toHaveCount(0);
});

test('mobile referral fits 320px and keyboard dismissal persists across visits', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');

  const offer = page.locator('#wealthsimple-referral');
  await expect(offer).toBeVisible();
  await expect(offer).toHaveCSS('position', 'static');
  const geometry = await offer.evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    return { left: bounds.left, right: bounds.right, viewportWidth, contentWidth: panel.scrollWidth, panelWidth: panel.clientWidth };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.contentWidth).toBeLessThanOrEqual(geometry.panelWidth);

  const dismiss = offer.getByRole('button', { name: 'Dismiss Wealthsimple referral' });
  await dismiss.focus();
  await expect(dismiss).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(offer).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), dismissalKey)).toBe('1');

  await page.reload();
  await expect(offer).toBeHidden();
  const secondTab = await context.newPage();
  try {
    await secondTab.goto('/');
    await expect(secondTab.locator('#wealthsimple-referral')).toBeHidden();
  } finally {
    await secondTab.close();
  }
});

test('desktop referral also dismisses with the close button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const offer = page.locator('#wealthsimple-referral');
  await offer.getByRole('button', { name: 'Dismiss Wealthsimple referral' }).click();
  await expect(offer).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('referral uses the existing sponsored link and only follows it on activation', async ({ page, context }) => {
  let intercepted = 0;
  await context.route(referralUrl, (route) => {
    intercepted += 1;
    return route.fulfill({ contentType: 'text/plain', body: 'Intercepted Wealthsimple referral.' });
  });
  await page.goto('/');

  const link = page.locator('#wealthsimple-referral').getByRole('link', { name: 'Visit Wealthsimple' });
  await expect(link).toHaveAttribute('href', referralUrl);
  await expect(link).toHaveAttribute('rel', /\bsponsored\b/);
  expect(intercepted).toBe(0);
  await link.press('Enter');
  await expect.poll(() => intercepted).toBe(1);
});

test('the US homepage and guide pages have no entry referral', async ({ page }) => {
  for (const path of ['/us/', '/guides/tfsa-explained']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#wealthsimple-referral')).toHaveCount(0);
  }
});
