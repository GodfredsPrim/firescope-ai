import type { Observation } from './data';
export function rawDailyActivity(records: Observation[]) {
  const days = new Map<string, { date: string; modis: number; viirs: number }>();
  for (const row of records) { const day = days.get(row.date) ?? { date: row.date, modis: 0, viirs: 0 }; day[row.sensor === 'MODIS' ? 'modis' : 'viirs']++; days.set(row.date, day); }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function periodBins(records: Observation[], from: string, to: string) {
  const daily = rawDailyActivity(records);
  const monthly = (Date.parse(to) - Date.parse(from)) / 86400000 > 45;
  const bins = new Map<string, { date: string; modis: number; viirs: number }>();
  for (const day of daily) { const date = monthly ? day.date.slice(0, 7) : day.date; const bin = bins.get(date) ?? { date, modis: 0, viirs: 0 }; bin.modis += day.modis; bin.viirs += day.viirs; bins.set(date, bin); }
  return { monthly, bins: [...bins.values()] };
}
