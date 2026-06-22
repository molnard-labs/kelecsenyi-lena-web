# Kelecsényi Léna weboldal

Statikus Astro + Tailwind weboldal Kelecsényi Lénának, Cloudflare Pages deploy mintához.

Az új WordPress-változat a `wordpress/` mappában található. Az Astro oldal
változatlan tartalmi és vizuális referenciaként marad meg.

## WordPress fejlesztés

Előfeltétel: Docker Desktop.

```powershell
Copy-Item wordpress/.env.example wordpress/.env
powershell -ExecutionPolicy Bypass -File wordpress/scripts/bootstrap.ps1
```

- Weboldal: http://localhost:8080
- Admin: http://localhost:8080/wp-admin
- A helyi admin belépési adatokat a `wordpress/.env` tartalmazza.

Leállítás:

```powershell
docker compose --env-file wordpress/.env -f wordpress/compose.yaml down
```

Teljes lokális újratelepítés:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress/scripts/reset.ps1
```

Részletes dokumentáció: `wordpress/README.md`.

## Fejlesztés

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

A build output: `dist/`.

## Útvonalak

- `/` - magyar főoldal
- `/en/` - angol főoldal
- `/sorselemzes-jelentkezes/` - magyar sorselemzés jelentkezés
- `/en/chart-reading-application/` - angol jelentkezési oldal
- `/addcontact/` - mobil névjegymentő oldal
- `/cardurl/` - NFC/QR belépési pont, az `/addcontact/` oldalra továbbít
- `/contact.vcf` - letölthető vCard

## Cloudflare Pages

1. Hozz létre GitHub repót, például `kelecsenyi-lena-web` néven.
2. Pushold a projektet a `main` branchre.
3. Cloudflare Pages-ben hozz létre új projektet GitHub repóból.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Production branch: `main`

## Végleges domain

- Weboldal: `https://kelecsenyilena.hu`
- NFC/QR belépési pont: `https://kelecsenyilena.hu/cardurl/`
