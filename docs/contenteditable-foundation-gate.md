# Contenteditable Foundation Gate

Status: active identity gate.

This gate asks whether Nano Edit, under the working identity Nano Editable, is
acting as a contenteditable editing foundation rather than as an app, a native
form-control helper, or a ProseMirror wrapper.

```txt
contenteditable foundation
|-- public identity
|   |-- contenteditable surface first
|   |-- reusable feature seams before full editor assembly
|   |-- Markdown is an expression, not the whole identity
|   `-- ProseMirror and zod-crud are provider/foundation details
|-- included responsibilities
|   |-- DOM Selection and offset mapping for contenteditable surfaces
|   |-- Input Events and IME-sensitive text mutation
|   |-- local edit mount/commit/cancel/paste/history-intent lifecycle
|   |-- inline autocomplete trigger/query/replacement behavior
|   |-- Markdown-native document parse/serialize/index seams
|   `-- adapter-provider paths for ProseMirror, zod-crud, React, and DOM
|-- excluded responsibilities
|   |-- native input, textarea, and select edit lifecycles
|   |-- spreadsheet grid state, rectangular selection, and formula semantics
|   |-- app command layer, routing, persistence policy, and product chrome
|   |-- remote collaboration protocol
|   `-- private ProseMirror or zod-crud imports in consumer code
|-- pressure validation
|   |-- chat composer or message edit
|   |-- Markdown inline token edit
|   |-- component/property label edit
|   |-- contenteditable table or spreadsheet cell edit lab
|   `-- generated Markdown document review surface
`-- promotion threshold
    |-- public export only
    |-- Consumer Blind classification before API changes
    |-- repeated API awkward/missing signal across two tasks or hosts
    `-- no native form-control shortcut added to core
```

## Foundation Rule

Nano Edit should expose the smallest contenteditable feature seam that lets a
host assemble the behavior without copying the demo or importing implementation
files.

The full root editor is an assembly surface. It can demonstrate feature seams,
but it should not be the required path for small contenteditable edits,
Markdown data transforms, autocomplete, or indexing.

## Provider Rule

ProseMirror is a runtime provider for reliable contenteditable document editing.
It can own selection mapping, DOM synchronization, schema conversion, and input
behavior behind stable Nano exports.

zod-crud is a document foundation for schema-safe state, patches, history,
persistence pressure, and JSON-boundary discipline behind stable Nano exports.

Neither provider should become the first thing a feature consumer must learn.
Adapter-provider authors may need provider concepts; ordinary feature consumers
should start from Nano public subpaths.

## Native Form-Control Rule

Native `input`, `textarea`, and `select` edit lifecycles are outside Nano core.

They may remain host-owned, live in another package, or become comparison
pressure for a lab. They become Nano pressure only when the host deliberately
rebuilds the edit as a contenteditable surface.

Examples:

- A spreadsheet cell editor rendered as `<input>` is outside Nano core.
- A spreadsheet cell editor rebuilt as a contenteditable cell is valid lab
  pressure.
- A formula bar rendered as a native `<input>` is outside Nano core.
- A formula bar rebuilt as a contenteditable single-line surface is valid lab
  pressure.

## Package Taxonomy

| Level | Owns | Does not own |
| --- | --- | --- |
| core | Small contenteditable algorithms and state, scalar edit lifecycle, selection offsets, paste normalization, history intent, headless autocomplete state. | Product commands, persistence, native form-control lifecycle, grid engines. |
| extension | Optional behavior over core, such as inline autocomplete, mentions, slash triggers, local history helpers, validation feedback. | Host-specific option data or command effects. |
| adapter-provider | Bridges to ProseMirror, zod-crud, React, DOM, browser APIs, or host interaction ownership. | New product identity or app scope. |
| lab | Real host pressure that proves a reusable contenteditable feature might exist. | Public contract promises. |
| assembly | Ready-to-use editor/demo surfaces that compose features. | Defining the foundation scope by themselves. |

## Pressure Register

Record a pressure case before changing core or promoting a lab:

| Pressure | Valid Nano question | Non-goal |
| --- | --- | --- |
| chat message edit | Can a contenteditable single-line message use inline edit and autocomplete without the full editor? | Owning chat persistence or send behavior. |
| Markdown token edit | Can a rendered token become a local contenteditable edit with replacement and autocomplete? | Owning the host Markdown renderer. |
| component label edit | Can a contenteditable label edit commit a string value and restore focus predictably? | Owning the component builder model. |
| table/cell edit | Can a contenteditable cell edit use Nano primitives cleanly? See `docs/contenteditable-cell-edit-lab.md`. | Replacing native grid selection, formulas, or rectangular patch semantics. |
| generated document review | Can the full editor assembly validate quiet contenteditable document review? | Becoming a product app. |

## Change Gate

Before adding or promoting a public API:

1. State the contenteditable surface that needs it.
2. Show the public entrypoint a consumer tried first.
3. Classify the blocker as `works-as-is`, `API missing`, `API awkward`,
   `discoverability/name`, `docs/example gap`, or `task/blind unfairness`.
4. Check whether the same blocker appears in a second task or real host.
5. Prefer docs, examples, adapter-provider code, or lab code before core.
6. Reject core changes that mainly make native form-control editors easier.

## Current Baseline

- `nano-edit/inline-edit`: contenteditable scalar edit lifecycle and local edit primitives.
- `nano-edit/autocomplete`: headless option state plus optional DOM surface.
- `nano-edit/inline-autocomplete`: trigger, query, and replacement-range
  behavior over contenteditable inline edit.
- `nano-edit/markdown`: data-only Markdown expression.
- `nano-edit/document-index`: parsed document indexing and search.
- `nano-edit/model`: pure schemas and empty values.
- root `nano-edit`: full assembly surface.

The working rename target is Nano Editable / `nano-editable`, but package
renaming is a later compatibility task. The identity gate applies now.
