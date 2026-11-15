import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapPinned, PanelLeft, Satellite, CircleHelp, Compass, MapPin, ArrowDownToLine, ArrowUpRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Database, Flame, Layers, Newspaper, Play, RotateCcw, SlidersHorizontal, Upload, WifiOff, X } from 'lucide-react';
import gsap from 'gsap';
import { staticHosting, hostingMessage } from './hosting';
import { compare, exportCSV, inRegion } from './data';
import { DEFAULT_LINK_OPTIONS } from './harmonize';
import { useWorkspaceData } from './useWorkspaceData';
import FireMap from './Map';
import DataRequest from './DataRequest';
import PlaceSearch from './PlaceSearch';
import { InsightPanel, ScopeLine } from './WorkspaceContext';
import { CalendarView, Timeline } from './ActivityViews';
import DataExplorer from './DataExplorer';
import MethodsView from './MethodsView';
import News from './NewsPanel';
import AnalysisPanel, { saveFile } from './AnalysisPanel';
import CalibrationPanel from './CalibrationPanel';
const UserGuide = lazy(() => import('./UserGuide'));
const AssessmentPanel = lazy(() => import('./AssessmentPanel'));
import { buildCalibration, type CalibrationReport, type GridSensitivity } from './calibration';

const navigation = [
  { id: 'explore', label: 'Explore', icon: MapPinned, description: 'Original observations in space and time' },
  { id: 'calendar', label: 'Historical Calendar', icon: CalendarDays, description: 'Observed patterns, with missingness in view' },
  { id: 'lab', label: 'Sensor Lab', icon: Layers, description: 'Compare original sensors and inspect candidate links' },
  { id: 'records', label: 'Data Explorer', icon: Database, description: 'Inspect and export original source records' },
  { id: 'news', label: 'News updates', icon: Newspaper, description: 'Ghana reporting, with original publishers and source context' },
  { id: 'methods', label: 'Methods & Sources', icon: BookOpen, description: 'Trace the data and understand its limits' },
  { id: 'guide', label: 'User guide', icon: BookOpen, description: 'Step-by-step instructions for exploring the system and understanding its results' },
  { id: 'assessment', label: 'Research assessment', icon: SlidersHorizontal, description: 'Polygon evidence, experimental scoring, anomaly screening and research briefings' },
] as const;
type View = typeof navigation[number]['id'];
const studentLabels = { explore: 'Fire explorer', calendar: 'Activity calendar', news: 'News & reports', lab: 'Sensor comparison', records: 'Observation records', methods: 'Methods & sources', guide: 'User guide', assessment: 'Area assessment' };
const primaryViews = ['explore', 'calendar', 'assessment', 'news'];
const initialView = (): View => navigation.some(item => item.id === location.hash.slice(1)) ? location.hash.slice(1) as View : 'explore';

