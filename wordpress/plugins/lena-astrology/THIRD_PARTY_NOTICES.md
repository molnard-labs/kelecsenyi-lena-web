# Harmadik féltől származó összetevők

Ez a jegyzék a `demo/` helyi asztrológiai alkalmazásra vonatkozik.
A saját demókód licence **AGPL-3.0-only**; a harmadik féltől származó
összetevők alábbi engedélyei és szerzői jogai változatlanul megmaradnak.
A gyökérben található `LICENSE` nem írja felül ezeket.

A demó forrása, build/indító scriptjei, tesztjei, függőségi követelményei,
az alábbi licencpéldányok és a `pyswisseph` megfelelő forráscsomagja a
helyi `/source.zip` végpontról is letölthető. A csomagot a
`demo/source-files.json` kifejezett fájllistája határozza meg.
Ez a jegyzék nem az eredeti WordPress-telepítés összes bővítményének
vagy médiatári elemének általános jogtisztasági auditja.

## Swiss Ephemeris és Python-kötése

**Swiss Ephemeris 2.10.03** — Copyright (C) 1997–2021 Astrodienst AG,
Switzerland. Authors: Dieter Koch and Alois Treindl.

- Eredeti projekt: <https://www.astro.com/swisseph/>.
- A Swiss Ephemeris AGPL / Professional kettős licenceléséből a demó
  **az AGPL lehetőséget választja**. Nem történt kereskedelmi
  licencvásárlás, és a demó nem ilyen engedélyre támaszkodik.
- A változatlan upstream licenc- és szerzői jogi közlemény:
  [licenses/Swiss-Ephemeris-NOTICE.txt](licenses/Swiss-Ephemeris-NOTICE.txt).
  Az AGPL teljes szövege: [LICENSE](LICENSE).
- A `pyswisseph` forráscsomag `libswe/` könyvtára tartalmazza a használt
  Swiss Ephemeris C-forrást, fejléceket és fordítási fájlokat.

**pyswisseph 2.10.3.2** — Copyright (c) 2007–2023 Stanislas Marquis.

- Eredeti projekt: <https://github.com/astrorigin/pyswisseph>.
- A forrásfájl saját engedélye **AGPL-3.0-or-later**; ezt az upstream jogot
  a demó saját kódjára választott `AGPL-3.0-only` nem szűkíti le.
- Az eredeti fájlfejléc:
  [licenses/pyswisseph-NOTICE.txt](licenses/pyswisseph-NOTICE.txt).
- A változatlan, hivatalos PyPI-forráscsomag:
  `demo/third-party-src/pyswisseph-2.10.3.2.tar.gz`.
  Eredetét és ellenőrzött SHA-256 lenyomatát az ugyanott lévő
  `manifest.json`, fordítását a `README.md` dokumentálja.

**Efemerida-adatok:** `sepl_18.se1`, `semo_18.se1`, `seas_18.se1`, a Swiss
Ephemeris DE441-alapú adatfájljai. A letöltés a hivatalos repository
`c69c14adb7a0f94829586ffd92cd422aacb21e86` revíziójára van rögzítve:
<https://github.com/aloistr/swisseph/tree/c69c14adb7a0f94829586ffd92cd422aacb21e86/ephe>.
A `demo/bootstrap_astro.py` az egyes fájlok SHA-256 értékét ellenőrzi.
Az adatok nem NASA/JPL névre alapozott külön engedéllyel, hanem a Swiss
Ephemeris projekt feltételei mellett kerülnek használatba. A Gitből kizárt
`demo/astro-data/` mappában töltődnek le; a forráscsomag a reprodukálható
letöltőscriptet tartalmazza.

## Település- és időzóna-adatok

**GeoNames** — <https://www.geonames.org/>,
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
A teljes engedély példánya:
[licenses/CC-BY-4.0.txt](licenses/CC-BY-4.0.txt).

A helyi atlasz a GeoNames `cities1000.zip`, `HU.zip`, `countryInfo.txt` és
`admin1CodesASCII.txt` letöltéseiből készül:
<https://download.geonames.org/export/dump/>.
A demó a lakott településekre szűr, az alternatív neveket kereséshez
normalizálja, egyes országneveket magyarít, és azonos nevű településeknél
régiót, koordinátát vagy GeoNames-azonosítót ad a megjelenített névhez.
Ez tehát a GeoNames adatainak átalakított, SQLite-formátumú helyi másolata.
A letöltött fájlok eredetét és lenyomatát a generált `astro-data/manifest.json`
rögzíti. A felületen megmarad a GeoNames-attribúció és a licenchivatkozás.

**tzdata 2026.2** — Copyright (c) 2020, Paul Ganssle (Google), Apache-2.0.

