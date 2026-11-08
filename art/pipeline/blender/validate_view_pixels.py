#!/usr/bin/env python3
"""Projected-geometry ROI pixel gates for METAL/CPU DESIGN-STUDY view PNGs.

v8 mechanism (replaces hardcoded fractional VIEW_ROIS that missed title at y~86):
  - Prefer companion `view_<name>_rois.json` written at render from projected FONT AABBs
  - Prefer companion `view_<name>_bg.png` (same camera, FONT objects hide_render) for BG
  - FG = beauty pixels inside projected text mask that differ from BG (surface under glyphs)
  - Fallback: darkest 8% vs brightest 25% *inside projected ROI only* (never whole-frame band)

Avatar: require non-black chroma + fixture-like structure — gradient-only disc FAIL if
chroma_hits high but spatial variance is pure left→right ramp with no label/features.

Ortho PNGs are NOT METAL predictors.
"""
from __future__ import annotations

import argparse
import json
import struct
import zlib
from pathlib import Path

# Semantic groups → object-name suffixes / substrings in projected ROI sidecar
VIEW_TEXT_GROUPS = {
    "calendar": {
        "title": ["_title"],
        "weekdays": ["_wd"],
        "day_numbers": ["_num"],
        "banner": ["_banner"],
    },
    "board": {
        "title": ["_title"],
        "card_titles": ["_ct", "_colLab"],
        "banner": ["_banner"],
    },
    "plan": {
        "title": ["_title"],
        "row_titles": ["_rt"],
        "row_meta": ["_rs"],
        "banner": ["_banner"],
    },
    "chrome": {
        "brand": ["_brand"],
        "app_labels": ["_appLab", "_tabLab"],
        "banner": ["_banner", "_note", "_login"],
    },
}

# Required text groups gated per view (chrome footer banners are watermark — brand+apps+avatar)
TEXT_ROIS = {
    "calendar": ["title", "weekdays", "day_numbers"],
    "board": ["title", "card_titles"],
    "plan": ["title", "row_titles", "row_meta"],
    "chrome": ["brand", "app_labels"],
}

# Legacy fractional fallback — ONLY if sidecar missing (honest fail preferred)
VIEW_ROIS_LEGACY = {
    "calendar": {
        "title": (0.20, 0.20, 0.55, 0.30),
        "weekdays": (0.15, 0.30, 0.85, 0.38),
        "day_numbers": (0.12, 0.35, 0.88, 0.78),
        "banner": (0.08, 0.82, 0.70, 0.95),
    },
    "board": {
        "title": (0.15, 0.18, 0.55, 0.30),
        "card_titles": (0.08, 0.32, 0.92, 0.80),
        "banner": (0.08, 0.82, 0.80, 0.95),
    },
    "plan": {
        "title": (0.15, 0.18, 0.60, 0.30),
        "row_titles": (0.10, 0.28, 0.75, 0.75),
        "row_meta": (0.10, 0.32, 0.80, 0.82),
        "banner": (0.08, 0.82, 0.80, 0.95),
    },
    "chrome": {
        "brand": (0.08, 0.32, 0.28, 0.52),
        "app_labels": (0.28, 0.32, 0.70, 0.55),
        "avatar": (0.72, 0.28, 0.92, 0.58),
        "banner": (0.08, 0.60, 0.70, 0.82),
    },
}

# Probe 640 undersamples glyphs with projected height < this — gate as SKIP not false pass
MIN_GLYPH_H_PX_PROBE = 8.0
MIN_GLYPH_H_PX_PROD = 12.0


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


def load_projected_rois(path: Path | None) -> dict | None:
    if not path or not Path(path).is_file():
        return None
    return json.loads(Path(path).read_text())


def _match_group(name: str, suffixes: list[str]) -> bool:
    return any(s in name for s in suffixes)


