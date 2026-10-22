# WordPress kiadás

Az elemző azonos eredetű WordPress REST-végpontokon át, a tárhelyen futó Python számolómotort használja. Nem igényel külön szolgáltatót, API-kulcsot vagy a látogatók születési adatainak tárolását.

Az ellenőrzött célkörnyezet Linux x86_64, CPython 3.10 és PHP 8.5.12. A `runtime-wheels.json` a PyPI hivatalos, változatlan bináris csomagjait pontos URL-hez és SHA-256 értékhez köti. A kész csomag a Python-könyvtárakat, az atlaszt és az efemeridákat is tartalmazza; az éles szerveren nincs csomagtelepítés vagy fordítás. Új Python-verzióhoz megfelelő bináris kiadás és új ellenőrzés kell. A `pyswisseph` teljes forrása a `demo/third-party-src/` mappában rendelkezésre áll; saját fordításnál ehhez C-fordító szükséges.

Előbb készítsd elő a demót annak README-je szerint, majd a repó gyökeréből:

```powershell
./demo/.venv/Scripts/python.exe production/build-release.py
./demo/.venv/Scripts/python.exe -m unittest discover -s production/tests -v
```

A kiadások a kizárt `.local/production-qa/releases/` mappában jönnek létre. A forráscsomag a demó ellenőrzött fájljai mellett a `production/source-files.json` pontos listáját is tartalmazza. Nem tartalmaz WordPress-adatbázist, környezeti fájlt, jelszót, naplót vagy személyes adatot. A már létező WordPress-források saját licencelését a közzététel nem módosítja; az új elemző és integrációja AGPL-3.0-only.

Telepítés előtt legyen friss mentés. Csak a kiadott child theme és a `lena-astrology` bővítmény frissítendő a WordPress normál ZIP-feltöltőjén. A WordPress core, médiatár, régi bővítmények és `wp-config.php` nem cserélendők.

A bővítmény `runtime/` könyvtárát Apache `.htaccess` védi. Az adminisztrátori ellenőrzés a tiltást HTTP-kéréssel is ellenőrzi. A nyilvános számítás csak a védelem, a fájlok ellenőrzőösszegei, a motor állapota és egy szintetikus referenciaképlet sikeres ellenőrzése után kapcsolható be. A készenlét a forráscsomag SHA-256 értékéhez kötött; új kiadás új ellenőrzést igényel.

A publikus végpontok méret- és időkorlátot, IP-nkénti mérsékelt korlátozást és `no-store` választ használnak. A születési adat kizárólag POST JSON törzsben, a Python felé stdin-en utazik; nem kerül parancssori argumentumba, URL-be vagy alkalmazásnaplóba. A tárhely hozzáférési naplóinak a kérés törzsét nem szabad menteniük. A működő változat megfelelő forrása a `/source.zip` címen érhető el.
