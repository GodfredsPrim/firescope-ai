# FireScope AI

A Ghana fire-observation research workspace built with React, TypeScript, Vite,
and Leaflet. Explore NASA MODIS/VIIRS detections, compare sampled satellite
observations, inspect historical activity, and export research evidence.

Public research demo: https://firescope-flareforge.web.app

### Quick start

Requires **Node.js 22 or later** and npm.

```sh
npm ci
npm run dev
```

Saved research examples work without API credentials. To enable private live
services, copy `.env.example` to `.env.local`, fill in the optional server keys,
and restart. Never prefix private keys with `VITE_`.

For the complete production server, run `npm run build` followed by `npm start`.
For the static research demo, run `npm run build:firebase`.

Run `npm test` for automated checks. See [CONTRIBUTING.md](CONTRIBUTING.md)
for the pull request workflow and [DEPLOYMENT.md](DEPLOYMENT.md) for hosting.

Detections are not individual fires, burned area, or validated risk predictions.
Missing observations do not establish absence of burning. Read the method
documents before interpreting results. Third-party font terms are retained under
`public/fonts/`; no project-wide open-source license has been selected.

**Expanded history and burned-area comparison:** Activity calendar now includes a separate 2024–2025 research archive: 731 completed request days, monthly MODIS/VIIRS counts, three fixed rectangular study areas, source-month loading into the existing map/calendar, daily/monthly CSVs and a downloadable provenance manifest. NASA MCD64A1.061 raster measurements from the Microsoft Planetary Computer mirror provide mapped burned km², valid-land fractions and shortened-mapping-period fractions. A month without all four source tiles is explicitly unavailable. This is retrospective descriptive evidence, not an independently validated calibration or risk model. See [HISTORY_METHOD.md](HISTORY_METHOD.md). The frozen 50-day calibration study remains unchanged.

NASA imagery: in Explore or Area assessment, open **Layers** and enable **NASA true-color imagery**. The public NASA GIBS MODIS Terra layer follows the selected UTC day, or the range start when no day is selected. The date and tile-loading status stay visible on the map. Imagery is daily visual context, not an exact-time match to detections, proof of fire, or a cloud-free coverage assessment. Missing/blank tiles and clouds must not be interpreted as no burning. No account or API key is required; internet access is needed. NASA imagery is opt-in and leaves analysis and exports unchanged. Native imagery zoom is capped at level 9; closer views enlarge the same pixels. See https://nasa-gibs.github.io/gibs-api-docs/access-basics/.

**Area assessment:** Open Workspace > Area assessment for polygon drawing, an experimental 0–100 context score, coverage-gated weekly/monthly anomaly screening, unverified geolocated news/satellite candidates, and one-click PDF/CSV research briefings. The score uses an explicitly aligned-cell proxy; validated harmonized live risk is not available. Historical baselines and incident locations require reviewed imports. See [ASSESSMENT_METHOD.md](ASSESSMENT_METHOD.md) for formulas, input formats, freshness rules and limits. Optional polling runs every 15 minutes while the view is visible. Run `node scripts/verify-assessment.mjs` for labelled fixture-based browser and export verification.

The connected ROI dashboard adds a collapsible numeric bounding-box drawer, synchronized map/calendar/news selection, automatic point-weather updates with wind direction, a sensor-uncertainty disclosure and one-click ZIP export of filtered hotspots plus PDF/text/CSV summaries and evidence JSON. Calendar intensity uses a labelled, contrast-checked blue ramp. Multi-year views show only loaded samples; current weather is kept separate from historical dates. See Guide > Use the synchronized ROI dashboard for a team walkthrough.

New to the system? Read [USER_GUIDE.md](USER_GUIDE.md), or choose **Guide** at the top of the app. It includes a five-minute walkthrough, every screen, the study results, exports, a glossary and troubleshooting. Use **Download guide** for an offline Markdown copy or **Print guide** for a paper copy.

## Challenge experiment

Choose **Compare the satellites** or **Guided Demo** for a real five-year Ghana seasonal study: 75,823 NASA records across 50 sampled January/July days. The Sensor Lab now compares raw VIIRS, a training-only seasonal baseline and an experimental Aqua-reference adjustment. Training, validation and test years are separate. The adjusted activity can be explored in the calendar; unrequested dates stay unknown. This is not independent scientific validation or continuous annual coverage.

