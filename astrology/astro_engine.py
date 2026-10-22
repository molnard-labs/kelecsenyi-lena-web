"""Offline tropical, apparent, geocentric Swiss Ephemeris chart calculations.

Astronomical positions are calculations; astrological interpretations are not
scientifically validated predictions. This module contains no interpretation,
network access, user-data persistence, or Griga Zsuzsa-derived book content.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from contextlib import closing
from importlib.metadata import version
from pathlib import Path
import re
import sqlite3
from threading import RLock
import unicodedata
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import swisseph as swe

BASE = Path(__file__).resolve().parent
DATA = BASE / "astro-data"
LOCK = RLock()
SIGNS = ("Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak")
BODIES = (("sun", "Nap", swe.SUN), ("moon", "Hold", swe.MOON), ("mercury", "Merkúr", swe.MERCURY),
          ("venus", "Vénusz", swe.VENUS), ("mars", "Mars", swe.MARS), ("jupiter", "Jupiter", swe.JUPITER),
          ("saturn", "Szaturnusz", swe.SATURN), ("uranus", "Uránusz", swe.URANUS),
          ("neptune", "Neptunusz", swe.NEPTUNE), ("pluto", "Plútó", swe.PLUTO),
          ("north_node", "Felszálló holdcsomópont", swe.TRUE_NODE), ("chiron", "Chiron", swe.CHIRON))
ASPECTS = ((0, "Együttállás", 7), (60, "Szextil", 4), (90, "Kvadrát", 6),
           (120, "Trigon", 6), (180, "Szembenállás", 7))


class ChartError(ValueError):
    def __init__(self, code: str, message: str, **details):
        super().__init__(message)
        self.code, self.message, self.details = code, message, details

    def as_dict(self):
        return {"error": {"code": self.code, "message": self.message, **self.details}}


def normalize(value: str) -> str:
    return " ".join("".join(c for c in unicodedata.normalize("NFKD", value.casefold())
                            if not unicodedata.combining(c)).split())


def connect_atlas():
    if not (DATA / "places.sqlite").exists():
        raise ChartError("setup_required", "A helyi településadatbázis még nincs előkészítve.")
    connection = sqlite3.connect(f"{(DATA / 'places.sqlite').as_uri()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def public_place(row) -> dict:
    return {key: row[key] for key in ("id", "label", "country", "latitude", "longitude", "timezone")}


def search_places(query: str, limit: int = 12) -> list:
    if not isinstance(query, str) or len(query) > 120:
        raise ChartError("invalid_query", "A településnév legfeljebb 120 karakter lehet.")
    value = normalize(query)
    if len(value) < 2:
        return []
    # Literal substring matching: SQL LIKE wildcard characters have no special meaning.
    with closing(connect_atlas()) as connection:
        rows = connection.execute("""SELECT * FROM places WHERE instr(searchable, ?) > 0
          ORDER BY CASE WHEN name_normal = ? OR instr(aliases_normal, ?) > 0 THEN 0 WHEN instr(name_normal, ?) = 1 THEN 1
                        WHEN instr(searchable, ?) = 1 THEN 2 ELSE 3 END,
                   population DESC, CASE WHEN country = 'HU' THEN 0 ELSE 1 END, label ASC LIMIT ?""",
                                  (value, value, f"\x1f{value}\x1f", value, value, min(30, max(1, limit)))).fetchall()
    return [public_place(row) for row in rows]


def get_place(place_id) -> dict:
    if not isinstance(place_id, str) or not re.fullmatch(r"[0-9]{1,12}", place_id):
        raise ChartError("invalid_place", "Válassz egy települést a találati listából.")
    with closing(connect_atlas()) as connection:
        row = connection.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    if row is None:
        raise ChartError("invalid_place", "A kiválasztott település nem található a helyi adatbázisban.")
    return public_place(row)


def parse_birth(date_text, time_text) -> datetime:
    if not isinstance(date_text, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_text):
        raise ChartError("invalid_date", "Add meg a születési dátumot ÉÉÉÉ-HH-NN formában.")
    if not isinstance(time_text, str) or not re.fullmatch(r"\d{2}:\d{2}", time_text):
        raise ChartError("invalid_time", "Add meg a születési időt ÓÓ:PP formában.")
    try:
        result = datetime.strptime(f"{date_text} {time_text}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise ChartError("invalid_datetime", "Ez a dátum vagy időpont nem érvényes.") from None
    if result.date() < date(1900, 1, 1) or result.date() > date.today():
        raise ChartError("date_range", "1900. január 1. és a mai nap közötti születési dátum adható meg.")
    return result


def offset_label(offset) -> str:
    seconds = int(offset.total_seconds())
    prefix = "+" if seconds >= 0 else "−"
    hours, rem = divmod(abs(seconds), 3600)
    minutes, seconds = divmod(rem, 60)
    return f"UTC{prefix}{hours:02d}:{minutes:02d}" + (f":{seconds:02d}" if seconds else "")


def resolve_local_time(wall: datetime, timezone_id: str, fold=None) -> datetime:
    try:
        zone = ZoneInfo(timezone_id)
    except (ZoneInfoNotFoundError, ValueError):
        raise ChartError("timezone_unavailable", "A település történeti időzónája nem elérhető.") from None
    if fold is not None and (type(fold) is not int or fold not in (0, 1)):
        raise ChartError("invalid_fold", "Az időpontválasztás értéke 0 vagy 1 lehet.")
    choices = []
    for candidate_fold in (0, 1):
        local = wall.replace(tzinfo=zone, fold=candidate_fold)
        utc = local.astimezone(timezone.utc)
        roundtrip = utc.astimezone(zone)
        if roundtrip.replace(tzinfo=None) == wall and all(utc != item[1] for item in choices):
            choices.append((local, utc))
    if not choices:
        raise ChartError("nonexistent_time", "Ez a helyi időpont az óraátállítás miatt nem létezett. Ellenőrizd a születési időt.")
    if len(choices) > 1:
        if fold is None:
            raise ChartError("ambiguous_time", "Az óra visszaállítása miatt ez az időpont kétszer fordult elő. Válaszd ki a megfelelő eltérést.",
                             choices=[{"fold": local.fold, "label": f"{offset_label(local.utcoffset())} ({local.tzname()})", "utc": utc.isoformat().replace("+00:00", "Z")}
                                      for local, utc in choices])
        return next(local for local, utc in choices if local.fold == fold)
    return choices[0][0]


def zodiac(longitude: float) -> dict:
    longitude = longitude % 360.0
    index = int(longitude // 30)
    return {"longitude": round(longitude, 8), "sign": SIGNS[index], "sign_index": index, "degree": round(longitude % 30, 8)}


def cusp_house(longitude: float, cusps: tuple) -> int:
    """Ecliptic-longitude cusp placement; latitude is deliberately not used."""
    for index, cusp in enumerate(cusps):
        width = (cusps[(index + 1) % 12] - cusp) % 360
        if (longitude - cusp) % 360 < width:
            return index + 1
    return 1


def calculate_chart(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ChartError("invalid_request", "JSON objektumot vár a számítás.")
    unknown = set(payload) - {"date", "time", "place_id", "house_system", "fold"}
    if unknown:
        raise ChartError("unknown_fields", "A kérés nem támogatott mezőt tartalmaz.")
    wall = parse_birth(payload.get("date"), payload.get("time"))
    place = get_place(payload.get("place_id"))
    house_system = payload.get("house_system", "P")
    if house_system not in ("P", "W"):
        raise ChartError("invalid_house_system", "Placidus (P) vagy egészjegyes (W) házrendszer választható.")
    local = resolve_local_time(wall, place["timezone"], payload.get("fold"))
    utc = local.astimezone(timezone.utc)
    missing = [name for name in ("sepl_18.se1", "semo_18.se1", "seas_18.se1") if not (DATA / name).is_file()]
    if missing:
        raise ChartError("setup_required", "A helyi efemeridaadatok még nincsenek előkészítve.")
    planets = []
    # Swiss Ephemeris uses global configuration; calculations run under one lock.
    with LOCK:
        swe.set_ephe_path(str(DATA))
        # Conversion accounts for UTC / UT1 and leap seconds through Swiss Ephemeris.
        jd_et, jd_ut = swe.utc_to_jd(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second, swe.GREG_CAL)
        try:
            cusps, ascmc = swe.houses_ex(jd_ut, place["latitude"], place["longitude"], house_system.encode("ascii"), 0)
        except swe.Error:
            raise ChartError("polar_houses", "Ezen a földrajzi szélességen a Placidus-házak nem számíthatók. Válaszd az egészjegyes házrendszert.", suggested_house_system="W") from None
        for key, name, body in BODIES:
            try:
                values, flags = swe.calc_ut(jd_ut, body, swe.FLG_SWIEPH | swe.FLG_SPEED)
            except swe.Error:
                raise ChartError("ephemeris_error", "A helyi efemerida nem tudta elvégezni a számítást.") from None
            if not (flags & swe.FLG_SWIEPH) or flags & swe.FLG_MOSEPH:
                raise ChartError("ephemeris_fallback", "A pontos helyi efemerida hiányzik. A program nem vált át másik számítási módszerre.")
            planets.append({"key": key, "name": name, **zodiac(values[0]), "latitude": round(values[1], 8),
                            "speed": round(values[3], 8), "retrograde": values[3] < 0,
                            "house": cusp_house(values[0], cusps)})
        north = next(item for item in planets if item["key"] == "north_node")
        south_lon = (north["longitude"] + 180) % 360
        planets.append({"key": "south_node", "name": "Leszálló holdcsomópont", **zodiac(south_lon),
                        "latitude": round(-north["latitude"], 8), "speed": north["speed"],
                        "retrograde": north["retrograde"], "house": cusp_house(south_lon, cusps)})
    # Major aspects between ten planets only; nodes and Chiron are separate points.
    aspects = []
    for index, first in enumerate(planets[:10]):
        for second in planets[index + 1:10]:
            separation = abs((first["longitude"] - second["longitude"] + 180) % 360 - 180)
            for angle, name, limit in ASPECTS:
                orb = abs(separation - angle)
                if orb <= limit:
                    aspects.append({"a": first["key"], "b": second["key"], "name": name, "angle": angle,
                                    "orb": round(orb, 6), "orb_limit": limit})
                    break
    return {"input": {"date": payload["date"], "time": payload["time"], "place": place,
                       "timezone": place["timezone"], "utc": utc.isoformat().replace("+00:00", "Z"),
                       "utc_offset": offset_label(local.utcoffset()), "fold": local.fold,
                       "house_system": house_system, "house_system_label": "Placidus" if house_system == "P" else "Egészjegyes"},
            "engine": {"name": "Swiss Ephemeris", "version": swe.version, "python_package": version("pyswisseph"),
                       "ephemeris": "Swiss Ephemeris data files (DE441)", "coordinates": "geocentric tropical apparent ecliptic",
                       "node": "true", "house_placement": "ecliptic_longitude_cusps", "timezone_data": f"IANA tzdata {version('tzdata')}"},
            "julian_day_ut": round(jd_ut, 8), "planets": planets,
            "angles": {"ascendant": zodiac(ascmc[0]), "midheaven": zodiac(ascmc[1])},
            "houses": [{"number": index + 1, **zodiac(cusp)} for index, cusp in enumerate(cusps)],
            "aspects": sorted(aspects, key=lambda item: item["orb"]),
            "warnings": (["A történeti időzónák, különösen 1970 előtt, helyi forrásból történő ellenőrzést igényelhetnek."]
                         if wall.year < 1970 else [])}


def status() -> dict:
    try:
        with closing(connect_atlas()) as connection:
            count = connection.execute("SELECT COUNT(*) FROM places").fetchone()[0]
        ready = all((DATA / name).is_file() for name in ("sepl_18.se1", "semo_18.se1", "seas_18.se1"))
    except (ChartError, sqlite3.Error):
        count, ready = 0, False
    return {"ready": ready, "offline": True, "engine": {"name": "Swiss Ephemeris", "version": swe.version},
            "atlas": {"places": count, "source": "GeoNames", "license": "CC BY 4.0"},
            "date_range": {"min": "1900-01-01", "max": date.today().isoformat()}}
