"""Detailed rehearsal script grounded in the saved release and research evidence."""
from pathlib import Path
import json, statistics, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/FireScope-Detailed-Judges-Presentation-Script.pdf'
TMP = ROOT / 'tmp/pdfs/judges-script'
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)
report = json.loads((ROOT/'artifacts/ghana-seasonal-study/evaluation.json').read_text())['report']
history = json.loads((ROOT/'artifacts/history-verification.json').read_text())
t = report['metrics']['test']
pdfmetrics.registerFont(TTFont('Read', str(ROOT/'public/fonts/source-sans-3-regular.ttf')))
pdfmetrics.registerFont(TTFont('Bold', 'C:/Windows/Fonts/seguisb.ttf'))
pdfmetrics.registerFontFamily('Read', normal='Read', bold='Bold', italic='Read', boldItalic='Bold')
INK, MUTED, ORANGE, TEAL, LINE = map(HexColor, ['#242930','#525b66','#b83b12','#087f82','#dfe2e6'])
styles = {
 'body': ParagraphStyle('body',fontName='Read',fontSize=11,leading=15.1,textColor=INK,spaceAfter=9),
 'small': ParagraphStyle('small',fontName='Read',fontSize=9.4,leading=12.8,textColor=MUTED,spaceAfter=7),
 'title': ParagraphStyle('title',fontName='Bold',fontSize=24,leading=29,textColor=INK,spaceAfter=12),
 'sub': ParagraphStyle('sub',fontName='Read',fontSize=11.5,leading=16,textColor=MUTED,spaceAfter=15),
 'head': ParagraphStyle('head',fontName='Bold',fontSize=12.4,leading=16,textColor=TEAL,spaceBefore=9,spaceAfter=7),
 'say': ParagraphStyle('say',fontName='Read',fontSize=11.5,leading=16.2,textColor=INK,spaceAfter=11),
 'table': ParagraphStyle('table',fontName='Read',fontSize=9.5,leading=12.8,textColor=INK),
}
story=[]
titles=[]
spoken=[]
def p(text, style='body'): return Paragraph(text,styles[style])
def add(text, style='body'): story.append(p(text,style))
def head(text): add(text,'head')
def say(text):
    spoken.append(text)
    add('"'+text+'"','say')
def cue(text): add('<b>Operator:</b> '+text,'small')
def page(title, sub):
    if titles: story.append(PageBreak())
    titles.append(title)
    add(title,'title'); add(sub,'sub')
def table(headers, rows, widths):
    data=[[p(str(c),'table') for c in row] for row in [headers]+rows]
    tb=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#f1f3f4')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),.4,LINE),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story.append(tb);story.append(Spacer(1,9))
def qa(q,a):
    story.append(KeepTogether([p(q,'head'),p(a)]))

page('FireScope AI: the judges\' script','FlareForge | Accra, Ghana | Prepared 15 November 2026')
add('A detailed presentation and rehearsal manual', 'head')
add('Use this guide to explain what the team built, demonstrate the working application, defend the research decisions and answer technical questions. The aim is to show understanding through evidence, clear reasoning and a successful walkthrough.')
add('<b>Project:</b> FireScope AI: A Transparent Fire Activity Calendar<br/><b>Challenge:</b> Harmonization of MODIS and VIIRS Hot Spots<br/><b>Working research demo:</b> <link href="https://firescope-flareforge.web.app/" color="#b83b12">firescope-flareforge.web.app</link>')
head('The message every presenter should understand')
add('Different instruments can report different detection counts even when viewing related burning activity. FireScope keeps the original measurements visible, explores comparability with a simple testable adjustment, and connects historical patterns to downloadable evidence.')
add('Our demonstrated result is improved agreement with MODIS Aqua on a small held-out sample. We have not established independent fire-detection accuracy, a fully harmonized multi-decade record, or an operational warning system.')
head('How to use this manual')
add('Pages 3-6 contain the main spoken presentation. Pages 7-9 give the exact demonstration sequence and recovery guidance. Pages 10-16 explain the science, data, terms and implementation. Pages 17-19 prepare you for questions and rehearsal. Page 20 identifies evidence and references.')
add('Read the quoted paragraphs aloud. Read the operator cues silently. Study the technical pages rather than trying to deliver the whole manual in one judging slot. Timing is a rehearsal target; confirm the actual speaking allowance with the Accra organizers.', 'small')

