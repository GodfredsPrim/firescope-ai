from pathlib import Path
from html import escape
import re
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/FireScope-Submission-and-Video-Guide.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Source', str(ROOT / 'public/fonts/source-sans-3-regular.ttf')))
pdfmetrics.registerFont(TTFont('SegoeBold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFontFamily('Source', normal='Source', bold='SegoeBold', italic='Source', boldItalic='SegoeBold')
INK, MUTED, ORANGE, TEAL = [colors.HexColor(s) for s in ['#242930', '#525B66', '#C64212', '#087F82']]
LINE, WASH = colors.HexColor('#DFE2E6'), colors.HexColor('#F4F5F6')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyCopy', fontName='Source', fontSize=10.5, leading=14.6, textColor=INK, spaceAfter=8))
styles.add(ParagraphStyle(name='SmallCopy', fontName='Source', fontSize=9, leading=12, textColor=MUTED, spaceAfter=6))
styles.add(ParagraphStyle(name='SectionTitle', fontName='SegoeBold', fontSize=19, leading=24, textColor=INK, spaceAfter=12))
styles.add(ParagraphStyle(name='FieldTitle', fontName='SegoeBold', fontSize=10.3, leading=14, textColor=INK, spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(name='TableCopy', fontName='Source', fontSize=9.3, leading=12.5, textColor=INK, spaceAfter=0))
styles.add(ParagraphStyle(name='ScriptCopy', fontName='Source', fontSize=12, leading=17, textColor=INK, spaceAfter=0))

story = []
def p(text, style='BodyCopy'):
    return Paragraph(text, styles[style])
def add(text, style='BodyCopy'):
    story.append(p(text, style))
def title(text):
    add(text, 'SectionTitle')
def heading(text):
    add(text, 'FieldTitle')
def link(label, url):
    return f'<link href="{escape(url, quote=True)}" color="#C64212"><u>{escape(label)}</u></link>'
def bullet(text):
    add('- ' + text)
def table(rows, widths):
    cells = [[p(str(cell), 'TableCopy') for cell in row] for row in rows]
    t = Table(cells, colWidths=widths, hAlign='LEFT', repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), WASH), ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,0), (-1,-1), .5, LINE),
        ('LEFTPADDING', (0,0), (-1,-1), 9), ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t)

class Field(Flowable):
    def __init__(self, label, name, value='', field_height=22, multiline=False):
        super().__init__(); self.label=label; self.name=name; self.value=value
        self.field_height=field_height; self.multiline=multiline; self.width=499.27; self.height=field_height+22
    def draw(self):
        c=self.canv; c.setFont('Source', 9); c.setFillColor(MUTED); c.drawString(0,self.field_height+7,self.label)
        c.acroForm.textfield(name=self.name, tooltip=self.label, value=self.value,
            x=0,y=0,width=self.width,height=self.field_height,relative=True,
            fontName='Helvetica',fontSize=9,borderWidth=.6,borderColor=LINE,
            fillColor=colors.white,textColor=INK,forceBorder=True,
            fieldFlags='multiline' if self.multiline else '',maxlen=1200)

def page(c, doc):
    w,h=A4
    c.setTitle('FireScope AI - Submission Answers and Video Guide')
    c.setAuthor('FlareForge')
    c.setFillColor(INK);c.setFont('SegoeBold',11);c.drawString(48,h-34,'FireScope AI')
    c.setFont('Source',9);c.setFillColor(MUTED);c.drawRightString(w-48,h-34,'FlareForge | 15 November 2026')
    c.setStrokeColor(ORANGE);c.setLineWidth(1.2);c.line(48,h-44,w-48,h-44)
    c.setStrokeColor(LINE);c.setLineWidth(.5);c.line(48,38,w-48,38)
    c.setFont('Source',8);c.setFillColor(MUTED)
    c.drawString(48,25,'Submission preparation - complete the online Space Apps project form')
    c.drawRightString(w-48,25,str(doc.page))

