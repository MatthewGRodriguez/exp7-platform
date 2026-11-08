"""Content-rich Cal/Board/Plan/chrome compositions for Exp7 Blender art.

DESIGN-STUDY (not live Safari WebGPU). ALL labels use unlit Emission inks.
Display-intent sRGB constants are converted to scene-linear on assignment
(Blender Emission Color is scene-linear; stuffing hex/255 made ink render ~L80).
Avatar = opaque *illustrated fixture* on flat +Z plane (Emission) — labeled FIX/S,
not a gradient disc and not a photographic claim.

v10 binding: labels parent to panel meshes in local face space so lift/scale/tilt
keep text registered on the card (production scene-graph), not uncoupled world XY.
Type sizes are face-budgeted (must fit inside panel half-extents); steep ortho maps
face XY → screen so Z-lift cannot park glyphs above edge-on cards (v9i failure).
"""
from __future__ import annotations

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

# Face-budgeted world sizes (must fit on panel). Steep ortho → ≥10px at 1280.
TITLE_SIZE = 0.28
SUB_SIZE = 0.15
BODY_SIZE = 0.20
META_SIZE = 0.16  # fit on card + ≥7px meta floor after steep-ortho framing
DAY_SIZE = 0.16

# Display-intent sRGB 0–1 (documentation + analytical preflight). NOT scene-linear.
INK = (0.078, 0.094, 0.133)  # #141822
INK_SECONDARY = (0.125, 0.149, 0.188)  # #202630
INK_DISABLED = (0.216, 0.243, 0.282)  # #374048
INK_ACCENT = (0.35, 0.25, 0.05)
# Light ink for washed/saturated faces (selected/dragging/invalid/…) — worst-BG gate
INK_ON_FACE = (1.0, 1.0, 1.0)
INK_ON_FACE_SECONDARY = (0.92, 0.94, 0.98)
INK_ON_FACE_ACCENT = (1.0, 1.0, 1.0)

# Light-on-dark failed indep 10th-percentile AA (fgY≈0.1). Always dark ink on pastel faces.
FACE_LIGHT_INK_STATES = frozenset()


def srgb_to_linear(c: float) -> float:
    x = float(c)
    return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4


def emission_rgb(display_srgb) -> tuple[float, float, float]:
    """Map display-intent sRGB → scene-linear for Emission Color under Standard view."""
    return (
        srgb_to_linear(display_srgb[0]),
        srgb_to_linear(display_srgb[1]),
        srgb_to_linear(display_srgb[2]),
    )


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
    try:
        ob.visible_shadow = False
    except Exception:
        pass
    try:
        ob.visible_diffuse = False
        ob.visible_glossy = False
        ob.visible_transmission = False
        ob.visible_volume_scatter = False
        ob.visible_camera = True
    except Exception:
        pass


def ink_for_state(st_name: str, role: str = "primary"):
    """Pick ink that survives worst-BG measurement on the panel face."""
    if st_name in FACE_LIGHT_INK_STATES:
        # Pure light family on dark solids — gold accent on gold drop-pending failed worst-BG
        if role == "secondary":
            return INK_ON_FACE_SECONDARY
        return INK_ON_FACE
    if st_name == "disabled":
        return INK_DISABLED if role != "accent" else INK_ACCENT
    if role == "accent":
        return INK_ACCENT
    if role == "secondary":
        return INK_SECONDARY
    return INK


def make_text(name, body, loc, size, color, font_id, z_off=0.035, align_x="LEFT", align_y="CENTER"):
    """Flat unlit Emission — strength 1.0, zero extrude. Color is display-intent → linear."""
    import bpy  # type: ignore

    bpy.ops.object.text_add(location=(loc[0], loc[1], loc[2] + z_off))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.body = body
    ob.data.size = size
    ob.data.align_x = align_x
    ob.data.align_y = align_y
    ob.data.extrude = 0.0
    ob.data.bevel_depth = 0.0
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
    r, g, b = emission_rgb(color)
    em.inputs["Color"].default_value = (r, g, b, 1.0)
    em.inputs["Strength"].default_value = 1.0
    links.new(em.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)
    ob["exp7_ink_display_srgb"] = [float(color[0]), float(color[1]), float(color[2])]
    ob["exp7_ink_scene_linear"] = [r, g, b]
    _disable_shadows(ob)
    return ob


