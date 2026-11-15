import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts/atlas', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const results = [];
await page.goto('http://127.0.0.1:5173');
await page.evaluate(() => document.activeElement?.blur());
await expect(page.locator('.selection-total')).toContainText('7,350', { timeout: 45000 });
await expect(page.locator('.workspace-toolbar')).toBeVisible();
await expect(page.locator('.observation-overview')).toContainText('7,350');
await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-tile')].some(i => i.complete && i.naturalWidth > 0), { timeout: 10000 }).catch(() => {});
if (!process.argv.includes('--mobile')) await page.screenshot({ path: 'artifacts/atlas/explore-desktop.png', fullPage: true });
for (const route of process.argv.includes('--mobile') ? [] : ['calendar', 'records', 'lab', 'news', 'methods', 'guide', 'assessment']) {
  await page.goto(`http://127.0.0.1:5173/#${route}`);
  await page.evaluate(() => document.activeElement?.blur());
  await expect(page.locator('.workspace-intro h1')).not.toBeEmpty();
  await page.locator('.workspace-content > footer').waitFor();
  if (route === 'assessment') await expect(page.locator('.assessment-view')).toBeVisible({ timeout: 30000 });
  if (route === 'guide') await expect(page.locator('.guide-article')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: `artifacts/atlas/${route}-desktop.png`, fullPage: true });
  results.push({ route, viewport: 'desktop', overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
}
await page.goto('http://127.0.0.1:5173/#records');
await expect(page.locator('.selection-total')).toContainText('7,350', { timeout: 30000 });
await page.getByRole('searchbox', { name: 'Search detection records' }).fill('MODIS');
await expect(page.locator('.data-explorer .panel-heading p')).toContainText('1,135');
await page.getByRole('button', { name: /^Inspect MODIS/ }).first().click();
await expect(page.getByRole('heading', { name: 'Observation details' })).toBeVisible();
const pending = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export matching CSV' }).click();
await pending;
await page.setViewportSize({ width: 390, height: 844 });
for (const route of ['explore', 'calendar', 'records', 'lab', 'news', 'methods', 'guide', 'assessment']) {
  await page.goto(`http://127.0.0.1:5173/#${route}`);
  await page.evaluate(() => document.activeElement?.blur());
  await expect(page.locator('.workspace-intro h1')).not.toBeEmpty();
  if (route === 'explore') {
    await expect(page.locator('.observation-overview')).toContainText('7,350', { timeout: 30000 });
    const close = page.getByRole('button', { name: 'Close observation details' });
    if (await close.isVisible()) await close.click();
  }
  if (route === 'assessment') await expect(page.locator('.assessment-view')).toBeVisible({ timeout: 30000 });
  if (route === 'guide') await expect(page.locator('.guide-article')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: `artifacts/atlas/${route}-mobile.png`, fullPage: true });
  const overflow = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, offenders: [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 2 && getComputedStyle(el).position !== 'absolute').slice(0, 5).map(el => el.className) }));
  results.push({ route, viewport: 'mobile', ...overflow });
}
await writeFile('artifacts/atlas/checks.json', JSON.stringify({ results, errors }, null, 2));
await browser.close();
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length || results.some(r => r.overflow)) process.exitCode = 1;
