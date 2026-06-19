# Nano2

Nano2 is the `json-document` headless version of the ProseMirror editor
capability set.

Nano2 is not a ProseMirror wrapper. It may copy and diverge from
`prosemirror-view` because the copied code is a seed for browser
contenteditable, DOM selection, input, clipboard, DOM observer, and browser
quirk behavior. Canonical document state must remain NanoDocument /
`json-document`.

Authoritative policy:

- `docs/nano2-headless-design-policy.md`
- `docs/nano2-headless-capability-matrix.md`
- `docs/adr/0001-nano2-headless-prosemirror-view-seed.md`

Implementation rule:

```text
json-document owns document/schema/change/history/persistence
Nano2 view owns DOM/input/selection/browser quirks
ProseMirror view source is a provenance-tracked seed, not an architecture lock
```

Do not use Nano1 view/runtime/package-seam documents as authority for Nano2.
Nano1 examples become fixture pressure only after the ProseMirror official
example capability matrix is covered.
