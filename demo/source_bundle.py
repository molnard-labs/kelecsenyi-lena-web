"""Offer the current corresponding source from a reviewed, exact file list.

The allowlist is relative to the repository root. It never walks runtime data,
the Git directory, local experiments, environment files, logs or birth records.
Run `python source_bundle.py` to create an optional ignored source.zip locally.
"""
from __future__ import annotations

from hashlib import sha256
import io
import json
from pathlib import Path, PurePosixPath
import zipfile

BASE = Path(__file__).resolve().parent
REPOSITORY = BASE.parent
MANIFEST = BASE / "source-files.json"
FORBIDDEN_PARTS = {".git", ".local", ".venv", "__pycache__", "astro-data", "node_modules", "deployment", "wordpress"}


def source_files(repository: Path = REPOSITORY, manifest: Path = MANIFEST) -> list[tuple[str, Path]]:
    """Validate every source entry before opening any file for the archive."""
    root = repository.resolve()
    entries = json.loads(manifest.read_text(encoding="utf-8"))["files"]
    if not isinstance(entries, list) or not entries:
        raise ValueError("The source manifest must contain an explicit file list.")
    result = []
    seen = set()
    for name in entries:
        if not isinstance(name, str) or "\\" in name or "\x00" in name:
            raise ValueError("Invalid source path.")
        relative = PurePosixPath(name)
        if relative.is_absolute() or ".." in relative.parts or "." in relative.parts or not relative.parts:
            raise ValueError("A source path must stay inside the repository.")
        if name != ".gitignore" and any(part.startswith(".") or part in FORBIDDEN_PARTS for part in relative.parts):
            raise ValueError("Runtime and private files cannot be included in the source archive.")
        if name in seen:
            raise ValueError("Duplicate source path.")
        candidate = root.joinpath(*relative.parts)
        # Disallow all symlinks, including links whose destination is inside root.
        current = root
        for part in relative.parts:
            current = current / part
            if current.is_symlink():
                raise ValueError("Linked source files are not included.")
        if not candidate.resolve().is_relative_to(root) or not candidate.is_file():
            raise ValueError(f"A required source file is missing: {name}")
        if candidate.suffix.lower() in {".sqlite", ".db", ".log", ".pyc", ".se1", ".exe", ".dll", ".pyd"}:
            raise ValueError("A runtime artifact cannot be included in the source archive.")
        seen.add(name)
        result.append((name, candidate))
    return sorted(result)


def build_source_archive(repository: Path = REPOSITORY, manifest: Path = MANIFEST) -> tuple[bytes, str]:
    """Return a deterministic ZIP and digest for the currently saved sources."""
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


if __name__ == "__main__":
    data, digest = build_source_archive()
    output = BASE / "source.zip"
    output.write_bytes(data)
    print(f"Corresponding source: {output.name} ({len(data):,} bytes; SHA-256 {digest})")
