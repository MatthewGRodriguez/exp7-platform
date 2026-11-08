# ADR 0023: Blueprint packs shared across levels
Status: decided (2026-10-30)
Decision (Matthew: "packs ok"): item-type blueprints can be shared across levels as packs, like ranking_ui MODEL TOOLS `builtins` (`packGraph('builtins', id)`, `modelToolsBuiltinBlueprint`). A level always embeds a copy of each pack it uses, so the saved HTML stays self-contained. Format, import/export and versioning are proposals in docs/design/06.
