# Light v14 presentation states

Geometry/poses/easing/interrupts/69s ring ambient are unchanged from v13. See original-edge-state-config.json, motion.js, lifecycle.js and slab-config.json. THEME.json records the new presentation palette.

| State/role | Surface | Text / ring |
|---|---|---|
| Outer canvas/gutters | no root fill, clear RGBA(0,0,0,0) | premultiplied compositing |
| Content panel / idle | white | #1c2333; #8a96aa border |
| Muted / placeholder | existing light surface | #49556a, not faded low-contrast text |
| Hover | source-over #2458a6, alpha18/255 controls,14/255 general | dark text unchanged |
| Focus | white input | #2458a6 focus border; dark caret |
| Selected / drag | light source-over #96b4e6, alpha55/255 | #2458a6 inset ring; anchor #6841a6 |
| Span | light source-over #96b4e6, alpha35/255 | blue bottom bar |
| Disabled | #f4f6fa | #49556a; no hit action; existing bg-only motion opacity |
| Critical | #fff0e7 | #8c3600 text, ORIGINAL #D55E00 risk accent |
| Moderate | #fff6dc | #6b4300 text, ORIGINAL #E69F00 risk accent |
| Low | #e8f5ef | #00664b text, ORIGINAL #009E73 accent |
| Motion sides | same source orientation and alpha coverage | neutral #64748b material replaces black; top white unchanged |

No new geometry, layout, lighting direction, art, assets, animation duration or depth constants. Side material appearance is not newly Blender-calibrated. Native WebGPU drawing remains the only renderer. TextField uses the original hidden textarea / native vector text; no visible DOM replacement.
