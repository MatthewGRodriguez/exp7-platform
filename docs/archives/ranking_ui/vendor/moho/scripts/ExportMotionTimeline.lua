-- living-core densest: export Moho Pro keyframe data → JSON (anti-drift SoT).
-- Runtime applies these values; never invent motion in CSS.
-- Env: MOHO_LIVING_PROJECT, MOHO_LIVING_MOTION_OUT

local function w(s) io.stderr:write(tostring(s) .. "\n") end

local function esc(s)
  s = tostring(s or "")
  s = s:gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n")
  return s
end

function MohoScript(moho)
  w("MOTION_EXPORT_START")
  local p = os.getenv("MOHO_LIVING_PROJECT")
  local out = os.getenv("MOHO_LIVING_MOTION_OUT")
  if p == nil or p == "" then w("ERR no_project"); moho:Quit(); return end
  if out == nil or out == "" then
    out = p:gsub("%.moho$", "") .. "_motion.json"
  end
  moho:FileOpen(p)
  local doc = moho.document
  if doc == nil then w("ERR no_document"); moho:Quit(); return end

  local endF = doc:EndFrame()
  if endF == nil or endF < 1 then endF = 72 end

  local parts = {}
  table.insert(parts, "{")
  table.insert(parts, '"source":"moho_pro_cli",')
  table.insert(parts, '"project":"' .. esc(p) .. '",')
  table.insert(parts, '"end_frame":' .. tostring(endF) .. ",")
  table.insert(parts, '"fps":24,')
  table.insert(parts, '"layers":[')

  local n = doc:CountLayers()
  local firstLayer = true
  for i = 0, n - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil then
      local name = layer:Name() or ("layer_" .. i)
      if not firstLayer then table.insert(parts, ",") end
      firstLayer = false
      table.insert(parts, "{")
      table.insert(parts, '"name":"' .. esc(name) .. '",')
      table.insert(parts, '"keys":[')
      local tk = layer.fTranslation:CountKeys()
      local firstKey = true
      for k = 0, tk - 1 do
        local when = layer.fTranslation:GetKeyWhen(k)
        local t = layer.fTranslation:GetValueByID(k)
        local s = layer.fScale:GetValue(when)
        if not firstKey then table.insert(parts, ",") end
        firstKey = false
        table.insert(parts, string.format(
          '{"f":%s,"tx":%.6f,"ty":%.6f,"tz":%.6f,"sx":%.6f,"sy":%.6f,"sz":%.6f}',
          tostring(when),
          t.x or 0, t.y or 0, t.z or 0,
          s.x or 1, s.y or 1, s.z or 1
        ))
      end
      table.insert(parts, "]")
      table.insert(parts, "}")
      w("export_layer " .. name .. " keys=" .. tostring(tk))
    end
  end

  table.insert(parts, "],")
  -- camera zoom keys if any
  table.insert(parts, '"camera_zoom":[')
  pcall(function()
    local zc = doc.fCameraZoom
    if zc ~= nil then
      local ck = zc:CountKeys()
      for k = 0, ck - 1 do
        local when = zc:GetKeyWhen(k)
        local val = zc:GetValueByID(k)
        if k > 0 then table.insert(parts, ",") end
        table.insert(parts, string.format('{"f":%s,"z":%.6f}', tostring(when), val))
      end
    end
  end)
  table.insert(parts, "]")
  table.insert(parts, "}")

  local f = io.open(out, "w")
  if f == nil then
    w("ERR write_fail " .. out)
    moho:Quit()
    return
  end
  f:write(table.concat(parts, ""))
  f:close()
  w("MOTION_EXPORT_OK " .. out)
  moho:Quit()
end
