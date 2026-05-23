import {
  markdownTableSeparatorCell,
  normalizeTableAlignments,
  normalizeTableLinePipes,
} from './prosemirror-table-normalize'
import type { TableAlign } from './prosemirror-table-types'

export function markdownTableToken(
  rows: readonly string[][],
  align: readonly TableAlign[] = [],
  separatorCells: readonly string[] | null = null,
  leadingPipe = true,
  trailingPipe = true,
  leadingPipes: readonly boolean[] = [],
  trailingPipes: readonly boolean[] = [],
): string {
  const columnCount = Math.max(1, ...rows.map((row) => row.length))
  const header = padTableRow(rows[0] ?? [], columnCount)
  const body = rows.slice(1).map((row) => padTableRow(row, columnCount))
  const alignments = normalizeTableAlignments(align, columnCount)
  const lineCount = body.length + 2
  const lineLeadingPipes = normalizeTableLinePipes(leadingPipes, lineCount, leadingPipe)
  const lineTrailingPipes = normalizeTableLinePipes(trailingPipes, lineCount, trailingPipe)
  return [
    markdownTableRow(header, lineLeadingPipes[0], lineTrailingPipes[0]),
    markdownTableRow(separatorCells ?? alignments.map(markdownTableSeparatorCell), lineLeadingPipes[1], lineTrailingPipes[1]),
    ...body.map((row, index) => markdownTableRow(row, lineLeadingPipes[index + 2], lineTrailingPipes[index + 2])),
  ].join('\n')
}

function markdownTableRow(row: readonly string[], leadingPipe = true, trailingPipe = true): string {
  const content = row.map((cell) => escapeMarkdownTableCell(String(cell))).join(' | ')
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
      if (codeFenceLength === 0) {
        codeFenceLength = length
      } else if (length === codeFenceLength) {
        codeFenceLength = 0
      }
      index += length
      continue
    }

    markdown += codeFenceLength === 0 && char === '|' ? '\\|' : char
    index += 1
  }

  return markdown
}

function padTableRow(row: readonly string[], size: number): string[] {
  return Array.from({ length: size }, (_value, index) => row[index] ?? '')
}

function backtickRunLength(source: string, from: number): number {
  let index = from
  while (source[index] === '`') index += 1
  return index - from
}
