#!/usr/bin/env python3
"""Regenerate self-contained guide font subsets; not required for site builds.

Requires fonttools==4.67.0 and brotli==1.2.1 in a developer-only Python
environment. Source fonts and their licenses remain unchanged in assets/fonts.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

import brotli
import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parent.parent
FONT_DIRECTORY = ROOT / "assets" / "fonts"
OUTPUT = ROOT / "scripts" / "guide-fonts.json"
FONTTOOLS_VERSION = "4.67.0"
BROTLI_VERSION = "1.2.1"


def source_font(provenance: dict, family: str) -> tuple[dict, bytes]:
    matches = [
        font for font in provenance["fonts"]
        if font["family"] == family
        and font["style"] == "normal"
        and font["subset"] == "latin"
    ]
    if len(matches) != 1:
        raise ValueError(f"Expected one normal Latin source font for {family}")
    record = matches[0]
    binary = (FONT_DIRECTORY / record["filename"]).read_bytes()
    if hashlib.sha256(binary).hexdigest() != record["sha256"]:
        raise ValueError(f"Source font differs from provenance: {record['filename']}")
    font = TTFont(io.BytesIO(binary), recalcTimestamp=False)
    if family == "Inter":
        if "fvar" not in font or not any(axis.axisTag == "wght" for axis in font["fvar"].axes):
            raise ValueError("Expected Inter's variable weight axis")
        instantiateVariableFont(font, {"wght": (400, 500)}, inplace=True)
    # Reuse the instanced source in memory instead of repeating the expensive
    # variable-font operation for each guide. This does not alter source files.
    font.flavor = None
    buffer = io.BytesIO()
    font.save(buffer)
    font.close()
    return record, buffer.getvalue()


def make_subset(binary: bytes, text: str, label: str) -> tuple[dict, int]:
    characters = "".join(sorted(set(text)))
    if not characters or any(ord(character) < 32 for character in characters):
        raise ValueError(f"Expected nonempty, single-line guide text: {label}")
    font = TTFont(io.BytesIO(binary), recalcTimestamp=False)
    required = {ord(character) for character in characters}
    missing = required - set(font.getBestCmap())
    if missing:
        codes = ", ".join(f"U+{code:04X}" for code in sorted(missing))
        raise ValueError(f"{label}: source font does not cover {codes}")
    # Keep copyright/license records (including any future license-text record)
    # and the names referenced by variation/layout tables.
    names = {
        (entry.nameID, entry.platformID, entry.platEncID, entry.langID): entry.toUnicode()
        for entry in font["name"].names if entry.nameID in {0, 13, 14}
    }
    options = subset.Options()
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.layout_features = ["*"]
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=required)
    subsetter.subset(font)
    font.flavor = "woff2"
    output = io.BytesIO()
    font.save(output)
    font.close()
    encoded = output.getvalue()
    # Verify the serialized font, not only the in-memory subset operation.
    checked = TTFont(io.BytesIO(encoded), recalcTimestamp=False)
    if not required.issubset(checked.getBestCmap()):
        raise ValueError(f"{label}: serialized subset lost a required glyph")
    retained_names = {
        (entry.nameID, entry.platformID, entry.platEncID, entry.langID): entry.toUnicode()
        for entry in checked["name"].names if entry.nameID in {0, 13, 14}
    }
    if retained_names != names:
        raise ValueError(f"{label}: subset changed copyright or license records")
    if label.endswith("/sans"):
        weights = [axis for axis in checked["fvar"].axes if axis.axisTag == "wght"]
        if len(weights) != 1 or (weights[0].minValue, weights[0].defaultValue, weights[0].maxValue) != (400, 400, 500):
            raise ValueError(f"{label}: expected the retained 400–500 weight range")
    checked.close()
    return {"characters": characters, "woff2": base64.b64encode(encoded).decode("ascii")}, len(encoded)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node", default=shutil.which("node"), help="Node.js executable; defaults to node on PATH")
    args = parser.parse_args()
    if not args.node:
        parser.error("Node.js is required; pass --node with its executable path")
    if fontTools.__version__ != FONTTOOLS_VERSION or brotli.__version__ != BROTLI_VERSION:
        parser.error(f"Use fonttools=={FONTTOOLS_VERSION} and brotli=={BROTLI_VERSION} for repeatable output")
    process = subprocess.run(
        [args.node, str(ROOT / "scripts" / "generate-guides.js"), "--font-text"],
        cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8",
    )
    guides = json.loads(process.stdout)
    if not isinstance(guides, dict) or not guides:
        raise ValueError("The guide generator returned no font text")
    provenance = json.loads((FONT_DIRECTORY / "provenance.json").read_text(encoding="utf-8"))
    sources = {}
    originals = {}
    for kind, family, weight, license_name in [
        ("sans", "Inter", "400 500", "Inter-OFL.txt"),
        ("serif", "Instrument Serif", "400", "Instrument-Serif-OFL.txt"),
    ]:
        record, originals[kind] = source_font(provenance, family)
        sources[kind] = {
            "family": family,
            "style": "normal",
            "weight": weight,
            "filename": record["filename"],
            "sourceUrl": record["url"],
            "sourceSha256": record["sha256"],
            "license": f"assets/fonts/{license_name}",
        }
    sources["generator"] = {
        "script": "scripts/subset-guide-fonts.py",
        "fontTools": fontTools.__version__,
        "brotli": brotli.__version__,
        "python": f"{sys.version_info.major}.{sys.version_info.minor}",
        "textSource": "node scripts/generate-guides.js --font-text",
        "characters": "Exact characters sorted by Unicode code point; validated against each subset cmap",
    }
    generated = {}
    totals = {}
    for guide_id, strings in sorted(guides.items()):
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", guide_id):
            raise ValueError(f"Invalid guide ID: {guide_id}")
        generated[guide_id] = {}
        totals[guide_id] = 0
        for kind in ("sans", "serif"):
            if not isinstance(strings.get(kind), str):
                raise ValueError(f"Missing {kind} text for {guide_id}")
            generated[guide_id][kind], size = make_subset(originals[kind], strings[kind], f"{guide_id}/{kind}")
            totals[guide_id] += size
    OUTPUT.write_text(json.dumps({"sources": sources, "guides": generated}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "guides": len(generated),
        "fontSubsets": len(generated) * 2,
        "glyphCoverage": "All exact guide characters covered",
        "rawFontBytesPerGuide": {"min": min(totals.values()), "max": max(totals.values()), "mean": round(sum(totals.values()) / len(totals))},
        "largestGuide": max(totals, key=totals.get),
        "outputBytes": OUTPUT.stat().st_size,
    }))


if __name__ == "__main__":
    main()
