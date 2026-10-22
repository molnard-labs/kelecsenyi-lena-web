"""One-time public-data setup. No birth data is read or sent by this script.

Run with .venv/Scripts/python.exe bootstrap_astro.py after installing
requirements-astro.txt. Runtime calculations subsequently need no network.
"""
from __future__ import annotations

import hashlib
import io
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import sqlite3
import unicodedata
from urllib.request import Request, urlopen
import zipfile

BASE = Path(__file__).resolve().parent
DATA = BASE / "astro-data"
SWISS_REV = "c69c14adb7a0f94829586ffd92cd422aacb21e86"
SWISS_ROOT = f"https://raw.githubusercontent.com/aloistr/swisseph/{SWISS_REV}"
SWISS_HASHES = {
    "sepl_18.se1": "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66",
    "semo_18.se1": "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7",
    "seas_18.se1": "a2cd8fc33807c78ca9a700c91c2e042258b12fc4796519e00781440b5ad8b2e2",
}


def normalize(value: str) -> str:
    return " ".join("".join(c for c in unicodedata.normalize("NFKD", value.casefold())
                            if not unicodedata.combining(c)).split())


def fetch(url: str) -> bytes:
    with urlopen(Request(url, headers={"User-Agent": "Lena-local-astrology-preview/1.0"}), timeout=90) as response:
        return response.read()


def qualify_duplicate_names(rows: dict, regions: dict, countries: dict) -> dict:
    """Disambiguate equal city/country names without lengthening unique names.

    Admin1 names identify e.g. the Illinois/Massachusetts Springfields. Equal
    city names inside one region additionally get coordinates. The rare pair
    of GeoNames records sharing both name and coordinates gets its stable ID.
    """
    counts = Counter((row[2], row[7]) for row in rows.values())
    result = {}
    for place_id, source in rows.items():
        row = list(source)
        country = countries.get(row[2], row[2])
        name = row[10]
        region = regions.get(f"{row[2]}.{row[9]}", "")
        row[1] = f"{name}, {country}"
        if counts[(row[2], row[7])] > 1:
            row[1] = f"{name}, {region}, {country}" if region else row[1]
        result[place_id] = row
    label_counts = Counter(normalize(row[1]) for row in result.values())
    for row in result.values():
        if label_counts[normalize(row[1])] > 1:
            row[1] += f" · {row[3]:.5f}°, {row[4]:.5f}°"
    label_counts = Counter(normalize(row[1]) for row in result.values())
    for place_id, row in result.items():
        if label_counts[normalize(row[1])] > 1:
            row[1] += f" · GeoNames {place_id}"
        row[8] += " " + normalize(row[1].replace(",", " "))
    return result


def main() -> None:
    DATA.mkdir(exist_ok=True)
    manifest = {"downloaded_at_utc": datetime.now(timezone.utc).isoformat(), "swiss_revision": SWISS_REV, "files": {}}
    for name in ("sepl_18.se1", "semo_18.se1", "seas_18.se1"):
        url = f"{SWISS_ROOT}/ephe/{name}"
        destination = DATA / name
        if not destination.exists():
            destination.write_bytes(fetch(url))
        contents = destination.read_bytes()
        if len(contents) < 10000 or contents[:3] == b"<!D":
            raise RuntimeError(f"Invalid ephemeris download: {name}")
        digest = hashlib.sha256(contents).hexdigest()
        if digest != SWISS_HASHES[name]:
            raise RuntimeError(f"Ephemeris checksum mismatch: {name}")
        manifest["files"][name] = {"url": url, "sha256": digest, "bytes": len(contents)}
        print(f"Ephemeris ready: {name} ({len(contents)} bytes)")

    countries = {}
    country_url = "https://download.geonames.org/export/dump/countryInfo.txt"
    country_data = fetch(country_url)
    manifest["files"]["countryInfo.txt"] = {"url": country_url, "sha256": hashlib.sha256(country_data).hexdigest(), "bytes": len(country_data)}
    for line in country_data.decode("utf-8").splitlines():
        if line and not line.startswith("#"):
            row = line.split("\t")
            countries[row[0]] = row[4]
    countries.update({"HU": "Magyarország", "AT": "Ausztria", "SK": "Szlovákia", "RO": "Románia",
                      "RS": "Szerbia", "HR": "Horvátország", "SI": "Szlovénia", "DE": "Németország",
                      "GB": "Egyesült Királyság", "US": "Egyesült Államok", "FR": "Franciaország",
                      "CH": "Svájc", "IT": "Olaszország", "UA": "Ukrajna", "CZ": "Csehország"})
    region_url = "https://download.geonames.org/export/dump/admin1CodesASCII.txt"
    region_data = fetch(region_url)
    manifest["files"]["admin1CodesASCII.txt"] = {"url": region_url, "sha256": hashlib.sha256(region_data).hexdigest(), "bytes": len(region_data)}
    regions = {fields[0]: fields[1] for line in region_data.decode("utf-8").splitlines()
               if len(fields := line.split("\t")) >= 2}
    rows = {}
    for archive in ("cities1000", "HU"):
        url = f"https://download.geonames.org/export/dump/{archive}.zip"
        raw = fetch(url)
        manifest["files"][f"{archive}.zip"] = {"url": url, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}
        with zipfile.ZipFile(io.BytesIO(raw)) as zipped:
            text = zipped.read(f"{archive}.txt").decode("utf-8")
        for line in text.splitlines():
            fields = line.split("\t")
            if len(fields) < 19 or fields[6] != "P" or fields[7] in {"PPLH", "PPLQ", "PPLW"} or not fields[17]:
                continue
            name, country = fields[1], countries.get(fields[8], fields[8])
            label = f"{name}, {country}"
            searchable = normalize(" ".join((name, fields[2], fields[3].replace(",", " "), country)))
            # Preserve full alias boundaries separately from broad substring
            # search. "York" must not become an exact alias for "New York".
            aliases = sorted({normalize(alias) for alias in (name, fields[2], *fields[3].split(",")) if alias.strip()})
            aliases_normal = "\x1f" + "\x1f".join(aliases) + "\x1f"
            rows[fields[0]] = (fields[0], label, fields[8], float(fields[4]), float(fields[5]),
                               fields[17], int(fields[14] or 0), normalize(name), searchable, fields[10], name, aliases_normal)
        print(f"Atlas read: {archive}")
    rows = qualify_duplicate_names(rows, regions, countries)
    temp_db = DATA / "places.new.sqlite"
    if temp_db.exists():
        temp_db.unlink()
    with sqlite3.connect(temp_db) as connection:
        connection.execute("CREATE TABLE places (id TEXT PRIMARY KEY, label TEXT NOT NULL, country TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, timezone TEXT NOT NULL, population INTEGER NOT NULL, name_normal TEXT NOT NULL, searchable TEXT NOT NULL, region TEXT NOT NULL, name TEXT NOT NULL, aliases_normal TEXT NOT NULL)")
        connection.executemany("INSERT INTO places VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows.values())
        connection.execute("CREATE INDEX places_name ON places(name_normal)")
    connection.close()
    temp_db.replace(DATA / "places.sqlite")
    manifest["atlas_places"] = len(rows)
    (DATA / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Offline atlas ready: {len(rows)} places. GeoNames CC BY 4.0.")


if __name__ == "__main__":
    main()
