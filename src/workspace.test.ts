import { describe, expect, it } from 'vitest';
import { aggregateForMap } from './mapAggregation';
import { periodBins } from './activitySeries';
import { sampleData } from './data';
describe('workspace visualization boundaries', () => {
  it('aggregates without losing sensor counts and expands to raw records at close zoom', () => {
    const rows = sampleData().slice(0, 300).map((row, i) => ({ ...row, id: `fixture-${i}`, latitude: 9.4, longitude: -0.8 }));
    const groups = aggregateForMap(rows, 6);
    expect(groups).toHaveLength(1); expect(groups[0].modis + groups[0].viirs).toBe(300);
    expect(aggregateForMap(rows, 11)).toHaveLength(300);
  });
  it('does not manufacture zero observation dates for a missing baseline', () => {
    const rows = sampleData().slice(0, 2).map(row => ({ ...row, date: '2025-01-01' }));
    const result = periodBins(rows, '2025-01-01', '2025-01-03');
    expect(result.monthly).toBe(false); expect(result.bins).toHaveLength(1); expect(result.bins[0].date).toBe('2025-01-01');
  });
});
