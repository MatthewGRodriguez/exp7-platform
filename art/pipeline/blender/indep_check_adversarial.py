#!/usr/bin/env python3
"""Adversarial *contrast-only* checker (alias of indep_text_contrast.py).

IMPORTANT: This script does NOT check crop, occlusion, footer/card overlap,
label containment, or state-ring distinguishability. Those gates live in
validate_view_pixels.py / validate_composition.py.

Kept as a named entry point so Mac runs that invoke indep_check_adversarial.py
still get the independent worst-BG contrast measurement without false coverage claims.
"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

print(
    "NOTE: indep_check_adversarial.py = contrast-only (worst-BG WCAG). "
    "For composition/state gates run validate_composition.py.",
    file=sys.stderr,
)
target = Path(__file__).with_name("indep_text_contrast.py")
# Preserve argv for the contrast script (dir, out.json)
sys.argv[0] = str(target)
runpy.run_path(str(target), run_name="__main__")
