import { Plugin, PluginKey } from 'prosemirror-state'
import type { EditorState } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { normalizeTableRows } from '../../../adapters/prosemirror/prosemirror-table-normalize'
import { nanoNodeNames } from '../../../adapters/prosemirror/prosemirror-names'
import { blockPositionById } from '../../../entities/block/structure/nano-block-node-kind'
import {
  inlineEditHasLineBreak,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  isInlineEditLineBreakInput,
  restoreInlineEditFocus,
} from '../../../inline-edit/dom'
import {
  isClipboardEvent,
  isFocusEvent,
  isInputEvent,
  isKeyboardEvent,
} from '../../../view/dom-events'

export interface TableCellEditActions {
  restoreHistory: (direction: 'undo' | 'redo') => void
}

interface TableCellEditPluginState {
  activeTableBlockId: string | null
}

const tableCellEditPluginKey = new PluginKey<TableCellEditPluginState>('nano-table-cell-edit')

const inactiveTableCellEditState: TableCellEditPluginState = { activeTableBlockId: null }

export function activeTableCellBlockId(state: EditorState): string | null {
  return tableCellEditPluginKey.getState(state)?.activeTableBlockId ?? null
}

export function tableCellEditPlugin(actions: TableCellEditActions): Plugin<TableCellEditPluginState> {
  return new Plugin<TableCellEditPluginState>({
    key: tableCellEditPluginKey,
    state: {
      init: () => inactiveTableCellEditState,
      apply: (transaction, value) => {
        const next = tableCellEditPluginStateFromMeta(transaction.getMeta(tableCellEditPluginKey))
        return next ?? value
      },
    },
    props: {
      handleDOMEvents: {
        beforeinput: (view, event) => isInputEvent(event) && handleTableCellBeforeInput(view, event, actions),
        focusin: (view, event) => handleTableCellFocusIn(view, event),
        focusout: (view, event) => isFocusEvent(event) && handleTableCellFocusOut(view, event),
        keydown: (view, event) => isKeyboardEvent(event) && handleTableCellKeydown(view, event, actions),
        input: (view, event) => handleTableCellInput(view, event),
        compositionstart: (view, event) => handleTableCellCompositionStart(view, event),
        compositionend: (view, event) => handleTableCellCompositionEnd(view, event),
        paste: (view, event) => isClipboardEvent(event) && handleTableCellPaste(view, event),
      },
    },
  })
}

function tableCellEditPluginStateFromMeta(meta: unknown): TableCellEditPluginState | null {
  if (!meta || typeof meta !== 'object') return null
  const activeTableBlockId = Reflect.get(meta, 'activeTableBlockId')
  return activeTableBlockId === null || typeof activeTableBlockId === 'string'
    ? { activeTableBlockId }
    : null
}

function handleTableCellBeforeInput(
  view: EditorView,
  event: InputEvent,
  actions: TableCellEditActions,
): boolean {
  const cell = tableCellFromEvent(view, event)
  if (!cell) return false
  setActiveTableCellBlock(view, cell)

  const historyDirection = inlineEditHistoryDirectionFromInputType(event.inputType)
  if (historyDirection) {
    event.preventDefault()
    event.stopPropagation()
    actions.restoreHistory(historyDirection)
    return true
  }

  if (isInlineEditLineBreakInput(event.inputType)) {
    event.preventDefault()
    return true
  }

  if (event.inputType === 'insertCompositionText' && typeof event.data === 'string') {
    event.preventDefault()
    event.stopPropagation()
    insertInlineEditText(cell, inlineEditSingleLineText(event.data))
    return true
  }

  const text = event.data
  if (typeof text === 'string' && inlineEditHasLineBreak(text)) {
    event.preventDefault()
    insertTableCellText(view, cell, inlineEditSingleLineText(text))
    return true
  }

  return false
}

function handleTableCellKeydown(
  view: EditorView,
  event: KeyboardEvent,
  actions: TableCellEditActions,
): boolean {
  const cell = tableCellFromEvent(view, event)
  if (!cell) return false

  const historyDirection = inlineEditHistoryDirectionFromKeydown(event)
  if (historyDirection) {
    event.preventDefault()
    event.stopPropagation()
    actions.restoreHistory(historyDirection)
    return true
  }

  if (event.key === 'Tab') {
    return moveTableCellFocus(cell, event.shiftKey ? -1 : 1, event)
  }

  if (event.key !== 'Enter') return false

  event.preventDefault()
  return true
}

