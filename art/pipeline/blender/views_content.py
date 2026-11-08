"""Content-rich Cal/Board/Plan/chrome compositions for Exp7 Blender art.

DESIGN-STUDY (not live Safari WebGPU app output). Uses shared params palette/geometry
and representative typography + avatar assets. Validated by counting Text/Image objects.
"""
from __future__ import annotations

import math
from pathlib import Path

# Imported only when bpy available by generate_ui_scene
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",  # Mac
    "/System/Library/Fonts/SFNS.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/cascadia/CascadiaCode.ttf",
]

ASSETS = Path(__file__).resolve().parent / "assets"
MIN_TEXT_OBJECTS = 8
MIN_AVATAR_OBJECTS = 1


def find_font() -> str | None:
    for p in FONT_CANDIDATES:
        if Path(p).is_file():
            return p
    return None


def content_inventory(prefix: str = "View"):
    """Count text / avatar objects created for a view. Call after compose."""
    import bpy  # type: ignore

    texts, avatars, panels = 0, 0, 0
    names = []
    for o in bpy.data.objects:
        if not o.name.startswith(prefix) and not o.name.startswith("View"):
            continue
        names.append(o.name)
        if o.type == "FONT":
            texts += 1
        elif "avatar" in o.name.lower() or "Avatar" in o.name:
            avatars += 1
        elif o.type == "MESH" and ("_d" in o.name or "card" in o.name or "row" in o.name or "day" in o.name or "app" in o.name or "tab" in o.name or "header" in o.name or "col" in o.name):
            panels += 1
    return {"texts": texts, "avatars": avatars, "panels": panels, "names": names}


def validate_view_content(inv: dict, view: str) -> dict:
    errors = []
    if inv["texts"] < MIN_TEXT_OBJECTS:
        errors.append(f"{view}: only {inv['texts']} text objects (need ≥{MIN_TEXT_OBJECTS}) — generic bars FAIL")
    if view == "chrome" and inv["avatars"] < MIN_AVATAR_OBJECTS:
        errors.append(f"{view}: missing avatar/profile image object")
    if inv["panels"] < 4:
        errors.append(f"{view}: too few panel meshes ({inv['panels']})")
    return {"ok": not errors, "errors": errors, "inventory": inv, "label": "DESIGN-STUDY"}


def _load_font_id(font_path: str | None):
    import bpy  # type: ignore

    if not font_path:
        return None
    try:
        return bpy.data.fonts.load(font_path)
    except Exception:
        return None


def make_text(name, body, loc, size, color, font_id, z_off=0.014, track_camera=False):
    """Flat label on panel face (+Z). DESIGN-STUDY typography."""
    import bpy  # type: ignore
    from mathutils import Vector  # type: ignore

    bpy.ops.object.text_add(location=(loc[0], loc[1], loc[2] + z_off))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.body = body
    ob.data.size = size
    ob.data.align_x = "LEFT"
    ob.data.align_y = "CENTER"
    ob.data.extrude = 0.001
    if font_id:
        ob.data.font = font_id
    # Face +Z (panel up)
    ob.rotation_euler = (0.0, 0.0, 0.0)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1)
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (color[0], color[1], color[2], 1)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = 0.05
    ob.data.materials.append(mat)
    return ob


