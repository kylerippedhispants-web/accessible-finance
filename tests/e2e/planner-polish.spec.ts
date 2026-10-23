import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.goto('/planner/');
  await page.getByRole('button', { name: 'Try the fictional demo' }).click();
  await expect(page).toHaveURL(/\/planner\/dashboard$/);
}

async function navigate(page: Page, section: string) {
  // Route changes can precede the shell commit; isVisible() does not wait.
  await expect(page.locator('#planner-menu-button')).toBeAttached();
  const menu = page.getByRole('button', { name: 'Open planner menu' });
  if (await menu.isVisible()) await menu.click();
  await page.locator('#planner-sidebar').getByRole('link', { name: section, exact: true }).click();
}

async function activateByKeyboard(page: Page, button: Locator) {
  await button.focus();
  await page.keyboard.press('Enter');
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

const collections = [
  { section: 'Income', add: 'Add income', entity: 'income source', nameField: 'Income name', fields: [['Amount', '100']] },
  { section: 'Expenses', add: 'Add expense', entity: 'expense', nameField: 'Expense name', fields: [['Amount', '100']] },
  { section: 'Assets', add: 'Add asset', entity: 'asset', nameField: 'Asset name', fields: [['Current balance or value', '100']] },
  { section: 'Debts', add: 'Add debt', entity: 'debt', nameField: 'Debt name', fields: [['Current balance', '100'], ['Annual interest rate', '0'], ['Regular payment', '10']] },
] as const;

for (const collection of collections) {
  test(`${collection.section} returns keyboard focus after add, edit, cancel, close, and delete`, async ({ page }) => {
    await openDemo(page);
    await navigate(page, collection.section);
    const addButton = page.getByRole('button', { name: collection.add, exact: true });
    const name = `Fictional ${collection.entity}`;
    const updatedName = `${name} updated`;

    await activateByKeyboard(page, addButton);
    await expect(page.locator('#entity-editor-title')).toBeFocused();
    await page.getByLabel(collection.nameField).fill(name);
    for (const [label, value] of collection.fields) await page.getByLabel(label).fill(value);
    await activateByKeyboard(page, page.getByRole('button', { name: 'Add to plan', exact: true }));
    await expect(addButton).toBeFocused();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(page.locator('.collection-status')).toContainText(`${name} added to the open plan.`);
    await expect(page.locator('.collection-status')).toContainText('Choose Save changes to keep this draft.');

    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeDisabled();
    await expect(page.locator('.collection-status')).not.toContainText('Choose Save changes');

    await activateByKeyboard(page, page.getByRole('button', { name: `Edit ${collection.entity} ${name}`, exact: true }));
    await expect(page.locator('#entity-editor-title')).toBeFocused();
    await page.getByLabel(collection.nameField).fill(updatedName);
    await activateByKeyboard(page, page.getByRole('button', { name: 'Update in plan', exact: true }));
    const editButton = page.getByRole('button', { name: `Edit ${collection.entity} ${updatedName}`, exact: true });
    await expect(editButton).toBeFocused();
    await expect(page.locator('.collection-status')).toContainText(`${updatedName} updated in the open plan.`);

    await activateByKeyboard(page, editButton);
    await page.getByLabel(collection.nameField).fill('Unsubmitted fictional edit');
    await activateByKeyboard(page, page.getByRole('button', { name: 'Cancel', exact: true }));
    await expect(editButton).toBeFocused();
    await expect(page.getByRole('heading', { name: updatedName, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unsubmitted fictional edit', exact: true })).toHaveCount(0);

    await activateByKeyboard(page, editButton);
    await activateByKeyboard(page, page.getByRole('button', { name: 'Close', exact: true }));
    await expect(editButton).toBeFocused();

    page.once('dialog', (dialog) => void dialog.accept());
    await activateByKeyboard(page, page.getByRole('button', { name: `Delete ${collection.entity} ${updatedName}`, exact: true }));
    await expect(addButton).toBeFocused();
    await expect(page.getByRole('heading', { name: updatedName, exact: true })).toHaveCount(0);
    await expect(page.locator('.collection-status')).toContainText(`${updatedName} removed from the open plan.`);
    await expect(page.locator('.collection-status')).toContainText('Choose Save changes to keep this draft.');
  });
}

test('adding from an empty collection returns focus to the stable header action', async ({ page }) => {
  await openDemo(page);
  await navigate(page, 'Income');
  page.on('dialog', (dialog) => void dialog.accept());
  const deletes = page.getByRole('button', { name: /^Delete income source / });
  await expect(page.getByRole('heading', { name: 'Income', exact: true })).toBeVisible();
  await expect(deletes.first()).toBeVisible();
  while (await deletes.count()) {
    const count = await deletes.count();
    await deletes.first().click();
    await expect(deletes).toHaveCount(count - 1);
  }
  await activateByKeyboard(page, page.getByRole('button', { name: 'Add your first income source', exact: true }));
  await page.getByLabel('Income name').fill('Fictional first income');
  await page.getByLabel('Amount').fill('100');
  await activateByKeyboard(page, page.getByRole('button', { name: 'Add to plan', exact: true }));
  await expect(page.getByRole('button', { name: 'Add your first income source', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add income', exact: true })).toBeFocused();
});

test('permitted long names remain contained in cards, draft feedback, and editors at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openDemo(page);
  await navigate(page, 'Income');
  const name = 'F'.repeat(120);
  await page.getByRole('button', { name: 'Add income', exact: true }).click();
  await page.getByLabel('Income name').fill(name);
  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expectNoOverflow(page);
  await page.getByRole('button', { name: `Edit income source ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: `Edit ${name}`, exact: true })).toBeVisible();
  await expectNoOverflow(page);
});

test('excluded items remain readable and their editor clears the mobile header', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openDemo(page);
  await navigate(page, 'Income');
  const name = 'Fictional paused income';
  await page.getByRole('button', { name: 'Add income', exact: true }).click();
  await page.getByLabel('Income name').fill(name);
  await page.getByLabel('Amount').fill('100');
  const included = page.getByRole('checkbox', { name: 'Include in projections' });
  await included.focus();
  await page.keyboard.press('Space');
  await expect(included).not.toBeChecked();
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();

  const card = page.locator('.entity-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByText('Excluded', { exact: true })).toBeVisible();
  const edit = card.getByRole('button', { name: `Edit income source ${name}`, exact: true });
  await expect(edit).toBeEnabled();
  await expect(card.getByRole('button', { name: `Delete income source ${name}`, exact: true })).toBeEnabled();
  const contrast = await new AxeBuilder({ page }).include('.entity-disabled').withRules(['color-contrast']).analyze();
  expect(contrast.violations).toEqual([]);
  await expectNoOverflow(page);

  await activateByKeyboard(page, edit);
  await expect(page.locator('#entity-editor-title')).toBeFocused();
  await expect.poll(() => page.evaluate(() => {
    const heading = document.getElementById('entity-editor-title')!.getBoundingClientRect();
    const header = document.querySelector('.app-header')!.getBoundingClientRect();
    return heading.top >= header.bottom && heading.bottom <= window.innerHeight;
  })).toBe(true);
  await expectNoOverflow(page);
});

test('guide topics reach Canadian resources and offer a return to the topics list', async ({ page }) => {
  await openDemo(page);
  await navigate(page, 'Planning guide');
  const topics = page.getByRole('navigation', { name: 'Choose a topic.' });
  await topics.getByRole('link', { name: 'Canadian resources', exact: true }).click();
  await expect(page).toHaveURL(/#canadian-resources$/);
  const resources = page.locator('#canadian-resources');
  await expect(resources).toHaveAttribute('open', '');
  await expect(resources.getByRole('link', { name: /Making a budget/ })).toBeInViewport();
  await resources.getByRole('link', { name: 'Back to topics', exact: true }).click();
  await expect(page).toHaveURL(/#guide-topics$/);
  await expect(topics).toBeInViewport();
});

test('mobile mode context stays visible without crowding save and menu actions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openDemo(page);
  const header = page.locator('.app-header');
  const mode = header.locator('.mode-badge');
  await expect(header.getByText('Demo', { exact: true })).toBeVisible();
  expect(await mode.ariaSnapshot()).toContain('Demo Mode');
  await expect(header.getByRole('button', { name: 'Open planner menu' })).toBeVisible();
  await expectNoOverflow(page);
  await navigate(page, 'Income');
  await page.getByRole('button', { name: 'Add income', exact: true }).click();
  await page.getByLabel('Income name').fill('Fictional mobile income');
  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await expect(header.getByRole('button', { name: 'Save changes', exact: true })).toBeVisible();
  await expect(header.getByText('Demo', { exact: true })).toBeVisible();
  await expectNoOverflow(page);
});
