import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:5173');
  const totals = page.locator('.observation-overview strong');
  await expect(totals.nth(0)).toHaveText('7,350', { timeout: 30000 });
  await page.getByLabel('Sensor selection').selectOption('MODIS');
  await expect(totals.nth(0)).toHaveText('1,135');
  await expect(totals.nth(1)).toHaveText('1,135');
  await expect(totals.nth(2)).toHaveText('0');
  await page.getByLabel('Sensor selection').selectOption('VIIRS');
  await expect(totals.nth(0)).toHaveText('6,215');
  await expect(totals.nth(1)).toHaveText('0');
  await expect(totals.nth(2)).toHaveText('6,215');
  await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('button', { name: 'User guide', exact: true }).click();
  await expect(page.locator('.user-guide')).toHaveCount(1);
  await expect(page.locator('.guide-article')).toBeVisible();
  await expect(page.locator('.observatory-shell')).toHaveCount(1);
  console.log('PASS: phone Guide access, one rendered guide, and both sensor-filter overview totals.');
} finally { await browser.close(); }
