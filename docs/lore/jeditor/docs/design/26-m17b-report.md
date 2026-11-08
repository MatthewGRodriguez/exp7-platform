# 26 · M17b report: world editor, server routes, Exp6 picks, drag/drop

Date: 2026-11-01 (CST). Lore revision: 51. ADRs 0086–0090.

## Built
- **World editor** (`editor/world.html`, `world_editor.js` 44,408 B, `world_editor.css` 3,905 B). Input is click and picker only, with an on-screen keyboard for names.
  - Items: values, factors, alts with Pref/Unavail, a jreq picker that refuses self chains, and a blueprint ref.
  - Joys and the clock.
  - Blueprints: a node graph with a 7-node palette, click wiring, and cycle and conflict markers from a dry run.
  - Components: view, theme, a janim set, state mapping from blueprint outputs, subs by reference, and position nodes.
  - Templates are a one-time copy. Delete leaves broken markers, which can be fixed.
  - Undo/redo with persistent history, live preview, save/load/export. The premade palette is empty. Stamp "M17 · Lore rev N".
- **Server**: `/` is the world editor and `/legacy` the old editor, plus the `/api/world*` routes. Milestone M17, banner updated.
- **Exp6** alternative picks (ADR 0086), **drag/drop** events (0087), **fixRef** (0088), **component janim/states** (0089), **routes** (0090).
- Fixes found by the tests:
  - picker labels use single spaces;
  - `self` item nodes are no longer reported as broken;
  - a condition with no matching event now outputs undefined, so it no longer writes null;
  - the 'dragging' state survives re-render.

## Verified (Mac, headless Chrome, port 8798, /tmp copies)
- **From-empty editor click test**: `editor/test/make_m17_spec.js` → `m17_editor_result.json`. 30 steps, 0 MISS, 0 exceptions.
  - The tiny app is built by clicks.
  - jreq self-reference is refused both directly and through a chain.
  - A wire making a loop inside one blueprint is refused.
  - The template copy is independent: the copy's layout is grid while the original stays stack, and no origin is stored.
  - Undo/redo works.
  - Deleting pizza gives 2 broken refs. Both are fixed through the UI, leaving 0.
  - The preview shows `exp6 Best` → tacos. After reload, 60 history entries persist.
- **Exported HTML offline** (file://, 398,513 B, CSP network-closed, 0 external refs): `m17_offline_result.json`.
  - Exp6 engine, worker backend, score backend webgpu.
  - A real alt click sets the user pick to sushi.
  - Real clicks bring the budget from 40 to 10 and the style to bad (shake).
  - A real pointer drag of shop onto dinner gives `zone = item:dinner`, with the mid-drag state 'dragging'.
  - Requests: only the file itself and its worker blob.
- world_test: 47 checks pass, including the Exp6 parity on 200 random sets (vs. the prior argmax and vs. direct JGroup.Best), SimulatedBest, fixRef, and drop.
- All legacy parity tests rerun and pass: board_parts, calendar, items, janim, jdata, motion, plan, rank, sync, and engine node_parity. The demo offline spec was rerun with identical results.
- Screenshots: box `/workspace/jeditor_shots/m17/` (16 PNG + specs/reports + tiny_app.html).

## Not verified / remaining
- The WebGPU path was only *detected* in headless Chrome (`score: webgpu`). The alternative scoring itself runs Exp6 on the main thread or worker; there is no GPU-vs-CPU numeric comparison for picks in the browser.
- Not tested: SimulatedBest in the browser UI (covered only in Node), touch input on real devices, and very large worlds (performance).
- The history is capped at 60 entries, so earlier undo steps are dropped.
- Legacy generator and levels are frozen (ADR 0085) and not migrated to world format 5.
