import { describe, expect, it } from 'vitest';
import { contextScore, correlate, detectAnomaly, headlineCategory, inPolygon, parseLocatedArticles, parseSeries, polygonArea, validatePolygon, vaporPressureDeficit, type DailySeries, type LocatedArticle, type Polygon, type WeatherPoint } from './assessment';
import type { Observation } from './data';
import { briefingCSV, type Briefing } from './assessmentReport';
const polygon: Polygon = [[0, 0], [1, 0], [1, 1], [0, 1]];
const now = Date.parse('2026-11-12T12:00:00Z');
const row = (sensor: 'MODIS' | 'VIIRS', date = '2026-11-12'): Observation => ({ id: sensor, sensor, date, time: '1100', latitude: 0.5, longitude: 0.5, satellite: 'test', confidence: 'n', frp: 1, source: 'synthetic test fixture' });
const weather: WeatherPoint = { lat: 0.5, lon: 0.5, observedAt: '2026-11-12T11:00:00Z', fetchedAt: '2026-11-12T12:00:00Z', temperatureC: 30, humidityPercent: 20, windMps: 10, source: 'synthetic test fixture' };
const article: LocatedArticle = { title: 'Wildfire forces evacuation', url: 'https://example.org/fire', publisher: 'example.org', eventAt: '2026-11-12T10:00:00Z', indexedAt: null, longitude: 0.5, latitude: 0.5, locationSource: 'synthetic test fixture' };
function series(): DailySeries {
  const days: DailySeries['days'] = [];
  for (let year = 2020; year <= 2026; year++) for (let day = 1; day <= 7; day++) days.push({ date: `${year}-01-0${day}`, value: year === 2026 ? 10 : 1, coverage: 'observed' });
  return { version: 1, polygon, method: 'synthetic-test-method', source: 'synthetic test fixture', units: 'occupied_cells', comparable: true, days };
}
describe('polygon spatial contract', () => {
  it('includes boundaries and handles concave polygons', () => {
    expect(inPolygon([0, 0.5], polygon)).toBe(true);
    expect(inPolygon([1.1, 0.5], polygon)).toBe(false);
    expect(inPolygon([0.8, 0.8], [[0, 0], [1, 0], [0.4, 0.4], [0, 1]])).toBe(false);
    expect(polygonArea(polygon)).toBeGreaterThan(12000);
    expect(validatePolygon([...polygon, polygon[0]])).toEqual(polygon);
  });
  it('rejects invalid topology and unsupported global geometries', () => {
    for (const shape of [[[0, 0], [1, 1], [0, 1], [1, 0]], [[179, 0], [-179, 0], [179, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [1, 0], [0, 90]], [[0, 0], [1, 0], [0, 0]]]) expect(() => validatePolygon(shape)).toThrow();
  });
});
describe('coverage-aware anomaly screen', () => {
  it('computes a prior-only baseline and flags unusual activity', () => {
    const result = detectAnomaly(series(), polygon, '2026-01-07', 'week', now);
    expect(result.current).toBe(70); expect(result.median).toBe(7); expect(result.threshold).toBe(8); expect(result.alert).toBe(true);
    expect(result.years).not.toContain(2026); expect(result.p).toBeCloseTo(1 / 7);
  });
  it('never zero-fills, mixes regions or uses future/current incomplete dates', () => {
    const value = series(); value.days[0].coverage = 'unknown'; value.days.splice(8, 1);
    expect(detectAnomaly(value, polygon, '2026-01-07', 'week', now).status).toBe('insufficient');
    expect(detectAnomaly(series(), [[0, 0], [2, 0], [0, 2]], '2026-01-07', 'week', now).status).toBe('insufficient');
    expect(detectAnomaly(series(), polygon, '2026-11-12', 'week', now).status).toBe('insufficient');
    expect(detectAnomaly(series(), polygon, '2026-01-07', 'month', now).status).toBe('insufficient');
    expect(detectAnomaly(null, polygon, '2026-01-07', 'week', now).alert).toBe(false);
  });
  it('compares complete February months across leap years', () => {
    const value = series(); value.days = [];
    for (let year = 2020; year <= 2026; year++) for (let day = 1; day <= new Date(Date.UTC(year, 2, 0)).getUTCDate(); day++) value.days.push({ date: `${year}-02-${String(day).padStart(2, '0')}`, value: 1, coverage: 'observed' });
    const result = detectAnomaly(value, polygon, '2026-02-28', 'month', now);
    expect(result.years).toHaveLength(6); expect(result.current).toBe(28);
    value.days = value.days.filter(d => d.date !== '2024-02-29');
    expect(detectAnomaly(value, polygon, '2026-02-28', 'month', now).years).not.toContain(2024);
  });
  it('validates imported daily values and coverage', () => {
    const value = series(); expect(parseSeries(JSON.stringify(value)).days).toHaveLength(49);
    value.days.push(value.days[0]); expect(() => parseSeries(JSON.stringify(value))).toThrow();
    expect(() => parseSeries(JSON.stringify({ ...series(), days: [{ date: '2025-02-30', value: 0, coverage: 'observed' }] }))).toThrow();
  });
});
describe('news correlation preserves uncertainty', () => {
  it('uses both spatial and event-time proximity', () => {
    expect(correlate([row('MODIS')], [article], polygon)[0].recordIds).toEqual(['MODIS']);
    expect(correlate([row('MODIS', '2025-01-01')], [article], polygon)[0].recordIds).toEqual([]);
    expect(correlate([{ ...row('MODIS'), longitude: 0.9 }], [article], polygon)[0].recordIds).toEqual([]);
  });
  it('never verifies cause from keywords, conflicts or negation', () => {
    expect(headlineCategory(article.title)).toBe('Reported wildfire (unverified)');
    expect(headlineCategory('No wildfire reported')).toBe('Unclassified');
    expect(headlineCategory('Wildfire near prescribed burn')).toBe('Unclassified');
    expect(headlineCategory('Gas flaring at refinery')).toContain('industrial');
    expect(headlineCategory('Prescribed burn announced')).toContain('controlled');
  });
  it('rejects unsafe links and missing event evidence', () => {
    expect(parseLocatedArticles(JSON.stringify([article]))).toHaveLength(1);
    expect(() => parseLocatedArticles(JSON.stringify([{ ...article, url: 'javascript:alert(1)' }]))).toThrow();
    expect(() => parseLocatedArticles(JSON.stringify([{ ...article, locationSource: '' }]))).toThrow();
  });
});
describe('experimental score gating', () => {
  it('computes VPD with explicit physical input bounds', () => {
    expect(vaporPressureDeficit(30, 100)).toBe(0); expect(vaporPressureDeficit(30, 20)).toBeCloseTo(3.394, 2);
    expect(vaporPressureDeficit(null, 20)).toBeNull(); expect(vaporPressureDeficit(30, 101)).toBeNull();
  });
  it('returns bounded score only with temporally and spatially eligible inputs', () => {
    const result = contextScore([row('MODIS'), row('VIIRS')], polygon, weather, [article], now, true);
    expect(result.score).not.toBeNull(); expect(result.score).toBeGreaterThanOrEqual(0); expect(result.score).toBeLessThanOrEqual(100); expect(result.cells).toBe(1);
    expect(contextScore([row('MODIS'), row('VIIRS')], polygon, weather, [], now, true).score).toBeNull();
    expect(contextScore([row('MODIS'), row('VIIRS')], polygon, weather, [article], now, false).score).toBeNull();
    expect(contextScore([row('MODIS'), row('VIIRS')], polygon, { ...weather, observedAt: '2025-01-01' }, [article], now, true).score).toBeNull();
    expect(contextScore([row('MODIS'), row('VIIRS')], polygon, { ...weather, lon: 10 }, [article], now, true).score).toBeNull();
    expect(contextScore([{ ...row('MODIS'), synthetic: true }, row('VIIRS')], polygon, weather, [article], now, true).score).toBeNull();
  });
  it('protects report CSV from spreadsheet formula injection', () => {
    const briefing: Briefing = { generatedAt: new Date(now).toISOString(), polygon, areaKm2: polygonArea(polygon), dataset: '=HYPERLINK("bad")', sources: [], selection: 'fixture', score: contextScore([], polygon, null, [], now, false), anomaly: detectAnomaly(null, polygon, '2026-01-07', 'week', now), weather: null, news: [], period: 'week', seriesSource: 'none' };
    expect(briefingCSV(briefing)).toContain("'=HYPERLINK");
    expect(briefingCSV(briefing)).toContain('Insufficient data');
  });
});
