import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, LocateFixed, SquareDashedMousePointer, X } from 'lucide-react';
import { regions, type Observation, type Region } from './data';
import { aggregateForMap } from './mapAggregation';
import type { Polygon, Point } from './assessment';
import { DENSITY_RAMP } from './roiActivity';
export default function FireMap({ records, imageryDate, region = 'custom', customBounds = regions.ghana.bounds, onSelect, onAreaSelected, polygon, polygonDrawing, onVertex, recordTags, onGroupSelect, highlightedIds, newsLocations, showDensity }: {
  imageryDate?: string;
  records: Observation[]; region?: Region; customBounds?: readonly number[]; onSelect: (r: Observation) => void; onAreaSelected?: (name: string, bounds: readonly number[]) => void;
  polygon?: Polygon; polygonDrawing?: boolean; onVertex?: (point: Point) => void;
  recordTags?: ReadonlyMap<string, string>;
  onGroupSelect?: (records: Observation[]) => void; highlightedIds?: ReadonlySet<string>; newsLocations?: { longitude: number; latitude: number; title: string }[]; showDensity?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), points = useRef<L.LayerGroup | null>(null), outline = useRef<L.Rectangle | null>(null), tiles = useRef<L.TileLayer | null>(null);
  const [zoom, setZoom] = useState(7), [tileError, setTileError] = useState(false), [layersOpen, setLayersOpen] = useState(false);
  const [showModis, setShowModis] = useState(true), [showViirs, setShowViirs] = useState(true), [showBase, setShowBase] = useState(true);
  const [drawing, setDrawing] = useState(false), [firstCorner, setFirstCorner] = useState<L.LatLng | null>(null);
  const [showImagery, setShowImagery] = useState(false);
  const [imageryStatus, setImageryStatus] = useState('');
  const visible = useMemo(() => records.filter(r => r.sensor === 'MODIS' ? showModis : showViirs), [records, showModis, showViirs]);
  const groups = useMemo(() => aggregateForMap(visible, zoom), [visible, zoom]);
  const bounds = region === 'custom' ? customBounds : regions[region].bounds;
  const fit = () => { const [w, s, e, n] = bounds; map.current?.fitBounds([[s, w], [n, e]], { padding: [30, 30], animate: false }); };
  useEffect(() => {
    if (!element.current) return;
    const m = L.map(element.current, { scrollWheelZoom: false, preferCanvas: false, zoomAnimation: false, attributionControl: true }).setView([8, -1], 7);
    map.current = m;
    tiles.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 18 }).on('tileerror', () => setTileError(true)).addTo(m);
    points.current = L.layerGroup().addTo(m);
    m.on('zoomend', () => setZoom(m.getZoom()));
    const resize = new ResizeObserver(() => { if (map.current === m) m.invalidateSize({ pan: false }); }); resize.observe(element.current);
    return () => { resize.disconnect(); points.current?.clearLayers(); points.current = null; outline.current = null; tiles.current = null; map.current = null; m.stop(); m.remove(); };
  }, []);
  useEffect(() => { fit(); }, [region, customBounds]);
  useEffect(() => {
    const m = map.current; if (!m) return;
    outline.current?.remove(); const [w, s, e, n] = bounds;
    outline.current = L.rectangle([[s, w], [n, e]], { color: '#a2a9b0', fillOpacity: 0.015, weight: 1.5, dashArray: '6 6', interactive: false }).addTo(m);
  }, [region, customBounds]);
  useEffect(() => {
    const m = map.current, t = tiles.current; if (!m || !t) return;
    if (showBase && !m.hasLayer(t)) t.addTo(m); else if (!showBase && m.hasLayer(t)) t.remove();
  }, [showBase]);
  useEffect(() => {
    const m = map.current;
    if (!m || !showImagery || !imageryDate) { setImageryStatus(''); return; }
    setImageryStatus('Loading NASA imagery…');
    let failed = false;
    const layer = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${imageryDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, {
      attribution: 'Imagery: <a href="https://www.earthdata.nasa.gov/data/tools/gibs">NASA GIBS / MODIS Terra</a>',
      maxNativeZoom: 9, maxZoom: 18, zIndex: 2,
    });
    layer.on('loading', () => { failed = false; setImageryStatus('Loading NASA imagery…'); });
    layer.on('tileerror', () => { failed = true; setImageryStatus('Some NASA imagery tiles are unavailable. Try another date or turn imagery off.'); });
    layer.on('load', () => { if (!failed) setImageryStatus('NASA imagery tiles loaded. Blank areas can indicate missing coverage.'); });
    layer.addTo(m);
    return () => { layer.off(); layer.remove(); };
  }, [showImagery, imageryDate]);
  useEffect(() => {
    const layer = points.current; if (!layer) return; layer.clearLayers();
    const limit = groups.slice(0, 10000);
    for (const group of limit) {
      const count = group.records.length, row = group.records[0];
      const mixed = group.modis > 0 && group.viirs > 0;
      const shape = (count > 1 ? `map-cluster ${mixed ? 'mixed' : group.modis ? 'modis' : 'viirs'}` : `map-point ${row.sensor.toLowerCase()}`) + (group.records.some(r => highlightedIds?.has(r.id)) ? ' roi-highlighted' : '');
      const label = count > 1 ? `${count} detections: ${group.modis} MODIS, ${group.viirs} VIIRS. Activate to zoom.` : `${row.sensor}, ${row.date}, ${row.time.slice(0, 2)}:${row.time.slice(2)} UTC${recordTags?.has(row.id) ? `. ${recordTags.get(row.id)}` : ''}`;
      const marker = L.marker([group.latitude, group.longitude], { icon: L.divIcon({ className: shape, html: count > 1 ? `<span>${count}</span>` : '', iconSize: count > 1 ? [34, 34] : [11, 11], iconAnchor: count > 1 ? [17, 17] : [5.5, 5.5] }), title: label, alt: label, keyboard: true });
      if (showDensity && count > 1) { const level = Math.min(4, Math.ceil(Math.log2(count + 1))); marker.on('add', () => { const element = marker.getElement(); if (element) { element.style.background = DENSITY_RAMP[level]; element.style.color = '#ffffff'; } }); }
      marker.bindTooltip(label);
      marker.on('click', () => { if (polygonDrawing) { onVertex?.([group.longitude, group.latitude]); return; } if (count === 1) onSelect(row); else { onGroupSelect?.(group.records); const m = map.current; if (m) m.setView([group.latitude, group.longitude], Math.min(12, m.getZoom() + 2), { animate: false }); } });
      marker.addTo(layer);
    }
  }, [groups, onSelect, recordTags, onGroupSelect, highlightedIds, showDensity, polygonDrawing, onVertex]);
  useEffect(() => {
    if (!highlightedIds?.size || !map.current) return;
    const selected = records.filter(record => highlightedIds.has(record.id));
    if (selected.length) map.current.fitBounds(selected.map(row => [row.latitude, row.longitude] as L.LatLngTuple), { padding: [50, 50], maxZoom: 12, animate: false });
  }, [highlightedIds]);
  useEffect(() => {
    const m = map.current; if (!m || !newsLocations?.length) return;
    const news = L.layerGroup().addTo(m);
    for (const location of newsLocations) {
      const label = document.createElement('span'); label.textContent = `Unverified news event: ${location.title}`;
      L.marker([location.latitude, location.longitude], { icon: L.divIcon({ className: 'map-news-location', html: '<span aria-hidden="true"></span>', iconSize: [16, 16] }), title: label.textContent, alt: label.textContent, keyboard: true }).bindTooltip(label).addTo(news);
    }
    return () => { news.remove(); };
  }, [newsLocations]);
  useEffect(() => {
    const m = map.current; if (!m || !polygon?.length) return;
    const shape = L.polygon(polygon.map(([lon, lat]) => [lat, lon] as L.LatLngTuple), { color: '#50d5cd', weight: 2, fillOpacity: 0.08, interactive: false }).addTo(m);
    return () => { shape.remove(); };
  }, [polygon]);
  useEffect(() => {
    const m = map.current; if (!m || !polygonDrawing || !onVertex) return;
    const click = (event: L.LeafletMouseEvent) => onVertex([Number(event.latlng.lng.toFixed(6)), Number(event.latlng.lat.toFixed(6))]);
    m.on('click', click); return () => { m.off('click', click); };
  }, [polygonDrawing, onVertex]);
  useEffect(() => {
    const m = map.current; if (!m || !drawing) return;
    const click = (e: L.LeafletMouseEvent) => {
      if (!firstCorner) { setFirstCorner(e.latlng); return; }
      const next = [Math.min(firstCorner.lng, e.latlng.lng), Math.min(firstCorner.lat, e.latlng.lat), Math.max(firstCorner.lng, e.latlng.lng), Math.max(firstCorner.lat, e.latlng.lat)];
      if (next[0] !== next[2] && next[1] !== next[3]) onAreaSelected?.('Drawn study area', next);
      setFirstCorner(null); setDrawing(false);
    };
    m.on('click', click); return () => { m.off('click', click); };
  }, [drawing, firstCorner, onAreaSelected]);
  return <div className={`map-frame observatory-map ${drawing || polygonDrawing ? 'drawing-area' : ''}`}>
    <div ref={element} className="map" aria-label="Interactive map of original satellite observations" />
    <div className="map-actions"><button className="map-action" aria-expanded={layersOpen} onClick={() => setLayersOpen(!layersOpen)}><Layers size={16} />Layers</button><button className="map-action" aria-label="Fit selected study area" onClick={fit}><LocateFixed size={17} /></button>{onAreaSelected && <button className={`map-action ${drawing ? 'active' : ''}`} aria-pressed={drawing} onClick={() => { setDrawing(!drawing); setFirstCorner(null); }}><SquareDashedMousePointer size={17} />Area</button>}</div>
    {layersOpen && <fieldset className="map-layers"><legend>Map layers only</legend><label><input type="checkbox" checked={showModis} onChange={e => setShowModis(e.target.checked)} />MODIS, amber squares</label><label><input type="checkbox" checked={showViirs} onChange={e => setShowViirs(e.target.checked)} />VIIRS, teal circles</label><label><input type="checkbox" checked={showBase} onChange={e => setShowBase(e.target.checked)} />OpenStreetMap basemap</label><label><input type="checkbox" disabled={!imageryDate} checked={showImagery} onChange={e => setShowImagery(e.target.checked)} />NASA true-color imagery</label><p>Analysis uses the toolbar sensor filter.</p><p>Imagery follows the selected day, or the start date of a range. Daily imagery is visual context, not an exact-time match or confirmation of fire. Clouds and missing coverage may obscure the surface.</p><a href="https://nasa-gibs.github.io/gibs-api-docs/" target="_blank" rel="noreferrer">NASA imagery documentation</a></fieldset>}
    {drawing && <div className="draw-instruction" role="status">{firstCorner ? 'Select the opposite corner.' : 'Select two opposite corners. Use coordinate fields for keyboard entry.'}<button aria-label="Cancel area drawing" onClick={() => { setDrawing(false); setFirstCorner(null); }}><X size={16} /></button></div>}
    {tileError && <div className="map-error" role="status">Basemap tiles are unavailable. Original detection coordinates and the selected boundary remain visible.</div>}
    {showImagery && imageryDate && <div className="imagery-caption"><strong>NASA MODIS Terra · {imageryDate} UTC</strong><span role="status">{imageryStatus}</span></div>}
    <div className="map-legend"><span className="modis-label">MODIS square</span><span className="viirs-label">VIIRS circle</span><span>{polygon ? 'Teal line: ROI polygon' : 'Dashed line: selected rectangle'}</span></div>
    <div className="map-footnote">{visible.length.toLocaleString()} visible records / {groups.length.toLocaleString()} map marks. Nearby records aggregate at wider zooms.{groups.length > 10000 && ' Map marks limited to 10,000; all records remain in Data Explorer.'}</div>
  </div>;
}
