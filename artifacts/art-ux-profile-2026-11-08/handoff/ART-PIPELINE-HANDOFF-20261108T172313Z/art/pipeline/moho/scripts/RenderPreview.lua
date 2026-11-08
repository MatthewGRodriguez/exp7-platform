-- living-core: render one preview frame of JWorkbook project via Pro CLI.
-- MOHO_LIVING_PROJECT = .moho path
-- MOHO_LIVING_RENDER_OUT = png path (optional)

function MohoScript(moho)
  local function w(s) io.stderr:write(tostring(s) .. "\n") end
  w("RENDER_START")
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p == nil or p == "" then
    w("ERR no_project_env")
    moho:Quit()
    return
  end
  moho:FileOpen(p)
  if moho.document == nil then
    w("ERR no_document")
    moho:Quit()
    return
  end
  local out = os.getenv("MOHO_LIVING_RENDER_OUT")
  if out == nil or out == "" then
    -- default next to project
    out = p:gsub("%.moho$", "") .. "_preview.png"
  end
  w("render_to " .. out)
  moho:FileRender(out)
  w("RENDER_OK " .. out)
  moho:Quit()
end
