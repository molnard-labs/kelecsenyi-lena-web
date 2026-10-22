"""Check source-offer completeness and exclusion of private/runtime artifacts."""
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

SCRATCH_PARENT = Path(__file__).resolve().parents[1]


class SourceBundleTests(unittest.TestCase):
    def test_manifest_contains_current_production_sources_and_licenses(self):
        files = dict(source_files())
        for name in ("LICENSE", "README.md", "THIRD_PARTY_NOTICES.md", "production/source-files.json",
                     "production/source_bundle.py", "production/build-release.py", "production/engine_cli.py",
                     "astrology/astro_engine.py", "astrology/astro.js", "astrology/astro-datetime.js",
                     "astrology/astro-wheel.js", "astrology/bootstrap_astro.py", "astrology/requirements-astro.txt",
                     "astrology/licenses.html", "astrology/third-party-src/pyswisseph-2.10.3.2.tar.gz",
                     "wordpress/plugins/lena-core/lena-core.php", "wordpress/plugins/lena-core/setup-content.php",
                     "wordpress/plugins/lena-astrology/includes/public.php", "wordpress/themes/zodiac-astrology-child/front-page.php",
                     "content/adatkezelesi-tajekoztato.html"):
            self.assertIn(name, files)
        self.assertTrue(any(name.startswith("licenses/") for name in files))
        self.assertTrue(any(name.endswith("-OFL.txt") for name in files))
        self.assertFalse(any(name.startswith("demo/") for name in files))

    def test_archive_is_deterministic_and_matches_exact_manifest(self):
        data, digest = build_source_archive()
        second, second_digest = build_source_archive()
        self.assertEqual((data, digest), (second, second_digest))
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            self.assertEqual({name.removeprefix("kelecsenyi-lena-web/") for name in archive.namelist()},
                             {name for name, _ in source_files()})
            self.assertEqual(archive.read("kelecsenyi-lena-web/astrology/astro_engine.py"),
                             dict(source_files())["astrology/astro_engine.py"].read_bytes())

    def test_unsafe_paths_fail_closed(self):
        with tempfile.TemporaryDirectory(prefix="source-test-", dir=SCRATCH_PARENT) as directory:
            root = Path(directory)
            manifest = root / "manifest.json"
            for name in ("astrology/astro.js", "astrology/.env", "astrology/astro-data/places.sqlite",
                         "production/record.log", ".git/config", "wordpress/.env", "astrology/runtime/engine.py"):
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("synthetic test fixture", encoding="utf-8")
            for name in ("../outside.txt", str(root / "outside.txt").replace("\\", "/"), "C:/outside.txt",
                         "astrology/.env", "astrology/astro-data/places.sqlite", ".git/config", "wordpress/.env",
                         "production/record.log", "astrology/runtime/engine.py", "astrology\\astro.js", "astrology//astro.js"):
                with self.subTest(path=name):
                    manifest.write_text(json.dumps({"files": [name]}), encoding="utf-8")
                    with self.assertRaises(ValueError):
                        source_files(root, manifest)

    def test_missing_and_duplicate_source_cannot_be_silently_omitted(self):
        with tempfile.TemporaryDirectory(prefix="source-test-", dir=SCRATCH_PARENT) as directory:
            root = Path(directory)
            manifest = root / "manifest.json"
            for files in (["production/missing.py"], [".gitignore", ".gitignore"]):
                (root / ".gitignore").write_text("/runtime/\n", encoding="utf-8")
                manifest.write_text(json.dumps({"files": files}), encoding="utf-8")
                with self.assertRaises(ValueError):
                    build_source_archive(root, manifest)

    def test_only_explicit_root_gitignore_exception_is_permitted(self):
        with tempfile.TemporaryDirectory(prefix="source-test-", dir=SCRATCH_PARENT) as directory:
            root = Path(directory)
            (root / ".gitignore").write_text("/runtime/\n", encoding="utf-8")
            (root / "astrology").mkdir()
            (root / "astrology/.gitignore").write_text("secret\n", encoding="utf-8")
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"files": [".gitignore"]}), encoding="utf-8")
            self.assertEqual(source_files(root, manifest)[0][0], ".gitignore")
            manifest.write_text(json.dumps({"files": ["astrology/.gitignore"]}), encoding="utf-8")
            with self.assertRaises(ValueError):
                source_files(root, manifest)


if __name__ == "__main__":
    unittest.main()
