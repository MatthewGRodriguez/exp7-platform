#!/usr/bin/env python3
"""Post-render measure helpers for Exp7 Blender art PNGs (stdlib only).

Mac v2 lesson: full-frame mean |dL| understates hover/pressed (subtle wash + scale)
and is dominated by background. Prefer:
  - ROI = panel bbox (from validation.json projected metrics or auto-threshold)
  - shadow_lift_*.png for offset/blur (catcher pass)
  - surface_lift_*.png for silhouette without ground shadow

Does not invent fits — writes raw ROI stats; analytical fits.json stay provisional
until a human/script maps shadow offset to h*cot(elev).
"""
from __future__ import annotations

import argparse
import json
import struct
import zlib
from pathlib import Path


def read_png_rgba(path: Path):
    """Minimal PNG reader (8-bit RGBA/RGB/L). Returns (w,h,pixels RGBA bytes)."""
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"not png: {path}"
    pos = 8
    w = h = None
    raw = b""
    color_type = None
    bit_depth = None
    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        pos += 4
        ctype = data[pos : pos + 4]
        pos += 4
        chunk = data[pos : pos + length]
        pos += length
        pos += 4  # crc
        if ctype == b"IHDR":
            w, h, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
        elif ctype == b"IDAT":
            raw += chunk
        elif ctype == b"IEND":
            break
    if w is None:
        raise ValueError("no IHDR")
    decompressed = zlib.decompress(raw)
    # filter decode
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
        if filt == 1:  # Sub
            for x in range(bpp, stride):
                row[x] = (row[x] + row[x - bpp]) & 255
        elif filt == 2:  # Up
            for x in range(stride):
                row[x] = (row[x] + prev[x]) & 255
        elif filt == 3:  # Average
            for x in range(stride):
                left = row[x - bpp] if x >= bpp else 0
                row[x] = (row[x] + ((left + prev[x]) // 2)) & 255
        elif filt == 4:  # Paeth
            for x in range(stride):
                a = row[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else (b if pb <= pc else c)
                row[x] = (row[x] + pr) & 255
        elif filt != 0:
            raise ValueError(f"unsupported filter {filt}")
        rows.append(row)
        prev = row
    # to RGBA
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
            elif color_type == 4:
                j = x * 2
                out[o] = out[o + 1] = out[o + 2] = row[j]
                out[o + 3] = row[j + 1]
    return w, h, bytes(out)


def luma(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def mean_abs_roi(a, b, w, h, bbox):
    x0, y0, x1, y1 = [int(v) for v in bbox]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(w - 1, x1), min(h - 1, y1)
    s = 0.0
    n = 0
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            i = (y * w + x) * 4
            la = luma(a[i], a[i + 1], a[i + 2])
            lb = luma(b[i], b[i + 1], b[i + 2])
            s += abs(la - lb)
            n += 1
    return (s / n) if n else 0.0, n


def shadow_stats(path: Path, alpha_thresh=8):
    """On shadow-catcher PNG (transparent), measure opaque footprint."""
    w, h, px = read_png_rgba(path)
    xs, ys = [], []
    count = 0
    for y in range(h):
        for x in range(w):
            a = px[(y * w + x) * 4 + 3]
            if a >= alpha_thresh:
                xs.append(x)
                ys.append(y)
                count += 1
    if not count:
        return {"shadow_px": 0, "bbox": None, "centroid": None}
    return {
        "shadow_px": count,
        "bbox": [min(xs), min(ys), max(xs), max(ys)],
        "centroid": [sum(xs) / count, sum(ys) / count],
        "note": "offset/blur vs lift_00 from centroid/bbox — fit separately from surface",
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="Blender run output dir")
    ap.add_argument("--validation", default="", help="validation.json with projected bbox")
    ap.add_argument("--out", default="", help="write JSON here")
    args = ap.parse_args()
    d = Path(args.dir)
    idle = d / "state_idle.png"
    if not idle.exists():
        raise SystemExit(f"missing {idle}")
    wi, hi, idle_px = read_png_rgba(idle)
    bbox = [int(wi * 0.2), int(hi * 0.2), int(wi * 0.8), int(hi * 0.8)]
    val_path = Path(args.validation) if args.validation else d / "validation.json"
    if val_path.exists():
        val = json.loads(val_path.read_text())
        m = (val.get("framing") or {}).get("metrics") or {}
        if m.get("bbox"):
            bbox = m["bbox"]

    roi = {}
    global_mean = {}
    for p in sorted(d.glob("state_*.png")):
        name = p.stem.replace("state_", "")
        w, h, px = read_png_rgba(p)
        assert (w, h) == (wi, hi)
        roi_d, n = mean_abs_roi(idle_px, px, w, h, bbox)
        g_d, g_n = mean_abs_roi(idle_px, px, w, h, [0, 0, w - 1, h - 1])
        roi[name] = {"mean_abs_dL": roi_d, "pixels": n, "bbox": bbox}
        global_mean[name] = {"mean_abs_dL": g_d, "pixels": g_n}

    shadows = {}
    for p in sorted(d.glob("shadow_lift_*.png")):
        shadows[p.name] = shadow_stats(p)

    out = {
        "method": "ROI panel bbox vs idle; shadow catcher footprint",
        "warning": "Do not treat global mean as interaction visibility (Mac v2)",
        "roi_vs_idle": roi,
        "global_mean_vs_idle_for_comparison_only": global_mean,
        "shadow_catcher": shadows,
        "fits": "PROVISIONAL — map shadow bbox/centroid vs lift_px to elev/size analytically next",
    }
    text = json.dumps(out, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)


if __name__ == "__main__":
    main()
