# Nano2 Headless Design Policy

Status: accepted on 2026-06-20.

Nano2 exists to prove that ProseMirror-level editor capabilities can be carried
by a `json-document` headless engine. ProseMirror is the reference for browser
editing pressure; `json-document` is the canonical state, schema, change,
history, persistence, and later collaboration boundary.

## Core Decision

Nano2 is not a ProseMirror wrapper. Nano2 may copy and freely change
`prosemirror-view` code because the copied view code is a browser editing seed,
not a product architecture to preserve.

The reason to start from `prosemirror-view` is to keep the hard-won
contenteditable, DOM selection, input event, DOM observer, clipboard, and
browser quirk knowledge that ProseMirror already contains. The reason to diverge
from it is that Nano2's canonical document is not a ProseMirror document.

## Responsibilities

```text
Nano2
├─ json-document headless engine
│  ├─ canonical document
│  ├─ Zod schema rules
│  ├─ JSON Patch / NanoDocumentChange history
│  ├─ selection snapshots
│  ├─ persistence-ready state
│  └─ collaboration-ready state
└─ Nano view runtime
   ├─ seeded from prosemirror-view where useful
   ├─ allowed to diverge freely
   ├─ owns DOM/input/selection/browser quirks
   └─ never owns canonical document state
```

## What ProseMirror Provides

ProseMirror official examples are the first capability checklist for Nano2.
They are not UI decoration tasks and they are not Nano1 example work.

Nano2 must be able to express the capability behind each official example:

- Basics
- Dinos in the document
- Friendly Markdown
- Tooltip
- Image upload
- Schema from scratch
- Writing your own menu
- Foldable nodes
- Embedded code editor
- Linter
- Editing footnotes
- Track changes
- Collaborative editing

Source: <https://prosemirror.net/examples/>

## What json-document Must Prove

For every ProseMirror example, Nano2 must identify the headless version of the
problem:

```text
ProseMirror example
├─ editor capability being proven
├─ ProseMirror structure needed by the official example
├─ json-document headless expression
├─ Nano view runtime responsibility
├─ acceptance test
├─ why json-document should make this simpler
└─ failure signal
```

The point is not only parity. The point is to show that state-heavy editor
features become easier when document identity, schema validation, changes,
history, persistence, and collaboration pressure live in `json-document`
instead of the view.

## Success Signals

- Capability tests can run against headless `json-document` state before demo
  polish.
- Official ProseMirror examples map to Nano2 contracts with less state glue
  than the ProseMirror example needs.
- View code can diverge from upstream while retaining provenance to the copied
  `prosemirror-view` baseline.
- DOM state, ProseMirror documents, and Markdown strings are projections of the
  canonical Nano document.
- Pending states such as upload placeholders, lint results, track changes, and
  collaboration revisions can survive reload when the feature needs persistence.

## Failure Signals

- ProseMirror `doc`, `state`, `transaction`, or `step` becomes Nano2's canonical
  model.
- Nano2 reimplements contenteditable browser quirks from scratch without using
  the copied ProseMirror view baseline as a fixture seed.
- A ProseMirror example works only because a demo route owns product state.
- The implementation needs more glue than ProseMirror because `json-document`
  is treated as an after-the-fact persistence adapter.
- Nano1 architecture, package-seam docs, or feature catalog assumptions drive
  Nano2 design before the ProseMirror official example capability matrix is
  complete.

## Sequencing

1. Prove Nano2 against ProseMirror official examples.
2. For each example, record the `json-document` simplification or the reason it
   failed to simplify.
3. Only after that, reimplement selected Nano1 examples on the Nano2
   architecture as fixture coverage.
4. Bear remains the product-experience reference for quiet Markdown-native
   editing, not the phase-one implementation target.
