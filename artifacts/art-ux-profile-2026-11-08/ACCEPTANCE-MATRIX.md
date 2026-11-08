# Acceptance matrix — no blanket pass

## Production (lean 1.8.4) — Node evidence
| Gate | Result |
|------|--------|
| JRDI lifecycle/CORS/exclusive | **PASS** |
| Universal UX regressions (hit/floor/re-infer/empty/error) | **PASS** |
| LIVE-GPU Safari / jr-on canvas focus | **USER-HW OPEN** |
| `data-jr-img` | **UNWIRED** (API documented only) |

## Art Blender/Moho
| Gate | Result |
|------|--------|
| Moho loop | **PASS** v5 — do not re-run |
| Shadow-cal offset | **PASS** 0.3186±0.004 vs 0.3249 (−1.9%) — **do not re-render** |
| Shadow blur 10–90 | **EMPIRICAL** 0.207/0.123 ≠ analytic 0.4667 (definition) — recorded, not forced |
| Views framing/ghosting | **PASS** v6 |
| Views ALL-text contrast + avatar photo | **FAIL** v6 (pale secondary; black disc) → **FIX v7** pending Mac probe |
| Semantic ROI validator | **SHIPPED** v7 (not dark-count fudge) |
| Preflight palette/avatar asset | **SHIPPED** `preflight_views.py` |
| Ortho cloud | **not** METAL predictor |
| Production METAL views 1280 | **NOT RUN** until probe PASS |
| LIVE-GPU browser | **OPEN** |
