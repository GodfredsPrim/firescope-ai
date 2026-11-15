export const RESEARCH_AREAS = { ghana: [-3.3, 4.5, 1.3, 11.2], northern: [-3.3, 8.3, 1.3, 11.2], tamale: [-1.4, 8.9, -0.3, 10] };
export function emptyArea() { return { cells: 0, landCells: 0, validLandCells: 0, shortenedCells: 0, burnedCells: 0, burnedKm2: 0, fullPeriodBurnedKm2: 0 }; }
export function summarizeRaster({ burn, qa, width, height, origin, resolution, firstDay, lastDay, areas = RESEARCH_AREAS }) {
  if (burn.length !== width * height || qa.length !== burn.length || resolution[0] <= 0 || resolution[1] >= 0) throw new Error('Invalid raster dimensions or orientation.');
  const result = Object.fromEntries(Object.keys(areas).map(id => [id, emptyArea()]));
  const pixelKm2 = Math.abs(resolution[0] * resolution[1]) / 1e6;
  const radius = 6371007.181, degrees = 180 / Math.PI;
  const entries = Object.entries(areas);
  const minLat = Math.min(...entries.map(([, b]) => b[1])), maxLat = Math.max(...entries.map(([, b]) => b[3]));
  const minLon = Math.min(...entries.map(([, b]) => b[0])), maxLon = Math.max(...entries.map(([, b]) => b[2]));
  for (let row = 0; row < height; row++) {
    const latRadians = (origin[1] + (row + .5) * resolution[1]) / radius;
    const lat = latRadians * degrees;
    if (lat < minLat || lat > maxLat) continue;
    const cos = Math.cos(latRadians);
    const firstCol = Math.max(0, Math.ceil((minLon / degrees * radius * cos - origin[0]) / resolution[0] - .5));
    const lastCol = Math.min(width - 1, Math.floor((maxLon / degrees * radius * cos - origin[0]) / resolution[0] - .5));
    for (let col = firstCol; col <= lastCol; col++) {
      const lon = (origin[0] + (col + .5) * resolution[0]) / (radius * Math.cos(latRadians)) * degrees;
      const i = row * width + col;
      for (const [id, [w, s, e, n]] of entries) {
        if (lon < w || lon > e || lat < s || lat > n) continue;
        const output = result[id]; output.cells++;
        if (!(qa[i] & 1)) continue;
        output.landCells++;
        if (!(qa[i] & 2) || burn[i] < 0 || burn[i] > 366) continue;
        output.validLandCells++;
        const shortened = Boolean(qa[i] & 4);
        if (shortened) output.shortenedCells++;
        if (burn[i] >= firstDay && burn[i] <= lastDay) {
          output.burnedCells++; output.burnedKm2 += pixelKm2;
          if (!shortened) output.fullPeriodBurnedKm2 += pixelKm2;
        }
      }
    }
  }
  return result;
}
