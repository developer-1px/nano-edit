import type { DOMOutputSpec } from 'prosemirror-model'
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
      ['thead', {}, ['tr', {}, ...header.map((cell, index) => ['th', tableCellAttrs(alignments[index]), ...rawMarkdownInlineDomSpec(cell)])]],
      ['tbody', {}, ...bodyRows.map((row) => ['tr', {}, ...row.map((cell, index) => ['td', tableCellAttrs(alignments[index]), ...rawMarkdownInlineDomSpec(cell)])])],
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

function padTableRow(row: readonly string[], size: number): string[] {
  return Array.from({ length: size }, (_value, index) => row[index] ?? '')
}
