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
        # Face-budgeted type (must fit panel half-extents); steep ortho maps to ≥10px
        self.assertGreaterEqual(VC.TITLE_SIZE, 0.14)
        self.assertLessEqual(VC.TITLE_SIZE, 0.28)
        self.assertGreaterEqual(VC.BODY_SIZE, 0.07)
        self.assertLessEqual(VC.BODY_SIZE, 0.24)
        self.assertGreaterEqual(VC.DAY_SIZE, 0.06)
        self.assertIn("Matrix.Identity(4)", Path(__file__).with_name("views_content.py").read_text())
        gen_src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertIn("location=False, rotation=False, scale=True", gen_src)
        self.assertIn("ortho_mesh_extent_v10_steep", gen_src)
        self.assertIn("fill_h", gen_src)
        # Half-size mesh bug: scale must be full sx (cube size=1), not sx/2
        self.assertIn("obj.scale = (float(sx), float(sy), float(sz))", gen_src)
        self.assertNotIn("obj.scale = (sx / 2, sy / 2, sz / 2)", gen_src)

    def test_assets(self):
        root = Path(__file__).parent / "assets"
        self.assertTrue((root / "avatar-fixture-study.png").is_file() or (root / "avatar-photo-study.png").is_file())
        self.assertIn("illustrated-fixture", VC.assert_assets().get("kind", ""))

    def test_emission_srgb_to_linear(self):
        lin = VC.emission_rgb(VC.INK)
        self.assertLess(lin[0], VC.INK[0] * 0.2)  # display 0.078 → ~0.007 linear
        self.assertEqual(VC.emission_rgb((1.0, 1.0, 1.0)), (1.0, 1.0, 1.0))


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
        self.assertEqual(meta["generator_rev"], "front-readable-v10")


class UnlitText(unittest.TestCase):
    def test_make_text_is_emission_flat(self):
        src = Path(__file__).with_name("views_content.py").read_text()
        self.assertIn("ShaderNodeEmission", src)
        self.assertIn("extrude = 0.0", src)
        self.assertIn("visible_shadow = False", src)
        self.assertNotIn("default_value = 2.4", src)
        self.assertIn('em.inputs["Strength"].default_value = 1.0', src)
        self.assertIn("emission_rgb", src)
        self.assertIn("srgb_to_linear", src)
        self.assertIn("primitive_plane_add", src)
        gen_src = Path(__file__).with_name("generate_ui_scene.py").read_text()
        self.assertIn("set_caster_invisible_to_camera", gen_src)
        self.assertIn('view_transform = "Standard"', gen_src)
        self.assertIn("write_projected_rois", gen_src)
        self.assertIn("render_text_hidden_bg", gen_src)
        self.assertIn("push_in_steps", gen_src)
        # Secondary uses dark ink family — not pale muted
        self.assertLess(VC.INK_SECONDARY[0], 0.20)
        self.assertLess(VC.INK_DISABLED[0], 0.30)

    def test_preflight_and_projected_validator(self):
        r = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("preflight_views.py"))],
            capture_output=True,
            text=True,
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        pref = json.loads(r.stdout)
        self.assertFalse(pref["tooling"]["pil_required"])
        vsrc = Path(__file__).with_name("validate_view_pixels.py").read_text()
        self.assertIn("projected_sidecar", vsrc)
        self.assertIn("textmask_vs_hiddenBG", vsrc)
        self.assertIn("projected-roi-textmask-v9-adversarial", vsrc)
        self.assertIn("indep_worst_bg", vsrc)
        self.assertIn("gate_object_layout", vsrc)
        self.assertIn("parent_to_panel", Path(__file__).with_name("views_content.py").read_text())
        self.assertNotIn("min_dark=400", vsrc)
        # Hardcoded y14–57 title ROI must not be the primary path
        self.assertNotIn("(0.04, 0.04, 0.55, 0.16)", vsrc)

    def test_diagnose_script_exists(self):
        p = Path(__file__).with_name("diagnose_view_rootcause.py")
        self.assertTrue(p.is_file())
        src = p.read_text()
        self.assertIn("projected_640x360", src)
        self.assertIn("view_transform", src)


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