def parent_to_panel(child, panel, local_xyz):
    """Bind child into panel local space (identity parent inverse → location is local).

    Production contract: panel lift/scale/tilt move labels with the face — never leave
    labels at uncoupled world XY under/ beside a lifted card.

    Blender returns a *copy* from matrix_parent_inverse — must assign Matrix.Identity(4)
    back (in-place .identity() on the copy is a silent no-op and left v9 text on the floor).
    """
    from mathutils import Matrix  # type: ignore

    face_z = float(panel.get("exp7_face_local_z", local_xyz[2] if len(local_xyz) > 2 else 0.03))
    lx, ly = float(local_xyz[0]), float(local_xyz[1])
    lz = float(local_xyz[2]) if len(local_xyz) > 2 else face_z
    if len(local_xyz) < 3 or abs(lz) < 1e-6:
        lz = face_z
    # Clear any prior parent, then bind with identity parent-inverse so location is local
    child.parent = None
    child.parent = panel
    child.matrix_parent_inverse = Matrix.Identity(4)
    child.location = (lx, ly, lz)
    child.rotation_euler = (0.0, 0.0, 0.0)
    child["exp7_bound_parent"] = panel.name
    return child


def label_on_panel(panel, name, body, local_xy, size, color, font_id, align_x="LEFT", align_y="CENTER"):
    """Create FONT and parent it onto the panel face (local XY, face-local Z).

    local_xy is panel-local; keep |x| < size_x/2 − pad and |y| < size_y/2 − pad so
    glyphs stay inside the face under steep ortho (production registration).
    """
    face_z = float(panel.get("exp7_face_local_z", 0.03))
    # Tiny lift above face — steep camera maps Z→screen weakly; shallow camera did not
    ob = make_text(name, body, (0.0, 0.0, 0.0), size, color, font_id, z_off=0.0, align_x=align_x, align_y=align_y)
    return parent_to_panel(ob, panel, (local_xy[0], local_xy[1], face_z))


def _panel_half(panel):
    sx = float(panel.get("exp7_size_x", 1.0))
    sy = float(panel.get("exp7_size_y", 1.0))
    return sx * 0.5, sy * 0.5


