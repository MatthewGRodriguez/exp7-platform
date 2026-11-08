#!/usr/bin/env python3
"""Unit tests for framing/state gates (no bpy). Catches the Mac METAL fail class."""
from __future__ import annotations

import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import generate_ui_scene as gen  # noqa: E402


class StateTableValidation(unittest.TestCase):
    def setUp(self):
        self.states = json.loads((ROOT / "art/design/state-table.json").read_text())["elementStates"]

    def test_design_table_passes(self):
        r = gen.validate_state_table(self.states)
        self.assertTrue(r["ok"], r["errors"])

    def test_lift_only_pressed_fails(self):
        bad = dict(self.states)
        bad["pressed"] = dict(self.states["idle"])
        bad["pressed"]["lift"] = 0  # identical to idle
        r = gen.validate_state_table(bad)
        self.assertFalse(r["ok"])
        self.assertTrue(any("pressed" in e for e in r["errors"]))

    def test_disabled_must_differ_nonlift(self):
        bad = dict(self.states)
        bad["disabled"] = dict(self.states["idle"])
        bad["disabled"]["lift"] = 2  # lift-only — must still fail
        r = gen.validate_state_table(bad)
        self.assertFalse(r["ok"], "disabled must not be lift-only vs idle")


class FramingHeuristics(unittest.TestCase):
    """Synthetic projected metrics matching Mac fail (~120x17 in 1280x720)."""

    def test_sliver_rejected(self):
        # Emulate validate_framing thresholds without bpy
        w, h = 120.0, 17.0
        rx, ry = 1280, 720
        area_frac = (w * h) / (rx * ry)
        height_frac = h / ry
        aspect = w / h
        self.assertLess(area_frac, gen.MIN_PROJECTED_AREA_FRAC)
        self.assertLess(height_frac, gen.MIN_PROJECTED_HEIGHT_FRAC)
        self.assertGreater(aspect, gen.MAX_ASPECT)

    def test_front_readable_passes_thresholds(self):
        # Rough expected for elevated cam: ~900x550-ish panel
        w, h = 900.0, 520.0
        rx, ry = 1280, 720
        area_frac = (w * h) / (rx * ry)
        height_frac = h / ry
        aspect = w / h
        self.assertGreaterEqual(area_frac, gen.MIN_PROJECTED_AREA_FRAC)
        self.assertGreaterEqual(height_frac, gen.MIN_PROJECTED_HEIGHT_FRAC)
        self.assertTrue(gen.MIN_ASPECT <= aspect <= gen.MAX_ASPECT)

    def test_elevated_camera_constants(self):
        # Camera must not be the old grazing (0, -dist, 0.6)
        # Source inspection: make_camera_front uses z≈2.35
        src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertIn("2.35", src)
        self.assertIn("front-readable", src)
        self.assertNotIn("location=(0, -dist, 0.6)", src)


class DryRun(unittest.TestCase):
    def test_dry_run_exits_zero(self):
        import subprocess

        r = subprocess.run(
            [
                sys.executable,
                str(Path(__file__).with_name("generate_ui_scene.py")),
                "--dry-run",
                "--params",
                str(ROOT / "art/design/params.json"),
                "--states",
                str(ROOT / "art/design/state-table.json"),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        meta = json.loads(r.stdout)
        self.assertEqual(meta["generator_rev"], "front-readable-v2")
        self.assertTrue(meta["state_table_validation"]["ok"])


if __name__ == "__main__":
    unittest.main()
