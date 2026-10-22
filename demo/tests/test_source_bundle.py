"""Verify that the AGPL source offer is complete and excludes runtime/private data."""
from __future__ import annotations

import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from source_bundle import build_source_archive, source_files

DEMO = Path(__file__).resolve().parents[1]


class SourceBundleTests(unittest.TestCase):
    def test_current_allowlist_contains_application_dependencies_and_licenses(self):
        files = dict(source_files())
        for name in ("LICENSE", "README.md", "THIRD_PARTY_NOTICES.md", "demo/source-files.json",
                     "demo/astro_engine.py", "demo/preview_server.py", "demo/source_bundle.py",
                     "demo/astro.js", "demo/astro-datetime.js", "demo/astro-wheel.js",
                     "demo/bootstrap_astro.py", "demo/build-vector-preview.py", "demo/original-page.html",
                     "demo/original-styles.json", "demo/requirements-astro.txt", "demo/licenses.html",
                     "demo/third-party-src/pyswisseph-2.10.3.2.tar.gz"):
            self.assertIn(name, files)
        self.assertTrue(any(name.startswith("licenses/") for name in files))
        self.assertTrue(any(name.endswith("-OFL.txt") for name in files))

    def test_archive_contains_only_allowlisted_files_and_is_deterministic(self):
        data, digest = build_source_archive()
        second, second_digest = build_source_archive()
        self.assertEqual(digest, second_digest)
        self.assertEqual(data, second)
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            names = {name.removeprefix("kelecsenyi-lena-web/") for name in archive.namelist()}
            self.assertEqual(names, {name for name, _ in source_files()})
            self.assertEqual(archive.read("kelecsenyi-lena-web/demo/astro_engine.py"),
                             dict(source_files())["demo/astro_engine.py"].read_bytes())

    def test_unsafe_paths_fail_closed(self):
        with tempfile.TemporaryDirectory(prefix="source-test-", dir=DEMO) as directory:
            scratch = Path(directory)
            root = scratch / "project"
            root.mkdir()
            manifest = scratch / "manifest.json"
            outside = scratch / "outside.txt"
            outside.write_text("synthetic test fixture", encoding="utf-8")
            fixtures = ("demo/.env", "demo/astro-data/places.sqlite", ".git/config",
                        "wordpress/.env", "demo/record.log", "demo/astro.js", "demo/.gitignore")
            for name in fixtures:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("synthetic test fixture", encoding="utf-8")
            for name in ("../outside.txt", str(outside).replace("\\", "/"), "demo/.env", "demo/astro-data/places.sqlite",
                         ".git/config", "wordpress/.env", "demo/record.log", "demo\\astro.js"):
                with self.subTest(path=name):
                    manifest.write_text(json.dumps({"files": [name]}), encoding="utf-8")
                    with self.assertRaises(ValueError):
                        source_files(root, manifest)

    def test_only_the_explicit_root_gitignore_exception_is_permitted(self):
        with tempfile.TemporaryDirectory(prefix="source-test-", dir=DEMO) as directory:
            root = Path(directory)
            (root / ".gitignore").write_text("/runtime/\n", encoding="utf-8")
            (root / "demo").mkdir()
            (root / "demo/.gitignore").write_text("secret\n", encoding="utf-8")
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"files": [".gitignore"]}), encoding="utf-8")
            self.assertEqual(source_files(root, manifest)[0][0], ".gitignore")
            manifest.write_text(json.dumps({"files": ["demo/.gitignore"]}), encoding="utf-8")
            with self.assertRaises(ValueError):
                source_files(root, manifest)

    def test_missing_required_source_cannot_be_silently_omitted(self):
        with tempfile.TemporaryDirectory(prefix="source-test-", dir=DEMO) as directory:
            root = Path(directory)
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"files": ["missing.py"]}), encoding="utf-8")
            with self.assertRaises(ValueError):
                build_source_archive(root, manifest)


if __name__ == "__main__":
    unittest.main()
