# Kelecsényi Léna WordPress

## Lokális indítás

```powershell
Copy-Item .env.example .env
powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1
```

A bootstrap idempotens: újrafuttatva nem írja felül a szerkesztett oldalakat.

## Szerkezet

- `themes/zodiac-astrology-child`: minden saját vizuális és sablonmódosítás
- `plugins/lena-core`: események és globális oldaladatok
- `scripts`: telepítés és kezdőtartalom
- `compose.yaml`: WordPress, MariaDB és WP-CLI

## Tartalomszerkesztés

- `Oldal adatai`: Calendly, elérhetőségek és hero szöveg
- `Oldalak`: bemutatkozás és konzultáció tartalma
- `Események`: Facebookhoz hasonló egyszerű eseménylétrehozás

Az esemény címét, borítóképét és leírását a normál WordPress mezőkben kell megadni.
Külön csak a kezdés, befejezés, helyszín és opcionális Cooltix-link szerepel.

## Production deploy

A repository csak a child theme-et és a saját plugint telepíti. A WordPress core,
adatbázis, médiatár és titkok a tárhelyen maradnak.

Végleges production URL: `https://kelecsenyilena.hu`.

Szükséges GitHub Secrets:

- `WP_DEPLOY_HOST`
- `WP_DEPLOY_USER`
- `WP_DEPLOY_SSH_KEY`
- `WP_DEPLOY_PATH`

A tárhelyen a `WP_DEPLOY_PATH` a `wp-content` könyvtár abszolút útvonala.
