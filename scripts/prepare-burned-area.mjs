import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fromArrayBuffer } from 'geotiff';
import { RESEARCH_AREAS, emptyArea, summarizeRaster } from './burned-area-math.mjs';
const folder = 'artifacts/burned-area', output = 'public/data/burned-area';
await mkdir(folder, { recursive: true }); await mkdir(output, { recursive: true });
async function request(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (response.ok) return response;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) throw new Error(`Public data request failed: HTTP ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, Math.min(60000, Math.max(5000, Number(response.headers.get('retry-after') || 10) * 1000))));
  }
}
const access = await (await request('https://planetarycomputer.microsoft.com/api/sas/v1/token/modiseuwest/modis-061-cogs')).json();
if (!access.token) throw new Error('No public raster access token returned.');
const months = [];
for (const year of [2024, 2025]) for (let month = 1; month <= 12; month++) {
  const label = `${year}-${String(month).padStart(2, '0')}`, last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const query = new URLSearchParams({ collections: 'modis-64A1-061', bbox: RESEARCH_AREAS.ghana.join(','), datetime: `${label}-01T00:00:00Z/${label}-${last}T23:59:59Z`, limit: '100' });
  let catalog;
  try { catalog = JSON.parse(await readFile(`${folder}/${label}-catalog.json`, 'utf8')); }
  catch { catalog = await (await request(`https://planetarycomputer.microsoft.com/api/stac/v1/search?${query}`)).json(); }
  const items = catalog.features;
  const keys = items.map(f => `${f.properties['modis:horizontal-tile']}/${f.properties['modis:vertical-tile']}`).sort();
  if (JSON.stringify(keys) !== JSON.stringify(['17/7', '17/8', '18/7', '18/8'])) {
    months.push({ month: label, areas: {}, sources: [], unavailable: 'The public mirror does not provide all four required tiles for this month; no area total is estimated.', discoveredItems: items.map(item => item.id) });
    console.log(`${label}: burned area unavailable; ${keys.length}/4 required tiles returned`);
    continue;
  }
  await writeFile(`${folder}/${label}-catalog.json`, JSON.stringify(catalog));
  const areas = Object.fromEntries(Object.keys(RESEARCH_AREAS).map(id => [id, emptyArea()])), sources = [];
  const firstDay = Math.round((Date.UTC(year, month - 1, 1) - Date.UTC(year, 0, 1)) / 86400000) + 1;
  for (const item of items) {
    const images = {};
    for (const band of ['Burn_Date', 'QA']) {
      const href = item.assets[band].href, file = `${item.id}-${band}.tif`, path = `${folder}/${file}`;
      let bytes;
      try { bytes = await readFile(path); } catch {
        bytes = Buffer.from(await (await request(`${href}?${access.token}`)).arrayBuffer());
        await writeFile(path, bytes);
      }
      const tiff = await fromArrayBuffer(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      const image = await tiff.getImage();
      images[band] = { image, raster: (await image.readRasters({ samples: [0] }))[0] };
      sources.push({ item: item.id, band, href, file, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    const image = images.Burn_Date.image, quality = images.QA.image;
    if (image.getWidth() !== quality.getWidth() || image.getHeight() !== quality.getHeight() || JSON.stringify(image.getOrigin()) !== JSON.stringify(quality.getOrigin()) || JSON.stringify(image.getResolution()) !== JSON.stringify(quality.getResolution())) throw new Error('Raster grids do not match.');
    const result = summarizeRaster({ burn: images.Burn_Date.raster, qa: images.QA.raster, width: image.getWidth(), height: image.getHeight(), origin: image.getOrigin(), resolution: image.getResolution(), firstDay, lastDay: firstDay + last - 1 });
    for (const id of Object.keys(areas)) for (const metric of Object.keys(areas[id])) areas[id][metric] += result[id][metric];
  }
  months.push({ month: label, areas, sources });
  console.log(`${label}: ${areas.ghana.burnedKm2.toFixed(1)} mapped burned km²; ${(100 * areas.ghana.validLandCells / areas.ghana.landCells).toFixed(1)}% valid land cells`);
  await writeFile(`${folder}/${label}-summary.json`, JSON.stringify(months.at(-1), null, 2));
}
const manifest = { version: 1, product: 'MCD64A1.061', provider: 'NASA LP DAAC, mirrored by Microsoft Planetary Computer', retrievedAt: new Date().toISOString(), regions: RESEARCH_AREAS, months, method: 'Native sinusoidal pixel centres inside rectangular extents. Area is sum of native pixel areas, about 0.21466 km² each (nominal 500 m product). QA bits 0 and 1 must be set. Burn day must fall inside the product calendar month. Shortened mapping periods (bit 2) remain in the mapped total and are disclosed separately, with a full-period-only sensitivity total. Invalid land is excluded, not assumed unburned. No boundary fractional-area correction. Product incorporates MODIS active fires and is not independent fire truth.', documentation: 'https://lpdaac.usgs.gov/documents/1006/MCD64_User_Guide_V61.pdf' };
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest));
await writeFile(`${folder}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Saved ${months.length} monthly burned-area summaries with source checksums.`);
