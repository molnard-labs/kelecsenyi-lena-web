"""Build the local-only extension while preserving the original main page."""
from pathlib import Path
import hashlib
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(ROOT / 'build-vector-preview.py')], check=True)
page = (ROOT / 'index.html').read_text(encoding='utf-8')
cta = '''<p class="quick-reading-cta"><a href="/gyors-elemzes/">Kérek egy rövid képletelemzést <span aria-hidden="true">→</span></a></p>'''
hero_start = page.index('<section id="hero">')
hero_end = page.index('</section>', hero_start)
hero = page[hero_start:hero_end]
# One CTA, with no embedded form or extra homepage section.
hero = hero.replace('            </div>\n        </div>', '            </div>\n            '+cta+'\n        </div>', 1)
assert cta in hero
page = page[:hero_start] + hero + page[hero_end:]
page = re.sub(r'<link\b[^>]*id="kelecsenyi-lena-fonts-css"[^>]*>', '<link rel="stylesheet" href="/astro-assets/fonts.css">', page)
page = page.replace('</head>', '<link rel="stylesheet" href="/local-enhancements.css"></head>')
page = re.sub(r'(<body\b[^>]*>)', r'\1<a class="local-skip-link" href="#hero">Ugrás a tartalomra</a>', page, count=1)
page = page.replace('</body>', '<script src="/local-enhancements.js"></script></body>')
page = page.replace('</footer>', '<p class="container local-source-offer"><a href="/licenses.html">Szoftverlicencek</a></p></footer>', 1)
page = page.replace('<script src="original-site.js"></script>', '')
# The captured original DOM contained an inspector host; it has no site purpose.
page = re.sub(r'<div id="codex-browser-sidebar-comments-root"[^>]*></div>', '', page)
for filename in ('local-enhancements.css', 'local-enhancements.js'):
    version = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()[:10]
    page = page.replace('/'+filename+'"', '/'+filename+'?v='+version+'"')
(ROOT / 'index.html').write_text(page, encoding='utf-8')

chart = (ROOT / 'astro-page.template.html').read_text(encoding='utf-8')
for filename in ('astro.css', 'astro-wheel.css', 'astro.js'):
    version = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()[:10]
    chart = chart.replace('/'+filename+'"', '/'+filename+'?v='+version+'"')
favicon = 'brand-assets/kl-monogram-32.png'
version = hashlib.sha256((ROOT / favicon).read_bytes()).hexdigest()[:12]
chart = chart.replace('/'+favicon+'"', '/'+favicon+'?v='+version+'"')
(ROOT / 'gyors-elemzes').mkdir(exist_ok=True)
(ROOT / 'gyors-elemzes/index.html').write_text(chart, encoding='utf-8')
print('Local homepage CTA and /gyors-elemzes/ built; WordPress sources unchanged.')
