import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const errors = [];
let mode = 'articles', calls = 0, query = '';
const retrievedAt = new Date().toISOString();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/news?**', async route => {
  calls++; query = new URL(route.request().url()).searchParams.get('search');
  if (mode === 'error') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Fixture provider unavailable"}' });
  await new Promise(resolve => setTimeout(resolve, 250));
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    fetchedAt: mode === 'stale' ? '2026-11-12T12:00:00Z' : retrievedAt, stale: mode === 'stale',
    articles: mode === 'empty' ? [] : [
      { title: 'Test fixture: Ghana bushfire coverage and community response', url: 'https://example.org/test-article', seendate: '20261112T110000Z' },
      { title: 'Test fixture: a long environmental headline to verify wrapping in narrow layouts without hiding publisher attribution', url: 'https://example.net/long-headline', seendate: '20261111T110000Z' },
      { title: 'Unsafe fixture', url: 'javascript:alert(1)' },
    ],
  }) });
});
const open = async () => {
  await page.goto('about:blank');
  await page.goto('http://127.0.0.1:5173/#news');
  await expect(page.getByRole('heading', { name: 'Ghana news desk' })).toBeVisible();
};
try {
  await open();
  await expect(page.getByRole('link', { name: /Test fixture: Ghana/ })).toBeVisible();
  await expect(page.locator('.news-list li')).toHaveCount(2);
  await expect(page.locator('.news-status')).toContainText('Retrieved');
  const link = page.getByRole('link', { name: /Test fixture: Ghana/ });
  await expect(link).toHaveAttribute('href', 'https://example.org/test-article');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByRole('button', { name: 'Check news updates' }).click();
  await expect(page.getByRole('button', { name: 'Check news updates' })).toBeEnabled();
  if (calls !== 1) throw new Error('News cache failed');
  await page.getByRole('searchbox', { name: 'Search Ghana news' }).fill('drought');
  await page.getByRole('button', { name: 'Search news', exact: true }).click();
  await expect(page.locator('.news-status')).toContainText('“drought”', { timeout: 15000 });
  if (query !== 'drought') throw new Error('Search did not reach the private adapter');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`News overflow at ${width}px`);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `test-results/news-desk-${width}.png`, fullPage: true });
  }
  await page.getByRole('link', { name: 'Skip to workspace' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Ghana news desk' })).toBeVisible();
  mode = 'empty'; await open();
  await expect(page.getByRole('heading', { name: 'No matching headlines', exact: true })).toBeVisible();
  mode = 'error'; await open();
  await expect(page.getByRole('heading', { name: 'Headlines are temporarily unavailable' })).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Explore', exact: true }).click();
  await expect(page.locator('.selection-total')).toContainText('7,350');
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  // navigator.onLine is controlled by the browser context for a real offline transition.
  await page.context().setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: 'You are offline' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export observations', exact: true })).toBeEnabled();
  await page.context().setOffline(false);
  mode = 'stale'; await open();
  await expect(page.locator('.news-status')).toContainText('Showing saved headlines');
  await expect(page.locator('.news-note')).toContainText('12 Nov 2026, 12:00 UTC');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('News UI passed with labeled fixtures: private adapter, safe source links, search, cache, truthful timestamps, empty/error/stale states, offline satellite continuity, keyboard skip link, 1440/768/390/320px and no page errors.');
} finally { await browser.close(); }
