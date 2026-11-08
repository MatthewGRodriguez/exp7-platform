#!/usr/bin/env python3
"""Exp7 UI art Blender generator — Blender 4.2.1 LTS + Cycles METAL.

Rev front-readable-v4 (after Mac v3 quality FAIL on views/Moho/measure):
  - Contour rings retained; drop-pending uses gold/accent (not invalid red).
  - Pressed/disabled use stronger design-table scale/opacity + selection ring.
  - Views are full-frame DESIGN-STUDY compositions with real typography + avatar
    assets (labeled ≠ live WebGPU). Content validation rejects empty bars.
  - Shadow: image-px ≠ ground-plane; instrumentation for unprojection (fits stay
    provisional — do not adopt invalid image-space slopes as model).
  - --only views|states|lift|shadow|tilt|persp for focused Mac re-runs.

Mac:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python this.py -- \\
    --params art/design/params.json --states art/design/state-table.json \\
    --scratch /Users/user-rodri/ArtScratch/exp7-art --device METAL --samples 64

One heavy job: ART_SCRATCH/blender/.heavy.lock
Does not write Blender user preferences.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
import time
import traceback
from pathlib import Path

try:
    import bpy  # type: ignore
    from mathutils import Vector  # type: ignore
except ImportError:
    bpy = None
    Vector = None

DEFAULT_SCRATCH = "/Users/user-rodri/ArtScratch/exp7-art"
GENERATOR_REV = "front-readable-v9"

# Ensure sibling import works inside Blender --python
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    import views_content as VC
except ImportError:
    VC = None

MIN_PROJECTED_AREA_FRAC = 0.04
MIN_PROJECTED_HEIGHT_FRAC = 0.12
MIN_ASPECT = 0.35
MAX_ASPECT = 4.0
MIN_STATE_DIFF_KEYS = 1

# Same washes as art/src/jrviews-ux-states.js (palette-derived; not arbitrary hues)
WASH_RGBA = {
    "idle": None,
    "hover": (36, 88, 166, 14),
    "focus": (36, 88, 166, 18),
    "pressed": (36, 88, 166, 40),  # selection wash — stronger than hover; still palette
    "selected": (36, 88, 166, 32),
    "dragging": (36, 88, 166, 20),
    "drop-pending": (117, 81, 15, 28),  # accent — not invalid red
    "invalid": (170, 0, 0, 22),
    "settling": (36, 88, 166, 12),
    "disabled": (154, 163, 178, 96),  # stronger mute — still disabled gray, ROI-visible
}


def log(msg: str) -> None:
    sys.stderr.write(msg + "\n")
    sys.stderr.flush()


def parse_args(argv=None):
    if argv is None:
        argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser(description="Exp7 UI Blender 4.2.1 METAL generator (v3)")
    p.add_argument("--params", required=True)
    p.add_argument("--states", required=True)
    p.add_argument("--scratch", default=os.environ.get("ART_SCRATCH", DEFAULT_SCRATCH))
    p.add_argument("--stage", default="ui-states-v7")
    p.add_argument("--run-id", default=None)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--resolution", default="1280x720")
    p.add_argument("--device", default="METAL", choices=["METAL", "CPU"])
    p.add_argument("--states-filter", default="")
    p.add_argument("--focal-mm", type=float, default=None)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--skip-lock", action="store_true")
    p.add_argument("--skip-validate", action="store_true")
    p.add_argument("--skip-views", action="store_true")
    p.add_argument("--skip-shadow-passes", action="store_true")
    p.add_argument(
        "--probe",
        action="store_true",
        help="Focused preflight: 640x360 / 8 samples (still runs pixel gates). Prefer before full METAL.",
    )
    p.add_argument(
        "--continue-on-view-fail",
        action="store_true",
        default=True,
        help="Render remaining views after a pixel fail (default True; Mac v5 aborted board/plan/chrome)",
    )
    p.add_argument("--halt-on-view-fail", action="store_true", help="Stop at first VIEW_PIXEL_FAIL")
    p.add_argument(
        "--only",
        default="",
        help="Comma list: views,states,lift,shadow,shadow-cal,tilt,persp",
    )
    return p.parse_args(argv)


def only_set(args) -> set:
    raw = [x.strip() for x in (args.only or "").split(",") if x.strip()]
    s = set(raw) if raw else {"views", "states", "lift", "shadow", "tilt", "persp"}
    if "shadow-cal" in s:
        s.add("shadow")
    return s


def set_caster_invisible_to_camera(prefix: str = "UIPanel_"):
    """Panel casts shadows but is invisible to camera — full penumbra measurable (Mac v5)."""
    assert bpy is not None
    for o in bpy.data.objects:
        if not o.name.startswith(prefix):
            continue
        try:
            o.visible_camera = False
            o.visible_shadow = True
            o.visible_diffuse = True
            o.visible_glossy = True
        except Exception as e:
            log(f"WARN caster visibility {o.name}: {e}")


def hex_rgba(h: str, a: float = 1.0):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r = int(h[0:2], 16) / 255.0
    g = int(h[2:4], 16) / 255.0
    b = int(h[4:6], 16) / 255.0
    return (r, g, b, float(a))


def mix_rgba(a, b, t: float):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(4))


def over_wash(base, wash):
    """Porter-Duff over; wash is 0-255 RGBA from JRViews."""
    if not wash:
        return base
    a = wash[3] / 255.0
    return (
        (wash[0] / 255.0) * a + base[0] * (1 - a),
        (wash[1] / 255.0) * a + base[1] * (1 - a),
        (wash[2] / 255.0) * a + base[2] * (1 - a),
        base[3],
    )


def build_palette(params: dict) -> dict:
    p = dict(params["palette"])
    surface = hex_rgba(p["surface"])
    selection = hex_rgba(p["selection"])
    accent = hex_rgba(p["accent"])
    invalid = hex_rgba(p["invalid"])
    p["_rgba"] = {
        "surface": surface,
        "subtle": hex_rgba(p["subtle"]),
        "border": hex_rgba(p["border"]),
        "selection": selection,
        "accent": accent,
        "invalid": invalid,
        "disabled": hex_rgba(p["disabled"]),
        "selectionWash": mix_rgba(surface, selection, 0.14),
        "softDisc": hex_rgba(p.get("softDisc", "#eef1f6")),
        "text": hex_rgba(p["text"]),
        "muted": hex_rgba(p["muted"]),
        "critical": hex_rgba(p.get("critical", "#fff0e7")),
        "moderate": hex_rgba(p.get("moderate", "#fff6dc")),
        "low": hex_rgba(p.get("low", "#e8f5ef")),
    }
    p["_ring"] = {
        "none": None,
        "focus": selection,
        "gold": accent,
        "caution": invalid,
    }
    return p


def px_m(px: float, geom: dict) -> float:
    """Design px → scene meters. 1 design-px ≈ 0.01 m keeps barH≈0.44 readable."""
    return float(px) * float(geom.get("scenePxScale", 0.01))


def panel_radius_m(geom: dict, sx: float, sy: float) -> float:
    r = px_m(float(geom.get("radii", {}).get("panel", 10)), geom)
    return min(r, 0.45 * min(sx, sy))


def acquire_lock(scratch: Path, skip: bool):
    lock = scratch / "blender" / ".heavy.lock"
    lock.parent.mkdir(parents=True, exist_ok=True)
    if skip:
        return None
    if lock.exists():
        try:
            age = time.time() - lock.stat().st_mtime
            body = lock.read_text()
        except OSError:
            age, body = 0, ""
        raise SystemExit(f"BLOCKED: heavy lock held ({lock}) age={age:.0f}s body={body!r}")
    lock.write_text(json.dumps({"pid": os.getpid(), "started": time.time()}))
    return lock


def release_lock(lock):
    if lock and lock.exists():
        try:
            lock.unlink()
        except OSError:
            pass


def configure_color_management_ui() -> dict:
    """DESIGN-STUDY UI ink fidelity: Standard view transform (not AgX).

    Blender 4.2 defaults to AgX, which compresses display whites (~255→197) and
    remaps emission. Emission Color is scene-linear — pair Standard with
    views_content.emission_rgb() (sRGB display-intent → linear).
    """
    assert bpy is not None
    scene = bpy.context.scene
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = "Standard"
    try:
        scene.view_settings.look = "None"
    except Exception:
        pass
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    info = {
        "view_transform": scene.view_settings.view_transform,
        "look": scene.view_settings.look,
        "display_device": scene.display_settings.display_device,
        "reason": "UI emission ink fidelity; AgX washes design-study text",
    }
    log(f"COLOR_MGMT {json.dumps(info)}")
    return info


def configure_cycles_metal(samples: int, device: str) -> dict:
    assert bpy is not None
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(samples)
    # Denoise at ≤16 samples erases thin Emission glyphs (v8f calendar title false-empty ROI)
    scene.cycles.use_denoising = bool(int(samples) >= 32)
    info = {
        "engine": "CYCLES",
        "requested_device": device,
        "devices": [],
        "denoising": scene.cycles.use_denoising,
        "samples": int(samples),
    }
    info["color_management"] = configure_color_management_ui()
    prefs = bpy.context.preferences.addons["cycles"].preferences
    if device == "METAL":
        try:
            prefs.compute_device_type = "METAL"
        except Exception as e:
            log(f"WARN compute_device_type METAL: {e}")
        try:
            prefs.get_devices()
        except Exception:
            pass
        metal = []
        try:
            metal = list(prefs.get_devices_for_type("METAL"))
        except Exception as e:
            log(f"WARN get_devices_for_type: {e}")
        for d in metal:
            d.use = True
            info["devices"].append(
                {"name": getattr(d, "name", "?"), "type": str(getattr(d, "type", "?")), "use": True}
            )
        scene.cycles.device = "GPU" if metal else "CPU"
        info["cycles_device"] = scene.cycles.device
        if not metal:
            log("WARN: no METAL devices; CPU fallback this session")
            info["fallback"] = "CPU"
    else:
        scene.cycles.device = "CPU"
        info["cycles_device"] = "CPU"
    return info


def clear_scene():
    assert bpy is not None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for b in list(block):
            block.remove(b)


def clear_named(prefix: str):
    assert bpy is not None
    for o in list(bpy.data.objects):
        if o.name.startswith(prefix):
            bpy.data.objects.remove(o, do_unlink=True)


def apply_bevel(obj, width: float, segments: int = 4):
    bevel = obj.modifiers.new("Bevel", "BEVEL")
    bevel.width = max(0.001, width)
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    try:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=bevel.name)
    except Exception:
        pass


def principled_mat(name: str, base, opacity: float = 1.0, rough: float = 0.38, emit: float = 0.0):
    assert bpy is not None
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if opacity < 0.999 else "OPAQUE"
    try:
        mat.shadow_method = "HASHED" if opacity < 0.999 else "OPAQUE"
    except Exception:
        pass
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (base[0], base[1], base[2], 1)
        bsdf.inputs["Roughness"].default_value = rough
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = float(opacity)
        if emit > 0 and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (base[0], base[1], base[2], 1)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emit
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = 0.04 if opacity > 0.9 else 0.0
    return mat


def make_ground(catcher: bool = False):
    assert bpy is not None
    bpy.ops.mesh.primitive_plane_add(size=14, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    mat = principled_mat("GroundMat", (0.84, 0.86, 0.88, 1), rough=0.78)
    ground.data.materials.append(mat)
    if catcher:
        try:
            ground.is_shadow_catcher = True
        except Exception:
            # Blender 4.x cycles object property
            try:
                ground.cycles.is_shadow_catcher = True
            except Exception as e:
                log(f"WARN shadow catcher: {e}")
    return ground


def make_light(params: dict, geom: dict | None = None):
    """One-light from params — preserve size/distance RATIO (Mac v4: do not hardcode 4.5 / *0.004).

    params.light.size & distance are design units (same as analytical 420/900).
    Scene meters use scenePxScale (default 0.01) so size/dist == params ratio == penumbra model.
    """
    assert bpy is not None
    light = params["light"]
    elev = math.radians(float(light["elevationDeg"]))
    az = math.radians(float(light.get("azimuthDeg", 0)))
    scale = float((geom or {}).get("scenePxScale", params.get("geometry", {}).get("scenePxScale", 0.01)))
    dist = float(light["distance"]) * scale
    size = float(light["size"]) * scale
    # Faithful emission: energy scales mildly with distance^2 so brightness stays readable
    energy = float(light.get("energy", 500.0)) * (dist / max(1e-6, 9.0)) ** 2
    x = dist * math.cos(elev) * math.sin(az)
    y = -dist * math.cos(elev) * math.cos(az)
    z = dist * math.sin(elev)
    bpy.ops.object.light_add(type="AREA", location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = "Exp7KeyLight"
    obj.data.shape = "DISK"
    obj.data.size = size
    obj.data.energy = energy
    direction = Vector((0, 0, 0.05)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    obj["exp7_light_dist_m"] = dist
    obj["exp7_light_size_m"] = size
    obj["exp7_light_size_over_dist"] = size / max(1e-9, dist)
    log(f"LIGHT dist_m={dist:.4f} size_m={size:.4f} size/dist={size/dist:.4f} (params {light['size']}/{light['distance']})")
    return obj


def _project_pts(scene, cam, pts):
    from bpy_extras.object_utils import world_to_camera_view  # type: ignore

    xs, ys, zs = [], [], []
    for p in pts:
        co = world_to_camera_view(scene, cam, p)
        xs.append(co.x)
        ys.append(co.y)
        zs.append(co.z)
    return min(xs), max(xs), min(ys), max(ys), min(zs)


def _collect_content_pts(objects):
    """Full content extent: MESH + FONT + avatar, including parented children.

    v8 excluded FONT and missed parented labels → plan left-column crop / chrome underscale.
    """
    assert bpy is not None
    seen = set()
    pts = []

    def visit(ob):
        if ob is None or id(ob) in seen:
            return
        seen.add(id(ob))
        useful = ob.type in ("MESH", "FONT", "CURVE") or ("avatar" in ob.name.lower())
        if useful:
            try:
                for c in ob.bound_box:
                    pts.append(ob.matrix_world @ Vector(c))
            except Exception:
                pts.append(ob.location.copy())
        for ch in getattr(ob, "children", []) or []:
            visit(ch)

    for ob in objects or []:
        visit(ob)
    return pts


def frame_camera_to_objects(cam, objects, res, margin=0.08, max_iters=24, view_name: str | None = None):
    """Content-aware framing from full MESH+FONT extent; crop-hard + min-fill push-in.

    Includes parented label bounds so production text anchors stay in-frame.
    Chrome uses a flatter view_dir so the nav bar is not foreshortened to ~10% fill.
    """
    assert bpy is not None
    if not objects:
        return {"ok": False, "errors": ["no objects"]}

    scene = bpy.context.scene
    old_res = (scene.render.resolution_x, scene.render.resolution_y)
    scene.render.resolution_x, scene.render.resolution_y = int(res[0]), int(res[1])
    pts = _collect_content_pts(objects)
    if not pts:
        scene.render.resolution_x, scene.render.resolution_y = old_res
        return {"ok": False, "errors": ["no bounds"]}

    target = sum(pts, Vector((0, 0, 0))) / len(pts)
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    span_x = max(xs) - min(xs)
    span_y = max(ys) - min(ys)
    span_z = max(zs) - min(zs)
    extent = max(span_x, span_y, span_z, 0.5) * 0.5
    sensor = float(getattr(cam.data, "sensor_width", 36.0) or 36.0)
    lens = float(cam.data.lens)
    aspect = float(res[0]) / max(1.0, float(res[1]))
    fov_x = 2.0 * math.atan((sensor * 0.5) / max(1e-6, lens))
    fov_y = 2.0 * math.atan((sensor * 0.5 / aspect) / max(1e-6, lens))
    fit = extent * (1.0 + 2.0 * margin) * 1.12
    dist = max(fit / max(1e-6, math.tan(min(fov_x, fov_y) * 0.5)), 3.8)

    # Flat nav (chrome): more frontal so the bar has vertical presence + readable glyphs
    flat = (view_name == "chrome") or (span_x > 2.5 * max(span_y, 0.01) and span_z < 0.8)
    if flat:
        view_dir = Vector((0.0, -0.96, 0.28)).normalized()
        min_fill = 0.62  # larger axis must fill ≥62% of NDC
        min_cam_dist = 3.2
    else:
        view_dir = Vector((0.0, -0.78, 0.50)).normalized()
        min_fill = 0.55
        min_cam_dist = 3.6

    cam.location = target + view_dir * dist
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()

    def _fit(mx0, mx1, my0, my1, mz):
        return (
            mx0 >= margin and mx1 <= 1.0 - margin
            and my0 >= margin and my1 <= 1.0 - margin
            and mz > 0
        )

    minx, maxx, miny, maxy, minz = _project_pts(scene, cam, pts)
    for _ in range(max_iters):
        if _fit(minx, maxx, miny, maxy, minz):
            break
        overflow = max(
            margin - minx,
            maxx - (1.0 - margin),
            margin - miny,
            maxy - (1.0 - margin),
            0.02,
        )
        cam.location = cam.location + view_dir * max(0.35, overflow * 7.0)
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        minx, maxx, miny, maxy, minz = _project_pts(scene, cam, pts)
    else:
        overflow = max(
            margin - minx,
            maxx - (1.0 - margin),
            margin - miny,
            maxy - (1.0 - margin),
            0.0,
        )
        # Hard fail on crop — soft-accept previously left plan left-column cropped
        if overflow > 0.04 or minz <= 0:
            scene.render.resolution_x, scene.render.resolution_y = old_res
            return {
                "ok": False,
                "errors": [f"crop ndc=[{minx:.3f},{miny:.3f},{maxx:.3f},{maxy:.3f}] overflow={overflow:.3f}"],
                "ndc_bounds": [minx, miny, maxx, maxy],
                "cam_dist": (cam.location - target).length,
                "method": "extent_fullcontent_v9",
            }

    # Dolly-in until larger NDC span meets min_fill (chrome was ~10% visual mass)
    pushed = 0
    for _ in range(18):
        minx, maxx, miny, maxy, minz = _project_pts(scene, cam, pts)
        span_nx = maxx - minx
        span_ny = maxy - miny
        fill = max(span_nx, span_ny)
        slack = min(minx - margin, 1.0 - margin - maxx, miny - margin, 1.0 - margin - maxy)
        dist_now = (cam.location - target).length
        if fill >= min_fill or slack < 0.025 or dist_now <= min_cam_dist:
            break
        loc = cam.location.copy()
        step = min(0.45, max(0.12, (min_fill - fill) * 2.5), slack * 2.0)
        trial = loc - view_dir * step
        if (trial - target).length < min_cam_dist:
            break
        cam.location = trial
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        minx2, maxx2, miny2, maxy2, minz2 = _project_pts(scene, cam, pts)
        if not _fit(minx2, maxx2, miny2, maxy2, minz2):
            cam.location = loc
            cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
            break
        pushed += 1
        minx, maxx, miny, maxy, minz = minx2, maxx2, miny2, maxy2, minz2

    minx, maxx, miny, maxy, minz = _project_pts(scene, cam, pts)
    span_nx = maxx - minx
    span_ny = maxy - miny
    fill = max(span_nx, span_ny)
    crop_ok = _fit(minx, maxx, miny, maxy, minz)
    scene.render.resolution_x, scene.render.resolution_y = old_res
    ok = crop_ok and fill >= (min_fill - 0.08)
    errors = []
    if not crop_ok:
        errors.append(f"crop ndc=[{minx:.3f},{miny:.3f},{maxx:.3f},{maxy:.3f}]")
    if fill < (min_fill - 0.08):
        errors.append(f"underscale fill={fill:.3f} < min_fill={min_fill:.2f}")
    return {
        "ok": ok,
        "errors": errors,
        "ndc_bounds": [minx, miny, maxx, maxy],
        "margin": margin,
        "cam_loc": list(cam.location),
        "cam_dist": (cam.location - target).length,
        "push_in_steps": pushed,
        "fill": fill,
        "min_fill": min_fill,
        "flat_view": flat,
        "method": "extent_fullcontent_v9",
    }


def make_camera_front(focal_mm: float, near: float, far: float, loc=None, target=None):
    assert bpy is not None
    loc = loc or Vector((0.12, -2.55, 2.45))
    target = target or Vector((0.0, 0.05, 0.12))
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object
    cam.name = "Exp7UICamera"
    cam.data.type = "PERSP"
    cam.data.lens = float(focal_mm)
    cam.data.sensor_width = 36.0
    cam.data.clip_start = max(0.05, near * 0.001)
    cam.data.clip_end = max(50.0, far * 0.01)
    direction = target - loc
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def make_camera_study(name: str, mode: int, focal_mm: float):
    assert bpy is not None
    if mode == 1:
        loc = Vector((0.0, -2.8, 2.2))
    elif mode == 2:
        loc = Vector((0.0, -2.5, 2.85))
    else:
        loc = Vector((1.35, -2.35, 2.55))
    target = Vector((0.0, 0.0, 0.1))
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object
    cam.name = name
    cam.data.lens = float(focal_mm)
    cam.data.sensor_width = 36.0
    direction = target - loc
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return cam


def make_box(name, sx, sy, sz, loc, bevel_w, mat):
    assert bpy is not None
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx / 2, sy / 2, sz / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel_w > 0:
        apply_bevel(obj, bevel_w)
    if mat:
        obj.data.materials.append(mat)
    return obj


def face_color_for_state(st_name: str, st: dict, palette: dict):
    """JRViews wash over surface (or selectionWash base for selected)."""
    bg_key = st.get("bg", "surface")
    base = list(palette["_rgba"].get(bg_key) or palette["_rgba"]["surface"])
    wash = WASH_RGBA.get(st_name) or WASH_RGBA.get(st.get("washKey", ""), None)
    # selected already uses selectionWash bg; still apply wash for parity with JRViews
    return over_wash(tuple(base), wash)


def make_contour_ring(name, sx, sy, z, scale, radius_m, ring_w, color, tilt, emit=0.12):
    """Rounded-rect focus ring hugging panel outline (boolean outer − inner)."""
    assert bpy is not None
    ox = (sx + 2 * ring_w) * scale
    oy = (sy + 2 * ring_w) * scale
    ix = max(0.02, (sx - 2 * ring_w * 0.15) * scale)
    iy = max(0.02, (sy - 2 * ring_w * 0.15) * scale)
    thick = max(0.006, ring_w * 0.9)

    outer = make_box(
        name + "_outer",
        ox,
        oy,
        thick,
        (0.0, 0.0, z),
        min(radius_m + ring_w, 0.45 * min(ox, oy)),
        None,
    )
    inner = make_box(
        name + "_inner",
        ix,
        iy,
        thick * 1.4,
        (0.0, 0.0, z),
        max(0.001, radius_m - ring_w * 0.5),
        None,
    )
    mod = outer.modifiers.new("RingBool", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = inner
    bpy.context.view_layer.objects.active = outer
    try:
        bpy.ops.object.modifier_apply(modifier=mod.name)
    except Exception as e:
        log(f"WARN ring boolean: {e}")
    bpy.data.objects.remove(inner, do_unlink=True)
    outer.name = name
    outer.data.materials.append(principled_mat(name + "_mat", color, emit=emit, rough=0.28))
    if abs(tilt) > 1e-6:
        outer.rotation_euler[0] = math.radians(tilt)
    return outer


def make_text_bar(name, x, y, z, w, h, color, bevel_w=0.004):
    """Flat content strip standing in for typography hierarchy (no font dependency)."""
    mat = principled_mat(name + "_mat", color, rough=0.55)
    return make_box(name, w, h, 0.008, (x, y, z), bevel_w, mat)


def make_panel(name: str, st: dict, palette: dict, geom: dict, tilt_deg=None, st_name: str = "idle",
               size=None, origin=(0.0, 0.0), content_lines=0):
    """Rounded UI card; face +Z. Optional content strips for hierarchy."""
    assert bpy is not None
    lift_m = float(st.get("lift", 0)) * px_m(1.0, geom) * 2.0  # readable lift for measure
    thick = max(0.024, px_m(float(geom.get("thicknessPx", 1)), geom) * 2.5)
    sx, sy = size or (1.7, 1.05)
    scale = float(st.get("scale", 1.0))
    opacity = float(st.get("opacity", 1.0))
    tilt = float(st.get("tilt", 0) if tilt_deg is None else tilt_deg)
    rad = panel_radius_m(geom, sx * scale, sy * scale)
    ring_w = px_m(2.5, geom)  # design focus ring ~2–3px
    if st_name == "focus" or st.get("ring") == "focus":
        ring_w = px_m(3.5, geom)  # Mac v3: focus ring was faint
    if st_name == "drop-pending":
        ring_w = px_m(3.0, geom)

    face = face_color_for_state(st_name, st, palette)
    mat = principled_mat(name + "_mat", face, opacity=opacity)
    zc = lift_m + thick / 2
    obj = make_box(name, sx * scale, sy * scale, thick, (origin[0], origin[1], zc), rad, mat)
    if abs(tilt) > 1e-6:
        obj.rotation_euler[0] = math.radians(tilt)
    # Binding contract for child labels (views_content parents text here)
    obj["exp7_lift_m"] = float(lift_m)
    obj["exp7_thick"] = float(thick)
    obj["exp7_face_local_z"] = float(thick / 2 + 0.018)
    obj["exp7_size_x"] = float(sx * scale)
    obj["exp7_size_y"] = float(sy * scale)
    obj["exp7_st_name"] = str(st_name)

    border_key = st.get("border", "border")
    border_col = palette["_rgba"].get(border_key) or palette["_rgba"]["border"]
    # Edge stroke as slightly larger thin plate under face rim (rounded)
    rim = make_box(
        name + "_border",
        (sx + ring_w * 0.6) * scale,
        (sy + ring_w * 0.6) * scale,
        0.006,
        (origin[0], origin[1], lift_m + thick + 0.002),
        rad + ring_w * 0.2,
        principled_mat(name + "_border_mat", border_col, emit=0.04, rough=0.35),
    )
    if abs(tilt) > 1e-6:
        rim.rotation_euler[0] = math.radians(tilt)

    ring_key = st.get("ring", "none")
    ring_col = palette["_ring"].get(ring_key)
    ring_obj = None
    if ring_col:
        emit = 0.28 if st_name in ("focus", "selected", "drop-pending") else 0.12
        ring_obj = make_contour_ring(
            name + "_ring",
            sx,
            sy,
            lift_m + thick + 0.01,
            scale,
            rad,
            ring_w,
            ring_col,
            tilt,
            emit=emit,
        )
        ring_obj.location = (origin[0], origin[1], ring_obj.location.z)

    # Content hierarchy strips (title + muted lines) — validates more than wash tokens
    texts = []
    if content_lines > 0:
        tw = sx * scale * 0.78
        left = origin[0] - tw / 2 + tw * 0.02
        top = origin[1] + sy * scale * 0.28
        title_c = palette["_rgba"]["text"]
        muted_c = palette["_rgba"]["muted"]
        texts.append(
            make_text_bar(name + "_title", left + tw * 0.35, top, lift_m + thick + 0.012, tw * 0.7, 0.045, title_c)
        )
        for i in range(1, content_lines):
            texts.append(
                make_text_bar(
                    name + f"_line{i}",
                    left + tw * 0.3,
                    top - 0.09 * i,
                    lift_m + thick + 0.012,
                    tw * (0.55 if i == 1 else 0.4),
                    0.028,
                    muted_c,
                )
            )

    return obj, rim, ring_obj, texts


def world_corners(obj):
    assert bpy is not None
    mat = obj.matrix_world
    return [mat @ Vector(c) for c in obj.bound_box]


def project_points(cam, points, res):
    assert bpy is not None
    scene = bpy.context.scene
    from bpy_extras.object_utils import world_to_camera_view  # type: ignore

    out = []
    for p in points:
        co = world_to_camera_view(scene, cam, p)
        x = co.x * res[0]
        y = (1.0 - co.y) * res[1]
        vis = (0.0 <= co.x <= 1.0) and (0.0 <= co.y <= 1.0) and (co.z > 0)
        out.append((x, y, vis, float(co.z)))
    return out


def projected_metrics(cam, obj, res):
    pts = project_points(cam, world_corners(obj), res)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    w = max(1e-6, maxx - minx)
    h = max(1e-6, maxy - miny)
    area = w * h
    frame = res[0] * res[1]
    return {
        "bbox": [minx, miny, maxx, maxy],
        "width_px": w,
        "height_px": h,
        "area_frac": area / frame,
        "height_frac": h / res[1],
        "aspect": w / h,
        "visible_corners": sum(1 for p in pts if p[2]),
    }


def validate_framing(cam, panel, res) -> dict:
    m = projected_metrics(cam, panel, res)
    errors = []
    if m["area_frac"] < MIN_PROJECTED_AREA_FRAC:
        errors.append(f"projected area {m['area_frac']:.4f} < {MIN_PROJECTED_AREA_FRAC} (edge-on/too-small)")
    if m["height_frac"] < MIN_PROJECTED_HEIGHT_FRAC:
        errors.append(f"projected height frac {m['height_frac']:.4f} < {MIN_PROJECTED_HEIGHT_FRAC} (sliver)")
    if not (MIN_ASPECT <= m["aspect"] <= MAX_ASPECT):
        errors.append(f"aspect {m['aspect']:.3f} outside [{MIN_ASPECT},{MAX_ASPECT}]")
    if m["visible_corners"] < 4:
        errors.append(f"only {m['visible_corners']} corners in view")
    return {"ok": not errors, "metrics": m, "errors": errors}


def validate_ring_hugs_panel(panel, ring, tol_frac=0.22) -> dict:
    """Ring bbox should be close to panel bbox (reject huge ellipse class)."""
    if ring is None:
        return {"ok": True, "skipped": True}
    pb = panel.dimensions
    rb = ring.dimensions
    # After boolean, dimensions are world-ish local; compare XY
    px, py = float(pb.x), float(pb.y)
    rx, ry = float(rb.x), float(rb.y)
    errors = []
    if rx > px * (1.0 + tol_frac + 0.15) or ry > py * (1.0 + tol_frac + 0.15):
        errors.append(f"ring dims ({rx:.3f},{ry:.3f}) >> panel ({px:.3f},{py:.3f})")
    if rx < px * 0.9 or ry < py * 0.9:
        errors.append(f"ring dims ({rx:.3f},{ry:.3f}) unexpectedly smaller than panel")
    return {"ok": not errors, "panel_xy": [px, py], "ring_xy": [rx, ry], "errors": errors}


def visual_keys(st: dict) -> dict:
    return {
        "lift": float(st.get("lift", 0)),
        "tilt": float(st.get("tilt", 0)),
        "scale": float(st.get("scale", 1)),
        "opacity": float(st.get("opacity", 1)),
        "ring": st.get("ring", "none"),
        "bg": st.get("bg", "surface"),
        "border": st.get("border", "border"),
    }


def validate_state_table(states: dict) -> dict:
    idle = visual_keys(states["idle"])
    errors = []
    for name, st in states.items():
        if name == "idle":
            continue
        vk = visual_keys(st)
        diffs = [k for k in vk if vk[k] != idle[k]]
        # Washes also differentiate even when visual_keys match partially
        if len(diffs) < MIN_STATE_DIFF_KEYS and WASH_RGBA.get(name) is None:
            errors.append(f"state '{name}' identical to idle in material/lift/scale/opacity/ring/tilt")
        elif len(diffs) < MIN_STATE_DIFF_KEYS and name not in WASH_RGBA:
            errors.append(f"state '{name}' identical to idle")
    for name in ("pressed", "disabled", "invalid"):
        if name not in states:
            continue
        vk = visual_keys(states[name])
        nonlift = [k for k in ("scale", "opacity", "ring", "bg", "border", "tilt") if vk[k] != idle[k]]
        if not nonlift and WASH_RGBA.get(name) is None:
            errors.append(
                f"state '{name}' has no non-lift material/scale/opacity/ring/border/tilt vs idle"
            )
    dp = states.get("drop-pending") or {}
    inv = states.get("invalid") or {}
    if dp.get("ring") == "caution":
        errors.append("drop-pending ring must not be caution/invalid-red (use gold/accent)")
    if dp.get("ring") and inv.get("ring") and dp.get("ring") == inv.get("ring"):
        errors.append(f"drop-pending and invalid share ring '{dp.get('ring')}' — semantic collision")
    return {"ok": not errors, "errors": errors, "note": "Mac measure must use ROI not global mean |dL|"}


def set_world_bg(rgb=(0.91, 0.93, 0.95), strength=0.55):
    assert bpy is not None
    scene = bpy.context.scene
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (rgb[0], rgb[1], rgb[2], 1)
        bg.inputs[1].default_value = strength


def render_still(out_path: Path, res, transparent=False):
    assert bpy is not None
    scene = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = bool(transparent)
    scene.render.filepath = str(out_path)
    set_world_bg()
    bpy.ops.render.render(write_still=True)


def _object_world_points(ob):
    """Prefer evaluated mesh verts (FONT bound_box ≠ glyph ink — v8g title ROI miss)."""
    assert bpy is not None
    pts = []
    try:
        depsgraph = bpy.context.evaluated_depsgraph_get()
        ob_eval = ob.evaluated_get(depsgraph)
        mesh = ob_eval.to_mesh()
        try:
            mw = ob_eval.matrix_world
            if mesh and len(mesh.vertices) > 0:
                # Subsample dense text meshes
                step = max(1, len(mesh.vertices) // 400)
                for i, v in enumerate(mesh.vertices):
                    if i % step == 0:
                        pts.append(mw @ v.co)
        finally:
            ob_eval.to_mesh_clear()
    except Exception:
        pts = []
    if not pts:
        try:
            pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
        except Exception:
            pts = [ob.location.copy()]
    return pts


def project_object_px(cam, ob, res_w, res_h):
    """Projected AABB in top-left pixel coords + NDC (Blender y bottom-up)."""
    from bpy_extras.object_utils import world_to_camera_view  # type: ignore

    scene = bpy.context.scene
    old = (scene.render.resolution_x, scene.render.resolution_y)
    scene.render.resolution_x, scene.render.resolution_y = res_w, res_h
    xs, ys, zs = [], [], []
    for p in _object_world_points(ob):
        co = world_to_camera_view(scene, cam, p)
        xs.append(co.x)
        ys.append(co.y)
        zs.append(co.z)
    scene.render.resolution_x, scene.render.resolution_y = old
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    px0, px1 = minx * res_w, maxx * res_w
    py_top, py_bot = (1.0 - maxy) * res_h, (1.0 - miny) * res_h
    return {
        "ndc": [minx, miny, maxx, maxy],
        "px_tl": [px0, py_top, px1, py_bot],
        "w_px": abs(px1 - px0),
        "h_px": abs(py_bot - py_top),
        "z_near": min(zs),
        "in_frame": minx >= 0 and maxx <= 1 and miny >= 0 and maxy <= 1 and min(zs) > 0,
        "point_source": "evaluated_mesh",
    }


def write_projected_rois(cam, objs, out_json: Path, res_w: int, res_h: int) -> dict:
    """Sidecar for validate_view_pixels — text + panel projections for occlusion/crop gates."""
    objects = {}
    # Include parented children even if only parents were listed
    all_obs = []
    seen = set()

    def _add(ob):
        if ob is None or id(ob) in seen:
            return
        seen.add(id(ob))
        all_obs.append(ob)
        for ch in getattr(ob, "children", []) or []:
            _add(ch)

    for ob in objs or []:
        _add(ob)

    panel_tokens = ("_card", "_day", "_row", "_app", "_tab", "_col", "_header", "_bar", "_avatar")
    for ob in all_obs:
        if ob is None:
            continue
        is_text = ob.type == "FONT"
        is_avatar = "avatar" in ob.name.lower()
        is_panel = ob.type == "MESH" and any(t in ob.name for t in panel_tokens)
        if not (is_text or is_avatar or is_panel):
            continue
        p640 = project_object_px(cam, ob, 640, 360)
        p1280 = project_object_px(cam, ob, 1280, 720)
        pref = project_object_px(cam, ob, res_w, res_h)
        entry = {
            "px_tl": pref["px_tl"],
            "px_tl_640": p640["px_tl"],
            "px_tl_1280": p1280["px_tl"],
            "h_px_640": p640["h_px"],
            "h_px_1280": p1280["h_px"],
            "w_px_1280": p1280["w_px"],
            "in_frame": pref["in_frame"],
            "z_near": pref["z_near"],
            "world_z": float(ob.matrix_world.translation.z),
            "parent": ob.parent.name if ob.parent else None,
        }
        if is_text:
            entry["body"] = ob.data.body
            entry["blender_size"] = float(ob.data.size)
            entry["kind"] = "text"
            entry["bound_parent"] = ob.get("exp7_bound_parent")
        elif is_avatar:
            entry["kind"] = "avatar"
        else:
            entry["kind"] = "panel"
            entry["st_name"] = ob.get("exp7_st_name")
        objects[ob.name] = entry
    doc = {
        "resolution": [res_w, res_h],
        "resolution_ref": [res_w, res_h],
        "objects": objects,
        "mechanism": "projected_text_geometry_v9_panels",
    }
    out_json.write_text(json.dumps(doc, indent=2))
    return doc


def render_text_hidden_bg(out_path: Path, res, text_objs) -> list:
    """Companion pass: hide FONT objects, render surface under glyphs."""
    hidden = []
    for ob in text_objs:
        if ob is None or ob.type != "FONT":
            continue
        try:
            if not ob.hide_render:
                ob.hide_render = True
                hidden.append(ob)
        except Exception:
            pass
    render_still(out_path, res, transparent=False)
    for ob in hidden:
        try:
            ob.hide_render = False
        except Exception:
            pass
    return [o.name for o in hidden]


def ensure_ground(catcher=False):
    g = bpy.data.objects.get("Ground")
    if g:
        bpy.data.objects.remove(g, do_unlink=True)
    return make_ground(catcher=catcher)


# --- View compositions (shared params) -------------------------------------------------

def compose_calendar(palette, geom, element_states, prefix="ViewCal"):
    """Month-ish grid: header + day cells with idle/hover/selected/focus."""
    gap = px_m(float(geom.get("gap", 8)), geom)
    day_r = px_m(float(geom.get("radii", {}).get("day", 6)), geom)
    cell_w, cell_h = 0.38, 0.32
    objs = []
    # Header bar
    header_st = dict(element_states["idle"])
    objs.append(make_panel(f"{prefix}_header", header_st, palette, geom, st_name="idle",
                           size=(2.6, 0.28), origin=(0.0, 0.95), content_lines=1)[0])
    states_cycle = ["idle", "hover", "selected", "focus", "pressed", "invalid", "disabled"]
    idx = 0
    for row in range(3):
        for col in range(5):
            st_name = states_cycle[idx % len(states_cycle)]
            idx += 1
            st = dict(element_states.get(st_name, element_states["idle"]))
            x = (col - 2) * (cell_w + gap)
            y = 0.45 - row * (cell_h + gap)
            p, _, ring, _ = make_panel(
                f"{prefix}_d{row}{col}", st, palette, geom, st_name=st_name,
                size=(cell_w, cell_h), origin=(x, y), content_lines=1 if st_name == "selected" else 0,
            )
            # force day radius feel via already-applied panel radius from geom; ok
            objs.extend([p] + ([ring] if ring else []))
    return objs


def compose_board(palette, geom, element_states, prefix="ViewBoard"):
    """Three columns of cards: expense-like hierarchy."""
    gap = px_m(float(geom.get("gap", 8)), geom)
    objs = []
    col_states = [
        ["idle", "hover", "selected"],
        ["dragging", "drop-pending", "idle"],
        ["pressed", "disabled", "invalid"],
    ]
    for ci, col in enumerate(col_states):
        cx = (ci - 1) * 1.15
        # Column header
        objs.append(
            make_panel(f"{prefix}_col{ci}", element_states["idle"], palette, geom, st_name="idle",
                       size=(1.0, 0.22), origin=(cx, 0.95), content_lines=1)[0]
        )
        for ri, st_name in enumerate(col):
            st = dict(element_states.get(st_name, element_states["idle"]))
            y = 0.45 - ri * (0.55 + gap)
            p, _, ring, texts = make_panel(
                f"{prefix}_c{ci}r{ri}", st, palette, geom, st_name=st_name,
                size=(1.0, 0.48), origin=(cx, y), content_lines=2,
            )
            objs.append(p)
            if ring:
                objs.append(ring)
            objs.extend(texts)
    return objs


def compose_plan(palette, geom, element_states, prefix="ViewPlan"):
    """Dependency / plan rows with emphasis hierarchy."""
    objs = []
    rows = ["selected", "focus", "hover", "idle", "disabled"]
    for i, st_name in enumerate(rows):
        st = dict(element_states.get(st_name, element_states["idle"]))
        y = 0.7 - i * 0.38
        p, _, ring, texts = make_panel(
            f"{prefix}_row{i}", st, palette, geom, st_name=st_name,
            size=(2.8, 0.3), origin=(0.0, y), content_lines=1,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        objs.extend(texts)
        # Connector nub (plan edge cue) using accent/border only
        if i < len(rows) - 1:
            nub = make_box(
                f"{prefix}_edge{i}",
                0.04,
                0.08,
                0.02,
                (-1.2, y - 0.19, 0.05),
                0.008,
                principled_mat(f"{prefix}_edge{i}_mat", palette["_rgba"]["accent"], rough=0.4),
            )
            objs.append(nub)
    return objs


def compose_chrome(palette, geom, element_states, prefix="ViewChrome"):
    """Reserved bar + apps + avatar disc from shared barH/avatar/gap."""
    bar_h = px_m(float(geom.get("barH", 44)), geom)
    avatar = px_m(float(geom.get("avatar", 36)), geom)
    gap = px_m(float(geom.get("gap", 8)), geom)
    objs = []
    # Bar plate
    bar = make_box(
        f"{prefix}_bar",
        3.2,
        bar_h,
        0.03,
        (0.0, 0.0, 0.02),
        px_m(float(geom.get("radii", {}).get("section", 6)), geom),
        principled_mat(f"{prefix}_bar_mat", palette["_rgba"]["surface"], rough=0.42),
    )
    objs.append(bar)
    # Apps chips
    for i, st_name in enumerate(["selected", "idle", "hover"]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = -1.1 + i * (0.55 + gap)
        p, _, ring, texts = make_panel(
            f"{prefix}_app{i}", st, palette, geom, st_name=st_name,
            size=(0.5, bar_h * 0.7), origin=(x, 0.0), content_lines=1,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        objs.extend(texts)
    # Budget tabs
    for i, st_name in enumerate(["selected", "idle", "idle"]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = 0.55 + i * (0.42 + gap * 0.5)
        p, _, ring, _ = make_panel(
            f"{prefix}_tab{i}", st, palette, geom, st_name=st_name,
            size=(0.38, bar_h * 0.55), origin=(x, 0.0), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
    # Avatar soft disc (circular via high bevel)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=avatar / 2,
        depth=0.02,
        location=(1.45, 0.0, 0.04),
    )
    av = bpy.context.active_object
    av.name = f"{prefix}_avatar"
    av.rotation_euler[0] = math.radians(90)
    av.data.materials.append(
        principled_mat(f"{prefix}_avatar_mat", palette["_rgba"]["softDisc"], rough=0.5)
    )
    objs.append(av)
    # Initials bar proxy
    objs.append(
        make_text_bar(f"{prefix}_initials", 1.45, 0.0, 0.06, avatar * 0.35, avatar * 0.2, palette["_rgba"]["muted"])
    )
    return objs


def main():
    args = parse_args()
    params = json.loads(Path(args.params).read_text())
    states_doc = json.loads(Path(args.states).read_text())
    palette = build_palette(params)
    geom = dict(params["geometry"])
    geom.setdefault("scenePxScale", 0.01)
    element_states = states_doc["elementStates"]
    filt = [s.strip() for s in args.states_filter.split(",") if s.strip()]
    if filt:
        element_states = {k: v for k, v in element_states.items() if k in filt}

    st_val = validate_state_table(element_states if not filt else states_doc["elementStates"])
    # When filtering, validate full table still
    st_val_full = validate_state_table(states_doc["elementStates"])
    if not st_val_full["ok"] and not args.skip_validate:
        raise SystemExit("STATE_TABLE_VALIDATION_FAIL: " + "; ".join(st_val_full["errors"]))

    if getattr(args, "probe", False):
        # Focused preflight before full METAL — still pixel-validated
        # 16 samples + no denoise: 8+OIDN was wiping title ink (v8f)
        if args.samples == 64:
            args.samples = 16
        if args.resolution == "1280x720":
            args.resolution = "640x360"
        log(f"PROBE mode samples={args.samples} res={args.resolution}")
    scratch = Path(args.scratch)
    run_id = args.run_id or time.strftime("%Y%m%d-%H%M%S")
    out_dir = scratch / "blender" / args.stage / run_id
    rx, ry = [int(x) for x in args.resolution.lower().split("x")]
    focal = float(args.focal_mm if args.focal_mm is not None else params["camera"]["focalMmChosen"])

    meta = {
        "generator": "generate_ui_scene.py",
        "generator_rev": GENERATOR_REV,
        "blender_target": "4.2.1 LTS",
        "fix_note": (
            "v8 rootcause: Standard view_transform + sRGB→linear emission; camera push-in; "
            "projected text ROI sidecar + text-hidden BG pass; illustrated avatar fixture "
            "(not gradient-as-photo); PIL-free preflight. Shadow-cal/Moho unchanged."
        ),
        "mac_v7_fail_ref": (
            "hardcoded title ROI y14-57 missed title y86-98; AgX+sRGB-as-linear washed ink; "
            "probe 640 undersampled secondary ~3px; avatar gradient ellipse chroma-false-pass"
        ),
        "mac_v6_fail_ref": "secondary pale gray; avatar black disc; dark-count validator weak",
        "executable_expected": "/Applications/Blender.app/Contents/MacOS/Blender",
        "cycles_device_requested": args.device,
        "scratch": str(scratch),
        "out_dir": str(out_dir),
        "focal_mm": focal,
        "samples": args.samples,
        "states": list(element_states.keys()),
        "params_id": params.get("id"),
        "state_table_validation": st_val_full,
        "wash_source": "art/src/jrviews-ux-states.js WASH/RING (palette-derived)",
        "view_label": "DESIGN-STUDY — not live Safari WebGPU app output",
        "only": sorted(only_set(args)),
        "measure_guidance": {
            "do_not_use": "global mean |dL|; raw image-px offset as ground-plane model",
            "use": "ROI panel bbox; geometric scale/opacity/ring; shadow catcher + unprojection (calibrate_shadow_ground.py)",
            "subtle_by_design": ["hover", "settling"],
            "meaningful_cues": [
                "pressed.scale+selection ring",
                "disabled.opacity+softDisc",
                "focus thicker selection ring",
                "drop-pending gold/accent ≠ invalid caution",
            ],
            "analytical_fits": "PROVISIONAL — Mac v3 image slopes not adopted as ground truth",
        },
        "evidence": "rendered-on-mac-when-complete; dry-run is not GPU proof",
    }

    want = only_set(args)
    if args.skip_views:
        want.discard("views")
    if args.skip_shadow_passes:
        want.discard("shadow")

    if args.dry_run or bpy is None:
        meta["dry_run"] = True
        meta["bpy_available"] = bpy is not None
        sx, sy = 1.7, 1.05
        rw = px_m(2.5, geom)
        meta["ring_estimate"] = {
            "panel_xy": [sx, sy],
            "ring_outer_xy": [sx + 2 * rw, sy + 2 * rw],
            "max_overshoot_frac": (2 * rw) / min(sx, sy),
            "reject_if_overshoot_gt": 0.35,
        }
        meta["views_planned"] = ["calendar", "board", "plan", "chrome"]
        meta["views_content_module"] = bool(VC)
        meta["avatar_assets"] = {
            "design_study": str(Path(__file__).parent / "assets" / "avatar-design-study.png"),
            "photo_study": str(Path(__file__).parent / "assets" / "avatar-photo-study.png"),
        }
        meta["shadow_passes_planned"] = ["shadow_lift_##px.png", "surface_lift_##px.png"]
        meta["content_gates"] = {"min_text_objects": 8, "chrome_requires_avatar": True}
        # Semantic checks in dry-run
        dp_ring = states_doc["elementStates"].get("drop-pending", {}).get("ring")
        inv_ring = states_doc["elementStates"].get("invalid", {}).get("ring")
        meta["semantic_rings"] = {"drop-pending": dp_ring, "invalid": inv_ring, "ok": dp_ring != inv_ring}
        print(json.dumps(meta, indent=2))
        if not meta["semantic_rings"]["ok"]:
            raise SystemExit("SEMANTIC_FAIL drop-pending ring collides with invalid")
        if bpy is None and not args.dry_run:
            raise SystemExit("bpy missing — run inside Blender")
        return 0

    lock = None
    try:
        lock = acquire_lock(scratch, args.skip_lock)
        out_dir.mkdir(parents=True, exist_ok=True)
        clear_scene()
        meta["device_info"] = configure_cycles_metal(args.samples, args.device)
        make_ground(catcher=False)
        make_light(params, geom)
        cam = make_camera_front(focal, params["camera"].get("near", 10), params["camera"].get("far", 4000))

        # Framing + ring hug validation on focus (has ring)
        panel, rim, ring, _ = make_panel(
            "UIPanel_validate", element_states.get("focus", element_states["idle"]),
            palette, geom, st_name="focus", content_lines=0,
        )
        framing = validate_framing(cam, panel, (rx, ry))
        ring_val = validate_ring_hugs_panel(panel, ring)
        meta["framing_validation"] = framing
        meta["ring_validation"] = ring_val
        (out_dir / "validation.json").write_text(
            json.dumps({"state_table": st_val_full, "framing": framing, "ring": ring_val}, indent=2)
        )
        if not framing["ok"] and not args.skip_validate:
            raise SystemExit("FRAMING_VALIDATION_FAIL: " + "; ".join(framing["errors"]))
        if not ring_val["ok"] and not args.skip_validate:
            raise SystemExit("RING_VALIDATION_FAIL: " + "; ".join(ring_val["errors"]))
        clear_named("UIPanel_")

        # Write camera instrumentation for ground-space shadow fit (always cheap)
        try:
            from calibrate_shadow_ground import write_camera_instrumentation

            write_camera_instrumentation(cam, out_dir / "camera_instrumentation.json", params, (rx, ry))
            meta["camera_instrumentation"] = str(out_dir / "camera_instrumentation.json")
        except Exception as e:
            log(f"WARN camera instrumentation: {e}")

        renders = []
        view_content_reports = {}

        if "states" in want:
            for name, st in element_states.items():
                clear_named("UIPanel_")
                make_panel(f"UIPanel_{name}", st, palette, geom, st_name=name, content_lines=2)
                out_png = out_dir / f"state_{name}.png"
                log(f"RENDER state={name} wash={WASH_RGBA.get(name)} ring={st.get('ring')} scale={st.get('scale')} opacity={st.get('opacity')}")
                render_still(out_png, (rx, ry))
                obj = bpy.data.objects.get(f"UIPanel_{name}")
                metrics = projected_metrics(cam, obj, (rx, ry)) if obj else {}
                renders.append({"state": name, "path": str(out_png), "visual": visual_keys(st), "projected": metrics, "pass": "beauty"})

        if "lift" in want or "shadow" in want:
            shadow_cal = "shadow-cal" in want or True  # always emit cal pair when shadow requested
            for lift_px in (0, 1, 2, 4, 8):
                clear_named("UIPanel_")
                st = dict(element_states["idle"])
                st["lift"] = float(lift_px)
                make_panel("UIPanel_lift", st, palette, geom, st_name="idle", content_lines=0)
                if "lift" in want:
                    out_png = out_dir / f"lift_{lift_px:02d}px.png"
                    render_still(out_png, (rx, ry))
                    renders.append({"series": "lift", "lift_px": lift_px, "path": str(out_png), "pass": "beauty"})
                if "shadow" in want:
                    ensure_ground(catcher=True)
                    # Beauty shadow (panel visible) — y90 often occluded (Mac v5)
                    out_sh = out_dir / f"shadow_lift_{lift_px:02d}px.png"
                    render_still(out_sh, (rx, ry), transparent=True)
                    renders.append({"series": "lift-shadow", "lift_px": lift_px, "path": str(out_sh), "pass": "shadow_catcher"})
                    # Calibration: panel invisible to camera, still casts — full penumbra visible
                    if shadow_cal:
                        set_caster_invisible_to_camera("UIPanel_")
                        out_cal = out_dir / f"shadow_cal_lift_{lift_px:02d}px.png"
                        render_still(out_cal, (rx, ry), transparent=True)
                        renders.append({
                            "series": "lift-shadow-cal",
                            "lift_px": lift_px,
                            "path": str(out_cal),
                            "pass": "shadow_catcher_invisible_caster",
                            "note": "Camera-invisible caster; measure full blur; do not force-match analytic",
                        })
                        # restore camera visibility for surface pass
                        for o in bpy.data.objects:
                            if o.name.startswith("UIPanel_"):
                                try:
                                    o.visible_camera = True
                                except Exception:
                                    pass
                    g = bpy.data.objects.get("Ground")
                    if g:
                        g.hide_render = True
                    out_sf = out_dir / f"surface_lift_{lift_px:02d}px.png"
                    render_still(out_sf, (rx, ry), transparent=False)
                    renders.append({"series": "lift-surface", "lift_px": lift_px, "path": str(out_sf), "pass": "surface_only"})
                    if g:
                        g.hide_render = False
                        try:
                            g.is_shadow_catcher = False
                        except Exception:
                            pass
                    ensure_ground(catcher=False)

        if "tilt" in want:
            for tilt in (0, 2, 5, 10):
                clear_named("UIPanel_")
                st = dict(element_states["idle"])
                make_panel("UIPanel_tilt", st, palette, geom, tilt_deg=float(tilt), st_name="idle")
                out_png = out_dir / f"tilt_{tilt:02d}deg.png"
                render_still(out_png, (rx, ry))
                renders.append({"series": "tilt", "tilt_deg": tilt, "path": str(out_png)})

        if "persp" in want:
            study_st = dict(element_states.get("selected", element_states["idle"]))
            for mode in (1, 2, 3):
                clear_named("UIPanel_")
                make_panel("UIPanel_persp", study_st, palette, geom, st_name="selected", content_lines=2)
                sc = make_camera_study(f"StudyCam_{mode}pt", mode, focal)
                bpy.context.scene.camera = sc
                out_png = out_dir / f"persp_{mode}pt.png"
                render_still(out_png, (rx, ry))
                renders.append({"series": "perspective", "mode": mode, "path": str(out_png)})
            bpy.context.scene.camera = cam

        view_pixel_failures = []
        halt_views = bool(getattr(args, "halt_on_view_fail", False))
        if "views" in want:
            if VC is None:
                raise SystemExit("views_content module missing — cannot render non-empty views")
            try:
                assets = VC.assert_assets()
                log(f"AVATAR_ASSETS {json.dumps(assets)}")
                meta["avatar_assets"] = assets
                if not (assets.get("fixture_exists") or assets.get("photo_exists")) and not args.skip_validate:
                    raise SystemExit(
                        "AVATAR_ASSET_FAIL: avatar-fixture-study.png (or photo-study path) missing"
                    )
            except AttributeError:
                pass
            font_id = VC._load_font_id(VC.find_font())
            # Start elevated; frame pulls back then pushes in for readable projected glyphs
            view_cam = make_camera_front(
                min(focal, 50.0),  # wider FOV for compositions vs single-panel 85mm
                params["camera"].get("near", 10),
                params["camera"].get("far", 4000),
                # Start further back so board/chrome + larger type can pull-back-fit
                loc=Vector((0.0, -7.2, 5.4)),
                target=Vector((0.0, 0.1, 0.15)),
            )
            bpy.context.scene.camera = view_cam
            composers = {
                "calendar": VC.compose_calendar,
                "board": VC.compose_board,
                "plan": VC.compose_plan,
                "chrome": VC.compose_chrome,
            }
            for view_name, composer in composers.items():
                clear_named("View")
                clear_named("UIPanel_")
                ensure_ground(catcher=False)
                built = composer(make_panel, palette, geom, states_doc["elementStates"], font_id)
                objs = [o for o in (built or []) if o is not None]
                for o in bpy.data.objects:
                    if o.name.startswith("View") and o not in objs:
                        objs.append(o)
                # Reset camera each view — prior push-in must not poison board/chrome framing
                view_cam.location = Vector((0.0, -7.2, 5.4))
                view_cam.rotation_euler = (
                    Vector((0.0, 0.1, 0.15)) - view_cam.location
                ).to_track_quat("-Z", "Y").to_euler()
                frame = frame_camera_to_objects(
                    view_cam, objs, (rx, ry), margin=0.05, view_name=view_name
                )
                inv = VC.content_inventory("View")
                vval = VC.validate_view_content(inv, view_name)
                vval["framing"] = frame
                if not frame.get("ok") and not args.skip_validate:
                    msg = "VIEW_FRAMING_FAIL " + view_name + ": " + "; ".join(frame.get("errors") or [])
                    if halt_views:
                        raise SystemExit(msg)
                    log(msg)
                    view_pixel_failures.append(msg)
                view_content_reports[view_name] = vval
                if not vval["ok"] and not args.skip_validate:
                    msg = "VIEW_CONTENT_FAIL " + view_name + ": " + "; ".join(vval["errors"])
                    if halt_views:
                        raise SystemExit(msg)
                    log(msg)
                    view_pixel_failures.append(msg)
                    continue
                out_png = out_dir / f"view_{view_name}.png"
                rois_json = out_dir / f"view_{view_name}_rois.json"
                bg_png = out_dir / f"view_{view_name}_bg.png"
                roi_doc = write_projected_rois(view_cam, objs, rois_json, rx, ry)
                log(
                    f"RENDER view={view_name} texts={inv['texts']} avatars={inv['avatars']} "
                    f"frame_ok={frame.get('ok')} push_in={frame.get('push_in_steps')} "
                    f"rois={len(roi_doc.get('objects', {}))} Standard+linearEmission DESIGN-STUDY"
                )
                render_still(out_png, (rx, ry))
                text_objs = [o for o in objs if o is not None and o.type == "FONT"]
                hidden_names = render_text_hidden_bg(bg_png, (rx, ry), text_objs)
                log(f"BG_PASS view={view_name} hidden_texts={len(hidden_names)} → {bg_png.name}")
                try:
                    from validate_view_pixels import validate_png

                    pix = validate_png(
                        out_png,
                        view_name,
                        require_avatar=(view_name == "chrome"),
                        rois_path=rois_json,
                        bg_path=bg_png,
                    )
                    vval["pixels"] = pix
                    if not pix.get("ok") and not args.skip_validate:
                        msg = "VIEW_PIXEL_FAIL " + view_name + ": " + "; ".join(pix.get("errors") or [])
                        log(msg)
                        view_pixel_failures.append(msg)
                        if halt_views:
                            raise SystemExit(msg)
                except ImportError:
                    log("WARN validate_view_pixels missing")
                renders.append({
                    "series": "view",
                    "view": view_name,
                    "path": str(out_png),
                    "rois": str(rois_json),
                    "bg": str(bg_png),
                    "label": "DESIGN-STUDY",
                    "content": inv,
                    "framing": frame,
                    "pixels": vval.get("pixels"),
                })
            bpy.context.scene.camera = cam
            if view_pixel_failures and not args.skip_validate:
                meta["view_pixel_failures"] = view_pixel_failures
                (out_dir / "run.json").write_text(json.dumps(meta, indent=2))
                raise SystemExit(
                    "VIEW_PIXEL_FAIL after all views (" + str(len(view_pixel_failures)) + "): "
                    + " | ".join(view_pixel_failures)
                )

        meta["renders"] = renders
        meta["view_content_validation"] = view_content_reports
        meta["status"] = "ok"
        (out_dir / "validation.json").write_text(
            json.dumps(
                {
                    "state_table": st_val_full,
                    "framing": framing,
                    "ring": ring_val,
                    "views": view_content_reports,
                },
                indent=2,
            )
        )
        (out_dir / "run.json").write_text(json.dumps(meta, indent=2))
        (out_dir / "TRACE_NEXT.md").write_text(
            "# Measure / Moho (v6)\n\n"
            "1. Shadow-cal: `shadow_cal_lift_*.png` — caster invisible to camera; measure full penumbra. "
            "Do not force-match analytic size/dist. v5 beauty y90 occluded — contaminated.\n"
            "2. Moho: PASS closed loop (v5) — no further loop experiments.\n"
            "3. Views: unlit flat emission text; continue after pixel fail; chrome avatar pixel gate.\n"
            "4. Prefer `--probe --only views` before full 64/1280.\n"
            "5. Shadow: use `camera_instrumentation.json` + `calibrate_shadow_ground.py` — "
            "do **not** treat image-px exposed offset (Mac v3 ~8.75) as ground-plane model.\n"
            "6. Panel edge motion contaminates image-space offset; unproject first.\n"
            "3. State ROI: pressed=scale+ring, disabled=opacity — not global mean.\n"
            "4. Views are DESIGN-STUDY with typography/avatar; not live WebGPU acceptance.\n"
            "5. Moho: CreateExp7ArtComparison draws shapes; render with proven `-r` only (FileRender SEGV).\n"
            "6. fits.json remains provisional until ground-space fit matches elev/size model or model is revised with evidence.\n"
        )
        log("DONE " + str(out_dir))
        print(
            json.dumps(
                {
                    "ok": True,
                    "out_dir": str(out_dir),
                    "count": len(renders),
                    "framing": framing["metrics"],
                    "ring": ring_val,
                    "rev": GENERATOR_REV,
                },
                indent=2,
            )
        )
        return 0
    except Exception:
        log(traceback.format_exc())
        raise
    finally:
        release_lock(lock)


if __name__ == "__main__":
    raise SystemExit(main() or 0)
