# Későbbi automatikus WordPress-deploy

Az automatikus deploy jelenleg nincs bekapcsolva. A
`wordpress-deploy.yml.example` fájl később átmásolható ide:

```text
.github/workflows/wordpress-deploy.yml
```

Bekapcsolás előtt a GitHub repositoryban létre kell hozni:

- `WP_DEPLOY_HOST`
- `WP_DEPLOY_USER`
- `WP_DEPLOY_SSH_KEY`
- `WP_DEPLOY_PATH`

A `WP_DEPLOY_PATH` az éles szerver `wp-content` könyvtárának abszolút útvonala.

## Biztonsági feltételek

- először kézi `workflow_dispatch` futtatással tesztelendő;
- legyen friss Websupport-mentés;
- az SSH-felhasználó csak a szükséges `themes` és `plugins` célkönyvtárakat
  tudja írni;
- a workflow soha ne írja a WordPress core-t, médiatárat, adatbázist vagy
  `wp-config.php` fájlt;
- csak sikeres PHP-szintaxisellenőrzés után fusson deploy.

## Titkok

Valós hostnevet, felhasználónevet, privát SSH-kulcsot vagy jelszót tilos fájlba
írni. Ezek kizárólag GitHub Actions Secrets értékként tárolhatók.
