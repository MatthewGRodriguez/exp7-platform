# Exp7 view state table (1.8.4)

Single source: [`state-table.json`](./state-table.json) (this directory). Click-path visuals ≤120 ms; never gate the action.

## Element states

| State | Lift | Scale | Opacity | Ring | Notes |
|-------|------|-------|---------|------|-------|
| idle | 0 | 1 | 1 | none | Rest |
| hover | 1.5 | 1 | 1 | none | Pointer enter |
| focus | 1.5 | 1 | 1 | focus | Keyboard |
| pressed | 0 | 0.985 | 1 | none | Down |
| selected | 2 | 1 | 1 | gold | Best ≠ Selected |
| dragging | 4 | 1.02 | 0.96 | none | Freeze ambient |
| drop-pending | 3 | 1.01 | 0.9 | caution | |
| invalid | 0 | 1 | 1 | caution | Bounce ≤120 ms |
| settling | 1 | 1 | 1 | none | After drop/cancel |
| disabled | 0 | 1 | 0.5 | none | No pointer |

## Avatar (exclusive)

| Condition | Mode | Paint |
|-----------|------|-------|
| absent / freed | initials | Soft disc + initials only |
| loading | pending | Neither until settle (DOM parity) |
| ready | photo | Circular clipped bitmap only |
| error / bad CORS | initials | Soft disc + initials only |

Never dual initials+photo.

## App / parallax

| App | Ambient | Pointer |
|-----|---------|---------|
| loading | paused | off |
| ready | drifting | tracking |
| preview / applying / undo | paused | per table |

Hidden tab and reduced motion pause loops, transitions, transforms, and parallax.

## Interrupts

Escape / cancel / pointercancel / lostpointercapture → glide to idle/settling ≤120 ms.
