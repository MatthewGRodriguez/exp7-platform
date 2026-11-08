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
| **1.8.13** | this branch | Free controls lift. Days and rows keep a contact shadow in the gap. |

### Current manifest (verbatim) [MEAS]

Shipped `main` tip at docs check for 1.8.3: `d8f6ccdc171b49385e0a738e7451714741f5dd99` (merge #26).  
**1.8.4** updates lean + `release.json` on this branch; Mac LIVE-GPU acceptance **[USER-HW][OPEN]**.

```json
"version": "1.8.13",
"file": "exp7-platform/exp7-platform-lean.html",
"sha256": "5a0c9a51b75ce9fea2218355e3c82b28df1f47286fd75fc75a56da998f46e898",
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
