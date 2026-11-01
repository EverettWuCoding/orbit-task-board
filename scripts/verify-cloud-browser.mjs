import { chromium, expect } from '@playwright/test';

// Defaults to the local frontend connected to the live Supabase project.
// Supply an HTTPS deployment URL to repeat after permanent hosting is claimed.
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch();
const a = await browser.newContext();
const b = await browser.newContext();
const pageA = await a.newPage();
const pageB = await b.newPage();
const titleA = `Temporary cloud browser A ${crypto.randomUUID().slice(0, 8)}`;
const titleB = `Temporary cloud browser B ${crypto.randomUUID().slice(0, 8)}`;
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
} finally {
  await remove(pageA, titleA).catch(() => {});
  await remove(pageB, titleB).catch(() => {});
  await browser.close();
  console.log('Temporary browser test tasks removed where reachable.');
}