import { expect, test, type Page } from '@playwright/test';

async function openDemo(page: Page, preset = 'alex') {
  await page.goto('/planner/');
  await page.getByLabel('Choose a fictional example').selectOption(preset);
  await page.getByRole('button', { name: 'Try the fictional demo' }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);
}

async function navigate(page: Page, section: string) {
  // The route URL can update before the shell mounts. Wait before deciding
  // whether its responsive menu needs opening; isVisible() does not retry.
  await expect(page.locator('#planner-menu-button')).toBeAttached();
  const menu = page.getByRole('button', { name: 'Open planner menu' });
  if (await menu.isVisible()) await menu.click();
  await page.locator('#planner-sidebar').getByRole('link', { name: section, exact: true }).click();
}

for (const collection of [
  { section: 'Income', add: 'Add income', name: 'Income name', amount: 'Amount' },
  { section: 'Expenses', add: 'Add expense', name: 'Expense name', amount: 'Amount' },
  { section: 'Assets', add: 'Add asset', name: 'Asset name', amount: 'Current balance or value' },
  { section: 'Debts', add: 'Add debt', name: 'Debt name', amount: 'Current balance' },
]) {
  test(`${collection.section} refuses a stale amount after malformed replacement`, async ({ page }) => {
    await openDemo(page);
    await navigate(page, collection.section);
    await page.getByRole('button', { name: collection.add, exact: true }).click();
    await page.getByLabel(collection.name).fill('Fictional validation example');
    const input = page.getByLabel(collection.amount, { exact: false });
    await input.fill('1234');
    await input.fill('abc');
    await input.blur();
    await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
    await expect(input).toHaveValue('abc');
    await expect(input).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Fictional validation example', exact: true })).toHaveCount(0);
    await expect(page.getByText('Enter a valid number.', { exact: true })).toBeVisible();
    await input.fill('100');
    if (collection.section === 'Debts') {
      await page.getByLabel('Annual interest rate').fill('0');
      await page.getByLabel('Regular payment').fill('10');
    }
    await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fictional validation example', exact: true })).toBeVisible();
  });
}

test('an invalid optional end year cannot silently become blank or reuse its prior year', async ({ page }) => {
  await openDemo(page);
  await navigate(page, 'Income');
  await page.getByRole('button', { name: 'Add income', exact: true }).click();
  await page.getByLabel('Income name').fill('Fictional fixed contract');
  await page.getByLabel('Amount').fill('100');
  await page.getByLabel('End year').fill('2030');
  await page.getByLabel('End year').fill('bad');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional fixed contract', exact: true })).toHaveCount(0);
  await page.getByLabel('End year').fill('');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fictional fixed contract', exact: true })).toBeVisible();
});

test('retirement hides stale results and blocks saving until an invalid assumption is corrected', async ({ page }) => {
  await openDemo(page);
  await navigate(page, 'Retirement');
  const input = page.getByLabel('Investment return before retirement');
  await input.fill('6');
  await input.fill('bad');
  await input.blur();
  await expect(page.getByText('Correct the highlighted number to update the estimate.', { exact: false })).toBeVisible();
  await expect(page.locator('.retirement-fire-preview')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('.save-announcement')).toContainText('Correct the highlighted number before saving');
  await input.fill('5');
  await input.blur();
  await expect(page.locator('.retirement-fire-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeDisabled();
});

test('invalid benefit age edits do not replace the accepted start age with a default', async ({ page }) => {
  await openDemo(page);
  await navigate(page, 'Retirement');
  const cpp = page.getByRole('group', { name: 'CPP', exact: true });
  const startAge = cpp.getByLabel('Start age (required)', { exact: true });
  await startAge.fill('70');
  await startAge.blur();
  await startAge.fill('bad');
  await startAge.blur();
  await expect(startAge).toHaveValue('bad');
  await expect(cpp.getByText('Enter a valid number.', { exact: true })).toBeVisible();
  await navigate(page, 'Income');
  await navigate(page, 'Retirement');
  await expect(startAge).toHaveValue('70');
});

test('scenario keyboard focus and maximum-length names remain usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openDemo(page);
  await navigate(page, 'Scenarios');
  const create = page.getByRole('button', { name: 'Create custom scenario', exact: true });
  await create.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#custom-title')).toBeFocused();
  const name = 'Scenario' + 'X'.repeat(92);
  await page.getByLabel('Scenario name', { exact: false }).fill(name);
  await page.getByLabel('Retirement age', { exact: false }).fill('61');
  await page.getByRole('button', { name: 'Preview changes', exact: true }).click();
  await expect(page.locator('#comparison-title')).toBeFocused();
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  const select = page.locator('.scenario-select').filter({ hasText: name });
  await expect(select).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('.chart-inspector-card dt').filter({ hasText: name })).toBeVisible();
  await page.getByRole('region', { name: 'Interactive net worth projection chart', exact: true }).focus();
  await page.keyboard.press('End');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByText('View projection as a data table', { exact: true }).click();
  await expect(page.locator('.comparison-column-label')).toContainText(name);
  expect(await page.locator('.comparison-column-label').evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(192);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const row = select.locator('..');
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('#custom-title')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.locator('.scenario-editor').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Edit', exact: true })).toBeFocused();
  await row.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(page.locator('#scenario-rename-input')).toBeFocused();
  await page.locator('.scenario-inline-rename').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Rename', exact: true })).toBeFocused();
});

test('a long dashboard scenario name stays inside the save confirmation at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openDemo(page);
  await page.getByLabel('Scenario name', { exact: true }).fill('X'.repeat(100));
  await page.getByRole('button', { name: 'Add scenario', exact: true }).click();
  await expect(page.locator('.scenario-save-card .form-status')).toContainText('X'.repeat(100));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

for (const [preset, name] of [
  ['starting-out', 'Jordan'], ['variable-income', 'Sam'], ['approaching-retirement', 'Morgan'],
]) {
  test(`${preset} opens a clearly fictional plan without an account`, async ({ page }) => {
    await openDemo(page, preset);
    await expect(page.getByRole('heading', { name: new RegExp(`Good (morning|afternoon|evening), ${name}`) })).toBeVisible();
    await expect(page.locator('.demo-banner')).toContainText('Fictional example');
    await navigate(page, 'Income');
    await expect(page.locator('.entity-card').first()).toBeVisible();
    await page.reload();
    await expect(page.locator('.entity-card').first()).toBeVisible();
  });
}
