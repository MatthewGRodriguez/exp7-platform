-- Exp7 art-pass: key lift/scale from state-table onto state_* layers.
-- LOOP CLOSURE (Mac v4 FAIL: f1 vs f120 mean diff 7.98): frame 0 and end frame
-- must hold identical rest poses for every layer.
--
-- Timebase: 10 states × 12 frames = 120; fps 24. Order matches state-table elementStates.
-- Env: EXP7_MOHO_PROJECT, EXP7_ART_SCRATCH

local function w(s) io.stderr:write(tostring(s) .. "\n") end

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

-- Canonical order from art/design/state-table.json elementStates
local ORDER = {
  "idle", "hover", "focus", "pressed", "selected",
  "dragging", "drop-pending", "invalid", "settling", "disabled"
}

local STEP = 12
local END = #ORDER * STEP  -- 120

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

local function setPose(layer, frame, lift, sc)
  local vx = LM.Vector3:new_local()
  local sx = LM.Vector3:new_local()
  vx:Set(0, lift, 0)
  sx:Set(sc, sc, 1)
  layer.fTranslation:SetValue(frame, vx)
  layer.fScale:SetValue(frame, sx)
end

function MohoScript(moho)
  w("EXP7_ANIMATE_START loop_closure end=" .. tostring(END))
  local doc, path = openProject(moho)
  if doc == nil then w("ERR no_document"); moho:Quit(); return end

  pcall(function() doc:SetEndFrame(END) end)
  pcall(function() doc:SetFps(24) end)

  local layers = {}
  local empty = 0
  for i = 1, #ORDER do
    local name = ORDER[i]
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
        w("ERR empty_layer state_" .. name)
        empty = empty + 1
      else
        layers[#layers + 1] = { name = name, layer = layer }
      end
    end
  end

  if empty > 0 or #layers ~= #ORDER then
    w("EXP7_ANIMATE_FAIL empty_or_missing=" .. tostring(empty))
    moho:Quit()
    return
  end

  -- Rest pose on frame 0 AND frame END (loop closure)
  for i = 1, #layers do
    setPose(layers[i].layer, 0, 0, 1)
    setPose(layers[i].layer, END, 0, 1)
  end
  w("keyed REST f=0 and f=" .. tostring(END) .. " all layers")

  -- At each state beat: pose active layer; hold others at rest (explicit keys kill interpolation drift)
  for i = 1, #ORDER do
    local f = (i - 1) * STEP
    if f == 0 then
      -- frame 0 already rest; also pose idle subtly as identity (same)
      w("beat idle f=0 rest")
    else
      local active = ORDER[i]
      for j = 1, #layers do
        local name = layers[j].name
        local layer = layers[j].layer
        if name == active then
          setPose(layer, f, STATE_LIFT[name] or 0, STATE_SCALE[name] or 1)
          w("keyed " .. name .. " f=" .. f .. " lift=" .. tostring(STATE_LIFT[name] or 0))
        else
          setPose(layer, f, 0, 1)
        end
      end
    end
  end

  -- Mid hold before loop: ensure frame END-1 also rest so last frame isn't lingering disabled
  for i = 1, #layers do
    setPose(layers[i].layer, END - 1, 0, 1)
  end

  moho:FileSave()
  w("EXP7_ANIMATE_SAVED " .. tostring(path) .. " loop_closed f0==f" .. tostring(END))
  w("RENDER_NEXT: Moho -r \"" .. tostring(path) .. "\" -f png -outfolder \"$EXP7_ART_SCRATCH/moho/render\" -start 1 -end " .. tostring(END) .. " -v")
  w("LOOP_CHECK: mean |f1 - f" .. tostring(END) .. "| should be ~0 (both rest)")
  moho:Quit()
end
