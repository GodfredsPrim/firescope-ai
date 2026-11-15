import Papa from 'papaparse';
import { cellKey, type Observation } from './data';

export type LinkOptions = { radiusKm: number; minutes: number };
export type Link = { modisId: string; viirsId: string; date: string; distanceKm: number; minutes: number };
export type ActivityDay = { date: string; modis: number; viirs: number; pairs: number; groups: number; cells: number };
export const DEFAULT_LINK_OPTIONS: LinkOptions = { radiusKm: 1, minutes: 60 };
const earth = 6371.0088;
const radians = (value: number) => value * Math.PI / 180;
function position(record: Observation, width: number) {
  const lat = radians(record.latitude), lon = radians(record.longitude);
  return [earth * Math.cos(lat) * Math.cos(lon), earth * Math.cos(lat) * Math.sin(lon), earth * Math.sin(lat)].map(v => Math.floor(v / width));
}
const timestamp = (r: Observation) => Date.parse(`${r.date}T${r.time.slice(0, 2)}:${r.time.slice(2)}:00Z`) / 60000;
export function distanceKm(a: Observation, b: Observation) {
  const lat = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2;
  const lon = Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(Math.min(1, lat + lon)));
}

// Experimental observation linking, not calibrated sensor harmonization or a
// count of distinct fires. All source records are retained in the dataset.
export function linkObservations(records: Observation[], options = DEFAULT_LINK_OPTIONS) {
  if (options.radiusKm <= 0 || options.minutes <= 0 || !Number.isFinite(options.radiusKm + options.minutes)) throw new Error('Invalid linking parameters');
  const sorted = [...records].sort((a, b) => timestamp(a) - timestamp(b) || a.id.localeCompare(b.id));
  const buckets = new Map<string, Observation[]>();
  for (const row of sorted.filter(r => r.sensor === 'VIIRS')) {
    const point = position(row, options.radiusKm);
    const key = `${point.join(',')},${Math.floor(timestamp(row) / options.minutes)}`;
    const group = buckets.get(key) ?? []; group.push(row); buckets.set(key, group);
  }
  const used = new Set<string>();
  const links: Link[] = [];
  for (const modis of sorted.filter(r => r.sensor === 'MODIS')) {
    const [x, y, z] = position(modis, options.radiusKm), t = Math.floor(timestamp(modis) / options.minutes);
    let best: { row: Observation; distance: number; time: number; score: number } | undefined;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (let dt = -1; dt <= 1; dt++) {
      for (const row of buckets.get(`${x + dx},${y + dy},${z + dz},${t + dt}`) ?? []) {
        if (used.has(row.id) || row.date !== modis.date) continue;
        const time = Math.abs(timestamp(row) - timestamp(modis));
        if (time > options.minutes) continue;
        const distance = distanceKm(modis, row);
        if (distance > options.radiusKm) continue;
        const score = distance / options.radiusKm + time / options.minutes;
        if (!best || score < best.score || (score === best.score && row.id < best.row.id)) best = { row, distance, time, score };
      }
    }
    if (best) {
      used.add(best.row.id);
      links.push({ modisId: modis.id, viirsId: best.row.id, date: modis.date, distanceKm: best.distance, minutes: best.time });
    }
  }
  const days = new Map<string, ActivityDay>();
  const cells = new Map<string, Set<string>>();
  for (const row of sorted) {
    const day = days.get(row.date) ?? { date: row.date, modis: 0, viirs: 0, pairs: 0, groups: 0, cells: 0 };
    day[row.sensor === 'MODIS' ? 'modis' : 'viirs']++;
    days.set(row.date, day);
    const occupied = cells.get(row.date) ?? new Set<string>(); occupied.add(cellKey(row)); cells.set(row.date, occupied);
  }
  for (const link of links) days.get(link.date)!.pairs++;
  for (const day of days.values()) { day.groups = day.modis + day.viirs - day.pairs; day.cells = cells.get(day.date)!.size; }
  return { links, days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)), groups: records.length - links.length };
}

export function activityCSV(records: Observation[], options: LinkOptions) {
  const { days } = linkObservations(records, options);
  return Papa.unparse(days.map(day => ({ utc_date: day.date, modis_detections: day.modis, viirs_detections: day.viirs, candidate_pairs: day.pairs, linked_observation_groups: day.groups, occupied_0_1_degree_cells: day.cells, radius_km: options.radiusKm, time_window_minutes: options.minutes, method: 'experimental-greedy-same-UTC-day-linking', coverage: 'unknown; omitted dates are not confirmed zero', dataset_kind: records.every(r => r.synthetic) ? 'synthetic' : 'observational-unvalidated' })));
}
