#!/usr/bin/env python3
"""Unit tests for framing/state/ring/content gates (no bpy)."""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import generate_ui_scene as gen  # noqa: E402
import views_content as VC  # noqa: E402
import calibrate_shadow_ground as cal  # noqa: E402


class StateTableValidation(unittest.TestCase):
    def setUp(self):
        self.states = json.loads((ROOT / "art/design/state-table.json").read_text())["elementStates"]

    def test_design_table_passes(self):
        r = gen.validate_state_table(self.states)
        self.assertTrue(r["ok"], r["errors"])

    def test_drop_pending_not_caution(self):
        self.assertEqual(self.states["drop-pending"]["ring"], "gold")
        self.assertEqual(self.states["invalid"]["ring"], "caution")
        self.assertNotEqual(self.states["drop-pending"]["ring"], self.states["invalid"]["ring"])

    def test_caution_drop_pending_fails_gate(self):
        bad = dict(self.states)
        bad["drop-pending"] = dict(self.states["drop-pending"])
        bad["drop-pending"]["ring"] = "caution"
        r = gen.validate_state_table(bad)
        self.assertFalse(r["ok"])

    def test_pressed_has_ring_and_scale(self):
        p = self.states["pressed"]
        self.assertEqual(p["ring"], "focus")
        self.assertLess(float(p["scale"]), 0.99)
        self.assertEqual(p["border"], "selection")

    def test_disabled_opacity(self):
        self.assertLess(float(self.states["disabled"]["opacity"]), 0.5)


class FramingHeuristics(unittest.TestCase):
    def test_sliver_rejected(self):
        w, h = 120.0, 17.0
        rx, ry = 1280, 720
        self.assertLess((w * h) / (rx * ry), gen.MIN_PROJECTED_AREA_FRAC)
        self.assertLess(h / ry, gen.MIN_PROJECTED_HEIGHT_FRAC)

    def test_no_torus_v4(self):
        src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertIn("front-readable-v4", src)
        self.assertNotIn("primitive_torus_add", src)
        self.assertIn("views_content", src)
        self.assertIn("--only", src)


class ViewsContent(unittest.TestCase):
    def test_assets_exist(self):
        self.assertTrue((Path(__file__).parent / "assets" / "avatar-design-study.png").is_file())
        self.assertTrue((Path(__file__).parent / "assets" / "avatar-photo-study.png").is_file())

    def test_validate_view_content_rejects_empty(self):
        inv = {"texts": 0, "avatars": 0, "panels": 1, "names": []}
        r = VC.validate_view_content(inv, "calendar")
        self.assertFalse(r["ok"])

    def test_validate_chrome_needs_avatar(self):
        inv = {"texts": 20, "avatars": 0, "panels": 8, "names": []}
        r = VC.validate_view_content(inv, "chrome")
        self.assertFalse(r["ok"])


class ShadowCalibration(unittest.TestCase):
    def test_rejects_adopting_image_slopes(self):
        params = json.loads((ROOT / "art/design/params.json").read_text())
        measured = {
            "exposed_offset_r50": {"slope": 8.75},
            "penumbra_10_90": {"slope": 4.0},
            "panel_bottom_edge_motion": {"slope": -12.87},
        }
        note = cal.explain_mac_v3_contamination(measured)
        self.assertIn("unproject", note["contamination_note"].lower() + note["do_not"].lower())
        g = cal.analytical_ground(params)
        self.assertAlmostEqual(g["shadowOffsetPerLift_designPx"], 0.3249, places=3)


class DryRun(unittest.TestCase):
    def test_dry_run_v4(self):
        r = subprocess.run(
            [
                sys.executable,
                str(Path(__file__).with_name("generate_ui_scene.py")),
                "--dry-run",
                "--params",
                str(ROOT / "art/design/params.json"),
                "--states",
                str(ROOT / "art/design/state-table.json"),
                "--only",
                "views",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        meta = json.loads(r.stdout)
        self.assertEqual(meta["generator_rev"], "front-readable-v4")
        self.assertTrue(meta["state_table_validation"]["ok"])
        self.assertTrue(meta["semantic_rings"]["ok"])
        self.assertIn("views", meta["only"])


class MohoScripts(unittest.TestCase):
    def test_create_draws_shapes_not_empty_scaffold(self):
        src = (ROOT / "art/pipeline/moho/scripts/CreateExp7ArtComparison.lua").read_text()
        self.assertIn("CreateShape", src)
        self.assertIn("CountShapes", src)
        self.assertIn("empty_layer", src)
        self.assertIn("drop-pending", src)
        self.assertIn("PAL.accent", src)

    def test_render_prefers_cli_r(self):
        src = (ROOT / "art/pipeline/moho/scripts/RenderExp7Preview.lua").read_text()
        self.assertIn("DO_NOT_FileRender", src)
        self.assertIn("-r", src)


if __name__ == "__main__":
    unittest.main()