- Python-csomag: <https://github.com/python/tzdata>.
- Megőrzött közlemény: [licenses/tzdata-NOTICE.txt](licenses/tzdata-NOTICE.txt).
- Teljes engedély: [licenses/Apache-2.0.txt](licenses/Apache-2.0.txt).
- A csomag által jelzett IANA-adatverzió **2026b**. Az IANA eredeti
  licencszövege az időzóna-adatokat közkincsnek jelöli; a szöveg külön
  megnevezett kódfájlokra BSD-kivételt tartalmaz. A demó a Python-csomag
  időzóna-adatait használja, nem ezeket a C-forrásokat.
  [licenses/IANA-tzdb-2026b-LICENSE.txt](licenses/IANA-tzdb-2026b-LICENSE.txt),
  eredeti: <https://data.iana.org/time-zones/tzdb-2026b/LICENSE>.

**Python és standard könyvtára:** a demóhoz külön telepítendő általános
futtatókörnyezet, nincs a forráscsomagba beépítve. A kipróbált 3.12.10 verzió
PSF- és további megőrzött licencszövege:
[licenses/Python-3.12.10-LICENSE.txt](licenses/Python-3.12.10-LICENSE.txt).
Eredeti: <https://github.com/python/cpython/blob/v3.12.10/LICENSE>.

## Betűkészletek

A helyben kiszolgált WOFF2 fájlok licence **SIL Open Font License 1.1**.
Nem a demó AGPL-licence alá kerülnek. A fontfájlok mellé a demó
`astro-assets/` mappájába is bekerültek a licencpéldányok.

| Betűkészlet | Eredeti szerzői jogi megjelölés | Licencpéldány |
| --- | --- | --- |
| Cormorant Garamond | Copyright 2015 the Cormorant Project Authors | [Cormorant-Garamond-OFL.txt](licenses/Cormorant-Garamond-OFL.txt) |
| Manrope | Copyright 2018 The Manrope Project Authors | [Manrope-OFL.txt](licenses/Manrope-OFL.txt) |
| Noto Sans Symbols 2 | Copyright 2022 The Noto Project Authors | [Noto-Sans-Symbols-2-OFL.txt](licenses/Noto-Sans-Symbols-2-OFL.txt) |

