# Art-pass evidence — classified (2026-11-08)

Base merge: `3d76da1df0562e9eb527233f648976c367711871` · Review version **1.8.4**.

| Gate | Result | Class |
|------|--------|-------|
| Perspective 1/2/3-point + wrong-camera negative | Run `art/perspective/perspective-tests.mjs` → `perspective/results.json` | **[MEAS]** CPU math |
| Focal 18–200 matched framing; lens recorded 85 mm | In params + focal study | **[MEAS]** |
| State table JSON/MD/Mermaid; click-path ≤120 ms | `art/design/*`; unit assert | **[MEAS]** |
| Single param source (geometry/light/camera) | `art/design/params.json` | **[MEAS]** |
| Lighting fits from h·cot(elev), h·size/dist | `art/lighting/fits.json` analytical | **[MEAS]** analytical; Blender **[OPEN][BLOCKED]** |
| Blender CLI renders / caustics proof | Not run — no blender | **[OPEN][BLOCKED]** |
| Moho CLI SVG/keys/side-by-side | Not run — no moho | **[OPEN][BLOCKED]** |
| JRDI image sanitize / exclusive / free | `tests/jrender-images.test.mjs` | **[MOCK]** |
| Profile photo on bar (circular, hit, parallax, DPR) | Code landed; GPU paint | Cloud **[MOCK]/no-adapter**; Mac **[USER-HW][OPEN]** |
| Contrast ≥4.5 worst bg (text hidden) | Not pixel-measured here | **[OPEN][USER-HW]** |
| Clipcheck 0 | Not run (no GPU harness) | **[OPEN]** |
| Transitions ≤120 ms | Table enforced in tests | **[MEAS]** table; paint **[OPEN]** |
| matchMedia missing / reduced / hidden pause | Exp7Slabs existing guards retained; not re-timed | **[CLAIM]** retain; re-measure **[OPEN]** |
| Idle rAF 0 / style recalc ≤1/s / 5 s | Not timed on this VM | **[OPEN][USER-HW]** |
| Largest-data drag/scroll/idle p95 ≤16.8 ms | Not run | **[OPEN][USER-HW]** |
| Apply ≤100 ms; select-next-frame ≤120 ms | Not run | **[OPEN][USER-HW]** |
| Exp7Slabs.verify('vf-cal') / viewverify | Requires WebGPU adapter | Cloud **[MOCK]** no-adapter; **[USER-HW][OPEN]** |
| Device-loss recovery (images) | Code path present; not hardware-exercised | **[OPEN]** |
| Packed metrics chars/lines/hash/delta | `pack/metrics.json` | **[MEAS]** |
| No browser flags / software GPU / ACL workarounds | Obeyed | **[MEAS]** process |
| Prior Mac-worker bc-71d24d2f… | No changes; ignored | **[CLAIM]** superseded |

**Honest summary:** Substantial JRDI + chrome + design/state/perspective/analytical lighting + pack landed. Full art workflow is **not** complete without Blender/Moho/Mac WebGPU gates.


## Update
- Lighting fits marked **provisional-analytical-only**; Blender/Moho Mac probes probe-ready via handoff archive.
- MOCK screenshots/GIFs are not production visual evidence.
