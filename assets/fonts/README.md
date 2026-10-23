# Accessible Finance font assets

These are unmodified WOFF2 files downloaded from Google Fonts on October 23,
2026. They preserve the site's existing Instrument Serif, Inter and Literata
typography while allowing the site to serve and cache its fonts from its own
origin. No additional package or paid service is required.

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

Use `fonts-00b70c3ea8c7.css`. All font and stylesheet filenames contain a
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
