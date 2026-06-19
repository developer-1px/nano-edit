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

export type ContenteditableScalarBlurPolicy = 'none' | 'commit'

export type ContenteditableScalarHistoryPolicy = 'none' | 'local'

export type ContenteditableScalarDecorationDataValue = string | number | boolean | null | undefined

export type ContenteditableScalarSelection =
  | { kind: 'start' }
  | { kind: 'end' }
  | { kind: 'select-all' }
  | { kind: 'offset', offset: number }

export type ContenteditableScalarHistoryDirection = 'undo' | 'redo'

export type ContenteditableScalarCommitReason = 'enter' | 'api' | 'blur'

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

export interface ContenteditableScalarSetTextOptions {
  readonly history?: boolean
  readonly notify?: boolean
}

export interface ContenteditableScalarDecoration {
  readonly from: number
  readonly to: number
  readonly atomic?: boolean
  readonly className?: string
  readonly data?: Readonly<Record<string, ContenteditableScalarDecorationDataValue>>
}

export interface ContenteditableScalarEditOptions {
  readonly element: HTMLElement
  readonly initialText: string
  readonly initialSelection?: ContenteditableScalarSelection
  readonly lineBreak?: ContenteditableScalarLineBreakPolicy
  readonly blur?: ContenteditableScalarBlurPolicy
  readonly decorations?: readonly ContenteditableScalarDecoration[]
  readonly history?: ContenteditableScalarHistoryPolicy
  readonly containTextEditingKeys?: boolean
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
  readonly setText: (
    text: string,
    selection?: ContenteditableScalarSelection,
    options?: ContenteditableScalarSetTextOptions,
  ) => void
  readonly setDecorations: (
    decorations: readonly ContenteditableScalarDecoration[],
    selection?: ContenteditableScalarSelection,
  ) => void
  readonly insertText: (text: string) => void
  readonly replaceText: (from: number, to: number, text: string) => void
  readonly commit: () => void
  readonly cancel: () => void
}

const defaultSelection: ContenteditableScalarSelection = { kind: 'end' }

interface NormalizedScalarDecoration {
  readonly from: number
  readonly to: number
  readonly atomic?: boolean
  readonly className?: string
  readonly data?: Readonly<Record<string, ContenteditableScalarDecorationDataValue>>
}

