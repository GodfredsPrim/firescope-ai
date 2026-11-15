import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { ArrowDownToLine } from 'lucide-react';
import { saveFile } from './AnalysisPanel';
import type { WorkspaceData } from './useWorkspaceData';
import { regions } from './data';

type Daily = { date: string; modis: number; viirs: number };
type HistoryMonth = { month: string; requestedDays: number; areas: Record<string, Daily[]> };
type History = { version: number; fetchedAt: string; requestedDays: number; months: HistoryMonth[]; method: string };
type BurnArea = { landCells: number; validLandCells: number; shortenedCells: number; burnedCells: number; burnedKm2: number; fullPeriodBurnedKm2: number };
type Burn = { version: number; retrievedAt: string; months: { month: string; areas: Record<string, BurnArea> }[]; method: string; documentation: string };
export default function HistoryResearch({ data }: { data: WorkspaceData }) {
  const [history, setHistory] = useState<History | null>(null), [burn, setBurn] = useState<Burn | null>(null);
  const [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [year, setYear] = useState('2025'), [area, setArea] = useState<'ghana' | 'northern' | 'tamale'>('ghana');
  useEffect(() => {
    const abort = new AbortController(); setError('');
    void Promise.all(['/data/history/manifest.json', '/data/burned-area/manifest.json'].map(async path => {
      const response = await fetch(path, { signal: abort.signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('json')) throw new Error('The saved research archive could not be loaded. Retry when connected.');
      const body = await response.json();
      if (body.version !== 1 || !Array.isArray(body.months) || body.months.length !== 24 || new Set(body.months.map((m: { month: string }) => m.month)).size !== 24) throw new Error('The research archive failed its format check.');
      return body;
    })).then(([h, b]) => { if (!abort.signal.aborted) { setHistory(h); setBurn(b); } }).catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Archive unavailable.'); });
    return () => abort.abort();
  }, [retry]);
  const rows = history?.months.filter(m => m.month.startsWith(year)).map(month => {
    const days = month.areas[area];
    return { month: month.month, requestedDays: month.requestedDays, modis: days.reduce((s, d) => s + d.modis, 0), viirs: days.reduce((s, d) => s + d.viirs, 0), burned: burn?.months.find(m => m.month === month.month)?.areas[area] };
  }) ?? [];
  const number = (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
  const percent = (n: number, d: number) => d ? `${number(100 * n / d)}%` : 'Unknown';
  const exportMonthly = () => saveFile(Papa.unparse(rows.map(r => ({ month_utc: r.month, area: regions[area].name, bounds: regions[area].bounds.join(' '), modis_detections: r.modis, viirs_detections: r.viirs, requested_days_both_products: r.requestedDays, mapped_burned_km2: r.burned?.burnedKm2 ?? '', full_period_only_burned_km2: r.burned?.fullPeriodBurnedKm2 ?? '', valid_land_cells: r.burned?.validLandCells ?? '', total_land_cells: r.burned?.landCells ?? '', shortened_mapping_cells: r.burned?.shortenedCells ?? '', interpretation: 'Detections are not unique fires. MCD64A1 is mapped burned area, not independent truth. Completed FIRMS requests do not establish cloud-free observing opportunity.', history_retrieved: history?.fetchedAt, burned_retrieved: burn?.retrievedAt }))), `firescope-${area}-${year}-monthly-comparison.csv`, 'text/csv;charset=utf-8');
  const exportDaily = () => saveFile(Papa.unparse(history!.months.filter(m => m.month.startsWith(year)).flatMap(m => m.areas[area].map(d => ({ ...d, area: regions[area].name, both_product_requests_completed: true, coverage: 'Cloud-free observing opportunity unknown; zero means no returned detections, not no burning.' })))), `firescope-${area}-${year}-daily-history.csv`, 'text/csv;charset=utf-8');
  return <section className="history-research" aria-labelledby="history-research-title">
    <div className="panel-heading"><div><h2 id="history-research-title">Historical archive & burned area</h2><p>Full calendar months in 2024 and 2025. Compare satellite detections with NASA mapped burned area.</p></div></div>
    {error ? <div className="research-loading" role="status"><p>{error}</p><button className="secondary" onClick={() => setRetry(r => r + 1)}>Retry research archive</button></div> : !history || !burn ? <p className="research-loading" role="status">Loading the saved NASA research archive…</p> : <>
      <div className="research-controls"><label>Research area<select value={area} onChange={e => setArea(e.target.value as typeof area)}>{(['ghana', 'northern', 'tamale'] as const).map(id => <option key={id} value={id}>{regions[id].name}</option>)}</select></label><label>Research year<select value={year} onChange={e => setYear(e.target.value)}><option>2025</option><option>2024</option></select></label><p>{history.requestedDays} days requested across two years. Rectangular study extents, not administrative boundaries. These controls apply to this comparison.</p></div>
      <div className="research-table" role="region" aria-label="Monthly detections and mapped burned area" tabIndex={0}><table><caption>{regions[area].name}, {year} UTC. Counts and km² describe different measurements.</caption><thead><tr><th scope="col">Month</th><th scope="col">MODIS detections</th><th scope="col">VIIRS detections</th><th scope="col">Mapped burned km²</th><th scope="col">Valid land cells</th><th scope="col">Shortened period¹</th><th scope="col">Source records</th></tr></thead><tbody>{rows.map(r => <tr key={r.month}><th scope="row">{r.month}</th><td>{number(r.modis)}</td><td>{number(r.viirs)}</td><td>{r.burned ? number(r.burned.burnedKm2) : 'Unavailable'}</td><td>{r.burned ? percent(r.burned.validLandCells, r.burned.landCells) : 'Unknown'}</td><td>{r.burned ? percent(r.burned.shortenedCells, r.burned.validLandCells) : 'Unknown'}</td><td><button className="text-action" disabled={data.loading} onClick={async () => { if (await data.load(`archive:${r.month}`)) data.setArea(regions[area].name, regions[area].bounds); }} aria-label={`Load ${r.month} source observations for ${regions[area].name}`}>Load month</button></td></tr>)}</tbody></table></div>
      <div className="research-notes"><p><strong>Read the measures separately.</strong> Detections are thermal observations, not unique fires or burned area. MCD64A1.061 is a nominal 500 m monthly product; smaller burns can be missed. Its algorithm uses MODIS active-fire inputs, so this comparison is not independent validation.</p><p>Valid land cells passed the product’s land and valid-data flags. ¹Shortened period is the share of valid land cells for which reliable mapping did not cover the whole month. Their mapped burns remain included; the export also includes a full-period-only sensitivity total. Missing land cells are excluded, not counted as unburned. Completed FIRMS requests do not establish cloud-free observing opportunity.</p><p><strong>Unavailable means missing source tiles.</strong> No area total is estimated unless all four required tiles are present in the public mirror. This is not evidence of no burning.</p><p>Load a month to inspect its original observations in the calendar and map. This replaces the active dataset; the frozen five-year calibration study remains separate.</p></div>
      <div className="research-exports"><button className="secondary" onClick={exportMonthly}><ArrowDownToLine size={15} />Export monthly comparison</button><button className="secondary" onClick={exportDaily}><ArrowDownToLine size={15} />Export daily history</button><button className="text-action" onClick={() => saveFile(JSON.stringify({ history, burnedArea: burn }, null, 2), 'firescope-history-provenance.json', 'application/json')}>Download source manifest</button></div>
      <details className="research-method"><summary>Sources, dates & calculation</summary><p>FIRMS archive retrieved {history.fetchedAt.slice(0, 10)}; burned-area rasters retrieved {burn.retrievedAt.slice(0, 10)}. Source URLs, product identifiers and SHA-256 checksums are in the downloadable manifest.</p><p>{history.method}</p><p>{burn.method}</p><a href={burn.documentation} target="_blank" rel="noreferrer">NASA burned-area user guide</a> · <a href="https://planetarycomputer.microsoft.com/dataset/modis-64A1-061" target="_blank" rel="noreferrer">MCD64A1 mirror catalogue</a></details>
    </>}
  </section>;
}
