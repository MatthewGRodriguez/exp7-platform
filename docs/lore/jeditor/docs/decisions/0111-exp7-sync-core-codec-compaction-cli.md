# ADR 0111: Exp7 sync core, opt-in binary codec, per-writer compaction, CLI (doc 47 P0/P1)

Status: built and tested in `MatthewGRodriguez/atlas-sync-test` (commits ed1e778, 51e0461), 2026-11-02. Defaults are recommended and can be changed.

## Decision
- `clients/exp7-sync-core.js` is the single implementation of op rules, the LWW order `[ts, writer, seq, repo]`, replay/events, the codec hooks,
  packs and snapshots. It is inlined into `client.html` (single-file page) and `require`d by `atlas-cli.js` and the tests.
- The Artist's atlas/1 binary codec is **opt-in** (checkbox or `?codec=bin`), and JSON stays the default. Readers load the codec when they meet a
  `.bin` segment. The 0.5 MB codec bundle is **not committed** to the public repo, because it is the Artist's code.
- Conflicts: last write wins, decided by the deterministic order. The loser gets `overwrote {yours, theirs, by}` and the winner gets `changed {path, from}`,
  including retroactive reports when a late segment sorts in front.
- Compaction is per writer and manual only (auto is off; a suggested threshold of 500 segments if it is ever enabled). It packs own contiguous segments
  into `pack-<first>-<last>` in one fast-forward Git Data commit. Packs stay under 256 KB soft and 1 MB hard, and nothing is ever auto-split.
- A snapshot is a cache (`snapshots/<w>/snap-N`). It is used only on request (`?usesnap=1`), trusted only from repos being read,
  and dropped if a late segment sorts inside it.
- `atlas-cli.js`: `status/read/watch/propose/flush/digest`. The token comes from env `ATLAS_TOKEN` only. The outbox and journal live in a state dir.
  The CLI validates locally before writing, and a same-seq re-send counts as already written.

## Consequences
- Tests: core 25/25, e2e 48/48 (unchanged), e2e_more 23/23 (conflict, codec, compaction, snapshot, page vs Node byte-identical),
  page+CLI 11/11. All run against the mock on port 18799. Real-GitHub steps are in `docs/test-runbook.md` §8 and have not been run.
- A 5000-op JSON segment is 391,865 B (over the soft limit, allowed). The same segment in atlas/1 is 9,721 B.
