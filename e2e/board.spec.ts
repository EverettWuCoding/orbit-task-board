import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled();
  await expect(page.getByTestId('task-card')).toHaveCount(8);
}
async function createTask(page: Page, title: string) {
  await page.getByRole('button', { name: /^New task/ }).click();
  await page.getByLabel('Task title').fill(title);
  await page.getByLabel('Description', { exact: false }).fill('A clear next step for the team.');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: `Open task: ${title}`, exact: true })).toBeVisible();
}

test('creates, edits, comments, moves and deletes a persisted task', async ({ page }) => {
  await ready(page); await createTask(page, 'Ship the next chapter');
  await page.reload();
  await page.getByRole('button', { name: 'Open task: Ship the next chapter', exact: true }).click();
  await page.getByLabel('Write a comment').fill('Ready for the first review.');
  await page.getByRole('button', { name: 'Post comment' }).click();
  await expect(page.getByText('Ready for the first review.', { exact: true })).toBeVisible();
  await page.getByLabel('Status', { exact: true }).selectOption('in_review');
  await page.getByLabel('Priority', { exact: true }).selectOption('high');
  await page.getByLabel('Assignee', { exact: true }).selectOption({ label: 'Jamie Chen' });
  await page.getByRole('checkbox', { name: 'Engineering' }).check();
  await page.getByRole('button', { name: 'Save changes' }).click();
  const column = page.getByTestId('column-in_review');
  await expect(column.getByRole('button', { name: 'Open task: Ship the next chapter', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Open task: Ship the next chapter', exact: true }).click();
  await page.getByRole('tab', { name: /Activity/ }).click();
  await expect(page.getByText('Moved from To Do → In Review', { exact: true })).toBeVisible();
  await expect(page.getByText('Assigned to Jamie Chen', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await page.getByRole('button', { name: 'Delete permanently', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open task: Ship the next chapter', exact: true })).toHaveCount(0);
});

test('combines title search and filters, clears them, and supports list view', async ({ page }) => {
  await ready(page);
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('component');
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await page.getByLabel('Filter by priority').selectOption('low');
  await expect(page.getByTestId('task-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByTestId('task-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(page.locator('.list-row')).toHaveCount(8);
  await page.getByRole('button', { name: 'Open task: Build the component library', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('manages team members and labels and assigns multiple tags', async ({ page, isMobile }) => {
  await ready(page);
  if (isMobile) await page.getByRole('button', { name: 'Open workspace navigation' }).click();
  await page.getByRole('button', { name: 'Manage team', exact: true }).click();
  await page.getByLabel('Member name').fill('Taylor Kim');
  await page.getByRole('radio', { name: 'Blue', exact: true }).check();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Taylor Kim', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  if (isMobile) await page.getByRole('button', { name: 'Open workspace navigation' }).click();
  await page.getByRole('button', { name: /Manage labels/ }).click();
  await page.getByLabel('Label name').fill('Quality');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Quality', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: /^New task/ }).click();
  await page.getByLabel('Task title').fill('Check the details');
  await page.getByLabel('Assignee', { exact: true }).selectOption({ label: 'Taylor Kim' });
  await page.getByRole('checkbox', { name: 'Quality', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Engineering', exact: true }).check();
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const card = page.getByTestId('task-card').filter({ has: page.getByRole('button', { name: 'Open task: Check the details', exact: true }) });
  await expect(card.getByText('Quality', { exact: true })).toBeVisible();
  await expect(card.getByText('Engineering', { exact: true })).toBeVisible();
  await expect(card.getByLabel('Taylor Kim', { exact: true })).toBeVisible();
});

test('supports keyboard shortcuts, cancellation and a focused dialog', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Physical keyboard interaction is verified on desktop.');
  await ready(page);
  await page.keyboard.press('n');
  await expect(page.getByLabel('Task title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('/');
  await expect(page.getByRole('textbox', { name: 'Search tasks' })).toBeFocused();
  await page.keyboard.type('not-a-task');
  await expect(page.getByTestId('task-card')).toHaveCount(0);
});

test('drags between columns and persists a within-column reorder', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Pointer dragging is verified on desktop; touch layout and status editor are tested separately.');
  await ready(page);
  const source = page.getByRole('button', { name: 'Drag Explore a fresh visual direction', exact: true });
  const target = page.getByTestId('column-done').locator('.add-task-button');
  const from = await source.boundingBox(); const to = await target.boundingBox();
  expect(from).toBeTruthy(); expect(to).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(from!.x + 20, from!.y + 20, { steps: 5 });
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(page.getByTestId('column-done').getByRole('button', { name: 'Open task: Explore a fresh visual direction', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('column-done').getByRole('button', { name: 'Open task: Explore a fresh visual direction', exact: true })).toBeVisible();
  const drag = page.getByRole('button', { name: 'Drag Explore a fresh visual direction', exact: true });
  const before = page.getByRole('button', { name: 'Drag Define our product principles', exact: true });
  const a = await drag.boundingBox(); const b = await before.boundingBox();
  await page.mouse.move(a!.x + 5, a!.y + 5); await page.mouse.down();
  await page.mouse.move(a!.x + 20, a!.y + 15, { steps: 4 });
  await page.mouse.move(b!.x + 5, b!.y + 5, { steps: 20 }); await page.mouse.up();
  await expect(page.getByTestId('column-done').getByTestId('task-card').first()).toContainText('Explore a fresh visual direction');
  await page.reload();
  await expect(page.getByTestId('column-done').getByTestId('task-card').first()).toContainText('Explore a fresh visual direction');
});

test('has no page-level horizontal overflow and works at narrow widths', async ({ page }) => {
  await ready(page);
  await page.setViewportSize({ width: 360, height: 800 });
  const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(dimensions.viewport).toBe(360);
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await createTask(page, 'A mobile-friendly task');
  await page.getByRole('button', { name: 'Open task: A mobile-friendly task', exact: true }).click();
  const dialog = await page.getByRole('dialog').boundingBox();
  expect(dialog!.width).toBeLessThanOrEqual(360);
});

test('separate browser contexts have separate demo guests', async ({ browser, page }) => {
  await ready(page); await createTask(page, 'Only in workspace A');
  const second = await browser.newContext();
  const other = await second.newPage();
  await ready(other);
  await expect(other.getByRole('button', { name: 'Open task: Only in workspace A', exact: true })).toHaveCount(0);
  const a = await page.evaluate(() => JSON.parse(localStorage.getItem('orbit.demo.v1')!).userId);
  const b = await other.evaluate(() => JSON.parse(localStorage.getItem('orbit.demo.v1')!).userId);
  expect(a).not.toBe(b);
  await second.close();
});

test('shows a recoverable error instead of overwriting corrupted demo data', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('orbit.demo.v1', '{invalid'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('unreadable');
  await expect(page.getByRole('button', { name: /^New task/ })).toBeDisabled();
});