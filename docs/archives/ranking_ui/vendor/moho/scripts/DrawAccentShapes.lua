-- living-core densest: DRAW visible shapes on accent/event layers + keep motion.
-- Design inside Moho Pro CLI (vectors + keyframes), not open -a GUI.
-- MOHO_LIVING_PROJECT = .moho path

local function w(s) io.stderr:write(tostring(s) .. "\n") end

local function openProject(moho)
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p ~= nil and p ~= "" then moho:FileOpen(p) end
  return moho.document
end

local function findLayer(doc, name)
  for i = 0, doc:CountLayers() - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil and layer:Name() == name then return layer end
  end
  return nil
end

-- Draw a simple diamond / pulse glyph into the current vector layer mesh
local function drawPulseGlyph(moho, frame)
  local mesh = moho:Mesh()
  if mesh == nil then
    w("no_mesh")
    return false
  end
  local v = LM.Vector2:new_local()
  mesh:SelectNone()
  -- diamond
  local pts = {
    {0, 0.35}, {0.25, 0}, {0, -0.35}, {-0.25, 0}, {0, 0.35}
  }
  for i = 1, #pts do
    v:Set(pts[i][1], pts[i][2])
    if i == 1 then
      mesh:AddLonePoint(v, frame)
    else
      mesh:AppendPoint(v, frame)
    end
  end
  -- close weld first-last if API allows
  pcall(function()
    local n = mesh:CountPoints()
    if n >= 2 then mesh:WeldPoints(n - 1, 0, frame) end
  end)
  pcall(function()
    moho:CreateShape(true, false, frame)
  end)
  return true
end

function MohoScript(moho)
  w("DRAW_START")
  local doc = openProject(moho)
  if doc == nil then
    w("ERR no_document")
    moho:Quit()
    return
  end

  local drawOn = {
    "L1_accent_wave", "L4_run_pulse", "L5_money_spark",
    "L6_tab", "L12_save_ok", "L13_relation_graph"
  }

  for di = 1, #drawOn do
    local name = drawOn[di]
    local layer = findLayer(doc, name)
    if layer == nil then
      w("skip " .. name)
    else
      -- activate layer for Mesh()
      pcall(function()
        moho:SetSelLayer(layer)
      end)
      pcall(function()
        doc:SetActiveLayer(layer)
      end)
      -- set drawing layer via common pattern
      moho.layer = layer
      local ok = drawPulseGlyph(moho, 0)
      if ok then w("drew " .. name) else w("draw_fail " .. name) end
    end
  end

  doc:SetDirty()
  moho:FileSave()
  w("DRAW_OK saved")
  moho:Quit()
end