See [SCIENCE_METHOD.md](SCIENCE_METHOD.md) for the protocol, [CONTEST_DEMO.md](CONTEST_DEMO.md) for the evidence-led walkthrough, and [DEPLOYMENT.md](DEPLOYMENT.md) for the standalone production server. `npm run build` then `npm start` serves the complete application at http://127.0.0.1:4173. Run `node scripts/verify-case-study.mjs` to verify the real study and exports against that production server.

## Observatory workspace

The current interface opens with the saved real NASA Ghana snapshot: 7,350 observations from 1–3 January 2025. It is a dated historical example, not a live feed. Use **Explore**, **Historical Calendar**, **Sensor Lab**, **Data Explorer**, **News updates**, and **Methods & Sources**. Satellite views share the study selection; news searches are independent. **Data and coordinate options** exposes CSV import and detailed requests. **Guided Demo** walks through the five-year sampled study, held-out sensor comparison and research limitations.

Data Explorer searches source records and exports all matching rows across pages. The map groups nearby observations at wider zooms; activate a group to zoom. Current weather is optional point context fetched through the private local server; it does not describe historical detections. The production backend remains undeployed.

Run `node scripts/verify-workspace.mjs` with the dev server on port 5173 to verify the current navigation, real snapshot, search, pagination, record inspection, exports, guided demo and responsive layouts. Run `node scripts/verify-news.mjs` for news search, cache, source links, empty/error/stale states, keyboard navigation and offline continuity. News browser checks use labeled fixtures, not live headlines. Other earlier browser scripts below target the original interface and need migration before use with this workspace.

First working research prototype for FlareForge. React + TypeScript + Vite; Leaflet map; local CSV processing with Papa Parse.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks types and produces `dist/`. `npm test` checks the data pipeline.

## First use

For challenge requirements, evidence, scientific gaps and a presentation walkthrough, see [NASA_ALIGNMENT.md](NASA_ALIGNMENT.md).

1. In **Fire explorer**, click **Load latest NASA data**. Your saved `FIRMS_MAP_KEY` is used by the local server. This replaces the current dataset with the latest three UTC days of MODIS and VIIRS Suomi-NPP detections in the Ghana rectangular study extent; dates and filters reset automatically.
   For a two-sensor historical demonstration, choose **Explore historical NASA data** instead. It loads Ghana standard-processing observations from 1-3 January 2025. A verified retrieval and key-free provenance manifest are also saved under `artifacts/nasa-ghana-2025-01-01_03/`; these are observational demo data, not independently labeled validation truth.
2. Click a map point or table date to inspect a detection. Use region, sensor and date controls to narrow the loaded observations. Zero after loading means no matching returned detections, not confirmed absence of burning. A dash means no dataset has been loaded.
3. For a walkthrough without an API call, click **Try example data**. These observations are synthetic.
4. Click **News updates** in the navigation. Enter a keyword such as `bushfire` or `drought` into **Search Ghana news**, then click **Search news**. Click a headline to open the publisher's article. Leave the field blank for the default fire news feed.

Use **Search an area and date range** to request a rectangular area and 1-10 UTC days. Choose standard processing for historical research when the product is available. Longer records can be imported as multiple CSVs. In **Sensor comparison**, adjust distance/time tolerances to inspect experimental candidate links, then export the analysis evidence JSON. It contains the selected area/dates, input observations, source metadata, last-ingestion quality counts, parameters, pair IDs, daily results and limitations. The method is deterministic greedy one-to-one linking within each UTC day; it is not calibrated sensor harmonization.

The **Burning activity calendar** switches between raw detections, linked observation groups and occupied 0.1-degree cells. Month totals follow the selected measure. **Export daily calendar** includes all three measures for dates represented by observations; omitted dates have unknown coverage, not confirmed zero activity. A group is a candidate pair or an unpaired observation, not a unique fire. Software tests use clearly synthetic fixtures and do not validate scientific accuracy.

The private NASA adapter runs with `npm run dev`, `npm run preview`, and the standalone `npm start` production server. Restart the server after editing `.env.local`. A static `dist/` deployment alone cannot serve `/api/fires/latest`; use the supplied standalone server for production hosting with private environment variables. NASA responses are cached for 15 minutes. The key is never returned to the browser.