Eredeti források:
[Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond),
[Manrope](https://github.com/google/fonts/tree/main/ofl/manrope),
[Noto Sans Symbols 2](https://github.com/google/fonts/tree/main/ofl/notosanssymbols2).
A Google Fonts-ról származó böngészős fájlokat a mellékelt
`prepare-local-fonts.py` és `prepare-wheel-font.py` scriptek készítik elő.
A Noto fájl csak az ábrához szükséges szimbólumok Google Fonts által
kiszolgált részhalmaza.

## Az eredeti főoldalból átvett stílusok

A `demo/original-styles.json` az eredeti oldal böngésző által sorosított,
módosítható CSS-forrásait és eredeti URL-jeit tartalmazza. A build ezekből
írja a `demo/original-assets/style-*.css` fájlokat, a relatív erőforrás-URL-ek
feloldásával. A böngészős rögzítés a kommenteket eltávolította; az alábbi
eredeti megjelölések ezért ezzel a jegyzékkel és a licencpéldányokkal együtt
őrzendők meg. A vektoros intro, a főoldali kiegészítések és az elemző
2026. októberi helyi módosítások.

| Demófájl | Összetevő és megőrzött jogok | Licencpéldány |
| --- | --- | --- |
| `style-0.css` | Bootstrap 5.3.3; Copyright 2011–2024 The Bootstrap Authors; MIT | [Bootstrap-5.3.3-LICENSE.txt](licenses/Bootstrap-5.3.3-LICENSE.txt) |
| `style-2.css` | Owl Carousel 2.2.1; Copyright 2013–2017 David Deutsch; upstream LICENSE: Copyright (c) 2014 Owl, Modified work Copyright 2016 David Deutsch; MIT | [Owl-Carousel-2.2.1-LICENSE.txt](licenses/Owl-Carousel-2.2.1-LICENSE.txt) |
| `style-3.css`, `style-5.css` | Zodiac Astrology szülőtéma stílusai; classictemplate; GPL-2.0-or-later | [Zodiac-Astrology-3.4.4-NOTICE.txt](licenses/Zodiac-Astrology-3.4.4-NOTICE.txt), [GPL-2.0.txt](licenses/GPL-2.0.txt), [GPL-3.0.txt](licenses/GPL-3.0.txt) |
| `style-4.css` | Font Awesome Free 7.0.0; Copyright 2025 Fonticons, Inc.; CSS/kód: MIT, fontok: OFL 1.1, SVG/JS ikonok: CC BY 4.0 | [Font-Awesome-Free-7.0.0-LICENSE.txt](licenses/Font-Awesome-Free-7.0.0-LICENSE.txt) |
| `style-6.css` | animate.css, Daniel Eden; MIT. A szülőtémába került változat pontos verziója nincs a fájlban rögzítve. A megőrzött licenc a 3.5.2 upstream kiadásból való, Copyright (c) 2016 Daniel Eden. | [Animate-CSS-LICENSE.txt](licenses/Animate-CSS-LICENSE.txt) |

A Font Awesome Free négy WOFF2 fájlja és az Owl Carousel lejátszásikonja is
helyben szerepel a `demo/original-assets/` könyvtárban. Az eredeti, verzióhoz
rögzített upstream URL-eket, licenceket és SHA-256 lenyomatokat a
`demo/original-assets/vendor-assets.json` őrzi. A build a CSS-ből ezekre a
helyi példányokra hivatkozik; futás közben nem kell az eredeti WordPress
szerverről fontokat vagy ikonokat kérnie.

Az eredeti CSS-fájlok URL-jei:
`https://kelecsenyilena.hu/wp-content/themes/zodiac-astrology/css/`
alatt `bootstrap.css`, `owl.carousel.css`, `default.css`,
`fontawesome-all.css`, `blocks.css`, `animate.css`.
A 2026-10-22-én elérhető eredeti fejlécek azonosítják a Bootstrap,
Owl Carousel és Font Awesome fenti verzióit. A `?ver=7.1` URL-paraméter
nem a szülőtéma verziószáma.

A szülőtéma 2026-10-22-én elérhető `style.css` fejléce **Zodiac Astrology
3.4.4**, GPLv2 vagy későbbi licencet ad. `readme.txt` fájlja az örökölt
Businessweb Plus / GraceThemes és Twenty Seventeen megjelöléseket is
tartalmazza; a releváns eredeti közleményeket a fenti NOTICE megőrzi.
Az AGPLv3 alkalmazással való kombinálásnál a GPLv3 lehetőséget használjuk,
a GPLv3 és az AGPLv3 13. szakaszának megfelelően. Ez nem az upstream
GPL-2.0-or-later engedély átírása.

Az átvett `style-1.css` és `style-8.css` az eredeti child theme
stílusai. A WordPress-rendszer és a teljes szülőtéma nem része a demó
függőségi csomagjának. Az eredeti főoldal arculati képei és szövegei
nem kapnak általános újrafelhasználási engedélyt ettől a kódlicenctől.
Font Awesome fontokat vagy SVG/JS ikonkészletet a demó nem mellékel;
a fenti összetett upstream licencet változatlanul megőrizzük.

## A megőrzött licencek forrásai

Az éles Linux-kiadás a `production/runtime-wheels.json` jegyzékben rögzített,
változatlan PyPI `pyswisseph` és `tzdata` csomagokat mellékeli. A kerékfájlok
eredeti licenc- és szerzői jogi megjelölései a futtatókörnyezetben megmaradnak.
A pyswisseph Linux-csomagjának `pyswisseph.libs/libsqlite3-f79e2a86.so.0.8.6`
SQLite-könyvtára az upstream tájékoztatása szerint public domain;
forrás: <https://sqlite.org/copyright.html>. A születési adatokat tartalmazó
SQLite-adatbázis nem készül: az atlasz nyilvános GeoNames-településadatokat tartalmaz.

- AGPLv3: <https://www.gnu.org/licenses/agpl-3.0.txt>; a mellékelt
  `pyswisseph` csomag ugyanezt a teljes licencszöveget tartalmazza.
- GPLv2 szöveg: <https://github.com/WordPress/WordPress/blob/master/license.txt>
  (az általános licencszöveg, a WordPress-specifikus előszó nélkül).
- GPLv3 szöveg: <https://github.com/gcc-mirror/gcc/blob/master/COPYING3>.
- Swiss-közlemény: a fenti rögzített Swiss-forrásrevízió `LICENSE` fájlja;
  pyswisseph-közlemény: a mellékelt 2.10.3.2 forráscsomag `pyswisseph.c` fejléce.
- Bootstrap: <https://github.com/twbs/bootstrap/blob/v5.3.3/LICENSE>.
- Owl Carousel: <https://github.com/OwlCarousel2/OwlCarousel2/blob/2.2.1/LICENSE>.
- Font Awesome: <https://github.com/FortAwesome/Font-Awesome/blob/7.0.0/LICENSE.txt>.
- animate.css: <https://github.com/animate-css/animate.css/blob/3.5.2/LICENSE>.
- CC BY 4.0: <https://github.com/creativecommons/creativecommons.org/blob/main/docroot/legalcode/by_4.0.txt>.
- Eredeti szülőtéma-megjelölések:
  <https://kelecsenyilena.hu/wp-content/themes/zodiac-astrology/style.css> és
  <https://kelecsenyilena.hu/wp-content/themes/zodiac-astrology/readme.txt>.
