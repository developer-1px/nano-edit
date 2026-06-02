# Contenteditable Cell Edit Consumer Example

This example shows the intended package-consumer path for a table or spreadsheet
cell rebuilt as a single-line `contenteditable` surface.

Use this with `docs/contenteditable-cell-edit-lab.md`. It is not a native
`input`, `textarea`, or `select` recipe.

## Responsibilities

- `nano-edit/inline-edit`: contenteditable text insertion, paste normalization,
  DOM Selection offsets, history intent detection, and focus restore into the
  editable element.
- Host grid: active cell identity, rectangular selection, navigation outside
  edit mode, formulas, validation, patch output, persistence, and grid focus
  restoration after commit/cancel.

## Minimal Cell Editor

```ts
import {
  collapseInlineEditSelection,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  isInlineEditLineBreakInput,
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

  host.cell.contentEditable = 'true'
  host.cell.setAttribute('role', 'textbox')
  host.cell.setAttribute('aria-multiline', 'false')
  host.cell.textContent = history[0].text
  collapseInlineEditSelection(host.cell, history[0].offset)

  const text = () => inlineEditSingleLineText(host.cell.textContent ?? '')
  const offset = () => inlineEditSelectionOffset(host.cell) ?? text().length

  const remember = () => {
    const next = text()
    if (history[historyIndex]?.text === next) return
    history = history.slice(0, historyIndex + 1)
    history.push({ text: next, offset: offset() })
    historyIndex = history.length - 1
  }

  const restore = (index: number) => {
    historyIndex = Math.max(0, Math.min(history.length - 1, index))
    const snapshot = history[historyIndex]
    host.cell.textContent = snapshot.text
    restoreInlineEditFocus(() => host.cell, snapshot.offset)
  }

  const beforeInput = (event: InputEvent) => {
    const direction = inlineEditHistoryDirectionFromInputType(event.inputType)
    if (direction) {
      event.preventDefault()
      restore(direction === 'undo' ? historyIndex - 1 : historyIndex + 1)
      return
    }

    if (isInlineEditLineBreakInput(event.inputType)) {
      event.preventDefault()
    }
  }

  const input = () => remember()

  const keydown = (event: KeyboardEvent) => {
    const direction = inlineEditHistoryDirectionFromKeydown(event)
    if (direction) {
      event.preventDefault()
      restore(direction === 'undo' ? historyIndex - 1 : historyIndex + 1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      host.onCommit(text())
      host.restoreGridFocus()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      restore(0)
      host.onCancel()
      host.restoreGridFocus()
    }
  }

  const paste = (event: ClipboardEvent) => {
    const plainText = event.clipboardData?.getData('text/plain')
    if (typeof plainText !== 'string') return
    event.preventDefault()
    insertInlineEditText(host.cell, inlineEditSingleLineText(plainText))
    remember()
  }

  host.cell.addEventListener('beforeinput', beforeInput)
  host.cell.addEventListener('input', input)
  host.cell.addEventListener('keydown', keydown)
  host.cell.addEventListener('paste', paste)

  return {
    destroy() {
      host.cell.removeEventListener('beforeinput', beforeInput)
      host.cell.removeEventListener('input', input)
      host.cell.removeEventListener('keydown', keydown)
      host.cell.removeEventListener('paste', paste)
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
