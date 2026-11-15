# FireScope AI: audit and implementation plan

Audit date: 12 November 2026. Scope: existing React 19 / TypeScript / Vite app, Leaflet, Papa Parse, local Vite middleware, all source modules, API scripts, tests, product/method documentation and real-data provenance.

## Verified existing architecture

- App.tsx contains state-based navigation, ingestion, filters, map, calendar, table and methods. There are no URL routes, database, authentication provider or persistence layer. No such infrastructure will be removed or replaced.
- data.ts validates coordinates, UTC dates/times and FRP, identifies sensors, deduplicates exact observation keys and retains provenance plus scan/track/version metadata. CSV export neutralizes formula-leading strings. Synthetic data is labeled and cannot mix with observations.
- /api/fires/latest and /api/fires/search use private FIRMS_MAP_KEY through local-api.mjs. Bounds/date/product validation, 15-minute in-memory cache, shared in-flight requests and retry cooldown exist. Both products currently fail together if one fails. API searches are bounded to 10 days and 400 square degrees. Dev/preview middleware is not a deployed production service.
- OpenWeatherMap has a saved private key and standalone credential test. No weather UI or backend weather endpoint exists yet. No historical weather access has been established.
- harmonize.ts implements deterministic greedy, one-to-one, same-UTC-day MODIS/VIIRS linking, default 1km/60min, retaining unmatched observations. It does not perform coverage-aware calibration, footprint/sensitivity correction or independent validation. No validated harmonized indicator or defensible multi-year anomaly method is implemented.
- GDELT is an optional browser-requested headline feed. It supplies indexing time, not reliable publication time or independently verified incident location. No automatic satellite/incident association is established.
- The real archived NASA example has original CSVs and a provenance manifest for Ghana, 1-3 January 2025. It contains 1,135 MODIS and 6,215 VIIRS records. It is observational demonstration data, not labeled scientific validation truth.

## Findings

| Priority | Finding | Planned remedy |
|---|---|---|
| High | First-time users must understand a large control stack before seeing useful geography | Default to the available dated snapshot; map-first layout and progressive controls |
| High | Experimental correspondence can be mistaken for actual harmonization | Explicit raw/aligned/experimental labels, validation unavailable state, concise methods |
| High | Current weather key is tested but not integrated | Private server endpoint; point/time/units and current-versus-historical distinction |
| High | Monolithic state/UI couples every view | Extract workspace data hook and reusable views without replacing parsers/methods |
| Medium | Map renders up to 10,000 SVG points and silently needs users to discover layers | Zoom-dependent aggregation, sensor layer controls, clear limits and area boundary |
| Medium | Table is not searchable and contextual details are distant | Dedicated paginated search and unified record details |
| Medium | No cancellable data request or stale-response protection | AbortController and operation identity; retain previous dataset on failed request |
| Medium | Repeated linking recomputation on interactive renders | Memoized/scoped analysis and cached per-scope values |
| Medium | No explicit partial-source state | Preserve successful products and disclose missing products |
| Medium | Blank dates risk implying zero burning | Unknown/missing coverage labels and no invented baseline values |
| Medium | Presentation lacks short scientific explanation | Three-step, optional guided demo using actual available observations |
| Medium | Light theme conflicts with the newly pinned observatory direction | Midnight navy/slate, off-white text, amber MODIS, teal VIIRS, purposeful motion |

Baseline: 17 unit tests pass. Build includes TypeScript checks; no lint script is configured. Previous browser artifacts establish working ingestion/export/source inspection. No credentials were printed during audit.

## Information architecture

- Explore: area search / dates / sensor toolbar, map, layer controls, selected-area boundary, contextual insights/weather, compact daily timeline.
- Historical Calendar: daily and monthly raw/aligned activity, explicit provenance and coverage, unavailable baseline/anomaly state.
- Sensor Lab: original sensor counts, common-grid overlap, existing experimental linking/sensitivity/evidence exports; validated harmonization unavailable.
- Data Explorer: debounced text search, pagination, acquisition UTC, sensor, source confidence, FRP MW, coordinates and export.
- Methods & Sources: data lineage, units, confidence differences, coverage/missingness, methodology, validation status and optional attributed news.

## Design system

Pinned user direction: premium scientific observatory; operational map-first UI rather than a marketing page. Midnight #0b1420 canvas; #111e2d and #172637 surfaces; off-white #edf3f8 text; muted #a8b9ca; crisp #2a3d50 rules. Fire amber #ffb45c represents MODIS and contextual fire activity; teal #50d5cd represents VIIRS. Text, labels and marker shapes supplement color. Red is reserved for actionable failures. Reuse self-hosted Source Sans 3 and existing Lucide icons. Consistent 12px panels / 8px controls, restrained 160ms feedback, reduced-motion support. No new UI dependency is planned.

## Implementation sequence

1. Extend existing middleware with local snapshot, weather and location endpoints while preserving FIRMS keys/contracts/caching and adding truthful partial-source results.
2. Extract existing ingestion/filter/load responsibilities into a cancellable hook. Keep original CSV/model/linking logic and original source files.
3. Refactor existing views into the requested shell/IA, compact toolbar, scope/freshness metadata and contextual details.
4. Improve existing Leaflet map with boundary, layer controls, zoom-dependent aggregation and keyboard-accessible record alternatives. Add timeline/calendar, searchable table, method help and guided demo.
5. Add tests for current weather mapping, source failure behavior, location bounds, aggregation, and complete researcher/demo/export flows. Run all existing relevant data tests, build, secret scanning and desktop/mobile browser verification.

## Old versus new UX

| Before | Target behavior |
|---|---|
| Controls and status stack precedes geography | Compact toolbar; immediate map and meaningful real snapshot |
| Calendar and records buried in one explorer | Focused calendar and searchable records, consistent shared selection |
| News as primary navigation; weather disconnected | Weather alongside location/selection; news opt-in under sources |
| Experimental links need lengthy interpretation | Raw versus aligned versus experimental clearly distinguished |
| No judge walkthrough | Three-step evidence-led guided demo with real counts and honest unavailable analyses |

## Known scientific boundaries

Detections are not unique wildfires; FRP MW is not burned area. MODIS numeric confidence and VIIRS categories are not interchangeable. Gridding or pairing is not full harmonization. No independent labels, multi-year coverage-adjusted calibration, validated harmonized output, supported anomaly baseline or operational warning system exists. Historical weather is not licensed or implemented; current weather cannot explain historical detections. News publication time/location may be unavailable and must be labeled unknown.
