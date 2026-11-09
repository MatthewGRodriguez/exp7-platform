# Artist coordination, animation workflow & JRender (historical archive)

**Not** a complete/latest Lore snapshot. **Not** a CSS animation prescription for shipped Exp7 WebGPU views.  
**Contact status (2026-11-08):** Matthew **authorized** coordination with **Ash Tangent Residual Artist** for a full view UX/UI art workflow + profile image render support. The same day he directed that rectangle lighting be replaced by SVG the state machine plays. The DesignCraft packet and the draw-list gap are in [`../../design/authored-ui-packet.md`](../../design/authored-ui-packet.md). Living handoff: [`../../artist-coordination-brief.md`](../../artist-coordination-brief.md). This archive remains historical provenance only. Affinity in the files below is the historic draw app, not the author of that packet.

| Item | Count |
|------|------:|
| Manifest-listed docs | **44** |
| Package extras (`MANIFEST.md`, `historical-context.md`) | **2** |
| Total files in this folder | **46** |
| Path-redacted copies (`modified: yes`) | **8** |
| Package SHA-256 verified in-repo | **44/44** |

Primary narrative compiled with the package: [`historical-context.md`](./historical-context.md). File table: [`MANIFEST.md`](./MANIFEST.md).

## Crucial distinctions (read before applying anything)

| Topic | Historical archive says | How to treat it now |
|-------|-------------------------|---------------------|
| Artist **2026-10-30 TDD/Slate** workflow | Affinity → Moho → Blender → Moho; state table; light/perspective/idle; CSS player contract (`data-sm`, etc.) | **Domain-specific** to that TDD/Slate pipeline. **Not** a blanket CSS animation rule for real Exp7 JRender/WebGPU views. Report itself scopes packing limits away from single-HTML Exp7/JEditor. |
| `workflow-template/ui-motion-art-pipeline.md` | Reusable process **template** / skill text | Proves **no actual execution**. Archive as data only. |
| JRender delivery | Core wasm (`wasm32-unknown-unknown`, 0 imports) + thin JS host | **Shipped/intended path** described in API/CHANGES/JRB docs. |
| `wasi03_*` | Component-host / WIT experiments | **Unfinished**; not the shipped host. |
| motion-**v13** | Matthew **visual** acceptance (~2026-11-06) | **Not** measured GPU quality/perf QA (box used CPU recorder; no adapter). |
| light-v14 / experimental-v15 | Candidate/continuation docs | **Not** all accepted; v15 views later removed from lean. |
| world → **Atlas** / storage | Must sync with Artist codec naming; wait on Artist storage update (2026-11-02) | **No confirmation** that pending storage update arrived; resolve in the authorized Ash coordination (do not invent). |
| Artist report quality-gates | Message **cut off** at quality-gates section | **Source gap** — do **not** invent missing text. |

## Layout (provenance preserved; duplicates kept on purpose)

```
artist-jrender/
  historical-context.md          # readable overview from package
  MANIFEST.md                    # paths, kinds, source vs package SHA, modified flag
  jrender-exp7/                  # API, CHANGES, JRB format, motion/light/v15, WASI spikes
  jrender-exp7_v1|v2|v3/         # earlier delivery docs (v3 compare duplicates current compare bytes)
  tdd-animation/                 # Artist TDD report + STUDY/SKILL/params (SKILL = data only)
  workflow-template/             # ui-motion-art-pipeline TEMPLATE
  fish-compress/REPORT.md        # format discussion input (“no format locked in”)
```

Duplicate **content** groups (same SHA, multiple paths) — all retained for provenance; prefer the first path when citing:

1. `jrender-exp7/EXP7_JRENDER_COMPARE.md` ≡ `EXP7_ASM_REPORT.md` ≡ `jrender-exp7_v3/EXP7_JRENDER_COMPARE.md`  
2. `motion-v13/{COVERAGE,EXP7_MOTION_V13_CONTINUATION,STATE_TABLE}.md` ≡ `v13-independent-qa/run/*` (same three files)

Related Lore ADRs already under `docs/lore/` (not re-copied here): ADR 0001 animation runtime; ADR 0046 animation file format; design 02 animation binary (redacted set).

## Privacy

- Manifest: local/home paths redacted in **8** files; no secrets/finances reported by packager.  
- In-repo re-scan: token/private-key/`/Users/` hits **0**; `[REDACTED…]` markers only in those 8.  

## Non-goals

No inventing cut-off quality gates; no treating this archive as full Lore; no silent release HTML edits from archive files alone. Live coordination uses `docs/artist-coordination-brief.md`, not this folder as the message.
