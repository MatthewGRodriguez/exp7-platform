# Moho handoff (honest)

## What is real

| Artifact | Provenance |
|----------|------------|
| `seed/JWorkbook_chrome.moho` | Byte copy of archived living-core Moho 14.3 project (`docs/archives/.../JWorkbook_chrome.moho`). Zip of `Project.mohoproj` JSON (`mime_type: application/x-vnd.lm_mohodoc`). **Not fabricated.** |
| `scripts/SmokeQuit.lua` | Historical living-core smoke |
| `scripts/RenderPreview.lua` | Historical FileRender probe pattern |
| `scripts/CreateExp7ArtComparison.lua` | New scaffold using same MohoScript APIs (`FileNew`, `CreateNewLayer`, `FileSaveAs`, `Quit`) |
| `scripts/AnimateExp7States.lua` | New provisional keys from state-table lifts |
| `scripts/RenderExp7Preview.lua` | New FileRender probe for comparison doc |

## What is NOT claimed

- Moho CLI `-h` / help (inventory: no text within 20s) — **BLOCKED**
- Any completed Moho PNG/GIF from this cloud agent — **not run**
- Side-by-side flat-vs-new GIFs — **BLOCKED** until FileRender probe succeeds on Mac
- Fabricated `.moho` binary authored by guessing JSON fields — **not done**; comparison file is created **by Moho itself** via Lua on Mac

## First probe order

See `art/pipeline/mac/MAC_RUNBOOK.md` sections Moho A–E.
