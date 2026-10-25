import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
});

for (const width of [320, 768, 1440]) {
  for (const slug of ['compound-interest', 'tfsa-explained', 'investing-vs-speculating', 'budgeting-without-rigidity']) {
    test(`${slug} has a readable worked example at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`/guides/${slug}`);
      await page.getByRole('link', { name: 'See a worked example', exact: true }).click();
      await expect(page.locator('#worked-example')).toBeInViewport();
      const example = page.locator('.worked-example');
      await expect(example.locator('.example-steps > li')).toHaveCount(3);
      const image = example.getByRole('img');
      await image.scrollIntoViewIfNeeded();
      const imageWidth = width <= 600 ? 360 : 640;
      const imageName = `${slug}${width <= 600 ? '-mobile' : ''}.svg`;
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(imageWidth);
      await expect.poll(() => image.evaluate((element) => new URL((element as HTMLImageElement).currentSrc).pathname)).toBe(`/assets/guide-visuals/${imageName}`);
      expect(await image.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth;
      })).toBe(true);
      expect(await example.locator('.guide-visual').evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && element.scrollWidth <= element.clientWidth;
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
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/guides/compound-interest`);
    for (const selector of ['.article-head', '.toc', '.related-head']) {
      await expect(page.locator(selector)).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('.example-steps > li')).toHaveCount(3);
    await expect(page.locator('.example-result')).toBeVisible();
    await expect(page.locator('.guide-visual figcaption')).not.toBeEmpty();
    const image = page.locator('.guide-visual img');
    await expect(image).toHaveAttribute('alt', /.+/);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => {
      const imageElement = element as HTMLImageElement;
      return imageElement.complete && imageElement.naturalWidth === 0;
    })).toBe(true);
    await page.locator('.visual-values summary').click();
    await expect(page.locator('.visual-values')).toHaveAttribute('open', '');
    await expect(page.locator('.visual-values dd')).toContainText(['$1,050', '$1,102.50', '$1,157.63']);
    await expect(page.locator('.visual-values dd').nth(1)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

test('every guide image loads and its labels fit without overlaps', async ({ page }) => {
  test.setTimeout(180_000);
  const files = readdirSync(resolve('assets/guide-visuals')).filter((file) => file.endsWith('.svg'));
  expect(files).toHaveLength(84);
  expect(files.filter((file) => file.endsWith('-mobile.svg'))).toHaveLength(42);
  for (const file of files.filter((name) => !name.endsWith('-mobile.svg'))) {
    expect(files, file).toContain(file.replace('.svg', '-mobile.svg'));
  }
  for (const file of files) {
    const response = await page.goto(`/assets/guide-visuals/${file}`);
    expect(response?.status(), file).toBe(200);
    const geometry = await page.locator('svg').evaluate((svg) => {
      const box = svg.getBoundingClientRect();
      const lines = Array.from(svg.querySelectorAll('text, tspan'))
        .filter((text) => !text.querySelector('tspan') && text.textContent?.trim())
        .map((element) => ({ element, label: element.textContent, bounds: element.getBoundingClientRect() }));
      const clipped = lines.filter(({ bounds }) => {
        return bounds.left < box.left || bounds.top < box.top || bounds.right > box.right || bounds.bottom > box.bottom;
      }).map(({ label }) => label);
      const overlaps: Array<{ first: string | null; second: string | null }> = [];
      for (let index = 0; index < lines.length; index += 1) {
        const first = lines[index];
        for (const second of lines.slice(index + 1)) {
          const horizontal = Math.min(first.bounds.right, second.bounds.right) - Math.max(first.bounds.left, second.bounds.left);
          const vertical = Math.min(first.bounds.bottom, second.bounds.bottom) - Math.max(first.bounds.top, second.bounds.top);
          if (horizontal > 1 && vertical > 1) overlaps.push({ first: first.label, second: second.label });
        }
      }
      const outsideCards = svg.getAttribute('data-layout') === 'compare'
        ? lines.filter(({ element, bounds }) => {
          const card = element.closest('[data-row]')?.querySelector(':scope > rect');
          if (!card) return true;
          const cardBounds = card.getBoundingClientRect();
          return bounds.left < cardBounds.left - 1 || bounds.top < cardBounds.top - 1 || bounds.right > cardBounds.right + 1 || bounds.bottom > cardBounds.bottom + 1;
        }).map(({ label }) => label)
        : [];
      return { clipped, overlaps, outsideCards };
    });
    expect(geometry, file).toEqual({ clipped: [], overlaps: [], outsideCards: [] });
  }
});
