local function w(s) io.stderr:write(tostring(s).."\n") end
function MohoScript(moho)
  w("DIAG2_START")
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p and p ~= "" then moho:FileOpen(p) end
  local doc = moho.document
  pcall(function() doc:SetShape(1280,720) end)
  pcall(function()
    local bg = LM.ColorVector:new_local(); bg:Set(0.05,0.05,0.07,1)
    doc:SetBackCol(bg:AsColorStruct())
  end)
  -- clear ALL layers
  for i=0,doc:CountLayers()-1 do
    local L = doc:Layer(i)
    if L then
      moho.layer = L
      pcall(function() moho:SetSelLayer(L) end)
      local mesh = moho:Mesh()
      if mesh then mesh:Clear() end
      w("cleared "..L:Name())
    end
  end
  -- draw on L2
  local layer = nil
  for i=0,doc:CountLayers()-1 do
    local L = doc:Layer(i)
    if L and L:Name()=="L2_chrome" then layer=L end
  end
  moho.layer = layer
  moho:SetSelLayer(layer)
  local mesh = moho:Mesh()
  local v = LM.Vector2:new_local()
  -- header rect
  local pts = {{-0.95,0.72},{0.95,0.72},{0.95,0.92},{-0.95,0.92}}
  for i=1,#pts do
    v:Set(pts[i][1], pts[i][2])
    if i==1 then mesh:AddLonePoint(v,0) else mesh:AppendPoint(v,0) end
  end
  local c = mesh:Curve(0)
  c.fClosed = true
  for i=0,c:CountPoints()-1 do c:SetCurvature(i, 0, 0) end
  mesh:SelectAll()
  moho:CreateShape(true, false, 0)
  local sh = mesh:Shape(0)
  local col = LM.ColorVector:new_local(); col:Set(0.15,0.12,0.22,0.95)
  sh.fMyStyle.fDefineFillCol = true
  sh.fMyStyle.fDefineLineCol = true
  sh.fMyStyle.fFillCol:SetValue(0, col)
  local ln = LM.ColorVector:new_local(); ln:Set(0.73,0.6,0.97,0.9)
  sh.fMyStyle.fLineCol:SetValue(0, ln)
  sh.fMyStyle.fLineWidth = 3
  -- side panel rect
  mesh:SelectNone()
  local pts2 = {{0.45,-0.8},{0.95,-0.8},{0.95,0.55},{0.45,0.55}}
  for i=1,#pts2 do
    v:Set(pts2[i][1], pts2[i][2])
    if i==1 then mesh:AddLonePoint(v,0) else mesh:AppendPoint(v,0) end
  end
  local c2 = mesh:Curve(mesh:CountCurves()-1)
  c2.fClosed = true
  for i=0,c2:CountPoints()-1 do c2:SetCurvature(i, 0, 0) end
  mesh:SelectNone()
  for i=4,7 do mesh:Point(i).fSelected = true end
  moho:CreateShape(true, false, 0)
  local sh2 = mesh:Shape(mesh:CountShapes()-1)
  local col2 = LM.ColorVector:new_local(); col2:Set(0.12,0.1,0.18,0.92)
  sh2.fMyStyle.fDefineFillCol = true
  sh2.fMyStyle.fFillCol:SetValue(0, col2)
  local ln2 = LM.ColorVector:new_local(); ln2:Set(0.73,0.6,0.97,0.7)
  sh2.fMyStyle.fDefineLineCol = true
  sh2.fMyStyle.fLineCol:SetValue(0, ln2)
  sh2.fMyStyle.fLineWidth = 2
  w("shapes "..mesh:CountShapes().." pts "..mesh:CountPoints())
  doc:SetDirty(); moho:FileSave(); w("DIAG2_OK"); moho:Quit()
end
