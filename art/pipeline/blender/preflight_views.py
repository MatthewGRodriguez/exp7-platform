#!/usr/bin/env python3
"""Cheap Mac/cloud preflight BEFORE METAL probe: palette/text assignment + avatar fixture.

Does not render Cycles. Fails if inks lack analytical ≥4.5 on design surfaces, or if
avatar fixture is missing/near-black/gradient-only. Ortho ≠ METAL predictor.

PIL is NOT required — uses stdlib PNG decode (Mac python3 often lacks PIL; do not
blind-pip-install). Prefer Blender's bundled python for image checks if needed:
  /Applications/Blender.app/Contents/Resources/4.2/python/bin/python3.11 this.py
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import views_content as VC  # noqa: E402
from validate_view_pixels import read_png_rgba, luma  # noqa: E402


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


def inspect_avatar_png(path: Path) -> dict:
    """Stdlib PNG inspect — no PIL."""
    w, h, px = read_png_rgba(path)
    n = w * h
    mean = [0.0, 0.0, 0.0]
    chroma = 0
    # 3x3 cell means for anti-gradient check
    cells = [[0.0, 0.0, 0.0, 0] for _ in range(9)]
    for y in range(h):
        for x in range(w):
            i = (y * w + x) * 4
            r, g, b = px[i], px[i + 1], px[i + 2]
            mean[0] += r
            mean[1] += g
            mean[2] += b
            if max(r, g, b) - min(r, g, b) > 28:
                chroma += 1
            cx = min(2, x * 3 // w)
            cy = min(2, y * 3 // h)
            ci = cy * 3 + cx
            cells[ci][0] += r
            cells[ci][1] += g
            cells[ci][2] += b
            cells[ci][3] += 1
    mean = [m / n for m in mean]
    cell_means = []
    for c in cells:
        if c[3]:
            cell_means.append((c[0] / c[3], c[1] / c[3], c[2] / c[3]))
    distinct = 0
    for i, a in enumerate(cell_means):
        for b in cell_means[i + 1 :]:
            if abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2]) > 60:
                distinct += 1
    return {
        "size": [w, h],
        "mean_rgb": mean,
        "mean_luma": luma(*mean),
        "chroma_frac": chroma / n,
        "spatial_distinct_pairs": distinct,
        "decoder": "stdlib-validate_view_pixels.read_png_rgba",
        "pil_required": False,
    }


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
            if c < 4.5:
                errors.append(f"{iname} on {bname}: {c:.2f} < 4.5")

    assets = VC.assert_assets()
    fixture = Path(assets.get("active") or assets["photo"])
    if not fixture.is_file():
        errors.append("avatar fixture/png missing")
    else:
        try:
            insp = inspect_avatar_png(fixture)
            assets.update(insp)
            if insp["mean_luma"] < 40:
                errors.append(f"avatar mean luma {insp['mean_luma']:.1f} < 40 (black disc risk)")
            if insp["chroma_frac"] < 0.15:
                errors.append(f"avatar chroma_frac {insp['chroma_frac']:.3f} < 0.15")
            if insp["spatial_distinct_pairs"] < 3:
                errors.append(
                    f"avatar spatial_distinct_pairs {insp['spatial_distinct_pairs']} < 3 "
                    "(gradient-ellipse / not illustrated fixture)"
                )
        except Exception as e:
            errors.append(
                f"avatar inspect: {e} — use Blender bundled python or ensure PNG readable; "
                "do not pip-install PIL on Mac for this gate"
            )

    # Source contract: Emission strength 1, extrude 0, plane avatar, linear conversion
    src = Path(__file__).with_name("views_content.py").read_text()
    if "extrude = 0.0" not in src:
        errors.append("text extrude not zero")
    if "ShaderNodeEmission" not in src:
        errors.append("text must use Emission")
    if "primitive_plane_add" not in src:
        errors.append("avatar must be plane (not cylinder black-cap risk)")
    if "default_value = 2.4" in src:
        errors.append("emission strength>1 wash risk")
    if "emission_rgb" not in src or "srgb_to_linear" not in src:
        errors.append("emission must convert display sRGB → scene-linear")
    if "illustrated-fixture" not in src:
        errors.append("avatar must be labeled illustrated fixture (not gradient-as-photo)")

    gen_src = Path(__file__).with_name("generate_ui_scene.py").read_text()
    if 'view_transform = "Standard"' not in gen_src:
        errors.append("generator must set Standard view_transform (AgX washes UI ink)")
    if "write_projected_rois" not in gen_src:
        errors.append("generator must write projected text ROI sidecar")
    if "render_text_hidden_bg" not in gen_src:
        errors.append("generator must render text-hidden BG companion pass")

    report = {
        "ok": not errors,
        "errors": errors,
        "ink_contrast": table,
        "assets": assets,
        "label": "PREFLIGHT — not METAL proof; run --probe after PASS",
        "generator_hint": "front-readable-v8",
        "tooling": {
            "pil_required": False,
            "png_decoder": "validate_view_pixels.read_png_rgba",
            "blender_python_hint": (
                "/Applications/Blender.app/Contents/Resources/4.2/python/bin/python3.11"
            ),
            "no_blind_mac_pip": True,
        },
        "emission_linear_check": {
            "INK_display": list(VC.INK),
            "INK_scene_linear": list(VC.emission_rgb(VC.INK)),
        },
    }
    text = json.dumps(report, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)
    raise SystemExit(0 if report["ok"] else 2)


if __name__ == "__main__":
    main()
