# zod-crud update notes

Date: 2026-05-22

## Current State

`nano-edit` is a good current-API consumer.

- It creates a document with `createJSONDocument`.
- It uses `history`, `selection`, `commit(..., { selection })`, `lastPatch`, and `history.mergeLast`.
- ProseMirror selection mapping, Markdown preservation, and rich editor commands stay inside nano-edit.

No immediate migration is required.

## Changelog Impact

The current zod-crud public surface aligns with nano-edit:

- `createJSONDocument`
- `JSONDocument`
- `JSONPatchOperation`
- `Pointer`
- `JSONPoint`
- `SelectionSnap`
- `doc.commit`
- `doc.history`
- `doc.selection`

Avoid adopting `doc.ops` or `doc.commands`; those are not public.

## Improvement Direction

1. Keep nano-edit as a reference dogfood repo for:
   - ProseMirror selection -> zod-crud `SelectionSnap`
   - text typing history coalescing via `history.mergeLast`
   - selection restore after undo/redo

2. Consider improving patch granularity where practical.
   `replaceBlocksPatch` currently collapses broad block changes into `/blocks` replacement. That may be fine for editor transactions, but narrower patches improve history/debug readability.

3. Keep Markdown/system clipboard adapters local.
   zod-crud clipboard is a headless JSON payload buffer, not a browser clipboard integration.

4. If zod-crud later adds commit prediction or richer support type exports, nano-edit can simplify adapter typing but should not need behavioral rewrites.

## Canonical Commit Flow

1. Convert the ProseMirror transaction result into a Nano `SelectionSnap`.
2. Commit document patches through `doc.commit(patch, { origin, label, mergeKey, selection })`.
3. For continuous text edits, call `doc.history.mergeLast({ mergeKey })` after a successful commit.
4. For undo/redo, call `doc.history.undo()` or `doc.history.redo()`, then rebuild the ProseMirror state from `doc.value`. zod-crud restores the matching selection snapshot on the document engine.

Keep using the public `zod-crud` entrypoint only. Do not depend on private subpaths, `doc.ops`, or `doc.commands`.

## Suggested Local Work Items

- Add a short internal doc section showing the canonical `commit + selection + mergeLast` flow.
- Add regression tests around selection restoration after `history.undo/redo`.
- Avoid any new imports from zod-crud private subpaths.

## Verification

```sh
npm -C ../nano-edit test
npm -C ../nano-edit run build
```
