import { Plugin, PluginKey } from 'prosemirror-state'
import type { EditorState } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { normalizeTableRows } from '../../../adapters/prosemirror/prosemirror-table-normalize'
import { nanoNodeNames } from '../../../adapters/prosemirror/prosemirror-names'
import { blockPositionById } from '../../../entities/block/structure/nano-block-structure'
import {
  inlineEditHasLineBreak,
  inlineEditHistoryDirectionFromInputType,
  inlineEditHistoryDirectionFromKeydown,
  inlineEditSelectionOffset,
  inlineEditSingleLineText,
  insertInlineEditText,
  isInlineEditLineBreakInput,
  restoreInlineEditFocus,
} from '../../../inline-edit/index'

export interface TableCellEditActions {
  restoreHistory: (direction: 'undo' | 'redo') => void
}

export interface TableCellEditPluginState {
  activeTableBlockId: string | null
}

export const tableCellEditPluginKey = new PluginKey<TableCellEditPluginState>('nano-table-cell-edit')

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
        const next = transaction.getMeta(tableCellEditPluginKey) as TableCellEditPluginState | undefined
        return next ?? value
      },
    },
    props: {
      handleDOMEvents: {
        beforeinput: (view, event) => handleTableCellBeforeInput(view, event as InputEvent, actions),
        focusin: (view, event) => handleTableCellFocusIn(view, event as FocusEvent),
        focusout: (view, event) => handleTableCellFocusOut(view, event as FocusEvent),
        keydown: (_view, event) => handleTableCellKeydown(event as KeyboardEvent, actions),
        input: (view, event) => handleTableCellInput(view, event),
        compositionend: (view, event) => handleTableCellCompositionEnd(view, event),
        paste: (view, event) => handleTableCellPaste(view, event as ClipboardEvent),
      },
    },
  })
}

function handleTableCellBeforeInput(
  view: EditorView,
  event: InputEvent,
  actions: TableCellEditActions,
): boolean {
  const cell = tableCellFromEventTarget(event.target)
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

  const text = event.data
  if (typeof text === 'string' && inlineEditHasLineBreak(text)) {
    event.preventDefault()
    insertTableCellText(view, cell, inlineEditSingleLineText(text))
    return true
  }

  return false
}

function handleTableCellKeydown(event: KeyboardEvent, actions: TableCellEditActions): boolean {
  const cell = tableCellFromEventTarget(event.target)
  if (!cell) return false

  const historyDirection = inlineEditHistoryDirectionFromKeydown(event)
  if (historyDirection) {
    event.preventDefault()
    event.stopPropagation()
    actions.restoreHistory(historyDirection)
    return true
  }

  if (event.key !== 'Enter') return false

  event.preventDefault()
  return true
}

function handleTableCellInput(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEventTarget(event.target)
  if (!cell) return false
  setActiveTableCellBlock(view, cell)

  if (event instanceof InputEvent && event.isComposing) {
    event.preventDefault()
    event.stopPropagation()
    return true
  }

  return handleTableCellCommit(view, event, cell)
}

function handleTableCellCompositionEnd(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEventTarget(event.target)
  if (cell) setActiveTableCellBlock(view, cell)
  return cell ? handleTableCellCommit(view, event, cell) : false
}

function handleTableCellPaste(view: EditorView, event: ClipboardEvent): boolean {
  const cell = tableCellFromEventTarget(event.target)
  if (!cell) return false
  setActiveTableCellBlock(view, cell)

  const text = event.clipboardData?.getData('text/plain')
  if (typeof text !== 'string') return false

  event.preventDefault()
  event.stopPropagation()
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

function handleTableCellFocusIn(view: EditorView, event: FocusEvent): boolean {
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
  nextRows[target.rowIndex]![target.columnIndex] = text

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
