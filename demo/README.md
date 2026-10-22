# Helyi képletelemző demó

Ez önálló, helyben futtatható forrásváltozat. Nem telepít WordPresst és nem módosítja az éles oldalt. A kipróbált Python-verzió 3.12.10; az opcionális JavaScript-tesztekhez Node.js 22 vagy újabb szükséges. Ha a Python-verzióhoz nincs előre fordított pyswisseph-csomag, C-fordító is szükséges, Windowson például Visual Studio Build Tools C++ eszközkészlettel.

Windows PowerShellben, a repó gyökeréből:

```powershell
./demo/Start-LocalPreview.ps1
```

Az első indítás Python-virtuális környezetet hoz létre, telepíti a rögzített függőségeket, majd letölti a nyilvános Swiss Ephemeris- és GeoNames-adatokat. Ezután a számítás helyben, hálózat nélkül történik. A betűtípusok és a három, korábban is nyilvános márkakép a forrásban vannak. A szerver kizárólag a `127.0.0.1` címen figyel; az alapértelmezett port 4173. Másik port: `./demo/Start-LocalPreview.ps1 -Port 4174`.

Kézi indítás (macOS/Linux esetén a Python-környezet futtatható állománya `.venv/bin/python`):

```powershell
python -m venv demo/.venv
./demo/.venv/Scripts/python.exe -m pip install -r demo/requirements-astro.txt
./demo/.venv/Scripts/python.exe demo/bootstrap_astro.py
./demo/.venv/Scripts/python.exe demo/build-local-preview.py
./demo/.venv/Scripts/python.exe demo/preview_server.py --port 4173
```

Főoldal: <http://127.0.0.1:4173/>. Elemzés: <http://127.0.0.1:4173/gyors-elemzes/>. A dátum magyar év–hó–nap, az idő 24 órás formátumú. Gépeléskor csak számokat kell megadni (például `19900521`, `0930`); a pontok és a kettőspont automatikusan megjelennek. A települést a találati listából kell kiválasztani. Nyári/téli óraátállításkor egyes időpontok nem léteznek vagy kétértelműek; az űrlap ezt külön jelzi.

A tíz új emblémaváltozat helyi galériája: <http://127.0.0.1:4173/icon-variations.html>. A képek és a generálásukhoz használt promptok az `icon-variants/` mappában találhatók. A helyi demóban a kiválasztott 03-as, KL monogramos változat jelenik meg a fejlécben és böngészőikonként; optimalizált PNG-méretei a `brand-assets/` mappában vannak. Az éles oldal változatlan.

## Forrás és licencek

A saját szoftver AGPL-3.0-only alatt használható; a pontos hatályt és a külön licencű összetevőket a repó [LICENSE](../LICENSE) és [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) fájljai írják le. A lábléc „Szoftverlicencek” hivatkozásáról elérhető licencoldalon az aktuálisan mentett, engedélyezett forrásfájlok ZIP-ként letölthetők. A `/license.txt` és `/third-party-notices.txt` az ugyanehhez a változathoz tartozó jogi szövegeket szolgálja ki. A Python-illesztő és az abba foglalt Swiss Ephemeris forrása a `third-party-src/` mappában található; a rendszerkönyvtárak, a telepítési csomagok és a generált adatbázis nem részei a saját alkalmazás forrásának.

Az engedélyezett fájlokat a `source-files.json` sorolja fel egyenként. Új forrás hozzáadásakor ezt a listát is frissíteni kell. A csomagolás nem járja be a repót: nem kerülhet bele `.env`, `.git`, korábbi `.local` prototípus, virtuális környezet, napló, születési adat, GeoNames-adatbázis vagy efemeridagyorsítótár. Kézi csomagkészítés:

```powershell
python demo/source_bundle.py
```

## Ellenőrzés

Az adatok előkészítése és a HTML felépítése után:

```powershell
./demo/.venv/Scripts/python.exe -m unittest discover -s demo/tests -v
node --test demo/tests/test_wheel_geometry.mjs demo/tests/test_datetime.mjs
```

Az asztrológiai értelmezés saját magyar szöveg, nem könyvidézet. A tesztek ellenőrzik a Swiss Ephemeris hivatalos `swetest` programjával készült számszerű referenciát, történeti időzónákat, hibás időpontokat és a képletábra geometriáját. A régebbi nyilvános astro.com példák kiegészítő ellenőrzések; a hozzájuk tartozó megjegyzések jelzik az eredetüket és korlátaikat.

## Újraépítés

A `build-vector-preview.py` a megtisztított, nyilvános főoldal-pillanatképből (`original-page.html`, `original-styles.json`) és a vektoros animáció kódjából állítja elő az eredeti megjelenésű főoldalt. A `build-local-preview.py` hozzáadja az elemzésre mutató hivatkozást, a forrásajánlatot, majd az `astro-page.template.html` alapján létrehozza az elemzőoldalt. Nincs szükség a WordPress könyvtárra, az eredeti videóra vagy korábbi helyi fájlokra.

A GeoNames napi állománya változhat; a bootstrap a letöltött adatok dátum szerinti pillanatképének URL-jét és SHA-256 értékét a kizárt `astro-data/manifest.json` fájlba menti. A három efemeridafájl Git-revízióhoz és ellenőrzőösszeghez rögzített. A függőségek verzióját a `requirements-astro.txt` rögzíti.
