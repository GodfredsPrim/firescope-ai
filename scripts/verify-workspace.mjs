import { chromium, expect } from '@playwright/test';
expect.configure({ timeout: 45000 });
import { mkdir, readFile } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/news?**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ articles: [], fetchedAt: new Date().toISOString(), stale: false }) }));
const nav = name => page.getByRole('navigation').getByRole('button', { name, exact: true });
try {
  await page.goto('http://127.0.0.1:5173');
  await expect(page.locator('.selection-total')).toContainText('7,350', { timeout: 30000 });
  await expect(page.locator('.dataset-badge')).toHaveText('Historical NASA snapshot');
  await expect(nav('Sensor Lab')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Fetch NASA', exact: true })).not.toBeVisible();
  await page.screenshot({ path: 'test-results/workspace-desktop.png', fullPage: true });
  await page.locator('.research-navigation > summary').click();
  await nav('Data Explorer').click();
  await page.getByRole('searchbox', { name: 'Search detection records' }).fill('MODIS');
  await expect(page.locator('.data-explorer .panel-heading p')).toContainText('1,135');
  await page.getByRole('button', { name: 'Next records', exact: true }).click();
  await expect(page.locator('.record-pagination')).toContainText('Page 2 of 12');
  await page.getByRole('button', { name: /^Inspect MODIS/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Observation details' })).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export matching CSV' }).click();
  const download = await downloading;
  const csv = await readFile(await download.path(), 'utf8');
  if (!csv.includes('dataset_kind') || csv.trim().split('\n').length !== 1136) throw new Error('Search export lost records or provenance');
  await nav('Sensor Lab').click();
  await expect(page.locator('.link-metrics dd').first()).toHaveText('401');
  await page.getByRole('button', { name: 'Guided Demo', exact: true }).click();
  await expect(page.locator('.guided-tour')).toContainText('75,823');
  await page.getByRole('button', { name: 'Next: Sensor differences' }).click();
  await expect(page.locator('.guided-tour')).toContainText('266.1 occupied cells');
  await page.getByRole('button', { name: 'Next: Historical activity' }).click();
  await expect(page.locator('.guided-tour')).toContainText('not independently validated');
  await page.getByRole('button', { name: 'Inspect & export findings' }).click();
  await nav('Explore').click();
  const activeDay = page.locator('.active-day-filter button');
  if (await activeDay.count()) await activeDay.click();
  await page.locator('.study-options > summary').click();
  await page.route('**/api/fires/search?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Fixture NASA outage' }) }));
  await page.getByRole('button', { name: 'Fetch NASA', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Previous observations');
  await expect(page.locator('.selection-total')).toContainText('75,823');
  await page.getByRole('button', { name: 'Dismiss error' }).click();
  await page.unroute('**/api/fires/search?**');
  await page.route('**/api/fires/search?**', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Delayed fixture outage"}' }).catch(() => {});
  });
  await page.getByRole('button', { name: 'Fetch NASA', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel request', exact: true }).click();
  await expect(page.locator('.result-notice')).toContainText('Request cancelled');
  await expect(page.locator('.selection-total')).toContainText('75,823');
  await page.unroute('**/api/fires/search?**');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
    for (const name of ['Explore', 'Historical Calendar', 'Sensor Lab', 'Data Explorer', 'News updates', 'Methods & Sources']) {
      await nav(name).click();
      await page.waitForTimeout(150);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${name} overflows at ${width}px`);
      if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/workspace-${name.split(' ')[0].toLowerCase()}-${width}.png`, fullPage: true });
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Workspace verified: real snapshot, search, pagination, record inspection, provenance export, 401 candidate links, guided demo, failed/cancelled requests retain observations and all six views at 1440/768/390/320px. No page errors. News uses labeled empty-response fixtures.');
} finally {
  await browser.close();
}
