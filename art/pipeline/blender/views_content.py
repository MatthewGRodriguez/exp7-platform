"""Content-rich Cal/Board/Plan/chrome compositions for Exp7 Blender art.

DESIGN-STUDY (not live Safari WebGPU). Camera-ready typography: unlit emission,
zero extrusion (Mac v5 FAIL: ghosted double glyphs + contrast ~1.76 from
Principled+extrude+shadows). Pair with validate_view_pixels.py — object count ≠ proof.
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
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]

ASSETS = Path(__file__).resolve().parent / "assets"
MIN_TEXT_OBJECTS = 8
MIN_AVATAR_OBJECTS = 1

# Readable sizes in scene meters (large enough after framing pullback)
TITLE_SIZE = 0.28
SUB_SIZE = 0.11
BODY_SIZE = 0.09
META_SIZE = 0.07

# Hard dark inks for ≥4.5 on #fff / #f4f6fa (do not amplify via emission strength>1)
INK = (0.11, 0.137, 0.20)          # ≈ #1c2333
INK_MUTED = (0.22, 0.26, 0.33)     # darker than palette muted wash — still ≥4.5 on white
INK_ON_WASH = (0.08, 0.10, 0.14)   # on selection/blue wash tiles
INK_DISABLED = (0.42, 0.45, 0.50)  # muted but measurable vs softDisc


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


def _disable_shadows(ob):
    """Text must not cast/receive shadows (ghosting / double-glyph)."""
    try:
        ob.visible_shadow = False
    except Exception:
        pass
    try:
        ob.visible_diffuse = False
        ob.visible_glossy = False
        ob.visible_transmission = False
        ob.visible_volume_scatter = False
        # Keep camera + transmission off for unlit look; emission still visible to camera
        ob.visible_camera = True
    except Exception:
        pass
    try:
        if hasattr(ob, "cycles"):
            ob.cycles.is_shadow_catcher = False
    except Exception:
        pass


def make_text(name, body, loc, size, color, font_id, z_off=0.03):
    """Flat unlit emission label — no Principled, no extrude, no shadow rays.

    Mac v5: Principled+emission+extrude produced washed ghosted glyphs (contrast ~1.76).
    Strength=1.0 so RGB maps 1:1 to camera (faithful palette ink).
    """
    import bpy  # type: ignore

    bpy.ops.object.text_add(location=(loc[0], loc[1], loc[2] + z_off))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.body = body
    ob.data.size = size
    ob.data.align_x = "LEFT"
    ob.data.align_y = "CENTER"
    # CRITICAL: flat glyphs — extrusion casts self-shadows / ghost doubles
    ob.data.extrude = 0.0
    ob.data.bevel_depth = 0.0
    ob.data.bevel_resolution = 0
    if font_id:
        ob.data.font = font_id
    ob.rotation_euler = (0.0, 0.0, 0.0)

    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    em = nodes.new("ShaderNodeEmission")
    r, g, b = float(color[0]), float(color[1]), float(color[2])
    em.inputs["Color"].default_value = (r, g, b, 1.0)
    em.inputs["Strength"].default_value = 1.0  # faithful 2D ink — do not wash with >1
    links.new(em.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)
    _disable_shadows(ob)
    return ob


def make_avatar(name, loc, diameter, image_path: Path, z=0.06):
    """Flat disc on XY (+Z face) so elevated camera sees the photo."""
    import bpy  # type: ignore

    bpy.ops.mesh.primitive_cylinder_add(
        radius=diameter / 2,
        depth=0.018,
        location=(loc[0], loc[1], z),
        vertices=48,
    )
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler = (0.0, 0.0, 0.0)
    try:
        ob.visible_shadow = False
    except Exception:
        pass
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
        links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
        links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        # Mild emission so METAL doesn't crush photo under area light
        if "Emission Color" in bsdf.inputs:
            links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = 0.25
        bsdf.inputs["Roughness"].default_value = 0.85
    elif bsdf:
        bsdf.inputs["Base Color"].default_value = (0.93, 0.94, 0.96, 1)
    ob.data.materials.append(mat)
    return ob


def compose_calendar(make_panel, palette, geom, element_states, font_id, prefix="ViewCal"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    header_st = dict(element_states["idle"])
    p, *_ = make_panel(
        f"{prefix}_header", header_st, palette, geom, st_name="idle",
        size=(3.6, 0.42), origin=(0.0, 1.55), content_lines=0,
    )
    objs.append(p)
    objs.append(make_text(f"{prefix}_title", "November 2026", (-1.55, 1.58, 0.06), TITLE_SIZE, INK, font_id))
    objs.append(make_text(f"{prefix}_sub", "Calendar · design-study", (-1.55, 1.38, 0.06), SUB_SIZE, INK_MUTED, font_id))

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cell_w, cell_h = 0.44, 0.40
    for i, wd in enumerate(weekdays):
        x = (i - 3) * (cell_w + gap * 0.55)
        # Dark ink on light ground — not washed muted
        objs.append(make_text(f"{prefix}_wd{i}", wd, (x - 0.14, 1.12, 0.05), BODY_SIZE, INK_MUTED, font_id))

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
            if st_name == "disabled":
                label_c = INK_DISABLED
            elif st_name in ("selected", "pressed", "focus", "hover"):
                label_c = INK_ON_WASH
            else:
                label_c = INK
            objs.append(make_text(f"{prefix}_num{row}{col}", str(day), (x - 0.1, y + 0.02, 0.05), BODY_SIZE, label_c, font_id))
            if st_name == "selected":
                objs.append(make_text(f"{prefix}_evt{row}{col}", "Review", (x - 0.16, y - 0.12, 0.05), META_SIZE, palette["_rgba"]["accent"][:3], font_id))
            day += 1
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · unlit text · not live WebGPU", (-1.7, -1.15, 0.04), META_SIZE, INK_MUTED, font_id))
    return objs


def compose_board(make_panel, palette, geom, element_states, font_id, prefix="ViewBoard"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    objs.append(make_text(f"{prefix}_title", "Board · Expenses", (-1.75, 1.55, 0.06), TITLE_SIZE, INK, font_id))
    objs.append(make_text(f"{prefix}_sub", "design-study · shared state-table", (-1.75, 1.35, 0.06), SUB_SIZE, INK_MUTED, font_id))
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
        objs.append(make_text(f"{prefix}_colLab{ci}", cname, (cx - 0.42, 1.05, 0.06), BODY_SIZE, INK, font_id))
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
            tc = INK_DISABLED if st_name == "disabled" else INK
            objs.append(make_text(f"{prefix}_ct{ci}{ri}", title, (cx - 0.45, y + 0.1, 0.06), BODY_SIZE, tc, font_id))
            objs.append(make_text(f"{prefix}_ca{ci}{ri}", amt, (cx - 0.45, y - 0.02, 0.06), BODY_SIZE, palette["_rgba"]["accent"][:3], font_id))
            objs.append(make_text(f"{prefix}_cg{ci}{ri}", f"{tag} · {st_name}", (cx - 0.45, y - 0.14, 0.06), META_SIZE, INK_MUTED, font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · drop-pending=accent · invalid=caution", (-1.75, -1.25, 0.04), META_SIZE, INK_MUTED, font_id))
    return objs


def compose_plan(make_panel, palette, geom, element_states, font_id, prefix="ViewPlan"):
    objs = []
    objs.append(make_text(f"{prefix}_title", "Plan · Dependencies", (-1.75, 1.5, 0.06), TITLE_SIZE, INK, font_id))
    objs.append(make_text(f"{prefix}_sub", "what-if isolation · design-study", (-1.75, 1.3, 0.06), SUB_SIZE, INK_MUTED, font_id))
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
        tc = INK_DISABLED if st_name == "disabled" else INK
        objs.append(make_text(f"{prefix}_rt{i}", f"{i+1}. {title}", (-1.5, y + 0.05, 0.06), BODY_SIZE, tc, font_id))
        objs.append(make_text(f"{prefix}_rs{i}", sub, (-1.5, y - 0.1, 0.06), META_SIZE, INK_MUTED, font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY · not live Plan/deps WebGPU", (-1.75, -1.25, 0.04), META_SIZE, INK_MUTED, font_id))
    return objs


def compose_chrome(make_panel, palette, geom, element_states, font_id, prefix="ViewChrome"):
    import bpy  # type: ignore

    scale = float(geom.get("scenePxScale", 0.01))
    bar_h = float(geom.get("barH", 44)) * scale
    avatar = float(geom.get("avatar", 36)) * scale * 1.35
    gap = float(geom.get("gap", 8)) * scale
    objs = []

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
    objs.append(make_text(f"{prefix}_brand", "Exp7", (-1.75, 0.22, 0.06), TITLE_SIZE * 0.85, INK, font_id))

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
        objs.append(make_text(f"{prefix}_appLab{i}", label, (x - 0.18, 0.2, 0.06), BODY_SIZE, INK, font_id))

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
        objs.append(make_text(f"{prefix}_tabLab{i}", label, (x - 0.12, 0.2, 0.06), META_SIZE, INK, font_id))

    photo = ASSETS / "avatar-photo-study.png"
    disc = ASSETS / "avatar-design-study.png"
    path = photo if photo.is_file() else disc
    av = make_avatar(f"{prefix}_avatar", (1.7, 0.2), avatar, path, z=0.07)
    objs.append(av)
    objs.append(make_text(f"{prefix}_login", "you", (1.55, -0.15, 0.05), META_SIZE, INK_MUTED, font_id))
    objs.append(make_text(f"{prefix}_banner", "DESIGN-STUDY chrome · avatar disc (not live JRDI GPU)", (-1.75, -0.65, 0.04), META_SIZE, INK_MUTED, font_id))
    objs.append(make_text(f"{prefix}_note", "Reserved bar · Best≠Selected · PAT stays DOM", (-1.75, -0.82, 0.04), META_SIZE, INK_MUTED, font_id))
    return objs
