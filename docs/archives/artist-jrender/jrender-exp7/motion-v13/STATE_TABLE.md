# Native slab motion contract

All original v12 state edges remain unchanged; source edge table is `original-edge-state-config.json`.

| State | Front/text | Side geometry |
|---|---|---|
|ready/ambient|stationary unless input|original pxRo/pxRi69s linear source keyframes|
|pointer tracking|outer +.9676px, inner -.7697px per unit view|source back-front differential .6421/.9035px plus ambient|
|scroll tilt|clamp(pointerY + velocity), velocity += dy*.012,260ms decay, stop .004|same view + original ring-only ambient|
|drag frozen|last view held|phase paused; no ambient RAF|
|form rest|identity parallax; original TextField/IME ownership|off while original authoring fields exist|
|hidden/inactive/loading|no animation work|one union pause clock, resume same phase|
|reduced|no parallax; v12 reduced zero transforms/transitions|off; no ambient RAF|

Source camera85mm, D2099.1px, S60px, E15.64, pivot3.7px. Text fronts remain <=1px at full input; outer/inner separation1.7373px.
Outer panel thickness1.5px/front height1.5; inner glass thickness2px/front height5.4, from original draw.py. Source CSS shades retained; native rounded contour side quads replace CSS border-ring rasterization. Existing v11/v12 rest borders are retained, not redesigned.
Existing .ja-comp -> outer; rounded section/row/deps/detail/rails -> inner; logical .ja-cal/.ja-plan uses actual drawn bounds and original card1 radius10, side geometry only. Buttons and day keys ride their containing slab, never acquire invented individual depths.
Original PX2b fixed backdrop is respected. It removed ambient because DOM slabs/animations restarted on renderAll. This persistent keyed native scene restores ONLY the original PX2 ring loop, not superseded platter/tiger drift or moving text. Native side updates are real GPU-scene work; stable fronts/text are not rewritten by ambient.
Optional matchMedia is guarded. Drag, hidden, inactive and loading intervals share a pause lifetime; source scroll tilt is velocity-based, not saturated page position. Authoring views hold rest geometry to preserve existing textarea/IME coordinates.
