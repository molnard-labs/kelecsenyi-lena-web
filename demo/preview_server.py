"""Loopback-only local preview. No birth data, query strings or requests logged."""
from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from astro_engine import ChartError, calculate_chart, search_places, status
from source_bundle import build_source_archive

BASE = Path(__file__).resolve().parent
PUBLIC_EXTENSIONS = {".html", ".css", ".js", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".mp4", ".pdf", ".avif"}
PRIVATE_DIRS = {"astro-data", "tests", "node_modules", "__pycache__", "third-party-src"}


class PreviewHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "LenaLocalPreview/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE), **kwargs)

    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def valid_host(self):
        port = self.server.server_port
        return self.headers.get("Host") in {f"127.0.0.1:{port}", f"localhost:{port}"}

    def json_response(self, payload, code=200):
        raw = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(raw)

    def error_response(self, code, message, status_code=400):
        self.json_response({"error": {"code": code, "message": message}}, status_code)

    def allowed_path(self):
        decoded = unquote(urlsplit(self.path).path)
        if "\\" in decoded or "\x00" in decoded:
            return False
        parts = Path(decoded.lstrip("/")).parts
        if any(part.startswith(".") or part in PRIVATE_DIRS for part in parts):
            return False
        candidate = (BASE / decoded.lstrip("/")).resolve()
        if not candidate.is_relative_to(BASE):
            return False
        if candidate.is_dir():
            return candidate in {BASE, BASE / "gyors-elemzes"} and (candidate / "index.html").is_file()
        return candidate.suffix.lower() in PUBLIC_EXTENSIONS and candidate.is_file()

    def source_response(self):
        try:
            raw, digest = build_source_archive()
        except (ValueError, OSError, KeyError):
            return self.error_response("source_unavailable", "A forráscsomag nem teljes; ellenőrizd a helyi fájlokat.", 503)
        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Disposition", 'attachment; filename="kelecsenyi-lena-agpl-source.zip"')
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("ETag", '"' + digest + '"')
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(raw)

    def legal_response(self, filename):
        # Callers choose from fixed route names, never from request path input.
        try:
            raw = (BASE.parent / filename).read_bytes()
        except OSError:
            return self.error_response("license_unavailable", "A licencfájl nem található.", 503)
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(raw)

    def do_GET(self):
        if not self.valid_host():
            return self.error_response("invalid_host", "Csak helyi elérés engedélyezett.", 403)
        parsed = urlsplit(self.path)
        if parsed.path == "/source.zip":
            return self.source_response()
        if parsed.path in {"/license.txt", "/third-party-notices.txt"}:
            return self.legal_response("LICENSE" if parsed.path == "/license.txt" else "THIRD_PARTY_NOTICES.md")
        if parsed.path == "/api/status":
            return self.json_response({**status(), "preview_app": "lena-agpl-demo"})
        if parsed.path == "/api/places":
            try:
                query = parse_qs(parsed.query, max_num_fields=4).get("q", [""])[0]
                return self.json_response({"places": search_places(query)})
            except (ChartError, ValueError) as error:
                if isinstance(error, ChartError):
                    return self.json_response(error.as_dict(), 400)
                return self.error_response("invalid_query", "Érvénytelen keresési kérés.")
        if parsed.path.startswith("/api/"):
            return self.error_response("not_found", "Nincs ilyen végpont.", 404)
        if not self.allowed_path():
            return self.error_response("not_found", "A fájl nem érhető el.", 404)
        super().do_GET()

    def do_HEAD(self):
        if self.valid_host() and urlsplit(self.path).path == "/source.zip":
            return self.source_response()
        if self.valid_host() and urlsplit(self.path).path in {"/license.txt", "/third-party-notices.txt"}:
            return self.legal_response("LICENSE" if urlsplit(self.path).path == "/license.txt" else "THIRD_PARTY_NOTICES.md")
        if not self.valid_host() or not self.allowed_path():
            return self.error_response("not_found", "A fájl nem érhető el.", 404)
        super().do_HEAD()

    def do_POST(self):
        self.close_connection = True
        if not self.valid_host():
            return self.error_response("invalid_host", "Csak helyi elérés engedélyezett.", 403)
        origin = self.headers.get("Origin")
        if origin != f"http://{self.headers.get('Host')}":
            return self.error_response("invalid_origin", "A kérésnek erről a helyi oldalról kell érkeznie.", 403)
        if urlsplit(self.path).path != "/api/chart":
            return self.error_response("not_found", "Nincs ilyen végpont.", 404)
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            return self.error_response("invalid_content_type", "JSON kérés szükséges.", 415)
        lengths = self.headers.get_all("Content-Length", [])
        if len(lengths) != 1 or self.headers.get("Transfer-Encoding"):
            return self.error_response("invalid_length", "Egyértelmű kérésméret szükséges.", 411)
        try:
            length = int(lengths[0])
        except ValueError:
            return self.error_response("invalid_length", "Érvénytelen kérésméret.")
        if not 1 <= length <= 4096:
            return self.error_response("request_too_large", "A kérés mérete nem megfelelő.", 413)
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return self.error_response("invalid_json", "Érvénytelen JSON kérés.")
        try:
            return self.json_response(calculate_chart(payload))
        except ChartError as error:
            return self.json_response(error.as_dict(), 422 if error.code != "setup_required" else 503)
        except Exception:
            # Never echo submitted content, exception text, or birth details.
            return self.error_response("calculation_error", "A számítás nem sikerült. Ellenőrizd az adatokat.", 500)


def main():
    parser = argparse.ArgumentParser(description="Local-only astrology preview")
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), PreviewHandler)
    server.daemon_threads = True
    print(f"Local preview: http://127.0.0.1:{args.port}/ (offline calculations; request logging disabled)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