page('Your presentation plan','A clear story first; technical depth when the judges ask for it.')
table(['Part','Pages','Purpose'],[
 ['Opening and problem','3','Explain why sensor differences matter.'],
 ['Workspace and evidence','4','Demonstrate real records and the historical archive.'],
 ['Method and result','5','Explain the fixed split, adjustment and baselines.'],
 ['Quality and close','6','State what was verified and what remains open.'],
 ['Guided operation','7-9','Prepare clicks, expected values and fallbacks.'],
 ['Technical preparation','10-16','Understand the vocabulary and design choices.'],
 ['Defense and rehearsal','17-19','Answer questions accurately and consistently.'],
 ['Sources','20','Trace claims back to code, artifacts and NASA.'],
],[130,45,324])
head('Choose a version to fit the slot')
add('<b>Five-minute slot including questions:</b> deliver the opening on page 3, one source inspection from page 4, the central result on page 5 and the closing paragraph on page 6. Aim for about three minutes, leaving questions.')
add('<b>Ten-minute slot including questions:</b> rehearse pages 3-6 for approximately five to six minutes, including prepared clicks. Leave at least three minutes for discussion. Do not spend the entire slot reading.')
head('Team handoffs')
add('Assign a lead speaker, a demo operator, a science respondent and an engineering respondent. One person can hold multiple roles. Agree on the same dataset names, units and limitations. Do not invent personal contributions; each member should describe the work they actually did.')
add('<b>Handoff:</b> "I will ask our science presenter to explain how we tested comparability."<br/><b>Recovery:</b> "Let us separate the interface check from the scientific question; they establish different things."', 'small')

page('Spoken script: the problem','Opening | Target 0:00-1:10 | Lead speaker')
cue('Open the public site before the call. Show the main map with the dated Ghana snapshot. Keep a second tab ready for the sampled study and a third for the historical archive.')
say('Good afternoon, judges. We are FlareForge from the Accra local event. Our project is FireScope AI, a transparent fire activity calendar built around NASA MODIS and VIIRS observations.')
say('The question behind our project is simple: if one satellite reports more hotspots than another, does that necessarily mean there were more fires? It does not. The instruments have different spatial resolutions, acquisition times and detection behavior. A difference in the record can come from the instrument as well as the landscape.')
say('A hotspot is a thermal detection, not automatically a unique wildfire. The same burning event can produce multiple observations. A satellite can also miss burning because of clouds, timing or the size and intensity of the source. We therefore preserve the observations and their limits rather than converting every dot into a confirmed incident.')
say('We built a workspace where students and researchers can move from a map and calendar to the original records, compare instruments, inspect a reproducible adjustment experiment and export the evidence. Our contribution is the connected, inspectable workflow and the experiment behind it.')
head('If asked why Ghana')
add('"We chose defined Ghana study extents for a focused demonstration. These are rectangles, not official administrative boundaries. Restricting geography makes this prototype easier to inspect; it does not establish transfer to other countries."')
head('Terms you have just used')
add('<b>Spatial resolution:</b> the size of the ground detail represented by a measurement.<br/><b>Acquisition time:</b> when the instrument observed the location.<br/><b>Thermal detection:</b> an algorithm-identified heat-related observation.<br/><b>Harmonization:</b> making measurements from different instruments more comparable while accounting for their differences.', 'small')

page('Spoken script: the workspace','Demonstration | Target 1:10-2:35 | Speaker and operator')
cue('Select a visible observation, or use the data table if the map is slow. Show its UTC date/time, satellite, confidence and source fields. Then open Calendar and scroll to Historical archive & burned area.')
say('This initial example contains 7,350 original observations from Ghana for 1-3 January 2025. We can inspect the instrument, satellite, coordinates, UTC acquisition time, confidence and source. Those fields matter because a map symbol alone does not explain how a measurement was produced.')
say('The calendar lets us explore activity in the loaded evidence. We distinguish raw detection counts from occupied grid cells and experimental adjusted activity. A change of measure changes the meaning of the value; it does not merely recolor the same number.')
say('We also prepared a separate 2024-2025 historical archive. It contains 549,208 deduplicated observations across 731 dates for which both product requests completed. We deliberately call this request coverage: a completed download does not prove that every location was observable through cloud or observed continuously.')
cue('Select Research area = Tamale and Research year = 2025. Point to January, then a month labelled Unavailable, such as May 2025. Keep count and area columns visible together.')
say('Alongside detections we show NASA mapped burned area in square kilometers. These are different measurements: observations of heat and an estimate of mapped burned surface. Eighteen months have the required raster inputs. Six months are unavailable because required source tiles are missing; we do not turn missing inputs into zero burned area.')
say('A user can load a source month back into the workspace and export the comparison, daily history and source manifest. The workflow goes from a pattern to its underlying evidence.')
add('Keep the full Ghana extent when presenting the calibration numbers on the next page. Changing its study extent refits the model and can change the displayed metrics.', 'small')

page('Spoken script: the experiment','Science | Target 2:35-4:15 | Science presenter')
cue('Use Open harmonization study, or Compare satellites > Load five-year case study. Confirm the full Ghana extent, Five-year sampled study badge and Held-out test 2025 selection.')
say('Our calibration experiment is separate from the two-year descriptive archive. It uses 75,823 original records sampled on the first five days of January and July in each year from 2021 to 2025. That is 50 sampled days, not five complete years.')
say('For each UTC day, we count unique occupied 0.1-degree grid cells for VIIRS and MODIS Aqua. Counting a cell once reduces the influence of multiple detections inside that cell on that day, although it does not remove all differences between instruments.')
say('We fit one nonnegative scale factor on 2021-2023 only. We check 2024 separately and evaluate 2025 as the held-out test. The factor is approximately 0.2560. We multiply the VIIRS daily occupied-cell count by this factor to form an experimental Aqua-equivalent index. Aqua is our comparison reference, not ground truth.')
cue('Point to all three comparison bars, then signed bias and the January/July breakdown. Do not display only the percentage improvement.')
say('On the ten test days, mean absolute disagreement with Aqua is 266.1 cells per day for raw VIIRS and 70.9 after adjustment. A simpler training-only seasonal baseline scores 76.9. The adjustment is closer to Aqua on this sample, but its advantage over the simple baseline is modest.')
say('We also inspect January and July separately, larger-error sensitivity through RMSE, signed bias, other grid sizes and leave-one-training-year-out factors. These diagnostics help expose weaknesses. They do not provide independent fire truth or a statistical confidence interval.')
say('Our conclusion is specific: this simple adjustment reduced cross-sensor disagreement on the declared held-out sample. We do not call that 73 percent better fire-detection accuracy.')

