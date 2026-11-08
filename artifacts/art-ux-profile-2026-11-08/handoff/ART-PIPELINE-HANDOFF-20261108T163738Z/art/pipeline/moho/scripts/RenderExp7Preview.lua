-- Exp7 art-pass: attempt one FileRender of the comparison project.
-- Historical API used by living-core RenderPreview.lua (Moho 14.3): moho:FileRender(out)
-- This is a PROBE script — success is only proven when Mac stderr shows RENDER_OK.
-- Do not treat packaging this file as evidence of a completed Moho render.
--
-- Env:
--   EXP7_MOHO_PROJECT     .moho path
--   EXP7_MOHO_RENDER_OUT  png path (optional)

local function w(s) io.stderr:write(tostring(s) .. "\n") end

function MohoScript(moho)
  w("EXP7_RENDER_PROBE_START")
  local p = os.getenv("EXP7_MOHO_PROJECT")
  if p == nil or p == "" then
    local s = os.getenv("EXP7_ART_SCRATCH") or "/Users/user-rodri/ArtScratch/exp7-art"
    p = s .. "/moho/comparison/Exp7_art_comparison.moho"
  end
  moho:FileOpen(p)
  if moho.document == nil then
    w("ERR no_document")
    moho:Quit()
    return
  end
  local out = os.getenv("EXP7_MOHO_RENDER_OUT")
  if out == nil or out == "" then
    out = p:gsub("%.moho$", "") .. "_preview.png"
  end
  w("render_to " .. out)
  local ok, err = pcall(function() moho:FileRender(out) end)
  if ok then
    w("RENDER_OK " .. out)
  else
    w("RENDER_FAIL " .. tostring(err))
  end
  moho:Quit()
end
