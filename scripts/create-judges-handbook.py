"""Reproducible, source-backed team handbook. No credentials are read."""
from pathlib import Path
import json, statistics, html
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/FireScope-AI-Team-and-Judges-Handbook.pdf'
TMP = ROOT / 'tmp/pdfs/judges-handbook'
OUT.parent.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Source', str(ROOT / 'public/fonts/source-sans-3-regular.ttf')))
pdfmetrics.registerFont(TTFont('Strong', 'C:/Windows/Fonts/seguisb.ttf'))
pdfmetrics.registerFontFamily('Source', normal='Source', bold='Strong', italic='Source', boldItalic='Strong')
INK, MUTED, ORANGE, TEAL, LINE = map(HexColor, ['#242930','#59616c','#b83b12','#087f82','#dfe3e7'])
W, H, M = 595.28, 841.89, 47
CW = W - 2*M
STYLE = ParagraphStyle('Body', fontName='Source', fontSize=11.2, leading=15.6, textColor=INK, spaceAfter=8)
c = canvas.Canvas(str(OUT), pagesize=(W,H))
c.setTitle('FireScope AI | Team and Judges Handbook')
c.setAuthor('FlareForge')
c.setSubject('Explain the research prototype, reproducible results, public demo and scientific limitations')
page, y = 0, 0
evaluation = json.loads((ROOT/'artifacts/ghana-seasonal-study/evaluation.json').read_text(encoding='utf-8'))
report = evaluation['report']
test = report['metrics']['test']

def para(text, size=11.2, color=INK, bold=False, width=CW, x=M, gap=9):
    global y
    st = ParagraphStyle('p', parent=STYLE, fontName='Strong' if bold else 'Source', fontSize=size, leading=size*1.4, textColor=color)
    p = Paragraph(text, st)
    _, h = p.wrap(width, H)
    if y-h < 59: raise ValueError(f'Page {page} overflow: {text[:60]} y={y} h={h}')
    p.drawOn(c,x,y-h); y -= h+gap

def section(title):
    global y
    y -= 7
    para(title, 14.5, bold=True, gap=8)

def table(headers, rows, widths):
    global y
    small = ParagraphStyle('table', parent=STYLE, fontSize=9.8, leading=13)
    cells = [[Paragraph(str(v),small) for v in row] for row in [headers]+rows]
    t=Table(cells,colWidths=widths,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),HexColor('#f0f3f4')),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),
        ('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),
        ('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,0),0.6,LINE),
        ('LINEBELOW',(0,1),(-1,-1),0.35,LINE)]))
    _,h=t.wrap(CW,H)
    if y-h<59: raise ValueError(f'Table overflow page {page}')
    t.drawOn(c,M,y-h); y-=h+13

def note(text):
    global y
    st=ParagraphStyle('note',parent=STYLE,fontSize=10.5,leading=14.3,textColor=HexColor('#704318'))
    p=Paragraph(text,st); _,h=p.wrap(CW-24,H)
    if y-h-24<59: raise ValueError(f'Note overflow page {page}')
    c.setFillColor(HexColor('#fff4e9'));c.roundRect(M,y-h-21,CW,h+17,5,fill=1,stroke=0)
    p.drawOn(c,M+12,y-h-9);y-=h+34

def start(title, subtitle):
    global page,y
    if page: c.showPage()
    page+=1;y=H-64
    c.setFillColor(ORANGE);c.rect(M,H-35,25,3,fill=1,stroke=0)
    c.setFillColor(MUTED);c.setFont('Source',9)
    c.drawString(M+34,H-35,'FireScope AI / FlareForge')
    c.drawRightString(W-M,H-35,'TEAM & JUDGES HANDBOOK')
    c.setStrokeColor(LINE);c.line(M,44,W-M,44)
    c.setFillColor(MUTED);c.setFont('Source',8.5)
    c.drawString(M,29,'Research prototype | Prepared 14 November 2026')
    c.drawRightString(W-M,29,f'{page} / 9')
    para(title,26,bold=True,gap=10)
    para(subtitle,11.5,MUTED,gap=17)