function handleTableCellInput(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEvent(view, event)
  if (!cell) return false
  setActiveTableCellBlock(view, cell)

  if (isInputEvent(event) && event.isComposing) {
    event.preventDefault()
    event.stopPropagation()
    return true
  }

  return handleTableCellCommit(view, event, cell)
}

function handleTableCellCompositionStart(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEvent(view, event)
  if (!cell) return false
  setActiveTableCellBlock(view, cell)
  event.stopPropagation()
  return true
}

function handleTableCellCompositionEnd(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEvent(view, event)
  if (cell) setActiveTableCellBlock(view, cell)
  return cell ? handleTableCellCommit(view, event, cell) : false
}

function handleTableCellPaste(view: EditorView, event: ClipboardEvent): boolean {
  const cell = tableCellFromEvent(view, event)
  if (!cell) return false
  setActiveTableCellBlock(view, cell)

  const text = event.clipboardData?.getData('text/plain')
  if (typeof text !== 'string') return false

  event.preventDefault()
  event.stopPropagation()
  if (tabularTextCells(text)) {
    commitTableCellGridText(view, cell, text)
    return true
  }

  insertTableCellText(view, cell, inlineEditSingleLineText(text))
  return true
}

function handleTableCellCommit(view: EditorView, event: Event, cell: HTMLTableCellElement): boolean {
  setActiveTableCellBlock(view, cell)
  const offset = inlineEditSelectionOffset(cell) ?? (cell.textContent ?? '').length
  commitTableCellText(view, cell, offset)
  event.preventDefault()
  event.stopPropagation()
  return true
}

function handleTableCellFocusIn(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEventTarget(event.target)
  if (cell) setActiveTableCellBlock(view, cell)
  return false
}

function handleTableCellFocusOut(view: EditorView, event: FocusEvent): boolean {
  const nextCell = tableCellFromEventTarget(event.relatedTarget)
  if (nextCell) setActiveTableCellBlock(view, nextCell)
  else clearActiveTableCellBlock(view)
  return false
}

function insertTableCellText(view: EditorView, cell: HTMLTableCellElement, text: string): void {
  insertInlineEditText(cell, text)
  commitTableCellText(view, cell, inlineEditSelectionOffset(cell) ?? (cell.textContent ?? '').length)
}

function commitTableCellGridText(view: EditorView, cell: HTMLTableCellElement, text: string): boolean {
  const target = tableCellTarget(cell)
  if (!target) return false

  const position = blockPositionById(view.state.doc, target.id)
  if (position === null) return false

  const node = view.state.doc.nodeAt(position)
  if (!node || node.type.name !== nanoNodeNames.table) return false

  const tableRows = normalizeTableRows(node.attrs.rows)
  const pastedRows = tabularTextCells(text)
  if (!pastedRows) return false

  const nextRows = tableRows.map((value) => [...value])
  let lastTarget = target
  let changed = false

  for (const [rowOffset, pastedRow] of pastedRows.entries()) {
    const rowIndex = target.rowIndex + rowOffset
    const nextRow = nextRows[rowIndex]
    if (!nextRow) continue

    for (const [columnOffset, value] of pastedRow.entries()) {
      const columnIndex = target.columnIndex + columnOffset
      if (columnIndex < 0 || columnIndex >= nextRow.length) continue
      if (nextRow[columnIndex] === value) continue

      nextRow[columnIndex] = value
      lastTarget = { ...target, columnIndex, rowIndex }
      changed = true
    }
  }

  if (!changed) return false

  const transaction = view.state.tr
    .setNodeMarkup(position, undefined, {
      ...node.attrs,
      rows: nextRows,
    })
    .setMeta('inputType', 'tableCellPaste')

  view.dispatch(transaction)
  restoreCellFocus(view, lastTarget, nextRows[lastTarget.rowIndex]?.[lastTarget.columnIndex]?.length ?? 0)
  return true
}

function commitTableCellText(view: EditorView, cell: HTMLTableCellElement, offset: number): boolean {
  const target = tableCellTarget(cell)
  if (!target) return false

  const position = blockPositionById(view.state.doc, target.id)
  if (position === null) return false

  const node = view.state.doc.nodeAt(position)
  if (!node || node.type.name !== nanoNodeNames.table) return false

  const rows = normalizeTableRows(node.attrs.rows)
  const row = rows[target.rowIndex]
  if (!row || target.columnIndex < 0 || target.columnIndex >= row.length) return false

  const text = cell.textContent ?? ''
  if (row[target.columnIndex] === text) return false

  const nextRows = rows.map((value) => [...value])
  const nextRow = nextRows[target.rowIndex]
  if (!nextRow) return false
  nextRow[target.columnIndex] = text

  const transaction = view.state.tr
    .setNodeMarkup(position, undefined, {
      ...node.attrs,
      rows: nextRows,
    })
    .setMeta('inputType', 'tableCellInput')

  view.dispatch(transaction)
  restoreCellFocus(view, target, offset)
  return true
}

