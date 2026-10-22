# Harmadik fél megfelelő forráskódja

A `pyswisseph-2.10.3.2.tar.gz` a PyPI hivatalos, változatlan forráscsomagja.
A Python-illesztő és a mellékelt Swiss Ephemeris C-könyvtár forrását,
licenceit és a csomag fordítási fájljait is tartalmazza.
Az eredetet és az ellenőrzött SHA-256 lenyomatot a `manifest.json` rögzíti.

Forrásból való telepítés a demó Python-környezetében (C-fordító szükséges):

```powershell
.\demo\.venv\Scripts\python.exe -m pip install .\demo\third-party-src\pyswisseph-2.10.3.2.tar.gz
```

Az alap indító a követelményfájlban rögzített, ugyanilyen verziójú bináris
csomagot használhatja. A forrásarchívum a letölthető demóforrás része.
A Python-futtatókörnyezet és az általános fordítási eszközök nincsenek mellékelve.
