import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

it('keeps disconnected public-demo services from issuing upstream requests', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const { createApiFetch } = await import('./hosting');
  const apiFetch = createApiFetch(true);
  for (const path of ['/api/fires/latest', '/api/fires/search?from=2025-01-01', '/api/weather/current', '/api/places?q=Accra']) {
    const response = await apiFetch(path);
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('not connected');
  }
  expect(fetch).not.toHaveBeenCalled();
});

it('loads both original saved studies through Firebase rewrites', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ products: [] })); vi.stubGlobal('fetch', fetch);
  const { createApiFetch } = await import('./hosting');
  const apiFetch = createApiFetch(true);
  for (const path of ['/api/demo/historical', '/api/demo/seasonal-study']) await apiFetch(path);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('preserves private backend requests for the complete local application', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ products: [] })); vi.stubGlobal('fetch', fetch);
  const { createApiFetch } = await import('./hosting');
  const apiFetch = createApiFetch(false);
  await apiFetch('/api/fires/latest');
  expect(fetch).toHaveBeenCalledWith('/api/fires/latest', undefined);
});
