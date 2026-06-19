import type { DOMOutputSpec } from 'prosemirror-model'
import {
  tableAlignment,
  type TableAlign,
} from '../../codecs/markdown/nano-markdown-table-align'
import { rawMarkdownInlineDomSpec } from './prosemirror-raw-markdown'
import { hiddenSourceTokenAttrs } from './prosemirror-source-token'
import { markdownTable } from '../../codecs/markdown/nano-markdown-table-serialize'
import {
  normalizeTableAlignments,
  normalizeTableLinePipes,
  normalizeTableRows,
  normalizeTableSeparatorCells,
  tableLineCount,
  tableLinePipesDiffer,
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
    ['figcaption', hiddenSourceTokenAttrs('nano-table-markdown'), markdownTable(
      tableRows,
      alignments,
      separators ?? undefined,
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
    tabindex: '-1',
    'data-editable': String(editable),
    'data-row': String(rowIndex),
    'data-column': String(columnIndex),
  }
}

function tableAlignDataAttrs(align: readonly TableAlign[]): Record<string, string> {
  return align.some((value) => value !== null)
    ? { 'data-align': align.map((value) => value ?? '-').join('|') }
    : {}
}

function tableSeparatorCellDataAttrs(separatorCells: readonly string[] | null): Record<string, string> {
  return separatorCells ? { 'data-separator-cells': separatorCells.join('|') } : {}
}

function tablePipeDataAttrs(leadingPipe: boolean, trailingPipe: boolean): Record<string, string> {
  return {
    ...(leadingPipe ? {} : { 'data-leading-pipe': 'false' }),
    ...(trailingPipe ? {} : { 'data-trailing-pipe': 'false' }),
  }
}

function tableLinePipeDataAttrs(
  leadingPipes: readonly boolean[],
  trailingPipes: readonly boolean[],
  leadingPipe: boolean,
  trailingPipe: boolean,
): Record<string, string> {
  return {
    ...(tableLinePipesDiffer(leadingPipes, leadingPipe) ? { 'data-leading-pipes': leadingPipes.join('|') } : {}),
    ...(tableLinePipesDiffer(trailingPipes, trailingPipe) ? { 'data-trailing-pipes': trailingPipes.join('|') } : {}),
  }
}

function tableCellAttrs(align: TableAlign | undefined): Record<string, string> {
  const value = tableAlignment(align)
  return value ? { 'data-align': value, style: `text-align: ${value};` } : {}
}

function isPlainEditableTableCell(content: readonly unknown[], cell: string): boolean {
  return !/[\r\n]/.test(cell) && content.every((child) => typeof child === 'string')
}

function padTableRow(row: readonly string[], size: number): string[] {
  return Array.from({ length: size }, (_value, index) => row[index] ?? '')
}
