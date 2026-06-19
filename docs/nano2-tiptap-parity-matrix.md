# Nano2 Tiptap Parity Matrix

Status: source-backed parity map. This tracks the path from ProseMirror example
parity toward a Tiptap-like editor framework surface without making Tiptap or
ProseMirror the canonical document engine.

Sources:

- <https://tiptap.dev/docs/editor/extensions/functionality/starterkit>
- <https://tiptap.dev/docs/examples/basics/default-text-editor>
- <https://tiptap.dev/docs/examples/basics/formatting>
- <https://tiptap.dev/docs/examples/basics/text-direction>
- <https://tiptap.dev/docs/editor/extensions/nodes/image>
- <https://tiptap.dev/docs/examples/basics/images>
- <https://tiptap.dev/docs/examples/basics/long-texts>
- <https://tiptap.dev/docs/examples/basics/minimal-setup>
- <https://tiptap.dev/docs/editor/extensions/nodes/table>
- <https://tiptap.dev/docs/examples/basics/tables>
- <https://tiptap.dev/docs/editor/extensions/nodes/task-list>
- <https://tiptap.dev/docs/editor/extensions/nodes/task-item>
- <https://tiptap.dev/docs/examples/advanced/clever-editor>
- <https://tiptap.dev/docs/examples/advanced/collaborative-editing>
- <https://tiptap.dev/docs/examples/advanced/drawing>
- <https://tiptap.dev/docs/examples/advanced/forced-content-structure>
- <https://tiptap.dev/docs/examples/advanced/menus>
- <https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu>
- <https://tiptap.dev/docs/editor/extensions/functionality/floatingmenu>
- <https://tiptap.dev/docs/examples/advanced/mentions>
- <https://tiptap.dev/docs/editor/extensions/nodes/mention>
- <https://tiptap.dev/docs/examples/advanced/syntax-highlighting>
- <https://tiptap.dev/docs/examples/experiments/slash-commands>
- <https://tiptap.dev/docs/examples>

## Policy

```text
Tiptap is the product/API pressure reference.
json-document remains the canonical document/change/history/persistence engine.
Nano2 view owns DOM input, selection, keymaps, node views, and browser quirks.
```

Nano2 should not become a Tiptap wrapper. Tiptap parity means the same editor
capabilities can be expressed through NanoDocument state and Nano2 view seams.

## Phase Order

```text
T0: StarterKit parity pressure
T1: common open-source examples
T2: command UI, suggestions, menus, and performance
T3: collaboration, node views, and product-scale extensions
```

## StarterKit Coverage

Tiptap StarterKit currently bundles these common extensions:

| Group | Tiptap extension | Nano2 expression | Status |
| --- | --- | --- | --- |
| Nodes | Document | NanoDocument root | ready |
| Nodes | Paragraph | `paragraph` block | ready |
| Nodes | Text | text block content | ready |
| Nodes | Heading | `heading` block | ready |
| Nodes | Blockquote | `quote` block | partial |
| Nodes | BulletList / ListItem | flat `list_item` block, `kind: "bullet"` | partial |
| Nodes | OrderedList / ListItem | flat `list_item` block, `kind: "ordered"` | partial |
| Nodes | CodeBlock | `code` block | partial |
| Nodes | HorizontalRule | `divider` block | ready |
| Nodes | HardBreak | newline inside text block | partial |
| Marks | Bold | `bold` mark | ready |
| Marks | Italic | `italic` mark | ready |
| Marks | Underline | `underline` mark | ready |
| Marks | Strike | `strike` mark | ready |
| Marks | Code | `code` mark | ready |
| Marks | Link | `link` mark | data-ready |
| Functionality | Undo/Redo | json-document history | ready |
| Functionality | Dropcursor / Gapcursor | ProseMirror view seed responsibility | planned |
| Functionality | ListKeymap | Nano2 keymap over `list_item` blocks | partial |
| Functionality | TrailingNode | schema/session invariant | planned |

`/nano2/tiptap-starter-kit` is the runnable T0 surface. It currently proves the
keyboard and persistence slice for underline, strike, inline code, hard break,
bullet list, ordered list, blockquote, and code block.

`/nano2/tiptap-default-editor` is the runnable T1 Default text editor surface. It
currently proves a bare default Nano2 profile with common mark/block commands,
DOM text input, and persisted NanoDocument state without requiring product
chrome.

`/nano2/tiptap-formatting` is the runnable T1 Formatting surface. It currently
proves bold, italic, underline, strike, inline code, paragraph, and heading
command intent as NanoDocument mark ranges and heading blocks.

`/nano2/tiptap-text-direction` is the runnable T1 Text direction surface. It
currently proves per-block LTR, RTL, and AUTO direction attrs projected to DOM
`dir` and persisted as NanoDocument text block attrs.

`/nano2/tiptap-clever-editor` is the runnable T2 Clever editor surface. It
currently proves emoji replacement, typography replacement, highlight delimiter
replacement, and persisted NanoDocument text/mark state.

`/nano2/tiptap-collaboration` is the runnable T3 Collaboration surface. It
currently proves two independent Nano2 engines connected by
NanoDocumentChange transport, plus late peer join convergence without
document-stored transport metadata.

`/nano2/tiptap-drawing` is the runnable T3 Drawing surface. It currently proves
a `nano2.drawing` custom block with JSON stroke data, canvas node-view
projection, stroke editing, and persistence without storing canvas DOM.

`/nano2/tiptap-forced-content-structure` is the runnable T2 Forced content
structure surface. It currently proves pre-mount stored document validation,
title-slot enforcement, transaction rejection for invalid title demotion, and
persisted schema-valid body edits.