def bullet(label, text): para(f'<b>{label}</b> {text}',gap=10)

start('What we built', 'A plain-language guide for understanding, demonstrating and defending FireScope AI.')
para('FireScope AI is a web research workspace that helps people explore NASA satellite fire observations and investigate why MODIS and VIIRS produce different records.',16,bold=True,gap=16)
para('Our contribution combines an inspectable map and activity calendar with original source records, experimental sensor comparison, and a reproducible test of a simple cross-sensor adjustment. We preserve uncertainty rather than turning every hotspot into a confirmed wildfire.')
section('The problem in one sentence')
para('A change in satellite detection counts can reflect a change in the instrument or its sampling, as well as a change in burning activity. Comparing raw counts alone can mislead.')
section('The evidence we can show')
table(['Evidence','What it establishes'],[
 ['7,350 real records','A dated Ghana example from 1-3 January 2025: 1,135 MODIS and 6,215 VIIRS observations.'],
 ['75,823 real records','A separate Ghana study: 50 sampled January/July days across 2021-2025, from 20 original product files.'],
 ['70.9 versus 266.1','Adjusted versus raw daily mean absolute disagreement with MODIS Aqua on 10 test days. Units: occupied cells/day.'],
 ['55 passing tests','Software behavior checked across 11 test files. Tests do not establish scientific accuracy.']
],[125,CW-125])
note('<b>Our strongest defensible claim:</b> We built and publicly demonstrated a traceable research prototype, and our simple adjustment reduced disagreement with a reference sensor on a small held-out sample. Independent fire accuracy is not established.')
para('Open the working demo: <link href="https://firescope-flareforge.web.app" color="#087f82">firescope-flareforge.web.app</link>',10.7,gap=5)
para('Read this handbook in order to learn the project. Use pages 6-7 to rehearse the pitch and judge questions; pages 8-9 explain limits, terms and evidence.',10.5,MUTED)

start('Why the problem matters', 'Different satellite instruments give us different views of the same landscape.')
table(['Term','Plain-language explanation'],[
 ['MODIS','A satellite instrument with nominal 1 km active-fire pixels. The archive includes instruments on Terra and Aqua.'],
 ['VIIRS','A newer instrument family with a 375 m active-fire product. Our experiment uses Suomi-NPP observations.'],
 ['Hotspot / detection','A thermal observation recorded by an instrument. Multiple observations may relate to one event; some thermal sources are not wildfires.'],
 ['Harmonization','Making records from different instruments more comparable over time, while accounting for how the instruments observe.']
],[112,CW-112])
para('Think of two cameras with different zoom levels and different shooting times. One may resolve small features that the other misses. Resizing their photo counts does not prove either camera is more accurate. The same caution applies to fire detections.')
section('How people use the workspace')
bullet('1. Choose a study area and dates.', 'Filter the loaded evidence by geography, time and instrument; use preset areas or coordinates. Polygon assessment adds a more specific area of interest.')
bullet('2. Inspect observations.', 'Use the map and records table to see coordinates, UTC acquisition time, sensor, satellite, confidence, FRP and source metadata.')
bullet('3. Compare patterns.', 'Use the activity calendar and Sensor Lab to compare raw records, occupied cells, candidate links and eligible experimental adjusted activity.')
bullet('4. Export evidence.', 'Download records and analysis outputs so another person can inspect the inputs, parameters and limitations.')
section('Who it is for')
para('The current prototype serves students, researchers and our team. A possible future use is helping land managers investigate historical activity. User benefit and operational suitability still need direct testing with those audiences.')
note('A calendar color means activity in the loaded data, not wildfire severity. An unsampled date is unknown, not a confirmed day without burning.')

