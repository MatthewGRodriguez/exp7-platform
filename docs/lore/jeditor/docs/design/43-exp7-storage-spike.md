# 43 · Exp7 storage spike (copy)

> **Source:** Ash Tangent Residual Artist storage spike, Nov 2 2026. All measurements were taken on the box only; the code lives in the
> JRender repo (`/Users/[REDACTED-USER]/Home/Dev/JRender`). Measured on ranking_world `world.json` (1,286,262 B). This copy contains

> **Naming note (ADR 0106, 2026-11-02):** our container is now **atlas** (formerly world); `world.json` is now `atlas.json`. The body below is the Artist agent’s text as delivered and keeps its original “world” wording; the codec-side names change in sync on the Artist side (doc 46 §5).
> structure and totals only, no record contents. Direction adopted in `42-exp7-spec.md` §3.5 and ADR 0105.

---

# Exp7 world-format spike (box only)

Inputs: `world.json` (1,286,262 B) and `ranking_world.html` (1,429,636 B). Both are confidential and read-only, and they stay on the box. This report gives structure and aggregate numbers only, with no record contents. Scratch files are in `spike/work/`, which is box-only and has the same confidentiality. The prototype code is in `spike/work/sx/` (`enc2.js` and `dec2.js`).

## 1. Structure (no contents)
- The top level is a dict with these keys:
  - format, id, title (strings)
  - version (int)
  - items: dict, 879 records, 817 KB minified
  - joys: dict, 94 records, 16 KB
  - blueprints: dict, 16 records, 29 KB
  - components: dict, 74 records, 96 KB
  - root: 6 comp refs
  - clock: dict, 3 keys
  - topJoys: 1 entry
- Items share 2 top-level key sets: id, name, kind, alts, blueprint, factors, jreq, state and values.
  - `values` is a per-item map with 224 distinct keys, about 14 per item.
  - Values are nested up to 5 levels: lists of dicts, alt lists and amount and label rows.
- Blueprints have 209 nodes in total. Each node has an id, one of [REDACTED-AMOUNT] types, int x/y and a param dict that holds expression strings. There are [REDACTED-AMOUNT] wires, each a pair of from/to lists.
- Components hold item-ref lists, sub-component refs, view/style tokens and a bp ref.
- The tree holds:
  - 37,452 keys (1,638 distinct)
  - 20,113 strings (6,200 distinct)
  - 7,270 numbers. There are 0 integral floats and 0 integer-like keys.
- Byte split of the minified form: keys 285 KB, strings 535 KB, numbers 21 KB.
  - Repeated strings account for 235 KB.
  - [REDACTED-AMOUNT] strings are longer than 200 chars, 84 KB in total. These are prose and expressions.
- References: 2,669 strings carry the prefixes `item:`, `joy:`, `comp:` or `bp:`.
  - 2,590 of them resolve to an existing record key.
  - **79 dangling refs** point to nothing.
- There are 2,802 date-like strings.
- The `id` field always equals the record's map key.
- Formatting: the file is exactly `JSON.stringify(o,null,1)+"\n"`, and the same holds for Python `indent=1`. The 958,555 B minified form plus a re-stringify is therefore byte-identical. **327,707 B (25%) of the file is whitespace.**
- `ranking_world.html` breaks down as:
  - 8 KB of CSS
  - the world embedded verbatim as minified JSON (958,555 B)
  - 5 scripts
  - **the 166,029 B engine script, embedded twice** (`jfactor-worker` is identical to `jfactor`)
  - The shell without the world is 471 KB, or 305 KB once deduplicated.

## 2. Baselines (bytes)
| file | raw | gzip -9 | brotli 11 | zstd -19 | zstd --ultra -22 | xz -9e | **JRP** |
|---|---|---|---|---|---|---|---|
| world.json | 1,286,262 | 127,065 | 90,954 | 98,598 | 98,470 | 92,748 | **85,409** |
| world minified | 958,555 | 118,766 | 87,027 | 94,662 | 94,598 | 89,044 | **82,208** |
| ranking_world.html | 1,429,636 | 243,265 | 158,640 | 168,691 | 168,623 | 161,296 | **156,013** |

