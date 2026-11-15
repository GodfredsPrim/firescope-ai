import { describe, expect, it } from 'vitest';
import { DENSITY_RAMP, rampLevel, roiCalendar, roiPeriods, windVector } from './roiActivity';
import type { Observation } from './data';
import type { DailySeries, Polygon } from './assessment';
const polygon: Polygon = [[0, 0], [1, 0], [1, 1], [0, 1]];
const observations: Observation[] = [
  { id: '1', latitude: 0.5, longitude: 0.5, date: '2025-01-01', time: '1200', sensor: 'MODIS', satellite: 'Aqua', source: 'synthetic fixture', frp: null, confidence: '90' },
  { id: '2', latitude: 0.5, longitude: 0.5, date: '2025-01-01', time: '1230', sensor: 'VIIRS', satellite: 'NPP', source: 'synthetic fixture', frp: null, confidence: 'n' },
];
describe('ROI calendar evidence', () => {
  it('keeps raw observations distinct from aligned occupancy and missing dates', () => {
    expect(roiCalendar(observations, 'records', polygon, null, null)[0].value).toBe(2);
    const cells = roiCalendar(observations, 'cells', polygon, null, null);
    expect(cells[0].value).toBe(1); expect(cells).toHaveLength(1);
    expect(roiPeriods(cells).months.get('2025-02')).toBeUndefined();
    expect(roiPeriods(cells).years.get('2025')).toEqual({ value: 1, days: 1 });
  });
  it('requires comparable matching-area series and preserves represented zero', () => {
    const series: DailySeries = { version: 1, polygon, method: 'synthetic fixture', source: 'synthetic fixture', comparable: true, units: 'occupied_cells', days: [{ date: '2025-01-01', value: 0, coverage: 'observed' }, { date: '2025-01-02', value: null, coverage: 'unknown' }] };
    expect(roiCalendar(observations, 'adjusted', polygon, null, series)).toHaveLength(1);
    expect(roiCalendar(observations, 'adjusted', polygon, null, series)[0].value).toBe(0);
    expect(roiCalendar(observations, 'adjusted', [[0, 0], [2, 0], [0, 2]], null, series)).toEqual([]);
    expect(roiCalendar(observations, 'adjusted', polygon, null, { ...series, comparable: false })).toEqual([]);
  });
  it('supports many decades without fabricating unrepresented years', () => {
    const values = [1980, 1990, 2000, 2010, 2020].map(year => ({ date: `${year}-01-01`, value: 1, coverage: 'fixture' }));
    expect([...roiPeriods(values).years.keys()]).toEqual(['1980', '1990', '2000', '2010', '2020']);
    expect(rampLevel(undefined, 10)).toBe(-1); expect(rampLevel(0, 10)).toBe(0); expect(rampLevel(10, 10)).toBe(4);
  });
  it('keeps light calendar text above 4.5 contrast across the ramp', () => {
    const luminance = (hex: string) => { const rgb = hex.match(/\w\w/g)!.map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722; };
    for (const color of DENSITY_RAMP) expect((luminance('edf3f8') + 0.05) / (luminance(color.slice(1)) + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});
describe('meteorological wind vectors', () => {
  it('distinguishes where wind comes from and where it moves', () => { expect(windVector(0, 5).rotation).toBe(180); expect(windVector(90, 5).text).toContain('moving toward W'); expect(windVector(360, 5).text).toContain('from N'); });
  it('does not invent direction for calm or missing inputs', () => { expect(windVector(0, 0).rotation).toBeNull(); expect(windVector(null, 5).text).toContain('not supplied'); expect(windVector(500, 5).rotation).toBeNull(); expect(windVector(90, null).text).toBe('Wind unavailable'); });
});
