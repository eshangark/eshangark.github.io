#!/usr/bin/env python3
"""Compile main.tex and refresh the portfolio PDF, preview, and asset versions."""
import argparse
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent
RUNTIME = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies'


def executable(name, candidates):
    found = shutil.which(name)
    if found:
        return found
    for path in candidates:
        if path.is_file():
            return str(path)
    raise RuntimeError(f'{name} is required. Install it or put it on PATH.')


def build():
    compiler = executable('tectonic', [Path('/Applications/ChatGPT.app/Contents/Resources/tectonic/tectonic')])
    renderer = executable('pdftoppm', [RUNTIME / 'bin/override/pdftoppm'])
    with tempfile.TemporaryDirectory(prefix='portfolio-resume-') as directory:
        output = Path(directory)
        subprocess.run([compiler, '--untrusted', '--keep-logs', '--outdir', str(output), str(ROOT / 'main.tex')], check=True)
        pdf = output / 'main.pdf'
        reader = PdfReader(pdf)
        if len(reader.pages) != 1:
            raise RuntimeError('Resume must fit on one page; existing assets were preserved.')
        links = [annotation.get_object().get('/A', {}).get('/URI') for annotation in reader.pages[0].get('/Annots', [])]
        if 'https://eshangark.github.io/' not in links:
            raise RuntimeError('Missing portfolio hyperlink; existing assets were preserved.')
        subprocess.run([renderer, '-r', '180', '-png', '-singlefile', str(pdf), str(output / 'preview')], check=True)
        with Image.open(output / 'preview.png') as image:
            image.convert('RGB').save(output / 'resume-preview.webp', 'WEBP', quality=94, method=6)
        names = {'Eshan_Garkhedkar_Resume.pdf': pdf, 'resume-preview.webp': output / 'resume-preview.webp'}
        html_path = SITE / 'index.html'
        html = html_path.read_text()
        for name, source in names.items():
            version = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
            html = re.sub(r'assets/' + re.escape(name) + r'(?:\?v=[^"\s]*)?', f'assets/{name}?v={version}', html)
        for name, source in names.items():
            destination = SITE / 'assets' / name
            staged = destination.with_name('.' + name + '.tmp')
            shutil.copyfile(source, staged)
            os.replace(staged, destination)
        html_path.write_text(html)
    print('Updated assets/Eshan_Garkhedkar_Resume.pdf and assets/resume-preview.webp', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--watch', action='store_true', help='Rebuild whenever main.tex is saved; Ctrl+C to stop.')
    args = parser.parse_args()
    previous = None
    try:
        while True:
            current = (ROOT / 'main.tex').read_bytes()
            if current != previous:
                try:
                    build()
                except (RuntimeError, subprocess.CalledProcessError) as error:
                    if not args.watch:
                        raise
                    print(f'Build failed: {error}', flush=True)
                previous = current
            if not args.watch:
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
