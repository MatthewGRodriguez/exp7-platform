# Art UX + profile image review artifacts (2026-11-08)

Review branch deliverables for merge base `3d76da1`. Platform tip **1.8.4**.

## Paths for coordinator copy

| Path | Contents |
|------|----------|
| `design/` | params.json, state-table.json/md/mmd |
| `api/IMAGE-ABI.md` | JRDI load/patch/free/ownership |
| `perspective/` | tests results + contact-sheet notes |
| `lighting/` | analytical fits + pose-series (Blender BLOCKED) |
| `blender/BLOCKED.md` | missing Blender CLI |
| `moho/BLOCKED.md` | missing Moho CLI |
| `web/` | jrender-images.js, chrome profile consumer, ux states |
| `screenshots/` | MOCK bar avatar SVG states (not GPU proof) |
| `gifs/` | MOCK parallax on/off global-palette no-dither |
| `pack/metrics.json` | packed chars/lines/hash/delta |
| `qa/` | EVIDENCE, missing-gates, view-matrix |

## Honest status

Implemented: JRDI host image ABI, bar profile-photo consumer (exclusive initials), UX state table/washes, perspective math gates, analytical lighting, pack into lean HTML, unit tests.

**Not** complete full art workflow: Blender + Moho + Mac WebGPU pixel/motion gates remain **[OPEN][BLOCKED]** / **[USER-HW]**.
