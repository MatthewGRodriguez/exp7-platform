# Exp7 WASI 0.3 eval continuation

## Done
- WIT `exp7:eval/engine@0.1.0` expanded: math, run-case, score-item, pick-alts, occurrences, charges, day-map, ledger, walk-one, circuit-parse, circuit-score-blueprint
- Faithful ports from atlas/eval.js + atlas.js pickAlt + circuit_lang score lowering
- **User selection independent of Best** (user-ne-best golden)
- **scoreItem via blueprint outs.score** (not -cost-only toy); alts fixtures still accept -cost fallback when no blueprint
- Goldens **20/20 PASS** (Wasmtime p3 host)

## Omissions (not full atlas/eval.js)
- formula node (paid/grank/hshare/gsum/gmax/linked/via/compile full)
- deps/SCC computePass scheduling + apply conflict path parity beyond simple pending
- proposal `on` circuit rules / sync proposal checker
- async Best (`best_async.js`) — host/JSPI concern
- itemFlags / conflicts dayMap measure
- moneyPreset / calendarTemplate end-to-end world JSON interchange (WIT JSON parsers are fixture-oriented)
