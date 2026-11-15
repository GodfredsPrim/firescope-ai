import { cellKey, validDate, type Observation } from './data';
import { distanceKm } from './harmonize';
import type { NewsArticle } from './news';

export type Point = [number, number]; // longitude, latitude (GeoJSON order)
export type Polygon = Point[];
export type WeatherPoint = { lat: number; lon: number; source: string; observedAt: string; fetchedAt: string; temperatureC: number | null; humidityPercent: number | null; windMps: number | null; windDirectionDeg?: number | null };
export type LocatedArticle = NewsArticle & { longitude: number; latitude: number; eventAt: string; locationSource: string };
export type DailySeries = { version: 1; polygon: Polygon; method: string; source: string; units: 'occupied_cells'; comparable: boolean; days: { date: string; value: number | null; coverage: 'observed' | 'unknown' }[] };
export const ASSESSMENT_METHOD = 'exploratory-context-v1';
export const DAY = 86400000;
const cross = (a: Point, b: Point, c: Point) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const onSegment = (a: Point, b: Point, p: Point) => Math.abs(cross(a, b, p)) < 1e-10 && p[0] >= Math.min(a[0], b[0]) - 1e-10 && p[0] <= Math.max(a[0], b[0]) + 1e-10 && p[1] >= Math.min(a[1], b[1]) - 1e-10 && p[1] <= Math.max(a[1], b[1]) + 1e-10;
function intersects(a: Point, b: Point, c: Point, d: Point) {
  return (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}
export function validatePolygon(value: unknown): Polygon {
  if (!Array.isArray(value) || value.length < 3 || value.length > 100) throw new Error('Use 3 to 100 polygon vertices in [longitude, latitude] order.');
  const vertices = value.map(p => {
    if (!Array.isArray(p) || p.length !== 2 || !p.every(v => typeof v === 'number' && Number.isFinite(v)) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 85) throw new Error('Coordinates must be finite: longitude -180 to 180, latitude -85 to 85.');
    return [p[0], p[1]] as Point;
  });
  if (vertices.length > 3 && vertices[0].every((v, i) => v === vertices.at(-1)![i])) vertices.pop();
  if (new Set(vertices.map(p => p.join(','))).size !== vertices.length) throw new Error('Polygon vertices must be distinct.');
  if (Math.max(...vertices.map(p => p[0])) - Math.min(...vertices.map(p => p[0])) > 180) throw new Error('Split polygons crossing the antimeridian into separate studies.');
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) {
    if (j === i + 1 || (i === 0 && j === vertices.length - 1)) continue;
    if (intersects(vertices[i], vertices[(i + 1) % vertices.length], vertices[j], vertices[(j + 1) % vertices.length])) throw new Error('Polygon edges must not cross or touch.');
  }
  if (polygonArea(vertices) < 0.01) throw new Error('Select a non-degenerate polygon of at least 0.01 square kilometres.');
  return vertices;
}
export function inPolygon(point: Point, polygon: Polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j], b = polygon[i];
    if (onSegment(a, b, point)) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function polygonArea(polygon: Polygon) {
  const rad = Math.PI / 180;
  return Math.abs(polygon.reduce((sum, p, i) => {
    const next = polygon[(i + 1) % polygon.length];
    return sum + (next[0] - p[0]) * rad * (2 + Math.sin(p[1] * rad) + Math.sin(next[1] * rad));
  }, 0)) * 6371.0088 ** 2 / 2;
}
export const polygonKey = (polygon: Polygon) => JSON.stringify(polygon);
export function samplePoint(polygon: Polygon): Point {
  const average: Point = [polygon.reduce((s, p) => s + p[0], 0) / polygon.length, polygon.reduce((s, p) => s + p[1], 0) / polygon.length];
  return inPolygon(average, polygon) ? average : polygon[0];
}
export function vaporPressureDeficit(temp: number | null, humidity: number | null) {
  if (temp === null || humidity === null || !Number.isFinite(temp + humidity) || temp < -80 || temp > 60 || humidity < 0 || humidity > 100) return null;
  return 0.6108 * Math.exp(17.27 * temp / (temp + 237.3)) * (1 - humidity / 100);
}
export function parseSeries(text: string): DailySeries {
  const value = JSON.parse(text) as DailySeries;
  validatePolygon(value.polygon);
  if (value.version !== 1 || value.units !== 'occupied_cells' || typeof value.comparable !== 'boolean' || typeof value.method !== 'string' || !value.method.trim() || typeof value.source !== 'string' || !value.source.trim() || !Array.isArray(value.days) || value.days.length > 50000) throw new Error('Series requires version 1, polygon, method, source, units occupied_cells, comparable and up to 50,000 daily values.');
  const dates = new Set<string>();
  for (const row of value.days) {
    if (!validDate(row.date) || dates.has(row.date) || !['observed', 'unknown'].includes(row.coverage) || (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0)) || (row.coverage === 'observed' && row.value === null)) throw new Error('Daily dates must be unique and valid, with nonnegative values for observed coverage. Unknown coverage may use null.');
    dates.add(row.date);
  }
  return { ...value, polygon: validatePolygon(value.polygon) };
}
const median = (values: number[]) => { const v = [...values].sort((a, b) => a - b); return v.length % 2 ? v[Math.floor(v.length / 2)] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };
export function detectAnomaly(series: DailySeries | null, polygon: Polygon, end: string, period: 'week' | 'month', now = Date.now()) {
  const unavailable = (reason: string) => ({ status: 'insufficient' as const, reason, current: null as number | null, median: null as number | null, threshold: null as number | null, p: null as number | null, years: [] as number[], alert: false });
  if (!series) return unavailable('Import a comparable daily series with explicit observing coverage. The 50-day study cannot establish weekly or monthly baselines.');
  if (polygonKey(series.polygon) !== polygonKey(polygon)) return unavailable('The series polygon differs from this selection. Recompute the series for these exact vertices.');
  if (!series.comparable) return unavailable('The source does not declare a consistently processed series. Harmonize and review the inputs first.');
  if (!validDate(end)) return unavailable('Choose a valid period-ending date.');
  if (Date.parse(end) >= Date.parse(new Date(now).toISOString().slice(0, 10))) return unavailable('Choose a completed period ending before today (UTC).');
  const last = new Date(`${end}T00:00:00Z`), year = last.getUTCFullYear();
  const rows = new Map(series.days.map(row => [row.date, row]));
  // Compare matching calendar windows; leap-day weeks are omitted in non-leap years.
  const total = (targetYear: number) => {
    const date = period === 'month' ? new Date(Date.UTC(targetYear, last.getUTCMonth() + 1, 0)) : new Date(Date.UTC(targetYear, last.getUTCMonth(), last.getUTCDate()));
    if (date.getUTCMonth() !== last.getUTCMonth()) return null;
    const start = period === 'week' ? new Date(date.getTime() - 6 * DAY) : new Date(Date.UTC(targetYear, last.getUTCMonth(), 1));
    let sum = 0;
    for (let t = start.getTime(); t <= date.getTime(); t += DAY) { const row = rows.get(new Date(t).toISOString().slice(0, 10)); if (!row || row.coverage !== 'observed' || row.value === null) return null; sum += row.value; }
    return sum;
  };
  // Months must be complete, never compare a partial current month to whole years.
  if (period === 'month' && last.getUTCDate() !== new Date(Date.UTC(year, last.getUTCMonth() + 1, 0)).getUTCDate()) return unavailable('Select the last day of a completed month for monthly comparison.');
  const current = total(year);
  if (current === null) return unavailable('The selected period has missing or unknown coverage. No zero filling is performed.');
  const years = [...new Set(series.days.map(row => Number(row.date.slice(0, 4))))].filter(y => y < year).sort((a, b) => a - b);
  const baseline = years.map(y => ({ year: y, value: total(y) })).filter((v): v is { year: number; value: number } => v.value !== null);
  if (baseline.length < 5) return unavailable(`Only ${baseline.length} complete prior-year windows; at least 5 are required.`);
  const centre = median(baseline.map(v => v.value)), mad = median(baseline.map(v => Math.abs(v.value - centre)));
  const threshold = centre + Math.max(3 * 1.4826 * mad, 1);
  const p = (1 + baseline.filter(v => v.value >= current).length) / (baseline.length + 1);
  return { status: 'available' as const, reason: 'Exploratory median/MAD screen. Rank-tail p assumes exchangeable years; not a validated warning or a multiple-testing-adjusted significance claim.', current, median: centre, threshold, p, years: baseline.map(v => v.year), alert: current > threshold };
}
const keywords = {
  wildfire: /\b(wildfire|wildfires|bushfire|bushfires|forest fire|wildland fire)\b/i,
  controlled: /\b(controlled burn|prescribed burn|agricultural burn|crop burning|stubble burning)\b/i,
  industrial: /\b(gas flar(?:e|ing)|refinery|steelworks|industrial thermal|industrial fire)\b/i,
};
export function headlineCategory(title: string) {
  const matches = Object.entries(keywords).filter(([, regex]) => regex.test(title)).map(([key]) => key);
  if (/\b(no|not|false|denies|exercise|drill)\b/i.test(title) || matches.length !== 1) return 'Unclassified';
  return matches[0] === 'wildfire' ? 'Reported wildfire (unverified)' : matches[0] === 'controlled' ? 'Reported agricultural/controlled burn (unverified)' : 'Reported industrial source (unverified)';
}
export function parseLocatedArticles(text: string): LocatedArticle[] {
  const rows = JSON.parse(text);
  if (!Array.isArray(rows) || rows.length > 200) throw new Error('Import an array of at most 200 geolocated articles.');
  return rows.map(row => {
    const url = new URL(row.url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 1000 || !Number.isFinite(row.longitude) || !Number.isFinite(row.latitude) || Math.abs(row.longitude) > 180 || Math.abs(row.latitude) > 90 || typeof row.eventAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(row.eventAt) || !validDate(row.eventAt.slice(0, 10)) || !Number.isFinite(Date.parse(row.eventAt)) || typeof row.locationSource !== 'string' || !row.locationSource.trim()) throw new Error('Each article needs a title, safe URL, coordinates, eventAt in ISO UTC format and locationSource.');
    return { title: row.title, url: url.href, publisher: url.hostname, indexedAt: typeof row.indexedAt === 'string' && Number.isFinite(Date.parse(row.indexedAt)) ? row.indexedAt : null, longitude: row.longitude, latitude: row.latitude, eventAt: new Date(row.eventAt).toISOString(), locationSource: row.locationSource };
  });
}
export function correlate(records: Observation[], articles: LocatedArticle[], polygon: Polygon) {
  return articles.filter(a => inPolygon([a.longitude, a.latitude], polygon)).map(article => {
    const matches = records.filter(row => {
      const time = Date.parse(`${row.date}T${row.time.slice(0, 2)}:${row.time.slice(2)}:00Z`);
      return inPolygon([row.longitude, row.latitude], polygon) && Math.abs(time - Date.parse(article.eventAt)) <= DAY && distanceKm(row, { latitude: article.latitude, longitude: article.longitude } as Observation) <= 10;
    });
    return { article, category: headlineCategory(article.title), recordIds: matches.map(row => row.id), status: matches.length ? 'Spatial/time candidate; human review required' : 'No nearby observation within 10 km / 24 hours' };
  });
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function contextScore(records: Observation[], polygon: Polygon, weather: WeatherPoint | null, articles: LocatedArticle[], now: number, sourceFresh: boolean) {
  const recent = records.filter(row => { const t = Date.parse(`${row.date}T${row.time.slice(0, 2)}:${row.time.slice(2)}:00Z`); return t <= now && t >= now - DAY && inPolygon([row.longitude, row.latitude], polygon); });
  const cells = new Set(recent.map(cellKey)).size, density = cells / polygonArea(polygon) * 1000;
  const vpd = vaporPressureDeficit(weather?.temperatureC ?? null, weather?.humidityPercent ?? null);
  const reasons: string[] = [];
  if (!sourceFresh) reasons.push('Fetch a recent, complete two-product NASA request covering this polygon.');
  if (!recent.some(r => r.sensor === 'MODIS') || !recent.some(r => r.sensor === 'VIIRS')) reasons.push('Both sensors need recent observations; missing detections are not confirmed absence.');
  if (records.some(r => r.synthetic)) reasons.push('Synthetic observations cannot produce a real assessment.');
  if (!weather || !Number.isFinite(Date.parse(weather.observedAt)) || now - Date.parse(weather.observedAt) > 3 * 3600000 || Date.parse(weather.observedAt) > now + 300000 || !inPolygon([weather.lon, weather.lat], polygon) || vpd === null || weather.windMps === null || !Number.isFinite(weather.windMps) || weather.windMps < 0) reasons.push('A valid weather point inside the polygon, observed within 3 hours, is required.');
  const matches = correlate(recent, articles, polygon).filter(m => m.recordIds.length && m.article.eventAt && Date.parse(m.article.eventAt) <= now && Date.parse(m.article.eventAt) >= now - DAY && m.category === 'Reported wildfire (unverified)');
  const unique = [...new Map(matches.map(m => [m.article.url, m])).values()];
  if (!unique.length) reasons.push('No geolocated, recent news candidate matched; news absence is unknown, not zero severity.');
  const severity = unique.length ? Math.max(...unique.map(m => /\b(fatal|killed|evacuat\w*|destroy\w*)\b/i.test(m.article.title) ? 1 : /\b(injur\w*|spread\w*|damage\w*)\b/i.test(m.article.title) ? 0.6 : 0.3)) : null;
  const components = { density: 100 * clamp(density / 10), wind: weather?.windMps != null ? 100 * clamp(weather.windMps / 15) : null, vpd: vpd !== null ? 100 * clamp(vpd / 3) : null, temperature: weather?.temperatureC != null ? 100 * clamp((weather.temperatureC - 10) / 30) : null, news: severity === null ? null : severity * 100 };
  const score = reasons.length ? null : Math.round(0.4 * components.density + 0.2 * components.wind! + 0.2 * components.vpd! + 0.1 * components.temperature! + 0.1 * components.news!);
  return { score, reasons, components, vpd, density, cells, recentRecords: recent.length, matchedNews: unique.length, method: ASSESSMENT_METHOD, basis: 'Aligned occupied-cell density proxy; not validated harmonization or a probability of wildfire. Weights and scales are experimental design choices.' };
}