Verification: `npm test` covers ingestion/provenance, request bounds, news normalization and cross-sensor linking. With the local server running, `node scripts/verify-science-workflow.mjs` checks the workflow with labeled fixtures, downloads and 320px/390px/desktop layouts; `node scripts/verify-live-archive.mjs` checks the real two-sensor historical demonstration. These browser scripts use installed Microsoft Edge. Synthetic fixtures test implementation behavior and do not establish scientific accuracy.

## Team demo

1. Open Fire explorer and choose **Explore example**. All example observations are synthetic.
2. Change the region, dates and sensor. Select a month and day to filter detections.
3. Click a map detection or table date to inspect the record.
4. Open Sensor comparison to inspect the unadjusted common-grid baseline.
5. Import one or more real FIRMS CSVs. Real imports replace the example; subsequent imports append and deduplicate records.
6. Export the filtered CSV. No credentials or backend required.

Files stay in memory and are cleared on refresh. Maximum 15 MB per file. Map renders up to 10,000 points and the scrollable table displays 100 rows per page; exports include every matching record. A basemap needs internet; CSV processing does not upload data.

Browser workflow verification: run the dev server, then `node scripts/verify-ui.mjs`. Install its browser once with `npx playwright install chromium`; an existing browser can be selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## News updates

The News updates view includes a GDELT public news feed for English-language Ghana coverage indexed in the last 30 days. Its default feed matches bushfire, wildfire, forest fire and bush burning; a submitted search matches the entered keyword or exact phrase together with Ghana. No additional API key is required. The browser uses the private local `/api/news` adapter; it does not send imported CSV contents or private API keys. The news service requires no additional key. Results are cached in memory per query for 15 minutes, concurrent requests are shared, searches have a six-second minimum interval, and provider failures have a one-minute retry cooldown. If a refresh fails, an existing response up to one day old can be shown with an explicit stale label and its original retrieval time. No invented headlines are substituted. The dedicated News updates view includes fire, bushfire, drought and climate shortcuts. Checks run every 15 minutes while the news view is open and visible; returning to the tab checks the cache again.

The feed shows original publisher links and GDELT indexing dates, which may differ from publication dates. Keyword relevance is not independently verified; news is separate from satellite detections and map/date filters. An empty feed does not establish an absence of fires. No background ingestion, article storage or alerts are implemented. Run `node scripts/test-news.mjs` to check the live provider.

## Scientific boundaries

Counts are satellite detections, not separate fires or burned area. No observations do not establish no burning. Confidence stays sensor-specific. Shared 0.1° cells are period-wide spatial overlap, not matched observations. The baseline is not validated harmonization. The separate experimental context index combines point weather with aligned-cell density and unverified news candidates; it is not validated hazard prediction. NASA requests use rectangular extents; Area assessment supports a polygon subset, not authenticated administrative boundaries. Imported provenance is supplied by the user and not independently verified.

## Data contract and references

Required CSV fields: `latitude`, `longitude`, `acq_date`, `acq_time`. Sensor: `instrument` equal to MODIS or VIIRS; when absent, `bright_t31` identifies MODIS or `bright_ti4` identifies VIIRS. Optional: `satellite`, `confidence`, `frp`. Duplicate key: sensor + satellite + UTC date/time + coordinates. First-seen row wins; file provenance is retained on the surviving row. Existing `source` metadata is preserved; otherwise the filename supplies it. Exports include `dataset_kind` to preserve synthetic identification on reimport. Mixed synthetic/imported batches are rejected. Metadata is user supplied and not authentication of provenance. Invalid rows are reported and skipped. An invalid file aborts the entire import batch.

- [NASA FIRMS data ingest guide](https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html)
- [NASA FIRMS downloads](https://firms.modaps.eosdis.nasa.gov/download/)
- [Vite documentation](https://vite.dev/guide/)

## Remaining scientific and deployment work

- **Data/science:** curate paired MODIS/VIIRS products, define coverage and quality controls, implement and validate harmonization on held-out periods.
- **Application:** dataset persistence, regional boundary selection and performance for large archives.
- **Services:** deploy the local FIRMS adapter as a production backend with private environment variables, cache and quotas. Never place credentials in the browser.
- **Validation/presentation:** reproduce counts from original datasets, test with representative files, document uncertainty, confirm challenge requirements and submission rules.

No validated accuracy claims or emergency alerts should be added without supporting evidence.