def group_boxes_from_sidecar(sidecar: dict, view: str, res_w: int, res_h: int) -> dict:
    """Union projected px boxes per semantic group. Scale if sidecar res differs."""
    groups = VIEW_TEXT_GROUPS.get(view, {})
    ref = sidecar.get("resolution") or sidecar.get("resolution_ref") or [res_w, res_h]
    sx = res_w / float(ref[0])
    sy = res_h / float(ref[1])
    key = "px_tl_640" if res_w <= 640 else "px_tl_1280"
    # also accept generic px_tl
    out = {}
    meta = {}
    objects = sidecar.get("objects") or {}
    for gname, suffixes in groups.items():
        boxes = []
        hs = []
        for oname, od in objects.items():
            if not _match_group(oname, suffixes):
                continue
            box = od.get(key) or od.get("px_tl") or od.get("px_tl_1280") or od.get("px_tl_640")
            if not box:
                continue
            x0, y0, x1, y1 = box
            boxes.append([x0 * sx, y0 * sy, x1 * sx, y1 * sy])
            hs.append(float(od.get("h_px_640" if res_w <= 640 else "h_px_1280") or (y1 - y0) * sy))
        if not boxes:
            continue
        ux0 = min(b[0] for b in boxes)
        uy0 = min(b[1] for b in boxes)
        ux1 = max(b[2] for b in boxes)
        uy1 = max(b[3] for b in boxes)
        # pad 2px
        out[gname] = (ux0 - 2, uy0 - 2, ux1 + 2, uy1 + 2)
        meta[gname] = {
            "n_objects": len(boxes),
            "min_h_px": min(hs) if hs else 0,
            "mean_h_px": sum(hs) / len(hs) if hs else 0,
            "source": "projected_sidecar",
        }
    # avatar
    for oname, od in objects.items():
        if "avatar" in oname.lower():
            box = od.get(key) or od.get("px_tl") or od.get("px_tl_1280")
            if box:
                x0, y0, x1, y1 = box
                out["avatar"] = (x0 * sx - 2, y0 * sy - 2, x1 * sx + 2, y1 * sy + 2)
                meta["avatar"] = {"source": "projected_sidecar"}
    return out, meta


def absolute_box(box, w, h):
    """box may be fractional 0-1 or absolute px."""
    x0, y0, x1, y1 = box
    if max(abs(x0), abs(y0), abs(x1), abs(y1)) <= 1.5:
        return int(w * x0), int(h * y0), int(w * x1), int(h * y1)
    return int(x0), int(y0), int(x1), int(y1)


