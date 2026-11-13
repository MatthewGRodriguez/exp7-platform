# Version lineage

## Exp7 demo / lean (app package history) [historical handoff]

| Line | Notes | Evidence |
|------|-------|----------|
| v13 motion | Accepted on Matthew’s visual check 2026-11-06 ~23:30 CST | [USER-HW]; GPU/perf QA never done [OPEN] |
| Box motion QA | CPU GPU command recorder; “Box GPU adapter unavailable” | [MOCK] |
| v14 | Light theme | historical |
| v15 | Experimental views (Matrix, What-if, Dependency graph, Ownership timeline) | historical |
| v16 | (handoff placeholder) | historical |
| v17 | Local collaborative editing: RGA notes, LWW label, movable order, own-intent undo, binary log exchange — **local only**, not durable/authenticated | historical |
| v18–v20 | Planner/scheduler-only experiments; v20 = v17 + planner scripts | **Do not resume** search/scheduler [REQ] |
| **Lean (2026-11-07)** | Based on **v17**; keeps editing; removes experimental views, planner tab, scheduler/planner seed | historical |

**Canceled:** search optimization, benchmarks, Timefold comparison, “v50” research line. **[REQ 2026-11-07]**

## Platform releases on GitHub `main` [MEAS 2026-11-08]

Verified by `git fetch origin main`, `release.json` on tip, and file SHA.

