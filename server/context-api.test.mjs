import { afterEach, describe, expect, it, vi } from 'vitest';
import { contextApi } from './context-api.mjs';
import { localApi } from './local-api.mjs';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
async function call(middleware, url) {
  let body = '', status = 200;
  const response = { setHeader() {}, set statusCode(value) { status = value; }, end(value) { body = value; } };
  await middleware({ method: 'GET', url }, response, () => { throw new Error('Unexpected next'); });
  return { status, body: JSON.parse(body) };
}
describe('private context adapters', () => {
  it('shares simultaneous news requests and preserves the actual retrieval time', async () => {
    const upstream = vi.fn(async () => new Response(JSON.stringify({ articles: [{ title: 'Fixture only', url: 'https://example.org/fixture' }] })));
    vi.stubGlobal('fetch', upstream);
    const api = contextApi({});
    const [first, second] = await Promise.all([call(api, '/api/news'), call(api, '/api/news')]);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(first.body).toEqual(second.body);
    expect(first.body).toMatchObject({ source: 'GDELT', stale: false });
    const cached = await call(api, '/api/news');
    expect(cached.body.fetchedAt).toBe(first.body.fetchedAt);
    expect(upstream).toHaveBeenCalledTimes(1);
  });
  it('returns explicitly stale news on failure, then expires the fallback after one day', async () => {
    vi.useFakeTimers();
    const upstream = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ articles: [] }))).mockRejectedValue(new Error('Provider unavailable'));
    vi.stubGlobal('fetch', upstream);
    const api = contextApi({});
    const first = await call(api, '/api/news');
    vi.setSystemTime(Date.now() + 16 * 60000);
    const saved = await call(api, '/api/news');
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ stale: true, fetchedAt: first.body.fetchedAt });
    vi.setSystemTime(Date.now() + 86400000);
    expect((await call(api, '/api/news')).status).toBe(503);
  });
  it('fails news safely and applies cooldown without exposing provider internals', async () => {
    const upstream = vi.fn(async () => { throw new Error('private upstream diagnostic'); });
    vi.stubGlobal('fetch', upstream);
    const api = contextApi({});
    expect((await call(api, '/api/news')).status).toBe(503);
    const next = await call(api, '/api/news?search=drought');
    expect(next.status).toBe(503);
    expect(JSON.stringify(next.body)).not.toContain('private upstream diagnostic');
    expect(upstream).toHaveBeenCalledTimes(1);
  });
  it('maps current weather with units, timestamps and missing precipitation without exposing keys', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ cod: 200, dt: 1700000000, name: 'Test location', main: { temp: 28, humidity: 60 }, wind: { speed: 3 }, weather: [{ description: 'clear sky' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const result = await call(contextApi({ OPENWEATHERMAP_API_KEY: 'unit-test-private-key' }), '/api/weather/current?lat=9&lon=-1');
    expect(result.body).toMatchObject({ mode: 'current', temperatureC: 28, humidityPercent: 60, windMps: 3, rain1hMm: null, observedAt: '2023-11-14T22:13:20.000Z' });
    expect(JSON.stringify(result.body)).not.toContain('unit-test-private-key');
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('units')).toBe('metric');
  });
  it('rejects invalid weather coordinates without upstream access and reports missing setup', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    expect((await call(contextApi({ OPENWEATHERMAP_API_KEY: 'test' }), '/api/weather/current?lat=999&lon=-1')).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect((await call(contextApi({}), '/api/weather/current?lat=9&lon=-1')).status).toBe(503);
  });
  it('returns safe location fields and reuses the geocoding cache', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify([{ name: 'Tamale', country: 'GH', lat: 9.4, lon: -0.8 }]), { status: 200 })); vi.stubGlobal('fetch', fetch);
    const api = contextApi({ OPENWEATHERMAP_API_KEY: 'test' });
    expect((await call(api, '/api/places?q=Tamale')).body.places[0]).toEqual({ name: 'Tamale, GH', lat: 9.4, lon: -0.8 });
    await call(api, '/api/places?q=Tamale'); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retains a successful NASA product when the other product fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async url => String(url).includes('MODIS') ? new Response('Unavailable', { status: 503 }) : new Response('latitude,longitude,acq_date,acq_time,instrument\n9,-1,2025-01-01,1200,VIIRS', { status: 200 })));
    const result = await call(localApi({ FIRMS_MAP_KEY: 'unit-key' }), '/api/fires/search?from=2025-01-01&to=2025-01-01&mode=archive');
    expect(result.status).toBe(200); expect(result.body.partial).toBe(true); expect(result.body.products).toHaveLength(1); expect(result.body.warnings[0]).toContain('MODIS_SP unavailable');
  });
});
