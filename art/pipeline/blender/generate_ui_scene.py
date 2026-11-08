#!/usr/bin/env python3
"""Exp7 UI art Blender generator — Blender 4.2.1 LTS + Cycles METAL.

Rev front-readable-v3 (after Mac v2 quality FAIL):
  - Focus/selected/invalid/drop-pending rings follow rounded-panel contour from
    shared geometry.radii (not oversized torii).
  - State face colors use the same palette washes as art/src/jrviews-ux-states.js
    (selection/accent/invalid/disabled alphas) — not lift-only / wash-token-only.
  - Paired shadow-catcher + surface-only lift renders so offset/blur can be fit
    separately (beauty stay provisional for measure).
  - Calendar / Board / Plan / chrome compositions from shared params (not a lone
    generic panel).
  - Framing + state-table gates retained; ROI note for hover/pressed/disabled.

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
GENERATOR_REV = "front-readable-v3"

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
    "pressed": (36, 88, 166, 26),
    "selected": (36, 88, 166, 32),
    "dragging": (36, 88, 166, 20),
    "drop-pending": (117, 81, 15, 24),
    "invalid": (170, 0, 0, 20),
    "settling": (36, 88, 166, 12),
    "disabled": (154, 163, 178, 48),
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
    p.add_argument("--stage", default="ui-states-v3")
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
    return p.parse_args(argv)


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


def configure_cycles_metal(samples: int, device: str) -> dict:
    assert bpy is not None
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(samples)
    scene.cycles.use_denoising = True
    info = {"engine": "CYCLES", "requested_device": device, "devices": []}
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


def make_light(params: dict):
    assert bpy is not None
    light = params["light"]
    elev = math.radians(float(light["elevationDeg"]))
    az = math.radians(float(light.get("azimuthDeg", 0)))
    dist = 4.5
    size = max(0.35, float(light["size"]) * 0.004)
    x = dist * math.cos(elev) * math.sin(az)
    y = -dist * math.cos(elev) * math.cos(az)
    z = dist * math.sin(elev)
    bpy.ops.object.light_add(type="AREA", location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = "Exp7KeyLight"
    obj.data.shape = "DISK"
    obj.data.size = size
    obj.data.energy = 420
    direction = Vector((0, 0, 0.05)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


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


def make_contour_ring(name, sx, sy, z, scale, radius_m, ring_w, color, tilt):
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
    outer.data.materials.append(principled_mat(name + "_mat", color, emit=0.12, rough=0.28))
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

    face = face_color_for_state(st_name, st, palette)
    mat = principled_mat(name + "_mat", face, opacity=opacity)
    zc = lift_m + thick / 2
    obj = make_box(name, sx * scale, sy * scale, thick, (origin[0], origin[1], zc), rad, mat)
    if abs(tilt) > 1e-6:
        obj.rotation_euler[0] = math.radians(tilt)

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
            "v3: rounded-panel contour rings; JRViews washes; shadow-catcher+surface pairs; "
            "Calendar/Board/Plan/chrome compositions; ROI measure guidance"
        ),
        "mac_v2_fail_ref": "run-v2-20261108T1050 oversized torus rings; global-mean |dL| misread",
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
        "measure_guidance": {
            "do_not_use": "global mean |dL| across full frame",
            "use": "ROI = panel projected bbox; geometric scale/opacity/ring presence; shadow-only pass for offset/blur",
            "subtle_by_design": ["hover", "settling"],
            "meaningful_cues": ["pressed.scale", "disabled.opacity+wash", "focus/selected/invalid contour rings"],
            "analytical_fits": "provisional until shadow_*.png + surface_*.png measured",
        },
        "evidence": "rendered-on-mac-when-complete; dry-run is not GPU proof",
    }

    if args.dry_run or bpy is None:
        meta["dry_run"] = True
        meta["bpy_available"] = bpy is not None
        # Ring hug estimate: contour ring outer = panel + 2*ring_w
        sx, sy = 1.7, 1.05
        rw = px_m(2.5, geom)
        meta["ring_estimate"] = {
            "panel_xy": [sx, sy],
            "ring_outer_xy": [sx + 2 * rw, sy + 2 * rw],
            "max_overshoot_frac": (2 * rw) / min(sx, sy),
            "reject_if_overshoot_gt": 0.35,
        }
        meta["views_planned"] = ["calendar", "board", "plan", "chrome"]
        meta["shadow_passes_planned"] = ["shadow_lift_##px.png", "surface_lift_##px.png"]
        print(json.dumps(meta, indent=2))
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
        make_light(params)
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

        renders = []
        # State beauty series
        for name, st in element_states.items():
            clear_named("UIPanel_")
            make_panel(f"UIPanel_{name}", st, palette, geom, st_name=name, content_lines=2)
            out_png = out_dir / f"state_{name}.png"
            log(f"RENDER state={name} wash={WASH_RGBA.get(name)} ring={st.get('ring')} scale={st.get('scale')} opacity={st.get('opacity')}")
            render_still(out_png, (rx, ry))
            obj = bpy.data.objects.get(f"UIPanel_{name}")
            metrics = projected_metrics(cam, obj, (rx, ry)) if obj else {}
            renders.append({"state": name, "path": str(out_png), "visual": visual_keys(st), "projected": metrics, "pass": "beauty"})

        # Lift beauty + paired shadow/surface measurement passes
        for lift_px in (0, 1, 2, 4, 8):
            clear_named("UIPanel_")
            st = dict(element_states["idle"])
            st["lift"] = float(lift_px)
            make_panel("UIPanel_lift", st, palette, geom, st_name="idle", content_lines=0)
            out_png = out_dir / f"lift_{lift_px:02d}px.png"
            render_still(out_png, (rx, ry))
            renders.append({"series": "lift", "lift_px": lift_px, "path": str(out_png), "pass": "beauty"})

            if not args.skip_shadow_passes:
                # Shadow-only: catcher ground, transparent film
                ensure_ground(catcher=True)
                out_sh = out_dir / f"shadow_lift_{lift_px:02d}px.png"
                render_still(out_sh, (rx, ry), transparent=True)
                renders.append({"series": "lift-shadow", "lift_px": lift_px, "path": str(out_sh), "pass": "shadow_catcher"})
                # Surface-only: hide ground, opaque film
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

        # Tilt series
        for tilt in (0, 2, 5, 10):
            clear_named("UIPanel_")
            st = dict(element_states["idle"])
            make_panel("UIPanel_tilt", st, palette, geom, tilt_deg=float(tilt), st_name="idle")
            out_png = out_dir / f"tilt_{tilt:02d}deg.png"
            render_still(out_png, (rx, ry))
            renders.append({"series": "tilt", "tilt_deg": tilt, "path": str(out_png)})

        # Perspective study
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

        # Full view compositions
        if not args.skip_views:
            view_cam = make_camera_front(
                focal,
                params["camera"].get("near", 10),
                params["camera"].get("far", 4000),
                loc=Vector((0.2, -3.2, 2.9)),
                target=Vector((0.0, 0.2, 0.15)),
            )
            bpy.context.scene.camera = view_cam
            for view_name, composer in (
                ("calendar", compose_calendar),
                ("board", compose_board),
                ("plan", compose_plan),
                ("chrome", compose_chrome),
            ):
                clear_named("View")
                clear_named("UIPanel_")
                ensure_ground(catcher=False)
                composer(palette, geom, states_doc["elementStates"])
                out_png = out_dir / f"view_{view_name}.png"
                log(f"RENDER view={view_name}")
                render_still(out_png, (rx, ry))
                renders.append({"series": "view", "view": view_name, "path": str(out_png)})
            bpy.context.scene.camera = cam

        meta["renders"] = renders
        meta["status"] = "ok"
        (out_dir / "run.json").write_text(json.dumps(meta, indent=2))
        (out_dir / "TRACE_NEXT.md").write_text(
            "# Measure (v3)\n\n"
            "1. Use `shadow_lift_*.png` (catcher) for offset + penumbra — not beauty composites.\n"
            "2. Use `surface_lift_*.png` for panel silhouette without ground shadow.\n"
            "3. State deltas: ROI = panel projected bbox from validation/run projected metrics; "
            "do **not** use full-frame mean |dL| (Mac v2 false FAIL for hover/pressed).\n"
            "4. Expect hover/settling subtle by design (JRViews wash α 12–14); "
            "pressed=scale+wash, disabled=opacity+wash, focus/selected/invalid=contour rings.\n"
            "5. Write `lighting/fits.measured.json`. Analytical fits.json stays provisional until then.\n"
            "6. Views: `view_calendar|board|plan|chrome.png` must show content strips + state variety.\n"
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
