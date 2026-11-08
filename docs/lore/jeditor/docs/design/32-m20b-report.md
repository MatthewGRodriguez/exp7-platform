# M20b report — generic views

- eval: `sum` node. runtime: `table`, `kpi`, `text` layouts, number pad, add/remove rows, `topJoys`. CSS for all, themed by view tokens.
- editor: table/kpi/text/tabs panels (pickers + on-screen keyboard only).
- Tests: world_test 77/77; exercised end-to-end by the M20c click proof and offline test.
- Not yet: date and choice inputs (the live UI's date pickers live on DEBT/CALENDAR; added with those tabs), editable name cells (live uses
  text inputs; here names are edited in the editor's item panel via the on-screen keyboard).
