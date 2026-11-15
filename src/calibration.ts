import { validDate, type Observation } from './data';

export type StudySplit = 'train' | 'validation' | 'test';
export type StudyWindow = { from: string; to: string; season: string; split: StudySplit; products: { product: string; file: string; rows: number; fetchedAt: string; sha256: string }[] };
export type StudyManifest = { id: string; title: string; provider: string; bounds: number[]; from: string; to: string; fetchedAt: string; windows: StudyWindow[]; design: string; coverage: string; reference: string };
export type CalibrationDay = { date: string; year: number; season: string; split: StudySplit; referenceCells: number; viirsCells: number; adjustedCells: number; seasonalBaselineCells: number; modisRecords: number; viirsRecords: number };
export type CalibrationMetrics = { days: number; rawMAE: number; adjustedMAE: number; seasonalBaselineMAE: number; rawRMSE: number; adjustedRMSE: number; rawBias: number; adjustedBias: number; improvementPercent: number | null };
export type CalibrationReport = { method: string; gridDegrees: number; factor: number; sensitivityRange: [number, number]; trainYears: number[]; validationYears: number[]; testYears: number[]; excludedRecords: number; days: CalibrationDay[]; metrics: Record<StudySplit, CalibrationMetrics>; limitations: string[] };
export type GridSensitivity = { gridDegrees: number; factor: number; test: CalibrationMetrics };
const dayMs = 86400000;
export const CALIBRATION_LIMITATIONS = [
  'Experimental sensor-reference adjustment, not independently validated harmonization or true fire counts.',
  'MODIS Aqua is a reference sensor, not ground truth. Agreement does not establish accuracy.',
  'Only five January days and five July days per year are sampled. Annual totals, seasonal peaks, anomaly baselines and geographic transfer are not established.',
  'Both source requests completed for listed dates; cloud-free observing opportunity is unknown. Zero returned detections is not zero burning.',
  'No correction for clouds, viewing geometry, footprint, fire intensity or exact overpass timing. A global scale cannot recover fires missed by MODIS.',
  '0.1-degree cells are not equal-area. Leave-one-training-year-out factor range is sensitivity, not a confidence interval.',
];
export function calibrationMetrics(days: CalibrationDay[]): CalibrationMetrics {
  if (!days.length) throw new Error('No days for evaluation.');
  const errors = days.map(day => ({ raw: day.viirsCells - day.referenceCells, adjusted: day.adjustedCells - day.referenceCells }));
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const rawMAE = mean(errors.map(e => Math.abs(e.raw))), adjustedMAE = mean(errors.map(e => Math.abs(e.adjusted)));
  return { days: days.length, rawMAE, adjustedMAE, seasonalBaselineMAE: mean(days.map(day => Math.abs(day.seasonalBaselineCells - day.referenceCells))), rawRMSE: Math.sqrt(mean(errors.map(e => e.raw ** 2))), adjustedRMSE: Math.sqrt(mean(errors.map(e => e.adjusted ** 2))), rawBias: mean(errors.map(e => e.raw)), adjustedBias: mean(errors.map(e => e.adjusted)), improvementPercent: rawMAE > 0 ? (rawMAE - adjustedMAE) / rawMAE * 100 : null };
}
export function buildCalibration(records: Observation[], manifest: StudyManifest, gridDegrees = 0.1): CalibrationReport {
  if (!Number.isFinite(gridDegrees) || gridDegrees < 0.01 || gridDegrees > 1) throw new Error('Grid size must be 0.01 to 1 degree.');
  if (records.some(row => row.synthetic)) throw new Error('Synthetic observations cannot establish a real-data calibration.');
  const days = new Map<string, CalibrationDay>(), roleYears = new Map<number, StudySplit>();
  for (const window of manifest.windows) {
    if (!['train', 'validation', 'test'].includes(window.split) || !validDate(window.from) || !validDate(window.to) || window.from > window.to || Date.parse(window.to) - Date.parse(window.from) > 31 * dayMs) throw new Error('Invalid study window.');
    if (!['MODIS_SP', 'VIIRS_SNPP_SP'].every(product => window.products.some(p => p.product === product))) throw new Error('Both standard-processing source products are required for every study window.');
    for (let stamp = Date.parse(window.from); stamp <= Date.parse(window.to); stamp += dayMs) {
      const date = new Date(stamp).toISOString().slice(0, 10), year = Number(date.slice(0, 4));
      if (days.has(date)) throw new Error('Overlapping study dates would leak evaluation samples.');
      if (roleYears.has(year) && roleYears.get(year) !== window.split) throw new Error('A year cannot appear in more than one split.');
      roleYears.set(year, window.split);
      days.set(date, { date, year, season: window.season, split: window.split, referenceCells: 0, viirsCells: 0, adjustedCells: 0, seasonalBaselineCells: 0, modisRecords: 0, viirsRecords: 0 });
    }
  }
  const cells = new Map<string, Set<string>>();
  let excludedRecords = 0;
  for (const row of records) {
    if (/NRT/i.test(row.metadata?.version ?? '')) throw new Error('Near-real-time observations cannot be mixed into this standard-processing study.');
    const day = days.get(row.date), satellite = row.satellite.toUpperCase();
    const reference = row.sensor === 'MODIS' && ['A', 'AQUA'].includes(satellite);
    const viirs = row.sensor === 'VIIRS' && ['N', 'NPP', 'SUOMI NPP', 'SUOMI-NPP'].includes(satellite);
    if (!day || (!reference && !viirs)) { excludedRecords++; continue; }
    const role = reference ? 'reference' : 'viirs', key = `${row.date}:${role}`;
    const occupied = cells.get(key) ?? new Set<string>();
    occupied.add(`${Math.floor((row.longitude + 180) / gridDegrees)},${Math.floor((row.latitude + 90) / gridDegrees)}`);
    cells.set(key, occupied);
    if (reference) day.modisRecords++; else day.viirsRecords++;
  }
  const rows = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  for (const row of rows) { row.referenceCells = cells.get(`${row.date}:reference`)?.size ?? 0; row.viirsCells = cells.get(`${row.date}:viirs`)?.size ?? 0; }
  const years = (split: StudySplit) => [...new Set(rows.filter(row => row.split === split).map(row => row.year))].sort();
  const trainYears = years('train'), validationYears = years('validation'), testYears = years('test');
  if (trainYears.length < 2 || !validationYears.length || !testYears.length || Math.max(...trainYears) >= Math.min(...validationYears) || Math.max(...validationYears) >= Math.min(...testYears)) throw new Error('Require chronological, separate training (at least two years), validation and test years.');
  const training = rows.filter(row => row.split === 'train');
  if (training.length < 20 || training.filter(row => row.referenceCells > 0 && row.viirsCells > 0).length < 10 || rows.filter(row => row.split === 'test').length < 5) throw new Error('Insufficient paired daily support for a study fit.');
  // Nonnegative least squares through the origin; no test/validation values enter fitting.
  const fit = (sample: CalibrationDay[]) => {
    const denominator = sample.reduce((sum, row) => sum + row.viirsCells ** 2, 0);
    if (!denominator) throw new Error('No VIIRS training support.');
    return Math.max(0, sample.reduce((sum, row) => sum + row.viirsCells * row.referenceCells, 0) / denominator);
  };
  const factor = fit(training);
  if (!factor) throw new Error('No positive reference support.');
  const sensitivity = trainYears.map(year => fit(training.filter(row => row.year !== year)));
  for (const row of rows) {
    row.adjustedCells = row.viirsCells * factor;
    const season = training.filter(day => day.season === row.season);
    if (!season.length) throw new Error('Every evaluated sampling window needs corresponding training support.');
    row.seasonalBaselineCells = season.reduce((sum, day) => sum + day.referenceCells, 0) / season.length;
  }
  return { method: 'experimental-daily-cell-nnls-origin-v1', gridDegrees, factor, sensitivityRange: [Math.min(...sensitivity), Math.max(...sensitivity)], trainYears, validationYears, testYears, excludedRecords, days: rows, metrics: { train: calibrationMetrics(rows.filter(row => row.split === 'train')), validation: calibrationMetrics(rows.filter(row => row.split === 'validation')), test: calibrationMetrics(rows.filter(row => row.split === 'test')) }, limitations: [...CALIBRATION_LIMITATIONS] };
}
