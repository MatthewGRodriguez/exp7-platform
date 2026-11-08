#!/usr/bin/env python3
"""Exp7 UI art Blender generator — Blender 4.2.1 LTS + Cycles METAL.

Fixes (after Mac METAL fail run-20261108T1045):
  - Camera was grazing the ground (edge-on ~120x17 sliver). Now uses elevated
    front-readable framing so the panel face + ground shadow are measurable.
  - States apply design palette materials, rings, opacity, scale, tilt — not lift alone.
  - Adds tilt series + perspective study cameras.
  - Pre-render validation rejects edge-on / negligible projected area and
    state poses that are identical to idle (except idle itself).

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
    from mathutils import Vector, Matrix  # type: ignore
except ImportError:
    bpy = None
    Vector = None
    Matrix = None

DEFAULT_SCRATCH = "/Users/user-rodri/ArtScratch/exp7-art"

# Validation gates (CSS/frame relative)
MIN_PROJECTED_AREA_FRAC = 0.04          # panel bbox area / frame area
MIN_PROJECTED_HEIGHT_FRAC = 0.12        # reject slivers
MIN_ASPECT = 0.35                       # w/h
MAX_ASPECT = 4.0
MIN_STATE_DIFF_KEYS = 1                 # non-idle must differ from idle in >=1 visual key


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
    p = argparse.ArgumentParser(description="Exp7 UI Blender 4.2.1 METAL generator (front-readable)")
    p.add_argument("--params", required=True)
    p.add_argument("--states", required=True)
    p.add_argument("--scratch", default=os.environ.get("ART_SCRATCH", DEFAULT_SCRATCH))
    p.add_argument("--stage", default="ui-states")
    p.add_argument("--run-id", default=None)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--resolution", default="1280x720")
    p.add_argument("--device", default="METAL", choices=["METAL", "CPU"])
    p.add_argument("--states-filter", default="")
    p.add_argument("--focal-mm", type=float, default=None)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--skip-lock", action="store_true")
    p.add_argument("--skip-validate", action="store_true")
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


def build_palette(params: dict) -> dict:
    p = dict(params["palette"])
    # Derived washes from design colors only (no arbitrary hues).
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
    }
    p["_ring"] = {
        "none": None,
        "focus": selection,
        "gold": accent,
        "caution": invalid,
    }
    return p


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
            info["devices"].append({"name": getattr(d, "name", "?"), "type": str(getattr(d, "type", "?")), "use": True})
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


def make_ground():
    assert bpy is not None
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    mat = bpy.data.materials.new("GroundMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.82, 0.84, 0.87, 1)
        bsdf.inputs["Roughness"].default_value = 0.7
    ground.data.materials.append(mat)
    return ground


def make_light(params: dict):
    assert bpy is not None
    light = params["light"]
    elev = math.radians(float(light["elevationDeg"]))
    az = math.radians(float(light.get("azimuthDeg", 0)))
    # Scene units: keep light close enough for readable soft shadow under frontal camera
    dist = 4.5
    size = max(0.4, float(light["size"]) * 0.004)
    x = dist * math.cos(elev) * math.sin(az)
    y = -dist * math.cos(elev) * math.cos(az)
    z = dist * math.sin(elev)
    bpy.ops.object.light_add(type="AREA", location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = "Exp7KeyLight"
    obj.data.shape = "DISK"
    obj.data.size = size
    obj.data.energy = 400
    direction = Vector((0, 0, 0.05)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


def make_camera_front(focal_mm: float, near: float, far: float):
    """Elevated front-readable camera: see panel FACE + ground shadow.
    Not grazing. Target fills a large fraction of the frame.
    """
    assert bpy is not None
    # Look from south-east-high toward origin — face readable, shadow cast northward visible
    loc = Vector((0.15, -2.6, 2.35))
    target = Vector((0.0, 0.0, 0.08))
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
        loc = Vector((0.0, -2.5, 2.8))  # more pitch
    else:
        loc = Vector((1.4, -2.4, 2.6))  # yaw + pitch
    target = Vector((0.0, 0.0, 0.08))
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object
    cam.name = name
    cam.data.lens = float(focal_mm)
    cam.data.sensor_width = 36.0
    direction = target - loc
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return cam


def principled_panel_mat(name: str, base, opacity: float, rough: float = 0.32):
    assert bpy is not None
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if opacity < 0.999 else "OPAQUE"
    try:
        mat.shadow_method = "HASHED" if opacity < 0.999 else "OPAQUE"
    except Exception:
        pass
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    out = nt.nodes.get("Material Output")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (base[0], base[1], base[2], 1)
        bsdf.inputs["Roughness"].default_value = rough
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = float(opacity)
        # slight glass for glass-light material language without caustics
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = 0.08
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = 0.08
    return mat


def ring_mat(name: str, color):
    assert bpy is not None
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1)
        bsdf.inputs["Roughness"].default_value = 0.25
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (color[0], color[1], color[2], 1)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = 0.15
    return mat


def make_panel(name: str, st: dict, palette: dict, geom: dict, tilt_deg: float = None):
    """Horizontal UI card on XY; face toward +Z (up) so elevated camera reads the face."""
    assert bpy is not None
    lift_m = float(st.get("lift", 0)) * 0.02  # exaggerate lift slightly for measure (2cm per design-px)
    thick = max(0.03, float(geom.get("thicknessPx", 1)) * 0.02)
    sx, sy = 1.7, 1.05
    scale = float(st.get("scale", 1.0))
    opacity = float(st.get("opacity", 1.0))
    tilt = float(st.get("tilt", 0) if tilt_deg is None else tilt_deg)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, lift_m + thick / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx / 2 * scale, sy / 2 * scale, thick / 2)
    bpy.ops.object.transform_apply(scale=True)
    if abs(tilt) > 1e-6:
        obj.rotation_euler[0] = math.radians(tilt)  # pitch

    bevel = obj.modifiers.new("Bevel", "BEVEL")
    bevel.width = max(0.008, float(geom.get("radii", {}).get("panel", 10)) * 0.0015)
    bevel.segments = 4

    bg_key = st.get("bg", "surface")
    base = palette["_rgba"].get(bg_key) or palette["_rgba"]["surface"]
    mat = principled_panel_mat(name + "_mat", base, opacity)
    obj.data.materials.append(mat)

    # Border as thin top rim strip using border color (design border/selection/invalid/accent)
    border_key = st.get("border", "border")
    border_col = palette["_rgba"].get(border_key) or palette["_rgba"]["border"]
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.0, 0.0, lift_m + thick + 0.004),
    )
    rim = bpy.context.active_object
    rim.name = name + "_border"
    rim.scale = (sx / 2 * scale * 1.01, sy / 2 * scale * 1.01, 0.004)
    bpy.ops.object.transform_apply(scale=True)
    if abs(tilt) > 1e-6:
        rim.rotation_euler[0] = math.radians(tilt)
    rim.data.materials.append(ring_mat(name + "_border_mat", border_col))

    ring = st.get("ring", "none")
    ring_col = palette["_ring"].get(ring)
    ring_obj = None
    if ring_col:
        bpy.ops.mesh.primitive_torus_add(
            major_radius=max(sx, sy) * 0.28 * scale,
            minor_radius=0.012,
            location=(0.0, 0.0, lift_m + thick + 0.02),
        )
        ring_obj = bpy.context.active_object
        ring_obj.name = name + "_ring"
        if abs(tilt) > 1e-6:
            ring_obj.rotation_euler[0] = math.radians(tilt)
        ring_obj.data.materials.append(ring_mat(name + "_ring_mat", ring_col))

    return obj, rim, ring_obj


def clear_named(prefix: str):
    assert bpy is not None
    for o in list(bpy.data.objects):
        if o.name.startswith(prefix):
            bpy.data.objects.remove(o, do_unlink=True)


def world_corners(obj):
    assert bpy is not None
    mat = obj.matrix_world
    return [mat @ Vector(c) for c in obj.bound_box]


def project_points(cam, points, res):
    """Return list of (x,y) pixel coords + visibility flags using Blender camera."""
    assert bpy is not None
    scene = bpy.context.scene
    render = scene.render
    # Use camera view frame projection
    from bpy_extras.object_utils import world_to_camera_view  # type: ignore

    out = []
    for p in points:
        co = world_to_camera_view(scene, cam, p)
        # co.x/y in 0..1 if in frame; co.z depth
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
        if len(diffs) < MIN_STATE_DIFF_KEYS:
            errors.append(f"state '{name}' identical to idle in material/lift/scale/opacity/ring/tilt")
    # pressed/disabled/invalid must carry a non-lift visual (Mac fail: lift-only → ≤1 luma)
    for name in ("pressed", "disabled", "invalid"):
        if name not in states:
            continue
        vk = visual_keys(states[name])
        nonlift = [k for k in ("scale", "opacity", "ring", "bg", "border", "tilt") if vk[k] != idle[k]]
        if not nonlift:
            errors.append(
                f"state '{name}' has no non-lift material/scale/opacity/ring/border/tilt vs idle"
            )
    return {"ok": not errors, "errors": errors}


def render_still(out_path: Path, res):
    assert bpy is not None
    scene = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(out_path)
    # Light background for readable UI (not charcoal that hides slivers)
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.91, 0.93, 0.95, 1)
        bg.inputs[1].default_value = 0.6
    bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    params = json.loads(Path(args.params).read_text())
    states_doc = json.loads(Path(args.states).read_text())
    palette = build_palette(params)
    element_states = states_doc["elementStates"]
    filt = [s.strip() for s in args.states_filter.split(",") if s.strip()]
    if filt:
        element_states = {k: v for k, v in element_states.items() if k in filt}

    st_val = validate_state_table(element_states)
    if not st_val["ok"] and not args.skip_validate:
        raise SystemExit("STATE_TABLE_VALIDATION_FAIL: " + "; ".join(st_val["errors"]))

    scratch = Path(args.scratch)
    run_id = args.run_id or time.strftime("%Y%m%d-%H%M%S")
    out_dir = scratch / "blender" / args.stage / run_id
    rx, ry = [int(x) for x in args.resolution.lower().split("x")]
    focal = float(args.focal_mm if args.focal_mm is not None else params["camera"]["focalMmChosen"])
    geom = params["geometry"]

    meta = {
        "generator": "generate_ui_scene.py",
        "generator_rev": "front-readable-v2",
        "blender_target": "4.2.1 LTS",
        "fix_note": "Fixes edge-on camera from run-20261108T1045; applies state materials/rings/opacity/scale/tilt",
        "executable_expected": "/Applications/Blender.app/Contents/MacOS/Blender",
        "cycles_device_requested": args.device,
        "scratch": str(scratch),
        "out_dir": str(out_dir),
        "focal_mm": focal,
        "samples": args.samples,
        "states": list(element_states.keys()),
        "params_id": params.get("id"),
        "state_table_validation": st_val,
        "evidence": "rendered-on-mac-when-complete; dry-run is not GPU proof",
        "analytical_fits": "still provisional until measured from these PNGs",
    }

    if args.dry_run or bpy is None:
        meta["dry_run"] = True
        meta["bpy_available"] = bpy is not None
        # Approximate frustum check without bpy: synthetic aspect of a card seen at 40deg
        elev = math.radians(40)
        card_w, card_h = 1.7, 1.05
        proj_h = card_h * math.cos(elev) + 0.03 * math.sin(elev)
        proj_w = card_w
        aspect = proj_w / max(1e-6, proj_h)
        area_frac_est = (proj_w * proj_h) / (4.0 * 2.5)  # crude vs framing volume
        meta["frustum_estimate"] = {"aspect": aspect, "proj_h": proj_h, "area_frac_est": area_frac_est}
        if aspect > MAX_ASPECT or proj_h < 0.3:
            meta["frustum_estimate"]["warn"] = "estimate looks edge-on; bpy validation required"
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
        make_ground()
        make_light(params)
        cam = make_camera_front(focal, params["camera"].get("near", 10), params["camera"].get("far", 4000))

        # Validate framing on idle before expensive series
        panel, rim, ring = make_panel("UIPanel_validate", element_states["idle"], palette, geom)
        framing = validate_framing(cam, panel, (rx, ry))
        meta["framing_validation"] = framing
        (out_dir / "validation.json").write_text(json.dumps({"state_table": st_val, "framing": framing}, indent=2))
        if not framing["ok"] and not args.skip_validate:
            raise SystemExit("FRAMING_VALIDATION_FAIL: " + "; ".join(framing["errors"]) + f" metrics={framing['metrics']}")
        clear_named("UIPanel_")

        renders = []
        for name, st in element_states.items():
            clear_named("UIPanel_")
            make_panel(f"UIPanel_{name}", st, palette, geom)
            out_png = out_dir / f"state_{name}.png"
            log(f"RENDER state={name} lift={st.get('lift')} scale={st.get('scale')} opacity={st.get('opacity')} ring={st.get('ring')} bg={st.get('bg')}")
            render_still(out_png, (rx, ry))
            # per-state framing record
            obj = bpy.data.objects.get(f"UIPanel_{name}")
            metrics = projected_metrics(cam, obj, (rx, ry)) if obj else {}
            renders.append({"state": name, "path": str(out_png), "visual": visual_keys(st), "projected": metrics})

        # Lift series (idle materials)
        for lift_px in (0, 1, 2, 4, 8):
            clear_named("UIPanel_")
            st = dict(element_states["idle"])
            st["lift"] = float(lift_px)
            make_panel("UIPanel_lift", st, palette, geom)
            out_png = out_dir / f"lift_{lift_px:02d}px.png"
            render_still(out_png, (rx, ry))
            renders.append({"series": "lift", "lift_px": lift_px, "path": str(out_png)})

        # Tilt series (idle lift, vary tilt)
        for tilt in (0, 2, 5, 10):
            clear_named("UIPanel_")
            st = dict(element_states["idle"])
            make_panel("UIPanel_tilt", st, palette, geom, tilt_deg=float(tilt))
            out_png = out_dir / f"tilt_{tilt:02d}deg.png"
            render_still(out_png, (rx, ry))
            renders.append({"series": "tilt", "tilt_deg": tilt, "path": str(out_png)})

        # Perspective study (idle selected-looking panel for readability)
        study_st = dict(element_states.get("selected", element_states["idle"]))
        for mode in (1, 2, 3):
            clear_named("UIPanel_")
            make_panel("UIPanel_persp", study_st, palette, geom)
            sc = make_camera_study(f"StudyCam_{mode}pt", mode, focal)
            bpy.context.scene.camera = sc
            out_png = out_dir / f"persp_{mode}pt.png"
            render_still(out_png, (rx, ry))
            renders.append({"series": "perspective", "mode": mode, "path": str(out_png)})
        bpy.context.scene.camera = cam

        meta["renders"] = renders
        meta["status"] = "ok"
        (out_dir / "run.json").write_text(json.dumps(meta, indent=2))
        (out_dir / "TRACE_NEXT.md").write_text(
            "# Measure shadows from frontal PNGs\n"
            "Compare offset to h*cot(elevation) and penumbra to h*lightSize/distance.\n"
            "Write lighting/fits.measured.json. Analytical fits.json remains provisional until then.\n"
            "Reject any frame with projected height_frac < 0.12 (sliver).\n"
        )
        log("DONE " + str(out_dir))
        print(json.dumps({"ok": True, "out_dir": str(out_dir), "count": len(renders), "framing": framing["metrics"]}, indent=2))
        return 0
    except Exception:
        log(traceback.format_exc())
        raise
    finally:
        release_lock(lock)


if __name__ == "__main__":
    raise SystemExit(main() or 0)
