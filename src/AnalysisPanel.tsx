import { useMemo } from 'react';
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react';
import { activityCSV, linkObservations, type LinkOptions } from './harmonize';
import { type Observation } from './data';

export function saveFile(content: string, filename: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function AnalysisPanel({ records, options, onOptions, onDate, scope, quality }: {
  records: Observation[]; options: LinkOptions; onOptions: (next: LinkOptions) => void; onDate: (date: string) => void;
  scope: { area: string; bounds: readonly number[]; from: string; to: string };
  quality: { rejectedRows: number; duplicateRowsRemoved: number; scope: string };
}) {
  const analysis = useMemo(() => linkObservations(records, options), [records, options]);
  const wider = useMemo(() => linkObservations(records, { radiusKm: options.radiusKm * 2, minutes: options.minutes }), [records, options]);
  const modis = records.filter(r => r.sensor === 'MODIS').length;
  const viirs = records.length - modis;
  const peakDays = [...analysis.days].sort((a, b) => b.groups - a.groups || a.date.localeCompare(b.date)).slice(0, 5);
  const sources = [...new Set(records.map(r => r.source))];
  const exportReport = () => saveFile(JSON.stringify({
    generated_at: new Date().toISOString(), dataset_kind: records.every(r => r.synthetic) ? 'synthetic' : 'observational-unvalidated',
    method: 'Greedy one-to-one MODIS to VIIRS linking within the same UTC day; ordered by timestamp then source ID; lowest normalized distance + time score wins.',
    parameters: options, records: records.length, candidate_pairs: analysis.links.length, linked_observation_groups: analysis.groups,
    selection: scope, ingestion_quality: quality, sources, observations: records, daily_activity: analysis.days, candidate_links: analysis.links,
    limitations: ['Experimental linking, not calibrated harmonization or distinct fire counts.', 'Same-day linking excludes matches across UTC midnight.', 'Unmatched records retained; confidence scales are not normalized.', 'No correction for view angle, footprint, coverage, cloud, overpass cadence or sensor sensitivity.', 'No validated accuracy, forecasts, emergency alerts or multi-year anomaly baseline.'],
    validation_status: 'Software behavior tested; scientific performance not yet evaluated on held-out reference data.',
  }, null, 2), 'firescope-analysis.json', 'application/json');
  return <section className="link-analysis" aria-labelledby="link-title">
    <div className="panel-heading"><div><h2 id="link-title">Cross-sensor observation linking</h2><p>Inspect candidate overlaps without discarding either sensor’s source observations.</p></div><span className="tag">Experimental method</span></div>
    <div className="link-controls">
      <label>Maximum distance<select value={options.radiusKm} onChange={e => onOptions({ ...options, radiusKm: Number(e.target.value) })}><option value={0.5}>0.5 km</option><option value={1}>1 km</option><option value={2}>2 km</option></select></label>
      <label>Maximum time difference<select value={options.minutes} onChange={e => onOptions({ ...options, minutes: Number(e.target.value) })}><option value={30}>30 minutes</option><option value={60}>60 minutes</option><option value={120}>120 minutes</option></select></label>
      <p>Same UTC day. One MODIS record links to at most one VIIRS record. Tolerances are exploratory settings, not NASA-prescribed thresholds.</p>
    </div>
    <dl className="link-metrics">
      <div><dt>Candidate pairs</dt><dd>{analysis.links.length.toLocaleString()}</dd></div>
      <div><dt>Unpaired MODIS</dt><dd>{(modis - analysis.links.length).toLocaleString()}</dd></div>
      <div><dt>Unpaired VIIRS</dt><dd>{(viirs - analysis.links.length).toLocaleString()}</dd></div>
      <div><dt>Linked observation groups</dt><dd>{analysis.groups.toLocaleString()}</dd></div>
    </dl>
    <div className="analysis-explanation"><p>A group is one candidate pair or one unpaired record. Groups are not unique fires. {modis && viirs ? `Doubling distance to ${options.radiusKm * 2} km changes the candidate pairs from ${analysis.links.length} to ${wider.links.length}.` : 'Load observations from both sensors to evaluate cross-sensor links.'}</p><p>No coverage or sensitivity correction is applied. A zero match count does not prove that the sensors disagree.</p></div>
    <div className="activity-ranking"><h3>Highest observed daily activity</h3><p>Ranked within this loaded selection. This is not a multi-year anomaly or fire-risk assessment.</p>
      {peakDays.length ? <ol>{peakDays.map(day => <li key={day.date}><button onClick={() => onDate(day.date)}><time>{day.date}</time><span>{day.groups} observation groups</span><ArrowUpRight size={16} /></button></li>)}</ol> : <p>Load or import data to examine the daily pattern.</p>}
    </div>
    <div className="analysis-downloads"><button className="secondary" disabled={!records.length} onClick={() => saveFile(activityCSV(records, options), 'firescope-daily-activity.csv', 'text/csv;charset=utf-8')}><ArrowDownToLine size={16} />Export activity calendar</button><button className="secondary" disabled={!records.length} onClick={exportReport}><ArrowDownToLine size={16} />Export analysis evidence</button></div>
  </section>;
}
