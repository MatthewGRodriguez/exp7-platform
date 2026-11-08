#!/usr/bin/env python3
"""Geometric composition gates for Exp7 DESIGN-STUDY views.

NOT a contrast checker. Independent of indep_text_contrast.py / indep_check_*.py
(those only measure worst-BG WCAG). This script covers:

  - footer/card overlap
  - label↔label overlap (cross-parent)
  - label containment in parent panel
  - state face distinguishability + ring presence

Usage:
  python3 validate_composition.py --dir <view_png_dir> [--out report.json]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Reuse gates from validate_view_pixels (single implementation)
from validate_view_pixels import (  # noqa: E402
    gate_composition,
    gate_state_distinguishability,
    read_png_rgba,
)


def main() -> int:
    ap = argparse.ArgumentParser(description="Composition / state-visibility gates (not contrast)")
    ap.add_argument("--dir", required=True)
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    d = Path(args.dir)
    report = {
        "ok": True,
        "validator": "validate_composition-v11",
        "covers": [
            "footer_card_overlap",
            "label_label_overlap",
            "containment",
            "state_face_distinguishability",
            "state_ring_presence",
        ],
        "does_not_cover": ["worst_bg_contrast", "WCAG"],
        "views": {},
    }
    for view in ("calendar", "board", "plan", "chrome"):
        png = d / f"view_{view}.png"
        rois = d / f"view_{view}_rois.json"
        if not png.exists() or not rois.exists():
            report["views"][view] = {"ok": False, "errors": ["missing png or rois"]}
            report["ok"] = False
            continue
        w, h, beauty = read_png_rgba(png)
        sidecar = json.loads(rois.read_text())
        comp = gate_composition(sidecar, w, h)
        state = gate_state_distinguishability(sidecar, beauty, w, h)
        errors = (comp.get("errors") or []) + (state.get("errors") or [])
        ok = not errors
        report["views"][view] = {
            "ok": ok,
            "errors": errors,
            "composition": comp,
            "state_visibility": state,
        }
        report["ok"] = report["ok"] and ok
        status = "PASS" if ok else "FAIL"
        print(f"{view}: {status} errors={len(errors)}")
        for e in errors[:8]:
            print(f"  - {e}")
    out = Path(args.out) if args.out else d / "validate_composition.json"
    out.write_text(json.dumps(report, indent=2))
    print(f"wrote {out} ok={report['ok']}")
    return 0 if report["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
