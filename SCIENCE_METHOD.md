# Experimental cross-sensor calibration

This is a reproducible sensor-reference experiment for the MODIS/VIIRS burning-activity-calendar challenge. It is not an independently validated harmonized record or an operational warning product.

## Question and reference

Can an adjustment fitted on earlier years reduce disagreement between VIIRS Suomi-NPP and MODIS Aqua daily occupied-cell counts in later, separate years?

MODIS Aqua is a reference measurement, not fire truth. MODIS Terra is excluded from this experiment; all original Terra records remain inspectable. Keeping Aqua as a single reference avoids treating combined Terra/Aqua sampling as one sensor pass. Actual observation times still differ and are not corrected.

## Fixed sample and split

The Ghana rectangular extent is west -3.3, south 4.5, east 1.3, north 11.2. Request the first five UTC days of January and July in each of 2021–2025 from MODIS_SP and VIIRS_SNPP_SP. This yields 50 requested days from 20 source files. Both products must return successfully for every window. Keep original CSVs, product names, retrieval timestamps, row counts and SHA-256 checksums in the key-free manifest.

- Training: 2021–2023, 30 days.
- Validation: 2024, 10 days.
- Held-out test: 2025, 10 days.

Windows, splits, the primary 0.1-degree grid and zero-intercept model were set before running the first evaluation. The validation/test samples do not enter fitting. Subsequent changes to this method must be recorded as a new experiment; these test results cannot remain an untouched benchmark after tuning on them.

This is a sparse seasonal sample. It does not represent complete years or establish a fire-season peak. Request completion is known; cloud-free observing opportunity is not. A zero counts returned detections, not absence of burning. Dates outside declared windows stay unknown.

## Transformation and model

For each sensor and UTC date, count unique occupied grid cells anchored at longitude -180 and latitude -90. Coordinates are assigned by floor((coordinate + offset) / grid size). Multiple detections in a cell on a date count once. Latitude/longitude cells are not equal-area; geography and grid-size transfer are unproven.

Let x be VIIRS occupied cells and y be Aqua occupied cells. Fit a nonnegative least-squares scale through the origin using training dates only:

`beta = max(0, sum(x * y) / sum(x * x))`

The adjusted index is `beta * VIIRS occupied cells`, expressed as experimental Aqua-equivalent occupied cells per day. Fractional values are an index, not literal cells or unique fires. This is an aggregate adjustment, separate from experimental point linking. It neither establishes pixel correspondence nor corrects observation coverage or fire sensitivity.

Require at least two training years, 20 training dates, 10 training dates with positive support in both sensors, a separate validation year, and at least five test dates in a later year. Reject overlapping dates, year leakage, synthetic records, NRT inputs in the study and missing source products.

## Baselines and diagnostics

Evaluate MAE, RMSE and signed bias against Aqua for each split. Compare with unadjusted VIIRS occupied cells and a simple January/July reference mean estimated on training days only. Report January and July separately; combined errors can conceal low-activity failures. Also rerun at 0.05 and 0.25 degrees as sensitivity diagnostics, never select a winning grid using test error. Error values in cell units cannot be compared as equivalent area across different grids.

Leave out each training year, refit, and report the factor range. This is a sensitivity diagnostic, not a confidence interval. No significance test or independently validated accuracy score is claimed.

## Reproduce

1. Keep FIRMS_MAP_KEY private in `.env.local`.
2. Run `node scripts/prepare-case-study.mjs`. Completed files are reused after checksum validation; failed downloads leave usable files in place.
3. Run `node scripts/evaluate-case-study.mjs` to verify source checksums, parse with the application's ingestion code, and regenerate `evaluation.json` and `daily-comparison.csv`.
4. Run `npm test`, `npm run build`, and `npm start`.
5. Run `node scripts/verify-case-study.mjs` against the production server on port 4173. It checks real data, year splits, exported evidence, the adjusted calendar and responsive layouts.

The application allows geographic subsetting inside the retrieved bounds. That refits the model within the subset using the same year roles and recalculates its diagnostics. Displayed date filters do not redefine training/test membership. Source imports or loading another dataset remove this study calibration rather than silently reusing a factor.

## What remains scientifically necessary

Expand to representative continuous periods; establish observing opportunity using appropriate swath/cloud/quality information; evaluate geographic transfer and event-intensity effects; study footprint and one-to-many relationships; independently review reference events; quantify uncertainty using a sufficiently supported sampling design. Establish a representative, coverage-adjusted baseline before anomalies or critical-period predictions. Better agreement with Aqua alone cannot show better detection of actual fires.

## Primary references

- [NASA challenge](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)
- [NASA FIRMS area API: products, date intervals and limits](https://firms.modaps.eosdis.nasa.gov/api/area/)
- [NASA VIIRS active-fire product user guide](https://ladsweb.modaps.eosdis.nasa.gov/archive/Document%20Archive/Science%20Data%20Product%20Documentation/VIIRS_C2_AF-375m_User_Guide_1.2.pdf)

The calibration formula and sampling design are this project's experimental choices, not a NASA-approved harmonization algorithm.
