import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/* global document -- page.evaluate executes in the browser, not Node. */

const root = fileURLToPath(new URL('../', import.meta.url));
const server = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  await new Promise((done, reject) => {
    let output = '';
    const watchdog = setTimeout(() => reject(new Error('Preview startup readiness was not detected within 15 seconds.')), 15_000);
    const ready = (chunk) => {
      output += stripVTControlCharacters(chunk.toString());
      if (output.includes('http://127.0.0.1:4173')) { clearTimeout(watchdog); done(); }
    };
    server.stdout.on('data', ready);
    server.stderr.on('data', (chunk) => process.stderr.write(chunk));
    server.once('error', reject);
    server.once('exit', (code) => reject(new Error(`Preview server exited before ready (${code}). Ensure port 4173 is free.`)));
  });
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByText('Local demo', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^New task/ })).toBeEnabled();
  await expect(page.getByTestId('task-card')).toHaveCount(8);
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  if (audit.violations.length) throw new Error(`Production accessibility violations: ${audit.violations.map((violation) => violation.id).join(', ')}`);
  const screenshots = resolve(root, 'docs/screenshots');
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: resolve(screenshots, 'desktop-board.png'), fullPage: true });
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    if (dimensions.viewport !== width || dimensions.content > width) throw new Error(`Layout overflow or unexpected viewport at ${width}px: ${JSON.stringify(dimensions)}`);
    console.log(`Production layout verified: ${dimensions.viewport}px; content ${dimensions.content}px.`);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: resolve(screenshots, 'mobile-board.png'), fullPage: true });
  await page.getByRole('button', { name: /^New task/ }).click();
  await page.getByLabel('Task title').fill('Production build smoke test');
  await page.getByLabel('Status', { exact: true }).selectOption('done');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('column-done').getByRole('button', { name: 'Open task: Production build smoke test', exact: true })).toBeVisible();
  if (errors.length) throw new Error(`Production browser errors: ${errors.join('\n')}`);
  console.log('Built application smoke test passed: assets loaded, no runtime/network errors, accessibility passed, mobile create/status/persistence verified.');
} finally {
  await browser?.close();
  server.kill();
}