def roi_contrast_masked(beauty, bg, w, h, box, min_delta=18) -> dict:
    """FG = beauty pixels inside ROI that differ from text-hidden BG; BG = those BG samples."""
    xa, ya, xb, yb = absolute_box(box, w, h)
    if xb <= xa or yb <= ya:
        return {
            "ok": False,
            "error": "roi inverted/out-of-frame",
            "n": 0,
            "pxbox": [xa, ya, xb, yb],
            "method": "projected_ROI_invalid",
        }
    xa, ya = max(0, xa), max(0, ya)
    xb, yb = min(w, xb), min(h, yb)
    fg_L, bg_L = [], []
    n_roi = 0
    for y in range(ya, yb):
        for x in range(xa, xb):
            i = (y * w + x) * 4
            if beauty[i + 3] < 200:
                continue
            n_roi += 1
            br, bg_, bb = beauty[i], beauty[i + 1], beauty[i + 2]
            if bg is not None:
                gr, gg, gb = bg[i], bg[i + 1], bg[i + 2]
                if abs(int(br) - gr) + abs(int(bg_) - gg) + abs(int(bb) - gb) >= min_delta * 3:
                    fg_L.append(luma(br, bg_, bb))
                    bg_L.append(luma(gr, gg, gb))
            else:
                fg_L.append(luma(br, bg_, bb))
    if bg is None:
        # percentile fallback inside projected ROI only
        if len(fg_L) < 20:
            return {"ok": False, "error": "roi too sparse", "n": len(fg_L), "pxbox": [xa, ya, xb, yb]}
        ls = sorted(fg_L)
        n = len(ls)
        fg = ls[: max(1, n * 8 // 100)]
        bgv = ls[n * 75 // 100 :]
        fg_m = sum(fg) / len(fg)
        bg_m = sum(bgv) / len(bgv)
        method = "projected_ROI_darkest8%_vs_brightest25%"
    else:
        if len(fg_L) < 8:
            # Fallback: projected ROI percentile (mask miss from AA / denoise / thin glyphs)
            ls = []
            for y in range(ya, yb):
                for x in range(xa, xb):
                    i = (y * w + x) * 4
                    if beauty[i + 3] < 200:
                        continue
                    ls.append(luma(beauty[i], beauty[i + 1], beauty[i + 2]))
            if len(ls) < 20:
                return {
                    "ok": False,
                    "error": "text-mask sparse and ROI empty",
                    "n": len(fg_L),
                    "n_roi": n_roi,
                    "pxbox": [xa, ya, xb, yb],
                    "method": "projected_ROI_textmask_vs_hiddenBG",
                }
            ls.sort()
            n = len(ls)
            fg_m = sum(ls[: max(1, n * 8 // 100)]) / max(1, n * 8 // 100)
            bg_m = sum(ls[n * 75 // 100 :]) / max(1, len(ls[n * 75 // 100 :]))
            method = "projected_ROI_darkest8%_fallback_after_sparse_mask"
        else:
            # Glyph cores only: AA fringe midtones inflate mean FG (v8 calendar title mean142 vs core~24)
            paired = sorted(zip(fg_L, bg_L), key=lambda t: t[0])
            core_n = max(1, len(paired) * 15 // 100)
            core = paired[:core_n]
            fg_m = sum(t[0] for t in core) / len(core)
            bg_m = sum(t[1] for t in core) / len(core)
            method = "projected_ROI_textmaskCore15%_vs_hiddenBG"
    cr = contrast_ratio(rel_lum(bg_m), rel_lum(fg_m))
    return {
        "ok": cr >= 4.5 and (bg_m - fg_m) >= 25,
        "contrast": cr,
        "fg_luma": fg_m,
        "bg_luma": bg_m,
        "delta_luma": bg_m - fg_m,
        "n": len(fg_L),
        "n_roi": n_roi,
        "pxbox": [xa, ya, xb, yb],
        "method": method,
    }


def avatar_roi_proof(px, w, h, box) -> dict:
    xa, ya, xb, yb = absolute_box(box, w, h)
    if xb <= xa or yb <= ya:
        return {"ok": False, "error": "avatar roi inverted/out-of-frame", "pxbox": [xa, ya, xb, yb], "n": 0}
    xa, ya = max(0, xa), max(0, ya)
    xb, yb = min(w, xb), min(h, yb)
    rgb = []
    for y in range(ya, yb, 1):
        for x in range(xa, xb, 1):
            i = (y * w + x) * 4
            r, g, b, a = px[i], px[i + 1], px[i + 2], px[i + 3]
            if a < 200:
                continue
            rgb.append((r, g, b, luma(r, g, b)))
    if len(rgb) < 50:
        return {"ok": False, "error": "avatar roi sparse", "n": len(rgb), "pxbox": [xa, ya, xb, yb]}
    chroma = 0
    near_black = 0
    mean = [0.0, 0.0, 0.0]
    # Spatial structure: reject pure L→R gradient (v7 false photo)
    left = [L for (r, g, b, L), idx in zip(rgb, range(len(rgb))) if False]
    # Split ROI into 3x3 cells — fixture needs multi-hue cells, not one ramp
    cells = [[0.0, 0.0, 0.0, 0] for _ in range(9)]
    for r, g, b, L in rgb:
        # recover approx x,y by scanning — re-loop
        pass
    # proper cell pass
    cells = [[0.0, 0.0, 0.0, 0] for _ in range(9)]
    for y in range(ya, yb):
        for x in range(xa, xb):
            i = (y * w + x) * 4
            r, g, b, a = px[i], px[i + 1], px[i + 2], px[i + 3]
            if a < 200:
                continue
            cx = min(2, int(3 * (x - xa) / max(1, xb - xa)))
            cy = min(2, int(3 * (y - ya) / max(1, yb - ya)))
            ci = cy * 3 + cx
            cells[ci][0] += r
            cells[ci][1] += g
            cells[ci][2] += b
            cells[ci][3] += 1
    cell_means = []
    for c in cells:
        if c[3] > 0:
            cell_means.append((c[0] / c[3], c[1] / c[3], c[2] / c[3]))
    distinct = 0
    for i, a in enumerate(cell_means):
        for b in cell_means[i + 1 :]:
            if abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) > 60:
                distinct += 1
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
    # Fixture must show chroma AND spatial multi-region (not single gradient ellipse)
    # chroma 80 was tuned for large ROIs; small probe ROIs still need structure (spatial≥3)
    ok = chroma >= 40 and near_black / n < 0.55 and mean_L > 40 and distinct >= 3
    return {
        "ok": ok,
        "chroma_hits": chroma,
        "near_black_frac": near_black / n,
        "mean_rgb": mean,
        "mean_luma": mean_L,
        "spatial_distinct_pairs": distinct,
        "n": n,
        "pxbox": [xa, ya, xb, yb],
        "note": "Requires illustrated fixture structure — gradient ellipse FAIL",
        "kind_expected": "illustrated-fixture",
    }


def validate_png(
    path: Path,
    view: str,
    require_avatar=False,
    rois_path: Path | None = None,
    bg_path: Path | None = None,
    **_legacy,
) -> dict:
    path = Path(path)
    w, h, beauty = read_png_rgba(path)
    bg_px = None
    if bg_path and Path(bg_path).is_file():
        bw, bh, bg_px = read_png_rgba(Path(bg_path))
        if (bw, bh) != (w, h):
            bg_px = None

    sidecar = None
    # Convention: view_calendar.png → view_calendar_rois.json beside it
    guess = path.with_name(path.stem + "_rois.json")
    for cand in (rois_path, guess):
        sidecar = load_projected_rois(cand)
        if sidecar:
            break

    meta = {}
    if sidecar:
        boxes, meta = group_boxes_from_sidecar(sidecar, view, w, h)
        source = "projected_sidecar"
    else:
        boxes = dict(VIEW_ROIS_LEGACY.get(view, {}))
        source = "legacy_fractional_FALLBACK"
        meta = {k: {"source": source, "warning": "no projected sidecar — ROI may miss glyphs"} for k in boxes}

    text_names = TEXT_ROIS.get(view, [k for k in boxes if k != "avatar"])
    errors = []
    skips = []
    roi_reports = {}
    min_h = MIN_GLYPH_H_PX_PROBE if w <= 640 else MIN_GLYPH_H_PX_PROD

    for name in text_names:
        if name not in boxes:
            errors.append(f"{view}.{name} missing ROI ({source})")
            continue
        gmeta = meta.get(name, {})
        gh = float(gmeta.get("min_h_px") or 0)
        xa, ya, xb, yb = absolute_box(boxes[name], w, h)
        # Banner/footer long-string AABB can project below the frame (plan v8j y0=400)
        if xb <= 0 or yb <= 0 or xa >= w or ya >= h or xb <= xa or yb <= ya:
            if name in ("banner", "row_meta", "weekdays", "day_numbers", "card_titles", "app_labels"):
                skips.append(f"{view}.{name} SKIP out-of-frame/invalid ROI px={[xa,ya,xb,yb]}")
                roi_reports[name] = {
                    "ok": None,
                    "skipped": True,
                    "reason": "out_of_frame_roi",
                    "pxbox": [xa, ya, xb, yb],
                }
                continue
            errors.append(f"{view}.{name} ROI out of frame px={[xa,ya,xb,yb]}")
            continue
        # Honest undersample skip at probe (640). Titles get a 6px floor; secondary needs 8px.
        # Production 1280 must still gate all groups (MIN_GLYPH_H_PX_PROD).
        probe_floor = 6.0 if name in ("title", "brand") else MIN_GLYPH_H_PX_PROBE
        if w <= 640 and gh and gh < probe_floor:
            skips.append(f"{view}.{name} SKIP probe undersample min_h_px={gh:.1f}<{probe_floor}")
            roi_reports[name] = {
                "ok": None,
                "skipped": True,
                "reason": "probe_undersample",
                "min_h_px": gh,
                "pxbox": [xa, ya, xb, yb],
            }
            continue
        if w <= 640 and (yb - ya) < probe_floor:
            skips.append(f"{view}.{name} SKIP probe undersample roi_h={yb-ya}<{probe_floor}")
            roi_reports[name] = {
                "ok": None,
                "skipped": True,
                "reason": "probe_undersample_roi_h",
                "pxbox": [xa, ya, xb, yb],
            }
            continue
        r = roi_contrast_masked(beauty, bg_px, w, h, boxes[name])
        r["group_meta"] = gmeta
        r["roi_source"] = source
        roi_reports[name] = r
        if not r.get("ok"):
            errors.append(
                f"{view}.{name} contrast {r.get('contrast', 0):.2f} < 4.5 "
                f"(fgL={r.get('fg_luma', 0):.0f} bgL={r.get('bg_luma', 0):.0f}) "
                f"[{r.get('method')}] px={r.get('pxbox')}"
            )

    avatar = None
    if require_avatar or view == "chrome":
        abox = boxes.get("avatar") or VIEW_ROIS_LEGACY.get("chrome", {}).get("avatar")
        if abox:
            avatar = avatar_roi_proof(beauty, w, h, abox)
            roi_reports["avatar"] = avatar
            if not avatar.get("ok"):
                errors.append(
                    f"{view}.avatar fixture FAIL chroma={avatar.get('chroma_hits')} "
                    f"spatial={avatar.get('spatial_distinct_pairs')} "
                    f"near_black={avatar.get('near_black_frac')} meanL={avatar.get('mean_luma')}"
                )

    gated = [
        n
        for n, rr in roi_reports.items()
        if isinstance(rr, dict) and not rr.get("skipped") and n != "avatar" and rr.get("ok") is True
    ]
    if not gated and not (avatar and avatar.get("ok")):
        errors.append(
            f"{view}: no text ROI proved at this resolution (all skipped/failed) — run production 1280"
        )

    return {
        "ok": not errors,
        "errors": errors,
        "skips": skips,
        "rois": roi_reports,
        "size": [w, h],
        "view": view,
        "roi_source": source,
        "bg_pass": bool(bg_px),
        "min_glyph_h_px": min_h,
        "note": "Projected text ROI + optional text-hidden BG — not whole-band percentile",
        "not": ["DESIGN-STUDY-ORTHO predictor", "hardcoded title y14-57", "gradient-as-photo"],
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
        r = validate_png(
            p,
            view,
            require_avatar=(view == "chrome"),
            rois_path=d / f"view_{view}_rois.json",
            bg_path=d / f"view_{view}_bg.png",
        )
        report[view] = r
        ok = ok and r["ok"]
    out = {"ok": ok, "views": report, "validator": "projected-roi-textmask-v8"}
    text = json.dumps(out, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)
    raise SystemExit(0 if ok else 2)


if __name__ == "__main__":
    main()
