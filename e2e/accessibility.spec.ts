import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('board, task dialog, and quick guide meet automated WCAG A/AA checks', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled();
  const audit = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect((await audit()).violations).toEqual([]);
  await page.getByRole('button', { name: /^New task/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await audit()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  if (isMobile) {
    await page.getByRole('button', { name: 'Open workspace navigation' }).click();
    await page.getByRole('button', { name: 'A quick guide', exact: true }).click();
  } else await page.getByRole('button', { name: 'Open quick guide', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect((await audit()).violations).toEqual([]);
});