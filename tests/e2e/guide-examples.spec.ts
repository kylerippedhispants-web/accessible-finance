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
      const imageWidth = width <= 600 ? 320 : 640;
      const imageName = `${slug}${width <= 600 ? '-mobile' : ''}.svg`;
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(imageWidth);
      await expect.poll(() => image.evaluate((element) => new URL((element as HTMLImageElement).currentSrc).pathname)).toBe(`/assets/guide-visuals/${imageName}`);
      const reservedSize = width <= 600 ? example.locator('picture source') : image;
      await expect(reservedSize).toHaveAttribute('width', String(imageWidth));
      await expect(reservedSize).toHaveAttribute('height', String(await image.evaluate((element) => (element as HTMLImageElement).naturalHeight)));
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

for (const width of [320, 768, 1440]) {
  test(`guide paragraphs, lists, and headings use the shared reading scale at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto('/guides/rebalancing');
    const bodySize = width <= 600 ? 17 : 18;
    for (const selector of ['.article-body section > p', '.article-body section > ul:not(.source-list) > li']) {
      const copy = page.locator(selector).first();
      await expect(copy).toBeVisible();
      await expect(copy).toHaveCSS('font-family', /Literata/);
      await expect(copy).toHaveCSS('font-size', `${bodySize}px`);
      expect(await copy.evaluate((element) => {
        const styles = getComputedStyle(element);
        return Number.parseFloat(styles.lineHeight) / Number.parseFloat(styles.fontSize);
      })).toBeCloseTo(1.75, 2);
    }
    const heading = page.locator('.article-body h2').first();
    await expect(heading).toHaveCSS('font-family', /Instrument Serif/);
    await expect(heading).toHaveCSS('font-size', `${width <= 600 ? 32 : width <= 768 ? 36 : 40}px`);
    expect(await heading.evaluate((element) => {
      const styles = getComputedStyle(element);
      return Number.parseFloat(styles.lineHeight) / Number.parseFloat(styles.fontSize);
    })).toBeCloseTo(1.15, 2);
  });
}

test('guide reading text follows a 200% text-size preference and reflows on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 950 });
  await page.goto('/guides/compound-interest');
  // Changing the root size models a browser text-size preference, not page zoom.
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await expect(page.locator('h1')).toHaveCSS('font-size', '80px');
  const paragraph = page.locator('.article-body section > p').first();
  await expect(paragraph).toHaveCSS('font-size', '34px');
  await paragraph.scrollIntoViewIfNeeded();
  await expect(paragraph).toBeVisible();
  expect(await paragraph.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth && element.scrollWidth <= element.clientWidth;
  })).toBe(true);
  // Diagrams have a text equivalent that can grow with the reader's preference.
  const values = page.locator('.visual-values');
  await values.locator('summary').click();
  await expect(values).toHaveAttribute('open', '');
  await expect(values.locator('dd').nth(1)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [320, 390, 600, 1440]) {
  test(`guide diagrams preserve readable role sizes without enlargement at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 950 });
    // Cover the bar, flow, and comparison layouts at both source breakpoints.
    for (const slug of ['compound-interest', 'tfsa-explained', 'rebalancing']) {
      await page.goto(`/guides/${slug}`);
      const image = page.locator('.guide-visual img');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(width <= 600 ? 320 : 640);
      const dimensions = await image.evaluate((element) => {
        const illustration = element as HTMLImageElement;
        return { source: illustration.currentSrc, width: illustration.getBoundingClientRect().width, intrinsicWidth: illustration.naturalWidth };
      });
      const response = await request.get(dimensions.source);
      expect(response.ok(), slug).toBe(true);
      const roles = await page.evaluate((source) => {
        const svg = new DOMParser().parseFromString(source, 'image/svg+xml');
        return Array.from(svg.querySelectorAll('text[data-text-role]')).map((text) => ({
          role: text.getAttribute('data-text-role'),
          size: Number(text.getAttribute('font-size')),
        }));
      }, await response.text());
      const scale = dimensions.width / dimensions.intrinsicWidth;
      expect(scale, slug).toBeLessThanOrEqual(1.001);
      expect(roles.length, slug).toBeGreaterThan(0);
      for (const { role, size } of roles) {
        expect(size, `${slug} ${role}`).toBe(role === 'value' ? 32 : role === 'label' ? 18 : 16);
        // At 320px, page gutters can reduce the intrinsic image by about 15%.
        expect(size * scale, `${slug} ${role} effective size`).toBeGreaterThanOrEqual(role === 'value' ? 26 : role === 'label' ? 14.5 : 13);
      }
    }
  });
}

