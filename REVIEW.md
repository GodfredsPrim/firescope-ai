# First-build review

## Release readiness review, 15 November 2026

Deployed NASA date-linked imagery and the separate 2024–2025 historical archive/burned-area comparison. Verified 549,208 observations, 731 completed request dates, 316 source CSVs and 144 raster files. Burned-area totals are available for 18 months; six incomplete-source months remain unavailable. An independent January 2025 Tamale raster check agrees with the preparation result.

Production build, 58 tests across 12 files, and the credential scan including JSON/CSV outputs pass. Published bundle/data hashes match the production build. Live browser checks pass area/year filters, missing-month labels, CSV downloads, original source-month loading and mobile overflow checks with no page errors. UI finish-review disposition: **Accept; no material issues found**. Evidence: `artifacts/history-verification.json` and `artifacts/history-live-verification.json`.

This records the release reviewed on 15 November; earlier development milestones below retain their actual dates. Technical readiness does not establish competition eligibility or completion of the portal submission. The team’s supplied local deadline is **13:00 Ghana time on 15 November 2026**.

## Connected ROI dashboard, 12 November 2026

Refined Area assessment into a connected evidence workflow: a collapsible polygon/bounding-box coordinate drawer, map group/record focus, day-synchronized calendar/map/news/exports, current target-point weather with meteorological wind origin and movement arrow, transparent harmonization uncertainty disclosure, accessible blue density ramp, and collapsible modules/sidebar. Desktop calendar/weather/news composition reflows for tablets and phones. Drawing a rectangular ROI from the main Map opens this dashboard. The primary export creates one ZIP with filtered hotspot CSV, PDF/text summary, summary CSV and evidence JSON, captured from the same scope snapshot. Individual exports remain available.

Impeccable guided grouping and native disclosures while preserving the navy/amber/teal brand; responsive-design guided column changes and controls; data-visualization guided printed values, unknown markers and the sequential blue ramp. Unit assertions verify at least 4.5:1 light-text contrast across all five ramp fills. Current weather is explicitly separate from historical satellite dates; candidate news locations remain unverified. Loaded samples are never presented as a complete multi-decadal archive, and no confidence percentage is invented.

Validation: 52 tests and production build pass. Expanded labelled-fixture browser checks pass numeric bounding-box and polygon validation/drawing/undo, module/sidebar collapse, uncertainty disclosure, wind origin/movement, date filtering, news-to-map focus, individual-hotspot automatic weather location, ZIP contents, PDF/CSV output, region changes, provider failure retention, and 1440/768/390/320px layouts without page errors. The 75,823-record real study regression and guide regression pass; the study test now correctly uses its configured 45-second assertion timeout for archive loading. Two configured credentials remain absent from ten built client files. The two-page fixture PDF preserves uncertainty and wind metadata and has no out-of-page text blocks; rendered pages were inspected.

Independent finish-review verdict: **Pass for scientific-prototype scope**, no blocking fixes. Minor singular/plural and weather-timeframe copy notes were addressed. Layout detector returned no findings. Vite retains an advisory warning for the roughly 511 kB uncompressed main chunk; the assessment, guide, PDF and ZIP modules use separate/lazy chunks. Screenshot and fixture checks do not establish complete assistive-technology conformance, real-device field usability, live provider reliability or scientific/operational validity.

## Polygon research assessment, 12 November 2026

Added Research tools > Area assessment with polygon drawing/keyboard entry, exact spatial subsetting, current NASA bounding-box retrieval, an experimental 0–100 context score, derived point-weather VPD, optional 15-minute visible/online polling, coverage-aware historical screening, unverified geolocated news/satellite candidates, and matching PDF/CSV briefings. Original Map/Calendar/study functionality is retained. Impeccable and frontend-design guided the existing navy/amber/teal extension; error-handling UX guided explicit unavailable/stale input states; the PDF workflow guided embedded-font output and rendered review. Multi-component React review kept assessment and PDF code lazy-loaded, independent requests parallel, callbacks stable and request results guarded against region changes/unmounts.

Scientific scope is explicit: aligned-cell density is a proxy, not validated harmonization; point weather is not a polygon average; cause labels remain unverified. The 50-day study does not supply continuous historical baselines. The anomaly engine requires an imported comparable daily series with declared coverage and at least five complete prior-year windows. The robust threshold and rank-tail diagnostic do not claim statistical significance or operational warning validity. Global automatic news geolocation is not implemented; the existing unlocated feed remains Ghana-only. Full method and formats: ASSESSMENT_METHOD.md.

