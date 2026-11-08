# Visual delivery (1.8.8)

## Apps picker and icon flicker (1.8.11)

1.8.10 made the Apps overlay opaque and the JR canvas the thing on screen. That canvas was not the DOM cards. Its buttons used `min-height:4.5rem`, which layout read as 4.5px, and the label and hint were joined with ` | ` on one line. Each button also sat in a full-width section frame. 1.8.11 draws two-line cards at least about 220×70.

The header canvas was the layout height of a padded document, 90px, inside the 44px bar, and every app switch called `drawBar`, which freed the photo and loaded it again. 1.8.11 lays the bar out at 44px and keeps a ready photo across that redraw.

Cloud Node, calling `JRViews.layout` with a stub text measure (not WebGPU, not Mac Safari): bar height 44, avatar circle inside that box; both app cards two lines, hit at least 220×70, including a 360px-wide wrap. Mac is not verified. This does not add the gaussian shadow, translated lift, or the rest of the physical pipeline listed below.

## Earlier delivery (1.8.8–1.8.10)

The 1.8.9 Mac paste showed `hook: true` and `ux: false` on every view. `View.show` called the local `layout` function, not `JRViews.layout`, so the state-table pass never ran. 1.8.10 calls the exported layout. Idle days had no border in that paste; the pass now adds the state-table border plus the inset light.

The same paste showed the return to Budget skipping `budget-vf-cal` because `budget-t-cal` was `display:none`. Exp7 `show()` queried every `section` in the document and removed `.on` from Budget's sections. 1.8.10 limits that query to `#appSlot-exp7` and restores Budget's current tab before reveal.

The styling that was agreed in `docs/artist-coordination-brief.md` and `docs/design/state-table.json` is shipped only when it is in `exp7-platform/exp7-platform-lean.html` and shows up in the JRender display list. A Blender or Moho file is not a shipped surface.

Environment for the checks below: cloud Node, reading the lean file and running the `jrviews-ux-states` layout hook on stub nodes. Mac Safari / Shortcuts WebGPU is **not** verified.

## Feature → source → shipped code → what was checked

| Feature | Source | In the lean file | Check |
|---|---|---|---|
| Opaque Back plate; old app not visible through the picker | Live repro 2026-11-08 3:00 PM CT | `#appsOverlay.jr-on` background `#f6f7f9`; `#appShell.is-apps-covered` forces slot opacity 0 | Source present. No Mac capture. |
| Return to Budget redraws only the visible canvas | Same repro (Demo Calendar → Back → Budget white) | `viewHostShown` skips hidden panes; `openApp` reuse passes `skipReveal`; reveal uses `rebuild:true` | Source present. No Mac capture. |
| Selected is not Best | `state-table.json` `bestNeqSelected` | `inferState` returns `selected` for `ja-sel` / `.on` / `aria-selected`. Class `best` is not a signal. | Node: a `best` day stays idle; a `ja-sel` day gets the gold ring. |
| Selected ring gold, focus navy, invalid caution, drop-pending gold | `state-table.json` `elementStates` | `RING` and `JRender.RING_COL` | Node: selected border unpacks to `[117,81,15,255]`. |
| Pressed scale 0.97, disabled opacity 0.38, dragging scale 1.02 | `state-table.json` (the JSON, where the markdown drifted) | `GEO` and `JRender.POSES` | Node: pressed day width is 0.97 of the fill. |
| One light, contact shade from lift | Archive `docs/archives/artist-jrender/tdd-animation/params.json` light elevation 50°; lift column in the state table | Inset highlight + shade rects inside the fill. Shade alpha `36 + lift*14`. No y-translation. | Node: bands sit inside the 80×78 fill. Selected shade alpha 64 (lift 2). Idle shade alpha 36. |
| Hover wash on the GPU color swap | State table hover `bg: subtle` | After layout, `node.hov` is the hover wash over the current fill | Node: idle `hov` is not the untouched white fill. |
| Click path ≤ 120 ms, no click gating, no idle rAF added | State table `rules` | No new timer. Shade is layout-time geometry. Existing `calVsKick` still bails when `needsFrame()` is false. | Not timed on Mac. |
| Reduced motion / hidden pause | State table `reducedDisablesLoopsTransitionsTransformsParallax`, `hiddenPausesAmbient` | Unchanged: `ViewStates.setReduced` zeros lift/scale; slabs `visible()` returns false when covered, dormant, or `document.hidden`. | Source present. |
| Shared GPUContext, universal builders | Brief invariants | No second renderer, no per-app layout fork. | The hook wraps `JRViews.layout` once. |
| Contrast of body ink on a selected wash | Brief contrast 4.5 | Ink `[28,35,51]` on the gold wash over white | Cloud Node: idle 15.70, selected wash 12.66, pressed wash 11.13. Disabled opacity 0.38 composites to about 2.16. That is the agreed disabled state. |

## Still not implemented

- Gaussian / offset shadow that leaves the cell. An outside shadow covers the next day. The shade is inset on purpose.
- Translated lift (hover 1.5 px, selected 2 px, dragging 4 px). Same overlap reason. Lift changes shade strength only. `applyCalViewStates` also resets idle day transforms to identity.
- Blender caustics, refractive glass, belt waves, and the v11 study renders. Those files are not the product look and are not packed into the lean HTML.
- Moho SVG frame playback inside the wasm renderer.
- A perspective camera (85 mm study) on the live canvas. Exp7Slabs parallax is the motion that already ships; this pass does not add a camera.
- Face images on Cal / Board / Plan cells. JRDI remains the chrome-bar avatar. `data-jr-img` on view cells is still unwired.
- Atlas and Roster as separate lean apps.
- A Mac Safari / Shortcuts capture of this build.

## Do not read these as the product

- `docs/archives/artist-jrender/` Blender and Moho outputs
- Any v11 high-saturation ring sheet
- `EXP7_MOTION_CONFIG.element` inside the lean file (the live pose table is `JRender.POSES`)
