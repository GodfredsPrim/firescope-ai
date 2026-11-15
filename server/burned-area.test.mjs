import { describe, expect, it } from 'vitest';
import { summarizeRaster } from '../scripts/burned-area-math.mjs';
describe('native-grid burned-area interpretation', () => {
  const base = { width: 5, height: 1, origin: [0, 500], resolution: [500, -500], firstDay: 1, lastDay: 31, areas: { test: [-1, -1, 1, 1] } };
  it('excludes invalid land and out-of-month burns, discloses shortened mapping', () => {
    const result = summarizeRaster({ ...base, burn: [10, 20, 15, 40, 0], qa: [3, 7, 1, 3, 0] }).test;
    expect(result).toEqual({ cells: 5, landCells: 4, validLandCells: 3, shortenedCells: 1, burnedCells: 2, burnedKm2: .5, fullPeriodBurnedKm2: .25 });
  });
  it('uses geographic pixel centres and actual native area, not nominal 500 m', () => {
    const result = summarizeRaster({ ...base, width: 1, origin: [0, 463.3127], resolution: [463.3127, -463.3127], burn: [31], qa: [3] }).test;
    expect(result.burnedKm2).toBeCloseTo(0.21465866, 7);
    expect(summarizeRaster({ ...base, burn: [10, 10, 10, 10, 10], qa: [3, 3, 3, 3, 3], areas: { outside: [10, 10, 11, 11] } }).outside.cells).toBe(0);
  });
  it('rejects grid length mismatches instead of manufacturing zeros', () => {
    expect(() => summarizeRaster({ ...base, burn: [1], qa: [3] })).toThrow('Invalid raster');
  });
});
