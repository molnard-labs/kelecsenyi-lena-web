# Kelecsényi Léna — weboldal és helyi asztrológiai demó

Ez a repository a `kelecsenyilena.hu` egyedi WordPress-kódját és egy külön,
helyben futtatható asztrológiai demó forrását tartalmazza. A demó hozzáadása
nem telepíti az elemzőt az éles WordPress-oldalra.

Az éles WordPress-integráció kiadási és ellenőrzési folyamata a
[production/README.md](production/README.md) fájlban található. Az új
`wordpress/plugins/lena-astrology/` számolóillesztő és a `production/`
kiadási kód a demóval együtt AGPL-3.0-only licencű. Az új animáció és az
elemzőhöz tartozó integrációs módosítások forrását a produkciós csomag is
elérhetővé teszi; az örökölt márkatartalmakra vonatkozó korlátozások megmaradnak.

## A demó licence

A `demo/` könyvtár saját programkódja, tesztjei és build/indító scriptjei a
**GNU Affero General Public License 3. verziója, kizárólag ez a verzió**
(`AGPL-3.0-only`) alatt használhatók, módosíthatók és terjeszthetők.
A licenc teljes szövege a [LICENSE](LICENSE) fájlban található. A szoftverhez
nem tartozik jótállás; a pontos feltételeket a licenc tartalmazza.

A Swiss Ephemeris esetében a demó az AGPL licencelési lehetőséget választja.
A `pyswisseph` Python-kötés külön AGPL-licence szintén érvényes.
Ez a licencválasztás a demó teljes saját alkalmazáskódjára vonatkozik,
a számítási motorral együttműködő szerverre és böngészős felületre is.

A harmadik féltől származó kódok, adatok és betűkészletek megtartják saját
licencüket és szerzői jogi megjelöléseiket. A korábban meglévő `wordpress/`
forrásokat, valamint a neveket, arculati képeket, fényképeket és az eredeti
weboldalból átvett szerkesztői tartalmakat ez a licencnyilatkozat nem
licenceli át. Az új elemző saját, programba írt magyar értelmezései és
önismereti kérdései (`demo/astro-interpretation.js`) a demókóddal együtt
AGPL-3.0-only licencűek. Saját oldalhoz az örökölt
arculati és tartalmi elemeket cserélni kell, vagy külön felhasználási joggal
kell rendelkezni. A részletek és megőrzött licencszövegek a
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) fájlban és a
[licenses/](licenses/) könyvtárban találhatók.