def make_avatar(name, loc, diameter, image_path: Path, z=0.08):
    """Flat +Z plane with unlit Emission *illustrated fixture* (opaque RGB)."""
    import bpy  # type: ignore

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(loc[0], loc[1], z))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (diameter, diameter, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    _disable_shadows(ob)

    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    em = nodes.new("ShaderNodeEmission")
    soft = (0.93, 0.945, 0.965, 1.0)
    if image_path.is_file():
        img = bpy.data.images.load(str(image_path))
        try:
            img.colorspace_settings.name = "sRGB"
        except Exception:
            pass
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = img
        tex.interpolation = "Closest"
        tex_coord = nodes.new("ShaderNodeTexCoord")
        links.new(tex_coord.outputs["UV"], tex.inputs["Vector"])
        links.new(tex.outputs["Color"], em.inputs["Color"])
        em.inputs["Strength"].default_value = 1.0
        ob["exp7_avatar_path"] = str(image_path)
        ob["exp7_avatar_loaded"] = 1
        ob["exp7_avatar_kind"] = "illustrated-fixture"
    else:
        em.inputs["Color"].default_value = soft
        em.inputs["Strength"].default_value = 1.0
        ob["exp7_avatar_loaded"] = 0
        ob["exp7_avatar_path"] = str(image_path)
        ob["exp7_avatar_kind"] = "missing"
    links.new(em.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)
    return ob


def assert_assets() -> dict:
    fixture = ASSETS / "avatar-fixture-study.png"
    photo = ASSETS / "avatar-photo-study.png"  # path kept; content is illustrated fixture
    disc = ASSETS / "avatar-design-study.png"
    path = fixture if fixture.is_file() else photo
    info = {
        "fixture": str(fixture),
        "fixture_exists": fixture.is_file(),
        "photo": str(photo),
        "photo_exists": photo.is_file(),
        "disc_exists": disc.is_file(),
        "kind": "illustrated-fixture",
        "not": "gradient-ellipse-as-photo",
        "active": str(path),
    }
    if path.is_file():
        info["bytes"] = path.stat().st_size
    return info


def avatar_asset_path() -> Path:
    fixture = ASSETS / "avatar-fixture-study.png"
    photo = ASSETS / "avatar-photo-study.png"
    disc = ASSETS / "avatar-design-study.png"
    if fixture.is_file():
        return fixture
    if photo.is_file():
        return photo
    return disc


def compose_calendar(make_panel, palette, geom, element_states, font_id, prefix="ViewCal"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    header_st = dict(element_states["idle"])
    p, *_ = make_panel(
        f"{prefix}_header", header_st, palette, geom, st_name="idle",
        size=(4.0, 0.55), origin=(0.0, 1.85), content_lines=0,
    )
    objs.append(p)
    objs.append(label_on_panel(p, f"{prefix}_title", "November 2026", (-1.80, 0.04), TITLE_SIZE, INK, font_id))
    objs.append(label_on_panel(p, f"{prefix}_sub", "Calendar · design-study", (-1.80, -0.12), SUB_SIZE, INK_SECONDARY, font_id))

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cell_w, cell_h = 0.52, 0.50
    pitch = cell_w + gap * 0.7
    wd_bar, *_ = make_panel(
        f"{prefix}_wdbar", element_states["idle"], palette, geom, st_name="idle",
        size=(4.0, 0.32), origin=(0.0, 1.35), content_lines=0,
    )
    objs.append(wd_bar)
    for i, wd in enumerate(weekdays):
        x = (i - 3) * pitch
        objs.append(
            label_on_panel(
                wd_bar, f"{prefix}_wd{i}", wd, (x, 0.0), META_SIZE, INK, font_id,
                align_x="CENTER", align_y="CENTER",
            )
        )

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
            x = (col - 3) * pitch
            y = 0.85 - row * (cell_h + gap * 0.55)
            panel, _, ring, _ = make_panel(
                f"{prefix}_day{row}{col}", st, palette, geom, st_name=st_name,
                size=(cell_w, cell_h), origin=(x, y), content_lines=0,
            )
            objs.append(panel)
            if ring:
                objs.append(ring)
            # Day number centered in upper half of cell face
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_num{row}{col}", str(day),
                    (0.0, 0.08 if st_name == "selected" else 0.0), DAY_SIZE,
                    ink_for_state(st_name), font_id, align_x="CENTER", align_y="CENTER",
                )
            )
            if st_name == "selected":
                objs.append(
                    label_on_panel(
                        panel, f"{prefix}_evt{row}{col}", "Review",
                        (0.0, -0.14), META_SIZE, ink_for_state(st_name, "primary"), font_id,
                        align_x="CENTER", align_y="CENTER",
                    )
                )
            day += 1
    foot, *_ = make_panel(
        f"{prefix}_foot", element_states["idle"], palette, geom, st_name="idle",
        size=(4.0, 0.28), origin=(0.0, -1.45), content_lines=0,
    )
    objs.append(foot)
    objs.append(
        label_on_panel(
            foot, f"{prefix}_banner", "DESIGN-STUDY · unlit text · not live WebGPU",
            (0.0, 0.0), META_SIZE, INK_SECONDARY, font_id, align_x="CENTER",
        )
    )
    return objs


# On-card state tokens must fit card width (Mac v10: "Housing · drop-pending" spilled into neighbor)
STATE_CARD_LABEL = {
    "drop-pending": "drop-pend",
    "dragging": "dragging",
    "selected": "selected",
    "invalid": "invalid",
    "disabled": "disabled",
    "pressed": "pressed",
    "focus": "focus",
    "hover": "hover",
    "idle": "idle",
}


