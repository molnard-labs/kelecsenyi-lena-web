"""Download the openly licensed text glyphs used in the data diagram once."""
from pathlib import Path
import re
from urllib.parse import urlencode
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parent/'astro-assets'
ROOT.mkdir(exist_ok=True)
target=ROOT/'wheel-symbols.woff2'
if not target.exists():
    symbols='☉☽☿♀♂♃♄♅♆♇☊☋⚷'+''.join(chr(0x2648+i) for i in range(12))
    url='https://fonts.googleapis.com/css2?'+urlencode({'family':'Noto Sans Symbols 2','text':symbols,'display':'swap'})
    headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}
    with urlopen(Request(url,headers=headers),timeout=30) as response:
        css=response.read().decode('utf-8')
    source=re.search(r'url\((https://[^)]+)\)',css).group(1)
    with urlopen(Request(source,headers=headers),timeout=30) as response:
        data=response.read()
    if data[:4]!=b'wOF2':
        raise RuntimeError('Unexpected font format; expected WOFF2.')
    target.write_bytes(data)
license_path=ROOT/'noto-sans-symbols-2-OFL.txt'
if not license_path.exists():
    with urlopen('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssymbols2/OFL.txt',timeout=30) as response:
        license_path.write_bytes(response.read())
print('Astrological text symbols available locally (Noto Sans Symbols 2, OFL).')