title('Project submission answers')
add('Copy-ready answers for the Space Apps project page. This is a prepared submission pack, not an official NASA form or a portal submission receipt.', 'SmallCopy')
heading('Project title')
add('FireScope AI: A Transparent Fire Activity Calendar')
heading('Challenge')
add('Harmonization of MODIS and VIIRS Hot Spots')
story.append(Field('Team name (confirm against your registered team)', 'team_name', 'FlareForge'))
story.append(Field('Registered local event name - confirmed by the team', 'local_event', 'Accra'))
story.append(Field('Team owner', 'team_owner', 'Godfred Bio (@godfreds_prime), Ghana'))
story.append(Field('Team contact email - complete before submission', 'contact_email'))
add('<b>Team members:</b> Godfred Bio; Arabella Rose Hagan; De-Graft Yeboah Boakye; Foster Tetteh; Ama Wiredu; Agyapomaa Forkuoh Rebecca. All six members: Ghana.', 'SmallCopy')
heading('High-level project summary')
SUMMARY = ('FireScope AI is a web research workspace for exploring NASA MODIS and VIIRS fire observations in Ghana study areas. It brings maps, a burning activity calendar, source records and exports into one inspectable workflow. A separate historical archive contains 549,208 observations across 731 requested dates in 2024-2025. Monthly mapped burned-area comparisons add product-quality context, while an experimental sensor-reference adjustment explores cross-sensor consistency on a clearly labelled seasonal sample. Users can inspect sources, see missing coverage and export evidence. FireScope helps students and researchers compare satellite records without treating detection counts as unique fires, burned area or validated emergency predictions.')
add(SUMMARY)
heading('Final project link')
add(link('https://firescope-flareforge.web.app/', 'https://firescope-flareforge.web.app/'))
story.append(Field('Public project demonstration/video URL - add after recording', 'demo_url'))

story.append(PageBreak())
title('Detailed project description')
add('Copy the following sections together into the project-details field. Adjust to the portal character limit if one is displayed.', 'SmallCopy')
heading('The problem')
add('MODIS and VIIRS observe thermal activity at different resolutions and acquisition times. A change in satellite detection counts can therefore reflect sensor differences as well as changes in burning. Researchers need to inspect original observations and coverage before interpreting a historical fire calendar.')
heading('What we built')
add('FireScope AI is a browser-based research workspace with an interactive map, date and satellite filters, a burning activity calendar, observation inspection and CSV/evidence exports. Date-linked NASA true-color imagery supplies daily visual context. The original source records and sensor-specific confidence information remain available.')
add('The separate 2024-2025 archive contains 549,208 deduplicated observations across 731 dates with completed requests for both MODIS and VIIRS products. Users compare full calendar months within Ghana, Northern Ghana and Tamale rectangular study extents, then load a source month into the map and calendar. These rectangles are study areas, not administrative boundaries.')
add('NASA MCD64A1 Collection 6.1 provides monthly mapped burned area alongside detection counts. We calculate area from native raster pixel sizes and apply the product land/valid-data flags. The interface discloses valid-land and shortened-mapping-period fractions. Totals are available for 18 months. Six months with incomplete source tiles remain unavailable rather than becoming zero.')
heading('How it addresses harmonization')
add('A separate frozen experiment uses 75,823 source records from 50 sampled January/July days in 2021-2025. It compares daily occupied cells and fits a training-only VIIRS adjustment to a MODIS Aqua reference, with separate validation and test years, a simpler seasonal baseline and sensitivity checks. This is exploratory sensor agreement, not independent fire-detection accuracy. The expanded descriptive archive does not refit that experiment.')
heading('Why it is useful')
add('The contribution is an inspectable path from historical patterns back to source observations, methods and exports. Students and researchers can compare sensors, identify missing information and communicate evidence without hiding uncertainty. We aim to support better-founded research interpretation; user benefit and field performance have not been independently measured.')
heading('Tools and implementation')
add('React, TypeScript and Vite provide the interface; Leaflet and OpenStreetMap provide map interaction and geographic context. Node.js scripts retrieve and prepare the archive. Papa Parse handles tabular data; GeoTIFF tooling reads burned-area rasters. Firebase Hosting serves the public research demo. The public release uses saved NASA data; private live fire, weather and news adapters remain disconnected there.')
heading('Limits and next steps')
add('A detection is not a unique fire. Completed requests do not establish cloud-free observing opportunity. MCD64A1 can miss small burns and incorporates MODIS active-fire inputs, so it is not independent validation. The prototype does not provide validated fire-risk forecasts or emergency alerts. Next work includes observing-opportunity metadata, independent reference events and geographic transfer evaluation.')

