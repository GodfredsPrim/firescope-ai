import { chromium, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: 45000 });
import { readFile, mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const expected = JSON.parse(await readFile('artifacts/ghana-seasonal-study/evaluation.json', 'utf8'));
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(45000);
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(base);
  await expect(page.locator('.selection-total')).toContainText('7,350');
  await page.getByRole('button', { name: 'Open harmonization study' }).click();
  await expect(page.getByRole('heading', { name: 'Does the adjustment carry into another year?' })).toBeVisible();
  await expect(page.locator('.dataset-badge')).toContainText('Five-year sampled study');
  await expect(page.locator('.calibration-method code')).toContainText(expected.report.factor.toFixed(4));
  await expect(page.locator('.calibration-bar-row').last()).toContainText('70.9');
  await page.locator('.calibration-panel').screenshot({ path: 'test-results/calibration-desktop.png' });
  await page.locator('.calibration-result').screenshot({ path: 'test-results/calibration-comparison-desktop.png' });
  await page.getByRole('button', { name: 'Validation 2024', exact: false }).click();
  await expect(page.locator('.calibration-bar-row').last()).toContainText('59.3');
  await page.getByRole('button', { name: 'Held-out test 2025', exact: false }).click();
  let downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export calibration evidence', exact: true }).click();
  let download = await downloading;
  const evidence = JSON.parse(await readFile(await download.path(), 'utf8'));
  if (Math.abs(evidence.report.factor - expected.report.factor) > 1e-10 || evidence.report.days.length !== 50 || evidence.report.metrics.test.days !== 10 || !evidence.manifest.windows[0].products[0].sha256) throw new Error('Evidence export does not reproduce the archived evaluation');
  downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export raw vs adjusted CSV' }).click();
  download = await downloading;
  if ((await readFile(await download.path(), 'utf8')).trim().split('\n').length !== 51) throw new Error('Daily comparison export lost sampled days');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Calibration overflow at ${width}px`);
    if (width === 390) await page.locator('.calibration-panel').screenshot({ path: 'test-results/calibration-mobile.png' });
  }
  await page.getByRole('button', { name: 'Explore adjusted calendar' }).click();
  await expect(page.getByLabel('Calendar measure')).toHaveValue('adjusted');
  await expect(page.getByLabel('Calendar month')).toHaveValue('2025-01');
  await expect(page.locator('.adjusted-calendar-note')).toContainText('Sampled dates only');
  await expect(page.getByRole('button', { name: 'February 2025: no sampled records; coverage unknown', exact: true })).toContainText('No records');
  await expect(page.getByRole('button', { name: '2025-01-06, no records, coverage unknown', exact: true })).toHaveText('6?');
  downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export daily calendar', exact: true }).click();
  download = await downloading;
  const calendar = await readFile(await download.path(), 'utf8');
  if (!calendar.includes('experimental-daily-cell-nnls-origin-v1') || calendar.includes('2025-01-06')) throw new Error('Adjusted calendar fabricated missing dates or lost method metadata');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Adjusted calendar overflow at ${width}px`);
    if (width !== 320) await page.locator('.history-calendar').screenshot({ path: `test-results/adjusted-calendar-${width}.png` });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Real case study passed on ${base}: ${expected.sourceRows} records, 50 days, fixed year splits, reproducible held-out metrics, evidence and CSV downloads, adjusted calendar with unknown gaps, desktop/mobile layouts and no page errors.`);
} finally { await browser.close(); }