def compose_board(make_panel, palette, geom, element_states, font_id, prefix="ViewBoard"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    header, *_ = make_panel(
        f"{prefix}_header", element_states["idle"], palette, geom, st_name="idle",
        size=(5.2, 0.55), origin=(0.0, 2.15), content_lines=0,
    )
    objs.append(header)
    objs.append(label_on_panel(header, f"{prefix}_title", "Board · Expenses", (-2.35, 0.04), TITLE_SIZE, INK, font_id))
    objs.append(
        label_on_panel(
            header, f"{prefix}_sub", "design-study · shared state-table",
            (-2.35, -0.14), SUB_SIZE, INK_SECONDARY, font_id,
        )
    )
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
    # Wider cards + larger col gap so state META fits with pad (no neighbor bleed)
    card_w, card_h = 1.55, 0.92
    col_pitch = 1.78
    row_pitch = card_h + 0.28 + gap
    top_card_y = 0.85
    bottom_card_y = None
    for ci, (cname, states) in enumerate(cols):
        cx = (ci - 1) * col_pitch
        col_p, *_ = make_panel(
            f"{prefix}_col{ci}", element_states["idle"], palette, geom, st_name="idle",
            size=(card_w, 0.36), origin=(cx, 1.55), content_lines=0,
        )
        objs.append(col_p)
        objs.append(
            label_on_panel(
                col_p, f"{prefix}_colLab{ci}", cname, (0.0, 0.0), BODY_SIZE, INK, font_id,
                align_x="CENTER",
            )
        )
        for ri, st_name in enumerate(states):
            st = dict(element_states.get(st_name, element_states["idle"]))
            y = top_card_y - ri * row_pitch
            bottom_card_y = y if bottom_card_y is None else min(bottom_card_y, y)
            title, amt, tag = cards[ri]
            panel, _, ring, _ = make_panel(
                f"{prefix}_card{ci}{ri}", st, palette, geom, st_name=st_name,
                size=(card_w, card_h), origin=(cx, y), content_lines=0,
            )
            objs.append(panel)
            if ring:
                objs.append(ring)
            # Labels inside face half-extents with pad; state line uses META + abbrev
            st_lab = STATE_CARD_LABEL.get(st_name, st_name)
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_ct{ci}{ri}", title,
                    (-0.62, 0.24), BODY_SIZE, ink_for_state(st_name), font_id,
                )
            )
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_ca{ci}{ri}", amt,
                    (-0.62, 0.02), BODY_SIZE, ink_for_state(st_name, "accent"), font_id,
                )
            )
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_cg{ci}{ri}", f"{tag} · {st_lab}",
                    (-0.62, -0.26), BODY_SIZE * 0.92, ink_for_state(st_name, "secondary"), font_id,
                )
            )
    # Footer CLEAR of bottom card row (v10 Mac: foot at -1.65 overlapped Studio rent)
    foot_y = float(bottom_card_y) - card_h * 0.5 - 0.42
    foot, *_ = make_panel(
        f"{prefix}_foot", element_states["idle"], palette, geom, st_name="idle",
        size=(5.2, 0.30), origin=(0.0, foot_y), content_lines=0,
    )
    objs.append(foot)
    objs.append(
        label_on_panel(
            foot, f"{prefix}_banner", "DESIGN-STUDY · drop-pending=accent · invalid=caution",
            (0.0, 0.0), META_SIZE, INK_SECONDARY, font_id, align_x="CENTER",
        )
    )
    return objs


def compose_plan(make_panel, palette, geom, element_states, font_id, prefix="ViewPlan"):
    objs = []
    row_w, row_h = 4.0, 0.48
    header, *_ = make_panel(
        f"{prefix}_header", element_states["idle"], palette, geom, st_name="idle",
        size=(row_w, 0.55), origin=(0.0, 1.85), content_lines=0,
    )
    objs.append(header)
    objs.append(label_on_panel(header, f"{prefix}_title", "Plan · Dependencies", (-1.80, 0.04), TITLE_SIZE, INK, font_id))
    objs.append(
        label_on_panel(
            header, f"{prefix}_sub", "what-if isolation · design-study",
            (-1.80, -0.12), SUB_SIZE, INK_SECONDARY, font_id,
        )
    )
    rows = [
        ("selected", "Kickoff brief", "Owner: Alex · Due Fri"),
        ("focus", "Vendor shortlist", "3 options · needs review"),
        ("hover", "Budget gate", "Threshold $2.4k"),
        ("idle", "Ship checklist", "12 remaining"),
        ("disabled", "Archived path", "read-only"),
    ]
    for i, (st_name, title, sub) in enumerate(rows):
        st = dict(element_states.get(st_name, element_states["idle"]))
        y = 1.15 - i * (row_h + 0.12)
        panel, _, ring, _ = make_panel(
            f"{prefix}_row{i}", st, palette, geom, st_name=st_name,
            size=(row_w, row_h), origin=(0.0, y), content_lines=0,
        )
        objs.append(panel)
        if ring:
            objs.append(ring)
        # Pad from left edge (±2.0): start at -1.70 so glyphs stay inside mesh for framing
        objs.append(
            label_on_panel(
                panel, f"{prefix}_rt{i}", f"{i+1}. {title}",
                (-1.70, 0.08), BODY_SIZE, ink_for_state(st_name), font_id,
            )
        )
        objs.append(
            label_on_panel(
                panel, f"{prefix}_rs{i}", sub,
                (-1.70, -0.10), META_SIZE, ink_for_state(st_name, "secondary"), font_id,
            )
        )
    foot, *_ = make_panel(
        f"{prefix}_foot", element_states["idle"], palette, geom, st_name="idle",
        size=(row_w, 0.28), origin=(0.0, -1.55), content_lines=0,
    )
    objs.append(foot)
    objs.append(
        label_on_panel(
            foot, f"{prefix}_banner", "DESIGN-STUDY · not live WebGPU",
            (0.0, 0.0), META_SIZE, INK_SECONDARY, font_id, align_x="CENTER",
        )
    )
    return objs