Ha a demó módosított változatát hálózati szolgáltatásként használod,
az AGPL 13. szakaszának megfelelően biztosítani kell a felhasználóknak a
ténylegesen futó változat megfelelő forráskódját. A demó
[`/source.zip`](http://127.0.0.1:4173/source.zip) forrásletöltése ezt
támogatja; új kiadásnál a forráscsomag tartalmát is frissíteni
kell. Titkos kulcsokat, jelszavakat és személyes születési adatokat nem kell
és nem szabad a forráscsomagba tenni.

## A helyi demó indítása

Előfeltétel: Python 3.12 (kipróbált verzió: 3.12.10); az előkészítéshez
internetkapcsolat. Ha a `pyswisseph` csomaghoz nincs a Python-verziónak és
platformnak megfelelő kész bináris csomag, a telepítés forrásból fordít:
ehhez C-fordító kell, Windowson például Visual Studio Build Tools a C++
buildeszközökkel. A demó nem igényel Docker Desktopot,
API-kulcsot vagy külső számítási szolgáltatást.

Windows PowerShellből, a repository gyökerében:

```powershell
powershell -ExecutionPolicy Bypass -File demo/Start-LocalPreview.ps1
```

Az indító saját `demo/.venv` környezetet készít, a rögzített Python-csomagokat
telepíti, szükség esetén letölti a nyilvános efemerida- és településadatokat,
majd felépíti az oldalakat. A letöltött adatok a Gitből kizárt
`demo/astro-data/` könyvtárban maradnak. Az előkészítés után a számítás és a
településkeresés hálózat nélkül működik.

- Főoldal: <http://127.0.0.1:4173/>
- Elemzés és képletábra: <http://127.0.0.1:4173/gyors-elemzes/>
- Megfelelő forráskód, licencekkel: <http://127.0.0.1:4173/source.zip>

A szerver csak a helyi gép loopback címén figyel. A megadott születési
adatokat nem menti és nem naplózza. Az oldalon szereplő külső hivatkozások
megnyitása külön hálózati művelet.

Kézi előkészítés és indítás, például Linuxon vagy macOS-en:

```sh
python3 -m venv demo/.venv
demo/.venv/bin/python -m pip install -r demo/requirements-astro.txt
demo/.venv/bin/python demo/bootstrap_astro.py
demo/.venv/bin/python demo/build-local-preview.py
demo/.venv/bin/python demo/preview_server.py
```

A betűkészletek és licenceik a demóban szerepelnek; újragenerálásukhoz a
`prepare-local-fonts.py` és `prepare-wheel-font.py` scriptek használhatók.
A számítás `pyswisseph==2.10.3.2` és `tzdata==2026.2` csomagra épül.
A három efemeridafájl pontos forrásrevízióját és SHA-256 értékét a
`bootstrap_astro.py` rögzíti. A csillagászati számítás és a saját magyar
asztrológiai értelmezés külön réteg; az utóbbi nem tudományosan igazolt
előrejelzés és nem Griga Zsuzsanna könyvéből átvett szöveg.

Ellenőrzések Windows alatt:

```powershell
& demo/.venv/Scripts/python.exe -m unittest discover -s demo/tests -v
node --test demo/tests/test_wheel_geometry.mjs demo/tests/test_datetime.mjs
```

A Node.js csak a JavaScript-tesztekhez kell. A demó
futtatásához nincs JavaScript-csomagtelepítés vagy bundler.

## Tartalom

- `wordpress/themes/zodiac-astrology-child/` – az aktív egyedi child theme
- `wordpress/plugins/lena-core/` – események, oldaladatok, NFC/vCard funkciók
- `wordpress/scripts/` – helyi telepítés és visszaállítás
- `wordpress/compose.yaml` – helyi WordPress + MariaDB + WP-CLI
- `deployment/` – később aktiválható GitHub Actions deploy-sablon
- `demo/` – a külön helyi elemző és képletábra teljes alkalmazásforrása
- `licenses/` – harmadik féltől származó licencek és megjelölések

A WordPress core, az adatbázis, a médiatár és a titkos adatok nem részei a
repositorynak.

A `.local/` könyvtár gépen maradó referencia- és archív fájlok helye. Git
figyelmen kívül hagyja; ide kerülhetnek olyan forrásdokumentumok is, amelyek
személyes adatot tartalmaznak. A megosztható demó forrása a külön `demo/`
könyvtárban van; a teljes `.local/` könyvtárat nem kell publikálni.

A valódi helyi jelszavak kizárólag a gitignore-olt `wordpress/.env` fájlban
lehetnek. Az `.env.example` csak egyértelmű helyőrzőket tartalmazhat.

## A WordPress helyi indítása

Előfeltétel: Docker Desktop.

```powershell
Copy-Item wordpress/.env.example wordpress/.env
powershell -ExecutionPolicy Bypass -File wordpress/scripts/bootstrap.ps1
```

- Weboldal: `http://localhost:8080`
- Admin: `http://localhost:8080/wp-admin`

Teljes helyi újratelepítés:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress/scripts/reset.ps1
```

WordPressben feltölthető ZIP-ek készítése:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress/scripts/package.ps1
```

A csomagok a git által figyelmen kívül hagyott `wordpress/.build/` könyvtárba
kerülnek.

## Éles oldal

- Weboldal: `https://kelecsenyilena.hu`
- WordPress admin: `https://kelecsenyilena.hu/wp-admin/`
- NFC stabil URL: `https://kelecsenyilena.hu/cardurl/`
- Névjegyoldal: `https://kelecsenyilena.hu/addcontact/`

## Kiadás

Jelenleg a child theme és a plugin ZIP-fájlként kézzel frissíthető a WordPress
adminban. A későbbi automatikus GitHub-deploy előkészítése a
`deployment/README.md` fájlban található; nincs aktív deploy workflow.
