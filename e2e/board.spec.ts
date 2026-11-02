import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function dragVisibleHandle(page: Page, source: Locator, target: Locator, targetAnnouncement?: string) {
  await expect(source).toBeEnabled();
  // boundingBox() does not scroll. Measuring an offscreen grip then sending
  // raw mouse coordinates can select text instead of ever starting a drag.
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const viewport = page.viewportSize()!;
  const sourceBeforeScroll = await source.boundingBox();
  const targetBeforeScroll = await target.boundingBox();
  expect(sourceBeforeScroll).not.toBeNull();
  expect(targetBeforeScroll).not.toBeNull();
  // Keep the entire gesture away from the viewport's auto-scroll edges.
  // Otherwise the board moves while raw target coordinates stay unchanged.
  const top = Math.min(sourceBeforeScroll!.y, targetBeforeScroll!.y);
  const bottom = Math.max(sourceBeforeScroll!.y + sourceBeforeScroll!.height, targetBeforeScroll!.y + targetBeforeScroll!.height);
  await page.evaluate((offset) => window.scrollBy(0, offset), (top + bottom) / 2 - viewport.height / 2);
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  const start = { x: from!.x + from!.width / 2, y: from!.y + from!.height / 2 };
  const finish = { x: to!.x + to!.width / 2, y: to!.y + to!.height / 2 };
  for (const point of [start, finish]) {
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.x).toBeLessThan(viewport.width);
    expect(point.y).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeLessThan(viewport.height);
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  try {
    await page.mouse.move(start.x - 10, start.y, { steps: 4 });
    await expect(page.locator('.is-dragging')).toHaveCount(1);
    await page.mouse.move(finish.x, finish.y, { steps: 20 });
    if (targetAnnouncement) await expect(page.locator('[id^="DndLiveRegion-"]')).toHaveText(targetAnnouncement);
  } finally { await page.mouse.up(); }
  await expect(page.locator('.is-dragging')).toHaveCount(0);
}

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
  await dragVisibleHandle(page, source, target, 'Over Done.');
  await expect(page.getByTestId('column-done').getByRole('button', { name: 'Open task: Explore a fresh visual direction', exact: true })).toBeVisible();
  await expect(page.getByTestId('column-done').getByTestId('task-card').last()).toContainText('Explore a fresh visual direction');
  await page.reload();
  await expect(page.getByTestId('column-done').getByRole('button', { name: 'Open task: Explore a fresh visual direction', exact: true })).toBeVisible();
  const drag = page.getByRole('button', { name: 'Drag Explore a fresh visual direction', exact: true });
  const before = page.getByRole('button', { name: 'Drag Define our product principles', exact: true });
  await dragVisibleHandle(page, drag, before, 'Over Define our product principles.');
  await expect(page.getByTestId('column-done').getByTestId('task-card').first()).toContainText('Explore a fresh visual direction');
  await page.reload();
  await expect(page.getByTestId('column-done').getByTestId('task-card').first()).toContainText('Explore a fresh visual direction');
});

test('dropping outside the board cancels without changing status or order', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mouse-pointer cancellation is verified on desktop.');
  await ready(page);
  const before = await page.getByTestId('column-todo').getByTestId('task-card').allTextContents();
  await dragVisibleHandle(page, page.getByRole('button', { name: 'Drag Explore a fresh visual direction', exact: true }), page.getByRole('textbox', { name: 'Search tasks' }), 'Outside the board.');
  await expect(page.getByTestId('column-todo').getByTestId('task-card')).toHaveCount(3);
  expect(await page.getByTestId('column-todo').getByTestId('task-card').allTextContents()).toEqual(before);
  await page.reload();
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled();
  expect(await page.getByTestId('column-todo').getByTestId('task-card').allTextContents()).toEqual(before);
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