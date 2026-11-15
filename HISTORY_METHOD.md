# Continuous historical requests and burned-area comparison

The Activity calendar contains a separate descriptive archive covering every calendar date from 1 January 2024 through 31 December 2025. It does not refit or replace the existing five-year, 50-day calibration experiment. No new blind evaluation, improved accuracy, causal relationship or operational warning is claimed.

## Observation archive

`node scripts/prepare-history.mjs` uses the private FIRMS key in `.env.local` to retrieve `MODIS_SP` and `VIIRS_SNPP_SP` for disjoint intervals of at most five days, the current upstream historical-request limit. Original CSVs and SHA-256 metadata are retained in `artifacts/continuous-history`. A rerun verifies cached checksums before reuse. Monthly packages and a key-free manifest are written to `public/data/history`. The public browser downloads one requested month, not the full raw archive.

All 731 dates require successful requests for both products. Counts are deduplicated by product/sensor, satellite, UTC acquisition date/time and numeric coordinates, matching the application’s observation identity. Zero counts indicate no returned detections in a completed request; clouds, overpass opportunity and missed burning remain unknown. This is continuous request coverage, not continuous observation or independent fire truth.

## Burned area

`node scripts/prepare-burned-area.mjs` discovers NASA MCD64A1 Collection 6.1 assets in the Microsoft Planetary Computer STAC collection `modis-64A1-061`. Temporary public storage tokens are used only in memory. Unsigned asset URLs, STAC identifiers, original GeoTIFFs and SHA-256 checksums are retained in `artifacts/burned-area`. The public manifest contains provenance and summaries; it does not publish access tokens or full raster files.

Each month requires exactly four disjoint source tiles: h17v07, h17v08, h18v07 and h18v08. Missing or duplicated tiles cause the whole month’s area summary to be unavailable, with the reason recorded. Missing source data never becomes zero burned area.

Calculation uses native sinusoidal pixel centres with the MODIS sphere radius 6,371,007.181 m. Geographic coordinates are recovered as latitude = y/R and longitude = x/(R cos(latitude)), then tested against each rectangular extent. Native pixel area is the absolute raster-transform x/y resolution product, about 0.21466 km², rather than assuming a nominal 500 m × 500 m cell. Edge cells are included by centre; no fractional boundary clipping is performed. Grids and dimensions of QA and Burn_Date must agree.

QA bit 0 must identify land, bit 1 must identify sufficient valid data, and Burn_Date must be in 0–366. Mapped burned area sums eligible pixels whose burn date falls inside the product calendar month. QA bit 2 identifies a shortened reliable mapping period. Those mapped burns remain in the total, and a separate full-period-only sensitivity total is exported. Invalid land is excluded rather than assumed unburned. The valid-land percentage is valid land cells divided by land cells; shortened-period percentage is shortened valid cells divided by valid land cells. These are product-quality measures, not detection accuracy or continuous cloud-free coverage.

The same fixed rectangles are used for the observation counts and raster-centre summaries: Ghana study extent [-3.3, 4.5, 1.3, 11.2], Northern Ghana [-3.3, 8.3, 1.3, 11.2], and Tamale [-1.4, 8.9, -0.3, 10.0], in west/south/east/north order. These are not administrative boundaries. The comparison has its own explicit area/year controls; loading a source month updates the main workspace selection.

MCD64A1 uses MODIS active-fire observations alongside reflectance and is not independent validation of FIRMS. Small burns can be missed; omitted and cloud-obscured areas may bias seasonal comparisons. Annual sums would count repeated burns across months and must not be described as unique annual burned footprint. The interface presents monthly values and separate units without converting hotspot counts into area.

## Sources and verification

- NASA product DOI: https://doi.org/10.5067/MODIS/MCD64A1.061
- NASA user guide, QA definitions and projection: https://lpdaac.usgs.gov/documents/1006/MCD64_User_Guide_V61.pdf
- Public mirror: https://planetarycomputer.microsoft.com/dataset/modis-64A1-061
- NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/content/active_fire/

`npm test` checks QA interpretation, date boundaries, native pixel-area calculation and invalid dimensions. `node scripts/verify-history-data.mjs` checks saved manifests/source integrity, all requested dates, matching month totals and independent raster spot checks. Browser verification covers controls, month loading, exports and mobile overflow. Checks establish software/data consistency, not independently measured fire accuracy.
