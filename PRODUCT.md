# FireScope AI

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: React and TypeScript, with Vite. CSV import first.

## Product Purpose

Explore historical satellite fire detections in Ghana and compare MODIS and VIIRS observations. A validated harmonization method remains research work.

## Users

Confirmed users: students, researchers, scientists, and the FlareForge team developing, learning and presenting the project. Explanations must support first-time exploration and inspectable technical detail.

## Capabilities and Constraints

Capabilities: CSV import, geographic display, sensor/date filters, measure-switchable burning activity calendar, observation/daily CSV and analysis-evidence JSON exports. A private local adapter loads recent or standard-processing MODIS and VIIRS Suomi-NPP observations for coordinate-defined areas in 1-10 day intervals; a standalone Node production backend and Docker configuration are also supplied, with public deployment still pending. The default historical NASA demonstration covers Ghana, 1-3 January 2025. A separate checksum-verified study contains 75,823 standard-processing records from 50 sampled January/July days across 2021-2025. It fits an experimental daily occupied-cell scale on 2021-2023, validates on 2024 and tests on 2025 against MODIS Aqua plus a training-only seasonal baseline. Adjusted activity, grid/year sensitivity and evidence exports are available; this is sensor agreement, not independent scientific validation or continuous annual coverage. Experimental deterministic same-day one-to-one observation linking has adjustable distance/time and sensitivity comparison; it preserves source records, confidence scales and pixel/product metadata. This is not calibrated harmonization, distinct-fire counting, a multi-year anomaly baseline or operational warning system. News updates is a dedicated searchable GDELT view with topic shortcuts, publisher links, truthful retrieval times and explicit stale/error states. Provider availability is external and live verification failed on 12 November 2026. Synthetic examples are explicitly labeled. Optional current point weather is integrated privately; historical weather is unavailable.

## Evidence on Hand

Public delivery, 14 November 2026: a free Firebase Hosting research demo at https://firescope-flareforge.web.app packages both real NASA examples and supports CSV import, local analysis and exports. It explicitly marks live NASA/weather/news/place-search services as disconnected. The complete Node backend is still local. Porkbun root DNS for firescopeai.study has been pointed to Firebase; certificate/ownership readiness is checked separately. No paid billing was enabled.

Retrospective archive extension, deployed and verified on 15 November 2026: the separate 2024–2025 archive covers 731 requested days and 549,208 observations. MCD64A1 mapped burned area is available for 18 months; six months lack required source tiles and remain unavailable. Three rectangular study scopes—Ghana study extent, Northern Ghana and Tamale—support separate observation counts and monthly km² comparisons, quality disclosures, month loading and exports. These rectangles are not administrative boundaries. The original 50-day calibration experiment remains unchanged. `HISTORY_METHOD.md` records the method; `artifacts/history-verification.json` records software/data consistency checks, which do not establish independent scientific validation. NASA satellite imagery and the expanded archive are deployed at https://firescope-flareforge.web.app. Published bundle/data hashes match the verified build; live desktop/mobile checks passed for filters, exports and original-month loading. See artifacts/history-live-verification.json.

Area assessment extension: polygon drawing and keyboard coordinates, last-24-hour aligned-cell density, a transparently weighted experimental weather/news context index with missing/freshness gates, optional visible-view polling, coverage-aware imported daily-series anomaly screening, user-geolocated unverified news candidates, and matching PDF/CSV research briefings. This does not provide a validated harmonized live risk score, automatic global news geolocation, verified incident attribution or statistically validated operational alerts. Method and data requirements are in ASSESSMENT_METHOD.md. The existing sampled study is insufficient for continuous weekly/monthly baselines.

Confirmed challenge: Harmonization of MODIS and VIIRS Hot Spots, NASA Space Apps. The official 2026 challenge and judging criteria sources are recorded in NASA_ALIGNMENT.md with implemented evidence and open requirements. NASA FIRMS and OpenWeatherMap credentials are saved privately in .env.local and passed API checks. A real NASA standard-processing retrieval returned 1,135 MODIS and 6,215 VIIRS records for the historical demonstration. GDELT news access passed a live check. No validated harmonization model or independently labeled reference dataset is supplied.

## Brand Commitments

FireScope AI, by FlareForge.

User direction (12 November 2026 redesign): a new, modern, light map-first research workspace. White and neutral-gray surfaces, self-hosted Geist typography, orange primary actions/MODIS and teal VIIRS. Grouped navigation exposes all workspace and research views; phone navigation scrolls horizontally and includes the guide. Filters are visible above the map. Preserve source traceability, uncertainty and all scientific capabilities. Mobbin and shadcn inform operational clarity; restrained GSAP transitions respect reduced-motion preferences. The user explicitly selected the light direction, replacing the earlier navy visual identity.

## Product Principles

Preserve source provenance. Explain uncertainty. Make comparisons inspectable. Keep secrets out of the browser.
