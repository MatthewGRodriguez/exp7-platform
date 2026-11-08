-- Exp7 art-pass: build a REAL comparison .moho with filled vector shapes per state.
-- Empty layers are a FAIL — this script must CountShapes()>0 on every state_* layer.
--
-- VERIFIED Mac 14.3 invocation (document FIRST):
--   Moho <abs seed.or.any.moho> <abs CreateExp7ArtComparison.lua>
-- Render with proven CLI (FileRender Lua exits 139 — do not use):
--   Moho -r <abs Exp7_art_comparison.moho> -f png -outfolder <dir> -start 1 -end 1 -v
--
-- Shape law (living-core DesignUpgradeRankingUi.lua):
--   AddLone/Append → curve.fClosed=true → sharp curvature → Select → CreateShape → style
-- Line width via moho:PixelToDoc.
--
-- Env: EXP7_ART_SCRATCH, EXP7_MOHO_OUT

local function w(s) io.stderr:write(tostring(s) .. "\n") end

local function scratch()
  local s = os.getenv("EXP7_ART_SCRATCH")
  if s == nil or s == "" then s = "/Users/user-rodri/ArtScratch/exp7-art" end
  return s
end

local function outPath()
  local p = os.getenv("EXP7_MOHO_OUT")
  if p ~= nil and p ~= "" then return p end
  return scratch() .. "/moho/comparison/Exp7_art_comparison.moho"
end

-- Palette (Exp7 light — same hues as art/design/params.json, 0..1)
local PAL = {
  surface = {1, 1, 1, 1},
  subtle  = {0.957, 0.965, 0.980, 1},
  softDisc= {0.933, 0.945, 0.965, 1},
  text    = {0.110, 0.137, 0.200, 1},
  muted   = {0.286, 0.333, 0.416, 1},
  border  = {0.541, 0.588, 0.667, 1},
  selection = {0.141, 0.345, 0.651, 1},
  accent  = {0.459, 0.318, 0.059, 1},
  invalid = {0.667, 0.0, 0.0, 1},
  disabled= {0.604, 0.639, 0.698, 1},
  washSel = {0.910, 0.933, 0.973, 1},
  bg      = {0.91, 0.93, 0.95, 1}
}

