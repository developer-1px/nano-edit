# Nano2 Tiptap Parity Matrix

Status: source-backed parity map. This tracks the path from ProseMirror example
parity toward a Tiptap-like editor framework surface without making Tiptap or
ProseMirror the canonical document engine.

Sources:

- <https://tiptap.dev/docs/editor/extensions/functionality/starterkit>
- <https://tiptap.dev/docs/editor/extensions/nodes/task-list>
- <https://tiptap.dev/docs/editor/extensions/nodes/task-item>
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

`/nano2/tiptap-markdown-shortcuts` is the runnable T1 Markdown shortcuts surface.
It currently proves heading, bullet list, ordered list, blockquote, code block,
divider, bold, italic, strike, and inline code shortcuts.

`/nano2/tiptap-tasks` is the runnable T1 Tasks surface. It currently proves
bare `[ ] ` / `[x] ` task shortcuts, Markdown task shortcuts, checkbox click
toggles, keyboard checkbox toggles, and persisted NanoDocument `todo` blocks.

## Official Example Map

| Phase | Tiptap example | Nano2 acceptance contract |
| --- | --- | --- |
| T1 | Default text editor | Mount default content, edit, run common commands, persist/reload NanoDocument. |
| T1 | Formatting | Toggle all StarterKit marks and prove persisted Nano mark ranges. |
| T1 | Images | Insert image blocks with attrs, copy/paste/import/export, persist attrs. |
| T1 | Markdown shortcuts | Ready: type Markdown prefixes/delimiters and commit schema-valid NanoDocument changes. |
| T1 | Minimal setup | Mount Nano2 with only document/paragraph/text and basic input. |
| T1 | Tables | Edit cells, preserve table schema, copy/paste rows, and persist cell changes. |
| T1 | Tasks | Ready: type task shortcuts, toggle task items through Nano todo blocks, and persist checked state. |
| T1 | Text direction & RTL | Store direction as explicit attrs or session projection and test bidirectional selection. |
| T2 | Long texts | Measure large document mount/edit latency and avoid full-DOM churn where possible. |
| T2 | Menus | Bubble/floating menus reflect command state and emit Nano changes. |
| T2 | Mentions | Suggestion menu inserts inline atoms as one-character Nano marks. |
| T2 | Clever editor | Custom replacement extensions become Nano shortcut/change rules. |
| T2 | Forced content structure | Headless schema rules enforce required block order before DOM mount. |
| T3 | Collaborative editing | NanoDocumentChange transport converges multiple engines. |
| T3 | Drawing | Custom node view stores drawing payload as Nano custom block data. |
| T3 | Interactive React & Vue views | Framework node views become replaceable view projections over Nano paths. |
| T3 | Syntax highlighting | Code block highlighting is view-derived, while code text remains Nano data. |
| T3 | Collaborative fields | Multiple logical fields share one collaboration transport without sharing DOM identity. |
| T3 | Figure / Generic figure | Media node attrs and captions become structured Nano blocks. |
| T3 | iFrame | Embed attrs are schema-validated Nano custom block data. |
| T3 | Linting | Diagnostics are pure NanoDocument projections with optional fixer changes. |
| T3 | Slash commands | Suggestion surface runs Nano commands from trigger position and selection snapshot. |

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
