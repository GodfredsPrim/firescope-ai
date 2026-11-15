import { chromium, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:4173');
  await expect(page.locator('.selection-total')).toContainText('7,350', { timeout: 30000 });
  await page.getByRole('button', { name: 'User guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start here: your first five minutes' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'FireScope AI user guide' })).toBeVisible();
  await expect(page.locator('.study-options')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/user-guide-desktop.png' });
  await page.getByRole('navigation', { name: 'User guide contents' }).getByRole('link', { name: 'Understand the main terms' }).click();
  await expect(page.getByRole('heading', { name: 'Understand the main terms', exact: true })).toBeFocused();
  if (!page.url().endsWith('#guide')) throw new Error('Contents link lost the guide route');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download guide', exact: true }).click();
  const download = await downloading;
  const content = await readFile(await download.path(), 'utf8');
  if (content !== await readFile('USER_GUIDE.md', 'utf8')) throw new Error('Offline guide differs from generated source');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('heading', { name: 'Start here: your first five minutes' }).scrollIntoViewIfNeeded();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Guide overflow at ${width}px`);
    if (width === 390) await page.screenshot({ path: 'test-results/user-guide-mobile.png' });
  }
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.navigation-rail')).not.toBeVisible();
  await expect(page.locator('.guide-actions')).not.toBeVisible();
  await expect(page.locator('.guide-article')).toBeVisible();
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.locator('.selection-total')).toContainText('7,350');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Map header overflow at 320px');
  await page.goto('http://127.0.0.1:4173/#guide');
  await expect(page.getByRole('heading', { name: 'Start here: your first five minutes' })).toBeVisible();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Guide verified: direct route, contents keyboard focus, identical offline Markdown, print layout, preserved dataset, desktop/768/390/320px and no page errors.');
} finally { await browser.close(); }
