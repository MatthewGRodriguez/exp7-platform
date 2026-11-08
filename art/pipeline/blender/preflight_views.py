#!/usr/bin/env python3
"""Cheap Mac/cloud preflight BEFORE METAL probe: palette/text assignment + avatar asset.

Does not render Cycles. Fails if inks lack analytical ≥4.5 on design surfaces, or if
avatar photo is missing/transparent/near-black. Ortho ≠ METAL predictor.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import views_content as VC  # noqa: E402


def rel(c):
    def ch(v):
        x = v / 255.0
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4

    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])


def cr(fg, bg):
    a, b = rel(fg), rel(bg)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


def rgb255(t):
    return (int(round(t[0] * 255)), int(round(t[1] * 255)), int(round(t[2] * 255)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    bgs = {
        "white": (255, 255, 255),
        "subtle": (244, 246, 250),
        "softDisc": (238, 241, 246),
        "selWash": (232, 238, 248),
    }
    inks = {
        "INK": rgb255(VC.INK),
        "INK_SECONDARY": rgb255(VC.INK_SECONDARY),
        "INK_DISABLED": rgb255(VC.INK_DISABLED),
        "INK_ACCENT": rgb255(VC.INK_ACCENT),
    }
    errors = []
    table = {}
    for iname, fg in inks.items():
        table[iname] = {}
        for bname, bg in bgs.items():
            c = cr(fg, bg)
            table[iname][bname] = c
            # Disabled may sit on softDisc — still require ≥4.5 for camera-ready claim
            if c < 4.5:
                errors.append(f"{iname} on {bname}: {c:.2f} < 4.5")

    assets = VC.assert_assets()
    photo = Path(assets["photo"])
    if not assets["photo_exists"]:
        errors.append("avatar-photo-study.png missing")
    else:
        try:
            from PIL import Image

            im = Image.open(photo)
            if im.mode == "RGBA":
                # alpha holes → METAL black disc risk
                extrema = im.getchannel("A").getextrema()
                if extrema[0] < 255:
                    errors.append(f"avatar photo has transparency minA={extrema[0]} — use opaque RGB")
            px = list(im.convert("RGB").getdata())
            mean = [sum(p[i] for p in px) / len(px) for i in range(3)]
            mean_L = 0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]
            chroma = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 28) / len(px)
            assets["mean_rgb"] = mean
            assets["mean_luma"] = mean_L
            assets["chroma_frac"] = chroma
            if mean_L < 40:
                errors.append(f"avatar mean luma {mean_L:.1f} < 40 (black disc risk)")
            if chroma < 0.15:
                errors.append(f"avatar chroma_frac {chroma:.3f} < 0.15")
        except Exception as e:
            errors.append(f"avatar inspect: {e}")

    # Source contract: Emission strength 1, extrude 0, plane avatar
    src = Path(__file__).with_name("views_content.py").read_text()
    if "extrude = 0.0" not in src:
        errors.append("text extrude not zero")
    if "ShaderNodeEmission" not in src:
        errors.append("text must use Emission")
    if "primitive_plane_add" not in src:
        errors.append("avatar must be plane (not cylinder black-cap risk)")
    if "default_value = 2.4" in src:
        errors.append("emission strength>1 wash risk")

    report = {
        "ok": not errors,
        "errors": errors,
        "ink_contrast": table,
        "assets": assets,
        "label": "PREFLIGHT — not METAL proof; run --probe after PASS",
        "generator_hint": "front-readable-v7",
    }
    text = json.dumps(report, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)
    raise SystemExit(0 if report["ok"] else 2)


if __name__ == "__main__":
    main()
