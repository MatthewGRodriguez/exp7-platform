# Moho handoff

## Verified (document path first)

```bash
MOHO=/Applications/Moho.app/Contents/MacOS/Moho
SEED="$(pwd)/art/pipeline/moho/seed/JWorkbook_chrome.moho"
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/SmokeQuit.lua"   # SMOKE_OK
"$MOHO" -r "$SEED" -f png -outfolder /tmp/moho-probe -start 1 -end 1 -v
```

## Comparison with real shapes

```bash
export EXP7_ART_SCRATCH=/Users/user-rodri/ArtScratch/exp7-art
"$MOHO" "$SEED" "$(pwd)/art/pipeline/moho/scripts/CreateExp7ArtComparison.lua"
# stderr must show shapes=N>0 per layer — empty = FAIL
export EXP7_MOHO_PROJECT="$EXP7_ART_SCRATCH/moho/comparison/Exp7_art_comparison.moho"
"$MOHO" "$EXP7_MOHO_PROJECT" "$(pwd)/art/pipeline/moho/scripts/AnimateExp7States.lua"
mkdir -p "$EXP7_ART_SCRATCH/moho/render"
"$MOHO" -r "$EXP7_MOHO_PROJECT" -f png -outfolder "$EXP7_ART_SCRATCH/moho/render" -start 1 -end 1 -v
```

**Do not** use `FileRender` Lua (SIGSEGV 139). See `BLOCKED.md`.
