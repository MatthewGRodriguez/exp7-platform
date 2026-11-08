# Artist ↔ JRender / animation workflow — historical context

Compiled 2026-11-08 by Grok Bot from durable memory, box artifacts and one archived Artist report. **The Artist was not contacted.** Nothing here is a new agreement.

Evidence labels:
- **[ARTIST-REPORT]**: text the Artist sent, archived on the box
- **[REQ]**: Matthew's stated requirement (from memory)
- **[DOC]**: delivery or coverage documentation written by Grok Bot's agents
- **[TEMPLATE]**: the reusable workflow template; it does *not* prove a step was executed
- **[OPEN]**: unresolved

## 1. Who does what
- **Ash Tangent Residual Artist** ("the Artist") is Matthew's animation agent. It runs the pipeline: Affinity draw → Moho Pro animate → Blender light and position → Moho Pro final animate, then a web player. [REQ 2026-10-03/10-17]
- Blender and Moho run headless on Matthew's Mac through a CLI. Pipeline orchestration and builds ran on the box. [ARTIST-REPORT 2026-10-30]
- On 2026-10-03 Matthew paused Blender renders on his Mac until further notice because the machine was overloaded. That was an operating note at the time, not a lasting project rule.
- **JRender** is the Artist's renderer. Since 2026-11-03 it is part of Exp7: all Exp7 views are drawn by the real JRender, never by a reimplementation, and there is no fallback renderer. [REQ]

## 2. Animation workflow (from the Artist's TDD report, 2026-10-30)
Source: `tdd-animation/tdd_animation_workflow_from_artist.md`. The received message was cut off at the start of its "quality gates" section. The full gate list exists only in the derived README and template.

**Pipeline stages:** draw → state table (the single source of truth) → perspective/frustum gate → Blender (one top area light plus caustics) → trace lighting fits → Moho keys and preview GIFs → generated web CSS and JS → pack → QA. [ARTIST-REPORT]

**Fixed parameters:**
- One area disk light: azimuth 90 (up the screen), elevation 50, size 300 px, caustics on.
- 85 mm frustum.
- Click-path transitions ≤ 120 ms.
- Tilts under 5° emit no lighting change.
- Shadow offset 0.79 px and blur 0.93 px per px of lift.

**Player contract (SM1b):**
- A `data-sm` state attribute plus `--sm-ms` / `--sm-ez` timing properties.
- States: idle, hover, pressed, focus, selected, dragging, invalid, settling.
- Motion is CSS only. No requestAnimationFrame at idle; rAF only coalesces pointer and scroll input.
- Reduced motion turns everything off, and a hidden tab pauses.
- Two baked shadows are crossfaded.

**Lessons measured:** two animations on one property force the main thread (about 60 recalcs/s), and per-element loop restarts are costly.

**Scope notes:** the TDD packing and hand-typing limits are specific to TDD (the Slate app). The report says they do **not** apply to single-HTML outputs such as JEditor or Exp7. The engine design, state table and gates do apply.

**The template is not evidence:** `workflow-template/ui-motion-art-pipeline.md` is a reusable process template, saved as a skill. It does not prove which stages ran for any particular Exp7 candidate. [TEMPLATE]

## 3. Renderer architecture and contracts [DOC]
- **Format and ABI:** `jrender-exp7/format/JRB.md` covers:
  - JRB scene format v0 to v2 (paths, paints, nodes, a STATES section derived from pipeline2 `states.json`, timeline, layers);
  - DL draw lists, JRDP patches, JRF vector fonts;
  - the core wasm host ABI (no wasm-bindgen, no WASI imports);
  - a 2026-11-06 WASI target note.
- **Delivery path today:** core wasm (`wasm32-unknown-unknown`, 0 imports) plus a thin `jrender.js` host for WebGPU, events and rAF. A WASI 0.3 component path was explored in `wasi03_*` but is not shipped. (`EXP7_JRENDER_COMPARE.md`, `wasi03_component/*`)
- **Exp7 additions:** `API.md` and `CHANGES.md` list them: tessellator, hit ids and event queue, nested scroll/clip, incremental patches, multiple scenes, and a `view.states` bridge subset (not full JMotion).
- **Library fixes:** two "Artist footguns" were fixed in the library: richText lineHeight, and TextField opacity/z-index for Safari focus.
- **Animation decision:** the JRB Machine animations (fish, coin, button) are kept as the quality bar and are not to be replaced with CSS cues. (EXP7_JRENDER_COMPARE §Animation)

## 4. Codec, naming and storage coordination
- The Artist renamed its codec to **`atlas/1`** (JRBA magic) with golden hashes unchanged. The binary log is 3.6–5.3× smaller than JSON. [REQ/memory 2026-11-02]
- Renaming "world" to "atlas" must happen in sync with the Artist's codec naming.
- Working op rules were sent to the Artist:
  - "add" on an existing list member is an accepted no-op;
  - "add" on an existing scalar path is rejected;
  - "remove" of a missing member is a no-op.

  Only that much of the exchange is recorded; the Artist's full reply is not archived. [memory]
- Matthew said storage-related changes should **wait for the Artist's update** (2026-11-02). Whether that update arrived is not recorded. [OPEN]
- Format discussion input: `fish-compress/REPORT.md` measures characters typed for several encodings. It explicitly states that "no format is locked in".

## 5. Accepted vs experimental delivery boundaries [DOC]
- **Accepted:**
  - motion-v13, accepted on Matthew's own visual check (2026-11-06);
  - the light/transparent theme direction.

  GPU pixels, contrast, clipcheck and frame-time gates were never verified. Box QA used a CPU command recorder because the box has no GPU adapter. (`motion-v12/v13`, `v13-independent-qa`, `light-v14` COVERAGE)
- **Candidates and experiments:**
  - light-v14;
  - experimental-v15 (its views were later removed in the lean build);
  - the WASI spikes.

  Existing art studies are provenance only, not candidate screenshots. No new Blender or Moho assets were fabricated.

## 6. Outstanding coordination items
1. **[UPDATE 2026-11-08]** Matthew authorized coordination with Ash for full view UX/UI art workflow + profile image render — living packet: `docs/artist-coordination-brief.md`. This historical file is not the handoff.
2. Confirm whether the Artist's storage/codec update was delivered before any storage changes. [OPEN]
3. The remaining visual gates for JRender views need a real WebGPU device (Matthew's Mac): contrast 4.5, clipcheck 0, worst-pixel checks, idle recalcs, p95 frame times.
4. The WASI 0.3 component host path for JRender is unfinished. A WIT export world is needed.
5. Re-obtain the full quality-gates text that was cut off in the 2026-10-30 report. [OPEN]
6. Profile/image DL (or equivalent) ABI — not in archived API; required for JR bar avatar parity with DOM. [OPEN]

## 7. Gaps
- No transcripts after 2026-11-07 00:35 are available.
- Most Artist-side messages are not archived; only the 2026-10-30 workflow report survives.
- The two archived attachment copies on the box are just versions of Exp7 design doc 47 (already in PR8), not Artist reports.
- Related JEditor docs are already supplied elsewhere and not duplicated here:
  - ADR 0001 (single animation runtime): in PR8's public-safe set;
  - ADR 0046 (animation file format) and design doc 02 (animation binary): in the redacted supplement.
