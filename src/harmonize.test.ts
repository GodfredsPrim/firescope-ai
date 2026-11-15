import { describe, expect, it } from 'vitest';
import { linkObservations } from './harmonize';
import { key, type Observation } from './data';
const row = (sensor: Observation['sensor'], latitude: number, time: string, date = '2025-01-01'): Observation => {
  const base = { sensor, latitude, longitude: -1, time, date, satellite: sensor, confidence: sensor === 'MODIS' ? '80' : 'n', frp: 10 };
  return { ...base, id: key(base), source: 'Test fixture', synthetic: true };
};
describe('experimental cross-sensor linking', () => {
  it('links once within both tolerances and preserves unique observations', () => {
    const records = [row('MODIS', 9, '1200'), row('VIIRS', 9.001, '1210'), row('VIIRS', 9.002, '1220')];
    const result = linkObservations(records);
    expect(result.links).toHaveLength(1);
    expect(result.links[0].viirsId).toBe(records[1].id);
    expect(result.groups).toBe(2);
    expect(result.days[0]).toMatchObject({ modis: 1, viirs: 2, pairs: 1, groups: 2 });
    expect(records).toHaveLength(3);
  });
  it('does not link beyond distance, time, sensor or UTC-day boundaries', () => {
    expect(linkObservations([row('MODIS', 9, '1200'), row('VIIRS', 10, '1200')]).links).toHaveLength(0);
    expect(linkObservations([row('MODIS', 9, '1200'), row('VIIRS', 9, '1400')]).links).toHaveLength(0);
    expect(linkObservations([row('MODIS', 9, '2350'), row('VIIRS', 9, '0010', '2025-01-02')]).links).toHaveLength(0);
    expect(linkObservations([row('VIIRS', 9, '1200'), row('VIIRS', 9.001, '1210')]).links).toHaveLength(0);
  });
  it('is deterministic across input order and exposes sensitivity', () => {
    const records = [row('VIIRS', 9.012, '1210'), row('MODIS', 9, '1200')];
    expect(linkObservations(records).links).toHaveLength(0);
    expect(linkObservations(records, { radiusKm: 2, minutes: 60 }).links).toHaveLength(1);
    expect(linkObservations(records, { radiusKm: 2, minutes: 60 })).toEqual(linkObservations([...records].reverse(), { radiusKm: 2, minutes: 60 }));
  });
});