story.append(PageBreak())
title('Data, references and AI disclosure')
add('Use these entries in the portal NASA-data, other-resources and AI/SI fields. The web app also exposes downloadable source identifiers and checksums.', 'SmallCopy')
heading('NASA data and resources')
resources = [
    ('NASA FIRMS - MODIS and VIIRS observations', 'https://firms.modaps.eosdis.nasa.gov/content/active_fire/', 'Standard-processing MODIS_SP and VIIRS_SNPP_SP records supply the map, calendar, historical archive and sensor comparison.'),
    ('NASA GIBS - date-linked MODIS Terra true-color imagery', 'https://nasa-gibs.github.io/gibs-api-docs/access-basics/', 'Daily imagery gives visual context for a selected UTC day; it is not an exact-time match or fire confirmation.'),
    ('NASA MCD64A1.061 - monthly burned area', 'https://doi.org/10.5067/MODIS/MCD64A1.061', 'Burn_Date and QA rasters supply mapped area and quality summaries. Native pixel areas are used instead of assuming 500 m square pixels.'),
    ('MCD64A1 Collection 6.1 user guide', 'https://lpdaac.usgs.gov/documents/1006/MCD64_User_Guide_V61.pdf', 'Reference for quality flags, burn-date interpretation and the MODIS sinusoidal grid.'),
]
for label,url,use in resources:
    add(link(label,url)+'<br/>'+escape(use), 'SmallCopy')
heading('Other data, resources and tools')
add(link('Microsoft Planetary Computer MCD64A1 mirror', 'https://planetarycomputer.microsoft.com/dataset/modis-64A1-061')+' supplies accessible copies of NASA burned-area rasters. '+link('OpenStreetMap', 'https://www.openstreetmap.org/copyright')+' supplies basemap context with attribution. Frontend/processing tools include React, TypeScript, Vite, Leaflet, Papa Parse, GeoTIFF.js, jsPDF, fflate, Lucide, GSAP and Firebase Hosting. Bundled font licences are retained in the project.', 'SmallCopy')
add('Optional local OpenWeatherMap and GDELT integrations provide weather/news context. They are not connected in the public research demo and do not validate the satellite analysis. Meteomatics access was not activated and is not a data source for this release.', 'SmallCopy')
heading('Use of AI/SI - copy-ready disclosure')
add('OpenAI ChatGPT/Codex assisted with software implementation, debugging, data-processing scripts, testing, interface refinement, documentation and preparation of this submission text and video script. AI assistance was also used for design and code review. The satellite observations and burned-area measurements come from the cited data products; they were not generated by AI. The displayed calculations are deterministic research methods, not a validated operational AI forecasting model. Automated checks assess software and data consistency, not independent fire-detection accuracy. The submitting team remains responsible for reviewing the final code, claims, references and submission materials.')
add('For the planned video, use real screen recordings and team narration. If AI-generated visual or audio content is added, disclose the actual tool and use; follow the current event requirements for visible AI-content labelling. Do not claim that a human-recorded screen demonstration was AI-generated.', 'SmallCopy')
heading('Release and validation evidence')
add('Release reviewed: 15 November 2026. Production build and 58 tests across 12 files pass. Saved-source checks reconcile 316 CSV files and 144 raster files; a separate raster spot check agrees with the prepared Tamale result. Live checks cover filters, exports, source-month loading and mobile layout. These checks support implementation consistency, not scientific or competition certification.', 'SmallCopy')

story.append(PageBreak())
title('Your 30-second demonstration video')
add('Aim for 28-29 seconds so the final export stays under 30 seconds. Use a real screen recording, clear team narration and English captions. Keep the working app visible; a full tutorial is not needed.')
heading('Narration script')
SCRIPT = ('Different satellites can make the same fire season look different. FireScope AI brings NASA MODIS and VIIRS observations into one inspectable map and calendar. Compare sensors, explore two years of historical requests, and check mapped burned area. Every result keeps its sources and coverage limits visible. Our sensor adjustment is experimental. FireScope helps researchers compare evidence, without treating satellite detections as confirmed fires.')
box=Table([[p(SCRIPT,'ScriptCopy')]], colWidths=[499.27]);box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),WASH),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]));story.append(box)
story.append(Spacer(1,10))
table([
    ['Time','Show on screen','Keep the shot simple'],
    ['0-4 s','FireScope map and a short problem caption','Different sensors, different views.'],
    ['4-11 s','Map and one source observation','Show MODIS/VIIRS names and the acquisition date.'],
    ['11-18 s','Sensor comparison study','Show the experimental label; do not call it validated accuracy.'],
    ['18-25 s','Historical archive and burned-area table','Choose a prepared area/year; briefly show an unavailable entry.'],
    ['25-29 s','App name and live project address','End on a readable URL and Research prototype.'],
], [48,188,263.27])
heading('Recording and editing')
for line in [
    'Record in landscape at 1920 x 1080 if available. Enlarge the browser text enough to read in the final video.',
    'Preload the map, study and calendar in separate tabs before recording. Cut between prepared views; omit downloads, loading waits and long cursor movement.',
    'Record narration in a quiet room. Read naturally, then trim the script if it exceeds the time limit. Keep captions high-contrast and away from key values.',
    'Keep NASA data attribution visible. Avoid adding NASA logos, endorsement claims or decorative AI imagery. Do not expose private keys, emails or account settings.',
    'Export MP4 with standard H.264 video and clear audio. Check the actual exported duration, not just the editing timeline.',
]: bullet(line)
add(f'Narration is {len(SCRIPT.split())} words. Time your own delivery; pauses and transitions can change its duration.', 'SmallCopy')

