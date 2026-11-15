// Local development/preview adapter. Credentials never enter the client bundle.
const dayMs = 86400000;
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function parseFireRequest(url) {
  const to = url.searchParams.get('to') || new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get('from') || (validDate(to) ? new Date(Date.parse(to) - 2 * dayMs).toISOString().slice(0, 10) : '');
  const mode = url.searchParams.get('mode') || 'nrt';
  const boundStrings = (url.searchParams.get('bounds') || '-3.3,4.5,1.3,11.2').split(',');
  const bounds = boundStrings.map(Number);
  const count = (Date.parse(to) - Date.parse(from)) / dayMs + 1;
  const [west, south, east, north] = bounds;
  if (!validDate(from) || !validDate(to) || count < 1 || count > 10 || to > new Date().toISOString().slice(0, 10)) throw new Error('Choose 1-10 UTC days ending today or earlier. Import CSV files for longer histories.');
  if (!['nrt', 'archive'].includes(mode)) throw new Error('Choose near-real-time or standard-processing data.');
  if (bounds.length !== 4 || boundStrings.some(v => !v.trim()) || bounds.some(v => !Number.isFinite(v)) || west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north || (east - west) * (north - south) > 400) throw new Error('Enter west < east and south < north; use an area no larger than 400 square degrees. Antimeridian-crossing areas need separate requests.');
  return { from, to, mode, bounds, count };
}
export function localApi(env) {
  const cache = new Map(), pending = new Map();
  let retryAfter = 0;
  async function getData(request) {
    const key = JSON.stringify(request);
    const cached = cache.get(key);
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < 900000) return cached;
    if (pending.has(key)) return pending.get(key);
    if (pending.size) throw new Error('Another NASA request is running. Wait for it to finish before searching again.');
    if (Date.now() < retryAfter) throw new Error('NASA could not be reached. Try again in one minute.');
    if (!env.FIRMS_MAP_KEY?.trim()) throw new Error('Add FIRMS_MAP_KEY to .env.local and restart the local server.');
    const task = (async () => {
      try {
        const suffix = request.mode === 'archive' ? 'SP' : 'NRT';
        const names = [`MODIS_${suffix}`, `VIIRS_SNPP_${suffix}`];
        const results = await Promise.allSettled(names.map(async product => {
          const parts = [];
          for (let offset = 0; offset < request.count; offset += 5) {
            const date = new Date(Date.parse(request.from) + offset * dayMs).toISOString().slice(0, 10);
            const days = Math.min(5, request.count - offset);
            const endpoint = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(env.FIRMS_MAP_KEY.trim())}/${product}/${request.bounds.join(',')}/${days}/${date}`;
            const response = await fetch(endpoint, { signal: AbortSignal.timeout(30000) });
            const csv = (await response.text()).trim();
            if (!response.ok || !csv.startsWith('latitude,longitude,')) throw new Error('NASA response unavailable');
            parts.push(csv);
          }
          const header = parts[0].split(/\r?\n/)[0];
          const rows = parts.flatMap(part => part.split(/\r?\n/).slice(1)).filter(Boolean);
          return { product, csv: [header, ...rows].join('\n') };
        }));
        const products = results.filter(item => item.status === 'fulfilled').map(item => item.value);
        if (!products.length) throw new Error('All source products unavailable');
        const warnings = results.flatMap((item, index) => item.status === 'rejected' ? [`${names[index]} unavailable; results are partial. Retry later or import the missing product.`] : []);
        const result = { products, warnings, partial: warnings.length > 0, fetchedAt: new Date().toISOString(), from: request.from, to: request.to, mode: request.mode, bounds: request.bounds };
        if (cache.size >= 10) cache.delete(cache.keys().next().value);
        cache.set(key, result); return result;
      } catch {
        retryAfter = Date.now() + 60000;
        throw new Error('NASA data could not be loaded. Check product date availability, then try again in one minute or import a FIRMS CSV. Standard-processing products may not cover recent dates.');
      } finally { pending.delete(key); }
    })();
    pending.set(key, task); return task;
  }
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (!['/api/fires/latest', '/api/fires/search'].includes(url.pathname)) return next();
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(JSON.stringify({ error: 'Use GET.' })); return; }
    let request;
    try { request = parseFireRequest(url); }
    catch (error) { res.statusCode = 400; res.end(JSON.stringify({ error: error.message })); return; }
    try { res.end(JSON.stringify(await getData(request))); }
    catch (error) { res.statusCode = 502; res.end(JSON.stringify({ error: error.message })); }
  };
}