page('Spoken script: quality and close','Evidence and next steps | Target 4:15-5:30 | Lead speaker')
cue('Show Explore adjusted calendar, a represented sampled date, then an unknown date. If time permits, download Export calibration evidence. Avoid switching the active dataset before finishing this illustration.')
say('Here the adjusted calendar preserves the distinction between a represented date and an unsampled date. For example, January 6 is outside our five-day January sample. Its coverage is unknown; it is not a confirmed zero. That distinction is essential for a defensible historical interpretation.')
say('We keep source files, retrieval metadata and SHA-256 checksums. The exported evidence records the study bounds, fixed year roles, factor, daily values and limitations, so another person can inspect the calculation rather than rely on our presentation.')
say('The recorded release checks passed 58 software tests across 12 files, a production build, source-integrity checks and live browser workflows. The saved history checks reconcile 316 source CSVs and 144 raster files. A separate raster calculation also reproduced the prepared January 2025 Tamale result. These checks establish implementation and data consistency; they do not independently prove fire-detection accuracy.')
say('The public site uses saved NASA observations. It supports browser analysis, imports and exports, while live private NASA, weather and news adapters are not connected on that deployment. We make that deployment boundary visible.')
say('Our next research steps are broader representative samples, observing-opportunity information, independent reference events, geographic transfer and uncertainty evaluation. We would then be in a stronger position to assess long-term harmonization and anomalies.')
say('FireScope makes satellite fire evidence easier to inspect, compare and explain. We believe the quality of the project is demonstrated by its working workflow, reproducible method and clear boundaries. Thank you; we are ready to discuss the science or walk through the evidence.')
add('The test count above is the recorded 15 November release result, not a claim that the application test suite was rerun while preparing this manual. Rehearse your own delivery and shorten it to the actual slot.', 'small')

page('Walkthrough A: orient and inspect','Exact controls, expected evidence and the explanation behind each action.')
table(['Action','Expected evidence / what to explain'],[
 ['1. Open the public demo','Use firescope-flareforge.web.app. State that it is a saved-data research demo.'],
 ['2. Check the dataset badge','The initial Ghana snapshot is 1-3 January 2025, with 7,350 records before narrower filtering.'],
 ['3. Inspect a map mark','Show the observation details. If a mark represents a group, drill into a record or use the data table.'],
 ['4. Read satellite and UTC time','Sensor and platform are different concepts. UTC standardizes date grouping.'],
 ['5. Read confidence and FRP','Confidence is product-specific; FRP is power associated with the thermal signal, not burned area.'],
 ['6. Open Calendar','Explain which measure is selected before interpreting its values or colors.'],
 ['7. Clear temporary filters','Restore the intended area, dates and satellites before comparing totals or loading the study.'],
],[145,354])
head('A useful record-inspection explanation')
add('"This point tells us what the instrument reported at a particular time and location. It does not by itself tell us the fire cause, exact perimeter, event identity or emergency severity. We keep those interpretations separate from the measurement."')
head('What to demonstrate with a filter')
add('Choose one sensor and show the count change. Explain that you changed the selected records, not the underlying physical activity. Restore the filter. Avoid giving an expected count for a narrower selection unless you can read it from the screen.')
head('If the map tiles fail')
add('Continue with the data table and calendar. The observations and coordinates remain evidence even if the external basemap cannot load. Say "The external basemap is unavailable; the saved source records are still accessible." Never imply that missing tiles mean missing fires.')

page('Walkthrough B: defend the study','Load this after the initial map demonstration; use the full Ghana extent for saved headline values.')
table(['Action','Expected result'],[
 ['Open harmonization study','Loads the sampled study and shows Does the adjustment carry into another year?'],
 ['Alternative route','Open Compare satellites, then Load five-year case study if the study is not loaded.'],
 ['Select Held-out test 2025','Ten sampled days; adjusted MAE 70.9, raw 266.1, seasonal baseline 76.9.'],
 ['Select Validation 2024','Adjusted MAE about 59.3. Explain that these dates did not enter fitting.'],
 ['Return to Held-out test 2025','Keep the reported test metrics consistent with the presentation.'],
 ['Inspect daily values and study limitations','Show January/July support, daily values, grid diagnostics and limits.'],
 ['Export calibration evidence','JSON preserves manifest, scope, report, diagnostics and reproduction instructions.'],
 ['Export raw vs adjusted CSV','Daily comparison contains all 50 sampled dates and their split membership.'],
 ['Explore adjusted calendar','Opens adjusted activity; January 2025 is the intended example month.'],
 ['Inspect January 6, 2025','Outside the sampled window: no sampled records, coverage unknown.'],
],[166,333])
head('Explain why the unknown date matters')
add('"If we filled unsampled dates with zero, we would manufacture evidence of no activity. That could distort averages, seasonal patterns and later anomaly calculations. Unknown is an informative scientific state."')
head('Avoid a demonstration trap')
add('The calendar date filter does not redefine training and test years. Geographic subsetting does refit within the selected bounds using the same year roles. If the factor differs from 0.2560, check the study extent before describing it as a bug. Loading another dataset removes this calibration rather than applying an unrelated factor silently.')

