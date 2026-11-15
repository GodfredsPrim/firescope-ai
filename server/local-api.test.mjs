import { describe, expect, it } from 'vitest';
import { parseFireRequest } from './local-api.mjs';
const request = query => new URL(`http://localhost/api/fires/search?${query}`);
describe('bounded NASA requests', () => {
  it('accepts explicit archive intervals and preserves area and dates', () => {
    expect(parseFireRequest(request('from=2025-01-01&to=2025-01-10&mode=archive&bounds=-3,5,1,10'))).toEqual({ from: '2025-01-01', to: '2025-01-10', count: 10, mode: 'archive', bounds: [-3, 5, 1, 10] });
  });
  it('rejects invalid dates, excessive ranges and malformed areas before upstream calls', () => {
    for (const query of ['from=2025-02-30&to=2025-03-01', 'from=2025-01-01&to=2025-01-31', 'bounds=-180,-90,180,90', 'bounds=-3,,1,10', 'mode=unexpected', 'to=invalid']) expect(() => parseFireRequest(request(query))).toThrow();
  });
});
