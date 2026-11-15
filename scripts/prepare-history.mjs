import { loadEnvFile } from 'node:process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';
loadEnvFile('.env.local');
const key = process.env.FIRMS_MAP_KEY?.trim();
if (!key) throw new Error('FIRMS_MAP_KEY is required.');
const folder = 'artifacts/continuous-history', output = 'public/data/history';
await mkdir(folder, { recursive: true }); await mkdir(output, { recursive: true });
const bounds = [-3.3, 4.5, 1.3, 11.2];
const regions = { ghana: bounds, northern: [-3.3, 8.3, 1.3, 11.2], tamale: [-1.4, 8.9, -0.3, 10] };
const months = [], sources = [];
for (const year of [2024, 2025]) for (let month = 1; month <= 12; month++) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`, last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daily = Array.from({ length: last }, (_, i) => ({ date: `${prefix}-${String(i + 1).padStart(2, '0')}`, modis: 0, viirs: 0, completed: 0 }));
  const products = [], windows = [], seen = new Set();
  const areas = Object.fromEntries(Object.keys(regions).map(id => [id, daily.map(d => ({ date: d.date, modis: 0, viirs: 0 }))]));
  for (let day = 1; day <= last; day += 5) {
    const days = Math.min(5, last - day + 1), from = daily[day - 1].date;
    for (const product of ['MODIS_SP', 'VIIRS_SNPP_SP']) {
      const file = `${from}-${product}.csv`, path = `${folder}/${file}`;
      let csv, metadata;
      try { csv = await readFile(path, 'utf8'); metadata = JSON.parse(await readFile(`${path}.json`, 'utf8')); if (createHash('sha256').update(csv).digest('hex') !== metadata.sha256) throw new Error('Integrity'); }
      catch {
        let success = false;
        for (let attempt = 0; attempt < 3 && !success; attempt++) {
          try {
            const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${product}/${bounds.join(',')}/${days}/${from}`, { signal: AbortSignal.timeout(45000) });
            csv = (await response.text()).trim();
            if (!response.ok || !csv.startsWith('latitude,longitude,')) throw new Error('Provider response');
            metadata = { file, product, from, days, fetchedAt: new Date().toISOString(), sha256: createHash('sha256').update(csv).digest('hex') };
            await writeFile(path, csv); await writeFile(`${path}.json`, JSON.stringify(metadata, null, 2)); success = true;
          } catch { if (attempt === 2) throw new Error(`NASA retrieval failed for ${product} ${from}; rerun to resume. Credentials omitted.`); }
        }
      }
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      if (parsed.errors.length) throw new Error(`Invalid CSV ${file}`);
      for (const row of parsed.data) {
        const target = daily.find(item => item.date === row.acq_date);
        if (!target || Number(row.longitude) < bounds[0] || Number(row.longitude) > bounds[2] || Number(row.latitude) < bounds[1] || Number(row.latitude) > bounds[3]) throw new Error(`Out-of-scope source row: ${file}`);
        const id = [product, row.satellite, row.acq_date, row.acq_time, Number(row.latitude), Number(row.longitude)].join('|');
        if (seen.has(id)) continue;
        seen.add(id);
        const sensor = product === 'MODIS_SP' ? 'modis' : 'viirs';
        target[sensor]++;
        for (const [name, [w, s, e, n]] of Object.entries(regions)) if (+row.longitude >= w && +row.longitude <= e && +row.latitude >= s && +row.latitude <= n) areas[name].find(d => d.date === row.acq_date)[sensor]++;
      }
      for (let i = day - 1; i < day - 1 + days; i++) daily[i].completed++;
      products.push({ product, csv, fetchedAt: metadata.fetchedAt }); sources.push(metadata); windows.push(metadata);
    }
  }
  const fetchedAt = new Date().toISOString();
  await writeFile(`${output}/${prefix}.json`, JSON.stringify({ archive: true, mode: 'archive', bounds, from: daily[0].date, to: daily.at(-1).date, fetchedAt, products, requestedDays: daily.length, warnings: ['Both product requests completed for every date; cloud-free observing opportunity is unknown.'] }));
  months.push({ month: prefix, daily, areas, modis: daily.reduce((sum, d) => sum + d.modis, 0), viirs: daily.reduce((sum, d) => sum + d.viirs, 0), requestedDays: daily.length, file: `${prefix}.json`, sources: windows });
  console.log(`${prefix}: ${months.at(-1).modis} MODIS, ${months.at(-1).viirs} VIIRS; ${daily.length} requested days complete`);
}
const manifest = { version: 1, title: 'Ghana continuous request archive, 2024–2025', bounds, from: '2024-01-01', to: '2025-12-31', fetchedAt: new Date().toISOString(), products: ['MODIS_SP', 'VIIRS_SNPP_SP'], months, requestedDays: months.reduce((s, m) => s + m.requestedDays, 0), method: 'Standard-processing FIRMS requests in disjoint intervals of at most five days. Every date has completed requests for both products. Counts are raw source rows, not unique fires. Completed requests do not establish cloud-free observing opportunity. Retrospective descriptive archive; not a new blind calibration experiment.' };
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest));
await writeFile(`${folder}/manifest.json`, JSON.stringify({ ...manifest, sources }, null, 2));
console.log(`Published ${manifest.requestedDays} requested days and ${months.length} monthly source packages.`);