page('Walkthrough C: history and exports','The descriptive archive is separate from the frozen calibration experiment.')
table(['Action','Read or explain'],[
 ['Open Calendar; scroll to Historical archive & burned area','This panel has its own Research area and Research year controls.'],
 ['Choose Tamale, then 2025','A rectangular study scope. Counts and area use matching geographic bounds.'],
 ['Inspect January 2025','The saved independent raster check gives about 1,660.0 mapped km2 for this rectangle/month.'],
 ['Inspect May 2025','Mapped burned area is Unavailable. Required source tiles are incomplete.'],
 ['Read Valid land cells and Shortened period','Product-quality fractions, not probabilities of fire detection or certainty.'],
 ['Export monthly comparison','Includes counts, area, quality values, bounds, retrieval times and interpretation.'],
 ['Export daily history','Contains per-day MODIS/VIIRS counts for the chosen area/year and coverage caveat.'],
 ['Download source manifest','Preserves archive/product provenance and source checksums.'],
 ['Load month on January 2025','Replaces the active dataset with source-month observations and updates the selected study extent.'],
],[165,334])
head('Explain the January spot check accurately')
add('The saved check counted 7,733 eligible burned pixels and computed 1,659.9555 km2 for the Tamale rectangle in January 2025. This is an independent implementation check against the same raster source, not validation against independent ground observations.')
head('Recovery if a download is blocked')
add('Allow browser downloads or use previously saved exports. Identify them as saved exports and state their scope and date. If a panel is still loading, wait briefly; do not repeatedly change controls. Keep screenshots and local artifacts ready as a clearly labelled fallback.')
add('The six unavailable months are July 2024 and May, July, August, September and October 2025. Availability concerns burned-area source completeness; it does not mean the corresponding FIRMS observation month is missing.', 'small')

page('Understand the instruments','The vocabulary behind the problem, in language you can use with judges.')
table(['Term','Meaning and why it matters'],[
 ['MODIS','Moderate Resolution Imaging Spectroradiometer. Instruments on Terra and Aqua; nominal active-fire resolution is about 1 km.'],
 ['VIIRS','Visible Infrared Imaging Radiometer Suite. Our study uses the Suomi-NPP 375 m active-fire product.'],
 ['Sensor versus satellite','The sensor measures; the satellite carries it. MODIS is a sensor; Aqua and Terra are platforms.'],
 ['Pixel / footprint','The ground region represented by a measurement. Nominal resolution is not a surveyed fire boundary; footprints vary with viewing geometry.'],
 ['Overpass','A satellite pass over the area. Observations from different times need not represent the same stage of burning.'],
 ['FIRMS','NASA Fire Information for Resource Management System, distributing active-fire observations and access services.'],
 ['Standard processing / NRT','Science-processing archive and near-real-time products are distinct processing streams. This fixed study uses standard-processing inputs.'],
 ['FRP','Fire Radiative Power, reported in megawatts: a radiative-power measure, not fire perimeter, area or a complete severity score.'],
 ['Confidence','An algorithm/product-specific detection-quality indicator. VIIRS categories and MODIS numeric values are not interchangeable probabilities.'],
 ['UTC','Coordinated Universal Time. A common time basis prevents inconsistent local-date grouping across files.'],
],[128,371])
head('Analogy to remember')
add('Two cameras with different zoom, shooting times and obstructions can produce different object counts. Multiplying one count may align averages, but cannot recover everything hidden from the other camera. Our adjustment has the same fundamental limitation.')

