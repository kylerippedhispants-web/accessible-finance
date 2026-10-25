import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
});

for (const width of [320, 768, 1440]) {
  for (const slug of ['compound-interest', 'tfsa-explained', 'budgeting-without-rigidity']) {
    test(`${slug} has a readable worked example at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`/guides/${slug}`);
      await page.getByRole('link', { name: 'See a worked example', exact: true }).click();
      await expect(page.locator('#worked-example')).toBeInViewport();
      const example = page.locator('.worked-example');
      await expect(example.locator('.example-steps > li')).toHaveCount(3);
      const image = example.getByRole('img');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(640);
      expect(await image.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth;
      })).toBe(true);
      await expect(example.locator('.example-assumptions')).toContainText('Example assumptions:');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const audit = await new AxeBuilder({ page }).include('.worked-example').analyze();
      expect(audit.violations).toEqual([]);
    });
  }
}

test('the worked example remains usable with JavaScript disabled and images unavailable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => {
    if (route.request().resourceType() === 'image' || new URL(route.request().url()).origin !== origin) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/guides/compound-interest`);
  for (const selector of ['.article-head', '.toc', '.related-head']) {
    await expect(page.locator(selector)).toHaveCSS('opacity', '1');
  }
  await expect(page.locator('.example-steps > li')).toHaveCount(3);
  await expect(page.locator('.example-result')).toBeVisible();
  await expect(page.locator('.guide-visual figcaption')).not.toBeEmpty();
  await expect(page.locator('.guide-visual img')).toHaveAttribute('alt', /.+/);
  await context.close();
});

test('every guide image loads and its labels fit within the drawing', async ({ page }) => {
  test.setTimeout(120_000);
  const files = readdirSync(resolve('assets/guide-visuals')).filter((file) => file.endsWith('.svg'));
  expect(files).toHaveLength(42);
  for (const file of files) {
    const response = await page.goto(`/assets/guide-visuals/${file}`);
    expect(response?.status(), file).toBe(200);
    const clipped = await page.locator('svg').evaluate((svg) => {
      const box = (svg as SVGSVGElement).viewBox.baseVal;
      return Array.from(svg.querySelectorAll('text')).filter((text) => {
        const bounds = text.getBBox();
        return bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > box.width || bounds.y + bounds.height > box.height;
      }).map((text) => text.textContent);
    });
    expect(clipped, file).toEqual([]);
  }
});
