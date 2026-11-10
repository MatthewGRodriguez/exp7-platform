# Views: atlas → vector model → JRender (1.8.37–1.8.39)

**Status:** shipped on `main`: 1.8.37 (PR #67), 1.8.38 (PR #68), 1.8.39 (PR #71, carrying the change reviewed in #69) and 1.8.40 (PR #72, wasm-opt). [REQ 2026-11-10]

## Pipeline (1.8.39)

```
atlas (live session of atlas/runtime.js, eval passes)
  → view model   — vm-host builders: typed tree {__vm, tokens, kids}
  → Exp7VM.layout — JRender draw-list nodes with stable fnv ids, hits, skin, motion tags
  → JRender      — first draw jrd_load; every later draw is a JRDP patch by node id
```

Before 1.8.39 the runtime's builders (`calHtml`, `boardHtml`, `planHtml`, `depsHtml`, …) emitted HTML that JRViews parsed and laid out. Matthew asked to pivot away from HTML [REQ 2026-11-10]; in 1.8.39 those builders and the HTML layout path are deleted, and the runtime's `render()` only tells the session the atlas moved.

Runtime actions (month navigation, item events) still call the runtime's own handlers (`S.J.compAct` / `S.J.event`). View actions that change atlas paths become proposals through the real checker. View-local state (selection, open rows, forms) stays in the session.

### Model node types
`col`, `row`, `text`, `btn`, `chip`, `field`, `day` (calendar cell), `table` (dependency table) and `pop` (popover). Builders use the helpers on `window.Exp7VM` (`col`, `row`, `text`, `btn`, `chip`, `field`).

## Three customization layers [REQ 2026-11-10]

1. **View options** — which parts a view shows. Pass `Exp7Views.mount(..., { options })`.

   | View | Options |
   |---|---|
   | calendar | `toolbar`, `tip`, `legend`, `count` |
   | board | `toolbar`, `resources`, `category`, `item` |
   | plan | `columns`, `alternatives`, `summary` |
   | budget | `facts`, `tabs` |

2. **Skin parts** — how each role is drawn. `Exp7VM.skin.use({ container, button, chip, field, day, row })` replaces parts; `Exp7VM.skin.reset()` restores the default skin. A part returns `{ sh, face, hov, ink?, bold? }` (shadow items, face items, hover colour).
3. **Per-app tokens** — colours, radii, type. Pass `mount(..., { tokens })`, or derive them with `Exp7VM.fromTheme(theme)`. Live text fields use `Exp7VM.fieldStyle(tokens)`, so a resting field and the live field drawn over it are pixel-identical.

## Motion (vector, on JRender transforms)

| Effect | Trigger |
|---|---|
| Hover lift | pointer enters a free control; any other lifted control settles at the same time |
| Press | pointer down scales face + shadow; release returns the face to its hover lift, the shadow to rest |
| Slide-in | rows marked `enter` that are new since the last draw |
| Shake | calendar days the atlas marks with anim `shake` |

Timings come from `EXP7_MOTION_CONFIG`; `prefers-reduced-motion` turns tweens into jumps. After every patch, stale transforms are reset so GPU parity stays exact.

## JRender core (1.8.37)

JRender branch `dl-index` (b9423a3, Ash's repo, `runtime/DL-INDEX.md`): a per-group y-bucket index drives tessellation and hit tests, paint ranks update on insert, growth uploads only changed vertex ranges, and `Renderer.init({ budgetMs })` spreads off-screen work across frames. JRViews uses `budgetMs: 4`: on-screen rows always draw in the same frame; the margin catches up.

- **[USER-HW]** 100,000-row board on Matthew's Mac: load 3,778 → 195 ms; wheel + draw per step 1.03 → 0.28 ms; hover hit test 0.97 → 0.007 ms.

## Evidence for 1.8.39 [USER-HW]
Built-in browser on Matthew's Mac (WebGPU):
- GPU parity (`Exp7Slabs.verify`): Calendar, Board, Plan and both replicas — 0 px / 0 hit differences.
- Waking the Board's lazy rename fields changes 0 pixels (resting fields draw their value).
- Calendar, Board, Plan and Budget chrome interactions covered in PR #69 / #71; action draws 2.7–16.6 ms; no page errors.

## Open
- **[OPEN]** JRender `dl-index` (now `58e98cb`: indexed core, frame budget, gradients and strokes) is not merged into JRender `main` and has no remote; it needs Ash's review. Renderer fixes from Ash's 1.8.40 review shipped in 1.8.41; gradients and strokes in 1.8.42 ([jrender-paint-stroke.md](./jrender-paint-stroke.md)).
- **Done (1.8.40)** The `dl-index` wasm is now built with `wasm-opt`: 289,561 → 256,009 B (`916004a5…`), same exports and imports, GPU parity 0 px / 0 hit on every view. [USER-HW]
- **[OPEN]** With live rename fields awake, `verify` reports hit differences (the field owns its hit box; the field-less reference doesn't). Pixels match.

## Related
[architecture.md](./architecture.md) · [views-jrender-standard.md](./views-jrender-standard.md) · [ranking-jfengine.md](./ranking-jfengine.md)