def compose_chrome(make_panel, palette, geom, element_states, font_id, prefix="ViewChrome"):
    """Stacked chrome fixture — vertical extent fills 1280 steep-ortho (not a thin strip)."""
    objs = []
    # Shell card so framing has a tall mesh extent (v9i strip filled width-only → 10% canvas)
    shell, *_ = make_panel(
        f"{prefix}_shell", element_states["idle"], palette, geom, st_name="idle",
        size=(4.4, 2.6), origin=(0.0, 0.0), content_lines=0,
    )
    objs.append(shell)

    brand_bar, *_ = make_panel(
        f"{prefix}_bar", element_states["idle"], palette, geom, st_name="idle",
        size=(4.0, 0.50), origin=(0.0, 0.95), content_lines=0,
    )
    objs.append(brand_bar)
    objs.append(
        label_on_panel(
            brand_bar, f"{prefix}_brand", "Exp7", (-1.70, 0.0), TITLE_SIZE, INK, font_id,
        )
    )

    for i, (label, st_name) in enumerate([("Budget", "selected"), ("Atlas", "idle"), ("Roster", "hover")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = -1.35 + i * 1.35
        # Visible pastel chips (not near-white shell) + dark ink for indep AA
        chip_st = st_name if st_name != "idle" else "hover"
        panel, _, ring, _ = make_panel(
            f"{prefix}_app{i}", st, palette, geom, st_name=chip_st,
            size=(1.20, 0.62), origin=(x, 0.25), content_lines=0,
        )
        objs.append(panel)
        if ring:
            objs.append(ring)
        objs.append(
            label_on_panel(
                panel, f"{prefix}_appLab{i}", label, (0.0, 0.0), BODY_SIZE,
                ink_for_state(chip_st), font_id, align_x="CENTER",
            )
        )

    # Tabs left of avatar with clear gap (Plan right edge ~0.05, avatar at 1.70 — no overlap)
    for i, (label, st_name) in enumerate([("Cal", "selected"), ("Board", "idle"), ("Plan", "idle")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = -1.50 + i * 0.95
        chip_st = st_name if st_name != "idle" else "hover"
        panel, _, ring, _ = make_panel(
            f"{prefix}_tab{i}", st, palette, geom, st_name=chip_st,
            size=(0.88, 0.56), origin=(x, -0.45), content_lines=0,
        )
        objs.append(panel)
        if ring:
            objs.append(ring)
        objs.append(
            label_on_panel(
                panel, f"{prefix}_tabLab{i}", label, (0.0, 0.0), BODY_SIZE,
                ink_for_state(chip_st), font_id, align_x="CENTER",
            )
        )

    path = avatar_asset_path()
    av = make_avatar(f"{prefix}_avatar", (1.70, -0.45), 0.62, path, z=0.14)
    objs.append(av)

    foot, *_ = make_panel(
        f"{prefix}_foot", element_states["idle"], palette, geom, st_name="idle",
        size=(4.0, 0.50), origin=(0.0, -1.05), content_lines=0,
    )
    objs.append(foot)
    objs.append(
        label_on_panel(
            foot, f"{prefix}_banner", "DESIGN-STUDY chrome · fixture",
            (-1.70, 0.08), META_SIZE, INK_SECONDARY, font_id,
        )
    )
    objs.append(
        label_on_panel(
            foot, f"{prefix}_note", "Best≠Selected · PAT stays DOM",
            (-1.70, -0.10), META_SIZE, INK_SECONDARY, font_id,
        )
    )
    objs.append(
        label_on_panel(
            foot, f"{prefix}_login", "you", (1.55, 0.0), BODY_SIZE, INK_SECONDARY, font_id,
            align_x="CENTER",
        )
    )
    return objs
