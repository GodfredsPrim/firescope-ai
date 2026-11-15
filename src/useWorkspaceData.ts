import { apiFetch } from './hosting';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { inRegion, mergeRecords, parseCSV, regions, sampleData, validDate, type Observation, type Region, type Sensor } from './data';
import type { FireRequest } from './DataRequest';
import type { StudyManifest } from './calibration';

export type DatasetInfo = { kind: 'archive' | 'snapshot' | 'api' | 'import' | 'synthetic' | 'study'; from: string; to: string; bounds: readonly number[]; fetchedAt: string; products: string[]; warnings: string[]; mode: string; study?: StudyManifest };
export function useWorkspaceData() {
  const [records, setRecords] = useState<Observation[]>([]);
  const [info, setInfo] = useState<DatasetInfo | null>(null);
  const [region, setRegion] = useState<Region>('ghana');
  const [areaName, setAreaName] = useState('Ghana study extent');
  const [bounds, setBounds] = useState<readonly number[]>(regions.ghana.bounds);
  const [sensor, setSensor] = useState<'all' | Sensor>('all');
  const [start, setStart] = useState('2025-01-01'), [end, setEnd] = useState('2025-01-03');
  const [day, setDay] = useState(''), [selected, setSelected] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [quality, setQuality] = useState({ rejectedRows: 0, duplicateRowsRemoved: 0, scope: 'No ingestion yet' });
  const operation = useRef(0), controller = useRef<AbortController | null>(null);
  const setArea = useCallback((name: string, next: readonly number[]) => { setAreaName(name); setBounds(next); setRegion('custom'); setSelected(null); setDay(''); }, []);
  const cancel = useCallback(() => { operation.current++; controller.current?.abort(); setLoading(false); setMessage('Request cancelled. Previous observations are retained.'); }, []);
  const load = useCallback(async (request?: FireRequest | 'snapshot' | 'case-study' | `archive:${string}`) => {
    controller.current?.abort(); const current = ++operation.current;
    const abort = new AbortController(); controller.current = abort;
    setLoading(true); setError(''); setMessage('');
    try {
      const archiveMonth = typeof request === 'string' && /^archive:202[45]-(0[1-9]|1[0-2])$/.test(request) ? request.slice(8) : '';
      const endpoint = archiveMonth ? `/data/history/${archiveMonth}.json` : request === 'snapshot' ? '/api/demo/historical' : request === 'case-study' ? '/api/demo/seasonal-study' : request && typeof request !== 'string' ? `/api/fires/search?${new URLSearchParams(request)}` : '/api/fires/latest';
      const response = await (archiveMonth ? fetch : apiFetch)(endpoint, { signal: AbortSignal.any([abort.signal, AbortSignal.timeout(75000)]) });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The local API is unavailable. Start npm run dev and open its local address.');
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not load NASA observations.');
      if (!Array.isArray(body.products) || !validDate(body.from) || !validDate(body.to)) throw new Error('Unexpected NASA data contract. Previous data is retained.');
      let next: Observation[] = [], rejectedRows = 0, duplicateRowsRemoved = 0;
      for (const product of body.products) {
        if (typeof product.csv !== 'string') throw new Error('Missing NASA product data.');
        if (product.csv.trim().split(/\r?\n/).length === 1) continue;
        const parsed = parseCSV(product.csv, `NASA FIRMS ${product.product}; retrieved ${product.fetchedAt || body.fetchedAt}`);
        const merged = mergeRecords(next, parsed.records); next = merged.records;
        rejectedRows += parsed.rejected; duplicateRowsRemoved += parsed.duplicates + merged.duplicates;
      }
      if (current !== operation.current) return false;
      const nextBounds = body.bounds ?? regions.ghana.bounds;
      setRecords(next); setInfo({ kind: body.archive ? 'archive' : body.caseStudy ? 'study' : body.snapshot ? 'snapshot' : 'api', from: body.from, to: body.to, bounds: nextBounds, fetchedAt: body.fetchedAt, products: body.products.map((p: { product: string }) => p.product), warnings: body.warnings ?? [], mode: body.mode ?? 'nrt', study: body.study });
      setQuality({ rejectedRows, duplicateRowsRemoved, scope: 'Most recent NASA ingestion' });
      setBounds(nextBounds); setRegion('custom'); setAreaName(request && request !== 'snapshot' && request !== 'case-study' ? 'Requested study area' : 'Ghana study extent');
      setStart(body.from); setEnd(body.to); setSensor('all'); setDay(''); setSelected(null);
      setMessage(`${next.length.toLocaleString()} original observations loaded. ${body.archive ? 'Full-month requests completed for both products; cloud-free observing opportunity remains unknown.' : body.caseStudy ? '50 sampled days across 2021 to 2025; not continuous annual coverage.' : body.snapshot ? 'Dated historical snapshot, not a live feed.' : 'Source records retained.'}`);
      return true;
    } catch (e) {
      if (current === operation.current && !abort.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load observations. Retry or import a CSV.');
      return false;
    } finally { if (current === operation.current) setLoading(false); }
  }, []);
  useEffect(() => { void load('snapshot'); return () => { operation.current++; controller.current?.abort(); }; }, [load]);
  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    cancel(); setLoading(true); setError(''); setMessage('');
    const current = operation.current;
    try {
      let next = info?.kind === 'synthetic' ? [] : records, rejectedRows = 0, duplicateRowsRemoved = 0;
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) throw new Error('Each CSV must be smaller than 15 MB. Split larger files before importing.');
        const parsed = parseCSV(await file.text(), file.name), merged = mergeRecords(next, parsed.records);
        if (current !== operation.current) return;
        next = merged.records; rejectedRows += parsed.rejected; duplicateRowsRemoved += parsed.duplicates + merged.duplicates;
      }
      if (next.some(r => r.synthetic) && next.some(r => !r.synthetic)) throw new Error('Synthetic and observational records cannot be combined. Clear the dataset first.');
      const dates = next.map(r => r.date).sort();
      setRecords(next); setStart(dates[0]); setEnd(dates.at(-1)!); setDay(''); setSelected(null);
      setInfo({ kind: next.every(r => r.synthetic) ? 'synthetic' : 'import', from: dates[0], to: dates.at(-1)!, fetchedAt: new Date().toISOString(), bounds, products: [...new Set(next.map(r => r.source))], warnings: [], mode: 'user-supplied' });
      setQuality({ rejectedRows, duplicateRowsRemoved, scope: 'Most recent CSV batch' });
      setMessage(`Imported ${next.length.toLocaleString()} observations. ${rejectedRows} invalid rows skipped; ${duplicateRowsRemoved} duplicates removed.`);
    } catch (e) { if (current === operation.current) setError(e instanceof Error ? e.message : 'Could not read that CSV.'); }
    finally { if (current === operation.current) setLoading(false); }
  };
  const synthetic = () => {
    cancel(); const next = sampleData(); setRecords(next); setStart('2025-01-01'); setEnd('2025-12-31'); setDay(''); setSelected(null); setSensor('all'); setArea('Ghana study extent', regions.ghana.bounds);
    setInfo({ kind: 'synthetic', from: '2025-01-01', to: '2025-12-31', fetchedAt: new Date().toISOString(), bounds: regions.ghana.bounds, products: ['Synthetic demonstration'], warnings: [], mode: 'synthetic' });
    setQuality({ rejectedRows: 0, duplicateRowsRemoved: 0, scope: 'Synthetic demonstration' }); setMessage('Synthetic example. These are invented UI demonstration observations, not NASA data.');
  };
  const clear = () => { cancel(); setRecords([]); setInfo(null); setSelected(null); setDay(''); setMessage('Dataset cleared. Load NASA observations or import CSV files.'); };
  const invalidRange = !validDate(start) || !validDate(end) || start > end;
  const scoped = useMemo(() => records.filter(r => !invalidRange && inRegion(r, region, bounds) && r.date >= start && r.date <= end), [records, bounds, region, start, end, invalidRange]);
  const sensorRecords = useMemo(() => scoped.filter(r => sensor === 'all' || r.sensor === sensor), [scoped, sensor]);
  const filtered = useMemo(() => sensorRecords.filter(r => !day || r.date === day), [sensorRecords, day]);
  return { records, scoped, sensorRecords, filtered, info, areaName, bounds, setArea, sensor, setSensor, start, setStart, end, setEnd, day, setDay, selected, setSelected, loading, error, setError, message, setMessage, quality, load, cancel, clear, importFiles, synthetic, invalidRange };
}
export type WorkspaceData = ReturnType<typeof useWorkspaceData>;
