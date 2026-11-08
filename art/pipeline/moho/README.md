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

## Observed Mac fail (2026-11-08)

`Moho SmokeQuit.lua` and `Moho CreateExp7ArtComparison.lua` (bare script argv) both **exit 139** (SIGSEGV) with empty logs. No `.moho` created. **No evidence this is licensing/first-launch.**

Stage status: **BLOCKED** — see `BLOCKED.md`.

## Documented CLI forms to try next (not yet proven on this Mac)

Lost Marble Moho 14.x FAQ / forum + 14.2 startup-script notes. Use absolute paths. Success = exit 0 + logs/PNG only:

```bash
# A) Document + script (Moho 14.2+ startup command-line script)
/Applications/Moho.app/Contents/MacOS/Moho \
  "/ABS/.../seed/JWorkbook_chrome.moho" \
  "/ABS/.../scripts/SmokeQuit.lua"

# B) CLI render one frame
/Applications/Moho.app/Contents/MacOS/Moho \
  -r "/ABS/.../seed/JWorkbook_chrome.moho" \
  -f png -outfolder "/ABS/.../out" -start 1 -end 1 -v
```

Do **not** treat GUI activation as a verified substitute without evidence.

## What is NOT claimed

- Moho CLI `-h` / help — **BLOCKED** (inventory: no text within 20s)
- Any completed Moho PNG/GIF from this cloud agent — **not run**
- Side-by-side flat-vs-new GIFs — **BLOCKED** until a non-crashing CLI form is confirmed
- Fabricated `.moho` binary — **not done**

## Probe order

See `art/pipeline/mac/MAC_RUNBOOK.md` Moho section + `BLOCKED.md`.
