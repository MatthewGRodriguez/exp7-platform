-- living-core densest: verify/open project via MOHO_LIVING_PROJECT and save.
function MohoScript(moho)
  io.stderr:write("MARKERS_START\n")
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p ~= nil and p ~= "" then
    moho:FileOpen(p)
  end
  local doc = moho.document
  if doc == nil then
    io.stderr:write("ERR no_document\n")
    moho:Quit()
    return
  end
  local n = doc:CountLayers()
  io.stderr:write("layers_n " .. tostring(n) .. "\n")
  for i = 0, n - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil then
      io.stderr:write("have " .. tostring(layer:Name()) .. "\n")
    end
  end
  moho:FileSave()
  io.stderr:write("MARKERS_OK saved\n")
  moho:Quit()
end