start('How the experiment works', 'A simple aggregate adjustment, kept separate from point-to-point linking.')
bullet('Start with original NASA files.', 'The study uses standard-processing MODIS and VIIRS Suomi-NPP data for the Ghana rectangular extent: west -3.3, south 4.5, east 1.3, north 11.2.')
bullet('Sample a declared set of days.', 'For each year from 2021 to 2025, retrieve 1-5 January and 1-5 July. Ten days per year gives 50 requested days, not five continuous years.')
bullet('Count occupied cells per day.', 'Lay a 0.1-degree latitude/longitude grid over the area. If several observations fall in one cell on one UTC day, that cell counts once for that sensor.')
table(['Year role','Dates used','Purpose'],[
 ['Fit: 2021-2023','30 sampled days','Estimate the VIIRS-to-Aqua scale using these days only.'],
 ['Validation: 2024','10 sampled days','Check behavior in a separate year; not used in this fit.'],
 ['Test: 2025','10 sampled days','Report performance in a later year, separate from fitting.']
],[112,106,CW-218])
para('<b>Reference:</b> MODIS Aqua only. Terra observations stay in the original archive but are excluded from the adjustment experiment. Aqua is a comparison sensor, not ground truth.')
para('<b>Fitted scale:</b> beta = max(0, sum(VIIRS cells x Aqua cells) / sum(VIIRS cells squared)). The fitted value is <b>0.2560</b>. Adjusted index = beta x VIIRS occupied cells.')
para('Illustration only: 100 VIIRS occupied cells would become about 25.6 experimental Aqua-equivalent cells. That fractional result is an index, not 25.6 separate fires or an area measurement.',10.5,MUTED)
section('The other comparison method')
para('Candidate linking pairs observations within adjustable distance/time limits on the same UTC day using a deterministic one-to-one rule. It preserves unmatched records. Linking is exploratory; it is not the calibration formula, validated incident matching or proof that paired observations are the same fire.')
note('The grid is not equal-area. Clouds, footprint, viewing angle, overpass timing and different small-fire sensitivity are not corrected by this scale.')

start('What the results mean', 'Lower disagreement with Aqua is encouraging, but it is not measured fire-detection accuracy.')
para('<b>Mean absolute error (MAE)</b> is the average size of the daily difference from the reference, ignoring whether that difference is positive or negative. Lower is closer to Aqua. The chart uses the full Ghana extent and 10 sampled test days in 2025.')
chart_top=y-8; chart_height=133; chart_x=M+164; barw=CW-219
for i,(label,value,color) in enumerate([('Raw VIIRS',test['rawMAE'],ORANGE),('Adjusted VIIRS',test['adjustedMAE'],TEAL),('Seasonal baseline',test['seasonalBaselineMAE'],HexColor('#77818d'))]):
    yy=chart_top-i*38
    c.setFont('Source',11);c.setFillColor(INK);c.drawString(M,yy-13,label)
    c.setFillColor(color);c.rect(chart_x,yy-21,barw*value/300,20,fill=1,stroke=0)
    c.setFillColor(INK);c.setFont('Strong',10.8);c.drawString(chart_x+barw*value/300+7,yy-15,f'{value:.1f}')
c.setStrokeColor(LINE);c.line(chart_x,chart_top-109,chart_x+barw,chart_top-109)
c.setFont('Source',8.6);c.setFillColor(MUTED)
for tick in [0,100,200,300]: c.drawCentredString(chart_x+barw*tick/300,chart_top-123,str(tick))
y=chart_top-chart_height-12
para('Daily MAE in occupied cells; axis begins at zero. Source: archived evaluation.json.',9.2,MUTED,gap=10)
table(['Diagnostic','Value','Interpretation'],[
 ['Adjusted RMSE','111.4 cells/day','Larger errors receive more weight than in MAE.'],
 ['Adjusted signed bias','-16.8 cells/day','On average the adjusted index is below Aqua.'],
 ['Training-year sensitivity','0.2279-0.2667','Factors after omitting each training year. Not a confidence interval.']
],[130,108,CW-238])
section('Why show the simple baseline?')
para('The baseline predicts the training-only Aqua mean for January or July. Its test MAE is 76.9, versus 70.9 for the adjustment. The adjustment beats this simple comparator by about <b>7.7%</b> in combined MAE, much less than its 73.3% reduction relative to raw VIIRS.')
season_rows=[]
for season in ['January sample','July sample']:
    days=[d for d in report['days'] if d['split']=='test' and d['season']==season]
    mae=lambda k:statistics.mean(abs(d[k]-d['referenceCells']) for d in days)
    season_rows.append([season.replace(' sample','')+' (5 days)',f'{mae("adjustedCells"):.2f}',f'{mae("seasonalBaselineCells"):.2f}'])
