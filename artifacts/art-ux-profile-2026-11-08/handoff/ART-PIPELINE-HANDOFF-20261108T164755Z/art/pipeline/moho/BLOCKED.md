# Moho stage — BLOCKED on observed Mac probe (2026-11-08)

## Observed

| Probe | Command form used | Result |
|-------|-------------------|--------|
| SmokeQuit | `Moho SmokeQuit.lua` | **exit 139** (SIGSEGV) in ~seconds, empty logs |
| CreateExp7ArtComparison | `Moho CreateExp7ArtComparison.lua` | **exit 139**, no `.moho` created |

No DiagnosticReport. Animate/Render steps not run. **No evidence this is licensing/first-launch** — only SIGSEGV on bare script argv.

## Documented invocation (Lost Marble / Moho 14.x forum + 14.2 notes) — NOT yet proven on this Mac

Do **not** treat these as completed. They are the researched replacements for the failing bare `Moho script.lua` form:

1. **CLI render** (FAQ / Appendix G style; still cited for 14.3):
   ```bash
   /Applications/Moho.app/Contents/MacOS/Moho \
     -r "/ABS/path/to/seed.moho" \
     -f png \
     -outfolder "/ABS/path/out" \
     -start 1 -end 1 \
     -v
   ```

2. **Startup command-line script** (Moho 14.2+: fully qualified paths to BOTH document and script):
   ```bash
   /Applications/Moho.app/Contents/MacOS/Moho \
     "/ABS/path/art/pipeline/moho/seed/JWorkbook_chrome.moho" \
     "/ABS/path/art/pipeline/moho/scripts/SmokeQuit.lua"
   ```

3. Bundled examples (on Mac install, if present):
   `Moho.app/Contents/Resources/Support/Pro/Extra Files/Optional Scripts/Command Line Scripts`

## Explicit non-claims

- We do **not** recommend GUI activation as a workaround without evidence.
- We do **not** fabricate Moho PNG/GIF output.
- Seed `seed/JWorkbook_chrome.moho` remains a real archived document for when a non-crashing CLI form is confirmed.
- Stage status for Exp7 art pass: **BLOCKED** until a documented form exits 0 with logs on Matthew's Moho 14.3.
