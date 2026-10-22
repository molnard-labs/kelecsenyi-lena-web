# Harmadik féltől származó összetevők

A saját forráskód licence **AGPL-3.0-only**. Az alábbi összetevők eredeti
engedélyei és szerzői jogi közleményei változatlanul megmaradnak; a [LICENSE](LICENSE)
nem írja felül őket. A megfelelő forráskód csomagját a
`production/source-files.json` határozza meg; az oldal `/source.zip` címén elérhető.

## Swiss Ephemeris és Python-kötése

**Swiss Ephemeris 2.10.03** — Copyright (C) 1997–2021 Astrodienst AG,
Switzerland. Authors: Dieter Koch and Alois Treindl.

- Eredeti projekt: <https://www.astro.com/swisseph/>.
- A Swiss Ephemeris AGPL / Professional kettős licenceléséből az alkalmazás
  **az AGPL lehetőséget választja**.
- Változatlan upstream közlemény:
  [Swiss-Ephemeris-NOTICE.txt](licenses/Swiss-Ephemeris-NOTICE.txt).
  Az AGPL teljes szövege: [LICENSE](LICENSE).

**pyswisseph 2.10.3.2** — Copyright (c) 2007–2023 Stanislas Marquis.

- Eredeti projekt: <https://github.com/astrorigin/pyswisseph>.
- A forrásfájl licence **AGPL-3.0-or-later**; ezt az upstream jogot a saját
  kódra választott `AGPL-3.0-only` nem szűkíti le.
- Eredeti fájlfejléc: [pyswisseph-NOTICE.txt](licenses/pyswisseph-NOTICE.txt).
- A változatlan, hivatalos PyPI-forráscsomag:
  `astrology/third-party-src/pyswisseph-2.10.3.2.tar.gz`.
  A Python-illesztő mellett a Swiss Ephemeris C-forrását, fejléceit és
  fordítási fájljait is tartalmazza. Eredetét és SHA-256 lenyomatát az ugyanott
  lévő `manifest.json` rögzíti.

**Efemerida-adatok:** `sepl_18.se1`, `semo_18.se1`, `seas_18.se1`, a Swiss
Ephemeris DE441-alapú adatfájljai, a projekt feltételei szerint.
A hivatalos forrásrevízió:
<https://github.com/aloistr/swisseph/tree/c69c14adb7a0f94829586ffd92cd422aacb21e86/ephe>.
Az `astrology/bootstrap_astro.py` ellenőrzi a letöltések SHA-256 lenyomatát;
az adatok a Gitből kizárt `astrology/astro-data/` könyvtárba kerülnek.

## Település- és időzóna-adatok

**GeoNames** — <https://www.geonames.org/>,
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
Teljes engedély: [CC-BY-4.0.txt](licenses/CC-BY-4.0.txt).

A SQLite-atlasz a GeoNames `cities1000.zip`, `HU.zip`, `countryInfo.txt` és
`admin1CodesASCII.txt` állományaiból készül:
<https://download.geonames.org/export/dump/>.
A feldolgozás a lakott településekre szűr, a keresési neveket normalizálja,
egyes országneveket magyarít, és azonos nevű településeknél régiót,
koordinátát vagy GeoNames-azonosítót ad a megjelenített névhez.
A módosított atlasz eredetét és lenyomatait az `astro-data/manifest.json`
rögzíti; a felületen GeoNames-attribúció és licenchivatkozás szerepel.

**tzdata 2026.2** — Copyright (c) 2020, Paul Ganssle (Google), Apache-2.0.

- Projekt: <https://github.com/python/tzdata>.
- [tzdata-NOTICE.txt](licenses/tzdata-NOTICE.txt),
  [Apache-2.0.txt](licenses/Apache-2.0.txt).
- IANA-adatverzió: **2026b**. Az alkalmazás az időzóna-adatokat használja.
  Az eredeti licenc ezeket közkincsnek jelöli, egyes külön megnevezett
  kódfájlokra BSD-kivételt tartalmaz:
  [IANA-tzdb-2026b-LICENSE.txt](licenses/IANA-tzdb-2026b-LICENSE.txt),
  <https://data.iana.org/time-zones/tzdb-2026b/LICENSE>.

