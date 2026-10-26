# Accessible Finance font assets

These are unmodified WOFF2 files downloaded from Google Fonts on October 23,
2026. As of October 26, the public site and planner use three families: Literata
for reading text, Inter for navigation, controls and diagram labels, and
Instrument Serif for headings and featured values. Fonts are served and cached from the
site's own origin. No additional package or paid service is required.

## Included fonts

| Family | Upstream release | Styles and CSS weights | Subsets |
| --- | --- | --- | --- |
| Instrument Serif | Google Fonts v5 | Normal and italic, 400 | Latin, Latin-ext |
| Inter | Google Fonts v20 | Normal variable, 400–800 | Latin, Latin-ext |
| Literata | Google Fonts v40 | Normal variable, 300–500; italic variable, 300–400 | Latin, Latin-ext |

The variable ranges consolidate the duplicate per-weight rules from the
previous Google Fonts stylesheet; the font binary URLs are identical. The
stylesheet retains Google's original `unicode-range` descriptors, so a browser
downloads only the subsets needed for the text on that page. English, French
and German use these Latin subsets. The original font families do not contain
Persian glyphs; the Farsi translation continues to use the existing system
fallback font stack.

Use `fonts-00b70c3ea8c7.css`. This stylesheet defines all three families.
The previous two-family stylesheet is retained for cached-page compatibility.
The `--body`, `--sans`, and `--serif` tokens assign each family a consistent role.
`scripts/type-scale.cjs` generates `type-scale.css` and supplies the SVG generator
with shared sizes: 14px metadata and controls, 16px compact text, 18px reading
text, 20px introductions, 28px subheadings, 40px section headings and 64px page
titles. Reading text, introductions and headings adapt at phone/tablet widths.
Guide diagrams use 18px labels, 16px details and 32px featured values, with
mobile images capped at their 320px intrinsic width so labels never enlarge
beyond that scale. Spacing uses the same 4/8/12/16/20/24/32/48/64/96px steps.
All font and stylesheet filenames contain a
12-character SHA-256 prefix, allowing immutable caching. If the bytes change,
publish a new filename and update references. Do not overwrite an existing
hashed filename. The complete font collection is 361,868 bytes; that is the
repository size, not the amount necessarily downloaded on each page.

## Licenses and provenance

All three font families are distributed under the SIL Open Font License 1.1.
The corresponding copyright notices and complete licenses are included:

- [Instrument Serif license](Instrument-Serif-OFL.txt) — Copyright 2022 The
  Instrument Serif Project Authors; [upstream project](https://github.com/Instrument/instrument-serif).
- [Inter license](Inter-OFL.txt) — Copyright 2020 The Inter Project Authors;
  [upstream project](https://github.com/rsms/inter).
- [Literata license](Literata-OFL.txt) — Copyright 2017 The Literata Project
  Authors; [upstream project](https://github.com/googlefonts/literata).

[`provenance.json`](provenance.json) records the original Google stylesheet
requests, exact upstream URLs, byte counts and full SHA-256 hashes for each
font, plus the license sources and hashes. No outlines or metadata were
modified, and the fonts' internal names are unchanged.

## Fonts embedded in guide illustrations

Guide SVGs use small, per-guide WOFF2 subsets of the existing Instrument Serif
normal 400 and Inter normal 400–500 fonts. Embedding them makes an illustration
use the same typography when displayed as an image or opened on its own; an SVG
loaded through `<img>` cannot inherit the page's web fonts. These derived subsets
are stored in [`scripts/guide-fonts.json`](../../scripts/guide-fonts.json), with
source hashes, license references, and generator versions. The original files
above and their licenses remain unchanged. Copyright and license font records
are retained, and every character used by each guide is checked for coverage.

The committed subsets are ordinary build inputs. Site builds and deployments
need Node.js only; Python is a developer tool for regenerating font subsets
after illustration text or source fonts change. In a local Python environment,
install `fonttools==4.67.0` and `brotli==1.2.1`, then run from the source folder:

```text
python scripts/subset-guide-fonts.py --node /path/to/node
node scripts/generate-guides.js
```

Omit `--node` when Node.js is on `PATH`. Keep the Python environment out of
source control. The subset command reads the guide generator's `--font-text`
output and local font provenance, writes deterministic subsets, and reports
their byte sizes. Review the regenerated SVGs and run the guide browser checks
because a font or text change can affect wrapping and label spacing.
