import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function openDemo(page: import('@playwright/test').Page) {
  await page.goto('/planner/');
  await page.getByRole('button', { name: 'Try the fictional demo' }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Alex/ })).toBeVisible();
}

test('dashboard comparison starts aligned and its chart is keyboard and pointer operable', async ({ page }) => {
  await openDemo(page);

  const fireRegion = page.getByRole('region', { name: 'Your FIRE outlook' });
  await expect(fireRegion.getByText('Estimated FIRE year')).toBeVisible();
  await expect(fireRegion.getByText('Modeled FIRE amount · today’s dollars')).toBeVisible();
  await expect(fireRegion).not.toContainText(/NaN|Infinity/);
  const fireProgress = fireRegion.getByRole('progressbar', { name: 'Current assets as a share of projected opening FIRE amount' });
  await expect(fireProgress).toHaveAttribute('max', '100');
  await expect(fireProgress).toHaveAttribute('aria-valuetext', /modeled-withdrawable assets/i);

  const baselinePath = page.locator('.chart-path.baseline').first();
  const comparisonPath = page.locator('.chart-path.comparison').first();
  expect(await comparisonPath.getAttribute('d')).toBe(await baselinePath.getAttribute('d'));

  const chart = page.getByRole('region', { name: 'Interactive net worth projection chart' }).first();
  const yearControl = page.getByRole('slider', { name: /Inspect projection year/ }).first();
  const maximum = await yearControl.getAttribute('max');
  await chart.focus();
  await page.keyboard.press('End');
  await expect(yearControl).toHaveValue(maximum ?? '0');
  await page.keyboard.press('Home');
  await expect(yearControl).toHaveValue('0');
  await page.keyboard.press('ArrowRight');
  await expect(yearControl).toHaveValue('1');

  const svg = chart.locator('svg');
  const box = await svg.boundingBox();
  if (!box) throw new Error('Projection SVG was not rendered.');
  await svg.click({ position: { x: box.width * 0.9, y: box.height * 0.5 } });
  expect(Number(await yearControl.inputValue())).toBeGreaterThan(1);

  await page.getByText('View projection as a data table').first().click();
  await expect(page.getByRole('columnheader', { name: 'Live what-if net worth' }).first()).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Difference' }).first()).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
});

test('mobile drawer traps focus, locks scroll, and leaves the dashboard contained', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);

  const mobileFire = page.getByRole('region', { name: 'Your FIRE outlook' });
  await expect(mobileFire).toBeVisible();
  for (const selector of ['.fire-overview', '.fire-driver-grid', '.fire-timeline', '.chart-canvas']) {
    expect(await page.locator(selector).first().evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  const mobileAxe = await new AxeBuilder({ page }).analyze();
  expect(mobileAxe.violations).toEqual([]);

  const menuButton = page.getByRole('button', { name: 'Open planner menu' });
  const sidebar = page.locator('#planner-sidebar');
  const appContent = page.locator('.app-content');
  const firstLink = sidebar.getByRole('link', { name: 'Dashboard' });
  const lastLink = sidebar.getByRole('link', { name: 'Main Accessible Finance site' });
  const closeButton = sidebar.getByRole('button', { name: 'Close planner menu' });

  await menuButton.click();
  await expect(firstLink).toBeFocused();
  await expect(appContent).toHaveAttribute('inert', '');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  await lastLink.focus();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(lastLink).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menuButton).toBeFocused();
  await expect(appContent).not.toHaveAttribute('inert');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.locator('.chart-canvas').first().evaluate((chart) => chart.scrollWidth <= chart.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.locator('.fire-overview').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.locator('.chart-canvas').first().evaluate((chart) => chart.scrollWidth <= chart.clientWidth)).toBe(true);
  await expect(page.locator('.chart-inspector-card').first()).toBeVisible();
});
