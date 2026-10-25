import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    return route.abort();
  });
});

for (const path of ['/', '/articles', '/guides/compound-interest', '/us/', '/cash-flow?edition=us']) {
  test(`navigation feedback uses the same timing on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const action = page.locator('.nav-cta').first();
    await expect(action).toBeVisible();
    await expect.poll(() => action.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.transitionDuration, style.transitionTimingFunction, style.transitionDelay];
    })).toEqual(['0.16s', 'cubic-bezier(0.2, 0, 0, 1)', '0s']);
  });
}

test('cards and images stay still while hover feedback remains available', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const topic = page.locator('.topic').first();
  await topic.hover();
  await expect.poll(() => topic.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  expect(await topic.locator('.topic-photo').evaluate((element) => getComputedStyle(element).transform)).toBe('none');

  const sideArticle = page.locator('.side-article').first();
  const originalPadding = await sideArticle.evaluate((element) => getComputedStyle(element).paddingLeft);
  await sideArticle.hover();
  expect(await sideArticle.evaluate((element) => getComputedStyle(element).paddingLeft)).toBe(originalPadding);
  expect(await sideArticle.locator('h4').evaluate((element) => getComputedStyle(element).fontStyle)).toBe('normal');
  expect(await page.locator('.hero-chart .bar').evaluateAll((bars) =>
    bars.every((bar) => getComputedStyle(bar).animationName === 'none'),
  )).toBe(true);
});

test('phone content is immediately visible with no staggered reveal motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/articles');
  await expect.poll(() => page.locator('.reveal').evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return style.opacity === '1' && style.transform === 'none' && style.transitionDuration === '0s';
  }))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('changing reduced motion reveals content and disables entrance effects immediately', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('.reveal').evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return element.classList.contains('visible') && style.opacity === '1' && style.transform === 'none';
  }))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.locator('.nav-links .nav-group > summary').first().click();
  const disclosure = page.locator('.nav-links .nav-group[open] > .nav-group-links');
  await expect(disclosure).toBeVisible();
  expect(await disclosure.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
  expect(await page.locator('.nav-cta').first().evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s');
});

test('focusing a reveal link never leaves its content transparent', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const link = page.locator('.canada-card').last();
  await link.focus();
  await expect(link).toBeFocused();
  expect(await link.evaluate((element) => {
    const style = getComputedStyle(element);
    return element.classList.contains('visible') && style.opacity === '1' && style.transitionDuration === '0s';
  })).toBe(true);
});

test('planner controls follow the same timing and respect reduced motion', async ({ page }) => {
  await page.goto('/planner/');
  const action = page.locator('.button').first();
  await expect(action).toBeVisible();
  expect(await action.evaluate((element) => getComputedStyle(element).transitionDuration))
    .toBe('0.16s, 0.16s, 0.16s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await action.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
