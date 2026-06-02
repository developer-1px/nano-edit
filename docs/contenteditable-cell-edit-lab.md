# Contenteditable Cell Edit Lab

Status: lab pressure seed.

This lab turns spreadsheet/table cell editing into valid Nano pressure only when
the editor surface is rebuilt as `contenteditable`. It is not a request for Nano
core to support native `input`, `textarea`, or `select` lifecycles.

## Context

The `spredsheet` repo already owns a grid foundation:

- grid focus and rectangular selection
- cell navigation and fill behavior
- formulas and formula reference picking
- grouped JSON Pointer patch output
- native form-control cell editors in the current renderer

Those responsibilities should not move into Nano core.

Nano pressure begins only at the local text-edit surface:

```txt
grid cell selected
-> host enters contenteditable local edit
-> Nano inline-edit primitives handle text/caret/paste/history intent
-> host commits text back to the grid model
-> host restores grid focus and selection
```

## Goal

Prove that a contenteditable table or spreadsheet cell can be assembled from
Nano public entries without the full editor assembly.

Use `docs/contenteditable-cell-edit-consumer-example.md` as the first assembly
sketch before treating a blocker as API feedback.

## Public Entries

Required:

- `nano-edit/inline-edit`

Optional:

- `nano-edit/autocomplete`
- `nano-edit/inline-autocomplete`
- `nano-edit/inline-tokens`

Not required:

- root `nano-edit`
- ProseMirror private modules
- zod-crud private modules
- native form-control helpers

## Responsibilities

| Owner | Responsibility |
| --- | --- |
| Nano `inline-edit` | contenteditable text insertion, replacement, DOM Selection offsets, single-line paste normalization, undo/redo intent detection, focus restore into the contenteditable element. |
| Nano extensions | optional trigger/query/replacement behavior for mentions, commands, tags, or formula-like suggestions. |
| Host grid | active cell identity, rectangular selection, keyboard navigation outside edit mode, formula semantics, validation, patch output, persistence, undo history, focus restore to the grid cell. |

## Minimal Lab Scenario

1. Host renders a selected cell as a single-line `contenteditable` element.
2. Enter or double click starts local edit.
3. Typing changes only the contenteditable text until commit.
4. Paste normalizes line breaks to spaces.
5. Cmd/Ctrl+Z and redo shortcuts are detected as local edit intent.
6. Enter commits the current text to the host model.
7. Escape cancels and restores the original text.
8. After commit/cancel, host grid focus returns to the edited cell.

## Non-Goals

- Replacing the host grid selection engine.
- Owning formula parsing or reference picking.
- Emitting JSON Pointer patches from Nano core.
- Supporting native `input`, `textarea`, or `select` cell editors.
- Mounting the full Nano document editor inside each cell.

## API Feedback Rule

A lab result becomes Nano package feedback only if:

1. The cell editor is contenteditable.
2. The implementation uses public Nano entries only.
3. The blocker is classified with the Consumer Blind taxonomy.
4. The same blocker appears in another task or a second real host, or the
   blocker prevents the minimal lab scenario from being assembled at all.

If a blocker is about native input focus, select options, textarea behavior,
rectangular selection, formulas, or patch routing, it is host or adjacent-package
feedback, not Nano core feedback.

## Promotion Path

| Stage | Evidence |
| --- | --- |
| lab | One host proves a contenteditable cell can use Nano primitives. |
| extension candidate | A repeated optional behavior appears, such as local history snapshots, validation feedback, or anchored suggestions. |
| core candidate | Two contenteditable hosts hit the same missing primitive that cannot be solved by docs, example code, or adapter-provider code. |

The likely reusable output is not `grid-edit`. It is a smaller contenteditable
feature such as `scalar-edit`, `cell-inline-edit`, or a documented adapter
pattern over `inline-edit`.
