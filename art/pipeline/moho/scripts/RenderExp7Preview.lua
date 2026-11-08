-- DEPRECATED as a render path on Mac Moho 14.3.
-- FileRender via this script EXITS 139 (SIGSEGV). Do NOT claim success from packaging it.
--
-- Proven render command (use this instead):
--   /Applications/Moho.app/Contents/MacOS/Moho \
--     -r "$EXP7_MOHO_PROJECT" \
--     -f png -outfolder "$EXP7_ART_SCRATCH/moho/render" \
--     -start 1 -end <N> -v
--
-- This script only prints the command and quits 0 — it does NOT FileRender.

local function w(s) io.stderr:write(tostring(s) .. "\n") end

function MohoScript(moho)
  w("EXP7_RENDER_USE_CLI_R")
  local p = os.getenv("EXP7_MOHO_PROJECT")
  if p == nil or p == "" then
    local s = os.getenv("EXP7_ART_SCRATCH") or "/Users/user-rodri/ArtScratch/exp7-art"
    p = s .. "/moho/comparison/Exp7_art_comparison.moho"
  end
  local out = os.getenv("EXP7_ART_SCRATCH") or "/Users/user-rodri/ArtScratch/exp7-art"
  out = out .. "/moho/render"
  w("DO_NOT_FileRender")
  w("USE: /Applications/Moho.app/Contents/MacOS/Moho -r \"" .. p .. "\" -f png -outfolder \"" .. out .. "\" -start 1 -end 1 -v")
  w("After animate keyed frames, set -end to doc end (e.g. 120) only if layers contain shapes.")
  w("EMPTY_LAYER_FRAMES_ARE_FAIL")
  moho:Quit()
end
