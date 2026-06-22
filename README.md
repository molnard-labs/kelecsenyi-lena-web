# Kelecsényi Léna WordPress-weboldal

Ez a repository kizárólag a `kelecsenyilena.hu` egyedi WordPress-kódját és a
helyi fejlesztéshez szükséges környezetet tartalmazza.

## Tartalom

- `wordpress/themes/zodiac-astrology-child/` – az aktív egyedi child theme
- `wordpress/plugins/lena-core/` – események, oldaladatok, NFC/vCard funkciók
- `wordpress/scripts/` – helyi telepítés és visszaállítás
- `wordpress/compose.yaml` – helyi WordPress + MariaDB + WP-CLI
- `deployment/` – később aktiválható GitHub Actions deploy-sablon

A WordPress core, az adatbázis, a médiatár és a titkos adatok nem részei a
repositorynak.

A `.local/` könyvtár gépen maradó referencia- és archív fájlok helye. Git
figyelmen kívül hagyja; ide kerülhetnek olyan forrásdokumentumok is, amelyek
személyes adatot tartalmaznak.

A valódi helyi jelszavak kizárólag a gitignore-olt `wordpress/.env` fájlban
lehetnek. Az `.env.example` csak egyértelmű helyőrzőket tartalmazhat.

## Helyi indítás

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
