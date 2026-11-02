import { chromium, expect } from '@playwright/test';

// Defaults to the local frontend connected to the live Supabase project.
// Supply an HTTPS deployment URL to repeat after permanent hosting is claimed.
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch();
const a = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const b = await browser.newContext();
const pageA = await a.newPage();
const pageB = await b.newPage();
const titleA = `Temporary cloud browser A ${crypto.randomUUID().slice(0, 8)}`;
const titleB = `Temporary cloud browser B ${crypto.randomUUID().slice(0, 8)}`;
const titleExtra = `Temporary hosted drag ${crypto.randomUUID().slice(0, 8)}`;
const memberName = `Verification member ${crypto.randomUUID().slice(0, 6)}`;
const labelNames = ['Design', 'Quality'].map((name) => `Verification ${name} ${crypto.randomUUID().slice(0, 6)}`);
const openTask = (page, title) => page.getByRole('button', { name: `Open task: ${title}`, exact: true });
const ready = async (page) => {
  const response = await page.goto(url);
  if (!response?.ok()) throw new Error(`Frontend returned HTTP ${response?.status()}. Not a verified live demo.`);
  await expect(page.getByText('Private workspace', { exact: true })).toBeVisible();
  await expect(page.getByText('Local demo', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled({ timeout: 30_000 });
};
const create = async (page, title) => {
  await page.getByRole('button', { name: /^New task/ }).click();
  await page.getByLabel('Task title').fill(title);
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
  await expect(openTask(page, title)).toBeVisible();
};
const remove = async (page, title) => {
  if (await openTask(page, title).count()) {
    if (await page.getByRole('dialog').count()) await page.getByRole('button', { name: 'Close dialog' }).click();
    await openTask(page, title).click();
    await page.getByRole('button', { name: 'Delete task', exact: true }).click();
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
  }
};
const drag = async (source, target, announcement) => {
  await expect(source).toBeEnabled();
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(); const to = await target.boundingBox();
  assertVisiblePoint(from); assertVisiblePoint(to);
  await pageA.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await pageA.mouse.down();
  try {
    await pageA.mouse.move(from.x + from.width / 2 - 10, from.y + from.height / 2, { steps: 4 });
    await expect(pageA.locator('.is-dragging')).toHaveCount(1);
    await pageA.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
    if (announcement) await expect(pageA.locator('[id^="DndLiveRegion-"]')).toHaveText(announcement);
  } finally { await pageA.mouse.up(); }
  await expect(pageA.locator('.is-dragging')).toHaveCount(0);
  await expect(pageA.getByRole('button', { name: /^New task/ })).toBeEnabled({ timeout: 30_000 });
};
function assertVisiblePoint(rect) {
  expect(rect).not.toBeNull();
  const viewport = pageA.viewportSize();
  expect(rect.x + rect.width / 2).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width / 2).toBeLessThan(viewport.width);
  expect(rect.y + rect.height / 2).toBeGreaterThanOrEqual(0);
  expect(rect.y + rect.height / 2).toBeLessThan(viewport.height);
}
const manage = async (kind) => {
  await pageA.getByRole('button', { name: kind === 'member' ? 'Manage team' : /Manage labels/, exact: kind === 'member' }).click();
  await expect(pageA.getByRole('dialog')).toBeVisible();
};
const removeRosterItem = async (kind, name) => {
  if (await pageA.getByRole('dialog').count()) await pageA.getByRole('button', { name: 'Close dialog' }).click();
  await manage(kind);
  const removeButton = pageA.getByRole('button', { name: `Remove ${name}`, exact: true });
  if (await removeButton.count()) {
    await removeButton.click();
    await pageA.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(removeButton).toHaveCount(0, { timeout: 30_000 });
  }
  await pageA.getByRole('button', { name: 'Done', exact: true }).click();
};
try {
  await ready(pageA); await ready(pageB);
  await expect(pageA.getByTestId('task-card')).toHaveCount(0);
  await expect(pageB.getByTestId('task-card')).toHaveCount(0);
  await create(pageA, titleA); await create(pageB, titleB);
  await expect(openTask(pageA, titleB)).toHaveCount(0);
  await expect(openTask(pageB, titleA)).toHaveCount(0);
  await pageA.reload(); await expect(openTask(pageA, titleA)).toBeVisible({ timeout: 30_000 });
  const sameGuestTab = await a.newPage();
  await ready(sameGuestTab); await expect(openTask(sameGuestTab, titleA)).toBeVisible();
  await openTask(pageA, titleA).click();
  await pageA.getByLabel('Write a comment').fill('Temporary live-browser comment.');
  await pageA.getByRole('button', { name: 'Post comment' }).click();
  await expect(pageA.getByText('Temporary live-browser comment.', { exact: true })).toBeVisible({ timeout: 30_000 });
  await pageA.getByLabel('Status', { exact: true }).selectOption('in_review');
  await pageA.getByRole('button', { name: 'Save changes' }).click();
  await expect(pageA.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
  await expect(sameGuestTab.getByTestId('column-in_review').getByRole('button', { name: `Open task: ${titleA}`, exact: true })).toBeVisible({ timeout: 30_000 });
  await pageA.reload(); await expect(pageA.getByTestId('column-in_review').getByRole('button', { name: `Open task: ${titleA}`, exact: true })).toBeVisible({ timeout: 30_000 });
  await openTask(pageA, titleA).click();
  await expect(pageA.getByText('Temporary live-browser comment.', { exact: true })).toBeVisible();
  await pageA.getByRole('tab', { name: /Activity/ }).click();
  await expect(pageA.getByText('Moved from To Do → In Review', { exact: true })).toBeVisible();
  await pageA.getByRole('button', { name: 'Close dialog' }).click();
  await expect(openTask(pageB, titleA)).toHaveCount(0);
  console.log(`Cloud browser verification passed at ${url}: distinct guests, refresh/session persistence, comments/activity and same-guest cross-tab Realtime.`);

  await manage('member');
  await pageA.getByLabel('Member name').fill(memberName);
  await pageA.getByRole('radio', { name: 'Blue', exact: true }).check();
  await pageA.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(pageA.getByRole('dialog').getByText(memberName, { exact: true })).toBeVisible({ timeout: 30_000 });
  await pageA.getByRole('button', { name: 'Done', exact: true }).click();
  await manage('label');
  for (const name of labelNames) {
    await pageA.getByLabel('Label name').fill(name);
    await pageA.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(pageA.getByRole('dialog').getByText(name, { exact: true })).toBeVisible({ timeout: 30_000 });
  }
  await pageA.getByRole('button', { name: 'Done', exact: true }).click();
  const dates = await pageA.evaluate(() => {
    const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const today = new Date(); const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    return { today: format(today), yesterday: format(yesterday) };
  });
  await openTask(pageA, titleA).click();
  await pageA.getByLabel('Description', { exact: false }).fill('Hosted acceptance: all seven advanced categories.');
  await pageA.getByLabel('Priority', { exact: true }).selectOption('high');
  await pageA.getByLabel('Due date', { exact: true }).fill(dates.yesterday);
  await pageA.getByLabel('Assignee', { exact: true }).selectOption({ label: memberName });
  for (const name of labelNames) await pageA.getByRole('checkbox', { name, exact: true }).check();
  await pageA.getByRole('button', { name: 'Save changes' }).click();
  await expect(pageA.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
  const card = pageA.getByTestId('task-card').filter({ has: openTask(pageA, titleA) });
  await expect(card.getByLabel(memberName, { exact: true })).toBeVisible();
  for (const name of labelNames) await expect(card.getByText(name, { exact: true })).toBeVisible();
  await expect(card.locator('.due-overdue')).toBeVisible();
  const summary = pageA.getByRole('region', { name: 'Board summary' });
  await expect(summary.getByRole('button', { name: '1 overdue', exact: true })).toBeVisible();
  await expect(summary.locator('.summary-item').first()).toHaveText('1tasks');
  await pageA.getByRole('textbox', { name: 'Search tasks' }).fill(titleA.toUpperCase());
  await pageA.getByLabel('Filter by priority').selectOption('high');
  await pageA.getByLabel('Filter by assignee').selectOption({ label: memberName });
  await pageA.getByLabel('Filter by label').selectOption({ label: labelNames[0] });
  await expect(pageA.getByTestId('task-card')).toHaveCount(1);
  await pageA.getByLabel('Filter by priority').selectOption('low');
  await expect(pageA.getByTestId('task-card')).toHaveCount(0);
  await pageA.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await openTask(pageA, titleA).click();
  await pageA.getByRole('tab', { name: /Activity/ }).click();
  await expect(pageA.getByText(`Assigned to ${memberName}`, { exact: true })).toBeVisible();
  await expect(pageA.getByText('Set priority to high', { exact: true })).toBeVisible();
  await pageA.getByLabel('Due date', { exact: true }).fill(dates.today);
  await pageA.getByRole('button', { name: 'Save changes' }).click();
  await expect(pageA.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
  await expect(card.locator('.due-soon')).toBeVisible();
  await openTask(pageA, titleA).click();
  await pageA.getByLabel('Due date', { exact: true }).fill(dates.yesterday);
  await pageA.getByLabel('Status', { exact: true }).selectOption('done');
  await pageA.getByRole('button', { name: 'Save changes' }).click();
  await expect(pageA.getByRole('dialog')).toHaveCount(0, { timeout: 30_000 });
  await expect(card.locator('.due-complete')).toBeVisible();
  await expect(summary.getByRole('button', { name: '0 overdue', exact: true })).toBeVisible();
  await expect(summary.locator('.summary-item').nth(1)).toHaveText('1completed');
  await pageA.reload();
  await expect(card.getByLabel(memberName, { exact: true })).toBeVisible({ timeout: 30_000 });
  for (const name of labelNames) await expect(card.getByText(name, { exact: true })).toBeVisible();
  console.log('All seven advanced categories verified on hosted UI: roster/avatar/assignment, comments, timeline, multiple labels, urgency badges, combined search/filters and whole-board stats.');

  await create(pageA, titleExtra);
  await drag(pageA.getByRole('button', { name: `Drag ${titleExtra}`, exact: true }), pageA.getByTestId('column-done').locator('.add-task-button'), 'Over Done.');
  await expect(pageA.getByTestId('column-done').getByRole('button', { name: `Open task: ${titleExtra}`, exact: true })).toBeVisible();
  await expect(pageA.getByTestId('column-done').getByTestId('task-card').last()).toContainText(titleExtra);
  await pageA.reload();
  await expect(openTask(pageA, titleExtra)).toBeVisible({ timeout: 30_000 });
  await drag(pageA.getByRole('button', { name: `Drag ${titleExtra}`, exact: true }), pageA.getByRole('button', { name: `Drag ${titleA}`, exact: true }), `Over ${titleA}.`);
  await expect(pageA.getByTestId('column-done').getByTestId('task-card').first()).toContainText(titleExtra);
  await pageA.reload();
  await expect(pageA.getByTestId('column-done').getByTestId('task-card').first()).toContainText(titleExtra, { timeout: 30_000 });
  console.log('Actual hosted pointer cross-column move and same-column reorder persist after reload.');
} finally {
  await remove(pageA, titleA).catch(() => {});
  await remove(pageA, titleExtra).catch(() => {});
  await remove(pageB, titleB).catch(() => {});
  await removeRosterItem('member', memberName).catch(() => {});
  for (const name of labelNames) await removeRosterItem('label', name).catch(() => {});
  await browser.close();
  console.log('Temporary browser test tasks, member and labels removed where reachable.');
}