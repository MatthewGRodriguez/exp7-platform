# Acceptance matrix — art pass 1.8.4 / generator v6

**No blanket art-pipeline pass.** CI green ≠ visual QA. Ortho ≠ METAL.

## Production (lean 1.8.4) — actual Node tests

| Gate | Result | Evidence |
|------|--------|----------|
| JRDI sanitize / allowlist / secrets | **PASS** | `tests/jrender-images.test.mjs` |
| Exclusive avatar paint | **PASS** | lifecycle |
| Load race / patch / free / recover / budget | **PASS** | lifecycle `[MOCK]` |
| CORS credentials omit | **PASS** | lifecycle |
| No second renderer | **PASS** | art-checks |
| GEO syncs `n.hit` | **PASS** (fixed) | `jrviews-ux-states.js` packed |
| `avatarCircleHit` API | **PASS** | chrome; activation = companion DL HIT |
| Optional `data-jr-img` | **NOT WIRED** | IMAGE-ABI |
| LIVE-GPU Safari avatar | **USER-HW OPEN** | — |
| Focus/IME TextField | **UNCHANGED** | — |
| PAT overlays | **DOM unchanged** | — |

## Per-view production UX

| Surface | Production | Study-only |
|---------|------------|------------|
| Chrome bar | JRDI photo XOR initials | Blender chrome / Moho |
| Apps picker | wash/ring/GEO | — |
| Exp7 Cal/Board/Plan | layout WASH/RING/GEO | Blender views |
| Budget + tabs | same UX wrap | — |
| Atlas app | N/A (data only) | — |

## Art pipeline (Mac) — actual probes

| Gate | Result | Evidence |
|------|--------|----------|
| Moho shapes + `-r` + loop `f0==f120` | **PASS** | REPORT-v5; metrics unique=102, Δ=0 |
| Light size/dist 0.4667 | **PASS** | Mac v5 log |
| View framing | **PASS** | Mac v5 crop shows full “November” |
| Calendar METAL text contrast ≥4.5 | **FAIL** v5 (1.73/1.76 ghosted) → **FIX shipped v6** unlit flat text — re-probe | crop + REPORT-v5 |
| Board/plan/chrome METAL | **NOT RUN** v5 (aborted) → v6 continues after fail | — |
| Chrome avatar pixels | **UNTESTED** METAL | — |
| Shadow beauty full blur | **UNMEASURABLE** v5 (occlusion) | lighting-fits v5 |
| Shadow-cal invisible caster | **FIX shipped v6** — Mac pending | `shadow_cal_lift_*` |
| v4 offset 0.309 | **old light only** | fits.json |
| Ortho cloud proofs | **PASS** layout intent only — **not** METAL predictor | `qa/ortho-preview/` |
| LIVE-GPU | **USER-HW OPEN** | — |
