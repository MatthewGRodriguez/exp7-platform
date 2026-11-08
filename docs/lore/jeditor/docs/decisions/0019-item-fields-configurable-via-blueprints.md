# ADR 0019: JFactor item fields configurable via blueprints

> Superseded in part by ADRs 0051-0053 (M12): item fields are now first-class item types scored by item blueprints, with shared joys (0052).
Status: decided (2026-10-30)
Decision (Matthew: "editor configurable through blueprints like how the model tab was in ranking ui"): beyond JFactor's blueprint step fields, an item's fields are not fixed by JEditor. They are defined in the editor by a blueprint, the way ranking_ui's MODEL TOOLS tab let the user author factor models and jmethods.
Reference behavior (ranking_ui, read-only):
- Per dimension: `modelToolsEnsureFactorModel(dim)` → `WB.modelTools.factorModels[dim] = {kind, jmethod}`. `MT_FACTOR_KINDS` are rank_share, calendar_days, calendar_hours, money_values, debt_urgency, surplus and curve (jmethod). Defaults come from `MT_FACTOR_KIND_DEFAULTS`, and suggestions from `MT_FACTOR_JM_SUGGEST`.
- jmethod drafts (`modelToolsJmEmptyDraft`, `...DraftFromBuiltin`, `...DraftFromStored`, `modelToolsJmNewDraft`) hold a `script` node graph `{version, nodes, edges}`, with `score.out` and `view.out` sinks plus math, scoreMode and xMax/yMax.
- vendor/model_tools_script.js (`ModelToolsScript`) types the ports (`portTypeOf`, `canConnect`). `compile(graph)` produces a score fn and requires `score.out`, and `compileView` produces the view. Node families include data.*, mech.*, econ.*, jfactor.* and `board.emit` (`collectBoardEmits` emits item specs to the Board).
- Saved graphs live in `WB.modelTools.jmethods` (source of truth), with packs as libraries (`modelToolsBuiltinBlueprint`, `packGraph('builtins', id)`). `modelToolsHydrateJmethods` registers them via `RunJMethods.register`. Undo/redo is provided by `mtJmPushUndo`, `mtJmUndo` and `mtJmRedo`.
Consequence: the level stores item-type blueprints (field schema + scorer graph) in the `jfactor` block. Items are instances of them. See docs/design/06 (proposal).
