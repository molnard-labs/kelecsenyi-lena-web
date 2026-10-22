from pathlib import Path
import html, json, math, random, re, hashlib
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent
rng = random.Random(1729)

svg = ['''<svg class="celestial-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<defs>
  <radialGradient id="celestial-bg" cx="55%" cy="14%" r="95%"><stop stop-color="#897444"/><stop offset=".48" stop-color="#505340"/><stop offset="1" stop-color="#303f30"/></radialGradient>
  <radialGradient id="celestial-halo"><stop stop-color="#ffe6a2" stop-opacity=".58"/><stop offset=".14" stop-color="#e1bd6b" stop-opacity=".27"/><stop offset=".48" stop-color="#bb984c" stop-opacity=".12"/><stop offset="1" stop-color="#90722c" stop-opacity="0"/></radialGradient>
  <radialGradient id="celestial-star"><stop stop-color="#fff8d8"/><stop offset=".12" stop-color="#ffecab" stop-opacity=".95"/><stop offset=".36" stop-color="#e8ba5d" stop-opacity=".22"/><stop offset="1" stop-color="#daa846" stop-opacity="0"/></radialGradient>
  <linearGradient id="celestial-line"><stop stop-color="#8e7132" stop-opacity="0"/><stop offset=".38" stop-color="#deba69" stop-opacity=".12"/><stop offset=".62" stop-color="#ffe4a0" stop-opacity=".43"/><stop offset="1" stop-color="#bb9141" stop-opacity="0"/></linearGradient>
</defs>
<path fill="url(#celestial-bg)" d="M0 0h1600v1000H0z"/>
<g><ellipse cx="890" cy="170" rx="600" ry="510" fill="url(#celestial-halo)"/><ellipse cx="1180" cy="810" rx="520" ry="310" fill="url(#celestial-halo)" opacity=".36"/></g>
''']
# Restore the first composition; keep its larger elements static to reduce rendering work.
svg.append('<g fill="none" stroke="url(#celestial-line)">')
for i in range(24):
    svg.append(f'<path d="M {-200+i*6} {-190+i*12} C {410+i*5} {40+i*5}, {980-i*6} {-140+i*8}, {1120+i*4} {170+i*6} S {1010+i*6} {650+i*5}, {1700+i*5} {790+i*9}" stroke-width="{.45+(i%3)*.15:.2f}" opacity="{.35+(i%5)*.12:.2f}"/>')
svg.append('</g>')
# Batched paths keep the original density without hundreds of separate DOM nodes.
for layer,count in enumerate([170,100,60,440]):
    dots=[]
    for _ in range(count):
        if layer<3:
            x,y=rng.uniform(-60,1660),rng.uniform(-60,1060)
            r=rng.uniform(.45,1.15)*(1+layer*.22)
        else:
            t=rng.uniform(-.2,1.2)
            x=820+220*math.sin(t*5.5)+rng.gauss(0,24)
            y=-120+t*1120+rng.gauss(0,18)
            r=rng.uniform(.35,1.25)
        dots.append(f'M{x-r:.1f},{y:.1f}a{r:.1f},{r:.1f} 0 1,0 {2*r:.1f},0a{r:.1f},{r:.1f} 0 1,0 {-2*r:.1f},0')
    svg.append(f'<path d="{"".join(dots)}" fill="{("#f1d59a" if layer<3 else "#d9b467")}" opacity="{(.32 if layer<3 else .24)}"/>')
for i,(x,y,size) in enumerate([(235,194,13),(546,132,10),(896,185,25),(1215,302,17),(1394,139,11),(324,719,15),(714,810,11),(1200,831,19),(101,426,8),(998,660,9)]):
    svg.append(f'<g class="celestial-twinkle" style="--delay:-{i*1.73:.2f}s;--duration:{4+i%4}s"><circle cx="{x}" cy="{y}" r="{size*1.8}" fill="url(#celestial-star)"/><path d="M{x-size*.48} {y}H{x+size*.48}M{x} {y-size*.68}V{y+size*.68}" stroke="#ffeac0" stroke-width=".7" opacity=".63"/><circle cx="{x}" cy="{y}" r="1.35" fill="#fff3cf"/></g>')
