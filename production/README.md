# Kiadáscsomag

A `build-release.py` készíti a WordPress-bővítmény, a gyermektéma és a megfelelő forrás ZIP-csomagját.
A rögzített célkörnyezet Linux x86_64, CPython 3.10 és PHP 8.5.12.
A szükséges csomagokat és ellenőrzőösszegeiket a `runtime-wheels.json`, a forrásokat a `source-files.json` rögzíti.
Az efemeridák és a településatlasz előállítója az `astrology/bootstrap_astro.py`.
A kimenet a Gitből kizárt `.local/production-qa/releases/` mappába kerül.
Az elemző éles engedélyezése előtt a WordPress-adminban le kell futtatni a bővítmény beépített ellenőrzését.
