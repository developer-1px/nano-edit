# Nano2 Uses ProseMirror View as a Seed for a json-document Headless Engine

Status: accepted

Nano2 will prove ProseMirror official example capabilities with `json-document`
as the canonical headless document engine. Copied `prosemirror-view` code is a
browser editing seed that preserves contenteditable, DOM selection, input,
clipboard, DOM observer, and browser quirk knowledge; it may diverge freely and
must not make ProseMirror document/state/transaction concepts canonical.

## Considered Options

- Keep building Nano2 as a thin ProseMirror package wrapper.
- Rebuild contenteditable behavior from zero.
- Copy ProseMirror view code as a provenance-tracked seed and replace canonical
  document/state/change responsibilities with `json-document`.

We choose the third option because it keeps ProseMirror's browser editing
fixtures without accepting ProseMirror's document model as Nano2's source of
truth.
