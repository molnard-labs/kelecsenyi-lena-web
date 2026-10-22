"""Cache the site's existing open Google Fonts; no new visual direction."""
from pathlib import Path
import hashlib
import re
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parent/'astro-assets'
ROOT.mkdir(exist_ok=True)
url='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..600;1,300..600&family=Manrope:wght@300..600&display=swap'
headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}
with urlopen(Request(url,headers=headers),timeout=30) as response:
    css=response.read().decode('utf-8')
for source in set(re.findall(r'https://fonts\.gstatic\.com/[^)\s]+',css)):
    name=hashlib.sha256(source.encode()).hexdigest()[:16]+'.woff2'
    dest=ROOT/name
    if not dest.exists():
        with urlopen(Request(source,headers=headers),timeout=30) as response:
            dest.write_bytes(response.read())
    css=css.replace(source,'/astro-assets/'+name)
(ROOT/'fonts.css').write_text(css,encoding='utf-8')
print('Existing brand fonts cached locally.')
