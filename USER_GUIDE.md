# FireScope AI user guide

A practical guide for students, researchers, scientists and the FlareForge team. Learn the controls, understand how observations become results, and practise explaining the evidence. Start with the five-minute walkthrough; use the worked examples and team rehearsal for deeper study.

## Contents

- [Choose your learning path](#choose-your-learning-path)
- [Start here: your first five minutes](#start-here-your-first-five-minutes)
- [Find your way around](#find-your-way-around)
- [Use the map and filters](#use-the-map-and-filters)
- [Run the five-year challenge study](#run-the-five-year-challenge-study)
- [Read the activity calendar](#read-the-activity-calendar)
- [Inspect records and save your evidence](#inspect-records-and-save-your-evidence)
- [Update data data or import your own CSV](#update-data-data-or-import-your-own-csv)
- [Use news and weather as context](#use-news-and-weather-as-context)
- [Understand the main terms](#understand-the-main-terms)
- [When something does not work](#when-something-does-not-work)
- [Follow the data from source to result](#follow-the-data-from-source-to-result)
- [Explain the different comparison methods](#explain-the-different-comparison-methods)
- [Work through the calibration and error scores](#work-through-the-calibration-and-error-scores)
- [Keep a reproducible research record](#keep-a-reproducible-research-record)
- [Practise a complete team walkthrough](#practise-a-complete-team-walkthrough)
- [Use area assessment and research briefings](#use-area-assessment-and-research-briefings)
- [Use the synchronized ROI dashboard](#use-the-synchronized-roi-dashboard)
- [Explain the system during a presentation](#explain-the-system-during-a-presentation)
- [Compare historical detections and burned area](#compare-historical-detections-and-burned-area)

## Choose your learning path

Everyone uses the same evidence. Choose a starting depth rather than treating a job title as a limit. For each screen, learn four things: the question it answers, the input it uses, the meaning of its output, and the limit on that interpretation.

| Your aim | Suggested route and learning outcome |
| --- | --- |
| Student or first-time explorer | Follow the five-minute walkthrough, Map, Calendar and glossary. Explain the difference between an observation, a fire and missing coverage. Inspect one source record and export it. |
| Researcher planning an analysis | Continue through data import, filters, the two comparison methods and evidence exports. Write down your question, extent, dates, products, measure and exclusions before interpreting results. |
| Scientist reviewing the method | Read the calibration calculation, fixed year splits, baseline, January/July errors and sensitivity. Inspect daily exports and SCIENCE_METHOD.md; assess whether the sample and reference support the proposed claim. |
| Team member presenting the system | Complete every route, then do the team rehearsal. Explain each screen in your own words and demonstrate a limitation as well as a result. |

**Remember:** The app's name includes AI, but this build uses deterministic processing, candidate linking and a fitted statistical scale. It does not contain a trained fire-recognition AI, a chat assistant or a validated prediction model.

## Start here: your first five minutes

FireScope helps you explore satellite observations of heat associated with burning and compare MODIS and VIIRS records. A detection is not necessarily a separate fire. This is a research prototype, not an emergency warning service.

1. Open the app. In the development workspace use http://127.0.0.1:5173. If the standalone production server is running, use http://127.0.0.1:4173. Ask the person running the app which address to use.
2. Wait for the saved Ghana example to load: 7,350 observations from 1 to 3 January 2025. These are real, historical NASA records, not today's fires.
3. On Map, press + to zoom in or select a numbered group to zoom toward its observations. Select an individual dot or square to inspect it.
4. Choose Calendar to explore activity by date. Choose News for separate reporting from publishers.
5. To understand the challenge experiment, choose Guided Demo at the top. It replaces the current dataset with the five-year sampled study and walks through the map, sensor comparison and calendar. You can close the walkthrough at any time.

**Remember:** If you imported your own files, export any work you want to keep before starting a demo or loading another dataset. Data is held in browser memory.

## Find your way around

On a phone, navigation appears above the page. Swipe the navigation row horizontally to reach research views and the user guide. Map, Calendar and Data table share your area, date, satellite and selected-day filters. News searches are independent of those filters.

| What you see | What it is for |
| --- | --- |
| Map | See where satellite detections occurred and inspect individual records. |
| Calendar | Explore dates and switch between raw, aligned, linked or experimental adjusted activity. |
| News | Search separate Ghana news reports and open original publisher articles. |
| Research > Sensor comparison | Open the Sensor Lab: calibration evidence, candidate links and common-grid comparison. |
| Research > Observation records | Search, inspect and export the original observations. |
| Research > Methods & sources | Read the scientific methods, limitations and current dataset provenance. |
| Guide | Open this user guide without replacing the loaded dataset. |
| Guided Demo | Load the real five-year case study and follow a three-step walkthrough. |

## Use the map and filters

1. Start with the visible historical example. You do not need to fetch new data to explore it.
2. A numbered marker groups nearby observations. Its number is a record count, not a fire count. Select it to zoom. At closer zoom, orange squares identify MODIS and teal circles identify VIIRS.
3. Select an individual observation. Read its date/time, coordinates, satellite, confidence, fire radiative power and source in the details panel. On a phone, that panel appears below the map.
4. Use the visible area, date and satellite controls when you want to narrow the loaded data. Changing these controls filters observations already in memory. It does not automatically fetch a new dataset.
5. Use Layers to show or hide map layers. Layer visibility changes the map only; use the satellite selector to change the analysis. Use Fit selected study area to return to the selected rectangle.
6. For another area, search for a place or use Area to select two opposite corners. Place search needs an internet connection and configured weather-service access. Coordinate entry is available through Data and coordinate options. Study rectangles are not administrative boundaries.
7. If a day is selected, use Clear day filter to return to the full selected date range. Open Data source & coverage for retrieval and coverage details.

**Remember:** An empty map means no loaded records match the current filters. It does not establish no burning. A basemap failure can also leave markers visible without background geography.

## Run the five-year challenge study

This is the main scientific experiment. It uses 75,823 original NASA standard-processing records from the first five January and July days in each of 2021 to 2025. There are 50 sampled days, not five complete years. The experiment uses MODIS Aqua as a reference; Terra records remain in the original data but are excluded from calibration.

1. Choose Compare the satellites from Map, or open Research > Sensor comparison and choose Load five-year case study. Guided Demo loads the same study with explanations.
2. Read the three year groups: Fit uses 2021 to 2023; Validation uses 2024; Held-out test uses 2025. The adjustment is fitted on the training years only.
3. Start on Held-out test. Compare the three MAE bars: unadjusted VIIRS, the training-only seasonal mean baseline, and adjusted VIIRS. A lower bar means closer agreement with the Aqua reference.
4. Read the adjustment formula and diagnostics beside the chart. The study multiplies daily VIIRS occupied cells by a training-only factor. Fractional output is an index, not a literal number of fires.
5. Read January and July separately under Where does it struggle? A combined score can hide poor performance on a smaller or quieter sample.
6. Open Inspect daily values and study limitations to see the individual dates, grid-size sensitivity and limitations. The factor sensitivity range is not a confidence interval.
7. Choose Export calibration evidence to save the method, fixed year roles, metrics, source checksums, geographic scope and limitations. Choose Export raw vs adjusted CSV for the 50 daily comparison rows.
8. Choose Explore adjusted calendar to inspect the test-year output. The calendar opens at the first sampled test date.

**Remember:** For the full saved Ghana extent, test MAE is 266.1 cells/day before adjustment, about 70.9 afterward and about 76.9 for the seasonal baseline. These are sensor-agreement results, not fire-detection accuracy. A geographic subset refits the experiment and may produce different results or insufficient support. Date filters do not redefine the fixed year splits.

## Read the activity calendar

1. Choose Calendar. Use the month field or Previous month / Next month arrows to move through time. Select a month in the monthly profile for another view of that year.
2. Choose Calendar measure. Raw detections counts records. Aligned occupied cells counts cells containing observations. Experimental linked groups combines candidate pairs with unmatched records. Adjusted activity shows the study's experimental Aqua-reference index.
3. Adjusted activity is available only when a supported case-study calibration is loaded and Both sensors is selected. Loading other data removes that calibration.
4. Read the number inside a day, then select the day to filter the shared observation views. Select it again or use Clear day filter to remove that selection.
5. A question mark means no represented value and unknown observing coverage. No records in a month does not mean no fire activity. A represented zero in the adjusted study means no returned VIIRS detections for the requested sample, not proof of no burning.
6. Use Export daily calendar to download daily values for the selected interval. Unsampled dates are omitted; they must not be filled with zero when using the file elsewhere.

**Remember:** Calendar intensity represents the chosen measure, not fire severity. Totals cover represented samples only. The current study does not establish annual totals, seasonal peaks, significant anomalies or critical-period forecasts.

## Inspect records and save your evidence

1. Open Research > Observation records. The table follows your map area, date, satellite and selected-day filters.
2. Use Search detection records. Try MODIS, a date such as 2025-01-01, a satellite name, coordinates or part of a source name. This searches record fields, not news articles.
3. Select a date/time in a row to inspect the original observation. Scroll horizontally to see remaining columns on a narrow screen.
4. Use Previous records / Next records to move between pages. Up to 100 records appear on each page.
5. Choose Export matching CSV to download all matching rows across every page, not just the visible page.

| Download | Use it for |
| --- | --- |
| Source observations / matching CSV | Original filtered records, source metadata and dataset identification. |
| Daily calendar CSV | The current calendar measure and represented dates. Adjusted exports include the method and factor. |
| Calibration evidence JSON | Study source manifest, fixed year splits, fitted scale, metrics, sensitivity and limitations. |
| Raw vs adjusted CSV | Daily reference, unadjusted, adjusted and seasonal-baseline values for the study. |
| Analysis evidence JSON | The separate point-linking method, tolerances, candidate pair IDs, daily outputs and original observations. |

**Remember:** Export before refreshing, clearing, starting a demo or loading another dataset. There is no user account or database saving your current browser workspace.

## Update data data or import your own CSV

These actions are for deeper exploration. The saved examples are enough for the standard walkthrough. Do not press Update data for the entire five-year study interval: an API search is limited to 1 to 10 UTC days.

1. Use the visible area, date and satellite controls. For a new NASA request, select an area and a date interval of 1 to 10 days, then choose Update data. Loading a result replaces the current dataset.
2. For explicit product or coordinate choices, open Data and coordinate options. Expand Search an area and date range. Use Standard processing / archive for historical research when available; Near-real-time is a different processing product.
3. Keep the rectangle within 400 square degrees, with west less than east and south less than north. Requests cannot cross the antimeridian as a single rectangle.
4. For CSV files, choose Import historical CSV inside Data and coordinate options. Select one or more files, each smaller than 15 MB. Required fields are latitude, longitude, acq_date and acq_time, plus an identifiable MODIS or VIIRS sensor.
5. Import adds to the current observational dataset and removes the special study calibration. To work with your files alone, export what you need, use Clear dataset in the footer, then import. Exact duplicates are removed; invalid rows are reported. If a file fails, the previous dataset is retained.
6. Synthetic examples are labeled. They must not be combined with observational records or used as scientific validation. Real imports replace a currently loaded synthetic example.
7. Use Cancel request if needed. Failed or cancelled requests retain the previous observations. If only one NASA product succeeds, read the partial-source warning before comparing sensors.

**Remember:** NASA credentials belong in the private server environment, never in a CSV, browser field or presentation. Product availability can vary by date.

## Use news and weather as context

News and current weather are supporting context. Neither validates a satellite detection or the calibration method.

1. Choose News. Select Fire reports, Bushfire, Drought or Climate, or type a keyword or phrase into Search Ghana news and choose Search news.
2. Read the publisher and indexing time. Select a headline to open the publisher's site. GDELT indexing time is not necessarily the article publication date, and article locations are not independently verified.
3. Check the retrieval time. A saved-headlines warning means the provider could not refresh the feed. No headlines returned does not establish no fires. The news provider can be temporarily unavailable.
4. For weather, open Current weather context in the map or record details panel. It describes the selected observation point, or the study-area centre if no record is selected.
5. Check the weather observation timestamp and units. Current conditions do not describe a historical fire date, and point weather is not an area-wide average or a fire-risk prediction.

**Remember:** News searches do not change map/date filters. Do not present a headline as an automatically confirmed explanation for a detection.

## Understand the main terms

| Term | Plain-language meaning |
| --- | --- |
| Detection / observation | One satellite record of thermal activity. Multiple records may come from the same burning event. |
| MODIS / VIIRS | Different satellite instruments. Their resolution, sampling and sensitivity differ, so raw counts are not directly interchangeable. |
| Aqua reference | The MODIS Aqua record used for this experiment's comparison. It is not ground truth. |
| Occupied cell | A grid square containing at least one detection on a date. It is not a fire boundary or burned area. |
| Adjusted activity | An experimental daily-cell index made by multiplying VIIRS occupied cells by the training-only factor. |
| Fit / training | Earlier sample dates used to estimate the adjustment factor. |
| Validation | A separate year used to inspect how the fixed method behaves beyond training. |
| Held-out test | A later, separate year evaluated without using it to fit the factor. Further tuning based on this result would make it an exploratory benchmark. |
| MAE | Mean absolute error: average size of the difference from Aqua, regardless of direction. Lower means closer agreement. |
| RMSE | An error measure that puts more weight on large differences. It uses the same cells/day units here. |
| Signed bias | Average adjusted value minus reference value. Negative means lower than Aqua on average; positive means higher. |
| Seasonal mean baseline | A simple alternative that predicts the training-year January or July reference mean. It is a comparison model, not a validated anomaly baseline. |
| Candidate pair / linked group | Experimental point correspondence. A group is a candidate pair or one unmatched record, not a unique fire. |
| Coverage unknown | We cannot establish whether an area was adequately observed. Missing data is not proof of no burning. |
| UTC | The common time standard used for dates and acquisition times in the system. |
| FRP | Fire radiative power, measured in megawatts. It is not burned area or a count of fires. |
| Confidence | The original sensor's confidence field. MODIS numbers and VIIRS categories are different scales. |
| Source checksum | A file fingerprint used to check that saved source bytes have not changed. It does not independently validate the science. |

## When something does not work

| What happens | What to do |
| --- | --- |
| The app address does not open | Ask the person running the app to start the development or production server. A local address works only on the computer running it unless hosting is configured. |
| The map is empty | Clear the selected day, choose Both sensors, check the dates and area, and confirm a dataset is loaded. No matches does not mean no fires. |
| Markers appear but no background map | Check the connection. External basemap tiles may be unavailable; loaded records and table exports still work. |
| Update data rejects the dates | Use 1 to 10 days per request. Filter the saved case study locally instead of fetching its full multi-year interval. |
| The saved study will not load | Ask the maintainer to restore the source files/checksums or run node scripts/prepare-case-study.mjs. Keep any existing observations until it is restored. |
| Adjusted activity is unavailable | Load the five-year case study and choose Both sensors. A small geographic subset may have too little training support; return to the original study extent by reloading the study. |
| Counts change between screens | Check shared area/date/satellite/day filters, the Data table search, and the selected calendar measure. Map layer visibility does not change analysis counts. |
| News is unavailable or stale | Wait a minute before retrying. Read the retrieval timestamp and continue with the satellite workflow. |
| Weather or place search fails | Check the connection and private weather-service setup with the maintainer. Historical weather is not configured. |
| The browser is offline | Keep using already loaded observations, filters and exports. Fresh data, news, weather and map tiles require a connection. |
| A CSV import fails | Check the required columns, valid coordinates, UTC dates/times, sensor identity and file size. The previous dataset is retained. |
| My imported data disappeared after refresh | The workspace is memory-only. Reimport a previously exported CSV. Refresh starts again with the default historical example. |

## Follow the data from source to result

1. Source: NASA FIRMS supplies satellite observations. The three-day snapshot and seasonal study are archived observational inputs. A user CSV is another route; its provenance is supplied by its owner.
2. Ingestion: the app reads coordinates, UTC date/time and sensor identity, reports invalid rows, and removes exact duplicate keys. The key combines sensor, satellite, date/time and coordinates; the first-seen row survives. This does not remove all observations of the same real fire.
3. Selection: area, date, satellite and selected-day filters define the observations being explored. Map layers control visibility only. Data table search further narrows its matching rows. Check these settings before comparing totals.
4. Display: the map positions observations and groups nearby markers for readability. A display group is a zoom aid, not an analytical match or a fire event.
5. Analysis: the calendar counts the selected measure; common-grid comparison describes spatial overlap; candidate linking proposes record pairs. The saved study separately fits and evaluates an aggregate adjustment using fixed year roles.
6. Evidence: CSV exports preserve records or daily values; JSON evidence preserves method details and limitations. Save the selection and processing product with your exports so another person can understand the result.
7. Services and storage: the private server handles NASA, news and current-weather requests and serves saved examples. Imported CSV processing happens in the browser. News and weather do not enter the calibration formula. Refreshing clears the current browser workspace.

**Remember:** Selecting a new rectangle cannot create observations outside the retrieved extent. Fetch or import the required data before interpreting another area.

## Explain the different comparison methods

Illustrative counting example, not a NASA result: a day contains 3 MODIS and 5 VIIRS records. Raw detections are 8. If linking finds 2 pairs, there are 6 linked groups: 2 pairs plus 4 unpaired records, equivalently 8 minus 2. If all records occupy 3 distinct grid cells, the combined daily occupied-cell measure is 3. None of these numbers establishes the number of real fires.

Illustrative linking example: with a 1 km radius and 60-minute tolerance, a candidate 0.4 km away and 20 minutes apart scores 0.4/1 + 20/60, about 0.73. A candidate outside either tolerance is excluded. Even a nearby candidate is excluded across UTC midnight. One coarse observation may correspond to several finer observations in reality; this implementation permits only one-to-one links.

| Method | Calculation and interpretation |
| --- | --- |
| Common-grid alignment | Assign observations to the same 0.1-degree grid. A daily occupied cell has at least one selected detection that day. The period-wide common-grid comparison describes cells occupied by both sensors somewhere in the interval; it does not require simultaneous observations. |
| Candidate observation linking | Process MODIS records in UTC-time and ID order. Among unused VIIRS records within the chosen distance and time tolerance on the same UTC day, choose the lowest distance/radius + time/tolerance score. Each record participates in at most one pair. This greedy rule proposes correspondence; it does not confirm an event. |
| Daily-cell calibration | Count daily VIIRS Suomi-NPP and MODIS Aqua occupied cells separately. Fit one nonnegative multiplier on training dates and evaluate it on separate years. This adjusts an aggregate index; it does not move points or decide which records form a pair. |

**Remember:** Changing linking tolerances changes candidate pairs and linked groups. It does not fit the separate calibration factor. More pairs do not by themselves demonstrate a better method.

## Work through the calibration and error scores

The app estimates beta = max(0, sum(x*y) / sum(x*x)), where x is daily VIIRS occupied cells and y is daily Aqua occupied cells. The sums use training dates only. There is no intercept: zero VIIRS cells produces a zero adjusted index. The actual study uses 30 training days, 10 validation days and 10 held-out test days.

Illustrative arithmetic only: imagine two training days with VIIRS counts 10 and 20 and Aqua counts 4 and 8. The factor is (10*4 + 20*8) / (10*10 + 20*20) = 200/500 = 0.4. On a separate day with 15 VIIRS occupied cells, the adjusted index is 6. The app requires more training support than this two-day teaching example.

If that separate day's Aqua reference is 5, raw error is 15 - 5 = +10 and adjusted error is 6 - 5 = +1. Their absolute errors are 10 and 1. Across many days, MAE averages absolute errors; signed bias averages signed errors, so positive and negative errors can cancel; RMSE squares errors, averages them and takes the square root. RMSE gives larger errors more weight.

The seasonal mean baseline ignores the current day's VIIRS count. It predicts the training January Aqua mean for January samples and the training July Aqua mean for July samples. It tests whether the fitted adjustment adds value over a simple seasonal expectation.

In the full saved study, held-out MAE is approximately 266.1 for raw VIIRS, 70.9 for adjusted VIIRS and 76.9 for the seasonal baseline, in cells/day. Compare the adjustment with both alternatives. Read January and July separately before claiming consistent benefit. These figures describe this extent, grid and sampled test period.

Grid sensitivity repeats the calculation at different cell sizes. Training-year sensitivity leaves out one training year at a time and refits. These checks show dependence on analytical choices and training samples; they do not establish statistical significance or a confidence interval.

**Remember:** Smaller disagreement with Aqua is evidence of sensor agreement on this sample. It cannot establish improved detection of real fires, because Aqua is not independent ground truth. Tuning on the held-out test makes it an exploratory benchmark.

## Keep a reproducible research record

1. Write a question the sample can answer, such as: how do daily occupied-cell counts differ between these sensors on the sampled Ghana dates?
2. Record the dataset, source products, processing mode, retrieval time, bounds and represented dates. Distinguish the three-day snapshot from the 50-day study.
3. Record area/date/satellite/day filters, table search, calendar measure and linking settings. For calibration, record the grid, factor, year roles and whether geographic subsetting caused a refit.
4. Inspect ingestion warnings, partial product failures, exclusions and coverage limits. State how missing dates were handled; do not turn unknown dates into zeros.
5. Export source observations and the relevant daily CSV and evidence JSON. Keep original files with the analysis notes. A checksum verifies file integrity, not scientific correctness.
6. Write the finding with units and scope, followed by its limitation. Example: adjusted VIIRS had lower average disagreement with Aqua on the 10 sampled 2025 dates at the primary grid; independent fire accuracy remains untested.
7. Ask another team member to repeat the selection and explain the result from your evidence. Record method changes as a new experiment.

**Remember:** The browser does not save a research project automatically. Exports and your written settings are the handover record.

## Practise a complete team walkthrough

Use a suggested 45-minute session: 10 minutes for Map and records, 10 for Calendar and exports, 15 for comparison methods, and 10 for questions. Rotate operator, explainer and reviewer roles. Everyone should practise the whole system rather than memorising one screen.

1. Introduce the system: FireScope AI is a research workspace for exploring NASA satellite fire detections and testing an experimental comparison of MODIS and VIIRS activity.
2. Show Map with the saved snapshot. State the dates, source and record count; zoom a group and inspect a record. Explain coordinates, UTC, satellite, confidence and FRP using the glossary.
3. Change and clear a date or satellite filter. Explain why the count changed. Hide a map layer and explain how visibility differs from filtering analysis.
4. Open Calendar. Explain raw detections, occupied cells and linked groups with the counting example. Select and clear a day; explain an unknown date and a represented zero.
5. Open Data table. Search a sensor, inspect a row and export matching CSV. Explain that the download includes all matching pages. Show provenance and limitations in Help & sources.
6. Load the five-year study. State 50 sampled days across 2021-2025. Show training/validation/test roles, baseline, factor, errors and January/July diagnostics. Export calibration evidence and open adjusted activity.
7. Show candidate linking and change a tolerance. Explain why it is separate from calibration and why groups are not actual fires.
8. Open News and explain publisher attribution, retrieval time and independent search. Explain why current weather cannot describe a historical observation. If a provider fails, explain the error and continue with loaded records.
9. Finish by stating what is implemented, what remains experimental, and the next evidence needed. Swap roles and repeat difficult parts in your own words.

| Reviewer asks | A sound answer includes |
| --- | --- |
| Does 7,350 mean 7,350 fires? | No. It is the saved example's record count; one event may produce multiple observations. |
| Why do the sensor counts differ? | Footprints, sampling and sensitivity differ. Counts alone cannot isolate the cause. |
| Why is a calendar date unknown? | No represented value or established observing coverage is available; no records does not prove no burning. |
| What is adjusted activity? | Daily VIIRS occupied cells multiplied by a training-only factor, with Aqua as the reference. |
| Is this five continuous years? | No. Five January and five July days in each of five years: 50 sampled dates. |
| Does lower MAE prove better fire detection? | No. It means closer agreement with Aqua here; independent reference events are still needed. |
| Where is the AI? | This build implements deterministic linking and a fitted statistical scale. No trained fire-recognition or forecasting AI is implemented. |
| How do we recover a workspace? | Save exports, source files and settings. Refresh clears browser memory; account-based project persistence is not implemented. |

**Remember:** A presenter should operate every view, explain units and methods, trace results to sources, and answer these questions in their own words. This rehearsal is a learning exercise, not scientific validation.

## Use area assessment and research briefings

1. Open Workspace > Area assessment. The initial polygon follows your selected rectangle. Draw vertices and finish, or enter [longitude, latitude] coordinates with the keyboard. Drawing filters loaded records; it does not fetch observations.
2. For current activity, choose Load current NASA for polygon. This replaces the workspace dataset with a two-day request for the polygon bounding rectangle. The assessment filters that result to the polygon. Existing request-size limits apply. Optional 15-minute refresh runs only while this view is open, visible and online.
3. Refresh weather & news to request a current point inside the polygon and the existing Ghana headline feed. Check observation/retrieval times. Point weather is not an area average; Ghana headlines are unlocated and do not automatically explain your polygon.
4. Read the experimental Wildfire Threat Score and its missing-input reasons. It combines aligned-cell density, wind, derived VPD, temperature and eligible news keywords using transparent heuristic weights. It is not validated harmonization or a probability of wildfire. The historical examples correctly leave it unavailable.
5. For historical anomaly screening, import a consistently processed daily series for the exact polygon with explicit coverage declarations. Choose a completed week or calendar month. Five complete prior-year windows are required. The existing 50-day sample is insufficient. An unusual-activity badge is a review flag, not an operational warning or a significance claim.
6. Import geolocated article evidence with event time and location source to propose news/satellite matches. Candidates require proximity within 10 km and 24 hours. Cause labels remain unverified; keywords and weather cannot confirm a wildfire or controlled burn. Inspect a single map marker at close zoom to read its candidate tag.
7. Download PDF briefing or Download CSV briefing to save the same scoped research snapshot, including missing inputs, weather time, baseline comparison, source links and limitations. Export before leaving or refreshing this memory-only view.

**Remember:** Researchers must review imported coverage, comparability and incident locations. Read ASSESSMENT_METHOD.md for formulas, eligibility, JSON formats and validation needs. These briefings are for human responder review, not dispatch instructions.

## Use the synchronized ROI dashboard

1. Open Area assessment. Expand ROI drawer & coordinates to enter West longitude, South latitude, East longitude and North latitude, then Apply bounding box. For a freeform boundary, choose Draw polygon, select at least three map positions and Finish polygon. Applying a region filters loaded observations; retrieving new NASA data is a separate action.
2. Use the Burning activity calendar beside the weather/news panels. Select a calendar year or month and choose raw detections, aligned occupied cells or eligible experimental adjusted activity. The calendar uses only represented years in the selected dataset. Question marks mean unknown coverage; partial monthly/yearly totals are not complete fire totals.
3. Select a calendar day to synchronize the map, candidate reports and export records. Select a map point or numbered group to focus its record IDs. Choose Show candidate hotspots on map from a linked report to highlight the corresponding records. Use Clear hotspot focus and Clear ROI day to return to a wider selection.
4. Read the weather timeframe notice before interpreting temperature, humidity or wind. Current point conditions refresh when the ROI or focused target changes. The arrow shows where air moves; the text says where wind comes from. Historical weather is unavailable and is never substituted silently with today's conditions.
5. Open Harmonization confidence to understand the resolution gap and uncertainty. Experimental study error is a comparison against Aqua, not a verified accuracy percentage. Purple news diamonds and reported cause labels remain unverified spatial/time candidates.
6. Choose Export ROI briefing & hotspots for one ZIP containing the filtered source CSV, PDF/text summary, summary CSV and evidence JSON. Check the visible record count and scope first. The score and anomaly periods are stated separately in the report. Individual downloads are available under Individual downloads.
7. Collapse the ROI drawer, calendar, weather or news panel to make space. The sidebar can also collapse. On tablets and phones, panels reflow while keeping their controls, source timestamps and uncertainty explanations.

**Remember:** The design supports deeper archives when loaded; the saved Ghana study still contains only 50 sampled days. The live unlocated headline feed remains Ghana-only, and proximity does not prove a headline describes the exact fire event.

## Explain the system during a presentation

1. Start with the problem: the satellite instruments differ, so more raw detections do not automatically mean more separate fires.
2. Show the real source data and exact sample windows. Say 50 sampled days across five years, not five years of continuous coverage.
3. Show the training, validation and held-out test years, then compare raw, baseline and adjusted errors against Aqua.
4. Say closer agreement with a reference sensor. Do not say 73% more accurate at detecting fires.
5. Open the adjusted calendar, point out an unknown date, and export the evidence.
6. Explain the next science: continuous observing coverage, independent reference events and stronger uncertainty evaluation before anomaly or operational warning claims.

**Remember:** For technical details and reproduction, read SCIENCE_METHOD.md. For the suggested team narrative, read CONTEST_DEMO.md. For server setup and hosting, read DEPLOYMENT.md. These are project files supplied with the build.

## Compare historical detections and burned area

The Activity calendar includes a separate 2024–2025 archive with 731 days requested for both MODIS and VIIRS. It contains 549,208 deduplicated observations and is separate from the frozen 50-day calibration study.

Mapped burned area comes from NASA MCD64A1.061, a nominal 500 m monthly product mirrored by Microsoft Planetary Computer. Totals are available for 18 months. Six months lack complete source tiles and show Unavailable; that does not mean no burning.

1. Open Activity calendar and find Historical archive & burned area.
2. Choose Research area and Research year. These controls apply to this comparison, separately from the active workspace filters. On a phone, scroll the table sideways to see burned area and source actions.
3. Read MODIS and VIIRS detection counts separately from mapped burned square kilometres. Check valid-land and shortened-mapping-period percentages.
4. Choose Load month to replace the active dataset with original source records. The map and calendar use that full month and selected research extent.
5. Export the monthly comparison or daily history, or download the source manifest for product identifiers, URLs and checksums.
6. In Fire explorer, open Layers and enable NASA true-color imagery. It follows the selected UTC day or range start and shows its date and tile status.

**Remember:** Rectangles are not administrative boundaries. Completed requests do not prove cloud-free coverage. MCD64A1 uses MODIS active fires and is not independent validation. The comparison does not establish fire risk or detection accuracy.
