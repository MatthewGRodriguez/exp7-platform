-- living-core FULL design upgrade for ranking_ui inside Moho Pro (CLI).
-- Composite layout matches ranking_ui regions · GrokNight palette · filled shapes.
-- Shape law: AddLone/Append → curve.fClosed=true → sharp curvature → Select → CreateShape → style
-- Line width via moho:PixelToDoc (raw numbers explode as doc units).
-- Env: MOHO_LIVING_PROJECT · NEVER open -a. Pure Pro CLI.

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

local function activate(moho, layer)
  moho.layer = layer
  pcall(function() moho:SetSelLayer(layer) end)
end

-- GrokNight (r,g,b,a) 0..1
local PAL = {
  bg       = {0.055, 0.05, 0.075, 1.0},
  voidSoft = {0.09, 0.08, 0.13, 0.40},
  accent   = {0.73, 0.60, 0.97, 0.95},
  chrome   = {0.09, 0.08, 0.13, 0.96},
  chromeLn = {0.73, 0.60, 0.97, 0.75},
  panel    = {0.10, 0.09, 0.15, 0.93},
  panelHi  = {0.16, 0.14, 0.24, 0.95},
  pulse    = {0.29, 0.87, 0.69, 0.92},
  money    = {0.98, 0.78, 0.31, 0.95},
  tab      = {0.18, 0.18, 0.28, 0.95},
  tabOn    = {0.40, 0.50, 0.95, 0.95},
  tabLine  = {0.73, 0.60, 0.97, 1.0},
  review   = {0.38, 0.52, 0.90, 0.90},
  cal      = {0.26, 0.70, 0.60, 0.92},
  save     = {0.30, 0.88, 0.52, 0.95},
  graph    = {0.92, 0.50, 0.72, 0.90},
  white    = {0.96, 0.96, 0.98, 0.96},
  stroke   = {0.73, 0.60, 0.97, 0.50},
  dim      = {0.40, 0.40, 0.48, 0.55}
}

local function colorVec(rgba)
  local c = LM.ColorVector:new_local()
  c:Set(rgba[1], rgba[2], rgba[3], rgba[4] or 1)
  return c
end

local function px(moho, pixels)
  local v = 0.004
  pcall(function() v = moho:PixelToDoc(pixels or 2) end)
  if v == nil or v <= 0 then v = 0.004 end
  return v
end

local function styleLast(mesh, fillRgba, lineRgba, lineWDoc)
  local n = mesh:CountShapes()
  if n < 1 then return false end
  local shape = mesh:Shape(n - 1)
  if shape == nil or shape.fMyStyle == nil then return false end
  local st = shape.fMyStyle
  pcall(function() st.fDefineFillCol = true end)
  pcall(function() st.fDefineLineCol = true end)
  pcall(function() st.fDefineLineWidth = true end)
  pcall(function()
    shape.fHasFill = true
    shape.fHasOutline = lineWDoc ~= nil and lineWDoc > 0
  end)
  pcall(function() st.fFillCol:SetValue(0, colorVec(fillRgba)) end)
  pcall(function() st.fLineCol:SetValue(0, colorVec(lineRgba or PAL.stroke)) end)
  pcall(function() st.fLineWidth = lineWDoc or 0 end)
  return true
end

-- X scale: designs use normalized -1..1; Moho 16:9 workspace X ≈ -aspect..aspect
local AX = 1.0

-- Closed polygon. sharp=true → curvature 0 (rects). linePx nil → no outline.
local function poly(moho, pts, frame, fillRgba, lineRgba, linePx, sharp)
  local mesh = moho:Mesh()
  if mesh == nil or pts == nil or #pts < 3 then return false end
  local v = LM.Vector2:new_local()
  local startN = mesh:CountPoints()
  mesh:SelectNone()
  for i = 1, #pts do
    v:Set(pts[i][1] * AX, pts[i][2])
    if i == 1 then mesh:AddLonePoint(v, frame) else mesh:AppendPoint(v, frame) end
  end
  local curve = mesh:Curve(mesh:CountCurves() - 1)
  if curve ~= nil then
    curve.fClosed = true
    if sharp then
      for i = 0, curve:CountPoints() - 1 do
        pcall(function() curve:SetCurvature(i, 0, frame) end)
      end
    end
  end
  -- select only new points
  mesh:SelectNone()
  local n = mesh:CountPoints()
  for i = startN, n - 1 do
    local pt = mesh:Point(i)
    if pt ~= nil then pt.fSelected = true end
  end
  local sel = 0
  pcall(function() sel = moho:CountSelectedPoints(true) end)
  if sel < 3 then mesh:SelectAll() end
  pcall(function() moho:CreateShape(true, false, frame) end)
  local lw = 0
  if linePx and linePx > 0 then lw = px(moho, linePx) end
  styleLast(mesh, fillRgba, lineRgba, lw)
  mesh:SelectNone()
  return true