table(['Test window','Adjusted MAE','Seasonal baseline MAE'],season_rows,[175,133,CW-308])
para('July has very low activity: adjusted MAE is 0.66 versus 0.75 for the seasonal baseline. Its small errors should not hide the much larger January errors. Do not say "73% more accurate at detecting fires." Say "73% lower disagreement with Aqua than raw VIIRS on this sample."',10.5)

start('How we built and published it', 'A browser research workspace, original NASA archives and an optional private backend.')
table(['Layer','What we implemented'],[
 ['Interface','React + TypeScript + Vite; Leaflet map; sensor/date/area filters; grouped research navigation; light surfaces with orange MODIS and teal VIIRS cues.'],
 ['Data processing','CSV ingestion, validation and duplicate handling; original metadata; UTC dates; geographic subsets; occupied-cell measures and experimental linking.'],
 ['Research outputs','Calendar, comparison diagnostics, daily/source CSV, analysis evidence JSON, and polygon research briefings including PDF/ZIP exports.'],
 ['Private local server','Node adapters for NASA FIRMS, optional point weather, place lookup and GDELT news. Secrets stay on the server.'],
 ['Public delivery','Firebase Hosting serves built assets and two packaged NASA study responses. Browser analysis and imports run without a paid backend.']
],[112,CW-112])
section('The public data flow')
para('<b>NASA original files</b> &gt; checksum-verified saved study &gt; packaged public JSON &gt; browser ingestion &gt; map / calendar / Sensor Lab &gt; exported evidence.',12.3,TEAL,bold=True)
para('For the public site we created a dedicated Firebase project, packaged the saved studies, excluded private environment files, scanned the built client for configured credentials and added clear notices for disconnected services. The last recorded suite passed 55 tests across 11 files.')
section('Public demo versus complete local app')
para('<b>Public now:</b> historical studies, imported CSVs, local analysis and exports. <b>Not connected publicly:</b> live NASA retrieval, weather, news and remote place search. The local server retains those adapters; its presence does not make them publicly hosted.')
para('<b>Domain:</b> firescopeai.study was registered with Firebase. Porkbun A and TXT records were saved and publicly resolved. Activation was still pending at the last deployment check. Use the verified web.app link for judging until the custom domain serves the app.')
note('<b>Collaborator status:</b> Google Cloud deployment was blocked by closed billing; no paid billing was enabled. Planetary Computer returned five scene metadata records in a discovery probe, but imagery is not integrated. Meteomatics access and historical-weather integration remain pending.')