| Version | How it landed | Notes |
|---------|---------------|--------|
| 1.2.0 | PR #1 | Initial lean publish |
| (post-1.2 manual) | Matthew closed PR #3; manual commits | Direct mount path |
| 1.3.0 | PR #4 | Simplify UI; Exp7 proposal-op sync |
| 1.4.0 | PR #5 | App-first; back + avatar chrome |
| 1.5.0 | PR #6 | Budget **stub** package (historical substitute) |
| 1.6.x | PRs #10–#11 | Budget direct HTML views era; reserved bar work |
| 1.7.0–1.7.2 | PRs #12–#14 | Exp7Views unbundle / packed release; JRender shared inject |
| 1.7.3–1.7.7 | PRs #15–#19 | Budget = demo Cal/Board/Plan parity; boot hang fix |
| 1.7.8 | PR #21 | `Exp7Views.mountSurface` (N views, one shared JRender) |
| 1.7.9 | PR #22 | Reserved top bar JRender paint; shell-hosted Exp7Views |
| 1.8.0 | PR #23 | Budget three→four type boards on shared atlas |
| 1.8.1 | PR #24 | Budget chrome cleanup; four Board type tabs |
| 1.8.2 | PR #25 | Bar + apps via JRViews; Budget tabs in `hostDoc` |
| **1.8.3** | **PR #26** | Hide DOM tabs (scoped CSS); Plan chrome after `planDoc`; bar canvas hits |
| **1.8.4** | PR #29 | JRDI profile images + UX state table/washes |
| **1.8.5** | PR #30 | JRDI: keep image VBs until after `queue.submit` (fixes Invalid CommandEncoder) |
| **1.8.6** | PR #31 | App-slot reuse reveals WebGPU views |
| **1.8.7** | PR #32 | WebGPU keepalive (no display:none) |
| **1.8.8** | PR #33 | Opaque Back cover; visible-only reveal; state-table rings and inset light in the draw list |
| **1.8.9** | PR #34 | Debug handoff. Copy debug on the bar. |
| **1.8.10** | PR #35 | Wire the style pass into View.show. Stop Exp7 tabs from hiding Budget sections. |
| **1.8.11** | PR #36 | Apps picker cards are two lines at a real size. Header icon stays put across an app switch. |
| **1.8.12** | PR #37 | Header is the outer parallax slab. Each Apps card is an inner slab. |
| **1.8.13** | PR #38 | Free controls lift. Days and rows keep a contact shadow in the gap. |
| **1.8.14** | PR #39 | Sampled penumbra. Dark glass read. Exp7 show stays in its slot. |
| **1.8.15** | PR #40 | Soft face lip. Click poses ease, then the frame loop stops. |
| **1.8.16** | PR #41 | Drag eases a free control. A day does not grow. Enter and Space shrink like a press. |
| **1.8.17** | PR #42 | A board row's first drag move snaps a gold edge. A day stays unmarked. |
| **1.8.18** | PR #43 | The top of a card fades. Press turns the edge navy, then the edge returns. |
| **1.8.19** | PR #44 | A dark card brightens through the middle. A white card does not. |
| **1.8.20** | PR #45 | The cast shadow stays on the ground when the face rises. |
| **1.8.21** | PR #46 | Shadow ids jump reserved bands, so the first draw does not stall. |
| **1.8.22** | PR #49 | Board rows can be removed. Values and consuming sit on the left. Budget boards share one atlas and show one month, with a day filter. An expense can pay a debt and that row washes yellow. Surplus, DDI, net income, living cost, and net worth stay on every tab. |
| **1.8.23** | PR #50 | Board button clicks reach their actions. Each alternative has a star for preferred and an × for restricted. |
| **1.8.24** | PR #51 | An active button fills gold, and a restricted one fills rose. The resource name field stays with its label. |
| **1.8.25** | PR #52 | Text typed in the resource name field is drawn inside that field. |
| **1.8.26** | PR #52 | Set values flips a positive amount to a negative one. A resource can be removed. The star prefers an alternative, and × makes it unavailable. |
| **1.8.27** | PR #54 | The view store loads JRDL views on the shared renderer. An overlay falls through where it has no hit. basE91 keeps a low-entropy pack. |
| **1.8.28** | PR #55 | The Fish app is the overlay demo: card and button slots, with the fish swimming over them. |
| **1.8.29** | PR #56 | The Lumen app is the next overlay: a session card and a Confirm control as slots, and a light that glides across the card. |
| **1.8.30** | PR #57 | A Board row is an item category. Its items are listed under it, one per line, each with its values and a Set values button. The category name is a text box, the list folds behind an arrow, and the row shows the selected item. New item asks for a name, a requirement and the resources used. The demo Board saves its changes through the demo checker. |
| **1.8.31** | PR #58 | A Board value shows as the value with its unit and no name: usd reads `$1,200`, hours read `4 h`. Consuming values are red and the rest are green. An item's star, unavailable and Remove buttons sit on their own line under it. Item lists start hidden, and Add alternative is always on the row. The Budget month and day buttons are one date button. It opens a mini calendar over the view, and the view always shows that date's whole month. Parallax runs on Budget again: a category name box no longer holds its Board at rest, the figures bar is a slab, and a Board type that is not shown does not animate. |
| **1.8.32** | PR #62 | The Path inspector renders only the touched paths plus a preview. |
| **1.8.33** | PR #63 | Ranking with JFEngine instead of `Best()` ([ranking-jfengine.md](./ranking-jfengine.md)). |
| **1.8.34** | PR #64 | The old `Best()` ranking code is removed. |
| **1.8.35** | PR #65 | Board scroll and layout scale with what is on screen. |
| **1.8.36** | PR #66 | Parallax holds still while scrolling. |
| **1.8.37** | PR #67 | JRender indexed draw-list core and frame budget. |
| **1.8.38** | PR #68 | Calendar selection counter follows the selection. |
| **1.8.39** | PR #71 | Views are vector models (options, skin, tokens); the HTML view builders are gone ([views-vector-model.md](./views-vector-model.md)). |
| **1.8.40** | PR #72 | JRender wasm through wasm-opt. |
| **1.8.41** | PR #74 | Renderer fixes from Ash's review (budgeted work, off-canvas viewport). |
| **1.8.42** | PR #75 | Gradient paints and stroked paths ([jrender-paint-stroke.md](./jrender-paint-stroke.md)). |
| **1.8.43** | PR #77 | Fixes from Ash's review of 1.8.42 (gradient hover, bold gradient text, per-placement uniforms, long field names). |
| **1.8.44** | PR #78 | Budget is the default app; the Fish and Lumen apps are removed. |
| **1.8.45–1.8.61** | PRs #80–#92 | Recorded in [budget-direction.md](./budget-direction.md). |
| **1.8.62** | | Phone-first Budget journal, calendar-first entry, private auto-created data repo. |
| **1.8.63** | | Budget Home boot fix: typography constant `tapSz` no longer shadows `hit()`. |
| **1.8.64** | | Budget phone art fidelity: study tokens, Source Sans 3, calendar marks, drawn chevrons. Follow-up: Home/Today/Plan stack, compact plan list, ledger signs, flush mini-month, standalone calendar legend, compared on Mac Metal against the phone studies [MEAS]. |
| **1.8.65** | | Budget phone art fidelity, all screens: Home stack, centered calendar marks, remaining study states (cash entry, plan B/C, add-item, add-alternative, day path, plan-switch, debt, pay, schedule editor) compared on Mac Metal [MEAS]. |
| **1.8.66** | | Budget journal at every width: legacy three-column Home and Budget calendar/plan/timeline/board frames removed; cash/owned walker fixed; compared on Mac Chrome (Metal) at 1000×712 and 390×844 [MEAS]. |
| **1.8.68** | | Budget journal back is a drawn chevron plus Home/Plan text; long names never overlap; Add to <day> and add-alternative are reachable from Home; monthly expenses lists every income and expense and scrolls to the month total; Cash rows open the as-of day instead of Home; CSS pt equals design pt. Compared on Mac Safari/Chrome at 1000×712 and 390×844 [MEAS]. |
| **1.8.67** | | Budget Home uses a viewport-sized canvas (px height ≤ 8192) and the shared JRViews device, so a tall journal cannot black out Safari or the platform bar; compared on Mac Safari/Chrome at 1000×712 and 390×844 [MEAS]. |
| **1.8.69** | | Day schedule and full Plan are reachable from Home (second tap on the selected day, View <day> schedule, day heading, Plan heading). Form text overlays sit on the drawn field (sticky-canvas scroll, host offset, CSS pt, dpr, Safari). Pay date and activity date use the journal mini calendar; time is a real time field; Repeat, Every N, deductions, and every debt and activity field can be set and persist on Save. Compared on Mac Safari/Chrome at the real app size [MEAS]. |
| **1.8.71** | | Calendar-first and data-repo fixes: undated items open their edit page with the date picker; journal Change and Record what happened are saved per occurrence or this and future (Record used to save nothing); Specific dates each month is stored as `monthdays` so it repeats; pay from a calendar day is the take-home; old Board asset/debt/pay entries open the selected calendar day; no what-if path in Budget; no name-based cash fallback; the data repo is created private only once a repo name is committed, with no create button. Unit checks in Node [MOCK]; Chrome on Matthew's Mac [MEAS] where noted in the PR; Safari and iPhone [USER-HW][OPEN]. |
| **1.8.70** | | Home opens a day schedule only by a second tap on the selected mini-month day. Inline date pickers push following rows; Repeat option subrows reflow; times are 24-hour (HH:MM) in display and entry; Amount is a single label. Plan stays on Home, long step names wrap, and Back from a Home plan step's alternatives page returns to Home scrolled to that step. Date fields always show the long weekday label (Sunday, November 1), never raw YYYY-MM-DD. The day schedule lists every item in the same hour. New alternatives and new requirements include date, time, and repeat, and + Add requirement opens a journal form. Compared on Mac Safari/Chrome at a real 390×844 host [MEAS] [USER-HW]. |

