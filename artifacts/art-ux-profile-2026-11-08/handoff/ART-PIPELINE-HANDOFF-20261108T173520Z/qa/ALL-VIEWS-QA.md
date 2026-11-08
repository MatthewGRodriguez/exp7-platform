# All views QA (v5)

## Labels
- **DESIGN-STUDY** — Blender METAL compositions (Mac)
- **DESIGN-STUDY-ORTHO** — Pillow layout proofs (cloud/Mac preflight); not GPU acceptance
- **LIVE-GPU** — Safari WebGPU (USER-HW OPEN)

## Modifications
| Surface | Code | Art |
|---------|------|-----|
| Calendar/Board/Plan/chrome | `jrviews-ux-states` GEO/WASH/RING | content-aware camera; large emission text; +Z avatar disc; pixel gates |
| Disabled | opacity 0.38 + wash α96 | ROI opacity/contrast |
| Pressed vs focus | same selection blue; scale 0.97 vs ring weight | no arbitrary hue split |
| Lighting | `make_light` uses params size/distance × scenePxScale | offset measured PASS; blur documented |

## Remaining
- Mac METAL views must pass `validate_view_pixels.py` (dark text, contrast, avatar chroma)
- Moho re-animate + `-r` loop check |f1−f120|≈0
- LIVE-GPU screenshots

## Ortho proofs (this handoff)
`qa/ortho-preview/view_*_ortho.png` — generated in-repo; pixel-validated; **not** Blender METAL.
