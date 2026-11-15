import { apiFetch } from './hosting';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CloudSun, HelpCircle, X } from 'lucide-react';
import type { WorkspaceData } from './useWorkspaceData';
export const utc = (value: string) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC' : 'Timestamp unavailable';
export function Help({ term, children }: { term: string; children: string }) {
  return <details className="inline-help"><summary aria-label={`About ${term}`}><HelpCircle size={14} /></summary><div role="note"><strong>{term}</strong><p>{children}</p></div></details>;
}
export function ScopeLine({ data, stage = 'Raw NASA observations', selectedDay = false }: { data: WorkspaceData; stage?: string; selectedDay?: boolean }) {
  return <div className="scope-line" aria-label="Data coverage and provenance"><span>{data.areaName} <span className="scope-coordinates">[{data.bounds.map(v => v.toFixed(2)).join(', ')}]</span></span><span>{selectedDay && data.day ? data.day : `${data.start} to ${data.end}`} UTC</span><span>{data.sensor === 'all' ? 'MODIS + VIIRS' : data.sensor}</span><span>{data.info?.kind === 'synthetic' ? 'Synthetic demonstration' : stage}</span><span>Coverage unknown</span>{data.info && <span>{data.info.kind === 'snapshot' ? 'Snapshot retrieved' : 'Loaded'} {utc(data.info.fetchedAt)}</span>}</div>;
}
type Weather = { source: string; observedAt: string; fetchedAt: string; temperatureC: number | null; humidityPercent: number | null; windMps: number | null; rain1hMm: number | null; snow1hMm: number | null; location: string | null; conditions: string | null };
function WeatherContext({ lat, lon, historical }: { lat: number; lon: number; historical: boolean }) {
  const [weather, setWeather] = useState<Weather>(), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); setWeather(undefined); setError('');
    apiFetch(`/api/weather/current?${new URLSearchParams({ lat: String(lat), lon: String(lon) })}`, { signal: AbortSignal.any([abort.signal, AbortSignal.timeout(20000)]) })
      .then(async response => { const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Weather unavailable.'); return value; })
      .then(value => { if (!abort.signal.aborted) setWeather(value); })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Weather context unavailable.'); });
    return () => abort.abort();
  }, [lat, lon, retry]);
  return <div className="weather-context">
    <p>{historical ? 'Current conditions only. Historical weather access is not configured; these conditions do not describe the selected historical observations.' : 'Current point conditions, not an area-wide average or a fire-risk prediction.'}</p>
    <p className="coordinate-caption">{lat.toFixed(3)}°, {lon.toFixed(3)}°</p>
    {error ? <div role="status"><p>{error}</p><button className="text-action" onClick={() => setRetry(n => n + 1)}>Retry weather</button></div> : !weather ? <div className="skeleton weather-skeleton" role="status" aria-label="Loading current weather" /> : <>
      <dl className="weather-values"><div><dt>Temperature</dt><dd>{weather.temperatureC ?? 'Not reported'}{weather.temperatureC !== null && ' °C'}</dd></div><div><dt>Humidity</dt><dd>{weather.humidityPercent ?? 'Not reported'}{weather.humidityPercent !== null && ' %'}</dd></div><div><dt>Wind</dt><dd>{weather.windMps ?? 'Not reported'}{weather.windMps !== null && ' m/s'}</dd></div><div><dt>Rain, last hour</dt><dd>{weather.rain1hMm === null ? 'Not reported' : `${weather.rain1hMm} mm`}</dd></div>{weather.snow1hMm !== null && <div><dt>Snow, last hour</dt><dd>{weather.snow1hMm} mm</dd></div>}</dl>
      <p>{weather.conditions} {weather.location ? `near ${weather.location}` : ''}</p><p className="source-caption">{weather.source}<br />Observed {utc(weather.observedAt)}<br />Fetched {utc(weather.fetchedAt)}</p>
    </>}
  </div>;
}
export function InsightPanel({ data, onLab, onRecords }: { data: WorkspaceData; onLab: () => void; onRecords: () => void }) {
  const [weatherOpen, setWeatherOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const r = data.selected;
  useEffect(() => { if (r) { heading.current?.focus({ preventScroll: true }); if (window.innerWidth < 820) heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); } }, [r?.id]);
  const modis = data.filtered.filter(row => row.sensor === 'MODIS').length, viirs = data.filtered.length - modis;
  const point = r ? [r.latitude, r.longitude] : [(data.bounds[1] + data.bounds[3]) / 2, (data.bounds[0] + data.bounds[2]) / 2];
  return <aside className="insight-panel" aria-labelledby="insight-title"><div className="insight-heading"><h2 id="insight-title" tabIndex={-1} ref={heading}>{r ? 'Observation details' : 'In this selection'}</h2>{r && <button className="icon-button" aria-label="Close observation details" onClick={() => data.setSelected(null)}><X size={17} /></button>}</div>
    {r ? <><div className={`sensor-label ${r.sensor.toLowerCase()}`}>{r.sensor} <span>Original record</span></div><p className="observation-time">{r.date} / {r.time.slice(0, 2)}:{r.time.slice(2)} UTC</p><dl className="record-values"><div><dt>Coordinates</dt><dd>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</dd></div><div><dt>FRP <Help term="Fire radiative power">{'FRP in megawatts is a satellite estimate of radiative power at detection. It is not burned area or the size of a wildfire.'}</Help></dt><dd>{r.frp === null ? 'Not supplied' : `${r.frp} MW`}</dd></div><div><dt>Confidence <Help term="Sensor confidence">{'MODIS numeric confidence and VIIRS low/nominal/high categories are sensor-specific. They are retained as supplied and cannot be read as a common probability scale.'}</Help></dt><dd>{r.confidence} ({r.sensor})</dd></div><div><dt>Satellite</dt><dd>{r.satellite}</dd></div><div><dt>Product version</dt><dd>{r.metadata?.version || 'Not supplied'}</dd></div><div><dt>Scan / track</dt><dd>{r.metadata?.scan || 'Unknown'} / {r.metadata?.track || 'Unknown'} km</dd></div></dl><p className="source-caption">{r.source}</p></> : <><div className="selection-total">{data.info ? data.filtered.length.toLocaleString() : 'No data loaded'}<span>raw detection records</span></div><p>A detection is fire-related thermal activity. It is not necessarily a separate wildfire.</p><div className="sensor-totals"><span className="modis-label">MODIS <strong>{modis.toLocaleString()}</strong></span><span className="viirs-label">VIIRS <strong>{viirs.toLocaleString()}</strong></span></div><p className="source-caption">{data.day || `${data.start} to ${data.end}`} UTC<br />{data.areaName}<br />Source: NASA FIRMS; {data.info?.mode || 'not loaded'}</p><button className="text-action" onClick={onRecords}>Inspect source records <ArrowUpRight size={15} /></button></>}
    <details className="comparison-disclosure"><summary>About satellite comparison</summary><div className="insight-boundary"><h3>Comparison, with uncertainty</h3><p>Original observations are preserved. Candidate links are experimental; a validated harmonized series is not yet available.</p><button className="text-action" onClick={onLab}>Open Sensor Lab <ArrowUpRight size={15} /></button></div></details>
    <details className="weather-disclosure" open={weatherOpen} onToggle={e => setWeatherOpen(e.currentTarget.open)}><summary><CloudSun size={17} />Current weather context</summary>{weatherOpen && <WeatherContext lat={point[0]} lon={point[1]} historical={(r?.date || data.end) !== new Date().toISOString().slice(0, 10)} />}</details>
  </aside>;
}
