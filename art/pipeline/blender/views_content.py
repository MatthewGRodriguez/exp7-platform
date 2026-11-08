"""Content-rich Cal/Board/Plan/chrome compositions for Exp7 Blender art.

DESIGN-STUDY (not live Safari WebGPU). ALL labels use unlit Emission inks.
Display-intent sRGB constants are converted to scene-linear on assignment
(Blender Emission Color is scene-linear; stuffing hex/255 made ink render ~L80).
Avatar = opaque *illustrated fixture* on flat +Z plane (Emission) — labeled FIX/S,
not a gradient disc and not a photographic claim.

v9 binding: labels parent to panel meshes in local face space so lift/scale/tilt
keep text registered on the card (production scene-graph), not uncoupled world XY.
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

# World sizes chosen so production 1280 framing (after push-in) keeps secondary ≥~12px.
TITLE_SIZE = 0.48
SUB_SIZE = 0.26
BODY_SIZE = 0.26
META_SIZE = 0.20
DAY_SIZE = 0.24

# Display-intent sRGB 0–1 (documentation + analytical preflight). NOT scene-linear.
INK = (0.078, 0.094, 0.133)  # #141822
INK_SECONDARY = (0.125, 0.149, 0.188)  # #202630
INK_DISABLED = (0.216, 0.243, 0.282)  # #374048
INK_ACCENT = (0.35, 0.25, 0.05)
# Light ink for washed/saturated faces (selected/dragging/invalid/…) — worst-BG gate
INK_ON_FACE = (1.0, 1.0, 1.0)
INK_ON_FACE_SECONDARY = (0.92, 0.94, 0.98)
INK_ON_FACE_ACCENT = (1.0, 1.0, 1.0)

# States whose wash makes dark ink fail worst-BG contrast on the face
FACE_LIGHT_INK_STATES = frozenset(
    {"selected", "dragging", "invalid", "pressed", "drop-pending", "focus"}
)


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
    """Create FONT and parent it onto the panel face (local XY, face-local Z)."""
    face_z = float(panel.get("exp7_face_local_z", 0.03))
    ob = make_text(name, body, (0.0, 0.0, 0.0), size, color, font_id, z_off=0.0, align_x=align_x, align_y=align_y)
    return parent_to_panel(ob, panel, (local_xy[0], local_xy[1], face_z))


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
        size=(3.6, 0.42), origin=(0.0, 1.55), content_lines=0,
    )
    objs.append(p)
    objs.append(label_on_panel(p, f"{prefix}_title", "November 2026", (-1.55, 0.06), TITLE_SIZE, INK, font_id))
    objs.append(label_on_panel(p, f"{prefix}_sub", "Calendar · design-study", (-1.55, -0.10), SUB_SIZE, INK_SECONDARY, font_id))

    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    cell_w, cell_h = 0.44, 0.40
    wd_bar, *_ = make_panel(
        f"{prefix}_wdbar", element_states["idle"], palette, geom, st_name="idle",
        size=(3.6, 0.28), origin=(0.0, 1.12), content_lines=0,
    )
    objs.append(wd_bar)
    for i, wd in enumerate(weekdays):
        x = (i - 3) * (cell_w + gap * 0.55)
        objs.append(label_on_panel(wd_bar, f"{prefix}_wd{i}", wd, (x - 0.14, 0.0), BODY_SIZE, INK, font_id))

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
            panel, _, ring, _ = make_panel(
                f"{prefix}_day{row}{col}", st, palette, geom, st_name=st_name,
                size=(cell_w, cell_h), origin=(x, y), content_lines=0,
            )
            objs.append(panel)
            if ring:
                objs.append(ring)
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_num{row}{col}", str(day),
                    (-0.08, 0.06), DAY_SIZE, ink_for_state(st_name), font_id,
                )
            )
            if st_name == "selected":
                objs.append(
                    label_on_panel(
                        panel, f"{prefix}_evt{row}{col}", "Review",
                        (-0.14, -0.08), META_SIZE, ink_for_state(st_name, "primary"), font_id,
                    )
                )
            day += 1
    objs.append(
        make_text(
            f"{prefix}_banner",
            "DESIGN-STUDY · unlit text · not live WebGPU",
            (-1.7, -1.15, 0.04),
            META_SIZE,
            INK_SECONDARY,
            font_id,
        )
    )
    return objs


def compose_board(make_panel, palette, geom, element_states, font_id, prefix="ViewBoard"):
    gap = float(geom.get("gap", 8)) * float(geom.get("scenePxScale", 0.01))
    objs = []
    header, *_ = make_panel(
        f"{prefix}_header", element_states["idle"], palette, geom, st_name="idle",
        size=(4.2, 0.42), origin=(0.0, 1.55), content_lines=0,
    )
    objs.append(header)
    objs.append(label_on_panel(header, f"{prefix}_title", "Board · Expenses", (-1.90, 0.06), TITLE_SIZE, INK, font_id))
    objs.append(label_on_panel(header, f"{prefix}_sub", "design-study · shared state-table", (-1.90, -0.10), SUB_SIZE, INK_SECONDARY, font_id))
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
        cx = (ci - 1) * 1.55
        col_p, *_ = make_panel(
            f"{prefix}_col{ci}", element_states["idle"], palette, geom, st_name="idle",
            size=(1.25, 0.32), origin=(cx, 1.05), content_lines=0,
        )
        objs.append(col_p)
        objs.append(label_on_panel(col_p, f"{prefix}_colLab{ci}", cname, (-0.48, 0.0), BODY_SIZE, INK, font_id))
        for ri, st_name in enumerate(states):
            st = dict(element_states.get(st_name, element_states["idle"]))
            y = 0.55 - ri * (0.62 + gap)
            title, amt, tag = cards[ri]
            panel, _, ring, _ = make_panel(
                f"{prefix}_card{ci}{ri}", st, palette, geom, st_name=st_name,
                size=(1.25, 0.52), origin=(cx, y), content_lines=0,
            )
            objs.append(panel)
            if ring:
                objs.append(ring)
            # Labels live ON the face (local), so lift/scale/dragging cannot leave text under the tile
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_ct{ci}{ri}", title,
                    (-0.42, 0.10), BODY_SIZE, ink_for_state(st_name), font_id,
                )
            )
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_ca{ci}{ri}", amt,
                    (-0.42, -0.02), BODY_SIZE, ink_for_state(st_name, "accent"), font_id,
                )
            )
            objs.append(
                label_on_panel(
                    panel, f"{prefix}_cg{ci}{ri}", f"{tag} · {st_name}",
                    (-0.42, -0.14), META_SIZE, ink_for_state(st_name, "secondary"), font_id,
                )
            )
    objs.append(
        make_text(
            f"{prefix}_banner",
            "DESIGN-STUDY · drop-pending=accent · invalid=caution",
            (-1.75, -1.30, 0.04),
            META_SIZE,
            INK_SECONDARY,
            font_id,
        )
    )
    return objs


def compose_plan(make_panel, palette, geom, element_states, font_id, prefix="ViewPlan"):
    objs = []
    header, *_ = make_panel(
        f"{prefix}_header", element_states["idle"], palette, geom, st_name="idle",
        size=(3.4, 0.40), origin=(0.0, 1.45), content_lines=0,
    )
    objs.append(header)
    objs.append(label_on_panel(header, f"{prefix}_title", "Plan · Dependencies", (-1.50, 0.06), TITLE_SIZE, INK, font_id))
    objs.append(label_on_panel(header, f"{prefix}_sub", "what-if isolation · design-study", (-1.50, -0.10), SUB_SIZE, INK_SECONDARY, font_id))
    rows = [
        ("selected", "Kickoff brief", "Owner: Alex · Due Fri"),
        ("focus", "Vendor shortlist", "3 options · needs review"),
        ("hover", "Budget gate", "Threshold $2.4k"),
        ("idle", "Ship checklist", "12 remaining"),
        ("disabled", "Archived path", "read-only"),
    ]
    for i, (st_name, title, sub) in enumerate(rows):
        st = dict(element_states.get(st_name, element_states["idle"]))
        y = 0.90 - i * 0.45
        panel, _, ring, _ = make_panel(
            f"{prefix}_row{i}", st, palette, geom, st_name=st_name,
            size=(3.4, 0.36), origin=(0.0, y), content_lines=0,
        )
        objs.append(panel)
        if ring:
            objs.append(ring)
        # Keep labels inside panel half-extents (±1.7) with padding — avoids left-column crop
        objs.append(
            label_on_panel(
                panel, f"{prefix}_rt{i}", f"{i+1}. {title}",
                (-1.35, 0.06), BODY_SIZE, ink_for_state(st_name), font_id,
            )
        )
        objs.append(
            label_on_panel(
                panel, f"{prefix}_rs{i}", sub,
                (-1.35, -0.08), META_SIZE, ink_for_state(st_name, "secondary"), font_id,
            )
        )
    objs.append(
        make_text(
            f"{prefix}_banner",
            "DESIGN-STUDY · not live WebGPU",
            (-1.50, -1.20, 0.04),
            BODY_SIZE,
            INK_SECONDARY,
            font_id,
        )
    )
    return objs


def compose_chrome(make_panel, palette, geom, element_states, font_id, prefix="ViewChrome"):
    """Horizontal nav — sized for frontal 1280 framing (≥12px glyphs, avatar clear of labels)."""
    import bpy  # type: ignore

    scale = float(geom.get("scenePxScale", 0.01))
    bar_h = max(0.48, float(geom.get("barH", 44)) * scale * 1.55)
    avatar = max(0.48, float(geom.get("avatar", 36)) * scale * 1.85)
    gap = float(geom.get("gap", 8)) * scale
    objs = []

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.04))
    bar = bpy.context.active_object
    bar.name = f"{prefix}_bar"
    # ~3.6m wide — fits frontal FOV without overflow; still fills canvas after push-in
    bar.scale = (1.80, bar_h / 2, 0.03)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # Unlit bar face (same contract as make_panel ui_face_mat)
    mat = bpy.data.materials.new(f"{prefix}_bar_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    em = nodes.new("ShaderNodeEmission")
    c = palette["_rgba"]["surface"]
    # Display-referred bright surface (matches ui_face_mat light path)
    em.inputs["Color"].default_value = (float(c[0]), float(c[1]), float(c[2]), 1.0)
    em.inputs["Strength"].default_value = 1.8
    links.new(em.outputs["Emission"], out.inputs["Surface"])
    bar.data.materials.append(mat)
    bar["exp7_face_local_z"] = 0.055
    bar["exp7_size_x"] = 3.60
    bar["exp7_size_y"] = float(bar_h)
    objs.append(bar)
    objs.append(
        label_on_panel(bar, f"{prefix}_brand", "Exp7", (-1.60, 0.0), TITLE_SIZE, INK, font_id)
    )

    for i, (label, st_name) in enumerate([("Budget", "selected"), ("Atlas", "idle"), ("Roster", "hover")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = -0.70 + i * (0.58 + gap)
        panel, _, ring, _ = make_panel(
            f"{prefix}_app{i}", st, palette, geom, st_name=st_name,
            size=(0.52, bar_h * 0.70), origin=(x, 0.0), content_lines=0,
        )
        objs.append(panel)
        if ring:
            objs.append(ring)
        objs.append(
            label_on_panel(
                panel, f"{prefix}_appLab{i}", label,
                (-0.18, 0.0), BODY_SIZE * 1.15, ink_for_state(st_name), font_id,
            )
        )

    for i, (label, st_name) in enumerate([("Cal", "selected"), ("Board", "idle"), ("Plan", "idle")]):
        st = dict(element_states.get(st_name, element_states["idle"]))
        x = 0.55 + i * (0.38 + gap * 0.3)
        panel, _, ring, _ = make_panel(
            f"{prefix}_tab{i}", st, palette, geom, st_name=st_name,
            size=(0.34, bar_h * 0.60), origin=(x, 0.0), content_lines=0,
        )
        objs.append(panel)
        if ring:
            objs.append(ring)
        objs.append(
            label_on_panel(
                panel, f"{prefix}_tabLab{i}", label,
                (-0.10, 0.0), BODY_SIZE, ink_for_state(st_name), font_id,
            )
        )

    path = avatar_asset_path()
    # Far-right avatar with gap past Plan tab (~1.55) — no label-over-disc
    av = make_avatar(f"{prefix}_avatar", (2.05, 0.0), avatar * 0.85, path, z=0.12)
    objs.append(av)
    # Compact footer strip under bar (mesh) so framing includes labels
    foot, *_ = make_panel(
        f"{prefix}_foot", element_states["idle"], palette, geom, st_name="idle",
        size=(3.6, 0.36), origin=(0.0, -0.55), content_lines=0,
    )
    objs.append(foot)
    objs.append(label_on_panel(foot, f"{prefix}_login", "you", (1.40, 0.0), BODY_SIZE, INK_SECONDARY, font_id))
    objs.append(
        label_on_panel(
            foot, f"{prefix}_banner", "DESIGN-STUDY chrome · fixture",
            (-1.60, 0.06), META_SIZE, INK_SECONDARY, font_id,
        )
    )
    objs.append(
        label_on_panel(
            foot, f"{prefix}_note", "Best≠Selected · PAT stays DOM",
            (-1.60, -0.08), META_SIZE, INK_SECONDARY, font_id,
        )
    )
    return objs
