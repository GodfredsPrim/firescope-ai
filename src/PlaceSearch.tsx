import { apiFetch } from './hosting';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { regions } from './data';
type Place = { name: string; bounds: readonly number[] };
const presets: Place[] = Object.entries(regions).filter(([key]) => key !== 'custom').map(([, value]) => ({ name: value.name, bounds: value.bounds }));
export default function PlaceSearch({ name, onSelect }: { name: string; onSelect: (name: string, bounds: readonly number[]) => void }) {
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false), [places, setPlaces] = useState<Place[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (query.trim().length < 2) { setPlaces([]); setLoading(false); return; }
    const abort = new AbortController(); setLoading(true);
    const timer = setTimeout(() => {
      apiFetch(`/api/places?q=${encodeURIComponent(query.trim())}`, { signal: abort.signal }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Place search unavailable'); return body; }).then(body => {
        if (!abort.signal.aborted) { setPlaces(body.places.map((p: { name: string; lat: number; lon: number }) => ({ name: `${p.name} (1° study rectangle)`, bounds: [Math.max(-180, p.lon - 0.5), Math.max(-90, p.lat - 0.5), Math.min(180, p.lon + 0.5), Math.min(90, p.lat + 0.5)] }))); setError(''); }
      }).catch(e => { if (!abort.signal.aborted) { setPlaces([]); setError(e.message); } }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    }, 450);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query]);
  return <div className="place-search" ref={root} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}><label htmlFor="area-search">Study area</label><div><Search size={16} /><input id="area-search" role="combobox" aria-expanded={open} aria-controls="place-options" autoComplete="off" value={open ? query : name} onFocus={() => { setOpen(true); setQuery(''); }} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown') { e.preventDefault(); root.current?.querySelector<HTMLButtonElement>('[role=option]')?.focus(); } }} placeholder="Search a city or region" /></div>
    {open && <div className="place-results" id="place-options" role="listbox" aria-label="Study areas">{[...presets.filter(p => p.name.toLowerCase().includes(query.toLowerCase())), ...places].map(p => <button key={p.name} role="option" aria-selected={name === p.name} onClick={() => { onSelect(p.name, p.bounds); setOpen(false); }}><MapPin size={15} />{p.name}</button>)}{loading && <p role="status">Searching locations…</p>}{error && <p role="status">{error} Preset areas remain available.</p>}<button className="close-places" onClick={() => setOpen(false)}>Close search</button></div>}
  </div>;
}