test('the main reading path uses one example and keeps supporting examples optional', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 950 });
  await page.goto('/guides/tfsa-explained');
  await expect(page.locator('h2#worked-example')).toContainText('Track room separately from the account balance');
  await expect(page.locator('.worked-example > h3, .example-kicker')).toHaveCount(0);
  expect(await page.locator('#worked-example').evaluate((heading) => {
    return heading.closest('section')?.nextElementSibling?.querySelector('h2')?.id;
  })).toBe('build-your-plan');

  const supportingExample = page.locator('details#practical-example');
  await expect(supportingExample).not.toHaveAttribute('open', '');
  const summary = supportingExample.locator(':scope > summary');
  await expect(summary).toContainText('Another example:');
  await summary.focus();
  await summary.press('Enter');
  await expect(supportingExample).toHaveAttribute('open', '');
  await expect(supportingExample.locator('.case-study')).toBeVisible();
  await summary.press('Space');
  await expect(supportingExample).not.toHaveAttribute('open', '');
});

test('existing example fragments reveal the supporting example on arrival and hash changes', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 950 });
  await page.goto('/guides/tfsa-explained#practical-example');
  const supportingExample = page.locator('details#practical-example');
  const summary = supportingExample.locator(':scope > summary');
  await expect(supportingExample).toHaveAttribute('open', '');
  await expect(summary).toBeInViewport();

  await summary.click();
  await expect(supportingExample).not.toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'See a worked example', exact: true }).click();
  await page.evaluate(() => { location.hash = 'practical-example'; });
  await expect(supportingExample).toHaveAttribute('open', '');
  await expect(summary).toBeInViewport();
});

test('guide contents follows direct links, fast jumps, and the section being read', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/guides/tfsa-explained#worked-example');
  const activeLink = page.locator('.toc-list a.active');
  const expectActiveSection = async (id: string) => {
    await expect(activeLink).toHaveCount(1);
    await expect(activeLink).toHaveAttribute('href', `#${id}`);
    await expect(activeLink).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('.toc-list a[aria-current]')).toHaveCount(1);
  };
  await expectActiveSection('worked-example');

  // Instant navigation can skip every heading between the old and new sections.
  await page.locator('.toc-list a[href="#sources"]').click();
  await expectActiveSection('sources');
  await page.locator('.toc-list a[href="#why-it-matters"]').click();
  await expectActiveSection('why-it-matters');

  // Reading farther into a long section should retain that section even after
  // its heading has left the viewport, and should work when scrolling upward.
  await page.locator('.example-steps').evaluate((element) => {
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 140, behavior: 'instant' });
  });
  await expectActiveSection('worked-example');
  await page.locator('#how-it-works').evaluate((element) => {
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 96, behavior: 'instant' });
  });
  await expectActiveSection('how-it-works');
});