export function createContenteditableScalarEdit(
  options: ContenteditableScalarEditOptions,
): ContenteditableScalarEditHandle {
  const element = options.element
  const lineBreak = options.lineBreak ?? 'single-line'
  const blurPolicy = options.blur ?? 'none'
  const localHistory = options.history === 'local' && !options.onHistoryIntent
  const previousContentEditable = element.getAttribute('contenteditable')
  const previousRole = element.getAttribute('role')
  const previousAriaMultiline = element.getAttribute('aria-multiline')
  const previousAriaLabel = element.getAttribute('aria-label')
  const previousDatasetValue = element.dataset.nanoInlineEdit
  const initialText = normalizeText(options.initialText, lineBreak)
  let destroyed = false
  let completed = false
  let composing = false
  let decorations = options.decorations ?? []
  let decorationDomActive = false
  let lastOffset = offsetForSelection(initialText, options.initialSelection ?? defaultSelection)
  let historyEntries: ContenteditableScalarEditSnapshot[] = []
  let historyIndex = 0

  element.contentEditable = 'true'
  element.dataset.nanoInlineEdit = 'true'
  if (!previousRole) element.setAttribute('role', 'textbox')
  if (lineBreak === 'single-line') element.setAttribute('aria-multiline', 'false')
  if (options.ariaLabel) element.setAttribute('aria-label', options.ariaLabel)
  renderText(initialText, lastOffset, { restoreSelection: false })
  if (localHistory) {
    historyEntries = [{ element, offset: lastOffset, text: initialText }]
  }

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

  const notifyDraftChange = (history = true): void => {
    const draft = snapshot()
    renderCurrentDecorations(draft.text, draft.offset)
    const renderedDraft = { element, offset: lastOffset, text: draft.text }
    if (history) rememberHistory(renderedDraft)
    options.onDraftChange?.(renderedDraft)
  }

  const setText = (
    text: string,
    selection?: ContenteditableScalarSelection,
    setOptions: ContenteditableScalarSetTextOptions = {},
  ): void => {
    if (completed || destroyed) return
    const normalized = normalizeText(text, lineBreak)
    const nextSelection = selection ?? { kind: 'offset', offset: Math.min(lastOffset, normalized.length) }
    lastOffset = offsetForSelection(normalized, nextSelection)
    renderText(normalized, lastOffset, { restoreSelection: true })
    if (setOptions.history === true) rememberHistory(snapshot())
    if (setOptions.notify === true) notifyDraftChange(setOptions.history !== false)
  }

  const setDecorations = (
    nextDecorations: readonly ContenteditableScalarDecoration[],
    selection?: ContenteditableScalarSelection,
  ): void => {
    if (completed || destroyed) return
    decorations = nextDecorations
    const text = currentText()
    lastOffset = offsetForSelection(text, selection ?? { kind: 'offset', offset: lastOffset })
    if (!composing) renderText(text, lastOffset, { restoreSelection: true })
  }

  const insertText = (text: string): void => {
    if (completed) return
    insertInlineEditText(element, normalizeText(text, lineBreak))
    notifyDraftChange()
  }

  const replaceText = (from: number, to: number, text: string): void => {
    if (completed) return
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
    if (completed || destroyed) return
    completed = true
    options.onCommit?.({ ...snapshot(), reason })
    options.restoreHostFocus?.()
  }

  const cancel = (reason: ContenteditableScalarCancelReason = 'api'): void => {
    if (completed || destroyed) return
    completed = true
    lastOffset = offsetForSelection(initialText, options.initialSelection ?? defaultSelection)
    renderText(initialText, lastOffset, { restoreSelection: true })
    options.onCancel?.({ ...snapshot(), reason })
    options.restoreHostFocus?.()
  }

  const handleBeforeInput = (event: InputEvent): void => {
    if (completed) return
    const historyDirection = inlineEditHistoryDirectionFromInputType(event.inputType)
    if (historyDirection && handleHistoryIntent(historyDirection, event)) {
      return
    }

    const atomicDeleteRange = atomicDecorationDeleteRange(event.inputType)
    if (atomicDeleteRange) {
      event.preventDefault()
      replaceText(atomicDeleteRange.from, atomicDeleteRange.to, '')
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
    if (completed) return
    if (lineBreak === 'single-line') normalizeElementText()
    if (event instanceof InputEvent && (event.isComposing || composing)) {
      rememberSelection()
      return
    }
    notifyDraftChange()
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (completed) return
    if (options.containTextEditingKeys && isContainedTextEditingKey(event)) {
      event.stopPropagation()
    }

    const historyDirection = inlineEditHistoryDirectionFromKeydown(event)
    if (historyDirection && handleHistoryIntent(historyDirection, event)) {
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
    if (completed) return
    if (lineBreak !== 'single-line') return
    const text = event.clipboardData?.getData('text/plain')
    if (typeof text !== 'string') return
    event.preventDefault()
    insertText(text)
  }

  const handleCompositionStart = (): void => {
    if (completed) return
    composing = true
  }

  const handleCompositionEnd = (): void => {
    if (completed) return
    composing = false
    if (lineBreak === 'single-line') normalizeElementText()
    notifyDraftChange()
  }

  const handleSelection = (): void => {
    if (completed) return
    rememberSelection()
  }

  const handleBlur = (): void => {
    if (blurPolicy === 'commit') commit('blur')
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
    element.removeEventListener('blur', handleBlur)
    if (decorationDomActive) element.textContent = currentText()
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

  function renderCurrentDecorations(text: string, offset: number): void {
    if (!decorationDomActive && decorations.length === 0) {
      lastOffset = Math.min(offset, text.length)
      return
    }
    renderText(text, offset, { restoreSelection: true })
  }

  function renderText(
    text: string,
    offset: number,
    renderOptions: { readonly restoreSelection: boolean },
  ): void {
    const nextOffset = Math.max(0, Math.min(offset, text.length))
    const normalizedDecorations = normalizedScalarDecorations(decorations, text.length)
    if (normalizedDecorations.length === 0) {
      if (decorationDomActive || element.textContent !== text) element.textContent = text
      decorationDomActive = false
      lastOffset = nextOffset
      if (renderOptions.restoreSelection) collapseInlineEditSelection(element, nextOffset)
      return
    }

    const fragment = document.createDocumentFragment()
    let cursor = 0
    for (const decoration of normalizedDecorations) {
      if (decoration.from > cursor) {
        fragment.append(document.createTextNode(text.slice(cursor, decoration.from)))
      }
      fragment.append(decoratedTextNode(text.slice(decoration.from, decoration.to), decoration))
      cursor = decoration.to
    }
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)))

    element.replaceChildren(fragment)
    decorationDomActive = true
    lastOffset = nextOffset
    if (renderOptions.restoreSelection) collapseInlineEditSelection(element, nextOffset)
  }

  function decoratedTextNode(text: string, decoration: NormalizedScalarDecoration): HTMLSpanElement {
    const span = document.createElement('span')
    span.dataset.nanoInlineDecoration = 'true'
    if (decoration.atomic) span.dataset.nanoInlineAtomic = 'true'
    if (decoration.className) span.className = decoration.className
    for (const [name, value] of Object.entries(decoration.data ?? {})) {
      if (value === null || value === undefined) continue
      const attributeName = dataAttributeName(name)
      if (!attributeName) continue
      span.setAttribute(attributeName, String(value))
    }
    span.textContent = text
    return span
  }

  function rememberSelection(): void {
    lastOffset = inlineEditSelectionOffset(element) ?? Math.min(lastOffset, currentText().length)
  }

  function atomicDecorationDeleteRange(inputType: string): { from: number, to: number } | null {
    if (composing) return null
    if (inputType !== 'deleteContentBackward' && inputType !== 'deleteContentForward') return null

    const textLength = currentText().length
    const atomicDecorations = normalizedScalarDecorations(decorations, textLength)
      .filter((decoration) => decoration.atomic === true)
    if (atomicDecorations.length === 0) return null

    const selectionRange = inlineEditSelectionRange(element)
    if (!selectionRange) return null

    if (selectionRange.from !== selectionRange.to) {
      const overlapping = atomicDecorations
        .filter((decoration) => selectionRange.from < decoration.to && selectionRange.to > decoration.from)
      if (overlapping.length === 0) return null
      return {
        from: Math.min(selectionRange.from, ...overlapping.map((decoration) => decoration.from)),
        to: Math.max(selectionRange.to, ...overlapping.map((decoration) => decoration.to)),
      }
    }

    const offset = selectionRange.from
    const target = inputType === 'deleteContentBackward'
      ? atomicDecorations.find((decoration) => offset > decoration.from && offset <= decoration.to)
      : atomicDecorations.find((decoration) => offset >= decoration.from && offset < decoration.to)
    return target ? { from: target.from, to: target.to } : null
  }

  function rememberHistory(next: ContenteditableScalarEditSnapshot): void {
    if (!localHistory) return

    const current = historyEntries[historyIndex]
    if (current?.text === next.text) {
      historyEntries[historyIndex] = next
      return
    }

    historyEntries = historyEntries.slice(0, historyIndex + 1)
    historyEntries.push(next)
    historyIndex = historyEntries.length - 1
  }

  function handleHistoryIntent(
    direction: ContenteditableScalarHistoryDirection,
    event: { preventDefault: () => void },
  ): boolean {
    if (options.onHistoryIntent) {
      event.preventDefault()
      options.onHistoryIntent({ ...snapshot(), direction })
      return true
    }

    if (!localHistory) return false

    event.preventDefault()
    restoreLocalHistory(direction)
    return true
  }

  function restoreLocalHistory(direction: ContenteditableScalarHistoryDirection): void {
    const nextIndex = direction === 'undo'
      ? Math.max(0, historyIndex - 1)
      : Math.min(historyEntries.length - 1, historyIndex + 1)
    if (nextIndex === historyIndex) return

    historyIndex = nextIndex
    const entry = historyEntries[historyIndex]
    if (!entry) return
    setText(entry.text, { kind: 'offset', offset: entry.offset }, {
      history: false,
      notify: true,
    })
  }

  function normalizeElementText(): void {
    const current = element.textContent ?? ''
    const normalized = inlineEditSingleLineText(current)
    if (current === normalized) {
      rememberSelection()
      return
    }
    const offset = Math.min(inlineEditSelectionOffset(element) ?? normalized.length, normalized.length)
    lastOffset = offset
    renderText(normalized, offset, { restoreSelection: true })
  }

  element.addEventListener('beforeinput', handleBeforeInput)
  element.addEventListener('input', handleInput)
  element.addEventListener('keydown', handleKeydown)
  element.addEventListener('paste', handlePaste)
  element.addEventListener('compositionstart', handleCompositionStart)
  element.addEventListener('compositionend', handleCompositionEnd)
  element.addEventListener('keyup', handleSelection)
  element.addEventListener('mouseup', handleSelection)
  element.addEventListener('blur', handleBlur)

  if (options.autoFocus ?? true) focus(options.initialSelection ?? defaultSelection)

  return {
    element,
    destroy,
    focus,
    snapshot,
    setText,
    setDecorations,
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

function normalizedScalarDecorations(
  decorations: readonly ContenteditableScalarDecoration[],
  textLength: number,
): NormalizedScalarDecoration[] {
  let occupiedUntil = 0
  const normalized: NormalizedScalarDecoration[] = []
  for (const decoration of [...decorations].sort((left, right) => left.from - right.from || left.to - right.to)) {
    const from = Math.max(0, Math.min(decoration.from, textLength))
    const to = Math.max(from, Math.min(decoration.to, textLength))
    if (to <= from || from < occupiedUntil) continue
    normalized.push({
      atomic: decoration.atomic,
      className: decoration.className,
      data: decoration.data,
      from,
      to,
    })
    occupiedUntil = to
  }
  return normalized
}

function inlineEditSelectionRange(element: HTMLElement): { from: number, to: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) return null

  try {
    const startPrefix = document.createRange()
    startPrefix.selectNodeContents(element)
    startPrefix.setEnd(range.startContainer, range.startOffset)
    const endPrefix = document.createRange()
    endPrefix.selectNodeContents(element)
    endPrefix.setEnd(range.endContainer, range.endOffset)
    const from = startPrefix.toString().length
    const to = endPrefix.toString().length
    return from <= to ? { from, to } : { from: to, to: from }
  } catch {
    return null
  }
}

function dataAttributeName(name: string): string | null {
  const normalized = name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return normalized ? `data-${normalized}` : null
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

function isContainedTextEditingKey(event: KeyboardEvent): boolean {
  if (inlineEditHistoryDirectionFromKeydown(event)) return true
  if (event.altKey || event.ctrlKey || event.metaKey) return false
  return event.key === 'Backspace'
    || event.key === 'Delete'
    || event.key === 'Enter'
    || event.key === 'Escape'
}

function restoreAttribute(element: HTMLElement, name: string, previous: string | null): void {
  if (previous === null) element.removeAttribute(name)
  else element.setAttribute(name, previous)
}
