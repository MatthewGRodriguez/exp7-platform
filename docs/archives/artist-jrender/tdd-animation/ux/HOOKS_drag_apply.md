# HOOKS for UX1 (drag / apply-to-shifts / select) - for Ash

Written against **fetch3d** (td.js 086245be, td.css 95222ab5), src/app/27i_fetch2.js.
This lists **only what is missing**. Everything else UX1 needs is already exported, and UX1 uses it as-is:
`TrainingDays.fetch2.{apSibs, apWhole, apItem, ddMove}`, `TrainingDays.{selectedDay, selectedPlan, renderAll,
buildDaySchedule, dayScheduleWindow, ensureBlocks}`, the `#ai-apply` panel DOM, `.ds-h`, and `data-ai/-lane/-start/-end/-hours`.

UX1 is the motion/interaction layer (anim block after HD2/PL1/TG4/GL4, STONE last). It never mutates state itself. Every
commit goes through these hooks. The reference implementation is `ux/harness/mock_hooks.js` (HARNESS MOCK, not shipped). It is
built only from the existing exports, so it doubles as a test oracle.

All hooks go on `TrainingDays.fetch2`. Times are decimal hours on the plan's own clock (`9.25` = 09:15). A shift that crosses
midnight continues past 24, same as `dayScheduleWindow`.

## 1. ddPlan(planId, j, t) -> {ok, why, t, push}  (NEW, pure, no mutation)
Dry-run of a drag of agenda item `j` to start time `t`. UX1 calls it on every snapped 15-min step while dragging, about 1-4
times per second of pointer travel, never per frame. It must therefore stay cheap: one plan, no renderAll.
- `t` is clamped to the window and snapped to 15 min. The returned `t` is the value actually used.
- `ok:0, why:"Overlaps Lunch"` when `[t, t+hours)` hits a fixed block (lunch / roll call / walk / PT / shift blocks, both lanes).
  `why` is shown verbatim in the refuse chip, so keep it short, ASCII, and in sentence case.
- `push: [[k, newStart], ...]` lists the other timed items that must move so the drop fits: later items slide down in order,
  earlier items slide up, and each one jumps past fixed blocks.
  `ok:0, why:"No room before 15:00"` / `"No room after 07:00"` when they run off the window.
- UX1 animates the neighbours to `push` (translateY only). Nothing is written.

## 2. ddMoveTo(planId, j, t) -> {ok, j} | {ok:0, why}  (NEW, commit)
Commits exactly what `ddPlan` returned for the same args: it applies `push`, then today's `ddMove(p, j, p, t)` (fixed time,
renderAll, say).
- Today's `ddMove` drops the item at a fixed time and leaves overlaps behind. UX1 falls back to it when `ddMoveTo` is
  missing, but then neighbours do not slide.
- Must be synchronous and must call renderAll once. UX1 runs its 260 ms settle (FLIP) after the render, so the click/drop is
  never delayed.

## 3. apPreview(planId, ids, what, mode, f) -> [{id, shift, before, after, conflicts}]  (NEW, pure)
Non-mutating preview of today's apply-to-other-shifts.
- Same args as the `#ai-apply` panel: `ids` = checked `[data-apply-plan]`, `what` = `"all"` or an item index string,
  `mode` = `#ai-apply-mode` value, `f` = `{time, task, rule}` from `[data-apply-f]`.
- Run `apWhole` / `apItem` on a deep clone of each sibling, after `ensureBlocks`.
- `before` / `after`: `[[name, start, end, isFixed], ...]` for timed items.
- `conflicts`: `[{name, msg}]`, for example `{name:"Shop safety brief", msg:"overlaps Lunch"}`. UX1 shows them in the existing
  caution style (`.ld-flag` with `#i-crit`).
- Keep the default **different items per shift**. UX1 labels the item that actually changes in each shift, which may differ
  from the dragged one.
- UX1 falls back to doing the clone itself with `apWhole` / `apItem` when this hook is missing, but then it shows no
  conflicts.

## 4. apRun(planId, ids, what, mode, f) -> {n}  and  apUndo() -> 1|0  (EXPORT WITH ARGS)
`apRun` / `apUndo` already exist inside 27i_fetch2.js but read the panel DOM and are not exported.
- Export them so they take the same args as `apPreview`, apply to the listed sibling ids, keep the existing single-step Undo
  snapshot, and call renderAll once.
- Budget: <= 100 ms at 1M rows. The harness mock measures 13 ms sync on the demo data.
- UX1's "Apply to N shifts" dock (after a drag) and the panel's Apply button both call `apRun`. The staggered ripple runs
  after it returns.

## 5. (optional) dispatch `td:render` on document after renderAll
UX1 currently re-attaches selection and preview through one rAF-debounced MutationObserver on `body`. An event would let
it drop the observer. Not required.

## Not needed as hooks (handled in UX1)
- **Escape cancel:** UX1 owns the drag (window-capture pointer listeners, ahead of fetch2's document-capture ones). Escape,
  pointercancel and Tab glide the ghost back and commit nothing. The existing `.ds-h` Escape / ArrowUp / ArrowDown stay as
  they are for anyone not using UX1.
- **Highlight across the schedule:** pure DOM/CSS from `data-ai`, `data-lane`, `title`, `.day-sched-lanes b`,
  `.day-sched-tick`, and `#top-agenda li .pw`.

## Behaviour change to sign off
A single click on a block (or on an `#top-agenda` row) now **selects and highlights** instead of opening the editor.
Open = the pill's **Open** button, a double-click, or Enter on the selected block. These all go through today's
`ddClick` -> `ddOpen` via a pass-through click, so the editor itself is unchanged.
