# ADR 0087: Drag and drop-on-target are view events

Status: accepted (2026-11-01), M17b.

- In the runtime, a pointer move of more than 6 px on a `.jw-item` starts a drag. It emits `{type:'drag', comp: sourceComp, item}`, the item's state machine becomes 'dragging' (kept across re-renders), and the component under the pointer gets `data-drop-hot`.
- Pointer up emits `{type:'drop', comp: targetComp, item, target}`. The target is the item under the pointer, or else the component. The click that follows a drag is suppressed.
- Events reach blueprints only through a view node's `events` output, filtered to that view's component. They are handled one per pass.
- A condition node with op 'event' outputs `item` and `target`. When nothing matches, both are *undefined*, so a wired `set` does not write. This fixes the case where a drag event wrote null.
- Verified with a real CDP pointer drag in the exported offline HTML: dragging shop onto dinner sets `shop.values.zone = item:dinner`, and the mid-drag state reads 'dragging'. world_test covers the drag gate and that a drop on another component is ignored.
