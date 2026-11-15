import Papa from 'papaparse';
import { exportCSV, type Observation } from './data';
import type { CalibrationReport } from './calibration';
import type { Polygon, WeatherPoint, contextScore, detectAnomaly, correlate } from './assessment';
export type Briefing = {
  generatedAt: string; polygon: Polygon; areaKm2: number; dataset: string; sources: string[]; selection: string;
  score: ReturnType<typeof contextScore>; anomaly: ReturnType<typeof detectAnomaly>;
  weather: WeatherPoint | null; news: ReturnType<typeof correlate>; period: string; seriesSource: string;
  calibration?: Pick<CalibrationReport, 'method' | 'factor' | 'trainYears' | 'validationYears' | 'testYears' | 'metrics'>;
};
export function reportLines(report: Briefing): [string, string][] {
  return [
    ['Purpose', 'Research briefing for responder review. Experimental analysis; not an emergency directive or verified incident list.'],
    ['Generated UTC', report.generatedAt], ['Dataset', report.dataset], ['Source products', report.sources.join('; ')], ['Selection', report.selection],
    ['Polygon [longitude, latitude]', JSON.stringify(report.polygon)], ['Approximate area km2', report.areaKm2.toFixed(3)],
    ['Harmonization confidence', report.calibration ? `Experimental only; ${report.calibration.method}; factor ${report.calibration.factor}; fit years ${report.calibration.trainYears.join(', ')}; test years ${report.calibration.testYears.join(', ')}; held-out MAE ${report.calibration.metrics.test.adjustedMAE.toFixed(1)} occupied cells/day. No independently validated confidence percentage.` : 'Not established. MODIS and VIIRS footprints and sensitivity differ; aligned occupancy is not calibrated harmonization.'],
    ['Wildfire Threat Score (experimental)', report.score.score === null ? 'Unavailable' : `${report.score.score}/100; not a probability or validated risk rating`],
    ['Score basis', report.score.basis], ['Score missing inputs', report.score.reasons.join(' ') || 'All experimental input checks passed.'],
    ['Last 24h raw records', String(report.score.recentRecords)], ['Aligned occupied cells per 1000 km2', report.score.density.toFixed(3)],
    ['Score formula', '40% density + 20% wind + 20% VPD + 10% temperature + 10% news. Scale caps: 10 cells/1000 km2, 15 m/s, 3 kPa; temperature (C-10)/30. News 30/60/100 keyword severity. All components clamped 0-100.'],
    ['Component values (0-100)', Object.entries(report.score.components).map(([name, value]) => `${name}: ${value === null ? 'unavailable' : value.toFixed(1)}`).join('; ')],
    ['Weather scope', 'One point inside the polygon; not an area average or historical weather.'],
    ['Weather', report.weather ? `${report.weather.source}; ${report.weather.lat}, ${report.weather.lon}; observed ${report.weather.observedAt}; fetched ${report.weather.fetchedAt}; ${report.weather.temperatureC ?? 'unknown'} C; humidity ${report.weather.humidityPercent ?? 'unknown'}%; wind ${report.weather.windMps ?? 'unknown'} m/s; derived VPD ${report.score.vpd?.toFixed(3) ?? 'unknown'} kPa` : 'Unavailable / not requested'],
    ['Wind direction', report.weather?.windDirectionDeg == null ? 'Not supplied' : `${report.weather.windDirectionDeg} degrees meteorological (direction wind comes from)`],
    ['Historical period', report.period], ['Series source / method', report.seriesSource],
    ['Anomaly status', report.anomaly.status === 'insufficient' ? 'Insufficient data' : report.anomaly.alert ? 'Unusual activity - review evidence' : 'No threshold exceedance in supplied series'],
    ['Anomaly reason', report.anomaly.reason], ['Current / historical median / threshold', `${report.anomaly.current ?? 'unknown'} / ${report.anomaly.median ?? 'unknown'} / ${report.anomaly.threshold ?? 'unknown'} occupied cells summed over represented days`],
    ['Baseline years / rank-tail p', `${report.anomaly.years.join(', ') || 'none'} / ${report.anomaly.p ?? 'unavailable'}; no multiple-testing correction`],
    ['News matching rule', 'User-geolocated event inside polygon; observation within 10 km and 24 hours. Event date differs from indexing date. Keyword categories are unverified; weather cannot confirm cause.'],
    ...report.news.flatMap((match, index): [string, string][] => [[`News ${index + 1}`, match.article.title], ['Publisher URL', match.article.url], ['Event / indexing UTC', `${match.article.eventAt} / ${match.article.indexedAt ?? 'unknown'}`], ['Location evidence', `${match.article.longitude}, ${match.article.latitude}; ${match.article.locationSource}`], ['Candidate interpretation', `${match.category}; ${match.status}; ${match.recordIds.length} candidate records`]]),
    ['News completeness', 'No matching report is not evidence of no fire. Publisher coverage and geolocation may be incomplete.'],
    ['Scientific limits', 'Aligned cells are not independently validated harmonization. Satellite records and candidate links are not unique fires. Coverage, clouds, footprint, overpass timing and sensitivity remain unresolved. Imported coverage and incident locations are user-supplied.'],
    ['Method version', report.score.method],
    ['References', 'NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/ ; OpenWeather: https://openweathermap.org/api/current ; project ASSESSMENT_METHOD.md'],
  ];
}
// Formula injection protection applies to all user-controlled report strings.
export function briefingCSV(report: Briefing) {
  return Papa.unparse({ fields: ['field', 'value'], data: reportLines(report) }, { escapeFormulae: true });
}
export async function downloadBriefingPDF(report: Briefing) {
  const doc = await createBriefingPDF(report);
  doc.save('firescope-research-briefing.pdf');
}
export async function executiveBundle(report: Briefing, observations: Observation[]) {
  const [{ zipSync, strToU8 }, pdf] = await Promise.all([import('fflate'), createBriefingPDF(report)]);
  return zipSync({
    'filtered-hotspots.csv': strToU8(exportCSV(observations)),
    'summary.csv': strToU8(briefingCSV(report)),
    'summary.txt': strToU8(reportLines(report).map(([label, value]) => `${label}\n${value}`).join('\n\n')),
    'summary.pdf': new Uint8Array(pdf.output('arraybuffer')),
    'evidence.json': strToU8(JSON.stringify({ ...report, exportedRecords: observations.length }, null, 2)),
  });
}
let fontRequest: Promise<{ bytes: string; coverage: Set<number> }> | undefined;
function reportFont() {
  if (!fontRequest) fontRequest = Promise.all([fetch('/fonts/source-sans-3-regular.ttf'), fetch('/fonts/coverage.json')]).then(async ([font, coverage]) => {
    if (!font.ok || !coverage.ok) throw new Error('Report font unavailable.');
    const bytes = new Uint8Array(await font.arrayBuffer()); let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return { bytes: btoa(binary), coverage: new Set<number>(await coverage.json()) };
  }).catch(error => { fontRequest = undefined; throw error; });
  return fontRequest;
}
export async function createBriefingPDF(report: Briefing) {
  const [{ jsPDF }, font] = await Promise.all([import('jspdf'), reportFont()]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS('SourceSans3.ttf', font.bytes); doc.addFont('SourceSans3.ttf', 'SourceSans3', 'normal');
  let y = 23;
  doc.setFont('SourceSans3', 'normal'); doc.setFontSize(19); doc.text('FireScope research briefing', 18, y); y += 11;
  doc.setFontSize(10);
  const printable = (value: string) => Array.from(value.replace(/[\r\n\t]/g, ' ')).map(char => font.coverage.has(char.codePointAt(0)!) ? char : `[U+${char.codePointAt(0)!.toString(16).toUpperCase()}]`).join('');
  const newPage = () => { doc.addPage(); y = 23; };
  for (const [label, content] of reportLines(report)) {
    const lines: string[] = doc.splitTextToSize(printable(content), 174);
    if (y + 15 > 278) newPage();
    doc.setFontSize(11); doc.setTextColor(30, 50, 65); doc.text(printable(label), 18, y); y += 5;
    doc.setFontSize(10); doc.setTextColor(30, 30, 30);
    for (const line of lines) { if (y + 5 > 278) newPage(); doc.text(line, 18, y); y += 5; }
    y += 3;
  }
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) { doc.setPage(page); doc.setFontSize(8); doc.setTextColor(80); doc.text(`Experimental - human review required | ${page} / ${total}`, 18, 289); }
  return doc;
}
