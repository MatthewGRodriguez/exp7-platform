# Acceptance matrix — production UX + art (no blanket pass)

Live browser blocked ≠ pass. CI green ≠ visual QA. Ortho ≠ METAL.

## Production — Node / source evidence

| Gate | Result | Evidence |
|------|--------|----------|
| JRDI sanitize/allowlist/secrets/exclusive paint | **PASS** | `tests/jrender-images*.mjs` |
| Load race / patch / free / recover / budget / CORS omit | **PASS** | lifecycle `[MOCK]` |
| No second renderer | **PASS** | art-checks |
| Array `n.hit` GEO sync | **PASS** | `jrviews-ux-regression` |
| Re-infer `.on` over sticky idle attr | **PASS** | regression |
| Day text floor 6px | **PASS** (source) | lean layout |
| Control min-width/height honored | **PASS** (source) | lean + chrome |
| `#btnBack:focus-visible` + `.jrerr` alert | **PASS** (source) | lean CSS |
| Empty stamps (`data-empty`) | **PASS** (source) | cal section / day detail |
| `data-jr-img` | **UNWIRED** — consumer API documented only | `IMAGE-ABI.md` |
| Common system Exp7+Budget+chrome | **YES** (one JRViews path) | no app forks |
| LIVE-GPU Safari / jr-on canvas focus / finger targets | **USER-HW OPEN** | — |
| Focus/IME TextField | **UNCHANGED** (intentional) | — |
| Calendar fit / drag / Best≠Selected | **UNCHANGED** (intentional) | `UX-IMPROVEMENTS.md` |

## Per-view production UX (beyond WASH/RING/GEO)

| Surface | Improved | Unchanged |
|---------|----------|-----------|
| Chrome bar | 36×36 hit honor; back focus-visible; avatar exclusive JRDI | barH 44; PAT DOM |
| Apps picker | JR tiles `min-height:4.5rem` match DOM | app set Exp7+Budget |
| Exp7/Budget Cal | empty section stamp; day text ≥6px; control mins | DAY_H=78; drag/sel/anchor |
| Exp7/Budget Board | control mins; state re-infer | builders/model |
| Exp7/Budget Plan | same + Best≠Selected preserved | what-if / Best pins |
| GPU fail | `.jrerr` padding + `role=alert` | no substitute renderer |

## Art pipeline (Mac) — separate from production UX

| Gate | Result |
|------|--------|
| Moho loop | **PASS** (v5) — no further experiments |
| Blender views text contrast | v5 FAIL; **v6 unlit fix shipped**; **Mac v6 render in flight — generator frozen this turn** |
| Shadow-cal invisible caster | shipped; Mac pending |
| Ortho cloud | layout intent only — not METAL predictor |
| LIVE-GPU | **USER-HW OPEN** |
