-- Exp7 art-pass: scaffold a state-table comparison Moho document via Pro MohoScript.
-- VERIFIED Mac 14.3: Moho <abs seed.or.doc.moho> <abs this.lua>  → use document FIRST.
-- Bare `Moho this.lua` exits 139 (wrong argv; not licensing). Do NOT use open -a Moho.
-- CLI render of a saved doc: Moho -r <doc.moho> -f png -outfolder <dir> -start 1 -end 1 -v
--
-- Env:
--   EXP7_ART_SCRATCH  default /Users/user-rodri/ArtScratch/exp7-art
--   EXP7_MOHO_OUT     optional full path to .moho output
--
-- Layer names mirror art/design/state-table.json elementStates + flat vs new.

local function w(s) io.stderr:write(tostring(s) .. "\n") end

local function scratch()
  local s = os.getenv("EXP7_ART_SCRATCH")
  if s == nil or s == "" then
    s = "/Users/user-rodri/ArtScratch/exp7-art"
  end
  return s
end

local function outPath()
  local p = os.getenv("EXP7_MOHO_OUT")
  if p ~= nil and p ~= "" then return p end
  return scratch() .. "/moho/comparison/Exp7_art_comparison.moho"
end

-- State-table element states (must stay in sync with art/design/state-table.json)
local STATES = {
  "idle", "hover", "focus", "pressed", "selected",
  "dragging", "drop-pending", "invalid", "settling", "disabled"
}

function MohoScript(moho)
  w("EXP7_COMPARISON_START")
  moho:FileNew()

  -- Flat baseline plate
  local flat = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
  if flat ~= nil then
    flat:SetName("flat_baseline")
    w("layer flat_baseline")
  end

  -- New art stack (one vector layer per state for side-by-side authoring)
  for i = 1, #STATES do
    local layer = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
    if layer ~= nil then
      layer:SetName("state_" .. STATES[i])
      w("layer state_" .. STATES[i])
    end
  end

  -- Parallax depth markers (ambient vs front) — keys filled by AnimateExp7States.lua
  local depth = { "depth_ambient", "depth_front", "depth_ring" }
  for i = 1, #depth do
    local layer = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
    if layer ~= nil then
      layer:SetName(depth[i])
      w("layer " .. depth[i])
    end
  end

  local out = outPath()
  w("save " .. out)
  moho:FileSaveAs(out)
  w("EXP7_COMPARISON_SAVED " .. out)
  moho:Quit()
end
