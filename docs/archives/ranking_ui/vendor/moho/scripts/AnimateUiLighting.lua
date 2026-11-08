-- living-core: Moho Pro CLI — UI lighting orbit for ranking_ui
-- Authors key/fill motion on L0/L1/L2 for 3D perspective lighting scrub.
-- Mapping (jworkbook_moho.js):
--   L2_chrome.sx  → key intensity
--   L1_accent tx/ty/sx → key azimuth + fill
--   L0_void ty    → ambient fill
-- Env: MOHO_LIVING_PROJECT  · NEVER open -a

local function w(s) io.stderr:write(tostring(s) .. "\n") end

local function openProject(moho)
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p ~= nil and p ~= "" then moho:FileOpen(p); w("opened " .. p) end
  return moho.document
end

local function findLayer(doc, name)
  for i = 0, doc:CountLayers() - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil and layer:Name() == name then return layer end
  end
  return nil
end

-- Lighting orbit keys (traditional upper-left key sweeping gently)
-- frames over endF; values are Moho workspace units / scale
local function lightKeys(layer, name, endF)
  local frames = { 0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72 }
  for fi = 1, #frames do
    local f = frames[fi]
    if f > endF then f = endF end
    local t = (f / endF) * math.pi * 2
    local vx = LM.Vector3:new_local()
    local sx = LM.Vector3:new_local()

    if name == "L2_chrome" then
      -- key intensity + slight pitch via ty (perspective)
      local s = 1.0 + 0.10 * math.sin(t)
      vx:Set(0.02 * math.sin(t * 0.5), 0.04 * math.cos(t * 0.6), 0)
      sx:Set(s, 1.0 + 0.06 * math.cos(t), 1)
    elseif name == "L1_accent_wave" then
      -- Model yaw/pitch for fixed-camera box projection (sides reveal).
      -- Wider orbit so right/left faces enter the frustum clearly.
      local az = 0.14 * math.sin(t)           -- → yaw ~±18° after mapping
      local el = 0.10 * math.cos(t * 0.85)    -- → pitch ~±10°
      local s = 1.0 + 0.06 * math.sin(t * 1.2)
      vx:Set(az, el, 0)
      sx:Set(s, 1.0 + 0.04 * math.cos(t), 1)
    elseif name == "L0_void" then
      -- ambient + depth breath
      local s = 1.0 + 0.05 * math.sin(t * 0.7)
      vx:Set(0.03 * math.cos(t * 0.5), 0.05 * math.sin(t * 0.7), 0)
      sx:Set(s, s, 1)
    else
      vx:Set(0, 0, 0)
      sx:Set(1, 1, 1)
    end

    layer.fTranslation:SetValue(f, vx)
    layer.fScale:SetValue(f, sx)
  end
end

function MohoScript(moho)
  w("LIGHTING_ANIM_START")
  local doc = openProject(moho)
  if doc == nil then w("ERR no_document"); moho:Quit(); return end

  pcall(function() doc:SetEndFrame(72) end)
  pcall(function() doc:SetFps(24) end)
  local endF = doc:EndFrame()
  if endF == nil or endF < 24 then endF = 72 end
  w("end_frame " .. tostring(endF))

  -- camera zoom = global exposure breath (subtle)
  pcall(function()
    if doc.fCameraZoom ~= nil then
      doc.fCameraZoom:SetValue(0, 1.0)
      doc.fCameraZoom:SetValue(18, 1.02)
      doc.fCameraZoom:SetValue(36, 0.99)
      doc.fCameraZoom:SetValue(54, 1.03)
      doc.fCameraZoom:SetValue(72, 1.0)
      w("camera_exposure")
    end
  end)

  local order = { "L0_void", "L1_accent_wave", "L2_chrome" }
  for i = 1, #order do
    local name = order[i]
    local layer = findLayer(doc, name)
    if layer == nil then
      w("missing " .. name)
    else
      -- clear prior keys then re-key lighting orbit
      pcall(function()
        layer.fTranslation:Clear(true)
        layer.fScale:Clear(true)
      end)
      lightKeys(layer, name, endF)
      w("light_keyed " .. name)
    end
  end

  doc:SetDirty()
  moho:FileSave()
  w("LIGHTING_ANIM_OK saved")
  moho:Quit()
end
