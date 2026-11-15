# Area assessment: experimental methods and use

Open **Research tools > Area assessment**. This addition extends the research prototype; it is not an operational emergency warning system. It does not establish a globally validated risk model or improve competition results by itself.

## Connected ROI dashboard

The map and ROI drawer share polygon state. The drawer supports west/east longitude and south/north latitude as labelled numeric fields, as well as polygon JSON and direct map drawing. Applying a bounding box creates a four-vertex polygon. The drawer, calendar, weather and news modules can collapse independently; the application sidebar retains its existing collapse control. Desktop places the calendar beside weather and news. Tablet layouts reflow into wider rows and phones stack the modules.

The ROI calendar supports all represented years in the loaded time range. Choose raw records, aligned occupied cells, or the saved study's experimental adjusted index when eligible. A comparable imported daily series for the exact polygon also enables adjusted values. Unknown-coverage imported dates are omitted. Month/year totals sum represented daily values only; they are not complete annual totals. A labelled five-step blue ramp uses numeric values and question marks in addition to color. Calendar text meets 4.5:1 contrast across the ramp. Month and day ramps normalize separately to the displayed maximum. The UI does not fabricate a multi-decadal archive.

Selecting a calendar date filters map records, news candidates and source exports. Selecting an individual map mark or a numbered display group focuses its record IDs; matching article candidates and export scope follow those IDs. Selecting a candidate news report highlights and frames the corresponding map records. News diamonds show the imported event coordinates. A 10 km / 24-hour candidate window is not exact incident verification. Clearing focus returns to the day/ROI scope; clearing the day returns to the interval.

Weather refreshes automatically when the ROI or focused target point changes. It uses the first focused record, or an interior point of the ROI when there is no focus. Requests are cancelled and old results ignored on target changes. Temperature, humidity, wind speed, observation time and source are shown. The wind arrow points in the direction air moves; the text also reports the meteorological bearing from which it comes. Missing wind direction is never inferred. Historical timeframes explicitly state that historical weather is unavailable; the current point conditions remain separately labelled. This integration uses the existing Current Weather endpoint, not a historical weather product.

The uncertainty disclosure states **not established** or **experimental**, explains sensor footprint/sampling differences, and shows held-out study error where available. It never invents a common sensor-confidence percentage. The source's own confidence field is retained in CSV exports. Neither polished presentation nor a low reference-sensor error establishes operational suitability.

## Polygon workflow

Draw three or more vertices on the map and finish, or enter JSON coordinates in longitude/latitude order. The initial polygon is the shared selection rectangle. Exact point-in-polygon filtering includes boundary points. Concave polygons are supported. Self-intersections, duplicate vertices, holes, latitude beyond 85 degrees, and antimeridian crossings are rejected. Approximate area uses a spherical latitude/longitude integral, not a cadastral measurement. A different finished polygon clears weather to prevent stale location reuse.

The shared date interval and selected calendar day apply to displayed records and news candidates. Both sensors are used; the toolbar sensor selector is disabled in this view. Scoring independently uses the last 24 hours of loaded records. Drawing does not retrieve data. **Load current NASA for polygon** requests both existing NASA products for yesterday/today in its bounding rectangle and replaces the workspace dataset. Existing request limits, cancellation and prior-data retention apply. Scoring requires a full recent two-product NRT request encompassing the polygon. Large regions may exceed the adapter's request-size limits; no global data coverage is implied.

Optional auto-refresh requests NASA and supporting context every 15 minutes while this view is mounted, visible and online. It defaults off. Score freshness is checked each minute. Neither polling nor a successful request establishes cloud-free observing coverage.

## Wildfire Threat Score: exploratory context index

Version: `exploratory-context-v1`. The visible name includes **experimental**. This is not a calibrated probability, a validated danger category, or a dispatch recommendation.

No validated harmonized live series is available. The implemented density is explicitly an **aligned occupied-cell proxy**: union of 0.1-degree cells occupied by MODIS or VIIRS observations acquired in the last 24 hours inside the polygon, divided by its approximate area, multiplied by 1,000. Multiple observations in the same cell count once. This neither corrects sensor sensitivity nor establishes fire numbers. The older Ghana training factor is not silently transferred to current dates or other countries.

Each component is clamped to [0, 1], then combined and multiplied by 100:

| Component | Weight | Scaling |
| --- | --- | --- |
| Aligned daily-cell density | 0.40 | cells per 1,000 km2 / 10 |
| Wind | 0.20 | m/s / 15 |
| Vapor pressure deficit | 0.20 | kPa / 3 |
| Temperature | 0.10 | (degrees C - 10) / 30 |
| News impact keywords | 0.10 | maximum eligible headline severity, 0.3/0.6/1.0 |

VPD = `0.6108 * exp(17.27*T / (T+237.3)) * (1 - RH/100)`, in kPa. This is derived from temperature and relative humidity, not a directly measured provider field. Humidity is not separately weighted again. Temperature is restricted to -80 through 60 C, RH to 0 through 100 percent, and wind must be finite and nonnegative.

News severity is 1 for fatal/killed/evacuation/destruction keywords, 0.6 for injury/spread/damage, otherwise 0.3. Only safe-URL, user-geolocated articles inside the polygon, with a recent event time, a single interpretable cause keyword and a nearby satellite candidate contribute. News absence is unknown, not zero. Deduplicate matching URLs; syndicated stories, bias, negation and misleading reporting remain limitations. Severity weights and all numerical scaling choices are project heuristics requiring prospective independent validation.

