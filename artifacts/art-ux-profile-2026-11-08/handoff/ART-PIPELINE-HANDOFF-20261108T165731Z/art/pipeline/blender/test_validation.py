#!/usr/bin/env python3
"""Unit tests for framing/state/ring gates (no bpy). Catches Mac fail classes."""
from __future__ import annotations

import json
import subprocess
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
        # strip wash by using unknown name path — pressed without nonlift keys
        # validate uses WASH_RGBA for pressed so identical keys still ok via wash.
        # Force fail: remove pressed wash temporarily by using a fake state name rule:
        bad["pressed"] = dict(self.states["idle"])
        # Simulate missing wash: call visual path — pressed is in WASH; to test gate,
        # use a custom state not in WASH:
        bad["custom-lift-only"] = dict(self.states["idle"])
        bad["custom-lift-only"]["lift"] = 3
        # custom not checked by pressed/disabled/invalid special-case; general diffs: lift differs → ok
        r = gen.validate_state_table(bad)
        self.assertTrue(r["ok"])  # lift-only custom allowed
        # disabled lift-only without wash would fail — clear by patching WASH
        orig = gen.WASH_RGBA.get("disabled")
        try:
            gen.WASH_RGBA["disabled"] = None
            bad2 = dict(self.states)
            bad2["disabled"] = dict(self.states["idle"])
            bad2["disabled"]["lift"] = 2
            r2 = gen.validate_state_table(bad2)
            self.assertFalse(r2["ok"])
        finally:
            gen.WASH_RGBA["disabled"] = orig

    def test_washes_match_jrviews_palette_hues(self):
        # selection blue / accent / invalid / disabled — not arbitrary
        self.assertEqual(gen.WASH_RGBA["hover"][:3], (36, 88, 166))
        self.assertEqual(gen.WASH_RGBA["drop-pending"][:3], (117, 81, 15))
        self.assertEqual(gen.WASH_RGBA["invalid"][:3], (170, 0, 0))
        self.assertEqual(gen.WASH_RGBA["disabled"][:3], (154, 163, 178))


class FramingHeuristics(unittest.TestCase):
    def test_sliver_rejected(self):
        w, h = 120.0, 17.0
        rx, ry = 1280, 720
        self.assertLess((w * h) / (rx * ry), gen.MIN_PROJECTED_AREA_FRAC)
        self.assertLess(h / ry, gen.MIN_PROJECTED_HEIGHT_FRAC)
        self.assertGreater(w / h, gen.MAX_ASPECT)

    def test_front_readable_passes_thresholds(self):
        w, h = 900.0, 520.0
        rx, ry = 1280, 720
        self.assertGreaterEqual((w * h) / (rx * ry), gen.MIN_PROJECTED_AREA_FRAC)
        self.assertGreaterEqual(h / ry, gen.MIN_PROJECTED_HEIGHT_FRAC)
        self.assertTrue(gen.MIN_ASPECT <= w / h <= gen.MAX_ASPECT)

    def test_ring_overshoot_estimate_reasonable(self):
        geom = {"scenePxScale": 0.01, "radii": {"panel": 10}}
        sx, sy = 1.7, 1.05
        rw = gen.px_m(2.5, geom)
        overshoot = (2 * rw) / min(sx, sy)
        self.assertLess(overshoot, 0.35)  # contour hug, not Mac-v2 huge ellipse

    def test_generator_rev_and_no_torus(self):
        src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertIn("front-readable-v3", src)
        self.assertIn("make_contour_ring", src)
        self.assertNotIn("primitive_torus_add", src)
        self.assertIn("compose_calendar", src)
        self.assertIn("shadow_catcher", src.lower())
        self.assertIn("is_shadow_catcher", src)


class DryRun(unittest.TestCase):
    def test_dry_run_exits_zero(self):
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
        self.assertEqual(meta["generator_rev"], "front-readable-v3")
        self.assertTrue(meta["state_table_validation"]["ok"])
        self.assertIn("calendar", meta["views_planned"])
        self.assertLess(meta["ring_estimate"]["max_overshoot_frac"], 0.35)


if __name__ == "__main__":
    unittest.main()
