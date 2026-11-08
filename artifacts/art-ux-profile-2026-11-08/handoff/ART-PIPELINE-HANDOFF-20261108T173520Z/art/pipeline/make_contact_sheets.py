#!/usr/bin/env python3
"""Write provisional SVG contact-sheet layouts (not Blender/Moho pixel evidence)."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "artifacts/art-ux-profile-2026-11-08/contact-sheets"
OUT.mkdir(parents=True, exist_ok=True)

states = json.loads((ROOT / "art/design/state-table.json").read_text())["elementStates"]
params = json.loads((ROOT / "art/design/params.json").read_text())


def state_sheet():
    cols = 5
    cell_w, cell_h = 220, 140
    keys = list(states.keys())
    rows = (len(keys) + cols - 1) // cols
    W, H = cols * cell_w + 40, rows * cell_h + 60
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        '<title>PROVISIONAL state contact layout — replace cells with Blender PNGs on Mac</title>',
        f'<rect width="{W}" height="{H}" fill="#f4f6fa"/>',
        '<text x="20" y="28" font-family="DejaVu Sans,sans-serif" font-size="14" fill="#a00">[PROVISIONAL LAYOUT] not rendered evidence</text>',
    ]
    for i, name in enumerate(keys):
        r, c = divmod(i, cols)
        x, y = 20 + c * cell_w, 44 + r * cell_h
        lift = states[name]["lift"]
        parts.append(f'<rect x="{x}" y="{y}" width="200" height="110" rx="10" fill="#fff" stroke="#8a96aa"/>')
        parts.append(
            f'<rect x="{x + 20}" y="{y + 30 - lift}" width="160" height="60" rx="8" fill="#ffffff" stroke="#75510f" '
            f'style="filter: drop-shadow(0 {max(1, lift)}px {max(1, lift * 0.5)}px rgba(0,0,0,0.18))"/>'
        )
        parts.append(f'<text x="{x + 100}" y="{y + 100}" text-anchor="middle" font-size="12" fill="#1c2333">{name} lift={lift}</text>')
    parts.append("</svg>")
    (OUT / "states-provisional.svg").write_text("\n".join(parts))


def perspective_sheet():
    W, H = 900, 320
    modes = ["1-point", "2-point", "3-point", "wrong-cam NEG"]
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">',
        '<title>PROVISIONAL perspective contact — math gates in results.json</title>',
        f'<rect width="{W}" height="{H}" fill="#fff"/>',
        '<text x="16" y="24" font-size="14" fill="#a00">[PROVISIONAL] lens '
        + str(params["camera"]["focalMmChosen"])
        + "mm recorded</text>",
    ]
    for i, m in enumerate(modes):
        x = 20 + i * 220
        parts.append(f'<rect x="{x}" y="50" width="200" height="220" fill="#f4f6fa" stroke="#8a96aa"/>')
        parts.append(f'<text x="{x + 100}" y="80" text-anchor="middle" font-size="13">{m}</text>')
        # simple box wire
        parts.append(f'<path d="M{x + 40} 200 L{x + 100} 140 L{x + 160} 200 L{x + 100} 240 Z" fill="none" stroke="#2458a6"/>')
    parts.append("</svg>")
    (OUT / "perspective-provisional.svg").write_text("\n".join(parts))


def avatar_sheet():
    modes = [("pending", "neither"), ("photo", "circle clip"), ("initials", "soft disc + text")]
    W, H = 720, 160
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}">',
        '<title>PROVISIONAL exclusive avatar modes</title>',
        f'<rect width="{W}" height="{H}" fill="#fff"/>',
        '<text x="12" y="20" font-size="12" fill="#a00">[PROVISIONAL/MOCK layout] Mac WebGPU paint is USER-HW</text>',
    ]
    for i, (mode, note) in enumerate(modes):
        x = 40 + i * 230
        parts.append(f'<rect x="{x}" y="40" width="200" height="100" fill="#f6f7f9" stroke="#dde2ec"/>')
        if mode == "photo":
            parts.append(f'<circle cx="{x + 100}" cy="90" r="28" fill="#6b8caf"/>')
        elif mode == "initials":
            parts.append(f'<circle cx="{x + 100}" cy="90" r="28" fill="#eef1f6" stroke="#8a96aa"/>')
            parts.append(f'<text x="{x + 100}" y="95" text-anchor="middle" font-size="14">MR</text>')
        else:
            parts.append(f'<circle cx="{x + 100}" cy="90" r="28" fill="none" stroke="#dde2ec" stroke-dasharray="4 3"/>')
        parts.append(f'<text x="{x + 100}" y="130" text-anchor="middle" font-size="11">{mode}: {note}</text>')
    parts.append("</svg>")
    (OUT / "avatar-exclusive-provisional.svg").write_text("\n".join(parts))


if __name__ == "__main__":
    state_sheet()
    perspective_sheet()
    avatar_sheet()
    print("wrote", list(OUT.glob("*.svg")))
