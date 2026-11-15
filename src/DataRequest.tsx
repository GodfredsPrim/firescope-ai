import { useState } from 'react';
import { Search, Upload, ChevronDown } from 'lucide-react';

export type FireRequest = { from: string; to: string; mode: string; bounds: string };
export default function DataRequest({ loading, hasData, onLoad, onLatest, onExample, onImport }: { loading: boolean; hasData: boolean; onLoad: (request: FireRequest) => void; onLatest: () => void; onExample: () => void; onImport: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(today), [mode, setMode] = useState('nrt');
  const [bounds, setBounds] = useState(['-3.3', '4.5', '1.3', '11.2']);
  const [error, setError] = useState('');
  return <section className={`data-request ${hasData ? 'has-data' : ''}`} aria-labelledby="request-title">
    <div className="request-intro"><div><h2 id="request-title">Choose your observation window</h2><p>Load NASA data, compare sensors, then explore the burning activity calendar.</p></div><button className="primary" disabled={loading} onClick={onLatest}>{loading ? 'Loading observations…' : 'Load latest NASA data'}</button></div>
    <details><summary>Search an area and date range <ChevronDown size={16} /></summary>
      <form onSubmit={event => {
        event.preventDefault();
        const n = bounds.map(Number), duration = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
        if (!Number.isFinite(duration) || duration < 1 || duration > 10) { setError('Choose 1-10 days per API search. Use CSV import for a longer historical record.'); return; }
        if (bounds.some(v => !v.trim()) || n.some(v => !Number.isFinite(v)) || n[0] >= n[2] || n[1] >= n[3]) { setError('Enter a valid rectangle: west < east and south < north.'); return; }
        setError(''); onLoad({ from, to, mode, bounds: bounds.join(',') });
      }}>
        <div className="request-fields"><label>From (UTC)<input type="date" value={from} max={today} required onChange={e => setFrom(e.target.value)} /></label><label>To (UTC)<input type="date" value={to} max={today} required onChange={e => setTo(e.target.value)} /></label><label>NASA product<select aria-label="NASA product" value={mode} onChange={e => setMode(e.target.value)}><option value="nrt">Near-real-time</option><option value="archive">Standard processing / archive</option></select></label></div>
        <div className="request-bounds">{['West longitude', 'South latitude', 'East longitude', 'North latitude'].map((label, i) => <label key={label}>{label}<input type="number" step="any" min={i % 2 ? -90 : -180} max={i % 2 ? 90 : 180} value={bounds[i]} required onChange={e => setBounds(bounds.map((value, index) => index === i ? e.target.value : value))} /></label>)}</div>
        <p>Defaults to the Ghana study extent. Rectangular areas only; up to 10 days and 400 square degrees per request. Standard processing is preferable for historical research; availability varies by product.</p>
        {error && <p role="alert" className="range-error">{error}</p>}
        <button className="primary" disabled={loading} type="submit"><Search size={16} />{loading ? 'Loading observations…' : 'Search NASA observations'}</button>
      </form>
    </details>
    <div className="request-alternatives"><button onClick={() => onLoad({ from: '2025-01-01', to: '2025-01-03', mode: 'archive', bounds: '-3.3,4.5,1.3,11.2' })} disabled={loading}>Explore historical NASA data <span>Ghana, 1-3 Jan 2025; both sensor products</span></button><button onClick={onExample} disabled={loading}>Try example data <span>Clearly labeled synthetic observations</span></button><button onClick={onImport} disabled={loading}><Upload size={16} />Import historical CSV <span>For longer records and multiple years</span></button></div>
    <p className="request-replace">Loading replaces the current dataset. Filters below refine loaded observations.</p>
  </section>;
}
