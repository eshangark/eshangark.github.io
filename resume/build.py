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
PRIVATE = SITE.parent / 'private-resume'
PHONE_PATTERN = re.compile(r'(?<!\d)(?:\+?1[ .-]*)?\(?\d{3}\)?[ .-]*\d{3}[ .-]*\d{4}(?!\d)')
RUNTIME = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies'


def executable(name, candidates):
    found = shutil.which(name)
    if found:
        return found
    for path in candidates:
        if path.is_file():
            return str(path)
    raise RuntimeError(f'{name} is required. Install it or put it on PATH.')


def build(private=False, phone_file=None, private_output=None):
    source_text = (ROOT / 'main.tex').read_text()
    if PHONE_PATTERN.search(source_text):
        raise RuntimeError('Keep phone numbers out of main.tex; use the local private phone file.')
    if private:
        phone_file = Path(phone_file or PRIVATE / 'phone.txt').resolve()
        private_output = Path(private_output or PRIVATE / 'Eshan_Garkhedkar_Resume_Private.pdf').resolve()
        if phone_file.is_relative_to(SITE.resolve()) or private_output.is_relative_to(SITE.resolve()):
            raise RuntimeError('Private phone files and PDFs must stay outside the public website repository.')
        phone = phone_file.read_text().strip()
        if not re.fullmatch(r'[+0-9() .-]{7,25}', phone):
            raise RuntimeError('The private phone file must contain only a phone number.')

    compiler = executable('tectonic', [Path('/Applications/ChatGPT.app/Contents/Resources/tectonic/tectonic')])
    renderer = executable('pdftoppm', [RUNTIME / 'bin/override/pdftoppm'])
    with tempfile.TemporaryDirectory(prefix='portfolio-resume-') as directory:
        output = Path(directory)
        source = ROOT / 'main.tex'
        if private:
            source = output / 'main.tex'
            source.write_text(r'\def\ResumePhone{' + phone + '}\n' + source_text)
        subprocess.run([compiler, '--untrusted', '--keep-logs', '--outdir', str(output), str(source)], check=True)
        pdf = output / 'main.pdf'
        reader = PdfReader(pdf)
        if len(reader.pages) != 1:
            raise RuntimeError('Resume must fit on one page; existing assets were preserved.')
        links = [annotation.get_object().get('/A', {}).get('/URI') for annotation in reader.pages[0].get('/Annots', [])]
        if 'https://eshangark.github.io/' not in links:
            raise RuntimeError('Missing portfolio hyperlink; existing assets were preserved.')
        extracted = reader.pages[0].extract_text() + str(reader.metadata) + str(links)
        if private:
            if phone not in reader.pages[0].extract_text():
                raise RuntimeError('The private PDF is missing its phone number.')
            private_output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(pdf, private_output)
            private_output.chmod(0o600)
            print(f'Updated private resume: {private_output}', flush=True)
            return
        if PHONE_PATTERN.search(extracted):
            raise RuntimeError('Phone number detected in public PDF; existing website assets were preserved.')
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
    parser.add_argument('--private', action='store_true', help='Build a local PDF with the private phone number; never update website assets.')
    parser.add_argument('--phone-file', type=Path, help='Private phone-number file outside the public repository.')
    parser.add_argument('--output', type=Path, help='Private PDF destination outside the public repository.')
    args = parser.parse_args()
    if not args.private and (args.phone_file or args.output):
        parser.error('--phone-file and --output require --private')
    previous = None
    try:
        while True:
            current = (ROOT / 'main.tex').read_bytes()
            if current != previous:
                try:
                    build(args.private, args.phone_file, args.output)
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