story.append(PageBreak())
title('Upload and final submission checklist')
heading('Complete the remaining fields')
for line in [
    'Confirm FlareForge is the exact registered team name. Confirm all six named members appear on the same team and selected challenge.',
    'The local event is Accra, as confirmed by the team. Fill the contact email on page 1; it has not been provided.',
    'Upload the finished demo video to a shareable host. Paste its URL into the editable video field and the portal demo field.',
    'Open the app and video links in a signed-out/private browser. Neither should ask judges for access, payment or registration.',
    'Copy the project title, summary, description, NASA data, other references and AI disclosure into the matching portal fields. Check any displayed character limits.',
    'Have the team review the terms and declarations before accepting them. Save the final portal submission and retain its confirmation.',
]: bullet(line)
heading('Your local programme takes priority for timing')
add('<b>Submit to the global portal by 1:00 p.m. Ghana time on Sunday, 15 November 2026.</b> The programme you supplied says no further changes after 1:00 p.m. Aim to finish uploading and checking links by 12:30 p.m. Virtual judging starts at 2:30 p.m., with 5-10 minute pitch and question sessions.')
heading('Suggested local judging pitch - separate from the short video')
table([
    ['Segment','Suggested focus'],
    ['First 45 seconds','Explain sensor differences and who needs a traceable historical calendar.'],
    ['Next 90 seconds','Demonstrate the map, source inspection, calendar and one export.'],
    ['Next 60 seconds','Explain the experimental sensor comparison and separate training/test years.'],
    ['Next 60 seconds','Show the new two-year archive and burned-area quality/missingness.'],
    ['Final 30 seconds','State the benefit, limitations and next validation steps; leave time for questions.'],
], [105,394.27])
heading('Claims to keep accurate')
add('Say "549,208 observations across 731 requested dates", not "549,208 fires". Say "experimental sensor agreement", not "proven fire accuracy". The 2021-2025 calibration contains 50 sampled days; the separate 2024-2025 archive covers all requested dates. Burned area is available for 18 months, with six incomplete-source months unavailable. The public demo uses saved observations and is not an emergency warning service.', 'SmallCopy')
add('The 15 November date identifies this release/submission pack. It does not change earlier development dates or establish eligibility. Resolve any questions about earlier challenge-specific development with the local lead before making eligibility declarations.', 'SmallCopy')
heading('Form and video guidance sources')
add(link('2026 organiser clarification: submission fields and references', 'https://github.com/nasa/spaceapps/discussions/1858')+'<br/>'+link('2026 Navigator clarification: 30-second demo and AI disclosure', 'https://github.com/nasa/spaceapps/discussions/1947')+'<br/>'+link('Official project submission guide (check the current portal)', 'https://www.spaceappschallenge.org/resources/project-submission-guide/'), 'SmallCopy')
add('The official guide could not be retrieved during preparation; field mapping follows the organiser clarification above. The actual portal controls and local-lead instructions govern if their wording differs. Local timing is taken from the programme supplied by your team.', 'SmallCopy')

doc=SimpleDocTemplate(str(OUT), pagesize=A4,rightMargin=48,leftMargin=48,topMargin=64,bottomMargin=51)
doc.build(story,onFirstPage=page,onLaterPages=page)
print(OUT)
print('Narration words:',len(SCRIPT.split()))
