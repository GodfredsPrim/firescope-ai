import { describe, expect, it } from 'vitest';
import { buildCalibration, type StudyManifest } from './calibration';
import type { Observation } from './data';

// Synthetic mathematical fixtures test implementation only, never scientific validity.
function fixture() {
  const windows = [2021, 2022, 2023, 2024].map((year, i) => ({ from: `${year}-01-01`, to: `${year}-01-10`, season: 'fixture', split: i < 2 ? 'train' as const : i === 2 ? 'validation' as const : 'test' as const, products: ['MODIS_SP', 'VIIRS_SNPP_SP'].map(product => ({ product, file: 'fixture', rows: 0, fetchedAt: '', sha256: '' })) }));
  const manifest: StudyManifest = { id: 'fixture', title: 'fixture', bounds: [-3, 4, 1, 11], provider: 'Fixture', from: windows[0].from, to: windows.at(-1)!.to, fetchedAt: '', windows, design: '', coverage: '', reference: '' };
  const records: Observation[] = [];
  for (const window of windows) for (let day = 1; day <= 10; day++) for (let cell = 0; cell < 4; cell++) {
    const date = `${window.from.slice(0, 7)}-${String(day).padStart(2, '0')}`;
    const base = { latitude: 9.05, longitude: -1.95 + cell * 0.2, date, time: '1300', confidence: 'n', frp: 1, source: 'mathematical fixture' };
    records.push({ ...base, id: `${date}-v-${cell}`, sensor: 'VIIRS', satellite: 'N' });
    if (cell < 2) records.push({ ...base, id: `${date}-m-${cell}`, sensor: 'MODIS', satellite: 'Aqua' });
  }
  return { records, manifest };
}
describe('experimental sensor-reference calibration', () => {
  it('fits known scaling on training years and evaluates separate years', () => {
    const { records, manifest } = fixture(), report = buildCalibration(records, manifest);
    expect(report.factor).toBe(0.5);
    expect(report.metrics.test.rawMAE).toBe(2);
    expect(report.metrics.test.adjustedMAE).toBe(0);
    expect(report.sensitivityRange).toEqual([0.5, 0.5]);
  });
  it('cannot change the fitted factor by changing held-out observations', () => {
    const { records, manifest } = fixture();
    const changed = records.filter(row => !(row.date.startsWith('2024') && row.sensor === 'MODIS'));
    const report = buildCalibration(changed, manifest);
    expect(report.factor).toBe(0.5);
    expect(report.metrics.test.adjustedMAE).toBeGreaterThan(0);
  });
  it('deduplicates occupied cells and excludes Terra instead of increasing reference counts', () => {
    const { records, manifest } = fixture();
    const duplicate = { ...records[0], id: 'duplicate' };
    const terra = { ...records[0], id: 'terra', sensor: 'MODIS' as const, satellite: 'Terra' };
    const report = buildCalibration([...records, duplicate, terra], manifest);
    expect(report.factor).toBe(0.5); expect(report.excludedRecords).toBe(1);
  });
  it('rejects overlapping dates, mixed year splits, missing products and synthetic observations', () => {
    const { records, manifest } = fixture();
    expect(() => buildCalibration(records, { ...manifest, windows: [...manifest.windows, manifest.windows[0]] })).toThrow(/Overlapping/);
    expect(() => buildCalibration(records, { ...manifest, windows: [...manifest.windows, { ...manifest.windows[0], from: '2021-02-01', to: '2021-02-05', split: 'test' }] })).toThrow(/year/);
    expect(() => buildCalibration(records, { ...manifest, windows: manifest.windows.map(w => ({ ...w, products: [] })) })).toThrow(/Both/);
    expect(() => buildCalibration([{ ...records[0], synthetic: true }], manifest)).toThrow(/Synthetic/);
  });
  it('does not invent daily samples outside declared completed request windows', () => {
    const { records, manifest } = fixture(), report = buildCalibration(records, manifest);
    expect(report.days).toHaveLength(40);
    expect(report.days.some(row => row.date.endsWith('-11'))).toBe(false);
  });
  it('retains explicit zero-returned-detection dates without treating unrequested dates as zero', () => {
    const { records, manifest } = fixture();
    const report = buildCalibration(records.filter(row => row.date !== '2024-01-01'), manifest);
    expect(report.days.find(day => day.date === '2024-01-01')).toMatchObject({ referenceCells: 0, viirsCells: 0, adjustedCells: 0 });
    expect(report.days.find(day => day.date === '2024-01-11')).toBeUndefined();
  });
  it('rejects NRT versions and unsupported spatial grid parameters', () => {
    const { records, manifest } = fixture();
    expect(() => buildCalibration([{ ...records[0], metadata: { version: '2.0NRT' } }, ...records.slice(1)], manifest)).toThrow(/Near-real-time/);
    expect(() => buildCalibration(records, manifest, NaN)).toThrow(/Grid/);
    expect(() => buildCalibration(records, manifest, 0)).toThrow(/Grid/);
  });
});
