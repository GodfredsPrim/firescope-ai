import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';
import { fromArrayBuffer } from 'geotiff';
const read = async p => JSON.parse(await readFile(p, 'utf8'));
const history = await read('public/data/history/manifest.json'), burn = await read('public/data/burned-area/manifest.json');
assert.equal(history.months.length, 24); assert.equal(burn.months.length, 24);
const dates = new Set(); let total = 0, checkedSources = 0;
for (const month of history.months) {
  const payload = await read(`public/data/history/${month.month}.json`);
  const counts = Object.fromEntries(Object.keys(burn.regions).map(id => [id, new Map()]));
  const seen = new Set();
  for (let i = 0; i < month.sources.length; i++) {
    const source = month.sources[i], csv = await readFile(`artifacts/continuous-history/${source.file}`, 'utf8');
    assert.equal(createHash('sha256').update(csv).digest('hex'), source.sha256);
    assert.equal(payload.products[i].csv, csv); checkedSources++;
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true }); assert.equal(parsed.errors.length, 0);
    for (const row of parsed.data) {
      const key = [source.product, row.satellite, row.acq_date, row.acq_time, +row.latitude, +row.longitude].join('|');
      if (seen.has(key)) continue; seen.add(key);
      for (const [id, box] of Object.entries(burn.regions)) {
        const [w, s, e, n] = box;
        if (+row.longitude < w || +row.longitude > e || +row.latitude < s || +row.latitude > n) continue;
        const count = counts[id].get(row.acq_date) ?? [0, 0]; count[source.product === 'MODIS_SP' ? 0 : 1]++; counts[id].set(row.acq_date, count);
      }
    }
  }
  for (const day of month.daily) { assert.equal(day.completed, 2); assert(!dates.has(day.date)); dates.add(day.date); }
  for (const [id, days] of Object.entries(month.areas)) for (const d of days) assert.deepEqual([d.modis, d.viirs], counts[id].get(d.date) ?? [0, 0]);
  assert.equal(month.modis + month.viirs, seen.size); total += seen.size;
}
assert.equal(dates.size, 731);
for (let t = Date.parse('2024-01-01'); t <= Date.parse('2025-12-31'); t += 86400000) assert(dates.has(new Date(t).toISOString().slice(0, 10)));
let rasterFiles = 0;
for (const month of burn.months) {
  if (month.unavailable) { assert.equal(Object.keys(month.areas).length, 0); continue; }
  assert.equal(month.sources.length, 8);
  for (const source of month.sources) {
    assert(!source.href.includes('?')); const bytes = await readFile(`artifacts/burned-area/${source.file}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256); rasterFiles++;
  }
  for (const area of Object.values(month.areas)) {
    assert(area.burnedCells <= area.validLandCells && area.validLandCells <= area.landCells && area.shortenedCells <= area.validLandCells);
    assert(area.fullPeriodBurnedKm2 <= area.burnedKm2);
    assert(Math.abs(area.burnedKm2 - area.burnedCells * (1111950.5196666666 / 2400) ** 2 / 1e6) < .01);
  }
}
// Independent January 2025 Tamale check: derive pixel area from the TIFF
// bounding rectangle and inspect every native pixel, without the preparation helper.
const sample = burn.months.find(m => m.month === '2025-01');
let sampleArea = 0, sampleCells = 0;
for (const source of sample.sources.filter(s => s.band === 'Burn_Date')) {
  const load = async file => { const bytes = await readFile(`artifacts/burned-area/${file}`); return (await fromArrayBuffer(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))).getImage(); };
  const image = await load(source.file), quality = await load(sample.sources.find(s => s.item === source.item && s.band === 'QA').file);
  const b = (await image.readRasters({ samples: [0] }))[0], q = (await quality.readRasters({ samples: [0] }))[0];
  const [xmin, ymin, xmax, ymax] = image.getBoundingBox(), width = image.getWidth(), height = image.getHeight();
  const dx = (xmax - xmin) / width, dy = (ymax - ymin) / height, unitArea = dx * dy / 1e6, R = 6371007.181;
  for (let row = 0; row < height; row++) {
    const latitude = (ymax - dy * (row + .5)) / R;
    if (latitude * 180 / Math.PI < 8.9 || latitude * 180 / Math.PI > 10) continue;
    for (let col = 0; col < width; col++) {
      const i = row * width + col;
      if (q[i] % 4 !== 3 || b[i] < 1 || b[i] > 31) continue;
      const longitude = (xmin + dx * (col + .5)) / R / Math.cos(latitude) * 180 / Math.PI;
      if (longitude >= -1.4 && longitude <= -.3) { sampleArea += unitArea; sampleCells++; }
    }
  }
}
assert.equal(sampleCells, sample.areas.tamale.burnedCells); assert(Math.abs(sampleArea - sample.areas.tamale.burnedKm2) < 1e-5);
const report = { verifiedAt: new Date().toISOString(), requestedDays: dates.size, observationRecords: total, sourceCSVs: checkedSources, rasterFiles, availableBurnMonths: burn.months.filter(m => !m.unavailable).length, unavailableBurnMonths: burn.months.filter(m => m.unavailable).map(m => m.month), independentRasterCheck: { month: '2025-01', area: 'Tamale rectangle', burnedCells: sampleCells, burnedKm2: sampleArea }, interpretation: 'Checks establish software/data consistency, not independent scientific validation.' };
await writeFile('artifacts/history-verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
