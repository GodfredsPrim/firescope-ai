import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export function contextApi(env) {
  const cache = new Map();
  const pending = new Map();
  let newsNextAt = 0;
  let newsRetryAt = 0;
  async function cached(key, ttl, producer) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttl) return hit.value;
    if (pending.has(key)) return pending.get(key);
    const task = Promise.resolve().then(producer).then(value => {
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, { value, at: Date.now() }); return value;
    }).finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  }
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (!['/api/demo/historical', '/api/demo/seasonal-study', '/api/weather/current', '/api/places', '/api/news'].includes(url.pathname)) return next();
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Use GET.' })); return; }
    try {
      if (url.pathname === '/api/demo/seasonal-study') {
        const data = await cached('seasonal-study', 900000, async () => {
          const folder = resolve(process.cwd(), 'artifacts/ghana-seasonal-study');
          const study = JSON.parse(await readFile(resolve(folder, 'manifest.json'), 'utf8'));
          const products = [];
          for (const window of study.windows) for (const source of window.products) {
            if (!/^[\w.-]+\.csv$/.test(source.file)) throw new Error('Invalid study filename');
            const csv = await readFile(resolve(folder, source.file), 'utf8');
            if (createHash('sha256').update(csv).digest('hex') !== source.sha256) throw new Error('Study integrity check failed');
            products.push({ product: `${source.product} ${window.from}`, csv, fetchedAt: source.fetchedAt });
          }
          return { study, products, mode: 'archive', caseStudy: true, bounds: study.bounds, from: study.from, to: study.to, fetchedAt: study.fetchedAt, warnings: [] };
        });
        res.end(JSON.stringify(data)); return;
      }
      if (url.pathname === '/api/demo/historical') {
        const data = await cached('snapshot', 900000, async () => {
          const folder = resolve(process.cwd(), 'artifacts/nasa-ghana-2025-01-01_03');
          const provenance = JSON.parse(await readFile(resolve(folder, 'provenance.json'), 'utf8'));
          const products = await Promise.all(['MODIS_SP', 'VIIRS_SNPP_SP'].map(async product => ({ product, csv: await readFile(resolve(folder, `${product}.csv`), 'utf8') })));
          return { ...provenance, mode: 'archive', snapshot: true, products };
        });
        res.end(JSON.stringify(data)); return;
      }
      if (url.pathname === '/api/news') {
        const search = (url.searchParams.get('search') || '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, ' ').slice(0, 80);
        const cacheKey = `news:${search.toLowerCase()}`;
        let result;
        try { result = await cached(cacheKey, 900000, async () => {
          if (Date.now() < newsRetryAt || Date.now() < newsNextAt) throw new Error('News cooldown');
          newsNextAt = Date.now() + 6000;
          const upstream = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
          upstream.search = new URLSearchParams({ query: search ? `Ghana "${search}" sourcelang:english` : 'Ghana (bushfire OR wildfire OR "forest fire" OR "bush burning") sourcelang:english', mode: 'artlist', format: 'json', maxrecords: '12', timespan: '30d', sort: 'datedesc' }).toString();
          try {
            const response = await fetch(upstream, { signal: AbortSignal.timeout(25000) });
            if (!response.ok) throw new Error('Unavailable');
            const body = await response.json();
            if (!Array.isArray(body.articles)) throw new Error('Unavailable');
            return { articles: body.articles, fetchedAt: new Date().toISOString(), source: 'GDELT', stale: false };
          } catch (error) { newsRetryAt = Date.now() + 60000; throw error; }
        }); } catch {
          const previous = cache.get(cacheKey);
          if (previous && Date.now() - previous.at < 86400000) result = { ...previous.value, stale: true };
          else {
            res.statusCode = 503;
            res.setHeader('Retry-After', String(Math.max(1, Math.ceil((Math.max(newsRetryAt, newsNextAt) - Date.now()) / 1000))));
            res.end(JSON.stringify({ error: 'GDELT is temporarily unavailable. Try again in a minute; satellite observations remain available.' })); return;
          }
        }
        res.end(JSON.stringify(result)); return;
      }
      const key = env.OPENWEATHERMAP_API_KEY?.trim();
      if (!key) { res.statusCode = 503; res.end(JSON.stringify({ error: 'Weather context is not configured. Add OPENWEATHERMAP_API_KEY privately and restart the local server.' })); return; }
      if (url.pathname === '/api/places') {
        const q = url.searchParams.get('q')?.trim() ?? '';
        if (q.length < 2 || q.length > 100) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Enter 2-100 characters.' })); return; }
        const result = await cached(`place:${q.toLowerCase()}`, 86400000, async () => {
          const upstream = new URL('https://api.openweathermap.org/geo/1.0/direct');
          upstream.search = new URLSearchParams({ q, limit: '5', appid: key }).toString();
          const response = await fetch(upstream, { signal: AbortSignal.timeout(15000) });
          const rows = await response.json();
          if (!response.ok || !Array.isArray(rows)) throw new Error('Unavailable');
          return rows.filter(row => Number.isFinite(row.lat) && Number.isFinite(row.lon)).map(row => ({ name: [row.name, row.state, row.country].filter(Boolean).join(', '), lat: row.lat, lon: row.lon }));
        });
        res.end(JSON.stringify({ places: result })); return;
      }
      const latText = url.searchParams.get('lat'), lonText = url.searchParams.get('lon');
      const lat = Number(latText), lon = Number(lonText);
      if (!latText?.trim() || !lonText?.trim() || !Number.isFinite(lat + lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Valid latitude and longitude are required.' })); return; }
      const data = await cached(`weather:${lat.toFixed(3)},${lon.toFixed(3)}`, 600000, async () => {
        const upstream = new URL('https://api.openweathermap.org/data/2.5/weather');
        upstream.search = new URLSearchParams({ lat: String(lat), lon: String(lon), units: 'metric', appid: key }).toString();
        const response = await fetch(upstream, { signal: AbortSignal.timeout(15000) });
        const body = await response.json();
        if (!response.ok || Number(body.cod) !== 200 || !Number.isFinite(body.dt)) throw new Error('Unavailable');
        return { source: 'OpenWeatherMap Current Weather', mode: 'current', lat, lon, location: body.name || null, observedAt: new Date(body.dt * 1000).toISOString(), fetchedAt: new Date().toISOString(), temperatureC: body.main?.temp ?? null, humidityPercent: body.main?.humidity ?? null, windMps: body.wind?.speed ?? null, windDirectionDeg: body.wind?.deg ?? null, rain1hMm: body.rain?.['1h'] ?? null, snow1hMm: body.snow?.['1h'] ?? null, conditions: body.weather?.[0]?.description ?? null };
      });
      res.end(JSON.stringify(data));
    } catch {
      const savedExample = url.pathname.startsWith('/api/demo/');
      res.statusCode = savedExample ? 404 : 502;
      res.end(JSON.stringify({ error: savedExample ? 'The saved NASA example is unavailable or failed its integrity check. Restore the source files or run the case-study preparation script; existing observations are retained.' : 'The context provider could not be reached. Retry later; satellite data remains available.' }));
    }
  };
}
