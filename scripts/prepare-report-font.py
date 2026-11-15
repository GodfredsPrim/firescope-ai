"""Build a static PDF font from the project's OFL-licensed webfont subsets.
Requires fonttools[woff] and brotli. The generated font is committed under public/fonts.
"""
from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path('tmp/font-deps')))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.merge import Merger

folder = Path('tmp/report-fonts')
folder.mkdir(parents=True, exist_ok=True)
files = []
for subset in ['latin', 'latin-ext', 'greek', 'greek-ext', 'cyrillic', 'cyrillic-ext', 'vietnamese']:
    font = TTFont(f'node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-{subset}-wght-normal.woff2')
    font = instantiateVariableFont(font, {'wght': 400}, inplace=True)
    font.flavor = None
    # Layout tables contain overlapping subset lookups; PDF text is already laid out.
    for table in ['GSUB', 'GPOS', 'GDEF']:
        if table in font:
            del font[table]
    target = folder / f'{subset}.ttf'
    font.save(target)
    files.append(str(target))
merged = Merger().merge(files)
merged.save('public/fonts/source-sans-3-regular.ttf')
Path('public/fonts/coverage.json').write_text(json.dumps(sorted(merged.getBestCmap().keys())), encoding='utf-8')
print('Prepared Source Sans 3 PDF font (Latin, Greek, Cyrillic and Vietnamese).')
