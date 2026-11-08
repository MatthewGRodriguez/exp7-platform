# 0044 — Component layout model (position, size, scale, rotation, z, containers)

Status: accepted (2026-10-31)

## Context
M10: every component must be positionable and scalable from the editor UI (drag, resize handle, steppers, snap, align, z-order), and the generator must emit the layout into the one HTML file. The default must reproduce the current output exactly.

## Decision
- Data: optional `component.layout = {mode:'flow'|'abs', x, y, w, h, scale, rot, z, align:'left'|'center'|'right', panes:{<tab>:{mode:'flow'|'grid'|'abs', cols, gap, minH}}}`. Absent = today's flow layout. The editor prunes defaults (flow, x/y/rot 0, scale 1), so an untouched component stays without `layout`.
- Per component, `mode`:
  - `flow` (default): the component keeps its place in its container. x/y/rot/scale become `transform: translate() rotate() scale()` with `transform-origin:0 0` and `position:relative`, so moving or scaling one component never reflows its siblings.
  - `abs`: `position:absolute; left:x; top:y` inside its container (`:has(>[data-jmo=id]){position:relative}`); switching flow→abs keeps the current spot (offsetLeft/Top + offset).
  - `w`/`h` set width/height (`box-sizing:border-box`, `max-width:none`, `overflow:auto` for h). They apply to every top-level element of the component (e.g. an EditableTable's heading and table). Unlike transforms they can reflow the following siblings.
  - `z` → `z-index` (with `position:relative` in flow). `align` → auto margins.
- Containers: the Tabs component's `layout.panes[tab]` → `.pane[data-pane=tab]` becomes a grid (`cols`, `gap`), an absolute canvas (`min-height`), or a flex column with a gap. Nested containers (RankCols L/R, CalNavBar) keep their own internal layout; their parts are positioned with flow transforms.
- Emission: the M9 `data-jmo` markers are reused. Every component with a layout, theme or animation joins JMotionOver's set (an empty `{}` entry is fine), and the rules are scoped `[data-jmo="id"][data-jmo="id"][data-jmo="id"]` (specificity 0,3,0, so they beat base rules like `.pane table{width}`). Nothing is emitted when no component uses M10 features, so existing levels are byte-identical (verified: v1 + 3 rebuilds sha1 unchanged).
- Editor: Layout panel (steppers −−/−/+/++ for x y w h scale rot z; snap toggle with grid 4/8/16; align; send to back / bring to front; reset; pane mode/cols/gap/minH when Tabs is selected) plus a selection box over the preview. Drag the box to move and the ▪ corner to resize. There is live feedback via CSS `translate`/`width` on the preview elements, and the change is committed as one undoable edit on pointerup.

## Responsive behaviour
Flow offsets are in CSS px and travel with the component's flow position, so they survive a narrower viewport. Absolute positions are px inside the container and do not reflow. Widths are fixed px (max-width removed), so a narrow viewport may scroll horizontally. Grid panes use `minmax(0,1fr)` columns. No breakpoints are generated; ADR follow-up if needed.

## Limits
- A component that uses M9 ambient drift *and* a flow transform: the drift animation's transform replaces the layout transform while it runs. Use abs mode or turn ambient off for that component.
- In the editor preview, components are wrapped in `display:contents` divs; the editor injects `*:has(>[data-jed-cid]>[data-jmo]){position:relative}` (preview only) so abs mode has the same containing block as the export.
