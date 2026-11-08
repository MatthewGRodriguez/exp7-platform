# Motion v12 state/edge contract

Source: original Artist `samples/states.json`; exact original edge durations and cubic-bezier curves.
Poses deliberately remain accepted `JRender.POSES`, NOT the different art-study element pose magnitudes.
No business action waits for an edge. Unlisted transitions retain the declared legacy 120ms/quadratic compatibility rule.

| From | To | Event | ms | Easing | Click path |
|---|---|---|---:|---|---|
| idle | hover | pointerenter | 120 | out | no |
| hover | idle | pointerleave | 180 | soft | no |
| hover | pressed | pointerdown | 60 | out | yes |
| idle | pressed | pointerdown (touch) | 60 | out | yes |
| pressed | hover | pointerup / click | 120 | out | yes |
| pressed | idle | pointerleave mid-press | 140 | soft | no |
| idle | focus | focusin (keyboard) | 100 | out | no |
| focus | idle | focusout | 120 | soft | no |
| focus | pressed | Enter/Space down | 60 | out | yes |
| hover | selected | click (agenda block) | 120 | out | no |
| selected | idle | Escape / x / click empty | 160 | soft | no |
| pressed | dragging | move > 4 px or long-press 280 ms | 160 | out | no |
| dragging | invalid | enter refused zone | 120 | out | no |
| invalid | dragging | leave refused zone | 120 | out | no |
| dragging | drop-pending | pointerup on valid slot | 80 | out | no |
| drop-pending | settling | commit rendered | 0 | linear | no |
| settling | idle | settle end | 260 | overshoot | no |
| dragging | settling | Escape / pointercancel / Tab | 240 | inout | no |
| invalid | settling | pointerup on refused zone | 360 | overshoot | no |
| * | disabled | disabled attr | 0 | linear | no |
| disabled | idle | enabled | 0 | linear | no |

## Motion ownership

Original scene callbacks run first. GPU-native patches own transform composition; no CSS/DOM renderer substitutes.
Interrupts sample the current pose. Repeated same semantic state does not restart an edge (explicit restart is available).
Finite shake paints the exact final endpoint: intentional cleanup of the original approximately 0.005px residual.
Pulse/glow remain explicit original semantic loops, not a new idle animation.

## Ambient/parallax contract - adapters only, not visible production integration

Original phases: X +/-4px,31s,delay -7s; Y +/-3px,23s,delay -3s; ease-in-out.
Platter: Y; tiger: XY. Projection: shift*z/(2000-z), pointer +/-60px, scroll factor .02, panel zero depth, .5px perceptual floor.
No original platter/tiger/slab depth geometry exists in accepted v11. No replacement backgrounds or scenes were invented.
Only explicitly bound existing original depth layers can animate; the real demo binds none.
Reduced motion disables loops/transforms/transitions/parallax. Hidden tabs freeze phase clocks and cancel pending motion frames.

## Event coverage boundary

The edge resolver supports all21 source edges, while production observes events/states the original controller already emits.
Native scene events do not expose a separate focus event. Existing TextField focus/IME/caret behavior remains untouched; focus/blur edges are available through the motion API, not a new invented global focus model.
Application loading/ready/preview/apply/undo decisions and drag validity are still owned by original Exp7, not inferred or replaced.
