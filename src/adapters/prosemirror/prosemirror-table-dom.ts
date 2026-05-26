import type { DOMOutputSpec } from 'prosemirror-model'
import type { TableAlign } from './prosemirror-table-types'
import { rawMarkdownInlineDomSpec } from './prosemirror-raw-markdown'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'
import {
  tableAlignDataAttrs,
  tableCellAttrs,
  tableLinePipeDataAttrs,
  tablePipeDataAttrs,
  tableSeparatorCellDataAttrs,
} from './prosemirror-table-data-attrs'
import { markdownTableToken } from './prosemirror-table-markdown'
import {
  normalizeTableAlignments,
  normalizeTableLinePipes,
  normalizeTableRows,
  normalizeTableSeparatorCells,
  tableLineCount,
  tablePipe,
} from './prosemirror-table-normalize'

export function tableDomSpec(
  id: unknown,
  rows: unknown,
  align: unknown,
  separatorCells?: unknown,
  leadingPipe?: unknown,
  trailingPipe?: unknown,
  leadingPipes?: unknown,
  trailingPipes?: unknown,
): DOMOutputSpec {
  const tableRows = normalizeTableRows(rows)
  const columnCount = Math.max(1, ...tableRows.map((row) => row.length))
  const header = padTableRow(tableRows[0] ?? [], columnCount)
  const bodyRows = tableRows.slice(1).map((row) => padTableRow(row, columnCount))
  const alignments = normalizeTableAlignments(align, columnCount)
  const separators = normalizeTableSeparatorCells(separatorCells, alignments, columnCount)
  const tableLeadingPipe = tablePipe(leadingPipe)
  const tableTrailingPipe = tablePipe(trailingPipe)
  const tableLeadingPipes = normalizeTableLinePipes(leadingPipes, tableLineCount(tableRows), tableLeadingPipe)
  const tableTrailingPipes = normalizeTableLinePipes(trailingPipes, tableLineCount(tableRows), tableTrailingPipe)

  return [
    'figure',
    {
      class: 'nano-block nano-table',
      'data-id': id,
      ...tableAlignDataAttrs(alignments),
      ...tablePipeDataAttrs(tableLeadingPipe, tableTrailingPipe),
      ...tableLinePipeDataAttrs(tableLeadingPipes, tableTrailingPipes, tableLeadingPipe, tableTrailingPipe),
      ...tableSeparatorCellDataAttrs(separators),
    },
    [
      'table',
      {},
      ['thead', {}, ['tr', {}, ...header.map((cell, index) => tableCellDomSpec('th', 0, index, alignments[index], cell))]],
      ['tbody', {}, ...bodyRows.map((row, rowIndex) => ['tr', {}, ...row.map((cell, index) => tableCellDomSpec('td', rowIndex + 1, index, alignments[index], cell))])],
    ],
    ['figcaption', hiddenSourceTokenAttrs('nano-table-markdown'), markdownTableToken(
      tableRows,
      alignments,
      separators,
      tableLeadingPipe,
      tableTrailingPipe,
      tableLeadingPipes,
      tableTrailingPipes,
    )],
  ]
}

function tableCellDomSpec(
  tag: 'td' | 'th',
  rowIndex: number,
  columnIndex: number,
  align: TableAlign | undefined,
  cell: string,
): DOMOutputSpec {
  const content = rawMarkdownInlineDomSpec(cell)
  const editable = isPlainEditableTableCell(content, cell)
  return [
    tag,
    tableCellEditAttrs(rowIndex, columnIndex, align, editable),
    ...content,
  ]
}

function tableCellEditAttrs(rowIndex: number, columnIndex: number, align: TableAlign | undefined, editable: boolean): Record<string, string> {
  return {
    ...tableCellAttrs(align),
    contenteditable: String(editable),
    spellcheck: 'false',
    'data-editable': String(editable),
    'data-row': String(rowIndex),
    'data-column': String(columnIndex),
  }
}

function isPlainEditableTableCell(content: readonly unknown[], cell: string): boolean {
  return !/[\r\n]/.test(cell) && content.every((child) => typeof child === 'string')
}

function padTableRow(row: readonly string[], size: number): string[] {
  return Array.from({ length: size }, (_value, index) => row[index] ?? '')
}
