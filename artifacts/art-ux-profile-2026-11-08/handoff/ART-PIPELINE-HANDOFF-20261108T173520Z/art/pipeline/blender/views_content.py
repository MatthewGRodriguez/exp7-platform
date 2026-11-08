"""Content-rich Cal/Board/Plan/chrome compositions for Exp7 Blender art.

DESIGN-STUDY (not live Safari WebGPU). Readable typography (contrast ≥4.5 intent),
visible avatar disc, content-aware camera framing done by caller.
Object counts alone are NOT pixel proof — pair with validate_view_pixels.py.
"""
from __future__ import annotations

import math
from pathlib import Path

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/cascadia/CascadiaCode.ttf",
]

ASSETS = Path(__file__).resolve().parent / "assets"
MIN_TEXT_OBJECTS = 8
MIN_AVATAR_OBJECTS = 1

# Readable sizes in scene meters (Mac v4: 0.05–0.14 was invisible)
TITLE_SIZE = 0.28
SUB_SIZE = 0.11
BODY_SIZE = 0.09
META_SIZE = 0.07


def find_font() -> str | None:
    for p in FONT_CANDIDATES:
        if Path(p).is_file():
            return p
    return None


def content_inventory(prefix: str = "View"):
    import bpy  # type: ignore

    texts, avatars, panels = 0, 0, 0
    names = []
    for o in bpy.data.objects:
        if not (o.name.startswith(prefix) or o.name.startswith("View")):
            continue
        names.append(o.name)
        if o.type == "FONT":
            texts += 1
        elif "avatar" in o.name.lower():
            avatars += 1
        elif o.type == "MESH":
            panels += 1
    return {"texts": texts, "avatars": avatars, "panels": panels, "names": names}


def validate_view_content(inv: dict, view: str) -> dict:
    errors = []
    if inv["texts"] < MIN_TEXT_OBJECTS:
        errors.append(f"{view}: only {inv['texts']} text objects (need ≥{MIN_TEXT_OBJECTS})")
    if view == "chrome" and inv["avatars"] < MIN_AVATAR_OBJECTS:
        errors.append(f"{view}: missing avatar object")
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


def make_text(name, body, loc, size, color, font_id, z_off=0.02):
    """High-emission readable label on panel face (+Z). Contrast intent ≥4.5 vs surface."""
    import bpy  # type: ignore

    bpy.ops.object.text_add(location=(loc[0], loc[1], loc[2] + z_off))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.body = body
    ob.data.size = size
    ob.data.align_x = "LEFT"
    ob.data.align_y = "CENTER"
    ob.data.extrude = 0.003
    ob.data.bevel_depth = 0.0008
    if font_id:
        ob.data.font = font_id
    ob.rotation_euler = (0.0, 0.0, 0.0)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        # Opaque dark text + strong emission so Cycles doesn't wash to grey
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1)
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (color[0], color[1], color[2], 1)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = 2.4
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = 1.0
        bsdf.inputs["Roughness"].default_value = 0.55
    ob.data.materials.append(mat)
    return ob


def make_avatar(name, loc, diameter, image_path: Path, z=0.06):
    """Flat disc on XY (+Z face) so elevated camera sees the photo — not an edge-on cylinder."""
    import bpy  # type: ignore

    bpy.ops.mesh.primitive_cylinder_add(
        radius=diameter / 2,
        depth=0.018,
        location=(loc[0], loc[1], z),
        vertices=48,
    )
    ob = bpy.context.active_object
    ob.name = name
    # Keep axis along +Z so top cap faces camera (elevated front)
    ob.rotation_euler = (0.0, 0.0, 0.0)
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes.get("Principled BSDF")
    if image_path.is_file() and bsdf:
        img = bpy.data.images.load(str(image_path))
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = img
        tex_coord = nodes.new("ShaderNodeTexCoord")
        mapping = nodes.new("ShaderNodeMapping")
        # Cap uses Generated/Object — scale to fill disc
        links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
        links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if "Emission Color" in bsdf.inputs:
            links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = 0.35
    elif bsdf:
        bsdf.inputs["Base Color"].default_value = (0.93, 0.94, 0.96, 1)
    ob.data.materials.append(mat)
    return ob