page('Three datasets, three purposes','Never merge their coverage claims when answering a question.')
table(['Evidence set','Coverage','What it is for'],[
 ['Initial dated snapshot','7,350 records; Ghana; 1-3 January 2025','Quick map, record and export demonstration.'],
 ['Frozen sampled study','75,823 records; 50 days; first five January/July days in 2021-2025','Training/validation/test experiment on sensor-reference agreement.'],
 ['Descriptive historical archive',f"{history['observationRecords']:,} observations; {history['requestedDays']} completed request dates; 2024-2025",'Monthly/daily history and mapped burned-area comparison.'],
],[120,175,204])
head('Why all three can coexist')
add('The quick snapshot makes the interface easy to demonstrate. The sparse study has a fixed evaluation design. The expanded archive supplies full calendar request coverage over two later years. Adding the larger archive does not turn the earlier test into a new blind evaluation, and it does not prove that the calibration works continuously.')
head('Geographic scope')
add('Bounds are west, south, east, north in longitude/latitude degrees:<br/><b>Ghana study:</b> -3.3, 4.5, 1.3, 11.2.<br/><b>Northern Ghana:</b> -3.3, 8.3, 1.3, 11.2.<br/><b>Tamale:</b> -1.4, 8.9, -0.3, 10.0.')
add('These are rectangular extents. A bounding box can include locations outside a named administrative boundary. Area assessment supports polygon filtering, but the historical comparison uses the declared rectangles.')
head('Coverage has several meanings')
add('<b>Request coverage:</b> the service successfully returned the requested dates/products.<br/><b>Observing opportunity:</b> whether the satellite could actually see the location at a useful time and quality.<br/><b>Sample support:</b> the dates represented in our experiment.<br/><b>Raster completeness:</b> whether all required source tiles exist for a monthly area calculation.')
add('Always say which type you mean. None of these alone establishes absence of burning.', 'small')

page('Explain the calibration formula','One fitted parameter, a declared reference, and no validation/test observations in fitting.')
head('From detections to daily occupied cells')
add('For each sensor and UTC date, assign coordinates to a fixed 0.1-degree grid anchored at longitude -180 and latitude -90. A cell with one or more observations contributes one to that sensor\'s daily count. This reduces repeated within-cell counts, but does not make sensor sensitivities identical. The grid is geographic, so cells are not equal-area.')
head('Fit a scale using training dates only')
add('<b>x:</b> VIIRS occupied cells on a training date.<br/><b>y:</b> MODIS Aqua occupied cells on the same UTC date.<br/><b>beta = max(0, sum(x * y) / sum(x * x))</b><br/><b>adjusted index = beta * VIIRS cells</b>')
add('The sum runs over the 30 training dates in 2021-2023. The formula is least squares through the origin: it chooses a scale that minimizes summed squared disagreement with the training reference. Nonnegative means the scale cannot be negative. Zero intercept means zero VIIRS support produces a zero adjusted index; this is a model assumption, not proof that Aqua or actual burning must also be zero.')
head('An arithmetic example, not a new result')
add('With the fitted beta of 0.2560166, a day with 100 VIIRS occupied cells produces about 25.6 experimental Aqua-equivalent cells. The fraction is valid as an index. It does not mean 25.6 fires, 25.6 physical pixels or 25.6 square kilometers.')
head('Why use a simple model?')
add('A single factor is easy to inspect, reproduce and challenge. A more complex model could absorb more sample-specific behavior without establishing general validity. Simplicity does not guarantee correctness; it makes this baseline experiment easier to audit.')
add('Aqua alone is the reference. Terra stays in the original records but is excluded from this fit, avoiding the interpretation of combined Terra/Aqua sampling as a single reference instrument. The method still does not correct exact overpass differences, clouds or missed small fires.', 'small')

page('Explain evaluation and baselines','A lower score needs a meaningful comparator and an honest unit.')
table(['Split','Days','Raw MAE','Adjusted MAE','Seasonal MAE'],[
 [label,str(report['metrics'][key]['days']),f"{report['metrics'][key]['rawMAE']:.1f}",f"{report['metrics'][key]['adjustedMAE']:.1f}",f"{report['metrics'][key]['seasonalBaselineMAE']:.1f}"]
 for key,label in [('train','Fit 2021-2023'),('validation','Check 2024'),('test','Test 2025')]
],[135,40,95,112,117])
add('All MAE values above are occupied cells per UTC day, at the primary 0.1-degree grid and full Ghana study extent. They measure disagreement with Aqua, not actual fire detection error.', 'small')
head('Define the metrics')
add('<b>MAE:</b> mean absolute error, average |prediction - reference|. If two daily errors are +10 and -20, MAE is 15.<br/><b>RMSE:</b> root mean squared error, square root of the average squared error. It emphasizes larger misses. Adjusted test RMSE is 111.4 cells/day.<br/><b>Signed bias:</b> average prediction - reference. Adjusted test bias is -16.8 cells/day, so the adjusted series is lower than Aqua on average. Positive and negative errors can cancel in bias.')
head('Why the seasonal baseline is essential')
add('For January dates, predict the mean Aqua January daily count from training years; do the equivalent for July. This baseline uses season alone and no current VIIRS count. It asks whether our adjustment adds value beyond a simple seasonal expectation.')
add(f"The adjusted test MAE is {100*(1-t['adjustedMAE']/t['rawMAE']):.1f}% lower than raw VIIRS, but only {100*(1-t['adjustedMAE']/t['seasonalBaselineMAE']):.1f}% lower than the seasonal baseline. The second comparison gives a more demanding view of added value. Neither percentage is an increase in fire-detection accuracy.")
head('Leakage and future testing')
add('Leakage means fitting or choosing a method using information that is supposed to remain unseen for evaluation. Our factor uses training dates only. If we tune the method after inspecting this test, we need a newly reserved evaluation set before calling a later result blind.')

