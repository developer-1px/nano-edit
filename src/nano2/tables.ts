import type { Plugin, EditorState, Transaction } from 'prosemirror-state'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'
import { normalizeTableRows } from '../adapters/prosemirror/prosemirror-table-normalize'
import { blockPositionById } from '../entities/block/structure/nano-block-node-kind'
import {
  tableCellEditPlugin,
  type TableCellEditActions,
} from '../features/viewer-edit/table-cell-edit/table-cell-edit-plugin'

export function nano2TablePlugin(actions: TableCellEditActions): Plugin {
  return tableCellEditPlugin(actions)
}

export function nano2SetTableCellTransaction(
  state: EditorState,
  blockId: string,
  rowIndex: number,
  columnIndex: number,
  text: string,
): Transaction | null {
  const position = blockPositionById(state.doc, blockId)
  if (position === null) return null

  const node = state.doc.nodeAt(position)
  if (!node || node.type.name !== nanoNodeNames.table) return null

  const rows = normalizeTableRows(node.attrs.rows)
  const row = rows[rowIndex]
  if (!row || columnIndex < 0 || columnIndex >= row.length) return null
  if (row[columnIndex] === text) return null

  const nextRows = rows.map((value) => [...value])
  const nextRow = nextRows[rowIndex]
  if (!nextRow) return null
  nextRow[columnIndex] = text

  return state.tr
    .setNodeMarkup(position, undefined, {
      ...node.attrs,
      rows: nextRows,
    })
    .setMeta('inputType', 'nano2TableCellInput')
}
