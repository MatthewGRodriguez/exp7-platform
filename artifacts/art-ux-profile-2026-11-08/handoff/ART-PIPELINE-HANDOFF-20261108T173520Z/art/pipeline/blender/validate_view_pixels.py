#!/usr/bin/env python3
"""Pixel-level gates for view PNGs — object counts are NOT proof (Mac v4).

Checks:
  - dark text pixels (luma < threshold) with sufficient count
  - approximate contrast of darkest 5% vs median background ≥ 4.5 (WCAG-ish)
  - chrome: non-grey chroma cluster (avatar photo hues) in expected corner ROI
  - framing: no heavy clipping by requiring title-region dark pixels present
"""
from __future__ import annotations

import argparse
import json
import struct
import zlib
from pathlib import Path


def read_png_rgba(path: Path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"not png: {path}"
    pos = 8
    w = h = None
    raw = b""
    color_type = bit_depth = None
    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        pos += 4
        ctype = data[pos : pos + 4]
        pos += 4
        chunk = data[pos : pos + length]
        pos += length + 4
        if ctype == b"IHDR":
            w, h, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
        elif ctype == b"IDAT":
            raw += chunk
        elif ctype == b"IEND":
            break
    decompressed = zlib.decompress(raw)
    bpp = {0: 1, 2: 3, 4: 2, 6: 4}[color_type] * (bit_depth // 8)
    stride = w * bpp
    rows = []
    i = 0
    prev = bytearray(stride)
    for _ in range(h):
        filt = decompressed[i]
        i += 1
        row = bytearray(decompressed[i : i + stride])
        i += stride
        if filt == 1:
            for x in range(bpp, stride):
                row[x] = (row[x] + row[x - bpp]) & 255
        elif filt == 2:
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                left = row[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + ((left + prev[x]) // 2)) & 255
        elif filt == 4:
            for x in range(stride):
                a = row[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                row[x] = (row[x] + pr) & 255
        rows.append(row)
        prev = row
    out = bytearray(w * h * 4)
    for y, row in enumerate(rows):
        for x in range(w):
            o = (y * w + x) * 4
            if color_type == 6:
                j = x * 4
                out[o : o + 4] = row[j : j + 4]
            elif color_type == 2:
                j = x * 3
                out[o : o + 3] = row[j : j + 3]
                out[o + 3] = 255
            elif color_type == 0:
                out[o] = out[o + 1] = out[o + 2] = row[x]
                out[o + 3] = 255
    return w, h, bytes(out)


def luma(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def rel_lum(v):
    x = v / 255.0
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def contrast_ratio(l1, l2):
    a, b = max(l1, l2), min(l1, l2)
    return (a + 0.05) / (b + 0.05)


def validate_png(path: Path, view: str, require_avatar=False, min_dark=400, dark_luma=110) -> dict:
    w, h, px = read_png_rgba(Path(path))
    dark = []
    all_l = []
    chroma_hits = 0
    # Avatar ROI: upper-right quadrant for chrome
    ax0, ay0, ax1, ay1 = int(w * 0.72), int(h * 0.15), int(w * 0.95), int(h * 0.55)
    for y in range(h):
        for x in range(w):
            i = (y * w + x) * 4
            r, g, b = px[i], px[i + 1], px[i + 2]
            L = luma(r, g, b)
            all_l.append(L)
            if L < dark_luma and px[i + 3] > 200:
                dark.append((x, y, L, r, g, b))
            if require_avatar and ax0 <= x <= ax1 and ay0 <= y <= ay1:
                # non-neutral chroma (photo-study is blue→gold gradient)
                if max(r, g, b) - min(r, g, b) > 28 and L > 40:
                    chroma_hits += 1

    errors = []
    if len(dark) < min_dark:
        errors.append(f"only {len(dark)} dark text-ish pixels (need ≥{min_dark}) — faint/tiny typography FAIL")

    # Contrast: darkest 2% vs median of bright half
    all_l.sort()
    if all_l:
        dark_sample = all_l[: max(1, len(all_l) // 50)]
        bright = all_l[len(all_l) // 2 :]
        med_bg = bright[len(bright) // 2]
        mean_dark = sum(dark_sample) / len(dark_sample)
        cr = contrast_ratio(rel_lum(med_bg), rel_lum(mean_dark))
    else:
        cr = 0.0
        mean_dark = med_bg = 0
    if cr < 4.5:
        errors.append(f"approx contrast {cr:.2f} < 4.5 (dark≈{mean_dark:.0f} vs bg≈{med_bg:.0f})")

    # Crop heuristic: if title expected, leftmost 3% of frame should not be the only dark cluster
    if dark:
        left_frac = sum(1 for x, _, _, *_ in dark if x < w * 0.04) / len(dark)
        mid_left = sum(1 for x, _, _, *_ in dark if w * 0.08 < x < w * 0.35) / len(dark)
        if left_frac > 0.35 and mid_left < 0.05:
            errors.append("dark pixels hug left edge — likely cropped title (e.g. 'vember')")

    if require_avatar and chroma_hits < 80:
        errors.append(f"avatar ROI chroma hits={chroma_hits} (<80) — photo disc not visible")

    return {
        "ok": not errors,
        "errors": errors,
        "dark_pixels": len(dark),
        "contrast_approx": cr,
        "avatar_chroma_hits": chroma_hits if require_avatar else None,
        "size": [w, h],
        "view": view,
        "note": "Pixel proof — not object-count",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    d = Path(args.dir)
    report = {}
    ok = True
    for view in ("calendar", "board", "plan", "chrome"):
        p = d / f"view_{view}.png"
        if not p.exists():
            report[view] = {"ok": False, "errors": ["missing png"]}
            ok = False
            continue
        r = validate_png(p, view, require_avatar=(view == "chrome"))
        report[view] = r
        ok = ok and r["ok"]
    out = {"ok": ok, "views": report}
    text = json.dumps(out, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)
    raise SystemExit(0 if ok else 2)


if __name__ == "__main__":
    main()