page('Where the experiment can fail','Use diagnostics to explain weaknesses rather than conceal them.')
seasonrows=[]
for season in ['January sample','July sample']:
    days=[d for d in report['days'] if d['split']=='test' and d['season']==season]
    mae=lambda key: statistics.mean(abs(d[key]-d['referenceCells']) for d in days)
    seasonrows.append([season.replace(' sample',''),str(len(days)),f"{mae('adjustedCells'):.2f}",f"{mae('seasonalBaselineCells'):.2f}"])
table(['2025 window','Days','Adjusted MAE','Seasonal MAE'],seasonrows,[145,55,150,149])
head('Sample size and seasonality')
add('Five January days and five July days cannot represent an entire year, establish a seasonal peak or support a multi-year anomaly climatology. January contributes much larger absolute errors than July in this sample. A combined average can hide this imbalance. The ten test days are not evidence of broad geographic or seasonal generalization.')
head('Sensitivity is not confidence')
add('Leaving out each training year and refitting gives factors from 0.2279 to 0.2667. This describes how the fit changes when training support changes; it is not a probability interval for the true factor. We also inspect 0.05- and 0.25-degree grids. We do not choose the primary grid by its test score, and cell-unit errors across different grid sizes are not equivalent area errors.')
head('What a global scale cannot fix')
add('It cannot reconstruct fires missed by Aqua, identify the true number of incidents, correct clouds, equalize observation times, estimate exact footprints, or guarantee the same behavior for different fire intensities and land covers. Agreement can improve while important physical information remains unresolved.')
head('Point linking is a different experiment')
add('The linking tool uses a deterministic one-to-one rule within adjustable distance/time tolerances on the same UTC day. It suggests candidate correspondences and retains unmatched records. Real events can produce one-to-many observations or cross midnight. Linking is not the aggregate calibration and is not independently verified event matching.')

page('How mapped burned area is calculated','A separate monthly product, with explicit spatial and quality rules.')
add('<b>MCD64A1.061</b> is NASA\'s monthly MODIS burned-area product, Collection 6.1. FireScope accesses mirrored raster assets through Microsoft Planetary Computer. A raster is a grid whose cells store measurements or classifications; Burn_Date and QA are raster layers.')
head('Our calculation, in order')
add('<b>1. Require source completeness.</b> Each month requires h17v07, h17v08, h18v07 and h18v08. Missing or duplicated required tiles make the monthly summary unavailable.')
add('<b>2. Match grids and select the extent.</b> Burn_Date and QA dimensions must agree. Transform native sinusoidal pixel centers to geographic coordinates and test those centers against the selected rectangle. Boundary pixels are included by center, without fractional clipping.')
add('<b>3. Apply quality gates.</b> QA bit 0 must indicate land and bit 1 sufficient valid data; the burn-date value must be in 0-366. Count eligible burned cells whose positive burn date belongs to that product calendar month. Invalid land is excluded rather than assumed unburned.')
add('<b>4. Use native pixel area.</b> Multiply eligible burned-cell count by the absolute product of native raster x and y resolution, about 0.21466 km2 per cell. A nominal 500 m product label is not a reason to assume exactly 0.25 km2 per cell.')
add('<b>5. Disclose quality and sensitivity.</b> QA bit 2 flags a shortened reliable mapping period. Its mapped burns stay included, while exports also provide a full-period-only area total. Report valid-land and shortened-period fractions alongside area.')
head('What the comparison cannot establish')
add('MCD64A1 can miss small burns and uses MODIS active-fire information, so it is not independent validation of FIRMS. Counts and km2 must keep separate units. A sum of monthly area can include repeated burning of the same place; it is not necessarily a unique annual burned footprint.')
add('Saved January 2025 Tamale check: 7,733 burned cells, 1,659.9555 km2. The check verifies calculation consistency from the source raster, not independent real-world accuracy.', 'small')

page('Engineering quality and reproducibility','Explain how a result travels from its source to the judge\'s browser.')
table(['Layer','Implementation and reason'],[
 ['Interface','React, TypeScript and Vite; Leaflet map; date/sensor/area selection; calendar, study diagnostics and exports.'],
 ['Source processing','NASA CSV retrieval, validation, duplicate handling, UTC grouping, source metadata and archived originals.'],
 ['Archive packaging','24 independently loadable source months avoid forcing a full raw two-year download at once.'],
 ['Raster processing','GeoTIFF inputs, source-tile checks, QA interpretation, native pixel areas and extent summaries.'],
 ['Public deployment','Firebase Hosting serves the built app and saved key-free research data. Browser analysis and CSV imports remain usable.'],
 ['Private local backend','Node adapters can use private NASA/weather credentials locally; those live adapters are disconnected on the public demo.'],
],[128,371])
head('Provenance and checksums')
add('Provenance records where data came from, which product/version was used, when it was retrieved and what transformations were applied. A SHA-256 checksum is a file fingerprint: it helps detect changed bytes. It does not prove that a satellite observation is scientifically correct.')
head('Recorded release evidence, 15 November')
add('58 tests across 12 files, production build and client credential scan passed. History verification reconciled 549,208 observations, 731 dates, 316 CSVs and 144 rasters. Published bundle/manifests and a source-month package matched local hashes. Browser checks covered controls, missing labels, exports, source loading and mobile overflow. These are scoped software/data checks, not a certification of the entire scientific method.')
head('Reproduce, without exposing secrets')
add('Use the saved source files and evaluation script to regenerate daily metrics; inspect exported parameters and checksums. Developers can run the documented build/tests and browser checks. Keep .env.local and API keys private. Do not open terminal environment output during judging.')

