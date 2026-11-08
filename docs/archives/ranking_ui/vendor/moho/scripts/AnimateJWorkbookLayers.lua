-- living-core densest: ANIMATE JWorkbook layers inside Moho Pro (CLI MohoScript).
-- Keyframes translation + scale on each L* layer so motion is real Moho data.
--
-- Usage:
--   living_invoke app:Moho action=lua \
--     args=[project.moho, AnimateJWorkbookLayers.lua]
--   MOHO_LIVING_PROJECT is set by moho_cli from the .moho arg.
--
-- Does NOT use open -a (crashes on this host). Pure Pro CLI.

local function w(s)
  io.stderr:write(tostring(s) .. "\n")
end

local function openProject(moho)
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p ~= nil and p ~= "" then
    moho:FileOpen(p)
    w("opened " .. p)
  end
  return moho.document
end

local function findLayer(doc, name)
  local n = doc:CountLayers()
  for i = 0, n - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil and layer:Name() == name then
      return layer
    end
  end
  return nil
end

function MohoScript(moho)
  w("ANIMATE_START")
  local doc = openProject(moho)
  if doc == nil then
    w("ERR no_document")
    moho:Quit()
    return
  end

  -- Prefer longer timeline if API allows
  local okEnd, errEnd = pcall(function()
    if doc.SetEndFrame ~= nil then
      doc:SetEndFrame(72)
    end
  end)
  w("end_frame " .. tostring(doc:EndFrame()))

  local names = {
    "L0_void", "L1_accent_wave", "L2_chrome", "L3_panel",
    "L4_run_pulse", "L5_money_spark", "L6_tab",
    "L10_review", "L11_cal_drill", "L12_save_ok", "L13_relation_graph"
  }

  -- Phase offsets so layers don't all move in lockstep (Moho densest orbit feel)
  for idx = 1, #names do
    local name = names[idx]
    local layer = findLayer(doc, name)
    if layer == nil then
      w("skip_missing " .. name)
    else
      local phase = (idx - 1) * 0.35
      -- Ambient vs event layers: different amplitudes
      local isEvent = (name == "L4_run_pulse" or name == "L5_money_spark" or name == "L6_tab"
        or name == "L10_review" or name == "L11_cal_drill" or name == "L12_save_ok"
        or name == "L13_relation_graph")
      local amp = isEvent and 0.08 or 0.04
      local frames = { 0, 12, 24, 36, 48, 60, 72 }

      for fi = 1, #frames do
        local f = frames[fi]
        local t = (f / 72.0) * math.pi * 2 + phase
        local vx = LM.Vector3:new_local()
        local sx = LM.Vector3:new_local()
        if isEvent then
          -- pulse: scale breathe + slight lift
          local s = 1.0 + amp * math.sin(t)
          vx:Set(0, amp * 0.5 * math.sin(t), 0)
          sx:Set(s, s, 1)
        else
          -- ambient drift
          vx:Set(amp * math.sin(t), amp * 0.5 * math.cos(t * 0.7), 0)
          local s = 1.0 + amp * 0.25 * math.sin(t * 0.5)
          sx:Set(s, s, 1)
        end
        layer.fTranslation:SetValue(f, vx)
        layer.fScale:SetValue(f, sx)
      end
      w("animated " .. name)
    end
  end

  -- Soft camera zoom breathe (document-level motion)
  pcall(function()
    local z0 = 1.0
    if doc.fCameraZoom ~= nil then
      doc.fCameraZoom:SetValue(0, z0)
      doc.fCameraZoom:SetValue(36, z0 * 1.02)
      doc.fCameraZoom:SetValue(72, z0)
      w("camera_zoom keyed")
    end
  end)

  doc:SetDirty()
  moho:FileSave()
  w("ANIMATE_OK saved")
  moho:Quit()
end
