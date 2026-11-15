import { cellKey, type Observation } from './data';
import { polygonKey, type DailySeries, type Polygon } from './assessment';
import type { CalibrationReport } from './calibration';
export type RoiMeasure = 'records' | 'cells' | 'adjusted';
export type CalendarValue = { date: string; value: number; coverage: string };
export function roiCalendar(records: Observation[], measure: RoiMeasure, polygon: Polygon, calibration: CalibrationReport | null, series: DailySeries | null): CalendarValue[] {
  if (measure === 'adjusted') {
    if (series?.comparable && polygonKey(series.polygon) === polygonKey(polygon)) return series.days.filter(row => row.coverage === 'observed' && row.value !== null).map(row => ({ date: row.date, value: row.value!, coverage: 'Coverage declared by series owner; not independently verified' }));
    return calibration?.days.map(row => ({ date: row.date, value: row.adjustedCells, coverage: 'Requested sample; observing opportunity unknown' })) ?? [];
  }
  const days = new Map<string, { count: number; cells: Set<string> }>();
  for (const record of records) { const day = days.get(record.date) ?? { count: 0, cells: new Set<string>() }; day.count++; day.cells.add(cellKey(record)); days.set(record.date, day); }
  return [...days].map(([date, day]) => ({ date, value: measure === 'records' ? day.count : day.cells.size, coverage: 'Observing opportunity unknown' })).sort((a, b) => a.date.localeCompare(b.date));
}
export function roiPeriods(days: CalendarValue[]) {
  const months = new Map<string, { value: number; days: number }>(), years = new Map<string, { value: number; days: number }>();
  for (const row of days) {
    for (const [map, key] of [[months, row.date.slice(0, 7)], [years, row.date.slice(0, 4)]] as const) { const period = map.get(key) ?? { value: 0, days: 0 }; period.value += row.value; period.days++; map.set(key, period); }
  }
  return { months, years };
}
// Sequential blue ramp: intensity is also printed numerically and unknown uses '?'.
export const DENSITY_RAMP = ['#142438', '#1a304a', '#214563', '#285576', '#30658d'];
export function rampLevel(value: number | undefined, max: number) { return value === undefined ? -1 : value === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil(value / Math.max(max, 1) * 4))); }
export function windVector(degrees: number | null | undefined, speed: number | null) {
  if (speed === null || !Number.isFinite(speed) || speed < 0) return { text: 'Wind unavailable', rotation: null };
  if (speed === 0) return { text: 'Calm (0 m/s)', rotation: null };
  if (degrees === null || degrees === undefined || !Number.isFinite(degrees) || degrees < 0 || degrees > 360) return { text: `${speed} m/s; direction not supplied`, rotation: null };
  const bearing = degrees % 360, compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return { text: `${speed} m/s from ${compass[Math.round(bearing / 45) % 8]} (${bearing}°); moving toward ${compass[Math.round(((bearing + 180) % 360) / 45) % 8]}`, rotation: (bearing + 180) % 360 };
}
