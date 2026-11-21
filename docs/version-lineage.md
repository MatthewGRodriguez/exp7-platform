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
| **1.8.74** | | Budget phone layout (section 1): journal fills the phone width, inline month picker, legend, schedule page, field and form fixes, alternatives tied to the real item, live stacked switch review. |
| **1.8.76** | | Budget: Clear data button (account menu, Budget data) clears Budget's local data and the sealed copy in the data repo after a confirmation; other Exp7 apps untouched. |
| **1.8.77** | | Design system phase 1: fail, tokens, bounds and components scripts; Budget Home on components with the same layout as 1.8.76 (a few labels sit up to 2.3 px higher); text measured by JRender only, no substitute font. Tests in exp7-jrender `tests/`. |
| **1.8.78** | | Fuller journal font: Source Sans 3 Regular and Semibold with Latin-1, Latin Extended-A and more (687 characters, was 120), so accented names draw on Home. Same layout as 1.8.77 for text without accents. Licence text embedded; see `docs/fonts.md`. |
| **1.8.79** | | Design system phase 2: every Budget screen on components in a failure context; every action rolls back when its screen can't be laid out; `paintScreen`, `flowShift` and the static study screens removed. Tests in exp7-jrender `tests/` (screens, rollback, journeys). |
| **1.8.80** | | Design system phase 3: `design-art` (art packs, the validator, swaps for an app, a screen or one item) and Budget's first art pack, compiled from SVG and embedded; every component draws through its art slots and hovers from its art; the glyph and mark drawing code removed. Draw lists byte for byte as 1.8.79. Tests in exp7-jrender `tests/layer-art.mjs`. |
| **1.8.83** | | Design system phase 4, part 3: the journal's plan, ledger and cash views on components (`ViewHead`, `DateBand`, `Label`, `MoneyRow`, `TotalRow`) and art; Home's focus ring is `FocusFrame` art in a failure context; journal-views' hand layout, colour and glyph tables and Home's unreachable picker and date menus removed. Same as 1.8.82 except text that was cut off now wraps. Tests in exp7-jrender `tests/layer4-journal.mjs`. |
| **1.8.84** | | Design system phase 4, part 4a: the Exp7 demo's frame (header, tabs, diagnostics), Atlas, Proposal console, About and path inspectors on canvas (`Exp7DemoUI`, Exp7VM models with the platform's view tokens and `exp7-views` art); `Exp7VM` gains text runs, code text, multiline and filling fields, notes, warn tones, table button cells and tappable panels; the demo's Budget mode, codec estimates, clipboard fallback and try and catch around renders removed. Budget unchanged. Tests in exp7-jrender `tests/layer4-demo.mjs`. Parts 4b (Two writers, Storage, Circuit) and 4c (Paths, view side panels) to come. |
| **1.8.85** | | Design system phase 4, part 4b: the Exp7 demo's Two writers (collaboration card, controls, both writers, merge order, diff, inspector, replica views), Storage (batch log, 5000-op test, per-path statistics) and Circuit (rule source, rules, event arguments, results, canonical print, scores) on canvas; engine refusals recorded in `Exp7Fail`; `Exp7VM`'s multiline fields grow to the lines their text wraps to; a new demo tab opens at its top; the lean's Doc and Panel helper script (`Exp7Experiments`), the collaboration DOM script and `renderSync`, `renderLog`, `renderScores`, `renderSyncDiff`, `renderPathStats` and `renderInspector` removed. Budget unchanged. Tests in exp7-jrender `tests/layer4-demo.mjs`. Part 4c (Paths, view side panels) to come. |
| **1.8.86** | | Design system phase 4, part 4c: the Exp7 demo's Paths (the whole atlas as a tree or a flat list, prefix and search, copy, the last proposal's tones) and the Calendar, Board and Plan tabs' panels (status, proposals, discrepancies, ranking and history, steps, what-if, dependencies, deep paths) on canvas, each view above its panels; every demo tab is canvas; path rows are path, value and copy with type and owner under; `Exp7VM`'s squeezed tables keep their buttons whole; the views host's `jvStatus`, `discHTML`, `planSide` and `vbtns`, `renderPaths`, `refreshPaths`, the HTML sections and their styles removed. Budget unchanged. Tests in exp7-jrender `tests/layer4-demo.mjs`. |
| **1.8.87** | | One font for measuring and drawing: every text item names the font it was measured in and is drawn in it; view, journal and chrome tokens name their fonts (`font`, `fontStrong`); a font a token names that is not embedded fails with `FONT_MISSING`, a character a font lacks with `GLYPH_MISSING`. The views' marks (← → ▸ ▾ ✓ ✗ ★ ☆ ⚠ ⟳ ● ○) are the new `Mark` component's art in both packs, drawn in the tone of their text. A bold label wider than its room shrinks to fit on one line. DejaVu Sans gains Latin Extended-A; all four fonts gain a blank U+FFFC. Removed: the core's font `try`/`catch`es, `window.__jrJournalFonts`, the drawing code's default fonts, `JRViews.font()` and `fontBold()`, the demo's own glyph walk. Tests in exp7-jrender `tests/layer4-views.mjs`, `layer4-chrome.mjs`, `layer4-demo.mjs`. |
| **1.8.88** | | Design system phase 5, first part: the `design-app` script (`Exp7Apps`: `define`, `open`, `get`, `route`) and the failure code `APP_INVALID`; Budget defined as its atlas (make, load, check), its journal and views token sets, the `budget-journal` pack and its 23 routes, opened once at load and checked whole; Home, the screens, the views and the journal fonts read the opened app's tokens; Budget's page boots through the app and fails its boot on an atlas that fails Budget's check. Removed from Budget's page: `RISK_COL`, `DEFAULT_THEME`, `DEFAULT_CRIT_STATES`, `applyDefaultViewStyling`, the chrome-mode timers and `jr-chrome` class, `surface` and `handles`, the `try`/`catch`es, the unreadable-proposals fallback and the `.jrerr` style; from Home, the DOM error box (a failed update is recorded and keeps the last frame). A view's `theme` is dropped from Budget's atlas when made or loaded. Nothing changes on screen. Tests in exp7-jrender `tests/layer5-app.mjs`. |
| **1.8.89** | | Design system phase 5, second part: the field being typed in is a JRender `TextField` on the new `LiveField` component (art in Budget's pack, slot `live.box`), styled by `Exp7Components.liveStyle` from Budget's tokens with the new colour token `selection`; `screenLayout` takes `live` (the open field's act) and lays the `LiveField` over its target; Home keeps the open field as state (`live`, carried by its snapshot and rollback) with `commitField` (Enter) and `cancelField` (Escape). Removed: the page input and its styles, `overlayRect`, `overlayCorrection`, `fieldLayoutRect`, `fieldCanvasRect`, `placeFieldEl`, `window.__budgetFieldOverlay`. Tests in exp7-jrender `tests/layer2-screens.mjs`, `layer5-journeys.mjs`, `layer3-rollback.mjs`, `layer1-static.mjs`. |
| **1.8.90** | | Design system phase 5, third part: every art state drawn live. `Exp7Art.draw` draws a node's rest state (`n.rest`, set by `MiniMonth`, `Choice`, `Toggle`, `PrimaryBand`, `TimePicker` and `HourRow`; a rest the component lacks fails with `COMPONENT_INVALID`); new `Exp7Art.look`, `looks` and `live`; `place` and the views' `hovers` keep `n.looks`; Home draws pressed, hover, focus or the rest with `pointer`, `artState`, `itemsOf` and `drawState`. Removed: Home's `hovItems`. Tests in exp7-jrender `tests/layer5-states.mjs` (new `states` layer) and `layer1-static.mjs`. |
| **1.8.91** | | Design system phase 5, fourth part: pressed in the Calendar, Board and Plan views. `design-views` declares `pressed` on every view component; the `exp7-views` and `budget-journal` packs write it (alias of hover, or of idle where a piece has no hover). JRViews draws a node's state from `n.looks` (`setDown`, `artState`, `itemsOf`); the views' `hovers`, `place` and the chrome keep only `n.looks` (and `n.pose`); the runtime's state layer only moves a design node. Removed: JRViews' `hovItems`, `Exp7Art.hover`, the chrome's `base`, `hov`, `press`, `uxBorderAt` and `baseBorder`. Tests in exp7-jrender `layer4-views.mjs`, `layer4-chrome.mjs` and `layer1-static.mjs`. |
| **1.8.92** | | Design system phase 5, fifth part: Budget's own code stops swallowing errors. `budget-flows`: `V.cmp.before` is a `clone` of the plan (no `JSON.parse` in a try), `refreshAll` and `dayLabel` lose their try and catch. `journal-views`: `model` without try/finally, `maxTexPx` returns `gc.dev.limits.maxTextureDimension2D` (no 8192), `cssDpr` without try, `BF.acceptChoice` called directly, a rejected `submitViews` on accept says it was not saved and rethrows, `host.scrollTo` called directly. 8 try sites that read saved records are left. |
| **1.8.93** | | Design system phase 5, sixth part: `budget-rules` without `||` defaults. `takeHome` leaves out a deduction with no name, kind or amount and gives no gross of 0; `repeatLabel` returns `null` for a schedule missing its date, repeat or what the repeat needs, or with an unknown repeat, and `budget-flows`' three callers show no label; `r2` keeps a missing number missing; `debtBalanceOn` returns `NaN` with no balance. `refreshAll` runs each view's redraw and Home's as its own promise; `model` calls `buildModel(V,S,O)` instead of swapping `V.opts`. |
| **1.8.94** | | Design system phase 5, seventh part: strict fail and carry on. `Exp7Apps.open` keeps an app closed only for a definition not in the shape of its four parts; each token set, the pack, the blank atlas check, each route, alias, screen component and layout fails alone in `app.open:<app>:<part>` and is left out. New `Exp7Apps.tokens(app, group)` (`TOKEN_MISSING`), read by Home, the screens, the views and the journal's fonts. `Exp7Art.load` leaves out a bad piece (`art.load:<pack>:<i>`), `assign` records each gap alone and assigns the pack, `draw` fails alone (`art.draw:<app>:<component>/<slot>`) and draws nothing. Budget's atlas `check` records each missing part alone (`budget.atlas:<part>`) and carries on. Budget's atlas `load` drops `budgetHeal` and `budgetMigrateSelection` (no board rebuilt, no membership put back, no Budget mark or selection model filled in); views-host's selection never takes a Budget item's `pref`, `state.pick` or `simPick`. |
| **1.8.95** | | Design system phase 5, eighth part: `budget-flows` without invented values. New `calIdOf`, `planIdOf` and `calItems`: a missing `meta.calId` or `meta.planId` stays missing and its calendar or plan writes and reads are left out (no `budget`, `reqs`); copied `type`, `flow`, `category`, `repeat` and `every` only when there; `resilience` returns no notes without `hc`, `hm` and `delay`; a non-number charge is left out of a sum; `applyOpsTo` leaves out a write with no `op`; recording needs an outcome and a new schedule a repeat; form starting values (`rep`, `outcome`, `every`, a new pay's `Pay`) set at open, the Calendar's Add item with `rep:'days'` in `views-host`. Layer 1 checks. |
| **1.8.97** | | The Exp7 circuit language v1, with failure built in as in Verse's `<decides>` (`docs/circuit-language.md`): failable steps, failure contexts checked at load, rollback, each declaration and each rule failing alone. Rust compiled to WebAssembly (`exp7-jrender/rust/lang`), embedded as `circuit-wasm`; the host `circuit-lang` defines `Exp7Lang` (`check`, `load`, `fire`, `score`, `apply`); `Exp7Fail` gains `CIRCUIT_INVALID` and `CIRCUIT_FAILED`. Nothing on screen changes; the demo's Circuit tab still runs v0. |
| **1.8.98** | | Design system phase 5, ninth part: `budget-flows` without `||` defaults (173 guards). New readers `rd`, `ls`, `str`, `opt` over frozen `NONE` and `NO_LIST`; accumulators (`by[d]`, `need[j]`, `p.reviews`, `p1.reviews`, `V.alt2.open`) started explicitly; `F.dedN` read as set at open; `applyOpsTo` starts `rev` at 1; `catIndex` keys on `w.rev` as it is; `hm` reads a time without minutes as on the hour. Layer 1 lints the whole script. |
| **1.8.99** | | Design system phase 5, tenth part: `journal-views` makes up no values. `saveJournal` asks for a missing name or amount (`NEEDS_AMOUNT` forms) and says why a debt schedule or pay deductions fail; no 'New item', 'Pay', 'Creditor', 'Debt', 'Scheduled item', 'New alternative' or 'New requirement' names, no 36/30/14 counts; `journalRepeat` leaves out every-N with no N; `journalRepeatDraft` shows none picked for no repeat; `journalCalId` reads `meta.calId` or gives null; boards from `meta.boardIds` only; `parseMoney` gives NaN and `fmtMoney` shows '' for it; all 8 `try` blocks removed; `payDraft` removed; `rev` starts at 1. |
| **1.8.100** | | Design system phase 5, eleventh part: Budget's part of `views-host` makes up no values. `budgetRiskHT` and its defaults are gone; `planRisk` reads `meta.riskHT` and shows no day risk without it (Home then leaves out the colour legend), and `budgetAtlasMake` writes `riskHT {hc:500, hm:1500, big:200, delay:3}`. `budgetDayRisk` reads only `meta.boardIds`, `meta.planId` and `meta.calId`, counts no amount that is not a number and always returns `BudgetFlows.resilience` (the unreached colouring is gone); `budgetFigures`, the old add form, `boardIdForRef`, `syncCalPlanOps` and `finBoard` use only the boards meta names; `budgetAmount` returns NaN with no amount or cost, and the journal's ledger and cash rows leave such items out; Budget's `selectedRef` has no `avail[0]` and no `try`; `budgetBoardId` gives no board for an unknown type; `finOpen` keeps an existing item's kind, as-of, start and purpose, or none. Version named 1.8.100; rename it if you'd rather. |
| **1.8.101** | | Design system phase 5, twelfth part: `journal-views` without `||` defaults (187 empty guards, 23 made-up values). New readers `rd`, `ls`, `str` over frozen `NONE`/`NO_LIST`; `window.__budgetUi` read as the Budget app started it; Home starts on route `'home'` and `show` takes the caller's route; `ded:kind` for a missing deduction, a nameless requirement and a board added with no value are left out; an alternative copies `type` only when there; a requirement's repeat only when picked; ledger rows sort by `byDate` (undated last); `hostCssSize` and `viewMetrics` use the page's sizes and the device's limit. views-host's `budgetChromeVM` names the date picker anchor. |
| **1.8.102** | | Design system phase 5, thirteenth part: Budget's own functions in `views-host` (`budgetDayRisk`, `budgetFigures`, the date keys, `budgetItemOnView`, `budgetAmount`, `budgetValueParts`, `budgetChromeVM`) and `planRisk`'s Budget branch without `||` defaults (40). New readers `budgetRd`, `budgetLs`, `budgetStr`; `window.__budgetUi` read as the Budget app started it; no amount-only stand-in for `JAtlasEval.charges` or `occurrences`; a charge that is not a number is left out of the month's figures. `journal-views`: Dismiss under Home's date picker closes it (it went to no handler). |
| **1.8.82** | | Design system phase 4, part 2: `design-chrome` (TopBar, ChromeButton, Avatar, AppsPanel, AppCard) and `Exp7Chrome.layout`; the top bar and Apps picker draw from the `exp7-chrome` art pack with `Exp7Tokens.chrome`; `PlatformChromeJR` builds models, not HTML, and its fallbacks are removed. Same draw lists as 1.8.80 except a selected card's resting fill after hover. Tests in exp7-jrender `tests/layer4-chrome.mjs`. |
| **1.8.81** | | Design system phase 4, part 1: `design-views` (the view components) and view token sets; the Calendar, Board and Plan views draw every visual from art (`exp7-views` pack for the platform look, `budget-journal` view pieces for Budget's); stock and journal skins, default view tokens and the views' error page removed. Views byte for byte as 1.8.80. Tests in exp7-jrender `tests/layer4-views.mjs`. TopBar and Apps picker are part 2. JRender from exp7-jrender #8 (GPU group transforms, `wrap()` baselines; wasm 292,569 B), unused so far. |
| **1.8.75** | | Budget fix: Accept on the switch review really switches the plan and saves the requirement answers (Reuse makes the copy); answers no longer carry over to the next alternative; after a switch, the next review lists the requirements of the choice in use. |
| **1.8.73** | | Fix: Home could not be scrolled after opening a plan step and going back, because the return-to-step scroll was re-applied on every scroll event. It now runs once and ends at the first user input or after about a second. |
| **1.8.72** | | Fix: Budget Home stopped with *seeded.map is not a function* on Requirements for a new alternative, because an item's `jreq` is a single reference string. Seeding now accepts a reference, a list, a group or a record. |
| **1.8.71** | | Calendar-first and data-repo fixes: undated items open their edit page with the date picker; journal Change and Record what happened are saved per occurrence or this and future (Record used to save nothing); Specific dates each month is stored as `monthdays` so it repeats; pay from a calendar day is the take-home; old Board asset/debt/pay entries open the selected calendar day; no what-if path in Budget; no name-based cash fallback; the data repo is created private only once a repo name is committed, with no create button. Unit checks in Node [MOCK]; Chrome on Matthew's Mac [MEAS] where noted in the PR; Safari and iPhone [USER-HW][OPEN]. Testing in Chrome also fixed: a tapped entry opened the sample item page; the first tap on Save while a field was open was lost; day rows showed the raw repeat kind and the usual (not recorded) amount; calendar amounts were split across a month's dates; a newly dated item did not join the calendar. |
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
