# UX1 - drag / apply-to-shifts / select (motion + interaction layer)
Block packed/UX1_packed.js: 20242 chars / 33 lines, ASCII, after GL4 and before STONE. Logic hooks for Ash: HOOKS_drag_apply.md.
Harness: harness/h_ux.html (fetch3d + v4 art + HARNESS MOCK hooks + UX1). h_ux_nomock.html runs on today's exports only.
GIFs: shots/ux_drag, ux_cancel, ux_invalid, ux_apply, ux_select, ux_kbd. Stills: shots/still_*.png.
Results:
- 1M-row page (perf_1m.json): drag p50/p95 16.7 ms, 2 frames > 20 ms (lift), Apply 30.5 ms, Undo 16 ms, select 4.5 ms.
- Clipcheck 0 (clip_ux.json). Contrast: dock >= 5.21, pill >= 6.98.
- Reduced motion: no animations or transitions. Touch: long-press 280 ms lifts; a quick swipe scrolls.
