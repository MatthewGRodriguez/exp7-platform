#!/usr/bin/env python3
"""Camera ↔ ground correspondence for Exp7 shadow fits.

Mac v3 measured image-space exposed offset ≈ 8.75 px / lift_px with panel bottom
edge motion ≈ −12.9 px / lift_px. That image-space slope is NOT the ground-plane
model h·cot(elev)≈0.3249 (design-px) or penumbra/offset model 1.44.

Do NOT adopt image-px slopes as revised lighting params. Unproject shadow far-edge
and panel contact line into ground Z=0, then fit offset/blur in scene meters.

When run inside Blender: writes camera_instrumentation.json (matrices, FOV, res).
When run offline: explains contamination and refuses to "fix" fits.json from raw
image slopes alone.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def analytical_ground(params: dict) -> dict:
    elev = math.radians(float(params["light"]["elevationDeg"]))
    size = float(params["light"]["size"])
    dist = float(params["light"]["distance"])
    return {
        "shadowOffsetPerLift_designPx": 1.0 / math.tan(elev),  # cot
        "penumbraPerLift_designPx": size / dist,
        "penumbra_over_offset": (size / dist) * math.tan(elev),
        "units": "design lift px on ground plane (analytical)",
        "status": "provisional — not replaced by Mac v3 image-space numbers",
    }


def explain_mac_v3_contamination(measured: dict) -> dict:
    """Document why image-px fit ≠ ground model without inventing a new model."""
    off = (measured.get("exposed_offset_r50") or {}).get("slope")
    pen = (measured.get("penumbra_10_90") or {}).get("slope")
    edge = (measured.get("panel_bottom_edge_motion") or {}).get("slope")
    return {
        "observed_image_offset_per_lift_px": off,
        "observed_penumbra_per_lift_px": pen,
        "observed_panel_bottom_edge_motion_per_lift_px": edge,
        "contamination_note": (
            "As lift increases, the panel's projected silhouette moves in image space "
            "(perspective). 'Exposed offset beyond panel edge' therefore mixes true "
            "shadow growth with silhouette motion. Subtracting/unprojecting both edges "
            "into Z=0 is required before comparing to cot(elev)."
        ),
        "do_not": "Write fits.json predictions from image-px slopes without unprojection",
        "next": "Use camera_instrumentation.json + shadow_lift_*.png alpha profiles on Mac",
    }


def write_camera_instrumentation(cam, out_path: Path, params: dict, res):
    """Call from generate_ui_scene while bpy/cam exist."""
    import bpy  # type: ignore
    from mathutils import Vector  # type: ignore

    scene = bpy.context.scene
    mw = cam.matrix_world.copy()
    # Ray-cast helper corners of ground plane into camera
    ground_pts = [Vector((x, y, 0.0)) for x in (-2, 0, 2) for y in (-2, 0, 2)]
    from bpy_extras.object_utils import world_to_camera_view  # type: ignore

    projected = []
    for p in ground_pts:
        co = world_to_camera_view(scene, cam, p)
        projected.append({
            "world": [p.x, p.y, p.z],
            "ndc": [co.x, co.y, co.z],
            "px": [co.x * res[0], (1.0 - co.y) * res[1]],
        })
    elev = math.radians(float(params["light"]["elevationDeg"]))
    payload = {
        "resolution": list(res),
        "lens_mm": float(cam.data.lens),
        "sensor_width_mm": float(cam.data.sensor_width),
        "camera_location": list(cam.location),
        "camera_rotation_euler": list(cam.rotation_euler),
        "matrix_world": [list(row) for row in mw],
        "ground_z": 0.0,
        "ground_grid_projected": projected,
        "analytical": analytical_ground(params),
        "mac_v3_warning": (
            "Image-space exposed offset ~8.75 px/lift includes panel edge motion "
            "~12.9 px/lift; unproject before fitting. fits remain provisional."
        ),
        "model_cot_elev": 1.0 / math.tan(elev),
    }
    out_path.write_text(json.dumps(payload, indent=2))
    return payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--params", required=True)
    ap.add_argument("--measured", default="", help="Mac lighting-fits.measured.json (image-space)")
    ap.add_argument("--out", default="", help="write calibration note JSON")
    args = ap.parse_args()
    params = json.loads(Path(args.params).read_text())
    out = {
        "analytical_ground": analytical_ground(params),
        "evidence_class": "[PROVISIONAL]",
        "adopted_as_model": False,
    }
    if args.measured:
        measured = json.loads(Path(args.measured).read_text())
        out["mac_image_space"] = explain_mac_v3_contamination(measured)
        out["verdict"] = (
            "REJECT adopting image-space slopes into fits.json until ground unprojection "
            "reconciles offset/blur with elev/size or documents a calibrated effective light."
        )
    text = json.dumps(out, indent=2)
    if args.out:
        Path(args.out).write_text(text)
    print(text)


if __name__ == "__main__":
    raise SystemExit(main() or 0)
