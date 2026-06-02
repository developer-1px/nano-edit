import {
  collapseInlineEditSelection,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  inlineEditTextPositionAtOffset,
  insertInlineEditText,
  isInlineEditLineBreakInput,
} from './dom'

export type ContenteditableScalarLineBreakPolicy = 'single-line' | 'preserve'

export type ContenteditableScalarSelection =
  | { kind: 'start' }
  | { kind: 'end' }
  | { kind: 'select-all' }
  | { kind: 'offset', offset: number }

export type ContenteditableScalarHistoryDirection = 'undo' | 'redo'

export type ContenteditableScalarCommitReason = 'enter' | 'api'

export type ContenteditableScalarCancelReason = 'escape' | 'api'

export interface ContenteditableScalarEditSnapshot {
  readonly element: HTMLElement
  readonly offset: number
  readonly text: string
}

export interface ContenteditableScalarHistoryIntent extends ContenteditableScalarEditSnapshot {
  readonly direction: ContenteditableScalarHistoryDirection
}

export interface ContenteditableScalarCommit extends ContenteditableScalarEditSnapshot {
  readonly reason: ContenteditableScalarCommitReason
}

export interface ContenteditableScalarCancel extends ContenteditableScalarEditSnapshot {
  readonly reason: ContenteditableScalarCancelReason
}

export interface ContenteditableScalarEditOptions {
  readonly element: HTMLElement
  readonly initialText: string
  readonly initialSelection?: ContenteditableScalarSelection
  readonly lineBreak?: ContenteditableScalarLineBreakPolicy
  readonly ariaLabel?: string
  readonly autoFocus?: boolean
  readonly onDraftChange?: (snapshot: ContenteditableScalarEditSnapshot) => void
  readonly onHistoryIntent?: (intent: ContenteditableScalarHistoryIntent) => void
  readonly onCommit?: (commit: ContenteditableScalarCommit) => void
  readonly onCancel?: (cancel: ContenteditableScalarCancel) => void
  readonly restoreHostFocus?: () => void
}

export interface ContenteditableScalarEditHandle {
  readonly element: HTMLElement
  readonly destroy: () => void
  readonly focus: (selection?: ContenteditableScalarSelection) => void
  readonly snapshot: () => ContenteditableScalarEditSnapshot
  readonly insertText: (text: string) => void
  readonly replaceText: (from: number, to: number, text: string) => void
  readonly commit: () => void
  readonly cancel: () => void
}

const defaultSelection: ContenteditableScalarSelection = { kind: 'end' }

