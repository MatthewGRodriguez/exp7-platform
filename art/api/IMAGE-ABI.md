# JRender Image ABI (JRDI / 1)

**Status:** Host ABI for real WebGPU JRender. **Not** a wasm DL op — shipped `jrender_full_small.wasm` rejects unknown DL ops; bitmaps live on the shared `GPUContext` and composite in the same render pass.

Evidence: implementation `art/src/jrender-images.js` packed into lean as `data-exp7-shared="jrender-images"`.

## Why host-side

DL v1 item ops are `RECT|RRECT|PATH|TEXT|BORDER|HIT|TEXTBOX`. Unknown ops reject the whole list. Rebuilding wasm is out of scope for this release-repo pass (no Rust tree here). JRDI keeps vector wasm unchanged and adds textured quads on the Artist’s real WebGPU path — **no CSS/DOM renderer, no WebGL2 fallback**.

## Ownership

| Object | Owner | Lifetime |
|--------|-------|----------|
| `ImageStore` | `GPUContext._images` | Until `gc.destroy()` |
| `ImageHandle` | store map + refcount | `load`/`retain` +1; `free` −1; force free on 0/evict |
| GPU texture | handle | Destroyed on free / replace / device-loss before recover |
| `ImageLayer` node overlays | `Renderer.images` | Cleared with renderer or `images.clear` |

Validation on `load`/`patch`: HTTPS only; allow-listed public GitHub avatar hosts; reject secret query keys (`token`, `pat`, …); strip query/hash for cache key; max edge 256; max 32 entries; CORS `fetch` + `credentials:'omit'`.

## API (JRB-style)

### Load

```
handle = await JRender.Images.storeFor(gc).load(url|ImageBitmap, { timeoutMs? })
```

States: `empty | loading | ready | error | freed`.

Absent / disallowed URL → handle with `state:'empty'|'error'` (no texture). Caller must show **exclusive** initials/soft-disc — never dual with a photo.

### Patch

```
await store.patch(handle, nextUrl|bitmap, opts?)
```

Increments generation; in-flight loads for old gen are ignored; previous texture freed on successful replace.

### Free

```
store.free(handle)        // refcount
store.free(handle, true)  // force
```

### Overlay (hit / parallax companion)

Companion DL node (HIT) remains the hit target. Overlay:

```
renderer.images.set(nodeId, { handle, x, y, w, h, alpha, clip:'circle', dx, dy })
renderer.images.shift(nodeId, dx, dy)  // Exp7Slabs front parallax
renderer.images.clear(nodeId?)
```

Clip: circular discard + soft edge in WGSL. Alpha respects DPR via CSS-px → device pass with scene viewport.

### Device loss

`gc.recover()` / `renderer.recover()` re-fetch URL handles and rebuild the image pipeline. No silent software fallback.

## Exclusive avatar paint

```
JRender.Images.exclusiveAvatarPaint(mode)
-> { mode, showInitials, showPhoto, showSoftDisc, label }
```

| mode | initials | photo | soft-disc |
|------|----------|-------|-----------|
| pending/loading | no | no | no |
| photo/ready | no | yes | no |
| initials (also error/absent/freed fallback) | yes | no | yes |

Never dual initials+photo. Soft-disc is exclusive with photo (plate only when initials).

## Platform consumer

`PlatformChromeJR.setAvatarInfo(url, login)`:

1. Sanitize URL via JRDI.
2. Pending: neither initials nor photo (DOM parity) via `exclusiveAvatarPaint`.
3. Ready: re-layout bar **without** initials text; place circular overlay on `plat:avatar` node.
4. Fail/absent: initials on soft disc only; overlay cleared.
5. `unmount()` frees textures; `onContextLost` / `jrender-devicelost` recovers store then redraws.
6. Parallax: Exp7Slabs front factor shifts overlay (`images.shift`).
7. Hits: companion DL HIT (rectangular) remains the **activation** target for `plat:avatar` (a11y-sized). Circular precision is available via `renderer.images.hit` / `PlatformChromeJR.avatarCircleHit` — not a second hit system for keyboard/DOM.

## JRViews — optional `data-jr-img` consumer API (UNWIRED)

Bar avatar via `PlatformChromeJR.setAvatarInfo` is the **only** shipped JRDI consumer in 1.8.4.

`data-jr-img` is an **optional reserved attribute** for a future host hook. It is **not** implemented, not stamped by builders, and must not be treated as a shipped feature.

### Intended consumer contract (when wired later)

```
element[data-jr-img="<https-url>"]
  → on layout/show: sanitizeUrl → store.load → renderer.images.set(nodeId, {clip:'circle'|rect,…})
  → exclusive paint with any text/soft-disc sibling (never dual)
  → free on node remove / view hide / unmount
```

Until a host implements that hook, authors must not rely on `data-jr-img`. Board/Cal face affordances remain out of scope unless atlas data already carries public avatar URLs (none in Budget IDB today). Apps: Exp7 + Budget only (no separate Atlas app surface).

## Non-goals

- Atlas storage / codec changes  
- PAT or private image hosts  
- Dual paint of initials + photo  
- WebGL2 / CSS replacement renderer  
