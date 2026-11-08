#!/usr/bin/env python3
"""Gates for framing/state/light/pixels/Moho (no bpy required for most)."""
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


class StateTable(unittest.TestCase):
    def setUp(self):
        self.states = json.loads((ROOT / "art/design/state-table.json").read_text())["elementStates"]

    def test_passes(self):
        self.assertTrue(gen.validate_state_table(self.states)["ok"])

    def test_drop_pending_gold_not_caution(self):
        self.assertEqual(self.states["drop-pending"]["ring"], "gold")
        self.assertNotEqual(self.states["drop-pending"]["ring"], self.states["invalid"]["ring"])

    def test_pressed_focus_share_selection_hue_ok(self):
        # Same blue wash family is OK — geometry differs
        self.assertEqual(self.states["pressed"]["ring"], "focus")
        self.assertLess(float(self.states["pressed"]["scale"]), 1.0)
        self.assertEqual(self.states["focus"]["ring"], "focus")
        self.assertEqual(float(self.states["focus"]["scale"]), 1.0)


class LightUnity(unittest.TestCase):
    def test_make_light_source_uses_params_ratio(self):
        src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertNotIn("dist = 4.5", src)
        self.assertNotIn("* 0.004", src)
        self.assertIn('float(light["distance"]) * scale', src)
        self.assertIn('float(light["size"]) * scale', src)
        params = json.loads((ROOT / "art/design/params.json").read_text())
        ratio = params["light"]["size"] / params["light"]["distance"]
        self.assertAlmostEqual(ratio, 0.4667, places=3)


class FramingHelpers(unittest.TestCase):
    def test_frame_camera_helper_exists(self):
        self.assertTrue(hasattr(gen, "frame_camera_to_objects"))
        src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertIn("frame_camera_to_objects", src)
        self.assertIn("VIEW_FRAMING_FAIL", src)
        self.assertIn("VIEW_PIXEL_FAIL", src)


class ViewsContent(unittest.TestCase):
    def test_readable_text_constants(self):
        self.assertGreaterEqual(VC.TITLE_SIZE, 0.22)
        self.assertGreaterEqual(VC.BODY_SIZE, 0.08)
        self.assertGreaterEqual(VC.DAY_SIZE, 0.10)

    def test_assets(self):
        self.assertTrue((Path(__file__).parent / "assets/avatar-photo-study.png").is_file())


class MohoLoop(unittest.TestCase):
    def test_animate_closes_loop(self):
        src = (ROOT / "art/pipeline/moho/scripts/AnimateExp7States.lua").read_text()
        self.assertIn("loop_closure", src)
        self.assertIn("END", src)
        self.assertIn("f=0 and f=", src)
        self.assertIn("loop_closed", src)


class DryRun(unittest.TestCase):
    def test_v7_dry_run(self):
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
        )
        self.assertEqual(r.returncode, 0, r.stderr)
        meta = json.loads(r.stdout)
        self.assertEqual(meta["generator_rev"], "front-readable-v7")


class UnlitText(unittest.TestCase):
    def test_make_text_is_emission_flat(self):
        src = Path(__file__).with_name("views_content.py").read_text()
        self.assertIn("ShaderNodeEmission", src)
        self.assertIn("extrude = 0.0", src)
        self.assertIn("visible_shadow = False", src)
        self.assertNotIn("default_value = 2.4", src)
        self.assertIn('em.inputs["Strength"].default_value = 1.0', src)
        self.assertIn("primitive_plane_add", src)
        self.assertIn("set_caster_invisible_to_camera", Path(__file__).with_name("generate_ui_scene.py").read_text())
        # Secondary uses dark ink family — not pale muted
        self.assertLess(VC.INK_SECONDARY[0], 0.20)
        self.assertLess(VC.INK_DISABLED[0], 0.30)

    def test_preflight_and_semantic_validator(self):
        r = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("preflight_views.py"))],
            capture_output=True,
            text=True,
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        vsrc = Path(__file__).with_name("validate_view_pixels.py").read_text()
        self.assertIn("darkest8%", vsrc)
        self.assertIn("Semantic ROI", vsrc)
        self.assertNotIn("min_dark=400", vsrc)


class OrthoPreview(unittest.TestCase):
    def test_ortho_pixel_gates(self):
        out = Path("/tmp/exp7-ortho-test")
        r = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("preview_views_ortho.py")), "--out", str(out)],
            capture_output=True,
            text=True,
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        report = json.loads((out / "ortho-preview.json").read_text())
        self.assertTrue(report["ok"], report)
        self.assertTrue((out / "view_calendar_ortho.png").is_file())
        self.assertTrue((out / "view_chrome_ortho.png").is_file())
        # Ortho is NOT METAL predictor (Mac v5)
        self.assertEqual(report["label"], "DESIGN-STUDY-ORTHO")


if __name__ == "__main__":
    unittest.main()
