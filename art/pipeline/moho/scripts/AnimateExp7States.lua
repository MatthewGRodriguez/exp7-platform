-- Exp7 art-pass: write coarse lift/scale keys from state-table lifts onto state_* layers.
-- Requires an open comparison .moho (from CreateExp7ArtComparison.lua) via env EXP7_MOHO_PROJECT.
-- Analytical lifts only until Blender-measured fits exist — label keys provisional.
--
-- Env:
--   EXP7_MOHO_PROJECT  path to Exp7_art_comparison.moho
--   EXP7_ART_SCRATCH   default /Users/user-rodri/ArtScratch/exp7-art

local function w(s) io.stderr:write(tostring(s) .. "\n") end

-- Provisional lifts from art/design/state-table.json / params (px -> Moho workspace units ~ /100)
local STATE_LIFT = {
  idle = 0.00,
  hover = 0.015,
  focus = 0.015,
  pressed = 0.00,
  selected = 0.02,
  dragging = 0.04,
  ["drop-pending"] = 0.03,
  invalid = 0.00,
  settling = 0.01,
  disabled = 0.00
}

local STATE_SCALE = {
  idle = 1.0,
  hover = 1.0,
  focus = 1.0,
  pressed = 0.97,
  selected = 1.0,
  dragging = 1.02,
  ["drop-pending"] = 1.01,
  invalid = 1.0,
  settling = 1.0,
  disabled = 1.0
}

local function openProject(moho)
  local p = os.getenv("EXP7_MOHO_PROJECT")
  if p == nil or p == "" then
    local s = os.getenv("EXP7_ART_SCRATCH") or "/Users/user-rodri/ArtScratch/exp7-art"
    p = s .. "/moho/comparison/Exp7_art_comparison.moho"
  end
  moho:FileOpen(p)
  w("opened " .. p)
  return moho.document, p
end

local function findLayer(doc, name)
  for i = 0, doc:CountLayers() - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil and layer:Name() == name then return layer end
  end
  return nil
end

function MohoScript(moho)
  w("EXP7_ANIMATE_START provisional_lifts")
  local doc, path = openProject(moho)
  if doc == nil then w("ERR no_document"); moho:Quit(); return end

  pcall(function() doc:SetEndFrame(120) end)
  pcall(function() doc:SetFps(24) end)

  local order = {
    "idle", "hover", "focus", "pressed", "selected",
    "dragging", "drop-pending", "invalid", "settling", "disabled"
  }
  local empty = 0
  for i = 1, #order do
    local name = order[i]
    local layer = findLayer(doc, "state_" .. name)
    if layer == nil then
      w("MISS state_" .. name)
      empty = empty + 1
    else
      moho.layer = layer
      pcall(function() moho:SetSelLayer(layer) end)
      local nShapes = 0
      pcall(function()
        local mesh = moho:Mesh()
        if mesh ~= nil then nShapes = mesh:CountShapes() end
      end)
      w("shapes state_" .. name .. "=" .. tostring(nShapes))
      if nShapes < 1 then
        w("ERR empty_layer state_" .. name .. " — animate of empty layers is FAIL")
        empty = empty + 1
      else
        local f = (i - 1) * 12
        local lift = STATE_LIFT[name] or 0
        local sc = STATE_SCALE[name] or 1
        local vx = LM.Vector3:new_local()
        local sx = LM.Vector3:new_local()
        vx:Set(0, lift, 0)
        sx:Set(sc, sc, 1)
        layer.fTranslation:SetValue(f, vx)
        layer.fScale:SetValue(f, sx)
        w("keyed " .. name .. " f=" .. f .. " lift=" .. lift)
      end
    end
  end

  if empty > 0 then
    w("EXP7_ANIMATE_FAIL empty_layers=" .. tostring(empty) .. " — re-run CreateExp7ArtComparison.lua with shapes")
    moho:Quit()
    return
  end

  moho:FileSave()
  w("EXP7_ANIMATE_SAVED " .. tostring(path))
  w("RENDER_NEXT: Moho -r \"" .. tostring(path) .. "\" -f png -outfolder \"$EXP7_ART_SCRATCH/moho/render\" -start 1 -end 120 -v")
  moho:Quit()
end
