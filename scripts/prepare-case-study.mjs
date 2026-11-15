import { loadEnvFile } from 'node:process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
loadEnvFile('.env.local');
const key = process.env.FIRMS_MAP_KEY?.trim();
if (!key) throw new Error('FIRMS_MAP_KEY is required; no value is printed.');
const folder = 'artifacts/ghana-seasonal-study';
await mkdir(folder, { recursive: true });
const bounds = [-3.3, 4.5, 1.3, 11.2], windows = [];
// Fixed in advance, not selected after inspecting calibration performance.
for (const year of [2021, 2022, 2023, 2024, 2025]) for (const month of ['01', '07']) {
  const from = `${year}-${month}-01`, to = `${year}-${month}-05`;
  const entry = { from, to, season: month === '01' ? 'January sample' : 'July sample', split: year <= 2023 ? 'train' : year === 2024 ? 'validation' : 'test', products: [] };
  for (const product of ['MODIS_SP', 'VIIRS_SNPP_SP']) {
    const file = `${from}-${product}.csv`, path = `${folder}/${file}`;
    let csv, fetchedAt;
    try { const saved = JSON.parse(await readFile(`${path}.json`, 'utf8')); csv = await readFile(path, 'utf8'); if (createHash('sha256').update(csv).digest('hex') !== saved.sha256) throw new Error('Checksum mismatch'); fetchedAt = saved.fetchedAt; }
    catch {
      try {
        const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${product}/${bounds.join(',')}/5/${from}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
        csv = (await response.text()).trim();
        if (!response.ok || !csv.startsWith('latitude,longitude,')) throw new Error('Invalid response');
        fetchedAt = new Date().toISOString();
        await writeFile(path, csv);
        await writeFile(`${path}.json`, JSON.stringify({ fetchedAt, sha256: createHash('sha256').update(csv).digest('hex') }, null, 2));
      } catch { console.error(`NASA retrieval failed for ${product}, ${from}. Saved files remain reusable; credentials omitted.`); process.exit(1); }
    }
    const item = { product, file, rows: csv.split(/\r?\n/).length - 1, fetchedAt, sha256: createHash('sha256').update(csv).digest('hex') };
    entry.products.push(item);
    console.log(`${from} ${product}: ${item.rows} source rows`);
  }
  windows.push(entry);
}
await writeFile(`${folder}/manifest.json`, JSON.stringify({ id: 'ghana-seasonal-2021-2025-v1', title: 'Ghana seasonal overlap study', provider: 'NASA FIRMS', bounds, from: '2021-01-01', to: '2025-07-05', fetchedAt: new Date().toISOString(), windows, design: 'Five requested days in January and July in each of 2021–2025; fixed year holdouts. This is a seasonal sample, not continuous annual coverage.', coverage: 'Both product requests completed for each listed window. Cloud-free observing opportunity is unknown; zero returned detections does not establish no burning.', reference: 'MODIS Aqua only; VIIRS Suomi-NPP. No independent fire truth.' }, null, 2));
console.log('Saved 50 requested days across five years, original source files, checksums and a key-free manifest.');
