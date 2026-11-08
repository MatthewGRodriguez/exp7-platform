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
| Views framing/ghosting | **PASS** v6 / v8 mesh-extent framing |
| Views ALL-text contrast + avatar | **Mac v7 FAIL** root-caused → **v8 mechanism** cloud CPU: probe 640 **PASS** (honest secondary skips); production 1280 **PASS** (fg≈24 ink). **Mac METAL re-probe OPEN** |
| Projected-ROI + text-hidden BG validator | **SHIPPED** v8 (`projected-roi-textmask-v8`) — evaluated-mesh text ROI; replaces hardcoded title y14–57 |
| Preflight palette/avatar fixture | **SHIPPED** PIL-free `preflight_views.py` (stdlib PNG; no Mac pip) |
| Color mgmt | **SHIPPED** v8: `Standard` + sRGB→linear emission (AgX + hex-as-linear was wash) |
| Avatar asset | **SHIPPED** illustrated fixture (FIX badge) — not photo claim / not gradient |
| Diagnose script | **SHIPPED** `diagnose_view_rootcause.py` (projected glyph px + swatches) |
| Ortho cloud | **not** METAL predictor |
| Production METAL views 1280 | **NOT RUN** on Mac until METAL probe PASS |
| New handoff archive | **BLOCKED** until Mac METAL validates same mechanism |
| LIVE-GPU browser | **OPEN** |
