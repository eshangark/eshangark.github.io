# Resume source

Edit `main.tex`, then run `python3 resume/build.py` from the repository root.
For automatic rebuilding on each save, run `python3 resume/build.py --watch`.

The build updates the PDF and WebP preview in `assets/` and their cache versions
in `index.html`. It checks that the resume fits on one page and contains the
portfolio hyperlink before replacing the existing assets. Build files stay in a
temporary directory. Commit and push the source and generated assets to publish.

Requirements: Tectonic, Poppler (`pdftoppm`), Python 3, Pillow, and pypdf.
The script also detects the compiler bundled with the desktop app and the
Poppler binary in its workspace runtime. Install Python packages with
`python3 -m pip install Pillow pypdf` if needed.

The source was recreated from the supplied PDF; its content is intentionally
unchanged apart from adding the portfolio contact link.
