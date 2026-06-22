# Kelecsenyi Lena weboldal kontextus

## Cel

Egyszeru, ketnyelvu Astro + Tailwind statikus weboldal Kelecsenyi Lenanak, GitHub + Cloudflare Pages deploy mintaval, a `davidmolnar.dev` technikai strukturajahoz hasonloan.

Az oldal elsodleges celja, hogy Lena megtalalhato legyen online mint onismereti mentor es asztrologus, illetve az NFC nevjegy URL egy stabil webes belepesi pontra mutasson.

## Referencia

Technikai referencia:

- Helyi projekt: `D:\work\davidmolnar.dev`
- Stack: Astro, Tailwind CSS, statikus build, Cloudflare Pages
- Deploy minta: push `main` branchre, Cloudflare Pages automatikus build
- NFC minta:
  - `/cardurl/` stabil NFC/QR belepesi pont
  - `/addcontact/` mobil nevjegymento oldal
  - `/contact.vcf` letoltheto vCard
  - `public/nfc-card-url.txt` tartalmazza az NFC-re irando URL-t

Vizuális referencia:

- Helyi HTML: `file:///D:/Claude/Asztro/lena_asztrologus.html`
- Fontos: ebbol csak a szinvilagot es hangulatot kell atvenni, nem a teljes horoszkop-kalkulator, pricing vagy szolgaltataslogika funkcionalitasat.

## Publikus adatok

- Nev: `Kelecsenyi Lena`
- Magyar nev helyes ekezetekkel: `Kelecsényi Léna`
- Magyar headline: `Önismereti mentor és asztrológus`
- Angol headline: `Self-awareness mentor and astrologer`
- Email: `kelecsenyi.lena@gmail.com`
- Telefon: `+36 70 425 6216`
- Telefon gepi formatumban: `+36704256216`
- Hely: `Budapest, Hungary`
- Instagram: `https://www.instagram.com/kelecsenyi.lena/`
- TikTok: `https://www.tiktok.com/@kelecsenyi.lena`
- Facebook: `https://www.facebook.com/kelecsenyi.lena`
- Végleges domain: `kelecsenyilena.hu`

## Oldalstruktura

- `/` - magyar fooldal
- `/en/` - angol fooldal
- `/addcontact/` - mobil nevjegymento oldal
- `/cardurl/` - stabil NFC/QR belepesi pont
- `/contact.vcf` - letoltheto vCard
- `public/nfc-card-url.txt` - kesobbi NFC irashoz

Az NFC tagre a `https://kelecsenyilena.hu/cardurl/` URL keruljon.

Alapertelmezett redirect:

- `/cardurl/` -> `/addcontact/`

## Fooldali szekciok

1. Hero
   - nev
   - szerep/headline
   - rovid bemutatkozas
   - kapcsolat CTA

2. Rolam / About
   - bizalmi, szemelyes hangvetelu bemutatkozas
   - rovid magyar es angol szoveg

3. Fokuszteruletek
   - onismereti mentoralas
   - asztrologiai konzultacio
   - szemelyes kiseres

4. Kapcsolat
   - email
   - telefon
   - Instagram
   - TikTok
   - Facebook
   - nevjegy mentese telefonra

## Vizuális irany

A szinvilag a `D:\Claude\Asztro\lena_asztrologus.html` alapjan keszuljon.

Paletta:

- alap hatter: `#fdf9f4`
- lila szekciohatter: `#f5edfc`
- barack szekciohatter: `#fff4eb`
- fo lila: `#7558c0`
- mely lila: `#4a2d9c`
- arany: `#c9883a`
- vilagos arany: `#e8b55a`
- nap/sarga akcentus: `#f5c030`
- fo szoveg: `#2a1550`
- masodlagos szoveg: `#604880`
- halvany szoveg: `#a090c8`
- kartya hatter: `#ffffff`
- rose akcentus: `#e0748e`

Javasolt CSS tokenek:

```css
:root {
  --bg: #fdf9f4;
  --bg-lilac: #f5edfc;
  --bg-peach: #fff4eb;
  --purple: #7558c0;
  --purple-dark: #4a2d9c;
  --gold: #c9883a;
  --gold-light: #e8b55a;
  --sun: #f5c030;
  --text: #2a1550;
  --text-soft: #604880;
  --muted: #a090c8;
  --card: #ffffff;
  --rose: #e0748e;
}
```

