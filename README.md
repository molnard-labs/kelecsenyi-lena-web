# Kelecsényi Léna weboldal

Statikus Astro + Tailwind weboldal Kelecsényi Lénának, Cloudflare Pages deploy mintához.

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

## Domain élesítés után frissítendő

Az ideiglenes site URL: `https://lenakelecsenyi.hu`.

Végleges domain után frissítsd:

- `astro.config.mjs` `site` értékét
- `public/contact.vcf` URL mezőjét
- `public/nfc-card-url.txt` tartalmát

Az NFC tagre a végleges URL kerüljön:

```text
https://<vegleges-domain>/cardurl/
```