export function createContenteditableScalarEdit(
  options: ContenteditableScalarEditOptions,
): ContenteditableScalarEditHandle {
  const element = options.element
  const lineBreak = options.lineBreak ?? 'single-line'
  const previousContentEditable = element.getAttribute('contenteditable')
  const previousRole = element.getAttribute('role')
  const previousAriaMultiline = element.getAttribute('aria-multiline')
  const previousAriaLabel = element.getAttribute('aria-label')
  const previousDatasetValue = element.dataset.nanoInlineEdit
  const initialText = normalizeText(options.initialText, lineBreak)
  let destroyed = false
  let composing = false
  let lastOffset = offsetForSelection(initialText, options.initialSelection ?? defaultSelection)

  element.contentEditable = 'true'
  element.dataset.nanoInlineEdit = 'true'
  if (!previousRole) element.setAttribute('role', 'textbox')
  if (lineBreak === 'single-line') element.setAttribute('aria-multiline', 'false')
  if (options.ariaLabel) element.setAttribute('aria-label', options.ariaLabel)
  element.textContent = initialText

  const snapshot = (): ContenteditableScalarEditSnapshot => {
    const text = currentText()
    lastOffset = inlineEditSelectionOffset(element) ?? Math.min(lastOffset, text.length)
    return { element, offset: lastOffset, text }
  }

  const focus = (selection: ContenteditableScalarSelection = options.initialSelection ?? defaultSelection): void => {
    lastOffset = offsetForSelection(currentText(), selection)
    if (selection.kind === 'select-all') {
      element.focus({ preventScroll: true })
      selectAllInlineEditText(element)
      return
    }

    focusInlineEditNow(element, lastOffset)
  }

  const notifyDraftChange = (): void => {
    options.onDraftChange?.(snapshot())
  }

  const insertText = (text: string): void => {
    insertInlineEditText(element, normalizeText(text, lineBreak))
    notifyDraftChange()
  }

  const replaceText = (from: number, to: number, text: string): void => {
    const start = inlineEditTextPositionAtOffset(element, from)
    const end = inlineEditTextPositionAtOffset(element, to)
    if (!start || !end) {
      collapseInlineEditSelection(element, from)
      insertText(text)
      return
    }

    const range = document.createRange()
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset)
    range.deleteContents()
    range.insertNode(document.createTextNode(normalizeText(text, lineBreak)))
    range.collapse(false)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    notifyDraftChange()
  }

  const commit = (reason: ContenteditableScalarCommitReason = 'api'): void => {
    options.onCommit?.({ ...snapshot(), reason })
    options.restoreHostFocus?.()
  }

  const cancel = (reason: ContenteditableScalarCancelReason = 'api'): void => {
    element.textContent = initialText
    lastOffset = offsetForSelection(initialText, options.initialSelection ?? defaultSelection)
    options.onCancel?.({ ...snapshot(), reason })
    options.restoreHostFocus?.()
  }

  const handleBeforeInput = (event: InputEvent): void => {
    const historyDirection = inlineEditHistoryDirectionFromInputType(event.inputType)
    if (historyDirection && options.onHistoryIntent) {
      event.preventDefault()
      options.onHistoryIntent({ ...snapshot(), direction: historyDirection })
      return
    }

    if (lineBreak === 'single-line' && isInlineEditLineBreakInput(event.inputType)) {
      event.preventDefault()
      return
    }

    if (
      lineBreak === 'single-line'
      && typeof event.data === 'string'
      && event.data !== inlineEditSingleLineText(event.data)
    ) {
      event.preventDefault()
      insertText(event.data)
    }
  }

  const handleInput = (event: Event): void => {
    if (lineBreak === 'single-line') normalizeElementText()
    if (event instanceof InputEvent && (event.isComposing || composing)) {
      rememberSelection()
      return
    }
    notifyDraftChange()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    const historyDirection = inlineEditHistoryDirectionFromKeydown(event)
    if (historyDirection && options.onHistoryIntent) {
      event.preventDefault()
      options.onHistoryIntent({ ...snapshot(), direction: historyDirection })
      return
    }

    if (composing || event.isComposing) return

    if (lineBreak === 'single-line' && event.key === 'Enter') {
      event.preventDefault()
      commit('enter')
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancel('escape')
    }
  }

  const handlePaste = (event: ClipboardEvent): void => {
    if (lineBreak !== 'single-line') return
    const text = event.clipboardData?.getData('text/plain')
    if (typeof text !== 'string') return
    event.preventDefault()
    insertText(text)
  }

  const handleCompositionStart = (): void => {
    composing = true
  }

  const handleCompositionEnd = (): void => {
    composing = false
    if (lineBreak === 'single-line') normalizeElementText()
    notifyDraftChange()
  }

  const handleSelection = (): void => {
    rememberSelection()
  }

  const destroy = (): void => {
    if (destroyed) return
    destroyed = true
    element.removeEventListener('beforeinput', handleBeforeInput)
    element.removeEventListener('input', handleInput)
    element.removeEventListener('keydown', handleKeydown)
    element.removeEventListener('paste', handlePaste)
    element.removeEventListener('compositionstart', handleCompositionStart)
    element.removeEventListener('compositionend', handleCompositionEnd)
    element.removeEventListener('keyup', handleSelection)
    element.removeEventListener('mouseup', handleSelection)
    restoreAttribute(element, 'contenteditable', previousContentEditable)
    restoreAttribute(element, 'role', previousRole)
    restoreAttribute(element, 'aria-multiline', previousAriaMultiline)
    restoreAttribute(element, 'aria-label', previousAriaLabel)
    if (previousDatasetValue === undefined) delete element.dataset.nanoInlineEdit
    else element.dataset.nanoInlineEdit = previousDatasetValue
  }

  function currentText(): string {
    return normalizeText(element.textContent ?? '', lineBreak)
  }

  function rememberSelection(): void {
    lastOffset = inlineEditSelectionOffset(element) ?? Math.min(lastOffset, currentText().length)
  }

  function normalizeElementText(): void {
    const current = element.textContent ?? ''
    const normalized = inlineEditSingleLineText(current)
    if (current === normalized) {
      rememberSelection()
      return
    }
    const offset = Math.min(inlineEditSelectionOffset(element) ?? normalized.length, normalized.length)
    element.textContent = normalized
    lastOffset = offset
    collapseInlineEditSelection(element, offset)
  }

  element.addEventListener('beforeinput', handleBeforeInput)
  element.addEventListener('input', handleInput)
  element.addEventListener('keydown', handleKeydown)
  element.addEventListener('paste', handlePaste)
  element.addEventListener('compositionstart', handleCompositionStart)
  element.addEventListener('compositionend', handleCompositionEnd)
  element.addEventListener('keyup', handleSelection)
  element.addEventListener('mouseup', handleSelection)

  if (options.autoFocus ?? true) focus(options.initialSelection ?? defaultSelection)

  return {
    element,
    destroy,
    focus,
    snapshot,
    insertText,
    replaceText,
    commit,
    cancel,
  }
}

function normalizeText(text: string, lineBreak: ContenteditableScalarLineBreakPolicy): string {
  return lineBreak === 'single-line' ? inlineEditSingleLineText(text) : text
}

function offsetForSelection(text: string, selection: ContenteditableScalarSelection): number {
  if (selection.kind === 'start' || selection.kind === 'select-all') return 0
  if (selection.kind === 'offset') return Math.max(0, Math.min(selection.offset, text.length))
  return text.length
}

function selectAllInlineEditText(element: HTMLElement): void {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
}

function focusInlineEditNow(element: HTMLElement, offset: number): void {
  element.focus({ preventScroll: true })
  collapseInlineEditSelection(element, offset)
}

function restoreAttribute(element: HTMLElement, name: string, previous: string | null): void {
  if (previous === null) element.removeAttribute(name)
  else element.setAttribute(name, previous)
}