Tipografia:

- Cimsor: Cormorant Garamond jellegu elegans serif
- Torzsszoveg: Jost jellegu letisztult sans
- Ha lehet, self-hostolt font vagy stabil font import legyen.

Hangulat:

- meleg
- szemelyes
- asztrologiai
- finom lila/arany akcentusok
- letisztult, mobilon jol olvashato

Kerulendo:

- teljes horoszkop-kalkulator atvetele
- pricing/szolgaltatascsomagok kitalalasa, ha nincs hozza tartalom
- ures portfolio vagy galeria megjelenitese
- tul marketinges landing page hangulat

## Fontos dontesek

- V1-ben nincs foto es nincs portfoliogaleria.
- A design kepek nelkul is teljesnek tunjon.
- Magyar + angol szovegek elso verziojat az implementacio kesziti.
- GitHub remote es Cloudflare Pages bekotes dokumentalt kezi lepes legyen.
- A site URL végleges értéke `https://kelecsenyilena.hu`.

## Javasolt implementacio

Projekt:

- Astro statikus site
- Tailwind CSS
- TypeScript
- `npm run dev`
- `npm run build`
- `dist/` output Cloudflare Pageshez

Javasolt komponensek:

- `BaseLayout`
- `Header`
- `Footer`
- `Hero`
- `About`
- `FocusAreas`
- `Contact`

Javasolt konfiguracio:

- `astro.config.mjs` `site` erteke `https://kelecsenyilena.hu`

## vCard tartalom

Legyen `public/contact.vcf`, kb. ilyen tartalommal:

```vcf
BEGIN:VCARD
VERSION:3.0
N:Kelecsenyi;Lena;;;
FN:Kelecsényi Léna
TITLE:Önismereti mentor és asztrológus
ROLE:Self-awareness mentor and astrologer
TEL;TYPE=CELL:+36704256216
EMAIL;TYPE=INTERNET:kelecsenyi.lena@gmail.com
URL:https://kelecsenyilena.hu
ADR;TYPE=WORK:;;;Budapest;;;Hungary
NOTE:Önismereti mentor és asztrológus. Instagram: https://www.instagram.com/kelecsenyi.lena/
END:VCARD
```

Az URL a végleges domainre van beállítva.

## GitHub es Cloudflare Pages

README-ben dokumentalando:

1. GitHub repo letrehozasa, javasolt nev: `kelecsenyi-lena-web` vagy a vegleges domain neve.
2. Lokalis git init, commit, remote beallitas, push.
3. Cloudflare Pages projekt letrehozasa GitHub repobol.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Production branch: `main`
7. Domain megvasarlasa/bekotese utan:
   - Cloudflare Pages custom domain
   - Astro `site` ertek frissitese
   - `public/nfc-card-url.txt` frissitese
   - NFC tagre `https://<vegleges-domain>/cardurl/`

## Teszteles

Parancsok:

```bash
npm install
npm run build
```

Ellenorizendo utvonalak:

- `/`
- `/en/`
- `/addcontact/`
- `/cardurl/`
- `/contact.vcf`

Elfogadasi feltetelek:

- `/cardurl/` a `/addcontact/` oldalra visz.
- A vCard tartalmazza:
  - nevet
  - emailt
  - telefonszamot
  - web URL-t
  - Budapestet
- Mobilon nincs szovegatfedes.
- Desktopon a hero, fokuszteruletek es kontakt szekcio aranyos, jol olvashato.
- A kontakt CTA-k mukodnek:
  - `mailto:`
  - `tel:`
  - Instagram / TikTok / Facebook external linkek
  - nevjegy mentese telefonra

## Elozmeny megjegyzesek

A cel eredetileg `D:\work\lenakelecsenyi.hu` volt, majd a felhasznalo kerte, hogy a teljes kontextus keruljon at ide:

`D:\work\kelecsenyi-lena-web`

Ha a sandbox vagy workspace irasi jogosultsag engedi, ezt a fajlt oda kell masolni `PROJECT_CONTEXT.md` neven.
