"""Numerical, historical-clock and place-lookup regression checks.

The J2000 expected values below were captured from the independent official
Swiss Ephemeris Windows swetest.exe 2.10.03, Git revision
c69c14adb7a0f94829586ffd92cd422aacb21e86:
  swetest.exe -b1.1.2000 -utc12:00 -p0123456789tD -eswe
    -edirastro-data -fPlbs -g, -head -house19.04045,47.49835,P
https://github.com/aloistr/swisseph/tree/c69c14adb7a0f94829586ffd92cd422aacb21e86/windows/programs
Legacy public natal references are explicitly identified in their tests.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import astro_engine as engine
from bootstrap_astro import qualify_duplicate_names

SAMPLE = {"date": "2000-01-01", "time": "13:00", "place_id": "3054643", "house_system": "P"}


class CalculationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.chart = engine.calculate_chart(SAMPLE)

    def assert_error(self, code, payload):
        with self.assertRaises(engine.ChartError) as caught:
            engine.calculate_chart(payload)
        self.assertEqual(caught.exception.code, code)
        return caught.exception

    def test_independent_official_swetest_fixture_all_bodies(self):
        # Longitude, latitude, longitude speed, in degrees/degrees/day.
        expected = {
            "sun": (280.3689229, .0002274, 1.0194342),
            "moon": (223.3238009, 5.1707398, 12.0213032),
            "mercury": (271.8892834, -.9948290, 1.5562581),
            "venus": (241.5657934, 2.0663489, 1.2090430),
            "mars": (327.9633057, -1.0677854, .7756740),
            "jupiter": (25.2530873, -1.2621878, .0407612),
            "saturn": (40.3956634, -2.4448547, -.0199451),
            "uranus": (314.8091879, -.6583349, .0503435),
            "neptune": (303.1930134, .2349918, .0355701),
            "pluto": (251.4547794, 10.8552317, .0351529),
            "north_node": (123.9540226, 0, -.0547385),
            "chiron": (251.6176269, 4.0717264, .1143070),
        }
        for planet in self.chart["planets"]:
            if planet["key"] not in expected:
                continue
            for name, value in zip(("longitude", "latitude", "speed"), expected[planet["key"]]):
                with self.subTest(body=planet["key"], coordinate=name):
                    self.assertAlmostEqual(planet[name], value, delta=1e-6)

    def test_independent_official_swetest_houses_and_angles(self):
        expected = [53.4890276, 78.8399413, 98.0748863, 117.4325491, 141.7636539, 179.2024205,
                    233.4890276, 258.8399413, 278.0748863, 297.4325491, 321.7636539, 359.2024205]
        for house, value in zip(self.chart["houses"], expected):
            self.assertAlmostEqual(house["longitude"], value, delta=1e-6)
        self.assertAlmostEqual(self.chart["angles"]["ascendant"]["longitude"], expected[0], delta=1e-6)
        self.assertAlmostEqual(self.chart["angles"]["midheaven"]["longitude"], expected[9], delta=1e-6)

    def test_inherited_astro_com_adele_natal_reference(self):
        # Expected numerical values inherited from an earlier test suite;
        # its cited public source is https://www.astro.com/samples/tde.htm.
        # That source currently presents bot protection, so this is a legacy
        # cross-check, additional to the freshly executed official swetest.
        chart = engine.calculate_chart({"date": "1988-05-05", "time": "08:19", "place_id": "2635608", "house_system": "P"})
        planets = {point["key"]: point for point in chart["planets"]}
        for body, degree in (("sun", 15.0117), ("moon", 26.2267), ("venus", 25.3508)):
            self.assertAlmostEqual(planets[body]["degree"], degree, delta=.05)
        # Atlas Tottenham centre differs from the source 51d35N / 0d04W.
        self.assertAlmostEqual(chart["angles"]["ascendant"]["degree"], 5.5144, delta=.08)
        self.assertAlmostEqual(chart["angles"]["midheaven"]["degree"], 1.0223, delta=.08)
        self.assertEqual(planets["sun"]["house"], 11)
        self.assertEqual(planets["moon"]["house"], 6)

    def test_inherited_astro_com_brittany_petros_reference(self):
        # Same inherited file cites astro.com atxgen for Brittany Petros.
        chart = engine.calculate_chart({"date": "1974-09-09", "time": "00:00", "place_id": "5043439", "house_system": "P"})
        planets = {point["key"]: point for point in chart["planets"]}
        for body, degree in (("sun", 16.1431), ("moon", 12.4650), ("mercury", 4.6672)):
            self.assertAlmostEqual(planets[body]["degree"], degree, delta=.05)
        self.assertAlmostEqual(chart["angles"]["ascendant"]["degree"], 25.5625, delta=.05)
        self.assertAlmostEqual(chart["angles"]["midheaven"]["degree"], 27.3337, delta=.05)
        self.assertEqual(planets["sun"]["house"], 4)
        self.assertEqual(planets["moon"]["house"], 12)
        self.assertEqual(planets["mars"]["house"], 4)  # factual cusp, no 2-degree interpretive shift

    def test_time_conversion_nodes_bounds_and_retrograde(self):
        chart = self.chart
        self.assertEqual(chart["input"]["utc"], "2000-01-01T12:00:00Z")
        self.assertEqual(chart["input"]["utc_offset"], "UTC+01:00")
        self.assertEqual(len(chart["planets"]), 13)
        self.assertEqual(len(chart["houses"]), 12)
        planets = {point["key"]: point for point in chart["planets"]}
        self.assertAlmostEqual((planets["north_node"]["longitude"] + 180) % 360, planets["south_node"]["longitude"], places=6)
        self.assertTrue(planets["saturn"]["retrograde"])
        self.assertFalse(planets["sun"]["retrograde"])
        for point in chart["planets"]:
            self.assertTrue(0 <= point["longitude"] < 360)
            self.assertTrue(0 <= point["degree"] < 30)
            self.assertTrue(0 <= point["sign_index"] < 12)
            self.assertTrue(1 <= point["house"] <= 12)
        self.assertTrue(all(aspect["orb"] <= aspect["orb_limit"] for aspect in chart["aspects"]))

    def test_whole_sign_houses(self):
        chart = engine.calculate_chart({**SAMPLE, "house_system": "W"})
        for house in chart["houses"]:
            self.assertEqual(house["degree"], 0)
        sun = next(point for point in chart["planets"] if point["key"] == "sun")
        self.assertEqual(sun["house"], 9)

    def test_polar_placidus_rejected_whole_sign_works(self):
        payload = {**SAMPLE, "place_id": "2729907"}
        self.assert_error("polar_houses", payload)
        chart = engine.calculate_chart({**payload, "house_system": "W"})
        self.assertEqual(len(chart["houses"]), 12)

    def test_silent_moshier_fallback_is_rejected(self):
        with patch.object(engine.swe, "calc_ut", return_value=((0, 0, 0, 0, 0, 0), engine.swe.FLG_MOSEPH)):
            self.assert_error("ephemeris_fallback", SAMPLE)

    def test_chart_runs_without_network_or_new_user_data_files(self):
        before = {path.relative_to(engine.BASE) for path in engine.BASE.rglob("*") if path.is_file()}
        with patch("socket.socket", side_effect=AssertionError("Network access attempted")):
            chart = engine.calculate_chart(SAMPLE)
        after = {path.relative_to(engine.BASE) for path in engine.BASE.rglob("*") if path.is_file()}
        self.assertEqual(before, after)
        self.assertEqual(len(chart["planets"]), 13)

    def test_bad_input_dates_and_no_timezone_override(self):
        for payload, code in (({**SAMPLE, "date": "1899-12-31"}, "date_range"),
                              ({**SAMPLE, "date": "2100-01-01"}, "date_range"),
                              ({**SAMPLE, "date": "2023-02-29"}, "invalid_datetime"),
                              ({**SAMPLE, "time": "24:00"}, "invalid_datetime"),
                              ({**SAMPLE, "time": "8:00"}, "invalid_time"),
                              ({**SAMPLE, "place_id": "not-a-place"}, "invalid_place"),
                              ({**SAMPLE, "place_id": "999999999999"}, "invalid_place"),
                              ({**SAMPLE, "house_system": "X"}, "invalid_house_system"),
                              ({**SAMPLE, "fold": True}, "invalid_fold"),
                              ({**SAMPLE, "timezone": "UTC"}, "unknown_fields"),
                              ([], "invalid_request")):
            with self.subTest(payload=payload):
                self.assert_error(code, payload)

    def test_search_diacritics_aliases_and_no_sql_wildcards(self):
        self.assertEqual(engine.search_places("budapest")[0]["id"], "3054643")
        self.assertTrue(any(point["label"].startswith("Szeged,") for point in engine.search_places("szeged")))
        self.assertTrue(any(point["label"].startswith("Győr,") for point in engine.search_places("gyor")))
        self.assertEqual(engine.search_places("%_"), [])
        self.assertEqual(engine.search_places("x"), [])
        self.assertTrue(engine.status()["ready"])
        self.assertGreater(engine.status()["atlas"]["places"], 100000)

    def test_duplicate_city_names_are_distinguishable_in_actual_atlas(self):
        matches = engine.search_places("Springfield", limit=30)
        springfields = [place for place in matches if place["country"] == "US" and place["label"].startswith("Springfield,")]
        self.assertGreater(len(springfields), 3)
        self.assertEqual(len({place["label"] for place in springfields}), len(springfields))
        self.assertTrue(any("Illinois" in place["label"] for place in springfields))
        self.assertTrue(any("Massachusetts" in place["label"] for place in springfields))
        self.assertEqual(engine.get_place("3054643")["label"], "Budapest, Magyarország")
        with engine.connect_atlas() as connection:
            duplicates = connection.execute("SELECT label, COUNT(*) FROM places GROUP BY label HAVING COUNT(*) > 1 LIMIT 1").fetchone()
        self.assertIsNone(duplicates)

    def test_full_alias_matches_rank_with_full_primary_names(self):
        for query, place_id in (("Vienna", "2761369"), ("Bécs", "2761369"), ("Becs", "2761369"),
                                ("Wien", "2761369"), ("München", "2867714"), ("Munchen", "2867714"),
                                ("Tokio", "1850147"), ("Warsaw", "756135"), ("Varsó", "756135"),
                                ("Prága", "3067696"), ("York", "2633352"), ("New York", "5128581")):
            with self.subTest(query=query):
                self.assertEqual(engine.search_places(query)[0]["id"], place_id)
        # Full phrase boundaries matter: New York's alias must not match York.
        with engine.connect_atlas() as connection:
            new_york = connection.execute("SELECT aliases_normal FROM places WHERE id = '5128581'").fetchone()[0]
        self.assertNotIn("\x1fyork\x1f", new_york)
        self.assertIn("\x1fnew york\x1f", new_york)

    def test_duplicate_label_fallback_uses_coordinates_then_stable_id(self):
        def row(place_id, name, region, lat, lon):
            return (place_id, f"{name}, Egyesült Államok", "US", lat, lon, "America/Chicago", 1,
                    engine.normalize(name), engine.normalize(name), region, name)
        rows = {str(index): item for index, item in enumerate([
            row("0", "Sameville", "IL", 40, -90), row("1", "Sameville", "IL", 41, -90),
            row("2", "Sameville", "IL", 41, -90), row("3", "Uniquetown", "IL", 42, -90)])}
        qualified = qualify_duplicate_names(rows, {"US.IL": "Illinois"}, {"US": "Egyesült Államok"})
        labels = [item[1] for item in qualified.values()]
        self.assertEqual(len(set(labels)), 4)
        self.assertIn("40.00000°", qualified["0"][1])
        self.assertIn("GeoNames 1", qualified["1"][1])
        self.assertIn("GeoNames 2", qualified["2"][1])
        self.assertEqual(qualified["3"][1], "Uniquetown, Egyesült Államok")


class HistoricalTimeTests(unittest.TestCase):
    def test_dst_gap(self):
        with self.assertRaises(engine.ChartError) as caught:
            engine.resolve_local_time(datetime(2024, 3, 31, 2, 30), "Europe/Budapest")
        self.assertEqual(caught.exception.code, "nonexistent_time")

    def test_dst_fold_requires_choice_and_changes_utc(self):
        wall = datetime(2024, 10, 27, 2, 30)
        with self.assertRaises(engine.ChartError) as caught:
            engine.resolve_local_time(wall, "Europe/Budapest")
        self.assertEqual(caught.exception.code, "ambiguous_time")
        self.assertEqual(len(caught.exception.details["choices"]), 2)
        first = engine.resolve_local_time(wall, "Europe/Budapest", 0).astimezone(timezone.utc)
        second = engine.resolve_local_time(wall, "Europe/Budapest", 1).astimezone(timezone.utc)
        self.assertEqual((second - first).total_seconds(), 3600)
        self.assertEqual(first.hour, 0)
        self.assertEqual(second.hour, 1)

    def test_noninteger_utc_offset(self):
        chart = engine.calculate_chart({**SAMPLE, "time": "12:00", "place_id": "1283240"})
        self.assertEqual(chart["input"]["utc"], "2000-01-01T06:15:00Z")
        self.assertEqual(chart["input"]["utc_offset"], "UTC+05:45")

    def test_historical_timezone_changes_not_current_offset(self):
        old = engine.resolve_local_time(datetime(1980, 1, 1, 12), "Asia/Kathmandu")
        new = engine.resolve_local_time(datetime(2000, 1, 1, 12), "Asia/Kathmandu")
        self.assertEqual(old.utcoffset().total_seconds(), 5.5 * 3600)
        self.assertEqual(new.utcoffset().total_seconds(), 5.75 * 3600)

    def test_skipped_calendar_day_is_rejected(self):
        with self.assertRaises(engine.ChartError) as caught:
            engine.resolve_local_time(datetime(2011, 12, 30, 12), "Pacific/Apia")
        self.assertEqual(caught.exception.code, "nonexistent_time")


if __name__ == "__main__":
    unittest.main()
