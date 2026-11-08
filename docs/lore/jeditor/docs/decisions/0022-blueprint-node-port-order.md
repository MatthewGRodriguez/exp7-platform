# ADR 0022: Blueprint node family port order
Status: decided (2026-10-30)
Decision (Matthew: "ok" to the proposed order): port ranking_ui MODEL TOOLS (`ModelToolsScript`) node families in this order:
1. data, jfactor and board.emit, needed by the calendar and the board;
2. mech and econ;
3. chart/view/3D families last.
Each stage keeps `score.out`/`view.out` sinks and typed ports (`portTypeOf`/`canConnect`) as in the reference. See docs/design/06 (ADR 0019) and the 05 build order.