JRP on raw JSON already comes in 6% under brotli 11 and 8% under xz.

## 3. Structural encoding (JRB world-profile prototype)
The prototype works like this:
- A schema-path walk sends every value to a **column**, keyed by its generalized path. A dict with more than 64 distinct keys at a path is treated as a map (`*`). This gives 640 columns and 7 maps.
- Each column has a type-tag stream, a varint stream and a text stream:
  - The varint stream holds zigzag ints, lengths, field-key ids and string back-refs.
  - The text stream holds new strings (NUL-terminated) and floats as JS shortest text.
- Strings are deduplicated per column, with a global fallback.
- Refs become (kind, index into the target map's key order).
- The key lists of the target maps go in the header, so record ids are stored once.
- All substreams of each kind are concatenated, which gives 4 streams: hdr, tag, u, txt. Each one is JRP-packed.
- **Lossless:** the round trip reproduces world.json **byte-identically**. This was verified for map thresholds 16, 64, 300 and 1e5.

| variant | hdr | tag | u | txt | total JRP |
|---|---|---|---|---|---|
| raw-in bytes, T=64 | 64,915 | 43,326 | 75,049 | 272,425 | 455,715 |
| JRP per stream, T=64 | 9,077 | 3,015 | 17,436 | 54,484 | **84,012** |
| JRP of the 4 streams concatenated | | | | | 83,483 |
| T=16 / T=300 / no maps (sum) | | | | | 85,881 / 85,982 / 134,226 |

**Finding:** for size, the structural transform is a wash against JRP on minified JSON (83.5 KB vs 82.2 KB). The CM model already learns JSON syntax and keys.

The gain is elsewhere: the bytes the CM has to model drop from 958 KB to 456 KB. Decode time scales with those bytes, so **decode is 2.1x faster**, and the 4 streams can be decoded in parallel. Rebuilding the object tree and stringifying from the streams takes about 40 ms (JSC, JIT or not), so it is negligible.

## 4. Decode time and memory
| what | JSC JIT | JSC --useJIT=0 | Chrome turbo | Chrome liftoff-only 1x | **liftoff 6x** |
|---|---|---|---|---|---|
| raw min.json.jrp (958 KB out) | 545 ms | 16,836 ms | 529 ms | 896 ms | **5,923 ms** |
| structural, 4 streams, serial | 248 ms | 8,251 ms | 240 ms | 522 ms | **2,755 ms** |
| structural, 4 workers (wall = txt stream) | ~151 ms | ~4,891 ms | 144 ms | 338 ms | **~1,632 ms** |
| + tree rebuild and stringify | +40 ms | +40 ms | | | |

- Throughput: about [REDACTED-AMOUNT] µs/B with JIT, [REDACTED-AMOUNT] µs/B at liftoff 6x and [REDACTED-AMOUNT] µs/B with no JIT (one byte is 8 bits).
- **Peak memory:**
  - Each decoder instance uses 9.8 to 11.7 MB of wasm linear memory. The model tables are fixed, plus the output.
  - The JS heap is about 5.8 MB while rebuilding and 4.6 MB for the retained tree.
  - That makes about 18 MB single-threaded, or about 45 MB with 4 workers.

**Random access by record (indexed chunks: a meta chunk with joys, blueprints and components, plus item chunks; the offset table is an item-index-to-chunk map, about 1 to 2 KB)**

| chunk target | chunks | total JRP | vs whole |
|---|---|---|---|
| 16 KB | 49 | 124,130 | +51% |
| 32 KB | 27 | 107,310 | +31% |
| 64 KB | 14 | 98,716 | +20% |
| 128 KB | 8 | 91,675 | +11.5% |
| 256 KB | 5 | 88,674 | +8% |

Cost to read one item record, which means decoding one chunk:

| chunk | JIT | no-JIT | liftoff 6x |
|---|---|---|---|
| 64 KB chunk | 46 ms | 1,206 ms | 422 ms |
| 128 KB chunk | 75 ms | 2,429 ms | 785 ms |
| meta chunk (141 KB), only if needed | 84 ms | 2,560 ms | 846 ms |

Chunks lose cross-chunk context. That costs 11 to 20% in size at the useful sizes.

## 5. Mutable store: snapshot plus append-only log
This used synthetic proposals `{proc, baseRev, writes:[{path,op,value}]}` with 1 to 4 writes each. 90% are `set` on random real leaf paths, using plausible values drawn from the file's own value pools. 10% are `add` of a whole item record. Being drawn from the file's own pools makes them optimistic for priming.

| N proposals | raw log | JRP log alone | B/proposal | JRP log primed by snapshot | B/proposal |
|---|---|---|---|---|---|
| 1 | 789 | 403 | 403 | 57 | 57 |
| 10 | 3,972 | 1,351 | 135 | 298 | 30 |
| 100 | 31,964 | 6,045 | 60 | 1,784 | 18 |
| 1000 | 375,848 | 40,187 | 40 | 13,321 | 13 |

- **Append** in memory: applying 1,000 proposals to the tree takes 3.8 ms, and re-serializing takes 6.4 ms. An append is an O(1) JSONL line.
- JRP cannot append to a finished stream. The log is therefore packed in blocks: a block stays raw until it is sealed, or the whole log is re-packed on export.
- **Compaction** of the snapshot plus 1,000 changes, done natively:
  - structural encode: 229 ms
  - 4 streams packed and verified in parallel: 509 ms
  - result: 94,074 B (it grew because about 100 whole items were added)
  - In a browser this needs a **wasm encoder**, which does not exist yet. The CM is symmetric, so I estimate it costs about the same as decode: about [REDACTED-AMOUNT] to 0.3 s with JIT and about 2 to 3 s at liftoff 6x.
- **Per-path revisions:** there are 37,005 leaf paths, and 794 were touched by 1,000 proposals.
  - A sparse table of (leaf-index delta, rev) varints is 1,611 B raw, 761 B packed.
  - A dense byte-per-leaf table is 37,005 B raw, 752 B packed.
  - Untouched paths cost about 0: the implicit rev is the snapshot rev. **That is about 1 B per touched path.**

## 6. Text and long strings
The txt stream is 272 KB in and 54.5 KB out. It is 65% of the packed size, so text dominates the world and geometry is irrelevant here.

Cheap lossless model tweaks, measured with a box-only copy of the codec at /tmp/pw:

| variant | world min | world.json |
|---|---|---|
| M7 baseline | 82,208 | 85,409 |
| word-hash context (letters since the last non-letter, plus the previous word, times order-1) replacing the stride-4 f32 context | 81,303 (-1.1%) | 84,535 |
| + JSON key context (hash of the last key, times order-2) replacing order-0 | **[REDACTED-AMOUNT] (-[REDACTED-AMOUNT])** | [REDACTED-AMOUNT] |

These contexts replace the stride-4 one that geometry and wasm use, so they should be **switched per profile** with a header flag, not changed globally. Worth having, but small. The match model and dedup already catch the repeated strings.

## 7. Single-HTML export estimate (basE91 = 16/13 expansion, plus the 6,976 B stage0 wasm and about 1.5 KB of bootstrap)
| variant | packed | as basE91 | HTML est. | vs 1,429,636 |
|---|---|---|---|---|
| world and app shell (deduplicated) packed separately | 151,077 | 185,941 | **~196 KB** | 13.7% (7.3x smaller) |
| one combined stream | 152,989 | 188,295 | ~198 KB | 13.9% |
| combined + text contexts | 151,826 | 186,863 | ~197 KB | 13.8% |

- For reference, the original compresses to 243,265 B with gzip and 158,640 B with brotli.
- The estimated file is **0.81x the size of gzip**, which means smaller. It is **1.24x the size of brotli**, which means larger, because of the text-safe embedding.
- Brotli and gzip only apply in transport. A file opened locally on iOS is [REDACTED-AMOUNT] MB today and would be about 196 KB.
- Separately, removing the duplicated 166 KB engine script saves 166 KB raw (35% of the shell) even without packing.

## Recommendation
1. Adopt the **JRB world profile as a columnar structural container plus JRP per stream**. It gives:
   - byte-identical round trips
   - the same size as raw-JSON JRP (within 1.5%)
   - **2.1x less to decode**, with streams decoded in parallel, so about 1.6 s at liftoff 6x
   - a natural home for ids and refs as indices, a key dictionary and a revision table.
2. For mutability, use a **snapshot plus an append-only JSONL proposal log**:
   - Store the log raw in the live file.
   - On export, pack it primed by the snapshot, which is about 13 to 30 B per proposal.
   - Compact at export or when the log grows past roughly the snapshot's packed size (about 85 KB, or about 3,000 proposals).
   - Keep sparse per-path revisions at about 1 B per touched path.
3. Treat random access as optional:
   - Whole decode is already [REDACTED-AMOUNT] s (JIT) to 1.6 s (liftoff 6x).
   - If needed, use 128 KB record-group chunks (+11.5% size, 75 ms or 0.8 s per record).
   - Lazy-loading items alone is not worth +20% size.
4. Add a profile flag for the word/key contexts (-1.2%) when there is spare capacity. This is not urgent.
5. Fix the duplicated engine script in the export generator regardless (-166 KB raw).

## Open questions
- No-JIT decode is still about 4.9 s with 4 workers (16.8 s serial). Is lockdown mode or no-JIT a real target for world files? If it is, the snapshot needs a lighter mode, such as an order-2 model only.
- An in-browser compaction or export needs a wasm *encoder*. That means about +7 KB of code, or the export ships the raw log.
- Should the 79 dangling refs be valid? The format must keep them as plain strings, which the prototype does.
- `bp:` is still in v5. Should refs be normalized to one map (bp to blueprints) in v6?
- Should dates get a typed column? The 2,802 date strings are currently text, and they already compress well.
- Proposal priming is optimistic, because the synthetic values come from the file's own pools. This needs re-measuring on real proposal traffic.
- How does map-vs-field classification (threshold 64) stay stable under edits? It should be pinned in the schema or header, not inferred on each export.

---

## Proposed `format/JRB.md` section: World profile (requirements)
*Draft only. This is not applied to the repo.*

**W1 Container.**
- Profile id `world/1`.
- Header: magic, profile, flags (text contexts on/off), map-path list, target-map key lists, and a column table (path plus per-substream lengths).
- Payload: the substreams `tag`, `u` (LEB128 varints, zigzag ints), `txt` (UTF-8, NUL-terminated) and `hdr`. Each is JRP-packed independently so they can be decoded in parallel.

**W2 Lossless.**
- Decode must reproduce the source JSON value exactly: key order, number values (JS shortest float text) and strings.
- For a canonical source, `JSON.stringify(v,null,1)+"\n"` must be byte-identical. The test suite asserts this round trip.

**W3 Types.**
- Tags: null, false, true, int (≤2^52 and not -0), float (text), string-new, string-backref (per column, with a global fallback), object (count plus key ids, or map keys via a `#` column), array (length) and ref(kind).

**W4 References.**
- `item:`, `joy:`, `comp:` and `bp:` strings that resolve are stored as (kind, index into the target map order). Unresolved refs stay strings.
- Record ids are stored once, in the header key lists.

**W5 Columns.**
- A column is the generalized schema path.
- Map-vs-field classification is explicit in the header. It must be stable across exports: pinned, not re-inferred.

**W6 Revisions.**
- There is an optional sparse revision table of (leaf-index delta, rev) varints, JRP-packed.
- Absent means rev = snapshot rev.

**W7 Change log.**
- There is an optional append-only log of proposal records `{proc, baseRev, writes:[{path, op:add|set, value}]}`, stored as JSONL.
- On export it is packed as a JRP stream primed by the decoded snapshot.
- Compaction = apply log, re-encode, clear log, bump snapshot rev.

**W8 Random access (optional).**
- A record-group chunk mode: a meta chunk plus item chunks of about 128 KB raw, with an item-to-chunk offset table.
- The default is a single snapshot.

**W9 Budgets (from this spike, ~1 MB world).**
- packed ≤ raw-JSON JRP + 2%
- full decode ≤ 2 s at liftoff 6x with ≤4 workers
- peak memory ≤ 50 MB
- revision cost ≤ 2 B per touched path
- log ≤ 40 B per proposal unprimed

**W10 Confidentiality.**
- World files are user data. Tooling must never log values. Diagnostics report only structure and aggregates.