The 9 Nov 2026 overlay packet is recorded in [design/overlay-view-store.md](./design/overlay-view-store.md). Shell 1.8.28 plays it as the Fish app. Shell 1.8.29 plays the Lumen page the same way.

1.8.10 through 1.8.21 are the procedural lighting passes. On 2026-11-08 Matthew directed that those passes be replaced by SVG drawings played by the state machine. The DesignCraft 0.18.0 packet was checked the same evening: the view draw list loads a cubic fill and rejects a gradient, and it has no cubic stroke. The record is `docs/design/authored-ui-packet.md`. 1.8.22 does not wire that packet. It adds the board and budget controls on the existing state machine. This is not a finished workflow.

### Current manifest (verbatim) [MEAS]

Shipped `main` tip at docs check for 1.8.3: `d8f6ccdc171b49385e0a738e7451714741f5dd99` (merge #26).  
**1.8.4** updates lean + `release.json` on this branch; Mac LIVE-GPU acceptance **[USER-HW][OPEN]**.

```json
"version": "1.8.31",
"file": "exp7-platform/exp7-platform-lean.html",
"sha256": "4308d9607060a0e32d5978a7cc8b321006d2d9d6ae1eb8e5babb6da94926a603",
"minLauncherMajor": 1
```

1.8.3 payload byte length: **1 868 344**. 1.8.4 ships packed JRDI + UX state washes inside lean (see `docs/api/IMAGE-ABI.md`, `docs/design/state-table.md`).

`contains.viewsModuleId`: `exp7-views@1`  
`contains.chromeJr`: PlatformChromeJR + JRDI circular avatar; bar/apps JRViews; Budget tabs in hostDoc.

## PR disposition (chrome / views era) [MEAS]

| PR | Theme | State |
|----|-------|-------|
| #1–#6 | 1.2–1.5 platform | Merged |
| #7 | 1.6.0 real views candidate | **Closed unmerged** (later work landed via other PRs) |
| #8–#9 | Docs / archives | Merged |
| #10–#11 | Budget HTML views | Merged |
| #12–#14 | Exp7Views pack / JRender boot | Merged (#12 closed; packed via #13) |
| #15–#19 | Budget parity + boot | Merged |
| #20 | Docs: one JRender everywhere | Merged |
| #21–#22 | mountSurface + platform bar JR | Merged |
| #23–#24 | Budget multi-board | Merged |
| #25 | 1.8.2 parallax chrome JRViews | Merged |
| #26 | 1.8.3 doubled-tabs / Plan / hit offset | Merged |

Open PRs at this docs check: re-verify with `gh pr list`.
