import type { Observation } from './data';
export type MapGroup = { key: string; latitude: number; longitude: number; records: Observation[]; modis: number; viirs: number };
export function aggregateForMap(records: Observation[], zoom: number): MapGroup[] {
  // Roughly 34 screen pixels per cell at the equator, matching cluster targets.
  const size = 2 ** (6 - zoom) * 0.75;
  const bins = new Map<string, MapGroup>();
  for (const row of records) {
    const key = records.length <= 250 || zoom >= 11 ? row.id : `${Math.floor((row.longitude + 180) / size)},${Math.floor((row.latitude + 90) / size)}`;
    const bin = bins.get(key) ?? { key, latitude: 0, longitude: 0, records: [], modis: 0, viirs: 0 };
    bin.records.push(row); bin.latitude += row.latitude; bin.longitude += row.longitude;
    if (row.sensor === 'MODIS') bin.modis++; else bin.viirs++;
    bins.set(key, bin);
  }
  return [...bins.values()].map(bin => ({ ...bin, latitude: bin.latitude / bin.records.length, longitude: bin.longitude / bin.records.length }));
}