Az éles Linux-kiadás a `production/runtime-wheels.json` jegyzékben rögzített,
változatlan PyPI `pyswisseph` és `tzdata` csomagokat használja, az eredeti
licenc- és szerzői jogi megjelölésekkel. A pyswisseph Linux-csomagjának
`pyswisseph.libs/libsqlite3-f79e2a86.so.0.8.6` SQLite-könyvtára az upstream
tájékoztatása szerint public domain: <https://sqlite.org/copyright.html>.
A Python-futtatókörnyezet nincs mellékelve. A fejlesztéskor használt Python
3.12.10 licencpéldánya: [Python-3.12.10-LICENSE.txt](licenses/Python-3.12.10-LICENSE.txt).

## Betűkészletek

A helyben kiszolgált WOFF2 fájlok licence **SIL Open Font License 1.1**;
nem kerülnek a saját kód AGPL-licence alá. A licencpéldányok a fontok mellett
és a `licenses/` könyvtárban is megmaradnak.

| Betűkészlet | Eredeti szerzői jogi megjelölés | Licencpéldány |
| --- | --- | --- |
| [Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond) | Copyright 2015 the Cormorant Project Authors | [Cormorant-Garamond-OFL.txt](licenses/Cormorant-Garamond-OFL.txt) |
| [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | Copyright 2018 The Manrope Project Authors | [Manrope-OFL.txt](licenses/Manrope-OFL.txt) |
| [Noto Sans Symbols 2](https://github.com/google/fonts/tree/main/ofl/notosanssymbols2) | Copyright 2022 The Noto Project Authors | [Noto-Sans-Symbols-2-OFL.txt](licenses/Noto-Sans-Symbols-2-OFL.txt) |

A Noto fájl az ábrához szükséges szimbólumok Google Fonts által kiszolgált
részhalmaza.

## WordPress-szülőtéma

A child theme a **Zodiac Astrology 3.4.4** szülőtémára épül, amelynek licence
**GPL-2.0-or-later**, szerzője classictemplate. Az eredeti Businessweb Plus /
GraceThemes és Twenty Seventeen megjelöléseket is megőrzi a
[Zodiac-Astrology-3.4.4-NOTICE.txt](licenses/Zodiac-Astrology-3.4.4-NOTICE.txt).
Licencpéldányok: [GPL-2.0.txt](licenses/GPL-2.0.txt), [GPL-3.0.txt](licenses/GPL-3.0.txt).
Az AGPLv3 alkalmazással való kombinálásnál a GPLv3 lehetőséget használjuk,
a GPLv3 és AGPLv3 13. szakasza szerint; az upstream engedély változatlan.
A WordPress és a teljes szülőtéma nincs ebben a forráscsomagban.

A szülőtéma összetevőinek megőrzött engedélyei:

| Összetevő | Megőrzött jogok | Licencpéldány |
| --- | --- | --- |
| Bootstrap 5.3.3 | Copyright 2011–2024 The Bootstrap Authors; MIT | [Bootstrap-5.3.3-LICENSE.txt](licenses/Bootstrap-5.3.3-LICENSE.txt) |
| Owl Carousel 2.2.1 | Copyright 2013–2017 David Deutsch; upstream LICENSE: Copyright (c) 2014 Owl, Modified work Copyright 2016 David Deutsch; MIT | [Owl-Carousel-2.2.1-LICENSE.txt](licenses/Owl-Carousel-2.2.1-LICENSE.txt) |
| Font Awesome Free 7.0.0 | Copyright 2025 Fonticons, Inc.; CSS/kód: MIT, fontok: OFL 1.1, SVG/JS ikonok: CC BY 4.0 | [Font-Awesome-Free-7.0.0-LICENSE.txt](licenses/Font-Awesome-Free-7.0.0-LICENSE.txt) |
| animate.css | Daniel Eden; MIT. A szülőtémában a verzió nincs rögzítve; a megőrzött 3.5.2 upstream licencben Copyright (c) 2016 Daniel Eden szerepel. | [Animate-CSS-LICENSE.txt](licenses/Animate-CSS-LICENSE.txt) |

Az arculati képek és szövegek nem kapnak általános újrafelhasználási
engedélyt a forráskód licencétől.
