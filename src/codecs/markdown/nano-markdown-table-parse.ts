import type { NanoBlock } from '../../entities/document/nano-document-model'
import { backtickRunLength } from './nano-markdown-inline-code-span'
import { nextMarkdownBlockId } from './nano-markdown-state'
import {
  markdownTableSeparatorCell,
  tableAlignment,
  tableSeparatorCellAlignment,
  type TableAlign,
} from './nano-markdown-table-align'
import {
  normalizeTableAlignments,
  normalizeTableSeparatorCells,
  normalizeTableRows,
} from './nano-markdown-table-normalize'
import type { MarkdownParseState } from './nano-markdown-types'

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
    const rowLine = lines[nextIndex] ?? ''
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

function tableSeparatorCellsAttrs(cells: readonly string[], align: readonly TableAlign[], size: number): { separatorCells?: string[] } {
  const normalized = normalizeTableSeparatorCells(cells, align, size)
  return normalized?.some((cell, index) => cell !== markdownTableSeparatorCell(tableAlignment(align[index])))
    ? { separatorCells: normalized }
    : {}
}

function tablePipeAttrs(line: string): { leadingPipe?: false; trailingPipe?: false } {
  const pipes = tableLinePipes(line)
  const attrs: { leadingPipe?: false; trailingPipe?: false } = {}
  if (!pipes.leadingPipe) attrs.leadingPipe = false
  if (!pipes.trailingPipe) attrs.trailingPipe = false
  return attrs
}

function tableLinePipeAttrs(lines: readonly string[]): { leadingPipes?: boolean[]; trailingPipes?: boolean[] } {
  const fallback = tableLinePipes(lines[0] ?? '')
  const leadingPipes = lines.map((line) => tableLinePipes(line).leadingPipe)
  const trailingPipes = lines.map((line) => tableLinePipes(line).trailingPipe)

  return {
    ...(leadingPipes.some((pipe) => pipe !== fallback.leadingPipe) ? { leadingPipes } : {}),
    ...(trailingPipes.some((pipe) => pipe !== fallback.trailingPipe) ? { trailingPipes } : {}),
  }
}

function tableLinePipes(line: string): { leadingPipe: boolean; trailingPipe: boolean } {
  const trimmed = line.trim()
  return {
    leadingPipe: trimmed.startsWith('|'),
    trailingPipe: hasTrailingTablePipe(trimmed),
  }
}

function parseTableSeparator(line: string): { align: TableAlign[]; cells: string[] } | null {
  const cells = parseTableCells(line)
  if (!cells || cells.length < 2) return null
  const alignments = cells.map(tableSeparatorCellAlignment)
  const align = alignments.filter(isTableAlign)
  return align.length === alignments.length ? { align, cells } : null
}

function isTableAlign(align: TableAlign | false): align is TableAlign {
  return align !== false
}

function parseTableRow(line: string): string[] | null {
  const cells = parseTableCells(line)
  if (!cells) return null
  if (cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))) return null
  return cells
}

function hasTrailingTablePipe(source: string): boolean {
  if (!source.endsWith('|')) return false

  let backslashes = 0
  for (let index = source.length - 2; index >= 0 && source[index] === '\\'; index -= 1) {
    backslashes += 1
  }
  return backslashes % 2 === 0
}

function parseTableCells(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) return null

  const withoutStart = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  const content = hasTrailingTablePipe(withoutStart) ? withoutStart.slice(0, -1) : withoutStart
  const cells = splitTableCells(content).map((cell) => cell.trim())
  return cells.length >= 2 ? cells : null
}

function splitTableCells(source: string): string[] {
  const cells: string[] = []
  let cell = ''
  let codeFenceLength = 0
  let index = 0

  while (index < source.length) {
    const char = source[index] ?? ''
    if (char === '`') {
      const length = backtickRunLength(source, index)
      cell += source.slice(index, index + length)
      codeFenceLength = codeFenceLength === 0 ? length : length === codeFenceLength ? 0 : codeFenceLength
      index += length
      continue
    }

    if (codeFenceLength === 0 && char === '\\' && source[index + 1] === '|') {
      cell += '|'
      index += 2
      continue
    }
    if (codeFenceLength === 0 && char === '|') {
      cells.push(cell)
      cell = ''
      index += 1
      continue
    }

    cell += char
    index += 1
  }

  cells.push(cell)
  return cells
}
