import { expect, test } from '@playwright/test';

test('keyboard pickup and drop can move a task across columns', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Requires a physical keyboard profile.');
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled();
  const handle = page.getByRole('button', { name: 'Drag Explore a fresh visual direction', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.is-dragging')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[id^="DndLiveRegion-"]')).toContainText('Over Build the component library.');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('column-in_progress').getByRole('button', { name: 'Open task: Explore a fresh visual direction', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('column-in_progress').getByRole('button', { name: 'Open task: Explore a fresh visual direction', exact: true })).toBeVisible();
});

test('long user text and markup stay safe and do not overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled();
  await page.getByRole('button', { name: /^New task/ }).click();
  const title = '<img src=x onerror=alert(1)> ' + 'A'.repeat(170);
  await page.getByLabel('Task title').fill(title);
  await page.getByLabel('Description', { exact: false }).fill('<script>globalThis.injected = true</script>');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('task-card').filter({ hasText: 'onerror=alert(1)' })).toHaveCount(1);
  expect(await page.locator('.task-card img, .task-card script').count()).toBe(0);
  const width = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
});