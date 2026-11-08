#!/usr/bin/env python3
"""Semantic ROI pixel gates for METAL view PNGs.

Does NOT use global dark-pixel counts as the contrast proof (Mac v6: that metric
could not distinguish title ink from washed secondary).

Per view, named ROIs:
  - FG = mean of darkest 8% luma samples inside ROI (glyph cores)
  - BG = mean of brightest 25% luma samples inside ROI (local surface under/around glyphs)
  - contrast = WCAG relative-luminance ratio; require ≥4.5 for text ROIs

Avatar ROI: require non-black, non-neutral chroma (photo texture) — not object-count.
Ortho PNGs are NOT METAL predictors; pass/fail here is for actual Cycles/METAL frames.
"""
from __future__ import annotations

import argparse
import json
import struct
import zlib
from pathlib import Path

# Fractional frame ROIs (x0,y0,x1,y1) — top-left origin, y down
VIEW_ROIS = {
    "calendar": {
        "title": (0.04, 0.04, 0.55, 0.16),
        "weekdays": (0.04, 0.18, 0.96, 0.28),
        "day_numbers": (0.06, 0.30, 0.94, 0.82),
        "banner": (0.04, 0.88, 0.70, 0.98),
    },
    "board": {
        "title": (0.04, 0.04, 0.55, 0.16),
        "card_titles": (0.06, 0.28, 0.94, 0.85),
        "banner": (0.04, 0.88, 0.80, 0.98),
    },
    "plan": {
        "title": (0.04, 0.04, 0.60, 0.16),
        "row_titles": (0.06, 0.22, 0.70, 0.78),
        "row_meta": (0.06, 0.30, 0.85, 0.88),
        "banner": (0.04, 0.88, 0.80, 0.98),
    },
    "chrome": {
        "brand": (0.04, 0.28, 0.28, 0.52),
        "app_labels": (0.28, 0.32, 0.70, 0.55),
        "avatar": (0.72, 0.28, 0.92, 0.58),
        "banner": (0.04, 0.62, 0.70, 0.78),
    },
}

TEXT_ROIS = {
    "calendar": ["title", "weekdays", "day_numbers"],
    "board": ["title", "card_titles"],
    "plan": ["title", "row_titles", "row_meta"],
    "chrome": ["brand", "app_labels", "banner"],
}


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


def roi_samples(px, w, h, box, step=2):
    x0, y0, x1, y1 = box
    xa, xb = int(w * x0), int(w * x1)
    ya, yb = int(h * y0), int(h * y1)
    ls = []
    rgb = []
    for y in range(ya, yb, step):
        for x in range(xa, xb, step):
            i = (y * w + x) * 4
            r, g, b, a = px[i], px[i + 1], px[i + 2], px[i + 3]
            if a < 200:
                continue
            L = luma(r, g, b)
            ls.append(L)
            rgb.append((r, g, b, L))
    return ls, rgb, (xa, ya, xb, yb)


def roi_contrast(px, w, h, box) -> dict:
    ls, rgb, pxbox = roi_samples(px, w, h, box)
    if len(ls) < 40:
        return {"ok": False, "error": "roi too sparse", "n": len(ls), "pxbox": pxbox}
    ls_sorted = sorted(ls)
    n = len(ls_sorted)
    # Glyph cores: darkest 8%; local bg: brightest 25%
    fg = ls_sorted[: max(1, n * 8 // 100)]
    bg = ls_sorted[n * 75 // 100 :]
    fg_m = sum(fg) / len(fg)
    bg_m = sum(bg) / len(bg)
    # If ROI is mostly uniform wash (no glyphs), fg≈bg → fail honestly
    cr = contrast_ratio(rel_lum(bg_m), rel_lum(fg_m))
    return {
        "ok": cr >= 4.5 and (bg_m - fg_m) >= 25,
        "contrast": cr,
        "fg_luma": fg_m,
        "bg_luma": bg_m,
        "delta_luma": bg_m - fg_m,
        "n": n,
        "pxbox": pxbox,
        "method": "darkest8%_vs_brightest25%_same_ROI",
    }


def avatar_roi_proof(px, w, h, box) -> dict:
    _, rgb, pxbox = roi_samples(px, w, h, box, step=1)
    if len(rgb) < 50:
        return {"ok": False, "error": "avatar roi sparse", "n": len(rgb)}
    chroma = 0
    near_black = 0
    mean = [0.0, 0.0, 0.0]
    for r, g, b, L in rgb:
        mean[0] += r
        mean[1] += g
        mean[2] += b
        if max(r, g, b) - min(r, g, b) > 28 and L > 35:
            chroma += 1
        if L < 25:
            near_black += 1
    n = len(rgb)
    mean = [m / n for m in mean]
    mean_L = luma(*mean)
    # Photo must show chroma and not be a near-black disc
    ok = chroma >= 80 and near_black / n < 0.55 and mean_L > 40
    return {
        "ok": ok,
        "chroma_hits": chroma,
        "near_black_frac": near_black / n,
        "mean_rgb": mean,
        "mean_luma": mean_L,
        "n": n,
        "pxbox": pxbox,
        "note": "Requires opaque photo texture — black disc FAIL",
    }


def validate_png(path: Path, view: str, require_avatar=False, **_legacy) -> dict:
    """API compatible with generate_ui_scene import; ignores legacy min_dark kwargs."""
    w, h, px = read_png_rgba(Path(path))
    rois = VIEW_ROIS.get(view, {})
    text_names = TEXT_ROIS.get(view, list(rois.keys()))
    errors = []
    roi_reports = {}
    for name in text_names:
        if name not in rois:
            continue
        r = roi_contrast(px, w, h, rois[name])
        roi_reports[name] = r
        if not r.get("ok"):
            errors.append(
                f"{view}.{name} contrast {r.get('contrast', 0):.2f} < 4.5 "
                f"(fgL={r.get('fg_luma', 0):.0f} bgL={r.get('bg_luma', 0):.0f}) "
                f"[{r.get('method')}]"
            )
    avatar = None
    if require_avatar or view == "chrome":
        if "avatar" in rois:
            avatar = avatar_roi_proof(px, w, h, rois["avatar"])
            roi_reports["avatar"] = avatar
            if not avatar.get("ok"):
                errors.append(
                    f"{view}.avatar photo FAIL chroma={avatar.get('chroma_hits')} "
                    f"near_black={avatar.get('near_black_frac')} meanL={avatar.get('mean_luma')}"
                )
    # Crop heuristic: title ROI must exist and pass — left-edge-only dark clusters not used
    return {
        "ok": not errors,
        "errors": errors,
        "rois": roi_reports,
        "size": [w, h],
        "view": view,
        "note": "Semantic ROI FG/BG contrast — not global dark-pixel count",
        "not": ["DESIGN-STUDY-ORTHO predictor", "fake threshold relax"],
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
    out = {"ok": ok, "views": report, "validator": "semantic-roi-v7"}
    text = json.dumps(out, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)
    raise SystemExit(0 if ok else 2)


if __name__ == "__main__":
    main()
