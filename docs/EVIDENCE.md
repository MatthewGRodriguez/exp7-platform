# Evidence classes

Labels used across this documentation tree. Prefer labeling over soft wording like “seems fine.”

| Label | Meaning | Acceptance use |
|-------|---------|----------------|
| **[REQ]** | Matthew stated it as a requirement (date noted when known) | Binding product/process rule until he changes it |
| **[MEAS]** | Measured on a known machine or via exact public HTTP (status, headers, bytes, SHA) | Facts about that measurement only |
| **[USER-HW]** | Matthew reported from his Mac or other personal hardware | Only source for rendering/UX device verdicts |
| **[MOCK]** | jsdom, fake IndexedDB, mocked GitHub, CPU GPU recorder, headless/cloud browser without Mac confirmation | Development signal only; **not** visual/Mac acceptance |
| **[CLAIM]** | Cursor/cloud agent or PR body asserted a result | **Not accepted** until re-verified; especially never equals [USER-HW] |
| **[OPEN]** | Unresolved question or gap | Do not close by assumption |
| **[PENDING]** | Expected inbound material (e.g. Lore package) not yet available | Do not invent contents |

## Hard rules derived from history [REQ]

1. **Never fabricate** pass results, hosted releases, presets, or Mac/visual/GitHub outcomes from mocks.  
2. **Checksum ≠ publisher trust.** SHA-256 proves file↔manifest match, not who should be trusted with keys.  
3. **Box browser previews are not Exp7 visual proof.** Managed Chrome may block loopback; box often has no usable GPU adapter. Deliver HTML for Safari on Matthew’s Mac.  
4. **Inferring `main` from PR text is a failure mode.** Always re-read the commit and files.

## Local paths in the handoff

The historical handoff indexes paths such as `/workspace/deliver/...` on **Grok Bot’s box**. Those paths are **not** present on a Cursor VM unless separately attached. Treat them as an **evidence index**, not as files in this repository.
