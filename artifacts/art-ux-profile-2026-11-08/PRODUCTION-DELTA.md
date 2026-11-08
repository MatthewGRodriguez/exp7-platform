# Production delta vs art study (1.8.4)

## Changed production files / functions

| File | Functions / exports | Effect |
|------|---------------------|--------|
| `art/src/jrender-images.js` | `sanitizeUrl`, `exclusiveAvatarPaint`, `ImageStore.*`, `ImageLayer.*`, `attachToRenderer` | JRDI on shared GPUContext |
| `art/src/platform-chrome-jr-profile.js` | `start`, `setAvatarInfo`, `unmount`, `onContextLost`, `avatarCircleHit` | Chrome avatar exclusive paint |
| `art/src/jrviews-ux-states.js` | wraps `JRViews.layout`; `UX_WASH`/`RING`/`GEO`; scales `n.hit` | Cal/Board/Plan/chrome state visuals |
| `exp7-platform/exp7-platform-lean.html` | packed blocks | Shell 1.8.4 |
| `exp7-platform/release.json` | version/sha | Provenance |
| `tests/jrender-images*.mjs` | MOCK lifecycle | CI |
| `art/api/IMAGE-ABI.md` | contract | Host ABI |

## Art study-only (not production UI)

`art/pipeline/blender/*`, `art/pipeline/moho/*`, `art/lighting/fits.json`, `qa/*`, ortho PNGs, Mac METAL/Moho probes.

## Gaps

- `data-jr-img` unwired; LIVE-GPU OPEN; pressed mid-gesture needs re-layout; dual motion tables coexist.

## Universal UX pass (beyond WASH/RING/GEO)

See `UX-IMPROVEMENTS.md` for exact before/after. Common JRViews path only.