svg.append('</svg>')
art = ''.join(svg)
(ROOT/'celestial-scene.svg').write_text(art,encoding='utf-8')

page=(ROOT/'original-page.html').read_text(encoding='utf-8')
# Keep the original markup, content, typography and layout. Only replace the video.
# Each meteor has a small independent SVG surface; animate transform/opacity only.
galaxy=['<div class="celestial-galaxy" aria-hidden="true"><div class="celestial-galaxy-plane"><svg class="celestial-galaxy-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" focusable="false"><defs><radialGradient id="galaxy-core"><stop stop-color="#fff9de" stop-opacity=".95"/><stop offset=".2" stop-color="#f2d99b" stop-opacity=".65"/><stop offset="1" stop-color="#e8ca80" stop-opacity="0"/></radialGradient><radialGradient id="galaxy-gas"><stop stop-color="#ead9ad" stop-opacity=".8"/><stop offset=".35" stop-color="#d7c18f" stop-opacity=".48"/><stop offset=".72" stop-color="#c6b583" stop-opacity=".12"/><stop offset="1" stop-color="#c6b583" stop-opacity="0"/></radialGradient><radialGradient id="galaxy-shadow"><stop stop-color="#53634f" stop-opacity=".25"/><stop offset="1" stop-color="#53634f" stop-opacity="0"/></radialGradient></defs>']
# Soft, static gradient clouds form the spiral arms; the whole galaxy is one rotating layer.
for arm in range(3):
    for j in range(14):
        t=j/14
        radius=24+175*t
        angle=arm*math.tau/3+4.6*t
        x,y=250+radius*math.cos(angle),250+radius*math.sin(angle)
        width=24+12*math.sin(t*math.pi)
        galaxy.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{width*1.7:.1f}" ry="{width:.1f}" transform="rotate({math.degrees(angle)+65:.1f} {x:.1f} {y:.1f})" fill="url(#galaxy-gas)" opacity="{.64-.24*t:.2f}"/>')
    angle=arm*math.tau/3+2.2
    x,y=250+115*math.cos(angle),250+115*math.sin(angle)
    galaxy.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="68" ry="26" transform="rotate({math.degrees(angle)+65:.1f} {x:.1f} {y:.1f})" fill="url(#galaxy-shadow)"/>')
galaxy.append('<circle cx="250" cy="250" r="125" fill="url(#galaxy-core)"/>')
grng=random.Random(314)
for arm in range(3):
    dust=[]
    for j in range(150):
        t=j/150
        radius=18+200*t
        angle=arm*math.tau/3+4.6*t+grng.gauss(0,.055)
        radius+=grng.gauss(0,7)
        x,y=250+radius*math.cos(angle),250+radius*math.sin(angle)
        r=grng.uniform(.4,1.65)*(1-.35*t)
        dust.append(f'M{x-r:.1f},{y:.1f}a{r:.1f},{r:.1f} 0 1,0 {r*2:.1f},0a{r:.1f},{r:.1f} 0 1,0 {-r*2:.1f},0')
    galaxy.append(f'<path d="{"".join(dust)}" fill="#f4dba0" opacity=".75"/>')
galaxy.append('</svg></div></div>')
meteors = ['<div class="celestial-meteors" aria-hidden="true">']
for i in range(5):
    duration=24+i*2.3
    delay=-i*5.8-1.8
    meteors.append(f'''<svg class="celestial-meteor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 50" focusable="false" style="--fall-duration:{duration}s;--fall-delay:{delay}s"><defs><linearGradient id="meteor-tail-{i}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e7c37b" stop-opacity="0"/><stop offset=".5" stop-color="#f6dfa2" stop-opacity=".22"/><stop offset="1" stop-color="#fff6d8"/></linearGradient><radialGradient id="meteor-head-{i}"><stop stop-color="#fffbe8"/><stop offset=".25" stop-color="#ffe6a2" stop-opacity=".6"/><stop offset="1" stop-color="#ffe6a2" stop-opacity="0"/></radialGradient></defs><path d="M0 4Q150 -1 306 24Q153 3 0 4Z" fill="url(#meteor-tail-{i})"/><path d="M0 4Q150 -1 306 24" stroke="url(#meteor-tail-{i})" stroke-width=".75" fill="none"/><circle cx="306" cy="24" r="8" fill="url(#meteor-head-{i})"/><circle cx="306" cy="24" r="1.4" fill="#fff9e4"/></svg>''')
meteors.append('</div>')
page = re.sub(r'<video\b[\s\S]*?</video>',art+''.join(galaxy)+''.join(meteors), page, count=1)
page = page.replace('</head>','<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="celestial.css"></head>')
page = page.replace('<h1>Kelecsényi Léna</h1>','<div class="intro-content"><h1>Kelecsényi Léna</h1><a class="intro-scroll-link" href="#hero">Tovább az oldalra <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M12 4v15m-6-6 6 6 6-6"/></svg></a></div>')
# No remote WordPress scripts are needed for this local static main-page preview.
page = re.sub(r'<script\b[\s\S]*?</script>', '', page)
page = page.replace('</body>','<script src="original-site.js"></script><script src="celestial.js"></script></body>')
page = page.replace('https://kelecsenyilena.hu/#', '#')
page = page.replace('href="https://kelecsenyilena.hu/"', 'href="/"')
page = page.replace('href="https://kelecsenyilena.hu"', 'href="/"')

assets=ROOT/'original-assets'
assets.mkdir(exist_ok=True)
vendor_assets=json.loads((assets/'vendor-assets.json').read_text(encoding='utf-8'))['files']
for i,sheet in enumerate(json.loads((ROOT/'original-styles.json').read_text(encoding='utf-8'))):
    if sheet['css'] is None: continue
    css=sheet['css']
    css=re.sub(r'url\([\'"]?([^\)\'"\s]+)[\'"]?\)',lambda m:'url("'+urljoin(sheet['url'],m[1])+'")',css)
    for asset in vendor_assets:
        css=css.replace(asset['replaces'],'/original-assets/'+asset['path'])
    filename=f'original-assets/style-{i}.css'
    (ROOT/filename).write_text(css,encoding='utf-8')
    page=page.replace(html.escape(sheet['url'],quote=True),filename).replace(sheet['url'],filename)
# Only these three already-public brand assets are needed; no WordPress tree,
# media archive or earlier local prototype is needed by a fresh clone.
for name in ('lena-favicon-32.png', 'lena-celestial-icon-192.png', 'lena-portrait.png'):
    if not (assets/name).is_file():
        raise FileNotFoundError(f'Missing public brand asset: {name}')
    page=page.replace('https://kelecsenyilena.hu/wp-content/themes/zodiac-astrology-child/assets/images/'+name,'original-assets/'+name)
# The selected local brand is variant 03; preserve the captured original assets.
for size in (32, 180, 192):
    if not (ROOT / f'brand-assets/kl-monogram-{size}.png').is_file():
        raise FileNotFoundError(f'Missing selected brand asset: kl-monogram-{size}.png')
favicon_version = hashlib.sha256((ROOT / 'brand-assets/kl-monogram-32.png').read_bytes()).hexdigest()[:12]
page=page.replace('original-assets/lena-favicon-32.png', 'brand-assets/kl-monogram-32.png?v=' + favicon_version)
page=page.replace('original-assets/lena-celestial-icon-192.png', 'brand-assets/kl-monogram-192.png')
page=re.sub(r'<link rel="icon"[^>]*sizes="192x192"[^>]*>', '', page)
page=page.replace('<link rel="apple-touch-icon" href="brand-assets/kl-monogram-192.png">', '<link rel="apple-touch-icon" sizes="180x180" href="brand-assets/kl-monogram-180.png">')
page=page.replace('<script src="original-site.js"></script>','')
for asset in ['celestial.css', 'celestial.js']:
    version = hashlib.sha256((ROOT/asset).read_bytes()).hexdigest()[:10]
    page = page.replace(asset+'"', asset+'?v='+version+'"')
(ROOT/'index.html').write_text(page,encoding='utf-8')
print(f'Local original page restored. Vector art: {len(art.encode()):,} bytes; no video element remains.')
