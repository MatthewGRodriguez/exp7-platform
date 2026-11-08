#!/usr/bin/env python3
"""Cheap orthographic DESIGN-STUDY view proofs (Pillow) — NOT Blender METAL, NOT WebGPU.

Generates readable calendar/board/plan/chrome rasters with ≥4.5 contrast text and a
visible avatar so Mac workers can compare intent before expensive Cycles. Labeled clearly.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
ASSETS = Path(__file__).resolve().parent / "assets"
OUT_DEFAULT = ROOT / "artifacts/art-ux-profile-2026-11-08/qa/ortho-preview"


def font(size):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ):
        if Path(p).is_file():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def contrast_ok(fg, bg):
    def L(c):
        def chan(v):
            x = v / 255.0
            return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4

        return 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2])

    a, b = L(fg), L(bg)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


def rounded_rect(draw, xy, r, fill, outline=None, width=2):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def draw_calendar(path: Path):
    W, H = 1280, 720
    bg = (244, 246, 250)
    surface = (255, 255, 255)
    text = (28, 35, 51)
    muted = (73, 85, 106)
    accent = (117, 81, 15)
    selection = (36, 88, 166)
    invalid = (170, 0, 0)
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    assert contrast_ok(text, bg) >= 4.5
    d.text((48, 36), "November 2026", fill=text, font=font(48))
    d.text((48, 96), "Calendar · DESIGN-STUDY-ORTHO (not Blender METAL / not WebGPU)", fill=muted, font=font(22))
    # weekdays + grid
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    x0, y0, cw, ch, gap = 48, 150, 160, 100, 12
    for i, wd in enumerate(days):
        d.text((x0 + i * (cw + gap) + 40, y0), wd, fill=muted, font=font(20))
    states = [
        None, None, "selected", "focus", "pressed", None, "disabled",
        None, "invalid", None, "drop-pending", None, None, None,
    ]
    n = 1
    for row in range(4):
        for col in range(7):
            x = x0 + col * (cw + gap)
            y = y0 + 36 + row * (ch + gap)
            st = states[(row * 7 + col) % len(states)]
            fill = surface
            outline = (138, 150, 170)
            ow = 2
            if st == "selected":
                fill, outline, ow = (232, 238, 248), accent, 4
            elif st == "focus":
                fill, outline, ow = surface, selection, 5
            elif st == "pressed":
                fill, outline, ow = (244, 246, 250), selection, 3
            elif st == "invalid":
                outline, ow = invalid, 5
            elif st == "drop-pending":
                fill, outline, ow = (244, 246, 250), accent, 5
            elif st == "disabled":
                fill, outline = (238, 241, 246), (154, 163, 178)
            rounded_rect(d, (x, y, x + cw, y + ch), 10, fill, outline, ow)
            tc = muted if st == "disabled" else text
            d.text((x + 16, y + 28), str(n), fill=tc, font=font(28))
            n += 1
    d.text((48, H - 40), "Full title visible · contrast≥4.5 · orthographic layout proof", fill=muted, font=font(18))
    im.save(path)
    return {"path": str(path), "contrast_title": contrast_ok(text, bg)}


def draw_chrome(path: Path):
    W, H = 1280, 720
    bg = (244, 246, 250)
    text = (28, 35, 51)
    muted = (73, 85, 106)
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    rounded_rect(d, (40, 280, W - 40, 400), 8, (255, 255, 255), (138, 150, 170), 2)
    d.text((60, 310), "Exp7", fill=text, font=font(40))
    for i, lab in enumerate(["Exp7", "Budget", "Atlas"]):
        x = 220 + i * 160
        rounded_rect(d, (x, 310, x + 140, 370), 8, (232, 238, 248) if i == 0 else (255, 255, 255), (36, 88, 166) if i == 0 else (138, 150, 170), 3 if i == 0 else 2)
        d.text((x + 28, 325), lab, fill=text, font=font(22))
    for i, lab in enumerate(["Cal", "Board", "Plan"]):
        x = 720 + i * 110
        rounded_rect(d, (x, 318, x + 95, 362), 6, (232, 238, 248) if i == 0 else (255, 255, 255), (117, 81, 15) if i == 0 else (138, 150, 170), 3 if i == 0 else 2)
        d.text((x + 22, 328), lab, fill=text, font=font(18))
    av = ASSETS / "avatar-photo-study.png"
    if av.is_file():
        a = Image.open(av).convert("RGBA").resize((72, 72))
        # circular mask
        mask = Image.new("L", (72, 72), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, 71, 71), fill=255)
        im.paste(a, (W - 130, 304), mask)
    d.text((60, 430), "DESIGN-STUDY-ORTHO chrome · visible avatar photo-study", fill=muted, font=font(20))
    d.text((60, 470), "Not Blender METAL · Not Safari WebGPU acceptance", fill=muted, font=font(18))
    im.save(path)
    return {"path": str(path), "avatar": av.is_file()}


def draw_board(path: Path):
    W, H = 1280, 720
    bg = (244, 246, 250)
    text = (28, 35, 51)
    muted = (73, 85, 106)
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    d.text((48, 36), "Board · Expenses", fill=text, font=font(48))
    d.text((48, 96), "DESIGN-STUDY-ORTHO", fill=muted, font=font(22))
    cols = ["Inbox", "Active", "Blocked"]
    for ci, name in enumerate(cols):
        x = 48 + ci * 400
        d.text((x, 150), name, fill=text, font=font(28))
        for ri, (title, amt) in enumerate([("Groceries", "$84.20"), ("Transit", "$120"), ("Rent", "$1,450")]):
            y = 200 + ri * 140
            rounded_rect(d, (x, y, x + 340, y + 110), 10, (255, 255, 255), (138, 150, 170), 2)
            d.text((x + 20, y + 24), title, fill=text, font=font(26))
            d.text((x + 20, y + 64), amt, fill=(117, 81, 15), font=font(22))
    im.save(path)
    return {"path": str(path)}


def draw_plan(path: Path):
    W, H = 1280, 720
    bg = (244, 246, 250)
    text = (28, 35, 51)
    muted = (73, 85, 106)
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    d.text((48, 36), "Plan · Dependencies", fill=text, font=font(48))
    d.text((48, 96), "DESIGN-STUDY-ORTHO", fill=muted, font=font(22))
    rows = [
        ("1. Kickoff brief", "selected", (117, 81, 15)),
        ("2. Vendor shortlist", "focus", (36, 88, 166)),
        ("3. Budget gate", "hover", (138, 150, 170)),
        ("4. Ship checklist", "idle", (138, 150, 170)),
        ("5. Archived path", "disabled", (154, 163, 178)),
    ]
    for i, (title, st, outline) in enumerate(rows):
        y = 160 + i * 95
        fill = (238, 241, 246) if st == "disabled" else (255, 255, 255)
        rounded_rect(d, (48, y, W - 48, y + 80), 10, fill, outline, 4 if st in ("selected", "focus") else 2)
        tc = muted if st == "disabled" else text
        d.text((72, y + 22), title, fill=tc, font=font(28))
    im.save(path)
    return {"path": str(path)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(OUT_DEFAULT))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    report = {
        "label": "DESIGN-STUDY-ORTHO",
        "not": ["Blender METAL", "Safari WebGPU", "GPU acceptance"],
        "views": {
            "calendar": draw_calendar(out / "view_calendar_ortho.png"),
            "board": draw_board(out / "view_board_ortho.png"),
            "plan": draw_plan(out / "view_plan_ortho.png"),
            "chrome": draw_chrome(out / "view_chrome_ortho.png"),
        },
    }
    # pixel validate ortho proofs
    from validate_view_pixels import validate_png

    pix = {}
    for name in ("calendar", "board", "plan", "chrome"):
        pix[name] = validate_png(out / f"view_{name}_ortho.png", name, require_avatar=(name == "chrome"), min_dark=200)
    report["pixel_validation"] = pix
    report["ok"] = all(v.get("ok") for v in pix.values())
    (out / "ortho-preview.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report["ok"] else 2)


if __name__ == "__main__":
    main()
