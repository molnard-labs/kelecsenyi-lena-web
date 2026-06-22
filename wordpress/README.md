# WordPress-forrás

## Szerkezet

- `themes/zodiac-astrology-child` – Kelecsényi Léna egyedi child theme-je
- `plugins/lena-core` – eseménykezelés, globális oldaladatok, vCard és NFC route
- `scripts/bootstrap.ps1` – idempotens helyi telepítés
- `scripts/reset.ps1` – helyi adatbázis és WordPress teljes újraépítése
- `scripts/package.ps1` – adminban feltölthető theme- és plugin-ZIP készítése
- `compose.yaml` – WordPress 7.0, PHP 8.3, MariaDB és WP-CLI

## Függőség

A child theme szülősablonja a WordPress tárból telepíthető
`Zodiac Astrology`, könyvtárneve: `zodiac-astrology`.

## Szerkeszthető tartalom

- `Oldal adatai` – Calendly, e-mail, telefon, Instagram és hero szöveg
- `Oldalak` – bemutatkozás, konzultáció és adatkezelés
- `Események` – időpont, helyszín, borítókép, leírás és jegylink

## Production

Csak az alábbi két könyvtár telepítendő:

- `wp-content/themes/zodiac-astrology-child`
- `wp-content/plugins/lena-core`

Az adatbázist, médiatárat, WordPress core-t és `wp-config.php` fájlt deploy
közben tilos felülírni.