-- State visuals aligned with state-table + JRViews (drop-pending = accent/gold, NOT invalid red)
local STATE = {
  { name = "idle",         fill = PAL.surface,  line = PAL.border,    lw = 2,  scale = 1.00, y =  0.55 },
  { name = "hover",        fill = PAL.subtle,   line = PAL.border,    lw = 2,  scale = 1.00, y =  0.30 },
  { name = "focus",        fill = PAL.surface,  line = PAL.selection, lw = 4,  scale = 1.00, y =  0.05 },
  { name = "pressed",      fill = PAL.subtle,   line = PAL.selection, lw = 3,  scale = 0.97, y = -0.20 },
  { name = "selected",     fill = PAL.washSel,  line = PAL.accent,    lw = 3,  scale = 1.00, y = -0.45 },
  { name = "dragging",     fill = PAL.surface,  line = PAL.selection, lw = 2,  scale = 1.02, y =  0.55 },
  { name = "drop-pending", fill = PAL.subtle,   line = PAL.accent,    lw = 4,  scale = 1.01, y =  0.30 },
  { name = "invalid",      fill = PAL.surface,  line = PAL.invalid,   lw = 4,  scale = 1.00, y =  0.05 },
  { name = "settling",     fill = PAL.surface,  line = PAL.border,    lw = 2,  scale = 1.00, y = -0.20 },
  { name = "disabled",     fill = PAL.softDisc, line = PAL.disabled,  lw = 2,  scale = 1.00, y = -0.45 },
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
  pcall(function() st.fLineCol:SetValue(0, colorVec(lineRgba or PAL.border)) end)
  pcall(function() st.fLineWidth = lineWDoc or 0 end)
  return true
end

local function poly(moho, pts, frame, fillRgba, lineRgba, linePx, sharp)
  local mesh = moho:Mesh()
  if mesh == nil or pts == nil or #pts < 3 then return false end
  local v = LM.Vector2:new_local()
  local startN = mesh:CountPoints()
  mesh:SelectNone()
  for i = 1, #pts do
    v:Set(pts[i][1], pts[i][2])
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

local function rect(moho, x, y, ww, hh, frame, fillRgba, lineRgba, linePx)
  return poly(moho, {
    {x, y}, {x + ww, y}, {x + ww, y + hh}, {x, y + hh}
  }, frame, fillRgba, lineRgba, linePx, true)
end

local function activate(moho, layer)
  moho.layer = layer
  pcall(function() moho:SetSelLayer(layer) end)
end

local function drawStateCard(moho, st, col)
  -- Two columns: left = flat baseline look, right = new state card
  local xL = -0.95 + (col % 2) * 1.05
  local y = st.y
  if col >= 5 then y = st.y end
  -- layout: states 1-5 left column positions already in st.y; 6-10 right
  if col >= 5 then
    xL = 0.15
  else
    xL = -1.05
  end
  local sc = st.scale or 1
  local w = 0.85 * sc
  local h = 0.18 * sc
  local ok1 = rect(moho, xL, y, w, h, 0, st.fill, st.line, st.lw)
  -- title bar proxy (hierarchy — not empty)
  local ok2 = rect(moho, xL + 0.06, y + h * 0.55, w * 0.55, h * 0.22, 0, PAL.text, PAL.text, 0)
  local ok3 = rect(moho, xL + 0.06, y + h * 0.22, w * 0.35, h * 0.14, 0, PAL.muted, PAL.muted, 0)
  return ok1 and ok2 and ok3
end

function MohoScript(moho)
  w("EXP7_COMPARISON_START with_shapes")
  moho:FileNew()
  local doc = moho.document
  if doc == nil then w("ERR no_document"); moho:Quit(); return end
  pcall(function() doc:SetShape(1280, 720) end)
  pcall(function()
    local bg = LM.ColorVector:new_local(); bg:Set(PAL.bg[1], PAL.bg[2], PAL.bg[3], 1)
    doc:SetBackCol(bg:AsColorStruct())
  end)

  -- Flat baseline layer with a plate
  local flat = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
  flat:SetName("flat_baseline")
  activate(moho, flat)
  rect(moho, -1.2, -0.7, 2.4, 1.4, 0, PAL.subtle, PAL.border, 2)
  local flatShapes = 0
  pcall(function() flatShapes = moho:Mesh():CountShapes() end)
  w("layer flat_baseline shapes=" .. tostring(flatShapes))
  if flatShapes < 1 then w("ERR empty flat_baseline"); moho:Quit(); return end

  local totalShapes = flatShapes
  for i = 1, #STATE do
    local st = STATE[i]
    local layer = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
    layer:SetName("state_" .. st.name)
    activate(moho, layer)
    local ok = drawStateCard(moho, st, i - 1)
    local n = 0
    pcall(function() n = moho:Mesh():CountShapes() end)
    w("layer state_" .. st.name .. " shapes=" .. tostring(n) .. " ok=" .. tostring(ok))
    if n < 1 then
      w("ERR empty_layer state_" .. st.name .. " — refusing to claim comparison complete")
      moho:Quit()
      return
    end
    totalShapes = totalShapes + n
  end

  -- Depth markers with small glyphs (must be non-empty)
  local depth = { "depth_ambient", "depth_front", "depth_ring" }
  for i = 1, #depth do
    local layer = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
    layer:SetName(depth[i])
    activate(moho, layer)
    rect(moho, -1.3 + (i - 1) * 0.15, -0.95, 0.1, 0.08, 0, PAL.accent, PAL.accent, 1)
    local n = 0
    pcall(function() n = moho:Mesh():CountShapes() end)
    w("layer " .. depth[i] .. " shapes=" .. tostring(n))
    if n < 1 then w("ERR empty " .. depth[i]); moho:Quit(); return end
    totalShapes = totalShapes + n
  end

  -- Marker layer documenting provenance
  local note = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
  note:SetName("meta_design_study")
  activate(moho, note)
  rect(moho, -1.35, 0.85, 0.4, 0.06, 0, PAL.selection, PAL.selection, 0)

  local out = outPath()
  -- ensure parent dir exists is Mac-side; FileSaveAs should create file
  w("save " .. out .. " totalShapes=" .. tostring(totalShapes))
  if totalShapes < 10 then
    w("ERR too_few_shapes " .. tostring(totalShapes))
    moho:Quit()
    return
  end
  moho:FileSaveAs(out)
  w("EXP7_COMPARISON_SAVED " .. out .. " shapes=" .. tostring(totalShapes))
  w("RENDER_NEXT: Moho -r \"" .. out .. "\" -f png -outfolder \"$EXP7_ART_SCRATCH/moho/render\" -start 1 -end 1 -v")
  moho:Quit()
end
