# Fish compression baseline: chars typed (stage 8, measurement only)

No format is locked in; this is input for the format discussion with Ash Tangent Residual Agent / Training Days Designer.

**Primary metric: plain ASCII characters typed** into td.js / td.css (body inside a JS template literal, plus its 2 backticks, plus any decoder code). Served gzip/brotli bytes are secondary. Every row below was decoded in Node 20 and its sha256 compared against the target text (`chars/table.py`, results in `chars/table_results.json`).

Corpus (copied read-only from the Mac's `07_finalize/dist`): `fish.svg` 95,094 (inside `swim-fish-assets.json`), `fish-anim.json` 7,607, `fish-clips.json` 16,978, `swim-fish.min.js` 33,951 bytes (33,470 ASCII chars without its 475-char license comment, which holds the only 3 non-ASCII chars).

## 1. Fish art (fish.svg), ranked by chars typed

Fidelity: *byte-identical* = decodes to today's fish.svg exactly. *Own canonical* = decodes byte-identically to a re-minified canonical SVG (A1/A2); A1 renders pixel-identical to the source, A2 snaps 837 one-decimal coords to integers (mean render diff 0.02/255, max 7/255 at 485 px wide).

| rank | variant | chars typed | body | decoder | fidelity | round-trip | decode (node) | served gz / br |
|---:|---|---:|---:|---:|---|:-:|---:|---:|
| 1 | A2 ascii85(deflate(packed)) | **28,868** | 28,105 | 763 | A2 canonical | OK | 78 ms | 23,393 / 23,040 |
| 2 | A2 ascii85(deflate) | **31,164** | 30,899 | 265 | A2 canonical | OK | 67 ms | 25,267 / 25,002 |
| 3 | A1 ascii85(deflate) | **31,687** | 31,422 | 265 | pixel-identical (own canonical) | OK | 69 ms | 25,690 / 25,424 |
| 4 | A0 ascii85(deflate(packed)) | **32,109** | 31,346 | 763 | byte-identical to source | OK | 70 ms | 26,013 / 25,727 |
| 5 | A2 pack+LZ | **32,934** | 32,129 | 805 | A2 canonical | OK | 46 ms | 23,905 / 22,721 |
| 6 | A0 ascii85(deflate) + DecompressionStream | **33,700** | 33,435 | 265 | byte-identical to source | OK | 62 ms | 27,319 / 27,057 |
| 7 | A1 pack+LZ | **34,926** | 34,121 | 805 | pixel-identical (own canonical) | OK | 81 ms | 25,041 / 23,646 |
| 8 | A0 base64(deflate) + DecompressionStream | **35,028** | 34,881 | 147 | byte-identical to source | OK | 66 ms | 26,586 / 26,399 |
| 9 | A0 source pack+LZ | **38,723** | 37,918 | 805 | byte-identical to source | OK | 91 ms | 27,441 / 25,423 |
| 10 | A2 number-packed | **51,561** | 51,064 | 497 | A2 canonical | OK | 12 ms | 23,121 / 21,069 |
| 11 | A0 source + LZ | **54,180** | 53,873 | 307 | byte-identical to source | OK | 228 ms | 34,932 / 31,364 |
| 12 | A2 integer grid text | **79,643** | 79,643 | 0 | visually identical, meanAbs 0.02/255 | OK | 0 ms | 26,017 / 21,988 |
| 13 | A1c + style attrs as classes | **81,225** | 81,225 | 0 | pixel-identical (own canonical) | OK | 0 ms | 26,912 / 22,599 |
| 14 | A1 exact-geometry minimal text | **88,870** | 88,870 | 0 | pixel-identical (own canonical) | OK | 0 ms | 26,315 / 22,237 |
| 15 | A0 source verbatim | **95,096** | 95,096 | 0 | byte-identical to source | OK | 0 ms | 28,987 / 23,370 |

What the steps buy (fish.svg):
- **Re-minifying the path text** (shorter of abs/rel per segment, minimal number text): 95.1k → 88.9k, pixel-identical. Moving style attributes to 153 classes in an inline `<style>` gives 81.2k (it must live in the SVG/shadow root; td.css can't reach into the shadow DOM). The integer grid gives 79.6k.
- **Coarser grids don't pay**: step 2/4/8 (with a scale wrapper) reach 76,171/74,194/72,657 chars but visibly damage the art (0.789–5.625% of pixels change by >16/255). The paths are already relative with 1–2 digit deltas.
- **Deduping exact repeated paths** saves only 129 chars (1 duplicate of 379 paths). The near-repeats (rest/chase/arrive shading bands) are what LZ captures.
- **Number packing**: 23,626 path numbers, 89% within ±40, become 1 char each (2–3 for big values; decimals kept literally), with an 80-symbol alphabet that is safe in templates and attributes. The decoder regenerates the canonical separators, which stores the exact number formatting losslessly (it also restores source quirks like `-0.4`).
- **Tiny LZ77** (2-char offsets, 1-char lengths, `!` marker, 307-char decoder) on top of packing.
- **Native inflate**: a zopfli raw-deflate stream as base64 or ASCII85, decoded by `DecompressionStream('deflate-raw')` (147/265-char decoders). Contrary to the expectation that blobs lose, this **wins**, because the browser's inflater costs no typed chars. ASCII85 needs about 730 backslash escapes inside a template literal (counted); a Z85-style alphabet without `\` would remove them for about +80 decoder chars (not built).

## 2. Motion (idle swim cycle: 5 fin rotations, body bob/tilt, drop shadow, eye squash/blink)

| form | chars typed | fidelity |
|---|---:|---|
| JSON data as today (fish-anim.json) | 7,607 | source |
| B1 CSS @keyframes, all 49 keys per track | 10,324 | all 504 key values verbatim |
| B2 CSS 2-key `alternate` + easeInOutSine, phase via negative delay | 1,297 | ≤0.079° fin error (curve error 0.2% of amplitude); eye reduced to 11 keys |
| **B3 tiny JS loop** (sine table + rAF, eye as an int array) | **726** | regenerates every key value; exact to 3 dp with a 151-char residual table (16 values off by 0.001 from the original export's rounding); verified OK |
| body bend as CSS `d:path()` keyframes (estimate, 8 keys) | ~19,520 | CSS can't compute it; JS bend warp is a few hundred chars of code |

Chase is exact sines too (fit error ≤0.0005°), so it belongs in the same JS table. Arrive (free-form, 2.8k chars JSON) and turn keys (10.4k chars of matrices) stay data. Follow, turn and arrive behaviour needs JS regardless. LZ on fish-clips.json: 16,978 → 7,837 (+307 shared decoder, round-trip OK).

## 3. Off-the-shelf byte baselines (bytes, secondary; all round-trip OK)

```
file                          raw    gzip9   zopfli     br11   br11lw   zstd19   zstd22 zstd22+D     xz9e    bzip2
fish.svg                    95094    28974    26221    23383    23384    25959    25959    25287    23964    24827  roundtrip=OK
fish-anim.json               7607     2464     2268     1922     1923     2280     2280      397     2240     2310  roundtrip=OK
fish-clips.json             16978     4577     4198     3655     3656     4184     4184     2143     4032     4044  roundtrip=OK
swim-fish-assets.json      123162    36112    32515    28938    28939    32359    32359    28384    29788    31423  roundtrip=OK
swim-fish.min.js            33951    12625    12256    11484    11485    12242    12242    12175    12160    12389  roundtrip=OK
dict size: 16384 B (must also be shipped; trained on this corpus)
```
zstd's dictionary was trained on this same corpus (optimistic) and costs 16 KB to ship. Context-mixing (paq8px/cmix) was dropped after the steering change: no browser decoder exists, and a JS port would cost far more typed chars than it saves.

## 4. Shortlist for the format discussion

1. **ASCII85 (or base64) of a raw-deflate stream + native `DecompressionStream`.** Fewest chars for an exact source: 33,700 (32,109 with number packing first; base64 35,028). Decoder 147–265 chars, about 60–70 ms. Risks: async; needs DecompressionStream inside the Slate sandbox (Chrome 80+, Safari 16.4+, Firefox 113+); the body is opaque, and a single typo kills the whole stream, so add per-line checksums (about 1–2% extra).
2. **Number packing + tiny LZ, pure JS, synchronous, no platform API.** 38,723 for an exact source, 34,926 pixel-identical, 32,934 integer grid. Decoder 805 chars, 45–90 ms. Tags, ids and classes stay readable, and a typo damages one region (though LZ back-references can spread it).
3. **Canonical minimal text, no decoder** (A1c 81,225 pixel-identical / A2 79,643). Readable, diffable, typo-local, about 2.4× the chars of option 1. This is the fallback if decoders or eval-free constraints rule out the others.

Regardless of art format: express motion as the **JS loop (726 chars)** rather than CSS keyframes (10.3k exact / 1.3k approximate), and drop fish-anim.json from what gets typed. The engine code (33,470 chars minified) is now the second-largest item. LZ-packing code (20.8k) would need `eval`/`new Function`, which may be blocked in Slate, so a slimmer hand-written engine is likely the better lever there.

Files: `corpus/` (inputs + SHA256SUMS), `chars/` (generators: svgmin.py, variants.py, pack.py, lz.py, srcpack.py, wrap.py, motion.py, table.py; outputs: out_A*.svg, packed_*, decoder_*.js, B1.css, B2.css, B3.js, *_results.json), `out/baselines.txt`, `baselines.sh`.