test('all guide update dates agree with their article metadata', async ({ request }) => {
  test.setTimeout(90_000);
  const guideFiles = readdirSync(resolve('guides')).filter((file) => file.endsWith('.html'));
  expect(guideFiles).toHaveLength(42);
  for (const file of guideFiles) {
    const response = await request.get(`/guides/${file.replace(/\.html$/, '')}`);
    expect(response.status(), file).toBe(200);
    const html = await response.text();
    const meta = html.match(/<div class="article-meta">([\s\S]*?)<\/div>/)?.[1] || '';
    const time = meta.match(/<time\b[^>]*datetime="([^"]+)"[^>]*>([^<]+)<\/time>/);
    expect(meta, file).toContain('Updated');
    expect(meta, file).not.toContain('Reviewed July 2026');
    expect(time?.[1], file).toBe('2026-10-25');
    expect(time?.[2], file).toBe('October 25, 2026');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));
    const article = schemas.flatMap((schema) => schema['@graph'] || [schema])
      .find((schema) => schema['@type'] === 'Article');
    expect(article?.dateModified, file).toBe(time?.[1]);
  }
});

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
    const supportingExample = page.locator('details#practical-example');
    await supportingExample.locator(':scope > summary').focus();
    await supportingExample.locator(':scope > summary').press('Enter');
    await expect(supportingExample).toHaveAttribute('open', '');
    await expect(supportingExample.locator('.case-study')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('guide images render the site fonts instead of silently falling back', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto('/guides/tfsa-explained');
  const image = page.locator('.guide-visual img');
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) => new URL((element as HTMLImageElement).currentSrc).pathname)).toBe('/assets/guide-visuals/tfsa-explained.svg');
  const response = await request.get('/assets/guide-visuals/tfsa-explained.svg');
  expect(response.status()).toBe(200);
  const svg = await response.text();

  const result = await image.evaluate(async (element, source) => {
    await document.fonts.ready;
    const actualImage = element as HTMLImageElement;
    await actualImage.decode();
    // eslint-disable-next-line unicorn/consistent-function-scoping -- This callback is serialized into the browser.
    const normalizeFamily = (family: string) => family.trim().replace(/^['"]|['"]$/g, '');
    const pageStyles = getComputedStyle(document.documentElement);
    const siteFamilies = ['--sans', '--serif'].map((property) => normalizeFamily(pageStyles.getPropertyValue(property).split(',')[0])).sort();
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const fontStyles = Array.from(parsed.querySelectorAll('style'));
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(fontStyles.map((style) => style.textContent).join('\n'));
    const embeddedFamilies = Array.from(stylesheet.cssRules)
      .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
      .map((rule) => normalizeFamily((rule as CSSFontFaceRule).style.getPropertyValue('font-family')))
      .sort();

    // The fallback image has identical shapes, text and positions, but no
    // embedded font faces. Comparing actual <img> pixels catches the isolated
    // SVG-image context, where a font-family name alone cannot load page fonts.
    fontStyles.forEach((style) => style.remove());
    const fallbackUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(parsed)], { type: 'image/svg+xml' }));
    try {
      const fallbackImage = new Image();
      fallbackImage.src = fallbackUrl;
      await fallbackImage.decode();
      const canvas = document.createElement('canvas');
      canvas.width = actualImage.naturalWidth;
      canvas.height = actualImage.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D context is unavailable');
      context.drawImage(actualImage, 0, 0);
      const actualPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(fallbackImage, 0, 0);
      const fallbackPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let changedPixels = 0;
      for (let index = 0; index < actualPixels.length; index += 4) {
        const difference = Math.abs(actualPixels[index] - fallbackPixels[index])
          + Math.abs(actualPixels[index + 1] - fallbackPixels[index + 1])
          + Math.abs(actualPixels[index + 2] - fallbackPixels[index + 2]);
        if (difference > 32) changedPixels += 1;
      }
      return { siteFamilies, embeddedFamilies, changedPixels };
    } finally {
      URL.revokeObjectURL(fallbackUrl);
    }
  }, svg);
  expect(result.siteFamilies).toEqual(['Instrument Serif', 'Inter']);
  expect(result.embeddedFamilies).toEqual(result.siteFamilies);
  expect(result.changedPixels).toBeGreaterThan(500);
});

test('every guide image loads its real fonts and its labels fit without overlaps', async ({ page }) => {
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
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      // eslint-disable-next-line unicorn/consistent-function-scoping -- This callback is serialized into the browser.
      const normalizeFamily = (family: string) => family.trim().replace(/^['"]|['"]$/g, '');
      return {
        loadedFamilies: Array.from(document.fonts).filter((font) => font.status === 'loaded').map((font) => normalizeFamily(font.family)).sort(),
        inter: document.fonts.check('500 18px Inter'),
        instrumentSerif: document.fonts.check('400 32px "Instrument Serif"'),
        usedFamilies: [...new Set(Array.from(document.querySelectorAll('svg text')).map((text) => normalizeFamily(getComputedStyle(text).fontFamily.split(',')[0])))].sort(),
      };
    });
    expect(fonts, file).toEqual({ loadedFamilies: ['Instrument Serif', 'Inter'], inter: true, instrumentSerif: true, usedFamilies: ['Instrument Serif', 'Inter'] });
    const textRoles = await page.locator('svg text').evaluateAll((texts) => texts.map((text) => ({
      role: text.getAttribute('data-text-role'),
      size: Number.parseFloat(getComputedStyle(text).fontSize),
      family: getComputedStyle(text).fontFamily.split(',')[0].replaceAll(/["']/g, '').trim(),
    })));
    expect(textRoles.length, file).toBeGreaterThan(0);
    for (const { role, size, family } of textRoles) {
      expect(['label', 'detail', 'value'], file).toContain(role);
      expect(size, `${file} ${role}`).toBe(role === 'value' ? 32 : role === 'label' ? 18 : 16);
      expect(family, `${file} ${role}`).toBe(role === 'value' ? 'Instrument Serif' : 'Inter');
    }
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
