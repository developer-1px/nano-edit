import { Plugin } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { normalizeTableRows } from '../adapters/prosemirror/prosemirror-table-normalize'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { blockPositionById } from '../blocks/nano-block-structure'

export function tableCellEditPlugin(): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        input: (view, event) => handleTableCellInput(view, event),
      },
    },
  })
}

function handleTableCellInput(view: EditorView, event: Event): boolean {
  const cell = tableCellFromEventTarget(event.target)
  if (!cell) return false

  const committed = commitTableCellText(view, cell)
  if (committed) {
    event.preventDefault()
    event.stopPropagation()
  }
  return committed
}

function commitTableCellText(view: EditorView, cell: HTMLTableCellElement): boolean {
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
  restoreCellFocus(view, target, text.length)
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
  requestAnimationFrame(() => {
    const selector = `.nano-table[data-id="${cssEscape(target.id)}"] [data-row="${target.rowIndex}"][data-column="${target.columnIndex}"]`
    const cell = view.dom.querySelector<HTMLElement>(selector)
    if (!cell) return

    cell.focus({ preventScroll: true })
    collapseSelection(cell, offset)
  })
}

function collapseSelection(element: HTMLElement, offset: number): void {
  const selection = window.getSelection()
  const text = firstEditableTextNode(element)
  if (!selection || !text) return

  const nextOffset = Math.max(0, Math.min(offset, text.data.length))
  const range = document.createRange()
  range.setStart(text, nextOffset)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

function firstEditableTextNode(element: HTMLElement): Text | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const node = walker.nextNode()
  return node instanceof Text ? node : null
}

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/["\\]/g, '\\$&')
}
