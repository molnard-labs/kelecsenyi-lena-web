"""Build reviewed WordPress release ZIPs, corresponding source and offline runtime.

No authentication, deployment, user records or environment files are read.
The binary runtime targets the verified production CPython 3.10 / Linux x86_64.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
from pathlib import Path
import re
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PROD = ROOT / 'production'
DEMO = ROOT / 'demo'
PLUGIN = ROOT / 'wordpress/plugins/lena-astrology'
THEME = ROOT / 'wordpress/themes/zodiac-astrology-child'
OUT = ROOT / '.local/production-qa/releases'


def write_zip(files: dict[str, bytes]) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, raw in sorted(files.items()):
            entry = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            archive.writestr(entry, raw)
    return output.getvalue()


def corresponding_source() -> bytes:
    spec = importlib.util.spec_from_file_location('demo_source_bundle', DEMO / 'source_bundle.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    files = {name: path for name, path in module.source_files()}
    for name in json.loads((PROD / 'source-files.json').read_text(encoding='utf-8'))['files']:
        path = (ROOT / name).resolve()
        if (not path.is_relative_to(ROOT) or not path.is_file() or path.is_symlink()
                or any(part.startswith('.') for part in Path(name).parts)
                or path.suffix not in {'.php', '.py', '.md', '.json', '.css', '.js', '.png', '.jpg', '.txt', '.svg', '.woff2'}
                or not name.startswith(('production/', 'wordpress/themes/zodiac-astrology-child/', 'wordpress/plugins/lena-astrology/'))):
            raise ValueError(f'Unreviewed production source path: {name}')
        files[name] = path
    return write_zip({'kelecsenyi-lena-web/' + name: path.read_bytes() for name, path in files.items()})


def runtime() -> dict[str, bytes]:
    files = {
        'engine_cli.py': (PROD / 'engine_cli.py').read_bytes(),
        'astro_engine.py': (DEMO / 'astro_engine.py').read_bytes(),
        '.htaccess': b'Require all denied\n',
        'index.php': b'<?php http_response_code(404); exit;\n',
    }
    manifest = json.loads((PROD / 'runtime-wheels.json').read_text(encoding='utf-8'))
    cache = ROOT / '.local/production-qa/wheels'
    cache.mkdir(parents=True, exist_ok=True)
    for wheel in manifest['wheels']:
        cached = cache / wheel['filename']
        if not cached.is_file():
            cached.write_bytes(urllib.request.urlopen(wheel['url'], timeout=60).read())
        raw = cached.read_bytes()
        if hashlib.sha256(raw).hexdigest() != wheel['sha256']:
            raise ValueError('Runtime wheel checksum mismatch')
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            for name in archive.namelist():
                if name.endswith('/'):
                    continue
                if Path(name).is_absolute() or '..' in Path(name).parts:
                    raise ValueError('Unsafe wheel path')
                files['vendor/' + name] = archive.read(name)
    data = DEMO / 'astro-data'
    for name in ('places.sqlite', 'seas_18.se1', 'semo_18.se1', 'sepl_18.se1', 'manifest.json'):
        files['astro-data/' + name] = (data / name).read_bytes()
    return files


def public_files() -> dict[str, bytes]:
    names = ('astro.css', 'astro-wheel.css', 'astro.js', 'astro-wheel.js', 'astro-wheel-geometry.js',
             'astro-datetime.js', 'astro-interpretation.js')
    files = {name: (DEMO / name).read_bytes() for name in names}
    for dirname in ('astro-assets', 'brand-assets'):
        for path in (DEMO / dirname).iterdir():
            if path.is_file() and path.suffix in {'.css', '.woff2', '.txt', '.png'}:
                files[dirname + '/' + path.name] = path.read_bytes()
    analysis = (DEMO / 'astro-page.template.html').read_text(encoding='utf-8')
    analysis = analysis.replace('<meta name="robots" content="noindex,nofollow">',
                                '<meta name="lena-api-base" content="@@LENA_API_BASE@@">')
    analysis = analysis.replace('A számítást az ezen a gépen futó helyi szerver végzi.',
                                'A számítást az oldal számolószervere végzi.')
    analysis = analysis.replace('kelecsenyi-lena-demo-forras.zip', 'kelecsenyi-lena-forras.zip')
    legal = (DEMO / 'licenses.html').read_text(encoding='utf-8')
    legal = legal.replace('Nyílt forrású helyi demó', 'Nyílt forrású képletelemző')
    legal = legal.replace('A demó saját', 'Az elemző saját').replace('A demó forráskódjának', 'Az elemző forráskódjának')
    legal = legal.replace('az itt futó demó forrását', 'az itt futó alkalmazás forrását')
    legal = legal.replace('kelecsenyi-lena-demo-forras.zip', 'kelecsenyi-lena-forras.zip')
    for name, html in [('analysis.html', analysis), ('licenses.html', legal)]:
        html = re.sub(r'(?P<attr>href|src)="/(?P<file>(?:astro[^"#]*|brand-assets/[^"#]*))"',
                      lambda m: m['attr'] + '="@@LENA_ASSET_BASE@@/' + m['file']
                      + '?v=' + hashlib.sha256(files[m['file']]).hexdigest()[:12] + '"', html)
        files[name] = html.encode('utf-8')
    files['.htaccess'] = b'Options -Indexes\n<FilesMatch "\\.html$">\nRequire all denied\n</FilesMatch>\n'
    return files


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = corresponding_source()
    (PLUGIN / 'source.zip').write_bytes(source)
    for name in ('LICENSE', 'THIRD_PARTY_NOTICES.md'):
        (PLUGIN / name).write_bytes((ROOT / name).read_bytes())
    plugin = {}
    for name in ('lena-astrology.php', 'includes/public.php', 'includes/activation.php'):
        plugin[name] = (PLUGIN / name).read_bytes()
    for name in ('LICENSE', 'THIRD_PARTY_NOTICES.md', 'source.zip'):
        plugin[name] = (PLUGIN / name).read_bytes()
    plugin['reference-chart.json'] = (PROD / 'reference-chart.json').read_bytes()
    engine = runtime()
    for name, raw in engine.items():
        plugin['runtime/' + name] = raw
    for name, raw in public_files().items():
        plugin['public/' + name] = raw
    plugin['runtime-manifest.json'] = (json.dumps({name: hashlib.sha256(raw).hexdigest() for name, raw in engine.items()},
                                                indent=2) + '\n').encode('utf-8')
    (OUT / 'lena-astrology-0.2.2.zip').write_bytes(write_zip({'lena-astrology/' + n: raw for n, raw in plugin.items()}))
    theme = {str(p.relative_to(THEME)).replace('\\', '/'): p.read_bytes() for p in THEME.rglob('*')
             if p.is_file() and p.suffix in {'.php', '.css', '.js', '.png', '.jpg', '.woff2', '.txt'}}
    # The old unused video assets are intentionally absent; no uploads or content are replaced.
    (OUT / 'zodiac-astrology-child-0.2.2.zip').write_bytes(write_zip({'zodiac-astrology-child/' + n: raw for n, raw in theme.items()}))
    (OUT / 'corresponding-source.zip').write_bytes(source)
    print(json.dumps({'source_sha256': hashlib.sha256(source).hexdigest(),
                      'artifacts': {p.name: p.stat().st_size for p in OUT.glob('*.zip')}}, indent=2))


if __name__ == '__main__':
    main()
