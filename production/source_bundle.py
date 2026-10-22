"""Package the current corresponding source from an explicit reviewed file list."""
from __future__ import annotations

from hashlib import sha256
import io
import json
from pathlib import Path, PurePosixPath
import zipfile

REPOSITORY = Path(__file__).resolve().parents[1]
MANIFEST = Path(__file__).resolve().parent / "source-files.json"
ROOT_FILES = {".gitignore", "LICENSE", "README.md", "THIRD_PARTY_NOTICES.md"}
SOURCE_PREFIXES = ("astrology/", "production/", "licenses/", "content/",
                   "wordpress/plugins/lena-astrology/", "wordpress/plugins/lena-core/",
                   "wordpress/themes/zodiac-astrology-child/")
SOURCE_SUFFIXES = {".php", ".py", ".md", ".json", ".css", ".js", ".mjs", ".png", ".jpg", ".txt", ".svg", ".woff2", ".html"}
FORBIDDEN_PARTS = {".git", ".local", ".venv", "__pycache__", "astro-data", "node_modules", "runtime", "public"}
UPSTREAM_ARCHIVE = "astrology/third-party-src/pyswisseph-2.10.3.2.tar.gz"


def source_files(repository: Path = REPOSITORY, manifest: Path = MANIFEST) -> list[tuple[str, Path]]:
    """Validate every entry before reading any source bytes."""
    root = repository.resolve()
    entries = json.loads(manifest.read_text(encoding="utf-8"))["files"]
    if not isinstance(entries, list) or not entries:
        raise ValueError("The source manifest must contain an explicit file list.")
    result = []
    seen = set()
    for name in entries:
        if not isinstance(name, str) or any(character in name for character in ("\\", "\x00", ":")):
            raise ValueError("Invalid source path.")
        relative = PurePosixPath(name)
        if relative.is_absolute() or ".." in relative.parts or "." in relative.parts or not relative.parts or str(relative) != name:
            raise ValueError("A source path must stay inside the repository.")
        if name != ".gitignore" and any(part.startswith(".") or part in FORBIDDEN_PARTS for part in relative.parts):
            raise ValueError("Runtime and private files cannot be included in the source archive.")
        if name not in ROOT_FILES and (not name.startswith(SOURCE_PREFIXES)
                or (relative.suffix.lower() not in SOURCE_SUFFIXES and relative.name != "LICENSE" and name != UPSTREAM_ARCHIVE)):
            raise ValueError("Unreviewed source file type or directory.")
        if name in seen:
            raise ValueError("Duplicate source path.")
        candidate = root.joinpath(*relative.parts)
        current = root
        for part in relative.parts:
            current /= part
            if current.is_symlink():
                raise ValueError("Linked source files are not included.")
        if not candidate.resolve().is_relative_to(root) or not candidate.is_file():
            raise ValueError(f"A required source file is missing: {name}")
        seen.add(name)
        result.append((name, candidate))
    return sorted(result)


def build_source_archive(repository: Path = REPOSITORY, manifest: Path = MANIFEST) -> tuple[bytes, str]:
    files = source_files(repository, manifest)
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, path in files:
            info = zipfile.ZipInfo("kelecsenyi-lena-web/" + name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes())
    data = output.getvalue()
    return data, sha256(data).hexdigest()
