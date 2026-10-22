# SPDX-License-Identifier: AGPL-3.0-only
"""Production bridge contract and isolated-runtime regression checks."""
from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("lena_production_cli_test", ROOT / "production" / "engine_cli.py")
cli = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(cli)
ENGINE_SPEC = importlib.util.spec_from_file_location("lena_reference_engine_test", ROOT / "demo" / "astro_engine.py")
engine = importlib.util.module_from_spec(ENGINE_SPEC)
ENGINE_SPEC.loader.exec_module(engine)
SAMPLE = {"date": "2000-01-01", "time": "13:00", "place_id": "3054643", "house_system": "P"}


def request(action, payload):
    return json.dumps({"action": action, "payload": payload}, ensure_ascii=False).encode("utf-8")


class EngineBridgeTests(unittest.TestCase):
    def test_status_keeps_frontend_shape(self):
        response = cli.process_request(request("status", {}), engine=engine)
        self.assertEqual(response["status"], 200)
        self.assertTrue(response["payload"]["ready"])
        self.assertTrue(response["payload"]["offline"])
        self.assertEqual(response["payload"]["date_range"]["min"], "1900-01-01")

    def test_places_are_wrapped_and_fixed_limit(self):
        response = cli.process_request(request("places", {"q": "Budapest"}), engine=engine)
        self.assertEqual(response["status"], 200)
        self.assertLessEqual(len(response["payload"]["places"]), 12)
        self.assertEqual(response["payload"]["places"][0]["id"], "3054643")

    def test_chart_matches_existing_numerical_engine(self):
        response = cli.process_request(request("chart", SAMPLE), engine=engine)
        self.assertEqual(response["status"], 200)
        self.assertAlmostEqual(response["payload"]["planets"][0]["longitude"], 280.3689229, delta=1e-6)
        self.assertEqual(len(response["payload"]["houses"]), 12)

    def test_dst_choices_preserved(self):
        payload = {**SAMPLE, "date": "2024-10-27", "time": "02:30"}
        response = cli.process_request(request("chart", payload), engine=engine)
        self.assertEqual(response["status"], 422)
        error = response["payload"]["error"]
        self.assertEqual(error["code"], "ambiguous_time")
        self.assertEqual(len(error["choices"]), 2)

    def test_engine_validation_preserved(self):
        response = cli.process_request(request("chart", {**SAMPLE, "extra": "rejected"}), engine=engine)
        self.assertEqual(response["status"], 422)
        self.assertEqual(response["payload"]["error"]["code"], "unknown_fields")

    def test_request_limit_checked_before_engine_import(self):
        with patch.object(cli, "load_engine") as loader:
            response = cli.process_request(b" " * (cli.MAX_INPUT_BYTES + 1))
        loader.assert_not_called()
        self.assertEqual(response["status"], 413)

    def test_invalid_json_and_nonstandard_values_rejected(self):
        for raw in (b"", b"\xff", b"{", b'{"action":"status","payload":NaN}', b'{"action":"status","action":"chart","payload":{}}'):
            with self.subTest(raw=raw):
                self.assertEqual(cli.process_request(raw, engine=engine)["payload"]["error"]["code"], "invalid_json")

    def test_only_exact_envelope_and_fixed_actions(self):
        for payload in ([], {"action": "status"}, {"action": "status", "payload": {}, "path": "/elsewhere"}, {"action": [], "payload": {}}, {"action": "exec", "payload": {}}, {"action": "chart", "payload": []}, {"action": "status", "payload": {"q": "ignored"}}):
            with self.subTest(payload=payload):
                self.assertEqual(cli.process_request(json.dumps(payload).encode(), engine=engine)["status"], 400)

    def test_places_query_bounds_and_no_caller_limit(self):
        for payload in ({}, {"q": 4}, {"q": "x" * 121}, {"q": "Budapest", "limit": 999}):
            with self.subTest(payload=payload):
                response = cli.process_request(request("places", payload), engine=engine)
                self.assertEqual(response["status"], 400)
                self.assertEqual(response["payload"]["error"]["code"], "invalid_query")

    def test_setup_errors_use_service_unavailable(self):
        def missing(*args, **kwargs):
            raise engine.ChartError("setup_required", "Az adatok még nem érhetők el.")
        stub = SimpleNamespace(ChartError=engine.ChartError, search_places=missing)
        response = cli.process_request(request("places", {"q": "Budapest"}), engine=stub)
        self.assertEqual(response["status"], 503)
        self.assertEqual(response["payload"]["error"]["code"], "setup_required")

    def test_unknown_failure_and_library_output_do_not_leak(self):
        secret = "PRIVATE_BIRTH_DATA_AND_INTERNAL_PATH"
        def fail(payload):
            print(secret)
            print(secret, file=sys.stderr)
            raise RuntimeError(secret)
        stub = SimpleNamespace(ChartError=engine.ChartError, calculate_chart=fail)
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            response = cli.process_request(request("chart", SAMPLE), engine=stub)
        self.assertEqual(response["status"], 500)
        self.assertNotIn(secret, json.dumps(response))
        self.assertEqual((out.getvalue(), err.getvalue()), ("", ""))

    def test_import_failure_has_generic_setup_message(self):
        with patch.object(cli, "load_engine", side_effect=ImportError("PRIVATE_PATH")):
            response = cli.process_request(request("status", {}))
        self.assertEqual(response["status"], 503)
        self.assertNotIn("PRIVATE_PATH", json.dumps(response))

    def test_unserializable_result_has_generic_failure(self):
        stub = SimpleNamespace(ChartError=engine.ChartError, status=lambda: {"value": float("nan")})
        self.assertEqual(cli.process_request(request("status", {}), engine=stub)["status"], 500)

    def test_main_bounds_actual_stream_read_and_emits_one_json(self):
        stream = io.BytesIO(b" " * 9000)
        output = io.StringIO()
        cli.main(stdin=stream, stdout=output, engine=engine)
        self.assertEqual(stream.tell(), 4097)
        self.assertEqual(json.loads(output.getvalue())["status"], 413)
        self.assertEqual(len(output.getvalue().splitlines()), 1)

    def test_isolated_process_loads_sibling_and_ignores_pythonpath(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent) as directory:
            runtime = Path(directory)
            shutil.copyfile(ROOT / "production" / "engine_cli.py", runtime / "engine_cli.py")
            (runtime / "astro_engine.py").write_text("class ChartError(ValueError): pass\ndef status(): return {'ready': True, 'origin': 'fixed-sibling'}\n", encoding="utf-8")
            decoy = runtime / "decoy"
            decoy.mkdir()
            (decoy / "astro_engine.py").write_text("raise RuntimeError('DECOY_MUST_NOT_LOAD')\n", encoding="utf-8")
            completed = subprocess.run([sys.executable, "-I", str(runtime / "engine_cli.py")], input=request("status", {}), stdout=subprocess.PIPE, stderr=subprocess.PIPE, env={**os.environ, "PYTHONPATH": str(decoy)}, cwd=decoy, timeout=5, check=True)
            self.assertEqual(list(runtime.rglob("__pycache__")), [])
        self.assertEqual(completed.stderr, b"")
        self.assertEqual(json.loads(completed.stdout)["payload"], {"ready": True, "origin": "fixed-sibling"})

    def test_runtime_sets_explicit_vendor_and_timezone_paths(self):
        old_path = list(sys.path)
        try:
            with patch.object(cli.zoneinfo, "reset_tzpath") as reset, patch.object(cli.importlib, "import_module", return_value=engine):
                self.assertIs(cli.load_engine(), engine)
                self.assertEqual(sys.path[:2], [str(cli.BASE / "vendor"), str(cli.BASE)])
                reset.assert_called_once_with([str(cli.BASE / "vendor" / "tzdata" / "zoneinfo")])
        finally:
            sys.path[:] = old_path


if __name__ == "__main__":
    unittest.main()
