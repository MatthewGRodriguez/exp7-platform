# 47 · Exp7: how outside processes connect to an atlas

Date: 2026-11-02 (CST). Status: research and proposal, stage 0; **P0 core and P1 CLI built and tested in atlas-sync-test (ADR 0111, commits ed1e778, 51e0461)** (answers spec 42 §9 open question 2).
Inputs: doc 42 §3.7 (process protocol), doc 43 (Artist's atlas/1 codec), doc 44 (proposal shape and replies), ADRs 0106–0108, and the working GitHub test `MatthewGRodriguez/atlas-sync-test` (`clients/client.html`, `docs/rest-sync-notes.md`, `docs/test-runbook.md`, `tools/mock_github.js`).

Legend: **[V]** verified (live GitHub test that Matthew confirmed, or current docs.github.com read 2026-11-02) · **[A]** assumed, needs a test.

An **outside process** is any program that is not the editor page itself: a Node or Python script, a shell job using `curl`, or an AI agent working through MCP tools, **run by a real person on their own dev computer**. Bots, services and CI jobs are out of scope on purpose (§3).

**Decision (Matthew, 2026-11-02):** the GitHub log is **the** transport for outside processes. This doc works out *how* it should work. Other transports get a short "why not" table (§6).

---

## 1. Summary of recommendations

1. **An outside process is just another writer.** It follows the same rules as the browser client: it writes only to its own public repo `<login>/atlas-sync-log`, adds new segment files `log/<writerId>/<seq>`, and reads peers with conditional GETs. The browser and processes share one protocol, with no special server side.
2. **Proposals are validated locally, then published.** No server judges a proposal. Each writer replays the merged log and applies the same rules (ops, all-or-nothing batches, ownership, revisions). A process must **validate before publishing**, and every reader must **re-validate on replay**. If a segment breaks a rule at its place in the order, every reader rejects it the same way, so everyone ends with the same atlas. That is how "changes must never fail" works without a server.
3. **One auth route only: the fine-grained PAT, exactly as tested.** The person creates it on their own account, Contents read/write, limited to their own `atlas-sync-log` repo, 30 days or less, and pastes it in themselves. Bots, GitHub Apps, Actions `GITHUB_TOKEN`, `gh` CLI tokens and unattended routes are out of scope on purpose (Matthew, 2026-11-02).
4. **Each process is its own writer.** Each process gets its own `writerId` and its own folder, and a sequence counter that only goes up, stored on disk. Resubmitting is safe because the segment path is the idempotency key: a PUT on an existing path fails and nothing is duplicated.
5. **Feedback is derived, not sent.** Nobody pushes `accepted`, `rejected`, `changed` or `overwrote` messages over the network. Every process computes them from the same deterministic replay, and the lib reports them through a local event API.
6. **Clocks.** Switch timestamps to a **hybrid logical clock (HLC)** before processes go live. Dev computer clocks drift, so with raw wall clocks skew could silently decide conflicts.
7. **Snapshots and compaction.** Each writer may compact only its own repo. The atlas snapshot is a cache that anyone can rebuild, and it never replaces the log. Keep segments ≪1 MB, and roll up a writer's old segments into "pack" files once its folder passes a threshold.
8. **Build order.** First a small shared JS core (`exp7-sync-core.js`) that the HTML page and a Node CLI both run. Then a Python port tested against the same golden vectors. Then an MCP tool wrapper. Test everything first against `tools/mock_github.js` on port 18799.

---

## 2. Transport recap (what is proven)

- Each writer owns a **public** repo `<login>/atlas-sync-log` and only ever **creates** files `log/<writerId>/<seq:6>.json` through `PUT /repos/{o}/{r}/contents/{path}` (one commit per batch) **[V]**.
- Readers poll each peer: `GET /repos/{o}/{r}/git/ref/heads/main` with `If-None-Match` (304 means nothing new). On a new sha they read `GET /git/trees/{sha}?recursive=1` and then fetch the unseen blobs with `GET /git/blobs/{sha}` (blobs never change, so they cache forever) **[V]**.
- Merge order: `(ts, writerId, seq, repo)`. Replay always starts from the seed. `set`/`ref` are last-write-wins, `delta` adds, an `add` of an existing member is a no-op, and a `remove` of a missing member is a no-op **[V]**.
- Codec hooks `encodeSegment/decodeSegment/encodeSnapshot/decodeSnapshot` default to JSON. The Artist's atlas/1 binary codec plugs in here (doc 43).
- Limits: anonymous 60 req/h per IP, and anonymous 304s count. Authenticated: 5,000 req/h per user, shared by all of that user's tokens and processes, and 304s with auth are free. Secondary limits: ≤80 content-creating requests per minute and ≤500 per hour, ≤100 concurrent requests, and about 1 s between writes is advised. The Contents API is comfortable up to 1 MB **[V-docs]**. Sources: [rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), [best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api), [contents](https://docs.github.com/en/rest/repos/contents).

---

## 3. Auth: the fine-grained PAT, exactly as tested

**Decision (Matthew, 2026-11-02):** cross-process connection is for real people on dev computers, so there is exactly one auth route **[V]**:

- **Token:** a fine-grained personal access token ([docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)), never a classic PAT.
- **Whose:** created by the writer on **their own** GitHub account.
- **Scope:** Only select repositories = the writer's own `atlas-sync-log`. Permission: Contents read/write. Nothing else.
- **Expiry:** 30 days or less.
- **How it gets in:** the person pastes it in themselves (page field, or the CLI prompt / env var `ATLAS_TOKEN` for that session). It is never stored in a repo.
- **Budget:** every process of that person shares their 5,000/h authenticated budget.
- **MCP:** an AI agent working through MCP tools (§5.6) uses the MCP server process that holds **the person's own token**. The model never sees it.
- **Read-only:** no token needed (public repos), but 60/h anonymous only allows slow polling (≥72 s × number of repos).

**Out of scope on purpose.** Bots, GitHub App installation tokens, Actions `GITHUB_TOKEN`, `gh auth token` shortcuts, and unattended or scheduled-planner routes. Bots will not do cross-process work on non-dev machines, so these routes are left out deliberately. They are not a gap to fill later.

**Security notes.** (1) A token can only write to its own account's repos **[V]**, so a leaked process token puts only that writer's log at risk. (2) A log repo owner can write any folder name in their own repo, so readers must **bind writerId to repo**: accept `log/<w>/…` only from the repo registered for `w` (peer list entry `owner/repo#writerId`). (3) Never log tokens, and mask them in diagnostics (the client already does). (4) Revoke the token on GitHub when it is no longer needed, or let it expire (≤30 days). (5) Segment content is public, so don't put secrets in atlas data.

---

## 4. What a process must implement (minimal spec)

### 4.1 Segment format (v3, proposed; v2 is what client.html writes now)

```json
{"v":3,"atlas":"<atlasId>","dict":"<dictionaryId>","schema":"exp7/1",
 "writer":"mattrod.cli","seq":42,"hlc":"1793678400123-0003-mattrod.cli",
 "ts":1793678400123,"createdAt":"2026-11-02T22:00:00.123Z",
 "batchId":"mattrod.cli:42","base":{"items/a/values/start":"alice:17"},
 "ops":[{"op":"set","path":"items/a/values/start","value":"2026-11-03"}],
 "note":"plan from my script"}
```

- **Path** `log/<writerId>/<seq:6>.json` (or `.bin` with atlas/1). Path, `writer` and `seq` must match. If they don't, readers ignore the segment and report it.
- `ops`: 0..5000 items, each one of `set | delta | add | remove | ref`, using the doc 42 §3.7 path rules. An empty batch is allowed (it is a heartbeat or claim).
- `base` (optional): the revision of each path the process read before writing. It is used for the `overwrote` report and does not block anything (see 4.3).
- `dict`: the dictionary id the batch was encoded against. It is fixed for the life of the container (ADR, doc 43). A segment with a different `dict` is rejected `dict-mismatch`.
- Size: keep each segment **≤256 KB**. A batch that won't fit is split *only* if the process accepts losing all-or-nothing across the split. Otherwise it stays one segment, up to the ~1 MB comfort limit. 5000 ops of normal size fit comfortably **[A: measure with atlas/1]**.

### 4.2 Ordering

- Sort key: `(hlc, writerId, seq)`. An HLC is `max(wallclock, highest hlc seen in any segment + 1 tick)`. It is persisted locally and only goes up. This keeps "I saw your edit, then I changed it" in the right order even when clocks are skewed. Plain `ts` stays in the segment as a fallback for v2 readers.
- A writer's own `seq` starts at 1 and only goes up, with no gaps. A gap means a segment is missing or still being written: readers apply up to the gap and wait (the `pending-gap` status).
- Late segments (from a peer that was offline) slot into place on replay, and the derived events report what changed retroactively.

### 4.3 Validation and rejection (deterministic, done by every reader)

Replay applies each segment in order as **one all-or-nothing batch**:
- If any op fails a rule (`missing-path`, `missing-parent`, `type-change`, `not-number`, `not-owner`, `dict-mismatch`, `bad-op`, `batch-too-large`), the **whole segment is skipped**. The rejection record is `{batchId, op:<index>, path, reason}`. Every reader produces the same record, because the inputs and order are the same.
- **Staleness is not a rejection.** Under "latest accepted wins" (ADR), a `set` with an old `base` still applies. The writer whose value was replaced gets an `overwrote` event. (This revises doc 42 §3.7 rule 3 `stale` and matches the decided last-write-wins. Decided by Matthew, see §8 Q1.)
- **Ownership by acting:** the owner of a path is the writer of the last *accepted* op on it, and there are no locks. What `not-owner` means then needs Matthew's answer (§8 Q2). The recommended default is: `not-owner` never fires on its own. Ownership is only *reported* (who owns the path now, and who you overwrote).
- A process **must run the same validator before publishing** and must not publish a batch that fails locally. The remaining risk is a batch that was valid when written but becomes invalid at its place in the order, for example because a peer removed the parent first. That batch is cleanly rejected and nothing is lost: the segment stays in the log, can be inspected, and can be re-proposed.

### 4.4 Revisions and reports

- Revision of a path = `writer:seq` of the last accepted op on it (as in client.html's "Revisions / owners per path" table).
- Derived events after each replay, delivered locally (as callbacks in JS, as JSON lines on the CLI's stdout):
  - `accepted {batchId, revs:{path:rev}}`. An own batch counts as accepted once it is confirmed in the replay.
  - `rejected {batchId, op, path, reason, currentRev}`
  - `changed {paths:[...], by:writer, fromRev, toRev}`
  - `overwrote {path, yours:rev, theirs:rev, by:writer}`: your accepted value was replaced by a later one, or a late segment sorted ahead of yours.
- Status of an own batch: `queued → written (PUT 201) → confirmed (seen in replay) → accepted | rejected`.

---

## 5. Process contract

### 5.1 What a process may do
1. **Read the atlas**: load the snapshot (if there is one) and replay the logs from all repos in its peer list.
2. **Subscribe**: poll heads and receive derived events. Default poll every 10 s when authenticated. Nothing faster than 5 s.
3. **Propose batches**: validate locally, assign the next seq, and PUT one segment to its own repo.
4. **Compact its own repo** (§5.5).
It may **not** write into another writer's repo or folder, rewrite or delete published segments (except through compaction), or change the dictionary.

### 5.2 Identity
- `writerId` = `<login>` for the person's page, and `<login>.<process>` for processes (`mattrod.cli`), matching `[a-z0-9._-]{1,64}`. **One writerId per running process instance.** Two processes must never share a writerId, because their seq counters would collide.
- A peer entry is `owner/repo#writerId[,writerId…]`. Readers accept only the listed writer folders from that repo.

### 5.3 Idempotency and resubmitting
- The segment path is the idempotency key. Retry the **same** bytes to the **same** path:
  - 201: written.
  - 422 "sha wasn't supplied" or "already exists" **[A: exact message]**: GET the file. If the bytes are identical, it was already written, so treat it as success. If they differ, this is a seq collision, which is a bug: stop and report it.
  - 409 (contention on the branch head): back off with jitter, then retry. Other writers can't touch your folder, so this is transient **[A: rate under contention, needs test]**.
- Resubmitting a *rejected* batch means a **new** seq with new content (rebased on the current state). Never reuse a seq.

### 5.4 Crash safety
- Local journal (`.atlas/<writerId>/outbox/<seq>.json` plus `state.json` holding `{nextSeq, hlc}`): write the segment to disk, then **fsync**, then bump `nextSeq`, then PUT, then mark it written.
- On restart, re-PUT every outbox entry not marked written (safe, see 5.3). Before using `nextSeq`, also list the own folder on GitHub: if the remote holds a higher seq (for example after the local disk was lost), continue after it.
- A writer never edits its published history. All recovery is "append the next seq".

### 5.5 Snapshots and compaction
- **Snapshot** `snapshots/<atlasId>/<hlc>.bin` plus `.meta.json` `{upTo:{writer:seq,…}, dict, schema, codec}`. Any writer may publish snapshots in its **own** repo as a speed-up. A reader may trust a snapshot from a writer it lists as a peer, or rebuild one itself. A snapshot never removes the need for the log. It only lets readers skip replaying the segments it covers.
- **Compaction (per writer, own repo only):** once a folder passes about 500 segments, roll segments 1..N into `log/<w>/pack-<first>-<last>.bin` with one Git Data API commit (blobs, then tree, then commit, then a fast-forward ref update), deleting the singles in the same commit. Readers treat a pack as the same segments. It only becomes visible after the atomic commit **[A: Git Data flow not live-tested]**.
- A batch that was rejected stays in packs (it is history). The codec may drop its ops and keep a tombstone `{batchId, rejected}` (§8 Q6).

### 5.6 MCP tool shape (for the Lore/living "process hands")
- `atlas_read {atlasId, paths?} → {revs, values, owners}`
- `atlas_propose {atlasId, ops, base?, note} → {batchId, status:"written", localCheck:"ok"|{op,path,reason}}`. It refuses locally if validation fails and never publishes an invalid batch.
- `atlas_status {batchId} → queued|written|confirmed|accepted|rejected {op,path,reason}` plus any `overwrote` events.
The MCP server is a normal outside process run by the person on their dev computer: it has its own writerId and outbox, and holds the person's own token. The model only sees tool results.

### 5.7 Versioning
- `schema` (`exp7/1`): op kinds and path rules. A reader that doesn't know a schema treats the segment as `rejected: unknown-schema` and keeps going. It never guesses.
- `dict`: fixed per container life. A new dictionary means a new `atlasId`, created by migration.
- `v` (segment envelope): readers must accept v2 (the current client) and v3.

---

## 6. Alternatives (why not chosen, plus local complements)

| Option | Why not the transport | Useful complement? |
|---|---|---|
| File/folder watch | Only works on one machine. The page can't watch files from a single HTML file without the File System Access API (Chromium only, needs a user gesture) | Yes: a local process can mirror its outbox into a folder for debugging |
| Localhost HTTP/WebSocket bridge | Needs a helper running locally. Chromium's Private Network Access rules and mixed content (an https page reaching ws://localhost) are moving targets **[A: not tested from file:// this session; Chromium treats localhost as potentially trustworthy]** ([MDN mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content), [PNA](https://developer.chrome.com/blog/private-network-access-update)) | Maybe later as a fast local path that publishes into the same log. Ports 8798/8799 |
| stdin/stdout subprocess | Can't come from the browser. Fine between processes | Yes: the CLI (§7) speaks JSON lines, so other programs can drive it |
| MCP server | It's a way to give a process tools, not a transport between machines | Yes: §5.6, layered on the GitHub log |
| WebRTC data channel | Needs signaling (a server, or a copy-paste offer). Both peers must be online. No durable log | No |
| BroadcastChannel / SharedWorker | Same browser and same origin only. file:// origins are opaque | Yes: keeps two tabs of the same page in sync instantly |
| Git push (clone + commit) | Needs git and a checkout, so it doesn't work in the browser. Creates the same objects as the API | Yes: allowed for processes if the file layout is identical (§8 Q7) |
| Hosted backend / queue | Breaks "no backend hosting" | No |

---

## 7. Staged build plan

| Step | Build | Test | Done when |
|---|---|---|---|
| **P0** | Pull the replay, validator, ordering and codec hooks out of `client.html` into `exp7-sync-core.js` (no DOM, runs in Node and the browser). Golden vectors: `vectors/*.json` (segments in, then expected values, revs, owners and events) | Unit vectors plus doc 44 synthetic proposals (`gen_synthetic_proposals.js --check`) | Page and Node give byte-identical replay output |
| **P1** | `atlas-cli.js` (Node, no deps): `read`, `watch` (JSON lines of events), `propose <file.json>`, `status`, with outbox/HLC/crash journal and token pasted by the person (prompt or session env) | Two processes against `node tools/mock_github.js --port 18799`: `test-valid-alice` page plus `test-valid-alice.cli` CLI. Cases: concurrent `set` on one path (gives `overwrote`), `add` merges, a batch made invalid by a peer's `remove` (rejected with op index and path), kill -9 between write and PUT (resubmit gives exactly one segment), `failPut409=3`, `fail403=2` backoff, revoked token (401, then stop) | All cases pass on the mock. No stray files. Ports 18799 only |
| **P2** | HLC + v3 segments + writerId↔repo binding in the core and page | Skew test: mock with one client's clock +120 s | Causal edits ordered correctly despite the skew |
| **P3** | Real GitHub: Matthew's account plus the second account, one page plus one CLI using a fine-grained PAT | Runbook extension of `docs/test-runbook.md`. Measure write→visible latency and the 409 rate | Latency and limits written into this doc |
| **P4** | Python port (`atlas_sync.py`) passing the same golden vectors. MCP tools wrapper (§5.6) | Vectors, plus one MCP-driven proposal on the mock | Three languages agree |
| **P5** | Snapshots + per-writer compaction (Git Data), plugging in the atlas/1 codec | Replay with snapshot equals replay without. Pack equals singles | Matches the doc 43 round-trip rules |

Keep jobs light (8 GB Mac): the mock and CLI are Node built-ins only, with no browsers in CI loops.

**Latency expectation:** write→visible = PUT time (about 0.5–1 s) + the reader's poll interval (10 s by default) **[A: propagation unmeasured, P3]**. This is fine for a person running scripts or an agent on their dev computer, not for live co-typing.

**Rate budget example:** one person running page + CLI + MCP agent on their dev computer, each polling 3 repos every 10 s, makes about 3,240 GETs/h. Most are 304s, which are free, so the real cost is only the changes. Writes: person-driven processes write in bursts, far below 80/min and 500/h. A script that loops should still batch and stay under roughly **one batch per 10 s sustained**.

---

## 8. Open questions for Matthew (decisions, with a recommended default)

1. **Stale `set`.** **Decided (Matthew):** no locks. The latest accepted write wins, and the replaced writer gets an `overwrote` notice. Doc 42 §3.7 rule 3 is updated to match.
2. **What does ownership block?** **Decided (Matthew):** nothing. Ownership = last active writer, reported but never blocking.
3. **Clock: adopt the HLC (v3) before processes write?** Default: **yes**, in P2, before any process writes for real.
4. **writerId per process: `<login>.<process>`, one per instance?** Default: **yes**. A peer list entry binds `owner/repo#writerIds`.
6. **Keep rejected batches in packs, or keep only tombstones?** Default: **keep them in full** until size becomes a problem. They are evidence.
7. **Allow plain `git push` writers (same layout)?** Default: **yes, for processes**. The API stays the reference.
8. **Snapshot trust: use a peer's snapshot, or always rebuild?** Default: **use a snapshot only from your own repo or a listed peer, and rebuild if its `upTo` doesn't match.**
9. **Max segment size: 256 KB soft, 1 MB hard?** Default: **yes. A batch never splits automatically.**
10. **Poll floor for processes?** Default: **10 s authenticated, 72 s × repos anonymous, never under 5 s.**

## 9. Unverified (to test)
Exact status codes for a PUT to an existing path and for branch contention; the Git Data fast-forward rejection; write→read propagation delay; file:// → ws/http://localhost behaviour in current Chrome/Safari (not tested in this round); atlas/1 segment sizes for 5000-op batches.
