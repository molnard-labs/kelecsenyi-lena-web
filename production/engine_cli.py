# SPDX-License-Identifier: AGPL-3.0-only
"""Fixed JSON bridge for the production Swiss Ephemeris runtime.

Invoke with /usr/bin/python3 -I /fixed/private/runtime/engine_cli.py. The runtime
contains an unchanged astro_engine.py sibling, astro-data/, and vendor/ holding
the pinned Python distributions. No request can choose a path or executable.
"""
from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import importlib
import json
from pathlib import Path
import sys
import zoneinfo

# The packaged runtime is immutable; validation rejects unmanifested cache files.
sys.dont_write_bytecode = True
BASE = Path(__file__).resolve().parent
MAX_INPUT_BYTES = 4096


class _DiscardOutput:
    """Discard incidental library output without retaining or logging it."""

    def write(self, text):
        return len(text)

    def flush(self):
        pass


def _error(status: int, code: str, message: str) -> dict:
    return {"status": status, "payload": {"error": {"code": code, "message": message}}}


def load_engine():
    """Load only the fixed runtime tree, also under Python's isolated mode."""
    vendor = BASE / "vendor"
    sys.path[:0] = [str(vendor), str(BASE)]
    zoneinfo.reset_tzpath([str(vendor / "tzdata" / "zoneinfo")])
    return importlib.import_module("astro_engine")


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON member")
        result[key] = value
    return result


def _reject_constant(value):
    raise ValueError("Non-finite JSON number")


def process_request(raw: bytes, *, engine=None) -> dict:
    """Return {status, payload}; engine injection is an internal test seam only."""
    if not isinstance(raw, bytes):
        return _error(400, "invalid_json", "Érvénytelen JSON kérés.")
    if len(raw) > MAX_INPUT_BYTES:
        return _error(413, "request_too_large", "A kérés mérete nem megfelelő.")
    try:
        request = json.loads(raw.decode("utf-8"), object_pairs_hook=_unique_object, parse_constant=_reject_constant)
    except (UnicodeDecodeError, ValueError, RecursionError):
        return _error(400, "invalid_json", "Érvénytelen JSON kérés.")
    if not isinstance(request, dict) or set(request) != {"action", "payload"}:
        return _error(400, "invalid_request", "Érvénytelen kérés.")
    action, payload = request["action"], request["payload"]
    if not isinstance(action, str) or action not in {"status", "places", "chart"}:
        return _error(400, "invalid_action", "Nem támogatott művelet.")
    if not isinstance(payload, dict):
        return _error(400, "invalid_request", "JSON objektumot vár a kérés.")
    if action == "status" and payload:
        return _error(400, "invalid_request", "Az állapotkérés nem fogad további adatot.")
    if action == "places" and (set(payload) != {"q"} or not isinstance(payload["q"], str) or len(payload["q"]) > 120):
        return _error(400, "invalid_query", "A településnév legfeljebb 120 karakter lehet.")

    # Library diagnostics never become part of stdout, stderr, or a log.
    discard = _DiscardOutput()
    with redirect_stdout(discard), redirect_stderr(discard):
        if engine is None:
            try:
                engine = load_engine()
            except Exception:
                return _error(503, "setup_required", "A számítási környezet még nem érhető el.")
        try:
            if action == "status":
                result = engine.status()
            elif action == "places":
                result = {"places": engine.search_places(payload["q"], limit=12)}
            else:
                result = engine.calculate_chart(payload)
            # Catch invalid/unserializable native results before emitting a reply.
            json.dumps(result, ensure_ascii=False, allow_nan=False)
            return {"status": 200, "payload": result}
        except engine.ChartError as error:
            status = 503 if error.code == "setup_required" else (400 if action == "places" else 422)
            return {"status": status, "payload": error.as_dict()}
        except Exception:
            return _error(500, "calculation_error", "A számítás nem sikerült. Kérlek, próbáld újra.")


def main(*, stdin=None, stdout=None, engine=None) -> None:
    source = sys.stdin.buffer if stdin is None else stdin
    target = sys.stdout if stdout is None else stdout
    try:
        raw = source.read(MAX_INPUT_BYTES + 1)
        result = process_request(raw, engine=engine)
    except Exception:
        result = _error(500, "calculation_error", "A számítás nem sikerült. Kérlek, próbáld újra.")
    try:
        target.write(json.dumps(result, ensure_ascii=True, allow_nan=False, separators=(",", ":")) + "\n")
        target.flush()
    except (BrokenPipeError, OSError):
        # The fixed caller may terminate a timed-out request; do not log it.
        pass


if __name__ == "__main__":
    main()
