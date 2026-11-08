# Universal view UX improvements (production) — exact before/after

**Scope:** Exp7 + Budget Cal/Board/Plan + chrome via common JRViews path.  
**Not a redesign.** No app forks. Calendar fixed-fit / forms / drag / nav / Best≠Selected / model semantics **intentionally unchanged**.  
**Blender generator untouched** (Mac v6 render in flight).

## Improved

| ID | Issue | Before | After | Surface |
|----|-------|--------|-------|---------|
| H1 | Boxed control hit ignored inline min box | `bh=sz+9` (~22px); chrome `min-height:36px` ignored | `bh=max(sz+9, min-height)`; `bw` respects `min-width` | All `button`/`.ja-joy` in JR layout; chrome 36×36; apps JR `min-height:4.5rem` |
| H2 | GEO scale missed array `n.hit` | Only `{x,w}` object form (dead) | Scale `[x,y,w,h]` arrays + objects | pressed/dragging hit parity |
| H3 | Day label floor sub-pixel | loops to `size>0.35` | Floor **6px** (matches comment); `DAY_H=78` kept; no ellipsis/chip drop | Calendar month cells |
| M1 | Sticky `data-jr-state` blocked re-infer | Early return any attr | Sticky only avatar `photo\|pending\|initials\|loading` | Tabs / `.on` / focus after class change |
| M2 | Back had no focus ring | `#btnAvatar:focus-visible` only | `#btnBack:focus-visible{outline:2px solid #246;outline-offset:2px}` | DOM keyboard (jr-on canvas focus still USER-HW) |
| M3 | Empty/error presentation thin | bare `<i>none…`; `.jrerr` color only | `empty`/`data-empty` stamps; `.jrerr{padding:12px 14px;…}` + `role=alert` | Cal sections, day detail, GPU fail |

## Intentionally unchanged

- Calendar equal day height (`DAY_H=78`), no silent chip drop, no day ellipsis
- Forms / TextField IME ownership
- Day drag + `ja-sel` / `ja-drag` / `ja-anchor` selection model
- Best ≠ Selected (Plan pins / Best ranking)
- Reserved bar `44px`; PAT/account DOM overlays
- Single builders path (no Exp7/Budget layout forks)
- No second renderer; `.jrerr` only on GPU fail
- Selection wash blue vs Best gold ring semantics

## QA still OPEN (live browser blocked ≠ pass)

- jr-on canvas keyboard focus paint for bar acts
- Finger-target feel of 36px / 4.5rem on device
- Crowded-month 6px floor readability screenshot
- Safari WebGPU LIVE-GPU avatar / views
- Mac METAL v6 art renders (in flight — generator frozen)
