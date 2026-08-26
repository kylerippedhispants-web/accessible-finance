import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function openDemo(page: import('@playwright/test').Page) {
  await page.goto('/planner/');
  await page.getByRole('button', { name: 'Try the fictional demo' }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Alex/ })).toBeVisible();
}

test('legacy homepage still works and exposes the planner', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Accessible Finance/);
  await expect(page.getByRole('link', { name: 'Open Accessible Finance Planner' })).toHaveAttribute('href', '/planner/');
});

test('planner deep links return the app shell instead of a 404', async ({ page }) => {
  const response = await page.goto('/planner/dashboard');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/planner\/?$/);
  await expect(page.getByRole('heading', { name: /See where your money is going/ })).toBeVisible();
});

test('password update form requires a verified recovery event', async ({ page }) => {
  const response = await page.goto('/planner/reset-password');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Open your reset link first.' })).toBeVisible();
  await expect(page.getByLabel('New password')).toHaveCount(0);
});

test('demo mode supports navigation, CRUD, explicit save, and session restore', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Income' }).click();
  await page.getByRole('button', { name: 'Add income' }).click();
  await page.getByLabel('Income name').fill('Side work');
  await page.getByLabel('Amount').fill('not a number');
  await page.getByLabel('Amount').blur();
  await expect(page.getByLabel('Amount')).toHaveValue('not a number');
  await expect(page.getByText('Enter a valid number.')).toBeVisible();
  await page.getByRole('spinbutton', { name: /^Amount/ }).fill('500');
  await page.getByLabel('Amount').blur();
  await expect(page.getByLabel('Amount')).toHaveValue('$500');
  await page.getByLabel('Frequency').selectOption('monthly');
  await page.getByRole('button', { name: 'Add to plan' }).click();
  await expect(page.getByRole('heading', { name: 'Side work' })).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved for this browser session. Nothing was uploaded.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Side work' })).toBeVisible();
});

test('what-if controls update locally and can become a sparse scenario', async ({ page }) => {
  await openDemo(page);
  const comparisonPath = page.locator('.chart-path.comparison').first();
  const before = await comparisonPath.getAttribute('d');
  await page.locator('label:has-text("Investment return") input[type="range"]').fill('2');
  await expect(comparisonPath).not.toHaveAttribute('d', before ?? '');
  await page.getByLabel('Scenario name').fill('Cautious returns');
  await page.getByRole('button', { name: 'Add scenario' }).click();
  await page.getByRole('link', { name: 'Scenarios' }).click();
  await expect(page.getByText('Cautious returns', { exact: true }).first()).toBeVisible();
});

test('scenario presets remain previews until explicitly saved', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Scenarios' }).click();

  const scenarioList = page.getByRole('complementary', { name: 'Your scenarios' });
  await expect(scenarioList.getByText('Lower returns', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Retire at 55/i }).click();

  await expect(page.getByText('Unsaved preview', { exact: true })).toBeVisible();
  await expect(scenarioList.getByText('Retire at 55', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await expect(scenarioList.getByText('Retire at 55', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Return to baseline' }).click();
  await expect(page.getByRole('heading', { name: 'Baseline plan', exact: true })).toBeVisible();
});

test('planning guide explains the model and links to trusted Canadian resources', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Planning guide' }).first().click();

  await expect(page).toHaveURL(/\/planner\/guide$/);
  await expect(page.getByRole('heading', { name: 'Build a plan you can explain.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Open the menu to add your inputs' })).toBeVisible();
  await expect(page.getByText('How saving and sync work.')).toBeVisible();
  await expect(page.getByRole('heading', { name: "Today's dollars and future dollars" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Continue with trusted Canadian resources' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Making a budget/ })).toHaveAttribute('href', /canada\.ca/);

  const guideAxe = await new AxeBuilder({ page }).analyze();
  expect(guideAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('landing and dashboard have no serious axe violations', async ({ page }) => {
  await page.goto('/planner/');
  const landing = await new AxeBuilder({ page }).analyze();
  expect(landing.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Try the fictional demo' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const dashboard = await new AxeBuilder({ page }).analyze();
  expect(dashboard.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

for (const width of [1440, 820, 390, 320]) {
  test(`planner avoids page-level horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/planner/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Try the fictional demo' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test('mobile navigation, forms, retirement, and scenarios remain accessible without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openDemo(page);

  const sidebar = page.locator('#planner-sidebar');
  const firstSidebarLink = sidebar.getByRole('link', { name: 'Dashboard', includeHidden: true });
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  expect(await firstSidebarLink.evaluate((link) => {
    link.focus();
    return document.activeElement === link;
  })).toBe(false);

  const menuButton = page.getByRole('button', { name: 'Open planner menu' });
  await expect(menuButton).toContainText('Menu');
  await expect(page.getByRole('heading', { name: 'How to add and save your inputs' })).toBeVisible();
  await menuButton.click();
  await expect(sidebar).not.toHaveAttribute('aria-hidden', 'true');
  await expect(firstSidebarLink).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menuButton).toBeFocused();
  await expect(sidebar).toHaveAttribute('aria-hidden', 'true');

  const assertNoPageOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  };
  const navigate = async (name: string) => {
    await menuButton.click();
    await sidebar.getByRole('link', { name }).click();
    await assertNoPageOverflow();
  };

  for (const [routeName, addButton] of [
    ['Income', 'Add income'],
    ['Expenses', 'Add expense'],
    ['Assets', 'Add asset'],
    ['Debts', 'Add debt'],
  ] as const) {
    await navigate(routeName);
    await page.getByRole('button', { name: addButton }).click();
    await assertNoPageOverflow();
  }

  await navigate('Retirement');
  await assertNoPageOverflow();
  await navigate('Scenarios');
  await assertNoPageOverflow();
  await navigate('Planning guide');
  await assertNoPageOverflow();

  const mobileAxe = await new AxeBuilder({ page }).analyze();
  expect(mobileAxe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