Validation: 46 tests pass; production build passes; two configured private credentials remain absent from nine client files. New labelled-fixture browser checks pass polygon topology/keyboard entry/drawing/undo, current NASA loading, score missing-input gates, geolocated candidate labels, historical badge, weather failure retention, region invalidation, PDF/CSV exports, 1440/768/390/320px layouts and absence of page errors. The real 75,823-record case-study regression and user-guide regression pass. The fixture PDF renders into two pages with expected text and no out-of-page text blocks; first/last previews were visually inspected. No live hazard or incident accuracy is claimed.

Independent finish-review verdict: **Pass with minor polish notes**, no blocking fixes. Both PDF notes were addressed: component values use readable labels and reduced spacing removes a nearly empty final page. The mechanical detector found seven advisory type/palette differences against the older design documentation and no structural findings. Basemap geography was unavailable in the fixture screenshots; tile availability and full assistive-technology usability remain unverified in this review.

## Challenge science milestone, 12 November 2026

Implemented an experimental daily occupied-cell calibration separate from point linking. Curated and checksum-verified 75,823 NASA standard-processing observations across 50 requested January/July sample days in 2021–2025. Original 20 source files, retrieval metadata, manifest, evaluation JSON and daily comparison CSV are in `artifacts/ghana-seasonal-study/`. The fixed 0.1-degree experiment uses Aqua as a reference, fits on 2021–2023, validates on 2024 and tests on 2025. It compares unadjusted VIIRS, a training-only January/July mean baseline and adjusted VIIRS, with year-omission and grid-size sensitivity. Results are cross-sensor agreement, not independent fire-detection accuracy.

The Sensor Lab shows the comparison, split controls, method, signed bias/RMSE, January/July breakdown, daily evidence and limitations. Adjusted calendar activity preserves unsampled dates as unknown. Guided Demo now presents the study and its test result. A standalone Node server serves the built frontend and private adapters, with a per-IP API limit, health endpoint, static path protection and a Docker deployment configuration. Public hosting and container execution are not claimed.

Validation: 34 unit tests and production build pass. `verify-case-study.mjs` passes against the standalone production server on port 4173 using real archived observations, matching saved metrics and exported evidence, explicit unknown-month accessible labels, daily CSV/calendar downloads and 1440/768/390/320px layouts without page errors. Updated workspace regression and fixture-based news checks also pass. Two private credentials remain absent from built client files. Mechanical scan reported only 21 advisory palette/type differences against older design documentation.

Independent Impeccable finish-review disposition: **Ready for handoff**.

| Material finding | Final disposition |
|---|---|
| Missing months announced as zero to screen readers | Resolved: visible and accessible month labels share the same presence predicate; missing months announce unknown coverage, represented zero remains numeric zero. Exact browser assertion passes. |

The documenter appended a scoped calibration extension to DESIGN.md without rewriting its earlier historical system. Impeccable guided local extension, accessibility and independent finish review; data-visualization guided zero-based, directly labeled comparisons and adjacent evidence. Full protocol: SCIENCE_METHOD.md. Presentation narrative: CONTEST_DEMO.md. Runtime instructions: DEPLOYMENT.md.

Open scientific requirements: representative continuous periods, observing opportunity, geographic transfer, independent reference events, stronger uncertainty evaluation and a defensible anomaly/critical-period method. The five-year seasonal sample cannot establish annual totals, seasonal peaks, significant trends, emergency risk or contest success.

## Student navigation simplification, 12 November 2026

Responding to feedback that the workspace felt complicated, reduced the initial navigation to Map, Calendar and News. Compare satellites, Data table and Help & sources remain under Research tools; direct links and the guided demo still open those views. Area/date/satellite controls, detailed provenance and the comparison explanation use native disclosures. A plain-language map instruction and visible historical-example context orient students before research terminology. Impeccable guided removal of simultaneous choices; onboarding-design guided immediate exploration with the existing real snapshot rather than a setup wizard.

Validation: 26 unit tests, production build and the full browser workflow pass. Browser checks also assert research controls are hidden on arrival, remain accessible, and preserve all six views at 1440/768/390/320px. Mechanical scan found only five advisory type-size differences against older design documentation. No student usability study has been run; this is an implementation improvement, not evidence that students can complete tasks unaided.

## News desk and reliability, 12 November 2026

Added a dedicated News updates navigation destination and a source-led, responsive news desk. Topic shortcuts, query search, original publisher links, indexing dates, actual retrieval time, skeletons, empty states and provider recovery follow the existing navy/amber/teal observatory direction. Impeccable guided state coverage and mobile behavior; frontend-design guided factual content and source-led headline rows. The mobile navigation now provides six readable destinations in two rows.

