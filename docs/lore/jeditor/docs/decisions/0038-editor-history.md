# 0038 — Editor undo/redo history

Status: accepted (M7, 2026-10-30)

## Decision
- **What is stored.** The history holds snapshots (JSON strings) of the *design* part of the doc only: meta.title, root, components, customComponents, motion, cal.combine/conditions, persist and activeTab.
  - Workbook/state data and the selection are left out, so selecting things never creates undo steps.
- **Size.** Linear history with labels, capped at 300 entries. A new edit after an undo drops the redo branch.
- **Dirty flag.** `dirty = !onDisk || snap() !== savedSnap`. Undoing back to the saved state clears the dirty flag.
- **Rendering.** `put()` skips innerHTML writes when the markup is unchanged. Without this, re-rendering swapped toolbar buttons mid-click and clicks were lost.

## Consequences
- History lasts for the session only; it is not persisted.
- Drag, reorder, nest, variant and inspector edits are each one undo step.