start('Your three-minute demonstration', 'Practice the clicks and the explanation together. Use the working Firebase URL.')
table(['Time','Show','Say'],[
 ['0:00-0:25','Fire explorer; dated snapshot','"We help researchers compare NASA satellite fire observations without confusing detection counts with separate wildfires. This example is Ghana, 1-3 January 2025."'],
 ['0:25-0:50','A map observation and its source fields','"We preserve the sensor, time, confidence and source metadata so users can inspect the evidence behind a map mark."'],
 ['0:50-1:20','Guided demo; five-year sampled study','"This study contains 75,823 original records, sampled over 50 January/July days. It is not continuous five-year coverage."'],
 ['1:20-2:05','Sensor comparison; test diagnostics','"We fit on 2021-2023, checked 2024 and tested 2025. Test disagreement with Aqua drops from 266.1 to 70.9 cells/day. The simple seasonal baseline is 76.9."'],
 ['2:05-2:35','Adjusted calendar; an unknown date; export','"Represented dates can be explored and exported. Missing dates remain unknown. The export carries parameters and source evidence."'],
 ['2:35-3:00','Methods and limitations','"This is experimental sensor agreement, not independently validated fire accuracy. Next we need broader coverage, observing-opportunity data and independent event review."']
],[58,133,CW-191])
section('A 30-second opening pitch')
para('"FireScope AI helps people understand fire observations across different NASA satellite instruments. We built an interactive map, activity calendar and Sensor Lab that preserve original evidence. In a real Ghana sample, a training-only adjustment reduced disagreement with MODIS Aqua on later test days. We make the method, exports and uncertainty inspectable, so users can see both the progress and its limits."',12)
section('Before you face the judges')
para('Load the site and study before speaking. Keep original CSVs and this PDF available. Rehearse the export location. Do not click Update data expecting a live public feed. If basemap tiles fail, use the calendar, source records and diagnostics. Confirm your event\'s actual time limit and submission requirements.')

start('Questions judges may ask', 'Use direct answers. Show the evidence when it exists; name the missing evidence when it does not.')
bullet('What is new here?', 'Our contribution is the combined, source-preserving workflow: inspect observations, compare sensors, test an explicit adjustment and export its evidence. We have not established that the method is scientifically novel or superior to all existing tools.')
bullet('Why are raw MODIS and VIIRS counts different?', 'Resolution, detection sensitivity, timing and viewing conditions differ. Our experiment measures the resulting disagreement; it does not fully model every cause.')
bullet('What does "AI" mean in this project?', 'It is the product name. The demonstrated scientific method is a simple fitted statistical scale, not a trained deep-learning fire detector or a validated generative-AI forecasting system.')
bullet('Does the adjustment find more real fires?', 'We do not know. We measured closeness to Aqua, not truth on the ground. VIIRS observations that Aqua misses are retained in the original records rather than declared wrong.')
bullet('Did you train on the test year?', 'The fitted factor uses 2021-2023 only; 2024 and 2025 are separate. We have now inspected the test results. Any later tuning must disclose that fact and use a new independent evaluation set.')
bullet('Why not just use a seasonal average?', 'That is an important comparator. Its combined test MAE is 76.9 versus 70.9 for the adjustment. The adjustment is closer in both sampled months, but its benefit over this baseline is modest and not shown statistically significant.')
bullet('Can responders use it to issue emergency warnings?', 'No. The area score is an exploratory context index with strict missing-data gates. Historical studies do not support a live hazard score. Operational use requires independent evaluation and appropriate oversight.')
bullet('Is the site live?', 'The website is live, but its built-in studies are dated historical data. Live NASA, weather, news and place services are disconnected on the free public deployment. Users can import their own compatible CSVs.')
bullet('How do we reproduce the claim?', 'Keep the source files and manifest, verify checksums, rerun the evaluation script, inspect the fixed year roles and compare exported daily values and error metrics. Page 9 identifies the evidence.')

start('Limits, next steps and key terms', 'A credible presentation tells judges exactly where the prototype ends.')
section('What we should not claim')
para('Do not claim unique wildfire counts, independently verified incident causes, real-time public fire monitoring, a calibrated danger probability, a complete five-year or multi-decade archive, proven geographic transfer, NASA approval, or guaranteed competition success.')
para('The area-assessment tools include polygon selection, imported evidence, an exploratory context score and coverage-gated anomaly screening. The 50-day study cannot supply the continuous baseline those screens require. Without complete eligible inputs, the correct result is unavailable, not zero risk.')
section('Next scientific milestones')
bullet('Broaden the sample.', 'Collect compatible continuous periods and document product availability, source versions and missing dates. Keep NRT and standard-processing records separate.')
bullet('Account for observing opportunity.', 'Add suitable swath, cloud and quality information; evaluate timing, footprints and unequal-area grid effects.')
bullet('Evaluate independently.', 'Use reviewed reference events and predeclared geography/time holdouts. Report monthly and regional behavior, uncertainty and simple baselines.')
bullet('Test practical value.', 'Observe intended users completing realistic tasks. Measure whether the workflow improves interpretation or saves time; do not invent impact statistics.')
section('The short glossary')
table(['Term','Meaning'],[
 ['FIRMS','NASA Fire Information for Resource Management System; our fire-data source.'],
 ['FRP','Fire radiative power, in megawatts. It is not burned area or a wildfire count.'],
 ['UTC','A shared time standard used for acquisition dates and comparisons.'],
 ['Provenance','Where data came from, when it was retrieved and which product/version produced it.'],
 ['Checksum','A file fingerprint used to detect changes. It does not prove scientific validity.'],
 ['Held-out data','Samples kept separate from fitting so we can assess behavior on later observations.']
],[100,CW-100])

