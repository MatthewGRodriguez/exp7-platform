#!/usr/bin/env python3
# SPDX-License: project-local
"""Exp7 UI art Blender generator — Blender 4.2.1 LTS + Cycles METAL.

Designed for Mac worker inventory:
  /Applications/Blender.app/Contents/MacOS/Blender  (4.2.1 LTS)
  Cycles METAL · Apple M3 GPU (10 cores)

Does NOT change Blender user preferences/settings files. Device selection is
session-only via bpy API for this process.

Outputs (default ArtScratch, one heavy job at a time):
  /Users/user-rodri/ArtScratch/exp7-art/blender/<run_id>/

Usage (on Mac):
  export ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
  /Applications/Blender.app/Contents/MacOS/Blender --background --python \\
    art/pipeline/blender/generate_ui_scene.py -- \\
    --params art/design/params.json \\
    --states art/design/state-table.json \\
    --stage ui-states \\
    --samples 64

Lock: creates ART_SCRATCH/blender/.heavy.lock (fails if another heavy job holds it).
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
    from mathutils import Vector, Euler  # type: ignore
except ImportError:
    bpy = None  # allows --dry-run syntax check outside Blender


DEFAULT_SCRATCH = "/Users/user-rodri/ArtScratch/exp7-art"


def log(msg: str) -> None:
    sys.stderr.write(msg + "\n")
    sys.stderr.flush()


def parse_args(argv=None):
    # Blender passes args after "--"
    if argv is None:
        argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser(description="Exp7 UI Blender 4.2.1 METAL generator")
    p.add_argument("--params", required=True, help="art/design/params.json")
    p.add_argument("--states", required=True, help="art/design/state-table.json")
    p.add_argument("--scratch", default=os.environ.get("ART_SCRATCH", DEFAULT_SCRATCH))
    p.add_argument("--stage", default="ui-states", help="subdir under blender/")
    p.add_argument("--run-id", default=None)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--resolution", default="1280x720")
    p.add_argument("--device", default="METAL", choices=["METAL", "CPU"])
    p.add_argument("--states-filter", default="", help="comma list; empty=all elementStates")
    p.add_argument("--focal-mm", type=float, default=None, help="override params camera focal")
    p.add_argument("--dry-run", action="store_true", help="validate inputs only; no bpy render")
    p.add_argument("--skip-lock", action="store_true")
    return p.parse_args(argv)


def acquire_lock(scratch: Path, skip: bool) -> Path | None:
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
        raise SystemExit(f"BLOCKED: heavy lock held ({lock}) age={age:.0f}s body={body!r}. One heavy job at a time.")
    lock.write_text(json.dumps({"pid": os.getpid(), "started": time.time(), "host": os.uname().nodename}))
    return lock


def release_lock(lock: Path | None) -> None:
    if lock and lock.exists():
        try:
            lock.unlink()
        except OSError:
            pass


def configure_cycles_metal(samples: int, device: str) -> dict:
    """Session-only Cycles config for Blender 4.2.x. Does not write userpref."""
    assert bpy is not None
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(samples)
    scene.cycles.use_denoising = True
    info = {"engine": "CYCLES", "requested_device": device, "devices": []}

    prefs = bpy.context.preferences.addons["cycles"].preferences
    # 4.2 API: compute_device_type + get_devices()
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
            log(f"WARN get_devices_for_type METAL: {e}")
        if not metal:
            # Fallback enumerate
            try:
                for d in prefs.devices:
                    if "METAL" in str(getattr(d, "type", "")).upper() or "APPLE" in str(getattr(d, "name", "")).upper():
                        metal.append(d)
            except Exception:
                pass
        for d in metal:
            d.use = True
            info["devices"].append({"name": getattr(d, "name", "?"), "type": str(getattr(d, "type", "?")), "use": True})
        scene.cycles.device = "GPU" if metal else "CPU"
        info["cycles_device"] = scene.cycles.device
        if not metal:
            log("WARN: no METAL devices found; falling back to CPU for this session")
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


def make_panel(name: str, size, lift: float, radius: float):
    assert bpy is not None
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, lift + size[2] / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    # bevel for UI radius read
    bevel = obj.modifiers.new("Bevel", "BEVEL")
    bevel.width = max(0.001, radius * 0.01)
    bevel.segments = 3
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.96, 0.97, 0.98, 1)
        bsdf.inputs["Roughness"].default_value = 0.35
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = 0.15
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = 0.15
    obj.data.materials.append(mat)
    return obj


def make_light(params: dict):
    assert bpy is not None
    light = params["light"]
    elev = math.radians(float(light["elevationDeg"]))
    az = math.radians(float(light.get("azimuthDeg", 0)))
    dist = float(light["distance"]) * 0.01  # params in px-ish; scene units meters-ish
    size = float(light["size"]) * 0.01
    x = dist * math.cos(elev) * math.sin(az)
    y = -dist * math.cos(elev) * math.cos(az)
    z = dist * math.sin(elev)
    bpy.ops.object.light_add(type="AREA", location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = "Exp7KeyLight"
    obj.data.shape = "DISK"
    obj.data.size = max(0.05, size)
    obj.data.energy = 250
    # aim at origin
    direction = Vector((0, 0, 0.02)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


def make_camera(params: dict, focal_mm: float):
    assert bpy is not None
    cam_p = params["camera"]
    dist = float(cam_p["distancePx"]) * 0.01
    bpy.ops.object.camera_add(location=(0.0, -dist, 0.6))
    cam = bpy.context.active_object
    cam.name = "Exp7UICamera"
    cam.data.type = "PERSP"
    cam.data.lens = float(focal_mm)
    cam.data.clip_start = float(cam_p.get("near", 10)) * 0.01
    cam.data.clip_end = float(cam_p.get("far", 4000)) * 0.01
    # look at panel
    direction = Vector((0, 0, 0.05)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def render_still(out_path: Path, res: tuple[int, int]):
    assert bpy is not None
    scene = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(out_path)
    bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    params = json.loads(Path(args.params).read_text())
    states = json.loads(Path(args.states).read_text())
    scratch = Path(args.scratch)
    run_id = args.run_id or time.strftime("%Y%m%d-%H%M%S")
    out_dir = scratch / "blender" / args.stage / run_id
    rx, ry = [int(x) for x in args.resolution.lower().split("x")]
    focal = float(args.focal_mm if args.focal_mm is not None else params["camera"]["focalMmChosen"])
    filt = [s.strip() for s in args.states_filter.split(",") if s.strip()]
    element_states = states["elementStates"]
    if filt:
        element_states = {k: v for k, v in element_states.items() if k in filt}

    meta = {
        "blender_target": "4.2.1 LTS",
        "executable_expected": "/Applications/Blender.app/Contents/MacOS/Blender",
        "cycles_device_requested": args.device,
        "scratch": str(scratch),
        "out_dir": str(out_dir),
        "focal_mm": focal,
        "samples": args.samples,
        "states": list(element_states.keys()),
        "params_id": params.get("id"),
        "evidence": "rendered-on-mac-when-this-script-completes; cloud dry-run is not GPU proof",
    }

    if args.dry_run or bpy is None:
        meta["dry_run"] = True
        meta["bpy_available"] = bpy is not None
        print(json.dumps(meta, indent=2))
        if bpy is None and not args.dry_run:
            raise SystemExit("bpy missing — run inside Blender --background --python")
        return 0

    lock = None
    try:
        lock = acquire_lock(scratch, args.skip_lock)
        out_dir.mkdir(parents=True, exist_ok=True)
        clear_scene()
        device_info = configure_cycles_metal(args.samples, args.device)
        meta["device_info"] = device_info
        make_light(params)
        # ground for shadows
        bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
        ground = bpy.context.active_object
        ground.name = "Ground"
        gmat = bpy.data.materials.new("GroundMat")
        gmat.use_nodes = True
        ground.data.materials.append(gmat)

        make_camera(params, focal)
        geom = params["geometry"]
        size = (1.6, 1.0, max(0.02, float(geom.get("thicknessPx", 1)) * 0.01))
        radius = float(geom.get("radii", {}).get("panel", 10))

        renders = []
        for name, st in element_states.items():
            lift = float(st.get("lift", 0)) * 0.01
            clear_panels = [o for o in bpy.data.objects if o.name.startswith("UIPanel_")]
            for o in clear_panels:
                bpy.data.objects.remove(o, do_unlink=True)
            make_panel(f"UIPanel_{name}", size, lift, radius)
            out_png = out_dir / f"state_{name}.png"
            log(f"RENDER state={name} lift={lift} -> {out_png}")
            render_still(out_png, (rx, ry))
            renders.append({"state": name, "path": str(out_png), "lift": lift})

        # lift series
        for lift_px in (0, 1, 2, 4, 8):
            clear_panels = [o for o in bpy.data.objects if o.name.startswith("UIPanel_")]
            for o in clear_panels:
                bpy.data.objects.remove(o, do_unlink=True)
            make_panel("UIPanel_lift", size, lift_px * 0.01, radius)
            out_png = out_dir / f"lift_{lift_px:02d}px.png"
            render_still(out_png, (rx, ry))
            renders.append({"series": "lift", "lift_px": lift_px, "path": str(out_png)})

        meta["renders"] = renders
        meta["status"] = "ok"
        (out_dir / "run.json").write_text(json.dumps(meta, indent=2))
        # also write measured-fit stub for Mac to fill after tracing
        (out_dir / "TRACE_NEXT.md").write_text(
            "# Next: measure shadow offset/blur/alpha from these PNGs\n"
            "Compare to h*cot(elevation) and h*lightSize/distance from params.json.\n"
            "Write measured fits back to lighting/fits.measured.json — analytical fits are provisional only.\n"
        )
        log("DONE " + str(out_dir))
        print(json.dumps({"ok": True, "out_dir": str(out_dir), "count": len(renders)}, indent=2))
        return 0
    except Exception:
        log(traceback.format_exc())
        raise
    finally:
        release_lock(lock)


if __name__ == "__main__":
    raise SystemExit(main() or 0)
