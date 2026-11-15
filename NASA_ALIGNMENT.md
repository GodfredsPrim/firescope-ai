# NASA challenge alignment

Latest release and readiness review: **15 November 2026**. The deployed research prototype now includes date-linked NASA imagery, 549,208 observations across all 731 requested dates in 2024–2025, and monthly burned-area comparisons for 18 available months with six missing-source months explicitly unavailable. The original calibration experiment remains separate. See `HISTORY_METHOD.md` and `artifacts/history-live-verification.json`.

The team’s supplied Ghana programme requires submission to the global portal by **13:00 Ghana time on 15 November 2026**, with no further changes after that deadline. This earlier local deadline controls the team’s submission planning. Earlier dated milestones below retain their original development dates; the release date does not establish competition eligibility.

Target: [Harmonization of MODIS and VIIRS Hot Spots, NASA Space Apps 2026](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/).

The challenge calls for a web-based burning activity calendar spanning differing satellite records, with a selected area and historical interpretation. This project supplies a traceable observation workflow, an experimental linking baseline, and a separate training-only daily-cell calibration with a real five-year seasonal study and held-out evaluation. It is not yet an independently validated multi-decade harmonized record.

## Implemented scientific milestone, 12 November 2026

The archived Ghana study contains 75,823 NASA standard-processing records from the first five January and July days of 2021–2025: 50 sampled days, not continuous annual coverage. Original files, retrieval times and SHA-256 checksums are saved under `artifacts/ghana-seasonal-study/`.

The primary experiment counts daily occupied 0.1-degree cells, uses MODIS Aqua as the reference, and fits a nonnegative VIIRS scale through the origin on 2021–2023 only. Validation uses 2024; the held-out test uses 2025. No test/validation samples enter fitting. MODIS Terra is excluded from calibration and retained in original source records.

At the full Ghana study extent, the fitted factor is 0.2560165828. On the 10 held-out test days, mean absolute disagreement with Aqua is 266.1 cells/day for raw VIIRS, 70.9214 after adjustment, and 76.8733 for a training-only January/July reference-mean baseline. The adjusted RMSE is 111.3690 cells/day; signed bias is -16.7905. Training-year omission produces factors from 0.2279 to 0.2667; that range is sensitivity, not a confidence interval. Grid sensitivity at 0.05/0.25 degrees is included in the saved evaluation and UI evidence export, not used to select the primary grid.

These results show cross-sensor agreement on a sparse sample, not better detection of actual fires, independent validity, a continuous historical series or statistical significance. The UI separates January and July performance, exposes raw/daily outputs and limitations, and connects adjusted activity to the calendar while keeping unsampled dates unknown. See [SCIENCE_METHOD.md](SCIENCE_METHOD.md) for the full protocol and reproduction commands.

A standalone Node server and container configuration now support the built frontend and private APIs. Local production verification is separate from public deployment, which remains open.

## Requirement and evidence

| Capability | Current evidence | Status |
|---|---|---|
| NASA data access | Private FIRMS adapter; MODIS and VIIRS Suomi-NPP; recent or standard-processing searches, 1-10 days, specified rectangle | Implemented; upstream availability varies |
| Historical input | Multi-file CSV import plus a checksum-verified, five-year NASA seasonal sample | Implemented; continuous, representative multi-year coverage is still needed |
| Area of interest | Coordinate bounds and preset study areas, map extent, date/sensor filters | Implemented; rectangular extents, not administrative boundaries |
| Consistent schema | Coordinates, UTC timestamp, sensor, satellite, confidence, FRP, scan, track, version and source | Implemented; confidence remains sensor-specific |
| Cross-sensor correspondence | Deterministic, same-UTC-day, one-to-one linking with adjustable distance/time and a distance sensitivity comparison | Experimental; not a calibrated harmonization model |
| Sensor-reference adjustment | Training-only daily-cell scaling; held-out years, simple seasonal baseline, error metrics, grid/year sensitivity and evidence exports | Implemented experiment; independent fire-truth and coverage-aware validation remain open |
| Burning activity calendar | Raw detections, linked groups, occupied cells and experimental adjusted study activity; CSV export | Implemented; omitted days are unknown, not confirmed zero |
| Historical patterns | Loaded-year calendar, highest observed activity dates with drill-through | Implemented within loaded observations; no anomaly significance claim |
| Multi-year anomalies / critical periods | Needs representative multi-year overlap and coverage information | Not implemented; do not substitute recent counts or news for a baseline |
| Reproducible evidence | Source CSV, daily activity CSV and JSON containing parameters, IDs of candidate pairs, provenance, limitations and daily outputs | Implemented |
| Prediction / emergency alerts | No scientifically evaluated forecast or operational alert system | Not implemented or claimed |