def make_avatar(name, loc, diameter, image_path: Path, z=0.05):
    import bpy  # type: ignore

    bpy.ops.mesh.primitive_cylinder_add(radius=diameter / 2, depth=0.02, location=(loc[0], loc[1], z))
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler[0] = math.radians(90)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes.get("Principled BSDF")
    if image_path.is_file():
        img = bpy.data.images.load(str(image_path))
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = img
        # UV from generated
        tex_coord = nodes.new("ShaderNodeTexCoord")
        links.new(tex_coord.outputs["Generated"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = (0.93, 0.94, 0.96, 1)
    ob.data.materials.append(mat)
    return ob


def compose_calendar(make_panel, palette, geom, element_states, font_id, prefix="ViewCal"):
    """Full-frame month grid with weekday headers + day numbers + state variety."""
    from mathutils import Vector  # noqa: F401 — available when bpy present

    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    # Title
    header_st = dict(element_states["idle"])
    p, *_rest = make_panel(
        f"{prefix}_header", header_st, palette, geom, st_name="idle",
        size=(3.4, 0.36), origin=(0.0, 1.35), content_lines=0,
    )
    objs.append(p)
    objs.append(make_text(f"{prefix}_title", "November 2026", (-1.45, 1.35, 0.05), 0.14, palette["_rgba"]["text"], font_id))
    objs.append(make_text(f"{prefix}_sub", "Calendar · design-study", (-1.45, 1.22, 0.05), 0.055, palette["_rgba"]["muted"], font_id))

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cell_w, cell_h = 0.42, 0.38
    for i, wd in enumerate(weekdays):
        x = (i - 3) * (cell_w + gap * 0.6)
        objs.append(make_text(f"{prefix}_wd{i}", wd, (x - 0.12, 1.0, 0.04), 0.06, palette["_rgba"]["muted"], font_id))

    # 4x7 days with mixed states + numbers
    states_cycle = [
        "idle", "hover", "selected", "focus", "pressed", "idle", "disabled",
        "idle", "invalid", "idle", "drop-pending", "idle", "hover", "idle",
        "selected", "idle", "dragging", "idle", "focus", "pressed", "idle",
        "idle", "hover", "idle", "selected", "idle", "disabled", "idle",
    ]
    day = 1
    for row in range(4):
        for col in range(7):
            st_name = states_cycle[(row * 7 + col) % len(states_cycle)]
            st = dict(element_states.get(st_name, element_states["idle"]))
            x = (col - 3) * (cell_w + gap * 0.6)
            y = 0.7 - row * (cell_h + gap * 0.5)
            p, _, ring, _ = make_panel(
                f"{prefix}_day{row}{col}", st, palette, geom, st_name=st_name,
                size=(cell_w, cell_h), origin=(x, y), content_lines=0,
            )
            objs.append(p)
            if ring:
                objs.append(ring)
            label_c = palette["_rgba"]["muted"] if st_name == "disabled" else palette["_rgba"]["text"]
            objs.append(
                make_text(
                    f"{prefix}_num{row}{col}",
                    str(day),
                    (x - 0.08, y + 0.02, 0.04),
                    0.09,
                    label_c,
                    font_id,
                )
            )
            if st_name == "selected":
                objs.append(
                    make_text(f"{prefix}_evt{row}{col}", "Review", (x - 0.14, y - 0.1, 0.04), 0.045, palette["_rgba"]["accent"], font_id)
                )
            day += 1
    # Study banner
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · not live WebGPU output", (-1.6, -1.05, 0.03), 0.05, palette["_rgba"]["muted"], font_id))
    return objs


def compose_board(make_panel, palette, geom, element_states, font_id, prefix="ViewBoard"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    objs.append(make_text(f"{prefix}_title", "Board · Expenses", (-1.7, 1.4, 0.05), 0.13, palette["_rgba"]["text"], font_id))
    objs.append(make_text(f"{prefix}_sub", "design-study · shared state-table", (-1.7, 1.26, 0.05), 0.05, palette["_rgba"]["muted"], font_id))

    cols = [
        ("Inbox", ["idle", "hover", "pressed"]),
        ("Active", ["selected", "dragging", "drop-pending"]),
        ("Blocked", ["invalid", "disabled", "focus"]),
    ]
    cards = [
        ("Groceries", "$84.20", "Food"),
        ("Transit pass", "$120.00", "Travel"),
        ("Studio rent", "$1,450", "Housing"),
    ]
    for ci, (cname, states) in enumerate(cols):
        cx = (ci - 1) * 1.25
        p, *_ = make_panel(
            f"{prefix}_col{ci}", element_states["idle"], palette, geom, st_name="idle",
            size=(1.1, 0.28), origin=(cx, 1.0), content_lines=0,
        )
        objs.append(p)
        objs.append(make_text(f"{prefix}_colLab{ci}", cname, (cx - 0.4, 1.0, 0.05), 0.08, palette["_rgba"]["text"], font_id))
        for ri, st_name in enumerate(states):
            st = dict(element_states.get(st_name, element_states["idle"]))
            y = 0.55 - ri * (0.52 + gap)
            title, amt, tag = cards[ri]
            p, _, ring, _ = make_panel(
                f"{prefix}_card{ci}{ri}", st, palette, geom, st_name=st_name,
                size=(1.1, 0.46), origin=(cx, y), content_lines=0,
            )
            objs.append(p)
            if ring:
                objs.append(ring)
            tc = palette["_rgba"]["muted"] if st_name == "disabled" else palette["_rgba"]["text"]
            objs.append(make_text(f"{prefix}_ct{ci}{ri}", title, (cx - 0.42, y + 0.08, 0.05), 0.07, tc, font_id))
            objs.append(make_text(f"{prefix}_ca{ci}{ri}", amt, (cx - 0.42, y - 0.04, 0.05), 0.06, palette["_rgba"]["accent"], font_id))
            objs.append(make_text(f"{prefix}_cg{ci}{ri}", tag + " · " + st_name, (cx - 0.42, y - 0.14, 0.05), 0.04, palette["_rgba"]["muted"], font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · drop-pending=accent ring · invalid=caution", (-1.7, -1.15, 0.03), 0.045, palette["_rgba"]["muted"], font_id))
    return objs


def _accent_nub(name, loc, color):
    import bpy  # type: ignore

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (0.017, 0.035, 0.01)
    bpy.ops.object.transform_apply(scale=True)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1)
    ob.data.materials.append(mat)
    return ob


def compose_plan(make_panel, palette, geom, element_states, font_id, prefix="ViewPlan"):
    objs = []
    objs.append(make_text(f"{prefix}_title", "Plan · Dependencies", (-1.7, 1.35, 0.05), 0.13, palette["_rgba"]["text"], font_id))
    objs.append(make_text(f"{prefix}_sub", "what-if isolation preserved · design-study", (-1.7, 1.2, 0.05), 0.05, palette["_rgba"]["muted"], font_id))
    rows = [
        ("selected", "Kickoff brief", "Owner: Alex · Due Fri"),
        ("focus", "Vendor shortlist", "3 options · needs review"),
        ("hover", "Budget gate", "Threshold $2.4k"),
        ("idle", "Ship checklist", "12 remaining"),
        ("disabled", "Archived path", "read-only"),
    ]
    for i, (st_name, title, sub) in enumerate(rows):
        st = dict(element_states.get(st_name, element_states["idle"]))
        y = 0.85 - i * 0.42
        p, _, ring, _ = make_panel(
            f"{prefix}_row{i}", st, palette, geom, st_name=st_name,
            size=(3.2, 0.34), origin=(0.0, y), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        tc = palette["_rgba"]["muted"] if st_name == "disabled" else palette["_rgba"]["text"]
        objs.append(make_text(f"{prefix}_rt{i}", f"{i+1}. {title}", (-1.4, y + 0.04, 0.05), 0.08, tc, font_id))
        objs.append(make_text(f"{prefix}_rs{i}", sub, (-1.4, y - 0.08, 0.05), 0.05, palette["_rgba"]["muted"], font_id))
        if i < len(rows) - 1:
            objs.append(_accent_nub(f"{prefix}_edge{i}", (-1.55, y - 0.2, 0.04), palette["_rgba"]["accent"]))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · not live Plan/deps WebGPU", (-1.7, -1.15, 0.03), 0.045, palette["_rgba"]["muted"], font_id))
    return objs


def compose_chrome(make_panel, palette, geom, element_states, font_id, prefix="ViewChrome"):
    import bpy  # type: ignore

    scale = float(geom.get("scenePxScale", 0.01))
    bar_h = float(geom.get("barH", 44)) * scale
    avatar = float(geom.get("avatar", 36)) * scale
    gap = float(geom.get("gap", 8)) * scale
    objs = []
    # Full-width bar, framed in view
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.15, 0.02))
    bar = bpy.context.active_object
    bar.name = f"{prefix}_bar"
    bar.scale = (1.8, bar_h * 1.15 / 2, 0.015)
    bpy.ops.object.transform_apply(scale=True)
    mat = bpy.data.materials.new(f"{prefix}_bar_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        c = palette["_rgba"]["surface"]
        bsdf.inputs["Base Color"].default_value = (c[0], c[1], c[2], 1)
        bsdf.inputs["Roughness"].default_value = 0.42
    bar.data.materials.append(mat)
    objs.append(bar)
    objs.append(make_text(f"{prefix}_brand", "Exp7", (-1.65, 0.15, 0.05), 0.1, palette["_rgba"]["text"], font_id))

    for i, (label, st_name) in enumerate([("Exp7", "selected"), ("Budget", "idle"), ("Atlas", "hover")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = -0.85 + i * (0.55 + gap)
        p, _, ring, _ = make_panel(
            f"{prefix}_app{i}", st, palette, geom, st_name=st_name,
            size=(0.5, bar_h * 0.75), origin=(x, 0.15), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        objs.append(make_text(f"{prefix}_appLab{i}", label, (x - 0.16, 0.15, 0.05), 0.055, palette["_rgba"]["text"], font_id))

    for i, (label, st_name) in enumerate([("Cal", "selected"), ("Board", "idle"), ("Plan", "idle")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = 0.7 + i * (0.42 + gap * 0.4)
        p, _, ring, _ = make_panel(
            f"{prefix}_tab{i}", st, palette, geom, st_name=st_name,
            size=(0.38, bar_h * 0.6), origin=(x, 0.15), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        objs.append(make_text(f"{prefix}_tabLab{i}", label, (x - 0.1, 0.15, 0.05), 0.05, palette["_rgba"]["text"], font_id))

    photo = ASSETS / "avatar-photo-study.png"
    disc = ASSETS / "avatar-design-study.png"
    path = photo if photo.is_file() else disc
    objs.append(make_avatar(f"{prefix}_avatar", (1.55, 0.15), avatar, path, z=0.06))
    objs.append(make_text(f"{prefix}_login", "you", (1.55 - 0.08, -0.12, 0.04), 0.045, palette["_rgba"]["muted"], font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY chrome · avatar asset (not live JRDI GPU photo)", (-1.7, -0.55, 0.03), 0.045, palette["_rgba"]["muted"], font_id))
    objs.append(make_text(f"{prefix}_note", "Reserved bar 44×8×8 · Best≠Selected · PAT overlays stay DOM", (-1.7, -0.7, 0.03), 0.04, palette["_rgba"]["muted"], font_id))
    return objs
