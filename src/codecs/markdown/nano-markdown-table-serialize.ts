import {
  markdownTableSeparatorCell,
  normalizeTableAlignments,
  normalizeTableLinePipes,
  normalizeTableRows,
  normalizeTableSeparatorCells,
  padTableRow,
} from './nano-markdown-table-normalize'
import type { TableAlign } from './nano-markdown-table-types'

export function markdownTable(
  rows: readonly string[][],
  align: readonly TableAlign[] | undefined,
  separatorCells?: readonly string[],
  leadingPipe?: boolean,
  trailingPipe?: boolean,
  leadingPipes?: readonly boolean[],
  trailingPipes?: readonly boolean[],
): string {
  const tableRows = normalizeTableRows(rows)
  const columnCount = Math.max(1, ...tableRows.map((row) => row.length))
  const header = padTableRow(tableRows[0] ?? [], columnCount)
  const body = tableRows.slice(1).map((row) => padTableRow(row, columnCount))
  const alignments = normalizeTableAlignments(align, columnCount)
  const separator = normalizeTableSeparatorCells(separatorCells, alignments, columnCount)
  const lineCount = body.length + 2
  const lineLeadingPipes = normalizeTableLinePipes(leadingPipes, lineCount, leadingPipe !== false)
  const lineTrailingPipes = normalizeTableLinePipes(trailingPipes, lineCount, trailingPipe !== false)

  return [
    markdownTableRow(header, lineLeadingPipes[0], lineTrailingPipes[0]),
    markdownTableRow(separator ?? alignments.map(markdownTableSeparatorCell), lineLeadingPipes[1], lineTrailingPipes[1]),
    ...body.map((row, index) => markdownTableRow(row, lineLeadingPipes[index + 2], lineTrailingPipes[index + 2])),
  ].join('\n')
}

function markdownTableRow(row: readonly string[], leadingPipe = true, trailingPipe = true): string {
  const content = row.map(escapeMarkdownTableCell).join(' | ')
  return `${leadingPipe ? '| ' : ''}${content}${trailingPipe ? ' |' : ''}`
}

function escapeMarkdownTableCell(text: string): string {
  let markdown = ''
  let codeFenceLength = 0
  let index = 0

  while (index < text.length) {
    const char = text[index]!
    if (char === '`') {
      const length = backtickRunLength(text, index)
      markdown += text.slice(index, index + length)
      codeFenceLength = codeFenceLength === 0 ? length : length === codeFenceLength ? 0 : codeFenceLength
      index += length
      continue
    }

    markdown += codeFenceLength === 0 && char === '|' ? '\\|' : char
    index += 1
  }

  return markdown
}

function backtickRunLength(source: string, from: number): number {
  let index = from
  while (source[index] === '`') index += 1
  return index - from
}
