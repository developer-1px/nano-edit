import type { NanoBlock } from '../../core/nano-core'
import {
  parseTableRow,
  parseTableSeparator,
} from './nano-markdown-table-cells'
import { nextMarkdownBlockId } from './nano-markdown-table-id'
import {
  normalizeTableAlignments,
  normalizeTableRows,
} from './nano-markdown-table-normalize'
import {
  tableLinePipeAttrs,
  tablePipeAttrs,
  tableSeparatorCellsAttrs,
} from './nano-markdown-table-pipes'
import type { MarkdownParseState } from './nano-markdown-table-types'

export function parseTable(
  lines: readonly string[],
  index: number,
  state: MarkdownParseState,
): { block: NanoBlock; nextIndex: number } | null {
  const headerLine = lines[index] ?? ''
  const separatorLine = lines[index + 1] ?? ''
  const header = parseTableRow(headerLine)
  const separator = parseTableSeparator(separatorLine)
  if (!header || !separator || header.length < 2) return null

  const rows = [header]
  const rowLines = [headerLine, separatorLine]
  let nextIndex = index + 2
  while (nextIndex < lines.length) {
    const rowLine = lines[nextIndex]!
    const row = parseTableRow(rowLine)
    if (!row) break
    rows.push(row)
    rowLines.push(rowLine)
    nextIndex += 1
  }

  const align = normalizeTableAlignments(separator.align, header.length)
  return {
    block: {
      id: nextMarkdownBlockId(state),
      type: 'table',
      rows: normalizeTableRows(rows),
      ...(align.some((value) => value !== null) ? { align } : {}),
      ...tablePipeAttrs(headerLine),
      ...tableLinePipeAttrs(rowLines),
      ...tableSeparatorCellsAttrs(separator.cells, align, header.length),
    },
    nextIndex,
  }
}
