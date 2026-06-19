# Nano2 Headless Capability Matrix

Status: source-backed matrix. This is the phase-one Nano2 checklist before
Nano1 examples or Bear-like product polish become implementation targets.

The rows translate official ProseMirror examples into Nano2 contracts. Each
contract must prove both capability parity and `json-document` headless leverage.

Source index: <https://prosemirror.net/examples/>

## Phase Order

```text
P0: baseline editor pressure
P1: schema, commands, and headless projections
P2: view-runtime pressure
P3: nested editors and long-lived change pressure
```

Do not implement Nano1 examples until every P0-P3 row has an acceptance test or
an explicit recorded blocker.

## Matrix

| Phase | ProseMirror example | Official pressure | ProseMirror structure to understand | json-document headless expression | Nano view runtime responsibility | Minimum acceptance contract | Why json-document should be easier | Failure signal |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | [Basics](https://prosemirror.net/examples/basic/) | Minimal rich text editor with schema, input rules, keymaps, drop/gap cursor, undo history, and menu setup. | EditorState, EditorView, schema, exampleSetup plugins, DOMParser input. | NanoDocument blocks/marks validated by Zod; NanoDocumentChange history; selection snapshots. | DOM input, composition, selection mapping, key dispatch, gap/drop cursor equivalent where needed. | Type text, toggle marks, split blocks, list/heading command, undo/redo, persist, reload, and verify same NanoDocument. | History and persistence are canonical Nano changes instead of plugin transaction state. | ProseMirror history or document becomes the source of truth. |
| P0 | [Dinos in the document](https://prosemirror.net/examples/dino/) | Custom inline semantic node that can be selected, copied, pasted, and dragged. | NodeSpec attrs, toDOM/parseDOM, schema extension, replaceSelectionWith, menu command. | Custom Nano inline atom or object-replacement mark with Zod attrs and stable id. | Render atom, parse pasted DOM, selection movement, drag/copy/paste behavior. | Insert a custom atom, arrow through it as one unit, copy/paste it, persist/reload, and keep attrs. | Custom data is JSON first; DOM parsing is an import path, not identity. | Node identity only exists as DOM attrs or ProseMirror attrs. |
| P1 | [Friendly Markdown](https://prosemirror.net/examples/markdown/) | Switch between Markdown text and WYSIWYM editor without changing backend format. | Markdown parser/serializer and a view interface whose content getter returns Markdown. | Markdown is a codec over NanoDocument; NanoDocument remains canonical while Markdown is projection. | Switch surface modes, preserve focus/selection where possible, mount source and rendered projections. | Edit in rendered mode, switch to Markdown, edit source, switch back, and compare NanoDocument semantics. | Source and rendered views share one headless document rather than reparsing into view identity. | Markdown string becomes the only authoritative document. |
| P1 | [Schema from scratch](https://prosemirror.net/examples/schema/) | Custom schema families, custom block groups, inline nodes, marks, mark inclusivity, wrap and insert commands. | Schema content expressions, parseDOM/toDOM, findWrapping, toggleMark, canReplaceWith. | Zod schemas define valid NanoDocument variants; commands validate and emit Nano changes. | Project schema variants to editable DOM and enforce selection-safe commands. | Reject invalid payloads headlessly; mount valid variants; run wrap, mark toggle, link toggle, and inline node insert. | Schema validity is a data boundary before DOM mount. | ProseMirror schema is the only validator. |
| P1 | [Writing your own menu](https://prosemirror.net/examples/menu/) | UI controls tied to commands and updated on editor state changes. | Command active checks by calling commands without dispatch; plugin view updates menu. | Commands are headless intents that resolve to NanoDocumentChange or selection-only actions. | Render optional command UI, focus editor on command, mirror enabled/active state. | Run the same command from headless test, keyboard, and menu; disabled state matches headless command applicability. | Menu is a projection of command state, not where semantics live. | Button callbacks own document behavior. |
| P2 | [Tooltip](https://prosemirror.net/examples/tooltip/) | Plugin view anchored to the current selection and updated through the editor lifecycle. | Plugin view, selection diffing, coordsAtPos, update/destroy lifecycle. | Selection snapshot and derived UI state are separate from document content. | DOM coords, anchored overlay lifecycle, selection updates, teardown. | Select text, show tooltip, move selection, hide on empty selection, destroy without document mutation. | Headless selection can be tested independently from the tooltip DOM. | Tooltip state leaks into NanoDocument. |
| P2 | [Image upload](https://prosemirror.net/examples/upload/) | Async placeholder that maps through document changes and is replaced by final image. | Plugin state, DecorationSet mapping, transaction meta add/remove, placeholder lookup by id. | Pending asset is explicit Nano state or change metadata keyed by stable id; final image replaces the same id. | Render pending placeholder/progress and final image, handle async completion/failure. | Start upload, edit text around placeholder, reload if persistent, complete upload, verify image lands at moved logical position. | Pending state can survive persistence when needed; mapping uses canonical document identity. | Upload placeholder is decoration-only and disappears on reload when persistence is required. |
| P2 | [Foldable nodes](https://prosemirror.net/examples/fold/) | Node view behavior influenced by node decorations, with selection pushed out when content is hidden. | Section schema, node view, Decoration.node state, metadata-driven fold toggle, Selection.findFrom. | Fold state is explicit session state keyed by Nano node id, or document state when persistence is required. | Hide/show content DOM, maintain button chrome, repair selection outside folded content. | Fold a section, keep document content unchanged, move selection out of hidden content, edit nearby blocks, reload persistent fold if enabled. | Fold state is separated from document content and can be session-only or persisted deliberately. | Collapsed DOM becomes canonical content or deletes hidden content. |
| P2 | [Linter](https://prosemirror.net/examples/lint/) | Derived diagnostics rendered as inline/widget decorations with click selection and double-click fix. | doc.descendants scan, DecorationSet, problem specs, posAtDOM, TextSelection, fix commands. | Diagnostics are pure derived data over NanoDocument with optional Nano change fixers. | Render diagnostic decorations/icons, map clicks to diagnostics, route fixes. | Headless lint returns diagnostics; DOM shows them; selecting/fixing one emits a narrow NanoDocumentChange. | Lint logic can run without DOM and without editor view state. | Lint only exists by scanning rendered DOM. |
| P3 | [Embedded code editor](https://prosemirror.net/examples/codemirror/) | Always-visible nested editor for code block content with selection synchronization and escape keys. | Node view with CodeMirror, change forwarding, setSelection, stopEvent, edge arrow escape, outer undo/redo. | Code block text lives at a NanoDocument path; nested editor commits narrow text changes to that path. | Own nested focus, bidirectional selection sync, edge escape, stop inner events, avoid update loops. | Edit nested code, receive a narrow text change, undo through Nano history, arrow out at boundaries, external change updates nested editor. | Nested editor does not have to become nested ProseMirror state; it edits a headless path. | Nested transaction/Step mapping dominates the implementation. |
| P3 | [Editing footnotes](https://prosemirror.net/examples/footnote/) | Inline atom with content edited through a sub-editor and mapped back to the outer document. | Atom inline node with content, node view, inner EditorView, StepMap offset, fromOutside update guard. | Footnote reference and body are canonical linked Nano nodes or blocks. | Render inline reference, open nested editor/popover, manage focus and update loops. | Edit footnote body, persist it at the footnote path, undo from outer history, reload and preserve reference/body link. | Footnote content is a data graph rather than an embedded view document. | Footnote body is trapped inside a nested editor document. |
| P3 | [Track changes](https://prosemirror.net/examples/track/) | Commit, inspect blame, and revert individual changes using stored inverted steps and mappings. | Plugin state, inverted Step history, Mapping, blame map spans, revert by rebasing steps. | NanoDocumentChange / JSON Patch log is the change model; blame spans derive from Nano changes. | Render change decorations, blame hover/cursor UI, run revert command. | Commit changes, inspect which change introduced text, revert one committed change, detect or record conflicts. | Change tracking starts from canonical changes instead of interpreting view Steps. | ProseMirror Steps become public Nano history. |
| P3 | [Collaborative editing](https://prosemirror.net/examples/collab/) | Shared document editing with synced changes and shared annotations. | Collab transport around editor changes, remote application, annotation decorations. | Collaboration adapter exchanges NanoDocumentChange, revisions, peer ids, and selection/annotation payloads. | Apply remote changes to the view without stealing local selection unless requested; render annotations. | Two Nano engines converge after ordered, repeated, and late-join changes; annotations survive as headless payloads. | Transport is independent of DOM and view runtime. | Collaboration protocol depends on ProseMirror view internals. |

## Acceptance Rule

Each implementation issue must copy the relevant row and then make it more
specific. A row is implementation-ready only when it has:

- a headless test that can run without the demo route,
- a browser/runtime test for the contenteditable behavior,
- a stated `json-document` simplification claim,
- and a failure signal that would prove Nano2 is slipping back into wrapper
  mode.

## P0 Evidence

P0 is implemented as acceptance coverage, not as a finished product surface.

- `scripts/regressions/chunk-51.mjs` proves Basics and Dinos through headless
  `json-document` state: mark toggles, heading block changes, schema-valid
  mention atoms, one-character atom lowering, Zod validation, and Nano history.
- `scripts/regressions/browser-nano2-demo.mjs` proves the same P0 pressure in
  the contenteditable runtime: mention chips render as ProseMirror atom DOM,
  copy/paste preserve attrs, Backspace treats chips as one unit, textblock-end
  navigation skips chips, mark and heading keymaps commit to persisted
  NanoDocument state, and double Enter does not produce phantom spacing.
- Verification for this checkpoint:
  `CI=true pnpm test:nano2`,
  `node --experimental-strip-types --experimental-loader ./scripts/ts-extension-loader.mjs scripts/regressions/chunk-51.mjs`,
  `CI=true pnpm test`,
  `CI=true pnpm exec tsc --noEmit`,
  and `CI=true pnpm build:package`.

## Cut Line

Nano1 examples are not part of phase one. Bear-like quiet product polish is not
part of phase one. They become useful only after this matrix proves that Nano2
can carry the official ProseMirror example capabilities with `json-document`
as the headless source of truth.