## Judging lens

The team's confirmed local event is **Accra, Ghana**. The impact, creativity, validity, relevance and presentation headings below are a preparation framework; Accra-specific judging rules and weights have not been verified. The Accra event page could not be retrieved during the 15 November check. Use the team's supplied local programme for timing and the current portal/local-lead instructions for submission requirements.

| Criterion | What this project can demonstrate | Evidence still required |
|---|---|---|
| Impact | A land manager or researcher chooses a study area, finds dates with observed activity and inspects/export sources | Interviews or task testing with intended users; measured benefit over the existing workflow |
| Creativity | Inspectable linking, source-preserving comparison, parameter sensitivity and a measure-switchable calendar | Comparison with existing NASA FIRMS tools and a clear account of the contribution |
| Validity | Typed data contract, sensor-specific confidence, traceable sources, software tests, explicit unknown coverage | Held-out evaluation against an independently reviewed reference dataset; coverage, footprint and sensitivity treatment |
| Relevance | Map, calendar, selected area, MODIS/VIIRS comparison, historical imports and downloadable outputs | Demonstrate consistent multi-year interpretation across the sensor transition |
| Presentation | Clear start actions, restrained fire palette, responsive views, original records, method page and evidence exports | Record a concise real-data demo; prepare the required project page and local submission assets |

## Scientific validation gate

1. Curate compatible standard-processing products across representative overlapping years and fire seasons. Retain original files, access dates, product versions, spatial bounds and quality rules. Do not combine NRT and standard-processing records as if they were the same product.
2. Assemble independently reviewed candidate correspondences and non-matches. Split by geography and time before fitting or choosing thresholds. Synthetic UI fixtures are not reference evidence.
3. Evaluate linking precision/recall where reference labels permit; separately report MODIS-only and VIIRS-only observations. Test one-to-many relationships and midnight sensitivity against the current one-to-one, same-day baseline.
4. Quantify sensitivity to distance/time, view angle, scan/track dimensions, cloud, overpass cadence and smaller-fire detection differences. Do not convert categorical VIIRS confidence to a made-up numeric probability.
5. Develop and evaluate a coverage-aware calibration on held-out periods before describing the output as a consistent cross-sensor historical series. Report uncertainty and a comparison with the raw baseline.
6. Only then add seasonal anomalies against an adequately observed multi-year reference. Distinguish missing observations from zero detections and report the reference years and sample support.

## Demo sequence

1. Load latest NASA observations. State the area, products, UTC interval and whether both sources returned records.
2. Select a day, inspect a map point, and show product provenance. Explain that a detection is not a separate fire.
3. Import a compatible historical overlap dataset. Open Sensor comparison and inspect candidate pairs and retained unmatched records. Change a tolerance to demonstrate sensitivity.
4. Return to the calendar. Switch measures and export daily activity plus analysis evidence.
5. Close with the validation gate and next scientific work. News is contextual reporting; it does not validate the satellite series.

## References

- [Official challenge](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- [NASA FIRMS area API](https://firms.modaps.eosdis.nasa.gov/api/area/)
- [NASA FIRMS data ingest guide](https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html)
- [NASA VIIRS 375 m active-fire algorithm document](https://viirsland.gsfc.nasa.gov/PDF/VIIRS_activefire_375m_ATBD.pdf)

The current correspondence rules are this project's experimental design, not a NASA-approved algorithm. Software test passes establish implementation behavior, not scientific accuracy or competition acceptance.
