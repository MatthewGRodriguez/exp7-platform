# Visual delivery (1.8.8)

## Apps picker and icon flicker (1.8.11)

1.8.10 made the Apps overlay opaque and the JR canvas the thing on screen. That canvas was not the DOM cards. Its buttons used `min-height:4.5rem`, which layout read as 4.5px, and the label and hint were joined with ` | ` on one line. Each button also sat in a full-width section frame. 1.8.11 draws two-line cards at least about 220×70.

The header canvas was the layout height of a padded document, 90px, inside the 44px bar, and every app switch called `drawBar`, which freed the photo and loaded it again. 1.8.11 lays the bar out at 44px and keeps a ready photo across that redraw.

Cloud Node, calling `JRViews.layout` with a stub text measure (not WebGPU, not Mac Safari): bar height 44, avatar circle inside that box; both app cards two lines, hit at least 220×70, including a 360px-wide wrap. Mac is not verified. This does not add the gaussian shadow, translated lift, or the rest of the physical pipeline listed below.

## Header and Apps parallax (1.8.12)

1.8.11 kept the card sizes and dropped the slab classes those surfaces used to carry, so the header and the Apps cards no longer moved with the pointer. 1.8.12 marks the 44px bar as the outer slab and each Apps card as an inner slab. Outer factor is `+0.9676` and inner is `-0.7697`, so the header and the cards move against each other. Card hit boxes stay at least 220×70. Cloud Node classified the layout nodes; it did not paint the motion. A Mac pass with the pointer moving is the check.

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

## Lift and contact shadow (1.8.13)

The state table’s lift was only a darker inset band. A full y-shift covers the next calendar day (the gap is 4px) and the next board row (the gap is 2px), so those still do not translate. Free controls — buttons, tabs, Apps cards — move up by the table lift, capped at 2px, and a solid contact shadow fills the band they left. A selected day stays put and gets a shadow of at most 3px in the gap under it. Hover lifts a free control by 1.5px. Press scales it to 0.97 around its own center. Reduced motion skips that transform.

Cloud Node, on the layout hook: a selected day did not move and its shadow stayed inside the gap; a selected button sat 2px higher than the idle button beside it, with the shadow in the vacated band. Mac paint of the pointer is not verified. This is not a gaussian blur.

## Measured penumbra, glass read, and the gates that stay blocked (1.8.14)

Shell 1.8.14 replaces the single contact rectangle with rows sampled from the published fit: offset 0.79 px and blur 0.93 px per px of lift, core alpha 0.55, elevation 50. A row under the perception floor (3%) is dropped. A row that would enter the next fill is dropped and marked clipped. Calendar days and stacked rows still do not translate. Free controls still rise by at most 2px, and the hit moves with them. Disabled text is no longer multiplied by 0.38. Its ink stays, and the contrast check is at least 4.5 in every state.

A dark fill gets the published static glass brightening (top alpha about 0.04, bottom about 0.06). A near-white fill does not: that brightening is under 3%. Specular specks are not drawn. `uxCaustics` is `not-emitted`. This build did not re-render Blender, so it is not a new caustic proof.

The 85 mm scale (0.06% per px of lift, distance 2099 px) is applied only when the change is at least half a pixel. At the lifts that fit in the gaps, that change is smaller, so the pose stays unscaled. Header and Apps parallax are unchanged.

Cloud Node called `View.show` and checked the decorated list: day y, fading penumbra, clip, button lift and hit, avatar disc, dark-glass read, contrast, reduced motion, a missing `matchMedia`, hidden pause, and Exp7 `show` leaving Budget sections alone. That check is not a file in this repo. It did not paint pixels on a GPU.

## Face lip and click ease (1.8.15)

The hard inset bar is gone. The bottom of the card uses the same sampled kernel as the cast shadow, drawn up into the cell so it cannot cover the next day. Hover and press ease over the state-table times (90 ms, 60 ms, and the other click-path times, all at or under 120 ms). The click handler runs first. The frame loop stops when the ease arrives. Reduced motion and a hidden page drop the transform. This is not Moho playback.

Cloud Node, on `View.show`: a selected day stayed put, the face rows faded and ended at the cell bottom, and the cast shadow stopped at the next row. A button ease was partway up at the middle of the 90 ms and finished with no frame left running. Mac paint is not verified.

## Drag and key press (1.8.16)

A drag start eases a free control to the dragging pose (scale 1.02, lift capped at 2 px) over 80 ms. A day or a stacked row stays at scale 1 and does not rise. Drag moves do not restart the ease. Drag end eases back over 120 ms. Enter and Space use the same shrink as a pointer press. There is no focus event in the renderer, so the focus ring stays the layout-time ring. The click and drag handlers still run first. The frame loop still stops when the ease arrives. This is not Moho playback.

Cloud Node fired the live handler: a button drag targeted scale 1.02 and lift 2, a day drag targeted scale 1 and lift 0, Space targeted scale 0.97, and drag end used 120 ms. Mac paint is not verified.

## Still not implemented

- A GPU gaussian filter. 1.8.14’s shadow is the sampled kernel in display-list rows. The shipped wasm has no blur op.
- Translated lift on calendar days and stacked rows. The next fill is too close. Free controls still rise, capped at 2px.
- A refraction shader, and any caustic speck. The static glass read is the published brightening on a dark fill only. Specks stay out. There is no new on/off render in this build.
- Moho SVG frame playback inside the wasm renderer. The wasm has no SVG or timeline op. Click, drag, and Enter/Space poses ease on the state-table times and the frame loop stops. That ease is not the Moho timeline. A keyboard focus ring is still applied at layout, because the renderer has no focus event.
- The 85 mm perspective scale on the lifts that fit. It is under half a pixel there, so it is not drawn. Parallax remains the existing slab motion.
- Face images on Cal / Board / Plan cells. JRDI remains the chrome-bar avatar.
- Atlas and Roster as separate lean apps.
- A Mac Safari / Shortcuts capture of this build. The Back overlay still has no new runtime capture.

## Do not read these as the product

- `docs/archives/artist-jrender/` Blender and Moho outputs
- Any v11 high-saturation ring sheet
- `EXP7_MOTION_CONFIG.element` inside the lean file (the live pose table is `JRender.POSES`)
