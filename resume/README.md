# Updating your resume

On GitHub, open `resume/main.tex`, click the pencil to edit it, then choose
**Commit changes** and commit directly to `main`.

The **Update resume** workflow automatically compiles the LaTeX, validates the
one-page PDF and portfolio link, updates the PDF and WebP preview in `assets/`,
refreshes their links in `index.html`, and requests a GitHub Pages deployment.
No manual build or PDF upload is needed. Allow a few minutes for publication.

Check the repository's **Actions** tab for progress. If compilation fails or the
resume exceeds one page, correct `main.tex` and commit again. The previously
published PDF stays available until a build succeeds. You can also run
**Update resume** manually from Actions using **Run workflow**.

## Optional local editing

Run `python3 resume/build.py` from the repository root to build once, or
`python3 resume/build.py --watch` to rebuild whenever `main.tex` is saved.
Local builds require Tectonic, Poppler (`pdftoppm`), Python 3, Pillow, and pypdf.
The script also detects the compiler and dependencies bundled with Codex.
