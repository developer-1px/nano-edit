# Contenteditable Cell Edit Consumer Example

This example shows the intended package-consumer path for a table or spreadsheet
cell rebuilt as a single-line `contenteditable` surface.

Use this with `docs/contenteditable-cell-edit-lab.md`. It is not a native
`input`, `textarea`, or `select` recipe.

## Responsibilities

- `nano-edit/inline-edit`: contenteditable scalar edit lifecycle, text insertion,
  paste normalization, DOM Selection offsets, history intent detection, and
  focus restore into the editable element.
- Host grid: active cell identity, rectangular selection, navigation outside
  edit mode, formulas, validation, patch output, persistence, and grid focus
  restoration after commit/cancel.

## Minimal Cell Editor

```ts
import {
  createContenteditableScalarEdit,
  inlineEditSingleLineText,
  restoreInlineEditFocus,
} from 'nano-edit/inline-edit'

interface ContenteditableCellHost {
  cell: HTMLElement
  initialText: string
  onCommit: (text: string) => void
  onCancel: () => void
  restoreGridFocus: () => void
}

export function mountContenteditableCellEditor(host: ContenteditableCellHost) {
  let history = [{ text: inlineEditSingleLineText(host.initialText), offset: host.initialText.length }]
  let historyIndex = 0

  const restore = (index: number) => {
    historyIndex = Math.max(0, Math.min(history.length - 1, index))
    const snapshot = history[historyIndex]
    host.cell.textContent = snapshot.text
    restoreInlineEditFocus(() => host.cell, snapshot.offset)
  }

  const editor = createContenteditableScalarEdit({
    element: host.cell,
    initialSelection: { kind: 'end' },
    initialText: host.initialText,
    lineBreak: 'single-line',
    onDraftChange: (snapshot) => {
      if (history[historyIndex]?.text === snapshot.text) return
      history = history.slice(0, historyIndex + 1)
      history.push({ text: snapshot.text, offset: snapshot.offset })
      historyIndex = history.length - 1
    },
    onHistoryIntent: (intent) => {
      restore(intent.direction === 'undo' ? historyIndex - 1 : historyIndex + 1)
    },
    onCommit: (commit) => host.onCommit(commit.text),
    onCancel: host.onCancel,
    restoreHostFocus: host.restoreGridFocus,
  })

  return {
    destroy() {
      editor.destroy()
    },
  }
}
```

## Feedback Boundary

This example can become Nano package feedback when the blocker is about
contenteditable text, selection offsets, paste normalization, or local edit
history intent.

It is not Nano package feedback when the blocker is about grid navigation,
formula references, rectangular selection, JSON Pointer patch routing, or native
form-control focus behavior.