export default function App() {
  const data = useWorkspaceData();
  const [view, setView] = useState<View>(initialView), [collapsed, setCollapsed] = useState(false), [advanced, setAdvanced] = useState(false);
  const [linkOptions, setLinkOptions] = useState(DEFAULT_LINK_OPTIONS), [tour, setTour] = useState<number | null>(null), [demoError, setDemoError] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const pageHeading = useRef<HTMLHeadingElement>(null), lastView = useRef(view);
  const input = useRef<HTMLInputElement>(null), tourHeading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const context = gsap.context(() => {
      gsap.fromTo('.workspace-intro', { y: 10, opacity: .65 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
    });
    return () => context.revert();
  }, [view]);
  const current = navigation.find(item => item.id === view)!;
  const navigate = useCallback((next: View) => { setView(next); if (location.hash !== `#${next}`) location.hash = next; }, []);
  useEffect(() => { const change = () => { if (navigation.some(item => item.id === location.hash.slice(1))) setView(initialView()); }; addEventListener('hashchange', change); return () => removeEventListener('hashchange', change); }, []);
  useEffect(() => { const update = () => setOffline(!navigator.onLine); addEventListener('online', update); addEventListener('offline', update); return () => { removeEventListener('online', update); removeEventListener('offline', update); }; }, []);
  useEffect(() => { document.title = `FireScope AI · ${current.label}`; if (lastView.current !== view) pageHeading.current?.focus({ preventScroll: true }); lastView.current = view; }, [view, current.label]);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); if (view === 'lab' || view === 'assessment') { data.setSensor('all'); data.setDay(''); } }, [view]);
  useEffect(() => { data.setSelected(null); }, [data.start, data.end, data.sensor, data.day, data.bounds]);
  useEffect(() => { if (tour !== null) tourHeading.current?.focus({ preventScroll: true }); }, [tour]);
  const stats = useMemo(() => compare(data.scoped), [data.scoped]);
  const fullStats = useMemo(() => compare(data.records), [data.records]);
  const calibration = useMemo((): { report: CalibrationReport | null; error: string; sensitivity: GridSensitivity[] } => {
    if (!data.info?.study) return { report: null, error: '', sensitivity: [] };
    try {
      const original = data.info.study.bounds;
      if (data.bounds[0] < original[0] || data.bounds[1] < original[1] || data.bounds[2] > original[2] || data.bounds[3] > original[3]) throw new Error('Choose an area within the retrieved Ghana extent for this study.');
      const records = data.records.filter(row => inRegion(row, 'custom', data.bounds));
      const report = buildCalibration(records, data.info.study);
      const sensitivity = [0.05, 0.1, 0.25].map(gridDegrees => { const run = gridDegrees === 0.1 ? report : buildCalibration(records, data.info!.study!, gridDegrees); return { gridDegrees, factor: run.factor, test: run.metrics.test }; });
      return { report, error: '', sensitivity };
    } catch (error) { return { report: null, error: error instanceof Error ? error.message : 'Study calibration unavailable.', sensitivity: [] }; }
  }, [data.records, data.info, data.bounds]);
  const openStudy = () => { navigate('lab'); void data.load('case-study'); };
  const openAdjustedCalendar = (date?: string) => { data.setSensor('all'); data.setDay(date || calibration.report?.days.find(day => day.split === 'test')?.date || ''); navigate('calendar'); };
  const emptySelection = !!data.info && !data.filtered.length;
  const exportCurrent = () => saveFile(exportCSV(data.filtered), 'firescope-source-observations.csv', 'text/csv;charset=utf-8');
  const startDemo = async () => { setDemoError(''); const loaded = await data.load('case-study'); if (loaded) { navigate('explore'); setTour(0); } else setDemoError('The real demonstration case study could not be loaded. Load NASA data or import original CSV files; the tour will not substitute invented observations.'); };
  const moveTour = (next: number) => { if (next === 2) data.setDay(calibration.report?.days.find(day => day.split === 'test')?.date || ''); setTour(next); navigate(next === 1 ? 'lab' : next === 2 ? 'calendar' : 'explore'); };
  const titles = { explore: 'Fire explorer', calendar: 'Activity calendar', lab: 'Sensor comparison', records: 'Observation records', news: 'News & reports', methods: 'Methods & sources', guide: 'Your guide to FireScope', assessment: 'Area assessment' };
  const filteredModis = data.filtered.filter(row => row.sensor === 'MODIS').length;
  const filteredViirs = data.filtered.length - filteredModis;
  const observedDays = new Set(data.filtered.map(row => row.date)).size;
  return <div className={`observatory-shell ${collapsed ? 'rail-collapsed' : ''}`}>
    <a href="#workspace-content" className="skip-link">Skip to workspace</a>
    <aside className="navigation-rail">
      <a className="observatory-brand" href="#explore" aria-label="FireScope AI home" onClick={() => navigate('explore')}><span><Flame size={23} strokeWidth={2.2} /></span><strong>FireScope<span>AI</span><small>by FlareForge</small></strong></a>
      <div className="rail-project"><span className="project-icon"><Compass size={18} /></span><div>Ghana research<small>Observation workspace</small></div></div>
      <nav aria-label="Workspace navigation">
        <div className="rail-section-label">Workspace</div>
        {navigation.filter(item => primaryViews.includes(item.id)).map(item => <button key={item.id} className={`rail-link ${item.id === 'guide' ? 'mobile-guide-link' : ''} ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined} aria-label={item.label} title={studentLabels[item.id]}><item.icon size={18} strokeWidth={1.7} /><span>{studentLabels[item.id]}</span>{view === item.id && <i className="nav-active-dot" />}</button>)}
        <div className="rail-section-label research-label">Research</div>
        {navigation.filter(item => !primaryViews.includes(item.id)).map(item => <button key={item.id} className={`rail-link ${item.id === 'guide' ? 'mobile-guide-link' : ''} ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined} aria-label={item.label} title={studentLabels[item.id]}><item.icon size={18} strokeWidth={1.7} /><span>{studentLabels[item.id]}</span>{view === item.id && <i className="nav-active-dot" />}</button>)}
      </nav>
      <div className="rail-bottom"><button className="rail-link guide-rail" onClick={() => navigate('guide')} aria-label="User guide"><CircleHelp size={18} /><span>Help & user guide</span><ArrowUpRight size={14} /></button><div className="rail-research-note"><Satellite size={19} /><p>Built on NASA FIRMS<small>Original data. Open exploration.</small></p></div><div className="team-profile"><span className="rail-team">FF</span><p>FlareForge<small>Research workspace</small></p><button className="collapse-rail" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand navigation rail' : 'Collapse navigation rail'} aria-expanded={!collapsed}><PanelLeft size={17} /></button></div></div>
    </aside>
    <div className="workspace-shell"><header className="workspace-topbar"><div><button className="mobile-menu icon-button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle navigation"><PanelLeft size={18} /></button><span className="workspace-name">Workspace</span><ChevronRight className="topbar-divider" size={13} /><strong>{studentLabels[view]}</strong></div><div className="topbar-actions"><span className={`dataset-badge ${data.info?.kind === 'synthetic' ? 'synthetic' : ''}`}>{data.loading ? 'Loading observations' : data.info?.kind === 'study' ? 'Sampled historical study' : data.info?.kind === 'snapshot' ? 'Historical NASA data' : data.info?.kind === 'synthetic' ? 'Synthetic example' : data.info ? 'Source observations' : 'No dataset'}</span><button className="secondary guided-demo-button" onClick={() => void startDemo()} disabled={data.loading}><Play size={13} />Guided demo</button><span className="topbar-avatar" aria-label="FlareForge workspace">FF</span></div></header>
      <main id="workspace-content" className="workspace-content" tabIndex={-1}><div className="workspace-intro"><div><h1 ref={pageHeading} tabIndex={-1}>{titles[view]}</h1><p>{view === 'explore' ? 'A clearer view of fire activity. Explore the observations behind the picture.' : `${current.description}.`}</p></div><div className="intro-actions"><button className="secondary" onClick={() => input.current?.click()}><Upload size={15} />Import data</button><button className="primary" disabled={!data.filtered.length} onClick={exportCurrent}><ArrowDownToLine size={15} />Export data</button></div></div>
        {view !== 'methods' && view !== 'news' && view !== 'guide' && <section className="study-options" aria-label="Area, dates and satellite filters"><section className="workspace-toolbar" aria-label="Study selection"><PlaceSearch name={data.areaName} onSelect={data.setArea} /><label>From (UTC)<input type="date" value={data.start} onChange={e => { data.setStart(e.target.value); data.setDay(''); }} /></label><label>To (UTC)<input type="date" value={data.end} onChange={e => { data.setEnd(e.target.value); data.setDay(''); }} /></label><label>Sensor<select aria-label="Sensor selection" disabled={view === 'lab' || view === 'assessment'} value={data.sensor} onChange={e => data.setSensor(e.target.value as typeof data.sensor)}><option value="all">Both sensors</option><option value="MODIS">MODIS</option><option value="VIIRS">VIIRS</option></select></label><button className="primary fetch-nasa" disabled={data.loading || data.invalidRange} onClick={() => void data.load({ from: data.start, to: data.end, bounds: data.bounds.join(','), mode: Date.parse(data.start) < Date.now() - 7 * 86400000 ? 'archive' : 'nrt' })}><RotateCcw size={14} />Update data</button><button className="icon-button data-options-button" aria-label="Data and coordinate options" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}><SlidersHorizontal size={18} /></button></section></section>}
        {advanced && view !== 'methods' && view !== 'news' && view !== 'guide' && <div className="advanced-data"><DataRequest loading={data.loading} hasData={!!data.info} onLoad={request => void data.load(request)} onLatest={() => void data.load()} onExample={data.synthetic} onImport={() => input.current?.click()} /></div>}
        <input ref={input} type="file" accept=".csv,text/csv" multiple hidden aria-label="Import NASA FIRMS CSV" onChange={e => { void data.importFiles(e.target.files).finally(() => { if (input.current) input.current.value = ''; }); }} />
        {view !== 'news' && view !== 'methods' && view !== 'guide' && data.invalidRange && <div className="notice error" role="alert">Enter valid dates with the start on or before the end.</div>}
        {staticHosting && <div className="notice warning" role="note"><span>{hostingMessage}</span></div>}
        {data.error && <div className="notice error" role="alert"><span>{data.error} Previous observations, if any, are retained.</span><button className="icon-button" aria-label="Dismiss error" onClick={() => data.setError('')}><X size={16} /></button></div>}
        {demoError && <div className="notice warning" role="status">{demoError}</div>}
        {!!data.info?.warnings.length && <div className="notice warning" role="status">Partial source data. {data.info.warnings.join(' ')}</div>}
        {data.loading && <div className="loading-strip" role="status"><span>{data.info ? 'Updating observations; the previous dataset remains visible.' : 'Loading the real, dated NASA study example…'}</span><button onClick={data.cancel}>Cancel request</button></div>}
        {data.message && !data.loading && <div className="result-notice" role="status"><span>{data.message}</span><button aria-label="Dismiss status" onClick={() => data.setMessage('')}><X size={14} /></button></div>}
        {!data.loading && !data.info && view !== 'methods' && view !== 'news' && view !== 'guide' && <div className="workspace-empty"><Flame size={28} /><div><h2>Start with an observation, not an assumption.</h2><p>Load the real Ghana historical example, request NASA data, or import original files. No live metrics or observations are fabricated.</p></div><button className="primary" onClick={() => void data.load('snapshot')}>Explore historical NASA data</button><button className="secondary" onClick={() => input.current?.click()}><Upload size={16} />Import CSV</button></div>}
        {offline && <div className="notice warning" role="status"><WifiOff size={18} /><span>You are offline. Loaded observations, filters and exports remain available. New NASA, weather and news requests need a connection.</span></div>}
        {data.day && view !== 'news' && view !== 'methods' && view !== 'guide' && <div className="active-day-filter"><CalendarDays size={15} /><span>Showing {data.day} UTC</span><button onClick={() => data.setDay('')}>Clear day filter <X size={14} /></button></div>}
        {view === 'explore' && <><div className="study-example-caption"><MapPin size={13} />{data.info?.kind === 'snapshot' ? 'Historical example: Ghana, 1 to 3 January 2025. This is not live fire activity.' : `${data.areaName} / ${data.start} to ${data.end} UTC`}</div><details className="source-details"><summary>Data source & coverage</summary><ScopeLine data={data} selectedDay /></details>{emptySelection && <div className="notice warning">No observations match the current area, dates, sensor and day filters. This is not evidence of no burning. Broaden the filters or fetch NASA data for this selection.</div>}
          <section className="observation-overview" aria-label="Selection summary">
            <div><span><Flame size={16} />Detection records</span><strong>{data.info ? data.filtered.length.toLocaleString() : '—'}</strong><small>Thermal observations, not unique fires</small></div>
            <div><span><span className="metric-sensor modis" />MODIS observations</span><strong>{data.info ? filteredModis.toLocaleString() : '—'}</strong><small>1 km nominal resolution</small></div>
            <div><span><span className="metric-sensor viirs" />VIIRS observations</span><strong>{data.info ? filteredViirs.toLocaleString() : '—'}</strong><small>375 m nominal resolution</small></div>
            <div><span><CalendarDays size={16} />Days with records</span><strong>{data.info ? observedDays.toLocaleString() : '—'}<em>days</em></strong><small>Observation coverage is unknown</small></div>
          </section>
          <div className="explorer-section-heading"><div><h2>Observation map</h2><span><span className="modis-label">MODIS</span><span className="viirs-label">VIIRS</span></span></div><span className="map-instruction">Select a marker to inspect its source</span></div>
          <div className="map-workspace" aria-busy={data.loading}><section className="map-panel"><div className="panel-heading"><div><h2><MapPin size={15} />{data.areaName}</h2><p>{data.areaName} / {data.day || `${data.start} to ${data.end}`} UTC</p></div><span className="stage-label">Raw observations</span></div><FireMap imageryDate={data.day || data.start} records={data.filtered} customBounds={data.bounds} onSelect={data.setSelected} onAreaSelected={(name, bounds) => { data.setArea(name, bounds); navigate('assessment'); }} />{data.loading && !data.info && <div className="map-loading-skeleton skeleton" aria-hidden="true" />}</section><InsightPanel data={data} onLab={() => navigate('lab')} onRecords={() => navigate('records')} /></div><div className="explorer-bottom"><Timeline data={data} compact /><section className="study-entry"><div className="study-entry-icon"><Layers size={22} /></div><div><h2>One landscape. Two perspectives.</h2><p>Explore how MODIS and VIIRS see the same landscape in the five-year Ghana study.</p><button className="text-action" disabled={data.loading} onClick={data.info?.study ? () => navigate('lab') : openStudy}>Compare the satellites <ArrowUpRight size={15} /></button></div></section></div><div className="workspace-next"><span>What would you like to explore next?</span><button className="text-action" onClick={() => navigate('calendar')}>Explore the calendar <ArrowUpRight size={15} /></button><button className="text-action" onClick={() => navigate('lab')}>Compare sensors <ArrowUpRight size={15} /></button><button className="text-action" disabled={!data.filtered.length} onClick={exportCurrent}><ArrowDownToLine size={15} />Export observations</button></div></>}
        {view === 'calendar' && <CalendarView data={data} options={linkOptions} calibration={calibration.report} />}
        {view === 'lab' && <><CalibrationPanel sensitivity={calibration.sensitivity} report={calibration.report} manifest={data.info?.study} error={calibration.error} loading={data.loading} onLoad={openStudy} onCalendar={openAdjustedCalendar} scope={{ area: data.areaName, bounds: data.bounds }} /><ScopeLine data={data} stage="Raw + aligned + experimental correspondence" /><div className="lab-intro"><div><h2>Start with the sensor difference</h2><p>The same study selection contains <strong className="modis-text">{stats.modis.toLocaleString()} MODIS</strong> and <strong className="viirs-text">{stats.viirs.toLocaleString()} VIIRS</strong> raw records. Different resolutions, acquisition times and sensitivities affect these counts.</p></div><div className="lab-stage-note"><strong>Validated harmonized indicators</strong><span>Analysis not yet available</span></div></div>
          <AnalysisPanel records={data.scoped} options={linkOptions} onOptions={setLinkOptions} scope={{ area: data.areaName, bounds: data.bounds, from: data.start, to: data.end }} quality={data.quality} onDate={date => { data.setDay(date); navigate('explore'); }} />
          <section className="aligned-comparison"><div className="panel-heading"><div><h2>Common-grid alignment</h2><p>0.1° cells over the entire selected period. Alignment does not calibrate sensor sensitivity.</p></div><span className="stage-label">Aligned, not harmonized</span></div><dl><div><dt>MODIS occupied cells</dt><dd>{stats.modisCells}</dd></div><div><dt>VIIRS occupied cells</dt><dd>{stats.viirsCells}</dd></div><div><dt>Shared occupied cells</dt><dd>{stats.shared}</dd></div></dl><p>Shared occupancy is not simultaneous agreement, accuracy or a validated harmonization score. Linking parameters and uncertainty remain in exported evidence.</p><button className="text-action" onClick={() => navigate('methods')}>Read methodology and validation limits <ArrowUpRight size={15} /></button></section></>}
        {view === 'records' && <div className="record-workspace"><DataExplorer data={data} /><InsightPanel data={data} onLab={() => navigate('lab')} onRecords={() => navigate('records')} /></div>}
        {view === 'news' && <News />}
        {view === 'assessment' && <Suspense fallback={<p role="status">Opening area assessment…</p>}><AssessmentPanel data={data} /></Suspense>}
        {view === 'guide' && <Suspense fallback={<p role="status">Opening the user guide...</p>}><UserGuide /></Suspense>}
        {view === 'methods' && <MethodsView data={data} />}
        <footer className="workspace-footer"><span>FireScope AI / FlareForge</span><span>Research observations. Not an emergency warning service.</span><button disabled={data.loading || !data.info} onClick={data.clear}><RotateCcw size={13} />Clear dataset</button></footer>
      </main>
    </div>
    {tour !== null && <section className="guided-tour" aria-label="Guided Demo" role="region"><div className="tour-heading"><span>Guided Demo / {tour + 1} of 3</span><button className="icon-button" aria-label="Close Guided Demo" onClick={() => setTour(null)}><X size={17} /></button></div><h2 tabIndex={-1} ref={tourHeading}>{['Where heat was observed', 'Why MODIS and VIIRS differ', 'The purpose of harmonization'][tour]}</h2><p>{tour === 0 ? `This real NASA example contains ${data.records.length.toLocaleString()} original records in the Ghana study extent, ${data.info?.from} to ${data.info?.to} UTC. These are 50 sampled days, not a continuous five-year record. Map marks aggregate nearby records. Zoom or inspect a record to trace the observation.` : tour === 1 && calibration.report ? `On ${calibration.report.metrics.test.days} held-out test days in 2025, daily disagreement with MODIS Aqua is ${calibration.report.metrics.test.rawMAE.toFixed(1)} occupied cells before adjustment and ${calibration.report.metrics.test.adjustedMAE.toFixed(1)} after. The training-only seasonal mean baseline scores ${calibration.report.metrics.test.seasonalBaselineMAE.toFixed(1)}. This is sensor agreement, not fire-detection accuracy. Inspect the January/July breakdown and exported evidence.` : tour === 1 ? `${fullStats.modis.toLocaleString()} MODIS and ${fullStats.viirs.toLocaleString()} VIIRS records describe different sensor observations, not separate counts of wildfires. The Sensor Lab exposes the actual same-day candidate-linking method and its sensitivity. It is experimental, not validated harmonization.` : 'Defensible harmonization would make historical comparisons more consistent by correcting cross-sensor differences and evaluating held-out data. The five-year study now provides an experimental calibration, with separate test years. It is not independently validated. Explore raw or aligned activity, inspect missingness, and export the evidence rather than claiming an anomaly or improvement.'}</p><div className="tour-controls"><button className="secondary" disabled={tour === 0} onClick={() => moveTour(tour - 1)}>Previous</button>{tour < 2 ? <button className="primary" onClick={() => moveTour(tour + 1)}>Next: {tour === 0 ? 'Sensor differences' : 'Historical activity'}<ChevronRight size={15} /></button> : <button className="primary" onClick={() => { setTour(null); navigate('records'); }}>Inspect & export findings</button>}</div></section>}
  </div>;
}
