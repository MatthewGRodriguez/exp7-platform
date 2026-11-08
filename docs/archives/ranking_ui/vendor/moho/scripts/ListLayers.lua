-- living-core: list layers; FileOpen MOHO_LIVING_PROJECT
function MohoScript(moho)
  local p = os.getenv("MOHO_LIVING_PROJECT")
  if p ~= nil and p ~= "" then moho:FileOpen(p) end
  local doc = moho.document
  if doc == nil then io.stderr:write("ERR no_document\n"); moho:Quit(); return end
  local n = doc:CountLayers()
  io.stderr:write("layers_n "..tostring(n).."\n")
  for i = 0, n - 1 do
    local layer = doc:Layer(i)
    if layer ~= nil then io.stderr:write(string.format("layer[%d] %s\n", i, tostring(layer:Name()))) end
  end
  io.stderr:write("LIST_OK\n")
  moho:Quit()
end
