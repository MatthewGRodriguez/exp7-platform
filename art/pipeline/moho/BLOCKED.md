# Moho stage — VERIFIED CLI (Mac 14.3, 2026-11-08) + remaining probes

## Verified on Matthew Mac (Moho 14.3)

| Form | Command | Result |
|------|---------|--------|
| **A — document + script (canonical)** | `/Applications/Moho.app/Contents/MacOS/Moho <abs seed.moho> <abs SmokeQuit.lua>` | **rc=0**, stderr `SMOKE_OK` |
| **B — CLI render** | `/Applications/Moho.app/Contents/MacOS/Moho -r <abs seed> -f png -outfolder <dir> -start 1 -end 1 -v` | **rc=0**, writes `seed_00001.png` |
| Bare `Moho script.lua` | (no document) | **exit 139** SIGSEGV — **wrong argv**, not licensing/first-launch |

Bundled Optional Scripts / Command Line Scripts document form A. Put **document path first**.

## Still open (not yet run on Mac as of this handoff)

- `CreateExp7ArtComparison.lua` → comparison `.moho`
- `AnimateExp7States.lua` (provisional keys)
- `RenderExp7Preview.lua` / FileRender side-by-side GIF

These are **PROBE-READY** with form A (seed or comparison doc + script). Do not use bare Lua.

## Explicit non-claims

- Moho `-h` still unproven as help text.
- No fabricated Moho PNG/GIF in-repo beyond what Mac CLI wrote under ArtScratch.
- Seed `seed/JWorkbook_chrome.moho` sha must remain unchanged unless Moho rewrites it.