A score is withheld if any required input is absent: complete encompassing NRT retrieval within an hour, recent observations from both sensors, nonsynthetic data, valid point weather inside the polygon observed within three hours, and an eligible news candidate. All missing reasons are shown. Historical demonstrations therefore correctly show unavailable. Weather is one interior point (vertex fallback for concave shapes), not a polygon-wide weather estimate. Missing components are never zero-filled or reweighted.

## Automated anomaly screen

The existing 50-day case study is insufficient for weekly or monthly baselines. Import a reviewed daily series JSON with version 1, exact polygon vertices, source, method, units `occupied_cells`, comparability declaration, and daily date/value/coverage entries. The in-app format example deliberately declares unknown coverage; it is not scientific data.

The engine automatically sums the selected completed seven-day window or complete calendar month and the same calendar windows in earlier years. Every day must have explicit observed coverage and a nonnegative value. At least five complete earlier-year windows are required. Missing dates stay unknown, including leap days; complete February months use their actual lengths. Current/future incomplete periods, different polygons and incomparable series are ineligible. The current year never enters the historical baseline.

Review threshold = `median + max(3 * 1.4826 * MAD, 1)` where MAD is median absolute deviation of prior-year window totals. A higher current total generates **Unusual activity - review evidence**. The safeguard of 1 avoids unstable zero-MAD flags from arbitrarily small differences. This is a robust exploratory threshold, not a validated alert rule.

An empirical rank-tail value `(1 + count(prior total >= current)) / (1 + historical windows)` is displayed with its sample size. It assumes exchangeable years; trend, serial dependence and repeated region/time searches violate that simple interpretation. It cannot be called statistically significant without an appropriate sampling design and multiplicity treatment. Five prior years cannot produce a rank-tail value below 1/6. Imported coverage/comparability is user-declared, not independently authenticated. No push notifications or external alerts are sent.

## News and satellite correlation

Import at most 200 article records with safe URL, original title, event longitude/latitude, eventAt and locationSource. The event must be inside the polygon and within 10 km and 24 hours of an observation to create a candidate. Indexing time is kept separate from event time. Labels are **Reported wildfire (unverified)**, **Reported agricultural/controlled burn (unverified)**, **Reported industrial source (unverified)**, or **Unclassified**. Conflicting keywords and simple negation indicators stay unclassified. Multiple causes on a map record are shown as unverified conflict.

Original records are retained. Weather never assigns cause. No keyword or proximity rule creates a **Verified Wildfire** label. Authoritative incident linkage and independent review are required for verification. Headline-level rules cannot handle all context, future plans, negation, place ambiguity or industrial/nonvegetation sources. The existing GDELT feed remains Ghana-only and unlocated; it is displayed separately and excluded from polygon scoring. Arbitrary global polygons can use separately sourced and geolocated article evidence, but global automatic news geolocation is not implemented.

## Briefings and reproducibility

**Export ROI briefing & hotspots** creates one ZIP download containing `filtered-hotspots.csv`, `summary.pdf`, `summary.txt`, `summary.csv` and `evidence.json`. The records follow the polygon, interval, selected day and optional hotspot/group focus; the visible export-scope line states the count and date selection. Report scope separately identifies the last-24-hour score and historical anomaly period so these are not confused with the source-record filter. The summary and source records are captured before asynchronous PDF generation, preserving one consistent snapshot. Individual downloads remain under a disclosure menu.

Reports include polygon coordinates, approximate area, source products, acquisition/retrieval dates, calibration availability and held-out error, score availability/components, weather point/time/direction, historical totals/baseline/threshold/years, and news candidates with location evidence and URLs. Missing data and method limitations remain visible. These are research briefings for human responder review, not emergency directives. Store source files with the briefing; this view's imported evidence and settings are memory-only.

PDF generation uses a lazy-loaded jsPDF module and an embedded OFL-licensed Source Sans 3 static font assembled from the installed subsets. Latin, Greek, Cyrillic and Vietnamese glyphs are supported; unsupported characters are preserved as explicit Unicode code-point escapes. CSV retains original Unicode and escapes spreadsheet formula prefixes. Font preparation is reproducible with `python scripts/prepare-report-font.py` using fonttools and Brotli; the generated assets are included in the app.

## Validation and next evidence

Synthetic unit/browser fixtures verify geometry, coverage gates, chronological baseline separation, leap-year handling, bounded scoring, missing/stale inputs, safe source URLs, report consistency and responsive behavior. They do not validate hazard prediction or incident classification. Real-world validation needs compatible continuous satellite products, observing-opportunity information, independently reviewed incident/land-cover/reference datasets, calibrated regional weather aggregation, geographic/time holdouts, error costs, and appropriate uncertainty and statistical testing.

Primary sources checked during implementation: [NASA FIRMS map](https://firms.modaps.eosdis.nasa.gov/map/) describes thermal anomalies as potentially arising from fire, agriculture and other sources; [OpenWeather Current Weather API](https://openweathermap.org/api/current) documents coordinates, timestamps, metric temperature, humidity and wind; [GDELT data](https://gdeltproject.org/data.html) distinguishes document search from geographic mentions. The challenge page could not be retrieved during this change, so no new claim of satisfying current judging criteria is made.