The server coalesces concurrent context requests, retains original news retrieval timestamps, applies bounded provider cooldown, and can return a previously fetched response up to one day old with an explicit stale flag. The client rejects unsafe or credential-bearing article URLs. Loaded satellite data and exports remain accessible during news failures and offline periods. Navigation moves keyboard focus to the page heading; skip links preserve the current view. A visible day-filter control avoids hidden filtering. Cancelled CSV imports cannot overwrite a newer operation.

Validation: 26 unit tests pass and the production build passes. News browser checks use clearly labeled fixtures to test search, links, cache, empty/error/stale states, offline satellite continuity, keyboard skip navigation and 1440/768/390/320px layouts without page errors. Two configured private credentials remain absent from client output. Design scan: 26 advisory font/palette differences against the older light-theme DESIGN.md; no other scan findings. Results are saved in artifacts/news-design-scan.json.

Live GDELT verification failed twice, including outside the network sandbox. The integration is implemented, but current live provider availability is not established. No fake headlines or successful-live-service claim is substituted. The production backend and independent scientific validation remain open.

## Observatory continuation, 12 November 2026

Verified the in-progress observatory workspace using Impeccable and frontend-design, preserving the recorded midnight navy, amber MODIS and teal VIIRS direction and source-based content. Corrected map aggregation to use cells approximately matching cluster target sizes, reducing overlapping markers while retaining all records and sensor counts.

Validation: 23 unit tests pass; production build passes. The current browser check (`scripts/verify-workspace.mjs`) loads the real 7,350-record snapshot, checks MODIS search and pagination, record inspection, a 1,135-row provenance-preserving CSV export, 401 experimental candidate links and all three guided-demo steps. All five views pass overflow checks at 1440, 768, 390 and 320 pixels with no page errors. Desktop and mobile screenshots are saved under `test-results/workspace-*`. Two configured private credentials are absent from generated client files.

The mechanical design scan reports advisory palette/type differences because DESIGN.md still documents the earlier light interface; WORKSPACE_AUDIT.md records the newer direction. This documentation mismatch remains open. Earlier UI verification scripts target the original navigation. Scientific validation and production backend deployment remain unfinished.

## MODIS/VIIRS challenge refinement, 12 November 2026

The latest finish review returned **Ready for handoff** for the implemented UI/workflow scope. This does not establish scientific harmonization validity or competition acceptance.

| Area | Final verdict |
|---|---|
| Desktop visual finish | Pass |
| Mobile navigation correction | Resolved |
| Mobile calendar composition | Pass |
| Responsive layout | Pass |
| Source traceability | Pass |
| Scientific contract | Pass |
| Overall | Ready for handoff |

Evidence: 17 unit tests; bounded archive request and malformed-input rejection; deterministic one-to-one candidate linking; source/pixel metadata roundtrip; browser fixture checks for both sensors, two known candidate pairs, daily calendar measures, CSV/JSON downloads and 320px/390px/desktop layouts with no browser errors. The real historical NASA workflow returned 1,135 MODIS and 6,215 VIIRS records for Ghana, 1-3 January 2025; the default experimental settings produced 401 candidate pairs. Those results demonstrate execution, not validated correspondence accuracy. Original NASA CSVs and key-free provenance are saved in artifacts/nasa-ghana-2025-01-01_03/.

Open scientific/deployment requirements are tracked in NASA_ALIGNMENT.md. The following section retains the original prototype review.

## Original prototype review

Verdict: Pass. No outstanding material issues in the reviewed source and desktop/mobile screenshots.

| Original finding | Status | Evidence |
|---|---|---|
| Broken basemap | Resolved | OSM geography and attribution visible; mobile fully loaded. |
| Excessive table height | Resolved | Bounded scrolling table confirmed at both sizes. |
| Export/reimport provenance loss | Resolved | Original source and synthetic classification survive roundtrip. |
| Stale selected observation | Resolved | Date changes clear selection and reset pagination. |
| Outdated CARTO copy | Resolved | Provider reference removed. |
| Keyboard inspection beyond 100 records | Resolved | Pagination exposes every observation through table buttons. |
| Horizontal scrolling discoverability | Resolved | Explicit scrolling cue added. |

Validation: production build, eight data-pipeline tests, browser workflow checks (demo, navigation, import, day filtering, export, invalid-file recovery), mobile overflow check, no browser errors. Dependency audit: zero known vulnerabilities at verification time. This is a prototype UI/data review, not scientific validation of harmonization.