`/nano2/tiptap-images` is the runnable T1 Images surface. It currently proves
existing image rendering, Markdown image paste, HTML img paste, and persisted
NanoDocument image attrs.

`/nano2/tiptap-long-texts` is the runnable T2 Long texts surface. It currently
proves a generated 200k+ word NanoDocument, a middle-block edit, stable neighbor
DOM nodes during that edit, and persisted NanoDocument text.

`/nano2/tiptap-minimal-setup` is the runnable T1 Minimal setup surface. It
currently proves paragraph-only Zod validation, literal Markdown-looking text,
plain paragraph splitting, and persisted paragraph-only NanoDocument state.

`/nano2/tiptap-tables` is the runnable T1 Tables surface. It currently proves
table rendering, single-cell contenteditable commits, tabular paste across
cells, and persisted NanoDocument rows.

`/nano2/tiptap-markdown-shortcuts` is the runnable T1 Markdown shortcuts surface.
It currently proves heading, bullet list, ordered list, blockquote, code block,
divider, bold, italic, strike, and inline code shortcuts.

`/nano2/tiptap-tasks` is the runnable T1 Tasks surface. It currently proves
bare `[ ] ` / `[x] ` task shortcuts, Markdown task shortcuts, checkbox click
toggles, keyboard checkbox toggles, and persisted NanoDocument `todo` blocks.

`/nano2/tiptap-mentions` is the runnable T2 Mentions surface. It currently
proves an existing mention, `@` suggestion insertion, DOM chip rendering, and
persisted one-character NanoDocument mention marks.

`/nano2/tiptap-menus` is the runnable T2 Menus surface. It currently proves
selection bubble menu state, empty-line floating menu state, command dispatch,
focus return, and persisted NanoDocument mark/block changes.

`/nano2/tiptap-slash-commands` is the runnable T3 Slash commands surface. It
currently proves a `/` trigger, filtered command panel, heading/list/quote/code
block command dispatch, and persisted NanoDocument block changes.

`/nano2/tiptap-syntax-highlighting` is the runnable T3 Syntax highlighting
surface. It currently proves lowlight-derived code decorations over a
NanoDocument code block, editable code text, and persistence without highlight
marks.

## Official Example Map

| Phase | Tiptap example | Nano2 acceptance contract |
| --- | --- | --- |
| T1 | Default text editor | Ready: mount default content, edit, run common mark/block commands, persist/reload NanoDocument. |
| T1 | Formatting | Ready: toggle StarterKit-style marks and heading commands, then persist Nano mark ranges and block attrs. |
| T1 | Images | Ready: render image blocks, paste Markdown/HTML image input, export Markdown, and persist image attrs. |
| T1 | Markdown shortcuts | Ready: type Markdown prefixes/delimiters and commit schema-valid NanoDocument changes. |
| T1 | Minimal setup | Ready: mount paragraph-only Nano2 profile, type literal text, split paragraphs, and persist paragraph-only NanoDocument state. |
| T1 | Tables | Ready: edit cells, paste tabular text across rows, preserve table schema, and persist row changes. |
| T1 | Tasks | Ready: type task shortcuts, toggle task items through Nano todo blocks, and persist checked state. |
| T1 | Text direction & RTL | Ready: store direction as NanoDocument text block attrs, project DOM `dir`, switch LTR/RTL/AUTO, and persist attrs. |
| T2 | Long texts | Ready: mount 200k+ words, edit a middle block, keep neighbor DOM nodes stable, and persist the text change. |
| T2 | Menus | Ready: bubble/floating menus reflect command state, dispatch Nano2 commands, and persist mark/block changes. |
| T2 | Mentions | Ready: suggestion menu inserts inline atoms as one-character Nano marks and persists stable mention attrs. |
| T2 | Clever editor | Ready: custom replacement extensions become Nano2 input rules that persist emoji, typography, and highlight NanoDocument changes. |
| T2 | Forced content structure | Ready: Zod document profile enforces heading-first structure before mount and rejects invalid view transactions before persistence. |
| T3 | Collaborative editing | Ready: NanoDocumentChange transport converges multiple independent Nano2 engines, including a late-joining peer. |
| T3 | Drawing | Ready: custom node view projects canvas strokes while NanoDocument stores only `nano2.drawing` JSON data. |
| T3 | Interactive React & Vue views | Framework node views become replaceable view projections over Nano paths. |
| T3 | Syntax highlighting | Ready: lowlight token ranges render as view decorations while code text and language remain the only NanoDocument data. |
| T3 | Collaborative fields | Multiple logical fields share one collaboration transport without sharing DOM identity. |
| T3 | Figure / Generic figure | Media node attrs and captions become structured Nano blocks. |
| T3 | iFrame | Embed attrs are schema-validated Nano custom block data. |
| T3 | Linting | Diagnostics are pure NanoDocument projections with optional fixer changes. |
| T3 | Slash commands | Ready: suggestion surface runs Nano commands from trigger position, removes trigger text, and persists block changes. |

## Acceptance Rule

Each Tiptap parity row needs:

- a headless NanoDocument or command test,
- a browser/runtime test for contenteditable behavior,
- a stated `json-document` simplification,
- and a failure signal showing when Nano2 is becoming a wrapper.

## Failure Signals

- Tiptap `Editor` or ProseMirror document state becomes the public source of
  truth.
- A command callback mutates DOM directly without a NanoDocumentChange.
- A feature only works in the demo route and has no headless expression.
- View-only state is persisted accidentally as document content.