start('Evidence and presentation checklist', 'Keep this page beside the project when preparing the final submission.')
section('The local evidence pack')
table(['Source in the project','What to inspect'],[
 ['artifacts/ghana-seasonal-study/manifest.json','50 requested days, year roles, original product filenames, retrieval timestamps and SHA-256 checksums.'],
 ['artifacts/ghana-seasonal-study/evaluation.json','75,823 source rows; fitted factor; MAE/RMSE/bias; year and grid sensitivity. Numbers in this handbook are derived from this file.'],
 ['artifacts/ghana-seasonal-study/daily-comparison.csv','Daily Aqua, VIIRS, adjusted and seasonal-baseline values. January/July table on page 4 is computed from these underlying report days.'],
 ['SCIENCE_METHOD.md / SCIENCE_EXPANSION.md','Current experiment protocol and proposed next independent evaluation. Expansion is a plan, not a completed result.'],
 ['ASSESSMENT_METHOD.md / DEPLOYMENT.md','Area-score gates and limits; public-demo configuration and disconnected services.']
],[220,CW-220])
para('<b>Reproduce locally:</b> run <font name="Strong">node scripts/evaluate-case-study.mjs</font>, then <font name="Strong">npm test</font>. The source checksums are verified before the evaluation is regenerated. Public-demo build: <font name="Strong">npm run build:firebase</font>.',10.5)
section('Public references')
refs=[
 ('NASA challenge target','https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/'),
 ('NASA FIRMS area API','https://firms.modaps.eosdis.nasa.gov/api/area/'),
 ('NASA FIRMS data-ingestion tutorial','https://firms.modaps.eosdis.nasa.gov/content/academy/data_ingest/firms_data_ingest.html'),
 ('Firebase Hosting documentation','https://firebase.google.com/docs/hosting')]
for title,url in refs: para(f'<link href="{html.escape(url)}" color="#087f82">{title}</link>',10.5,gap=5)
para('The challenge URL identifies our intended task; it is not proof that all submission requirements are met. Its live page could not be retrieved during handbook preparation. Check the current challenge and your actual local event rules before submission.',9.4,MUTED)
para('<b>Team roles:</b> assign the problem/pitch, demo operation, science questions and technical questions before presenting. One person may hold several roles.',10.2,gap=7)
note('<b>Final message to judges:</b> "We make cross-sensor fire observations easier to inspect and compare, and we show the evidence behind an experimental adjustment. Our next step is stronger independent validation, not stronger unsupported claims."')

c.save()
doc=fitz.open(OUT)
assert len(doc)==9, len(doc)
alltext='\n'.join(p.get_text() for p in doc)
for required in ['75,823','266.1','70.9','55','50 sampled','not ground truth','not connected']:
    assert required.lower() in alltext.lower(), required
for i,p in enumerate(doc):
    pix=p.get_pixmap(matrix=fitz.Matrix(1.25,1.25),alpha=False)
    pix.save(TMP/f'page-{i+1:02}.png')
print(f'Created {OUT} | {len(doc)} pages | {OUT.stat().st_size:,} bytes')
print('All nine pages rendered for visual inspection; key factual text checks passed.')