page('Questions: science and statistics','Answer the question directly, then point to the evidence.')
qa('Have you solved harmonization?', 'We implemented a reproducible baseline experiment and an inspectable workflow. We have not established a validated long-term harmonized record. The current factor improves agreement with Aqua on a sparse held-out sample; broader coverage-aware evaluation remains necessary.')
qa('Why choose Aqua if it can miss fires?', 'Aqua is a declared reference sensor, not truth. Using one platform gives a clear comparison target instead of combining Terra/Aqua sampling. It cannot tell us which instrument is more correct; independent reference events are needed for that question.')
qa('Does 73.3% mean your system is 73.3% more accurate?', 'No. It is the reduction in mean absolute disagreement relative to raw VIIRS against Aqua on ten sampled test days. Against a simple seasonal baseline the reduction is about 7.7%. Neither result measures accuracy against actual fires.')
qa('Why not fit a neural network or a more complex model?', 'This sample is small and uneven. We chose a transparent single-parameter baseline so the calculation and split can be audited. More complexity needs more representative data, a fresh evaluation design and evidence of benefit over simple baselines.')
qa('Why only January and July?', 'They provide two declared seasonal windows for a bounded prototype experiment. They do not represent complete seasons. We should expand to continuous, representative periods rather than infer annual behavior from those windows.')
qa('What does zero mean?', 'In a completed request, zero means no returned detections, not proof of no burning. Outside the sampled study windows, the state is unknown. Missing burned-area source tiles produce unavailable, not zero area.')
qa('Is your test statistically significant?', 'We do not claim significance. The ten test days and training-year sensitivity checks are limited evidence. A stronger design needs representative support, dependence-aware uncertainty treatment and genuinely new evaluation data.')

page('Questions: product and implementation','Be specific about what runs publicly and what users can inspect.')
qa('What is new if NASA FIRMS already exists?', 'We do not replace NASA detection products or claim a comprehensive competitor study. Our contribution connects a calendar, source inspection, a declared calibration experiment, comparison diagnostics, a separate burned-area archive and evidence exports in one research workflow.')
qa('Is the app live?', 'The public website is deployed and uses saved real NASA data. It supports exploration, imports, analysis and exports. Live private fire retrieval, weather, news and remote place lookup are not connected on that deployment. Date-linked imagery depends on an external NASA service.')
qa('What does AI mean in FireScope AI?', 'The displayed calibration is a deterministic statistical method, not a trained operational forecasting AI. ChatGPT/Codex assisted implementation, debugging, data-processing scripts, reviews and documentation. The team must understand, review and take responsibility for the code and claims; NASA source observations were not generated by AI.')
qa('Can you send emergency alerts or predict next week\'s fires?', 'No validated forecast or operational alert is claimed. Area assessment has exploratory context tools, but current weather and news do not establish historical fire truth or validated hazard probability. We would require a separate evaluation before operational use.')
qa('How do you know the app was built well?', 'We can demonstrate source-preserving outputs, fixed evaluation roles, missing-data behavior, source checksum checks, raster QA handling, recorded software tests and deployed workflows. These support implementation quality within the reviewed scope, not universal reliability or independent scientific accuracy.')
qa('What happens without internet?', 'Already loaded data can support some browser analysis, but we do not promise a fully offline app. Initial loads, basemap tiles, imagery and downloads of source months can require network access. Use clearly labelled saved screenshots/exports as a judging fallback.')
qa('Who benefits, and have you tested that?', 'The current audience is students and researchers who need inspectable comparisons. Broader land-management value is a future hypothesis. We have not measured field benefit or completed a formal user study with intended operational users.')

page('Rehearsal and confident delivery','Demonstrate understanding by explaining the reason behind the action.')
head('Before the call')
add('1. Open the working public URL and preload the snapshot, full-Ghana sampled study and historical comparison in separate tabs.<br/>2. Check browser zoom and font readability at the actual screen-sharing size.<br/>3. Save one calibration evidence JSON, daily CSV and history comparison locally.<br/>4. Hide credentials, private messages and unrelated tabs.<br/>5. Agree the role handoffs and actual time allowance.<br/>6. Rehearse once with a stopwatch and once with interruptions.')
head('A compact version when time is cut')
add('"FireScope helps researchers inspect NASA fire observations without treating detections as unique fires. We connect maps, a calendar, source records and exports. Our separate 50-day study fits a VIIRS adjustment on 2021-2023 and tests 2025 against MODIS Aqua. Test MAE falls from 266.1 to 70.9 cells/day, versus 76.9 for a simple seasonal baseline. That is better sensor agreement on this sample, not independent fire accuracy. Our two-year historical archive and burned-area comparison preserve source completeness and missing values. We can show the original records, fixed splits and exported evidence."')
head('Five statements to get exactly right')
add('<b>Say observations,</b> when reporting 549,208.<br/><b>Say 50 sampled days,</b> when describing 2021-2025.<br/><b>Say agreement with Aqua,</b> when reporting MAE improvement.<br/><b>Say unavailable,</b> when burned-area inputs are incomplete.<br/><b>Say recorded software verification,</b> when discussing the 58-test release.')
head('When you do not know')
add('"We have not evaluated that yet. Here is what the current evidence establishes, and here is the test we would need." This answer is stronger than inventing an accuracy number or claiming a feature that is not publicly connected.')
head('A concrete next-study proposal')
add('Extend to representative continuous periods and new geographic regions; add observing-opportunity metadata; define independently reviewed event references; reserve new evaluation data; compare simple and coverage-aware methods; then quantify uncertainty and geographic transfer. Only after that assess anomalies or operational uses.')

