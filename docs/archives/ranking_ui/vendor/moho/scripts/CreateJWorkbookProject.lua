-- living-core densest: scaffold JWorkbook layers via Moho Pro CLI (MohoScript).
-- Verified: Moho 14.3 Pro · MacOS/Moho script.lua · ~8s · no --console
-- Crash law: never open SVG with open -a Moho (SIGSEGV).
-- Usage: living_invoke app:Moho action=lua args=[this file]
--        living_invoke app:Moho action=scaffold

local OUT_PATH = "/Users/[REDACTED-USER]/Home/Dev/The Joy Machine 2/legacy/legacy/html/vendor/moho/project/JWorkbook_chrome.moho"

function MohoScript(moho)
  io.stderr:write("CREATE_START\n")
  moho:FileNew()
  local names = {
    "L0_void","L1_accent_wave","L2_chrome","L3_panel",
    "L4_run_pulse","L5_money_spark","L6_tab",
    "L10_review","L11_cal_drill","L12_save_ok","L13_relation_graph"
  }
  for i = 1, #names do
    local layer = moho:CreateNewLayer(MOHO.LT_VECTOR, false)
    if layer ~= nil then
      layer:SetName(names[i])
      io.stderr:write("layer "..names[i].."\n")
    end
  end
  moho:FileSaveAs(OUT_PATH)
  io.stderr:write("saved "..OUT_PATH.."\n")
  moho:Quit()
end