def compose_calendar(make_panel, palette, geom, element_states, font_id, prefix="ViewCal"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    text_c = palette["_rgba"]["text"]
    muted_c = palette["_rgba"]["muted"]
    header_st = dict(element_states["idle"])
    p, *_ = make_panel(
        f"{prefix}_header", header_st, palette, geom, st_name="idle",
        size=(3.6, 0.42), origin=(0.0, 1.55), content_lines=0,
    )
    objs.append(p)
    objs.append(make_text(f"{prefix}_title", "November 2026", (-1.55, 1.58, 0.06), TITLE_SIZE, text_c, font_id))
    objs.append(make_text(f"{prefix}_sub", "Calendar · design-study", (-1.55, 1.38, 0.06), SUB_SIZE, muted_c, font_id))

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cell_w, cell_h = 0.44, 0.40
    for i, wd in enumerate(weekdays):
        x = (i - 3) * (cell_w + gap * 0.55)
        objs.append(make_text(f"{prefix}_wd{i}", wd, (x - 0.14, 1.12, 0.05), BODY_SIZE, muted_c, font_id))

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
            x = (col - 3) * (cell_w + gap * 0.55)
            y = 0.75 - row * (cell_h + gap * 0.45)
            p, _, ring, _ = make_panel(
                f"{prefix}_day{row}{col}", st, palette, geom, st_name=st_name,
                size=(cell_w, cell_h), origin=(x, y), content_lines=0,
            )
            objs.append(p)
            if ring:
                objs.append(ring)
            label_c = muted_c if st_name == "disabled" else text_c
            # Disabled: further mute via mixing toward softDisc in color already; keep readable floor
            if st_name == "disabled":
                label_c = (0.45, 0.48, 0.52, 1)  # still ≥~3:1 on white; body uses disabled panel
            objs.append(make_text(f"{prefix}_num{row}{col}", str(day), (x - 0.1, y + 0.02, 0.05), BODY_SIZE, label_c, font_id))
            if st_name == "selected":
                objs.append(make_text(f"{prefix}_evt{row}{col}", "Review", (x - 0.16, y - 0.12, 0.05), META_SIZE, palette["_rgba"]["accent"], font_id))
            day += 1
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · not live WebGPU", (-1.7, -1.15, 0.04), META_SIZE, muted_c, font_id))
    return objs


def compose_board(make_panel, palette, geom, element_states, font_id, prefix="ViewBoard"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    text_c, muted_c = palette["_rgba"]["text"], palette["_rgba"]["muted"]
    objs.append(make_text(f"{prefix}_title", "Board · Expenses", (-1.75, 1.55, 0.06), TITLE_SIZE, text_c, font_id))
    objs.append(make_text(f"{prefix}_sub", "design-study · shared state-table", (-1.75, 1.35, 0.06), SUB_SIZE, muted_c, font_id))
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
        cx = (ci - 1) * 1.3
        p, *_ = make_panel(
            f"{prefix}_col{ci}", element_states["idle"], palette, geom, st_name="idle",
            size=(1.15, 0.32), origin=(cx, 1.05), content_lines=0,
        )
        objs.append(p)
        objs.append(make_text(f"{prefix}_colLab{ci}", cname, (cx - 0.42, 1.05, 0.06), BODY_SIZE, text_c, font_id))
        for ri, st_name in enumerate(states):
            st = dict(element_states.get(st_name, element_states["idle"]))
            y = 0.55 - ri * (0.55 + gap)
            title, amt, tag = cards[ri]
            p, _, ring, _ = make_panel(
                f"{prefix}_card{ci}{ri}", st, palette, geom, st_name=st_name,
                size=(1.15, 0.48), origin=(cx, y), content_lines=0,
            )
            objs.append(p)
            if ring:
                objs.append(ring)
            tc = (0.45, 0.48, 0.52, 1) if st_name == "disabled" else text_c
            objs.append(make_text(f"{prefix}_ct{ci}{ri}", title, (cx - 0.45, y + 0.1, 0.06), BODY_SIZE, tc, font_id))
            objs.append(make_text(f"{prefix}_ca{ci}{ri}", amt, (cx - 0.45, y - 0.02, 0.06), BODY_SIZE, palette["_rgba"]["accent"], font_id))
            objs.append(make_text(f"{prefix}_cg{ci}{ri}", f"{tag} · {st_name}", (cx - 0.45, y - 0.14, 0.06), META_SIZE, muted_c, font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · drop-pending=accent · invalid=caution", (-1.75, -1.25, 0.04), META_SIZE, muted_c, font_id))
    return objs


def compose_plan(make_panel, palette, geom, element_states, font_id, prefix="ViewPlan"):
    objs = []
    text_c, muted_c = palette["_rgba"]["text"], palette["_rgba"]["muted"]
    objs.append(make_text(f"{prefix}_title", "Plan · Dependencies", (-1.75, 1.5, 0.06), TITLE_SIZE, text_c, font_id))
    objs.append(make_text(f"{prefix}_sub", "what-if isolation · design-study", (-1.75, 1.3, 0.06), SUB_SIZE, muted_c, font_id))
    rows = [
        ("selected", "Kickoff brief", "Owner: Alex · Due Fri"),
        ("focus", "Vendor shortlist", "3 options · needs review"),
        ("hover", "Budget gate", "Threshold $2.4k"),
        ("idle", "Ship checklist", "12 remaining"),
        ("disabled", "Archived path", "read-only"),
    ]
    for i, (st_name, title, sub) in enumerate(rows):
        st = dict(element_states.get(st_name, element_states["idle"]))
        y = 0.9 - i * 0.45
        p, _, ring, _ = make_panel(
            f"{prefix}_row{i}", st, palette, geom, st_name=st_name,
            size=(3.4, 0.36), origin=(0.0, y), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        tc = (0.45, 0.48, 0.52, 1) if st_name == "disabled" else text_c
        objs.append(make_text(f"{prefix}_rt{i}", f"{i+1}. {title}", (-1.5, y + 0.05, 0.06), BODY_SIZE, tc, font_id))
        objs.append(make_text(f"{prefix}_rs{i}", sub, (-1.5, y - 0.1, 0.06), META_SIZE, muted_c, font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · not live Plan/deps WebGPU", (-1.75, -1.25, 0.04), META_SIZE, muted_c, font_id))
    return objs


def compose_chrome(make_panel, palette, geom, element_states, font_id, prefix="ViewChrome"):
    import bpy  # type: ignore

    scale = float(geom.get("scenePxScale", 0.01))
    bar_h = float(geom.get("barH", 44)) * scale
    avatar = float(geom.get("avatar", 36)) * scale * 1.35  # visible disc
    gap = float(geom.get("gap", 8)) * scale
    objs = []
    text_c, muted_c = palette["_rgba"]["text"], palette["_rgba"]["muted"]

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.2, 0.025))
    bar = bpy.context.active_object
    bar.name = f"{prefix}_bar"
    bar.scale = (1.95, bar_h * 1.3 / 2, 0.016)
    bpy.ops.object.transform_apply(scale=True)
    mat = bpy.data.materials.new(f"{prefix}_bar_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        c = palette["_rgba"]["surface"]
        bsdf.inputs["Base Color"].default_value = (c[0], c[1], c[2], 1)
    bar.data.materials.append(mat)
    objs.append(bar)
    objs.append(make_text(f"{prefix}_brand", "Exp7", (-1.75, 0.22, 0.06), TITLE_SIZE * 0.85, text_c, font_id))

    for i, (label, st_name) in enumerate([("Exp7", "selected"), ("Budget", "idle"), ("Atlas", "hover")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = -0.7 + i * (0.58 + gap)
        p, _, ring, _ = make_panel(
            f"{prefix}_app{i}", st, palette, geom, st_name=st_name,
            size=(0.52, bar_h * 0.85), origin=(x, 0.2), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        objs.append(make_text(f"{prefix}_appLab{i}", label, (x - 0.18, 0.2, 0.06), BODY_SIZE, text_c, font_id))

    for i, (label, st_name) in enumerate([("Cal", "selected"), ("Board", "idle"), ("Plan", "idle")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = 0.85 + i * (0.45 + gap * 0.4)
        p, _, ring, _ = make_panel(
            f"{prefix}_tab{i}", st, palette, geom, st_name=st_name,
            size=(0.4, bar_h * 0.7), origin=(x, 0.2), content_lines=0,
        )
        objs.append(p)
        if ring:
            objs.append(ring)
        objs.append(make_text(f"{prefix}_tabLab{i}", label, (x - 0.12, 0.2, 0.06), META_SIZE, text_c, font_id))

    photo = ASSETS / "avatar-photo-study.png"
    disc = ASSETS / "avatar-design-study.png"
    path = photo if photo.is_file() else disc
    av = make_avatar(f"{prefix}_avatar", (1.7, 0.2), avatar, path, z=0.07)
    objs.append(av)
    objs.append(make_text(f"{prefix}_login", "you", (1.55, -0.15, 0.05), META_SIZE, muted_c, font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY chrome · avatar disc (not live JRDI GPU)", (-1.75, -0.65, 0.04), META_SIZE, muted_c, font_id))
    objs.append(make_text(f"{prefix}_note", "Reserved bar · Best≠Selected · PAT stays DOM", (-1.75, -0.82, 0.04), META_SIZE, muted_c, font_id))
    return objs