page('Evidence and reference desk','Project facts are tied to saved artifacts; scientific product definitions have primary references.')
head('Internal evidence to keep available')
table(['Source in the project','Use it to support'],[
 ['SCIENCE_METHOD.md','Sample dates, grid, factor formula, reference sensor, fixed splits, reproduction and limitations.'],
 ['artifacts/ghana-seasonal-study/evaluation.json','Exact factor, daily values, test/validation metrics and training-year sensitivity.'],
 ['HISTORY_METHOD.md','History deduplication, raster projection, pixel centers, QA flags and missing-tile rules.'],
 ['artifacts/history-verification.json','731 dates, 549,208 observations, source counts, unavailable months and raster spot check.'],
 ['artifacts/history-live-verification.json','Recorded deployed-file/bundle hash comparison.'],
 ['src/CalibrationPanel.tsx; src/HistoryResearch.tsx','Controls, visible labels, export contents and loading behavior used in this walkthrough.'],
 ['DEPLOYMENT.md; REVIEW.md','Recorded deployment boundary, release checks and review scope.'],
],[229,270])
head('Primary product and service references')
refs=[
 ('NASA FIRMS active-fire products','https://firms.modaps.eosdis.nasa.gov/content/active_fire/'),
 ('NASA FIRMS data ingest guide','https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html'),
 ('NASA MCD64A1 Collection 6.1 DOI','https://doi.org/10.5067/MODIS/MCD64A1.061'),
 ('MCD64A1 Collection 6.1 user guide','https://lpdaac.usgs.gov/documents/1006/MCD64_User_Guide_V61.pdf'),
 ('NASA GIBS access documentation','https://nasa-gibs.github.io/gibs-api-docs/access-basics/'),
 ('Planetary Computer MCD64A1 mirror catalogue','https://planetarycomputer.microsoft.com/dataset/modis-64A1-061'),
]
for label,url in refs: add(f'<link href="{html.escape(url,quote=True)}" color="#b83b12">{label}</link>','small')
add('Product references explain the inputs; they do not endorse our adjustment. NASA GIBS documents date-addressable imagery services; the images are context rather than exact-time fire confirmation. The walkthrough was checked against application source and saved verification artifacts, not a new live browser session during preparation. Accra is the team-confirmed local event; this manual does not assert unverified local scoring weights.', 'small')

def footer(c,doc):
    w,h=595.276,841.89
    c.setTitle('FireScope AI - Detailed Judges Presentation Script')
    c.setAuthor('FlareForge')
    c.setFont('Bold',10);c.setFillColor(INK);c.drawString(48,h-31,'FireScope AI')
    c.setFont('Read',9);c.setFillColor(MUTED);c.drawRightString(w-48,h-31,'FlareForge | Accra | 15 November 2026')
    c.setStrokeColor(ORANGE);c.setLineWidth(1);c.line(48,h-41,w-48,h-41)
    c.setStrokeColor(LINE);c.setLineWidth(.5);c.line(48,40,w-48,40)
    c.setFont('Read',8);c.setFillColor(MUTED);c.drawString(48,27,'Research prototype | Presentation, walkthrough and technical preparation')
    c.drawRightString(w-48,27,f'{doc.page} / {len(titles)}')

doc=SimpleDocTemplate(str(OUT),pagesize=(595.276,841.89),leftMargin=48,rightMargin=48,topMargin=62,bottomMargin=53)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
pdf=fitz.open(OUT)
assert len(pdf)==len(titles),(len(pdf),len(titles))
text='\n'.join(pg.get_text() for pg in pdf)
for token in ['549,208','75,823','266.1','70.9','76.9','Accra','731','0.2560','58','Unavailable']:
    assert token in text,token
for i,pg in enumerate(pdf):
    assert titles[i].replace('\u2019',"'") in pg.get_text(),(i,titles[i])
    for block in pg.get_text('blocks'):
        assert block[0]>=35 and block[2]<=565 and block[1]>=15 and block[3]<=825,(i,block)
    pg.get_pixmap(matrix=fitz.Matrix(.85,.85),alpha=False).save(TMP/f'page-{i+1:02}.png')
print(f'Created {OUT}; {len(pdf)} pages; core script {len(" ".join(spoken).split())} words.')
print('All pages rendered; required facts, section placement and text bounds verified.')
