#!/usr/bin/env python3
"""Cheap single-view root-cause diagnostic for Exp7 DESIGN-STUDY (CPU or METAL).

Prints (JSON to stdout + sidecar):
  - color_management / view_transform / look / display
  - every FONT object: world AABB, Blender size, emission Color+Strength, material nodes
  - projected pixel AABB at probe 640x360 AND production 1280x720 (same camera)
  - estimated glyph height in pixels (size * projected scale)
  - one known swatch strip render (ink / secondary / white / mid) for AgX vs display check

Does NOT pack a handoff. Does NOT mutate palette blindly.
Mac: Blender.app/.../Blender --background --python diagnose_view_rootcause.py -- \\
  --params art/design/params.json --states art/design/state-table.json \\
  --out ~/ArtScratch/exp7-art/diag-v7 --view calendar [--render] [--device CPU|METAL]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import bpy  # type: ignore
    from mathutils import Vector  # type: ignore
except ImportError:
    print(json.dumps({"ok": False, "error": "bpy required — run inside Blender --background --python"}))
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_ui_scene as gen  # noqa: E402
import views_content as VC  # noqa: E402


def parse_args(argv=None):
    if argv is None:
        argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument("--params", required=True)
    p.add_argument("--states", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--view", default="calendar", choices=["calendar", "board", "plan", "chrome"])
    p.add_argument("--device", default="CPU", choices=["CPU", "METAL"])
    p.add_argument("--samples", type=int, default=8)
    p.add_argument("--render", action="store_true", help="Also Cycles-render view + swatches")
    p.add_argument("--view-transform", default="", help="Override: Standard|AgX|Filmic|Raw (empty=leave default)")
    return p.parse_args(argv)


def color_mgmt_snapshot():
    s = bpy.context.scene
    return {
        "view_transform": s.view_settings.view_transform,
        "look": s.view_settings.look,
        "exposure": s.view_settings.exposure,
        "gamma": s.view_settings.gamma,
        "display_device": s.display_settings.display_device,
        "sequencer": getattr(getattr(s, "sequencer_colorspace_settings", None), "name", None),
    }


def set_view_transform(name: str):
    if not name:
        return
    bpy.context.scene.view_settings.view_transform = name


def material_emission_info(ob):
    mats = list(ob.data.materials) if ob.data else []
    out = []
    for mat in mats:
        if not mat or not mat.use_nodes:
            out.append({"name": getattr(mat, "name", None), "nodes": []})
            continue
        nodes = []
        for n in mat.node_tree.nodes:
            entry = {"type": n.type, "bl_idname": n.bl_idname, "name": n.name}
            if n.type == "EMISSION":
                c = n.inputs["Color"].default_value
                entry["color"] = [float(c[0]), float(c[1]), float(c[2]), float(c[3])]
                entry["strength"] = float(n.inputs["Strength"].default_value)
            if n.type == "TEX_IMAGE":
                entry["image"] = n.image.name if n.image else None
                entry["colorspace"] = (
                    n.image.colorspace_settings.name if n.image else None
                )
            if n.type == "BSDF_PRINCIPLED":
                bc = n.inputs["Base Color"].default_value
                entry["base_color"] = [float(bc[0]), float(bc[1]), float(bc[2])]
            nodes.append(entry)
        out.append({"name": mat.name, "nodes": nodes})
    return out


def world_aabb(ob):
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    return {
        "min": [min(xs), min(ys), min(zs)],
        "max": [max(xs), max(ys), max(zs)],
        "size": [max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)],
        "center": [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2],
    }


def project_aabb(cam, ob, res_w, res_h):
    from bpy_extras.object_utils import world_to_camera_view  # type: ignore

    scene = bpy.context.scene
    # Temporarily set render res so camera_view aspect matches
    old = (scene.render.resolution_x, scene.render.resolution_y)
    scene.render.resolution_x, scene.render.resolution_y = res_w, res_h
    xs, ys, zs = [], [], []
    for c in ob.bound_box:
        co = world_to_camera_view(scene, cam, ob.matrix_world @ Vector(c))
        xs.append(co.x)
        ys.append(co.y)
        zs.append(co.z)
    scene.render.resolution_x, scene.render.resolution_y = old
    # NDC: x,y in 0..1 bottom-left origin in Blender; convert to top-left pixel box
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    # Blender y=0 bottom → image y down: iy = (1-y)*h
    px0 = minx * res_w
    px1 = maxx * res_w
    py_top = (1.0 - maxy) * res_h
    py_bot = (1.0 - miny) * res_h
    return {
        "ndc": [minx, miny, maxx, maxy],
        "px_tl": [px0, py_top, px1, py_bot],  # x0,y0,x1,y1 top-left origin
        "w_px": abs(px1 - px0),
        "h_px": abs(py_bot - py_top),
        "z_near": min(zs),
        "in_frame": minx >= 0 and maxx <= 1 and miny >= 0 and maxy <= 1 and min(zs) > 0,
    }


def make_swatch_strip(out_path: Path, transform_name: str, samples: int, device: str):
    """Known linear emission patches for calibration — not a view."""
    gen.clear_scene()
    set_view_transform(transform_name) if transform_name else None
    gen.configure_cycles_metal(samples, device)
    bpy.context.scene.cycles.use_denoising = False
    # Flat ortho-ish camera looking -Z at plane
    bpy.ops.object.camera_add(location=(0, 0, 2.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (0, 0, 0)
    bpy.context.scene.camera = cam
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 4.2

    patches = [
        ("ink", VC.INK),
        ("ink_secondary", VC.INK_SECONDARY),
        ("ink_disabled", VC.INK_DISABLED),
        ("white", (1.0, 1.0, 1.0)),
        ("mid_gray", (0.5, 0.5, 0.5)),
        ("softDisc", (238 / 255, 241 / 255, 246 / 255)),
    ]
    for i, (name, rgb) in enumerate(patches):
        x = -1.75 + i * 0.7
        bpy.ops.mesh.primitive_plane_add(size=0.55, location=(x, 0, 0))
        ob = bpy.context.active_object
        ob.name = f"Swatch_{name}"
        mat = bpy.data.materials.new(f"SwatchMat_{name}")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = (rgb[0], rgb[1], rgb[2], 1)
        em.inputs["Strength"].default_value = 1.0
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
        ob.data.materials.append(mat)

    bpy.context.scene.world = bpy.data.worlds.new("SwatchWorld") if not bpy.context.scene.world else bpy.context.scene.world
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.2, 0.2, 0.2, 1)
        bg.inputs[1].default_value = 0.0

    gen.render_still(out_path, (640, 120), transparent=False)
    return {"path": str(out_path), "patches": [p[0] for p in patches], "transform": color_mgmt_snapshot()}


def sample_png_mean(path: Path, boxes):
    """Stdlib PNG mean RGB in boxes — no PIL."""
    from validate_view_pixels import read_png_rgba

    w, h, px = read_png_rgba(path)
    out = {}
    for name, (x0, y0, x1, y1) in boxes.items():
        rs, gs, bs, n = 0, 0, 0, 0
        for y in range(max(0, y0), min(h, y1)):
            for x in range(max(0, x0), min(w, x1)):
                i = (y * w + x) * 4
                rs += px[i]
                gs += px[i + 1]
                bs += px[i + 2]
                n += 1
        if n:
            out[name] = {"mean_rgb": [rs / n, gs / n, bs / n], "n": n}
    return out, (w, h)


def main():
    args = parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    params = json.loads(Path(args.params).read_text())
    states_doc = json.loads(Path(args.states).read_text())
    geom = params.get("geometry", params)
    palette = gen.build_palette(params)
    focal = float(params["camera"]["focalMmChosen"])

    cm_default = color_mgmt_snapshot()
    report = {
        "ok": True,
        "label": "ROOTCAUSE-DIAG — not LIVE-GPU; not handoff",
        "view": args.view,
        "color_management_default": cm_default,
        "note": "Blender 4.2 default AgX remaps emission; UI ink hex≠display unless Standard/Raw",
        "texts": [],
        "avatar": None,
        "framing": None,
        "glyph_budget": {},
        "swatches": {},
        "renders": {},
    }

    # --- Geometry / projection pass (no Cycles required) ---
    gen.clear_scene()
    if args.view_transform:
        set_view_transform(args.view_transform)
    report["color_management_active"] = color_mgmt_snapshot()

    gen.configure_cycles_metal(args.samples, args.device)
    gen.ensure_ground(catcher=False)
    # Match production view camera
    view_cam = gen.make_camera_front(
        min(focal, 50.0),
        params["camera"].get("near", 10),
        params["camera"].get("far", 4000),
        loc=Vector((0.0, -7.2, 5.4)),
        target=Vector((0.0, 0.1, 0.15)),
    )
    gen.make_light(params, geom)  # fidelity to production lights even if text is emission

    font_id = VC._load_font_id(VC.find_font())
    composers = {
        "calendar": VC.compose_calendar,
        "board": VC.compose_board,
        "plan": VC.compose_plan,
        "chrome": VC.compose_chrome,
    }
    objs = composers[args.view](gen.make_panel, palette, geom, states_doc["elementStates"], font_id)
    objs = [o for o in (objs or []) if o is not None]
    for o in bpy.data.objects:
        if o.name.startswith("View") and o not in objs:
            objs.append(o)

    frame = gen.frame_camera_to_objects(view_cam, objs, (1280, 720), margin=0.06)
    report["framing"] = frame
    report["cam_loc"] = list(view_cam.location)
    report["cam_lens"] = view_cam.data.lens
    report["font"] = VC.find_font()

    hard_title_roi_640 = {
        "calendar": [25, 14, 352, 57],  # from VIEW_ROIS title @ 640x360
    }

    for ob in objs:
        if ob.type == "FONT":
            wa = world_aabb(ob)
            proj640 = project_aabb(view_cam, ob, 640, 360)
            proj1280 = project_aabb(view_cam, ob, 1280, 720)
            mats = material_emission_info(ob)
            entry = {
                "name": ob.name,
                "body": ob.data.body,
                "blender_size": float(ob.data.size),
                "extrude": float(ob.data.extrude),
                "location": list(ob.location),
                "world_aabb": wa,
                "projected_640x360": proj640,
                "projected_1280x720": proj1280,
                "materials": mats,
                "readable_probe": proj640["h_px"] >= 8.0,  # AA-safe floor at probe
                "readable_production": proj1280["h_px"] >= 12.0,
            }
            report["texts"].append(entry)
        elif "avatar" in ob.name.lower():
            report["avatar"] = {
                "name": ob.name,
                "world_aabb": world_aabb(ob),
                "projected_640x360": project_aabb(view_cam, ob, 640, 360),
                "projected_1280x720": project_aabb(view_cam, ob, 1280, 720),
                "materials": material_emission_info(ob),
                "custom": {
                    "path": ob.get("exp7_avatar_path"),
                    "loaded": ob.get("exp7_avatar_loaded"),
                },
            }

    # Semantic title ROI from projected geometry (top-left px)
    titles = [t for t in report["texts"] if t["name"].endswith("_title") or t["name"].endswith("_brand")]
    if titles:
        t = titles[0]
        px = t["projected_640x360"]["px_tl"]
        report["title_roi_projected_640"] = px
        report["title_roi_hardcoded_v7_bug"] = hard_title_roi_640.get(args.view)
        if args.view in hard_title_roi_640:
            hx0, hy0, hx1, hy1 = hard_title_roi_640[args.view]
            # overlap test
            ox0, oy0, ox1, oy1 = px
            overlap = not (ox1 < hx0 or ox0 > hx1 or oy1 < hy0 or oy0 > hy1)
            report["title_roi_hardcoded_misses_projected"] = not overlap
            report["title_y_projected"] = [oy0, oy1]

    tiny = [t["name"] for t in report["texts"] if not t["readable_probe"]]
    report["glyph_budget"] = {
        "probe_640_min_h_px": 8.0,
        "production_1280_min_h_px": 12.0,
        "unreadable_at_probe": tiny,
        "n_texts": len(report["texts"]),
        "n_unreadable_probe": len(tiny),
    }

    # Save projected ROI map for validator companion
    roi_map = {"view": args.view, "resolution_ref": [1280, 720], "objects": {}}
    for t in report["texts"]:
        roi_map["objects"][t["name"]] = {
            "px_tl_640": t["projected_640x360"]["px_tl"],
            "px_tl_1280": t["projected_1280x720"]["px_tl"],
            "h_px_640": t["projected_640x360"]["h_px"],
            "h_px_1280": t["projected_1280x720"]["h_px"],
            "body": t["body"],
        }
    if report["avatar"]:
        roi_map["objects"][report["avatar"]["name"]] = {
            "px_tl_640": report["avatar"]["projected_640x360"]["px_tl"],
            "px_tl_1280": report["avatar"]["projected_1280x720"]["px_tl"],
            "kind": "avatar",
        }
    (out_dir / f"projected_rois_{args.view}.json").write_text(json.dumps(roi_map, indent=2))

    if args.render:
        # Swatches under default + Standard for calibration
        for vt in (cm_default["view_transform"], "Standard"):
            if not vt:
                continue
            sp = out_dir / f"swatch_{vt}.png"
            # rebuild scene for swatch
            info = make_swatch_strip(sp, vt, args.samples, args.device)
            # sample centers of 6 patches across 640 width
            boxes = {}
            for i, name in enumerate(info["patches"]):
                cx = int((i + 0.5) * (640 / 6))
                boxes[name] = (cx - 20, 40, cx + 20, 80)
            means, size = sample_png_mean(sp, boxes)
            report["swatches"][vt] = {"render": info, "sampled": means, "size": list(size)}

        # Re-build view and render once under Standard (production-faithful proposal) + leave AgX sample if default
        for vt in ("Standard", cm_default["view_transform"]):
            if not vt:
                continue
            gen.clear_scene()
            set_view_transform(vt)
            gen.configure_cycles_metal(args.samples, args.device)
            bpy.context.scene.cycles.use_denoising = False
            gen.ensure_ground(catcher=False)
            view_cam = gen.make_camera_front(
                min(focal, 50.0),
                params["camera"].get("near", 10),
                params["camera"].get("far", 4000),
                loc=Vector((0.0, -7.2, 5.4)),
                target=Vector((0.0, 0.1, 0.15)),
            )
            gen.make_light(params, geom)
            font_id = VC._load_font_id(VC.find_font())
            objs = composers[args.view](
                gen.make_panel, palette, geom, states_doc["elementStates"], font_id
            )
            objs = [o for o in (objs or []) if o is not None]
            for o in bpy.data.objects:
                if o.name.startswith("View") and o not in objs:
                    objs.append(o)
            gen.frame_camera_to_objects(view_cam, objs, (1280, 720), margin=0.06)
            png = out_dir / f"view_{args.view}_{vt}_640.png"
            gen.render_still(png, (640, 360))
            report["renders"][f"{vt}_640"] = str(png)
            # Also production res once under Standard only (cost)
            if vt == "Standard":
                png2 = out_dir / f"view_{args.view}_{vt}_1280.png"
                gen.render_still(png2, (1280, 720))
                report["renders"][f"{vt}_1280"] = str(png2)

        # Independent band contrast on Standard 640 using projected title ROI
        try:
            from validate_view_pixels import read_png_rgba, luma, rel_lum, contrast_ratio

            png = Path(report["renders"].get("Standard_640", ""))
            if png.is_file() and titles:
                w, h, px = read_png_rgba(png)
                x0, y0, x1, y1 = [int(v) for v in titles[0]["projected_640x360"]["px_tl"]]
                # pad
                pad = 4
                x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
                x1, y1 = min(w, x1 + pad), min(h, y1 + pad)
                ls = []
                for y in range(y0, y1):
                    for x in range(x0, x1):
                        i = (y * w + x) * 4
                        ls.append(luma(px[i], px[i + 1], px[i + 2]))
                ls.sort()
                n = len(ls)
                if n > 20:
                    fg = sum(ls[: max(1, n * 8 // 100)]) / max(1, n * 8 // 100)
                    bg = sum(ls[n * 75 // 100 :]) / max(1, len(ls[n * 75 // 100 :]))
                    report["projected_title_contrast_Standard_640"] = {
                        "pxbox": [x0, y0, x1, y1],
                        "fg_luma": fg,
                        "bg_luma": bg,
                        "contrast": contrast_ratio(rel_lum(bg), rel_lum(fg)),
                    }
        except Exception as e:
            report["projected_title_contrast_error"] = str(e)

    (out_dir / "diagnose.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    # Fail soft if probe glyphs undersized or hardcoded ROI misses
    bad = False
    if report.get("title_roi_hardcoded_misses_projected"):
        bad = True
    if report["glyph_budget"]["n_unreadable_probe"] > 0:
        bad = True
    raise SystemExit(2 if bad else 0)


if __name__ == "__main__":
    main()