end

local function circle(moho, cx, cy, r, n, frame, fillRgba, lineRgba, linePx)
  local pts = {}
  n = n or 18
  for i = 0, n - 1 do
    local a = (i / n) * math.pi * 2
    pts[#pts + 1] = { cx + r * math.cos(a), cy + r * math.sin(a) }
  end
  return poly(moho, pts, frame, fillRgba, lineRgba, linePx, false)
end

local function rect(moho, x, y, ww, hh, frame, fillRgba, lineRgba, linePx)
  return poly(moho, {
    {x, y}, {x + ww, y}, {x + ww, y + hh}, {x, y + hh}
  }, frame, fillRgba, lineRgba, linePx, true)
end

-- Regions in Moho workspace (~ -1..1 full frame, y up)
local R = {
  header_y = 0.86, header_h = 0.12,
  tabs_y = 0.70, tabs_h = 0.085,
  graph_y = 0.58, graph_h = 0.07,
  side_x = 0.42, side_y = -0.78, side_w = 0.52, side_h = 1.25,
  live_x = 0.82, live_y = 0.88,
  status_x = 0.58, status_y = 0.88,
  joy_x = -0.28, joy_y = 0.05
}

local DESIGNS = {
  L0_void = function(moho)
    rect(moho, -1.05, -1.05, 2.10, 2.10, 0, PAL.voidSoft, nil, 0)
    circle(moho, -0.72, 0.50, 0.20, 16, 0,
      {0.73, 0.60, 0.97, 0.07}, {0.73, 0.60, 0.97, 0.18}, 1)
    circle(moho, 0.68, -0.40, 0.16, 14, 0,
      {0.29, 0.87, 0.69, 0.06}, {0.29, 0.87, 0.69, 0.14}, 1)
  end,

  L1_accent_wave = function(moho)
    rect(moho, -0.995, -0.98, 0.030, 1.96, 0, PAL.accent, nil, 0)
    rect(moho, -0.955, -0.18, 0.012, 0.50, 0,
      {0.73, 0.60, 0.97, 0.50}, nil, 0)
  end,

  L2_chrome = function(moho)
    rect(moho, -0.98, R.header_y - R.header_h, 1.96, R.header_h, 0,
      PAL.chrome, PAL.chromeLn, 1.5)
    rect(moho, -0.95, R.header_y - R.header_h, 0.50, 0.012, 0,
      PAL.accent, nil, 0)
    rect(moho, 0.52, R.header_y - 0.09, 0.34, 0.07, 0,
      {0.12, 0.11, 0.18, 0.98}, PAL.chromeLn, 1.2)
  end,

  L3_panel = function(moho)
    rect(moho, R.side_x, R.side_y, R.side_w, R.side_h, 0,
      PAL.panel, PAL.stroke, 1.2)
    local cardH, gap = 0.20, 0.07
    local cy = R.side_y + R.side_h - 0.10 - cardH
    for i = 0, 3 do
      rect(moho, R.side_x + 0.04, cy - i * (cardH + gap), R.side_w - 0.08, cardH, 0,
        PAL.panelHi, PAL.accent, 1)
    end
  end,

  L4_run_pulse = function(moho)
    local cx, cy, r = R.live_x, R.live_y, 0.05
    circle(moho, cx, cy, r * 1.5, 16, 0,
      {0.29, 0.87, 0.69, 0.22}, PAL.pulse, 1.2)
    circle(moho, cx, cy, r, 14, 0, PAL.pulse, PAL.white, 1)
  end,

  L5_money_spark = function(moho)
    local cx, cy = 0.0, R.graph_y - R.graph_h * 0.3
    local pts = {}
    for i = 0, 9 do
      local a = (i / 10) * math.pi * 2 - math.pi / 2
      local rr = (i % 2 == 0) and 0.055 or 0.022
      pts[#pts + 1] = { cx + rr * math.cos(a), cy + rr * math.sin(a) }
    end
    poly(moho, pts, 0, PAL.money, PAL.white, 1, true)
    rect(moho, -0.92, R.graph_y - R.graph_h, 1.84, R.graph_h * 0.5, 0,
      {0.98, 0.78, 0.31, 0.14}, PAL.money, 0.8)
  end,

  L6_tab = function(moho)
    local y = R.tabs_y - R.tabs_h
    rect(moho, -0.92, y, 1.30, R.tabs_h, 0,
      {0.07, 0.07, 0.10, 0.90}, PAL.dim, 0.8)
    local tw, gap = 0.22, 0.03
    local tx = -0.88
    for i = 0, 3 do
      local fill = (i == 0) and PAL.tabOn or PAL.tab
      rect(moho, tx + i * (tw + gap), y + 0.01, tw, R.tabs_h - 0.018, 0,
        fill, PAL.tabLine, 1)
    end
    rect(moho, -0.88, y, 0.22, 0.012, 0, PAL.tabLine, nil, 0)
  end,

  L10_review = function(moho)
    local x, y, ww, hh = -0.70, 0.02, 0.55, 0.36
    rect(moho, x, y, ww, hh, 0, PAL.review, PAL.white, 1.5)
    rect(moho, x + 0.05, y + hh - 0.11, 0.18, 0.07, 0, PAL.white, PAL.review, 1)
    rect(moho, x + 0.28, y + hh - 0.11, 0.18, 0.07, 0, PAL.accent, PAL.white, 1)
  end,

  L11_cal_drill = function(moho)
    local x, y, ww, hh = -0.78, -0.55, 0.70, 0.48
    rect(moho, x, y, ww, hh, 0, PAL.cal, PAL.white, 1.2)
    for row = 0, 3 do
      for col = 0, 3 do
        rect(moho, x + 0.06 + col * 0.15, y + hh - 0.14 - row * 0.10, 0.11, 0.07, 0,
          {0.09, 0.15, 0.13, 0.95}, PAL.cal, 0.8)
      end
    end
  end,

  L12_save_ok = function(moho)
    local cx, cy, r = R.status_x + 0.10, R.status_y - 0.02, 0.045
    circle(moho, cx, cy, r, 16, 0, PAL.save, PAL.white, 1.2)
    poly(moho, {
      {cx - 0.022, cy}, {cx - 0.004, cy - 0.018}, {cx + 0.025, cy + 0.020},
      {cx + 0.016, cy + 0.026}, {cx - 0.004, cy - 0.004}, {cx - 0.026, cy + 0.007}
    }, 0, PAL.white, nil, 0, true)
  end,

  L13_relation_graph = function(moho)
    local cx, cy = R.joy_x, R.joy_y
    circle(moho, cx, cy, 0.075, 16, 0, PAL.graph, PAL.white, 1.2)
    for i = 0, 5 do
      local a = (i / 6) * math.pi * 2 - math.pi / 2
      local nx = cx + 0.20 * math.cos(a)
      local ny = cy + 0.20 * math.sin(a)
      circle(moho, nx, ny, 0.04, 12, 0,
        {0.92, 0.50, 0.72, 0.82}, PAL.graph, 1)
      local dx, dy = nx - cx, ny - cy
      local len = math.sqrt(dx * dx + dy * dy)
      local pxv, pyv = -dy / len * 0.01, dx / len * 0.01
      poly(moho, {
        {cx + dx * 0.28 + pxv, cy + dy * 0.28 + pyv},
        {nx - dx * 0.18 + pxv, ny - dy * 0.18 + pyv},
        {nx - dx * 0.18 - pxv, ny - dy * 0.18 - pyv},
        {cx + dx * 0.28 - pxv, cy + dy * 0.28 - pyv}
      }, 0, {0.92, 0.50, 0.72, 0.55}, nil, 0, true)
    end
  end
}

local function keyMotion(layer, name, endF)
  local isEvent = name:match("^L1[0-3]") or name:match("^L[4-6]")
  local amp = isEvent and 0.03 or 0.015
  local phase = (#name) * 0.17
  local frames = { 0, 8, 16, 24, 32, 40, 48, 56, 64, 72 }
  for fi = 1, #frames do
    local f = frames[fi]
    if f > endF then f = endF end
    local t = (f / endF) * math.pi * 2 + phase
    local vx = LM.Vector3:new_local()
    local sx = LM.Vector3:new_local()
    if name == "L1_accent_wave" then
      vx:Set(0, 0.035 * math.sin(t * 1.1), 0)
      sx:Set(1, 1.0 + 0.025 * math.sin(t), 1)
    elseif name == "L2_chrome" then
      vx:Set(0, 0.005 * math.sin(t * 0.5), 0)
      sx:Set(1, 1, 1)
    elseif name == "L3_panel" then
      vx:Set(0.008 * math.sin(t * 0.6), 0, 0)
      local s = 1.0 + 0.012 * math.sin(t)
      sx:Set(s, s, 1)
    elseif name == "L4_run_pulse" then
      local s = 1.0 + 0.15 * math.sin(t * 2)
      vx:Set(0, 0, 0); sx:Set(s, s, 1)
    elseif name == "L5_money_spark" then
      local s = 1.0 + 0.10 * math.sin(t * 1.5)
      vx:Set(0.015 * math.sin(t), 0.008 * math.cos(t), 0)
      sx:Set(s, s, 1)
    elseif name == "L6_tab" then
      vx:Set(0.012 * math.sin(t * 0.8), 0, 0)
      sx:Set(1.0 + 0.015 * math.sin(t), 1, 1)
    elseif name == "L12_save_ok" then
      local s = 0.85 + 0.22 * math.min(1, f / 18)
      if f > 50 then s = s * (1 - (f - 50) / 40) end
      if s < 0.45 then s = 0.45 end
      vx:Set(0, 0.015 * math.sin(t), 0)
      sx:Set(s, s, 1)
    elseif name == "L13_relation_graph" then
      vx:Set(0.01 * math.cos(t), 0.01 * math.sin(t), 0)
      local s = 1.0 + 0.04 * math.sin(t * 1.5)
      sx:Set(s, s, 1)
    elseif isEvent then
      local s = 1.0 + amp * math.sin(t)
      vx:Set(amp * 0.4 * math.cos(t), amp * 0.4 * math.sin(t), 0)
      sx:Set(s, s, 1)
    else
      vx:Set(amp * math.sin(t), amp * 0.25 * math.cos(t * 0.8), 0)
      sx:Set(1, 1, 1)
    end
    layer.fTranslation:SetValue(f, vx)
    layer.fScale:SetValue(f, sx)
  end
end

function MohoScript(moho)
  w("DESIGN_UPGRADE_START")
  local doc = openProject(moho)
  if doc == nil then w("ERR no_document"); moho:Quit(); return end

  pcall(function() doc:SetShape(1280, 720) end)
  pcall(function() doc:SetEndFrame(72) end)
  pcall(function() doc:SetFps(24) end)
  -- Moho workspace: Y ≈ -1..1, X ≈ -aspect..aspect for 16:9
  local aspect = 16 / 9
  pcall(function()
    if doc:Width() and doc:Height() and doc:Height() > 0 then
      aspect = doc:Width() / doc:Height()
    end
  end)
  AX = aspect
  w("aspect " .. tostring(aspect) .. " AX=" .. tostring(AX))
  pcall(function()
    local bg = LM.ColorVector:new_local()
    bg:Set(PAL.bg[1], PAL.bg[2], PAL.bg[3], 1)
    doc:SetBackCol(bg:AsColorStruct())
    w("backcol set")
  end)

  local endF = doc:EndFrame()
  if endF == nil or endF < 24 then endF = 72 end
  w("end_frame " .. tostring(endF) .. " " .. tostring(doc:Width()) .. "x" .. tostring(doc:Height()))
  w("px2doc2=" .. tostring(px(moho, 2)))

  local order = {
    "L0_void", "L1_accent_wave", "L2_chrome", "L3_panel",
    "L6_tab", "L5_money_spark",
    "L10_review", "L11_cal_drill", "L13_relation_graph",
    "L4_run_pulse", "L12_save_ok"
  }

  for i = 1, #order do
    local name = order[i]
    local layer = findLayer(doc, name)
    if layer == nil then
      w("missing " .. name)
    else
      activate(moho, layer)
      pcall(function()
        local mesh = moho:Mesh()
        if mesh then mesh:Clear() end
      end)
      pcall(function()
        local z = LM.Vector3:new_local(); z:Set(0, 0, 0)
        local o = LM.Vector3:new_local(); o:Set(1, 1, 1)
        layer.fTranslation:Clear(true)
        layer.fScale:Clear(true)
        layer.fTranslation:SetValue(0, z)
        layer.fScale:SetValue(0, o)
      end)
      local designer = DESIGNS[name]
      if designer then
        local ok, err = pcall(function() designer(moho) end)
        local nShapes = 0
        pcall(function() nShapes = moho:Mesh():CountShapes() end)
        if ok then
          w("designed " .. name .. " shapes=" .. tostring(nShapes))
        else
          w("design_err " .. name .. " " .. tostring(err))
        end
      end
      keyMotion(layer, name, endF)
      w("keyed " .. name)
    end
  end

  -- Gentle camera breath (keep default FOV — aggressive zoom blanks render)
  pcall(function()
    if doc.fCameraZoom ~= nil then
      doc.fCameraZoom:SetValue(0, 1.0)
      doc.fCameraZoom:SetValue(36, 1.02)
      doc.fCameraZoom:SetValue(72, 1.0)
      w("camera_zoom 1.0")
    end
  end)

  doc:SetDirty()
  moho:FileSave()
  w("DESIGN_UPGRADE_OK saved")
  moho:Quit()
end