function tableCellTarget(cell: HTMLTableCellElement): {
  columnIndex: number
  id: string
  rowIndex: number
} | null {
  const table = cell.closest<HTMLElement>('.nano-table[data-id]')
  const id = table?.dataset.id
  if (!id) return null

  const rowIndex = Number(cell.dataset.row)
  const columnIndex = Number(cell.dataset.column)
  if (!Number.isInteger(rowIndex) || !Number.isInteger(columnIndex)) return null

  return { columnIndex, id, rowIndex }
}

function moveTableCellFocus(cell: HTMLTableCellElement, direction: -1 | 1, event: KeyboardEvent): boolean {
  const cells = tableEditableCells(cell)
  const index = cells.indexOf(cell)
  if (index < 0) return false

  const nextCell = cells[index + direction]
  if (!nextCell) return false

  event.preventDefault()
  event.stopPropagation()
  restoreInlineEditFocus(() => nextCell, nextCell.textContent?.length ?? 0)
  return true
}

function tableEditableCells(cell: HTMLTableCellElement): HTMLTableCellElement[] {
  const table = cell.closest<HTMLElement>('.nano-table[data-id]')
  if (!table) return []
  return [...table.querySelectorAll<HTMLTableCellElement>('th[data-row][data-column], td[data-row][data-column]')]
    .filter((candidate) => candidate.isContentEditable)
}

function tabularTextCells(text: string): string[][] | null {
  if (!text.includes('\t')) return null

  let normalized = text.replace(/\r\n?/g, '\n')
  if (normalized.endsWith('\n')) normalized = normalized.slice(0, -1)

  const rows = normalized
    .split('\n')
    .map((row) => row.split('\t').map((cell) => inlineEditSingleLineText(cell)))

  if (rows.length === 0) return null
  if (rows.length === 1 && rows[0]?.length === 1) return null
  return rows
}

function setActiveTableCellBlock(view: EditorView, cell: HTMLTableCellElement): void {
  const target = tableCellTarget(cell)
  if (!target) return

  if (activeTableCellBlockId(view.state) === target.id) return
  dispatchActiveTableCellState(view, { activeTableBlockId: target.id })
}

function clearActiveTableCellBlock(view: EditorView): void {
  if (!activeTableCellBlockId(view.state)) return
  dispatchActiveTableCellState(view, inactiveTableCellEditState)
}

function dispatchActiveTableCellState(view: EditorView, state: TableCellEditPluginState): void {
  view.dispatch(
    view.state.tr
      .setMeta(tableCellEditPluginKey, state)
      .setMeta('addToHistory', false),
  )
}

function tableCellFromEventTarget(target: EventTarget | null): HTMLTableCellElement | null {
  const element = target instanceof Element
    ? target
    : target instanceof Node
      ? target.parentElement
      : null
  const cell = element?.closest<HTMLTableCellElement>('.nano-table th[data-row][data-column], .nano-table td[data-row][data-column]')
  return cell?.isContentEditable ? cell : null
}

function tableCellFromEvent(view: EditorView, event: Event): HTMLTableCellElement | null {
  const directCell = tableCellFromEventTarget(event.target)
  if (directCell && view.dom.contains(directCell)) return directCell

  const selectionCell = tableCellFromSelection(view.dom.ownerDocument)
  return selectionCell && view.dom.contains(selectionCell) ? selectionCell : null
}

function tableCellFromSelection(document: Document): HTMLTableCellElement | null {
  const selection = document.getSelection()
  const node = selection?.anchorNode ?? null
  return tableCellFromEventTarget(node)
}

function restoreCellFocus(
  view: EditorView,
  target: { columnIndex: number; id: string; rowIndex: number },
  offset: number,
): void {
  restoreInlineEditFocus(() => {
    const selector = `.nano-table[data-id="${cssEscape(target.id)}"] [data-row="${target.rowIndex}"][data-column="${target.columnIndex}"]`
    return view.dom.querySelector<HTMLElement>(selector)
  }, offset)
}

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/["\\]/g, '\\$&')
}
