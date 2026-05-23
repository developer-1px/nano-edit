import type { TableAlign } from './prosemirror-table-types'

export function normalizeTableRows(rows: unknown): string[][] {
  if (!Array.isArray(rows)) return [['', ''], ['', '']]
  const normalized = rows
    .filter(Array.isArray)
    .map((row) => row.map((cell) => String(cell ?? '')))
    .filter((row) => row.length > 0)
  if (normalized.length === 0) return [['', ''], ['', '']]

  const columnCount = Math.max(2, ...normalized.map((row) => row.length))
  return normalized.map((row) => padTableRow(row, columnCount))
}

export function normalizeTableAlignments(align: unknown, size: number): TableAlign[] {
  const values = Array.isArray(align) ? align : []
  return Array.from({ length: Math.max(1, size) }, (_value, index) => tableAlignment(values[index]))
}

export function tablePipe(pipe: unknown): boolean {
  return pipe !== false && pipe !== 'false'
}

export function normalizeTableLinePipes(pipes: unknown, size: number, fallback: boolean): boolean[] {
  const values = Array.isArray(pipes) ? pipes : []
  return Array.from({ length: Math.max(1, size) }, (_value, index) => tableLinePipe(values[index], fallback))
}

export function tableLinePipesDiffer(pipes: readonly boolean[], fallback: boolean): boolean {
  return pipes.some((pipe) => pipe !== fallback)
}

export function normalizeTableSeparatorCells(cells: unknown, align: unknown, size: number): string[] | null {
  if (!Array.isArray(cells) || cells.length === 0) return null

  const alignments = normalizeTableAlignments(align, size)
  const normalized = Array.from({ length: Math.max(1, size) }, (_value, index) => {
    const fallback = markdownTableSeparatorCell(alignments[index])
    const cell = typeof cells[index] === 'string' ? cells[index]!.trim() : ''
    return tableSeparatorCellAlignment(cell) === alignments[index] ? cell : fallback
  })
  return normalized.some((cell, index) => cell !== markdownTableSeparatorCell(alignments[index])) ? normalized : null
}

export function tableColumnCount(rows: unknown): number {
  const tableRows = Array.isArray(rows) ? rows : []
  return Math.max(2, ...tableRows.filter(Array.isArray).map((row) => row.length))
}

function padTableRow(row: readonly string[], size: number): string[] {
  return Array.from({ length: size }, (_value, index) => row[index] ?? '')
}

export function tableLineCount(rows: unknown): number {
  const tableRows = Array.isArray(rows) ? rows.filter(Array.isArray) : []
  return Math.max(2, tableRows.length + 1)
}

export function tableAlignment(align: unknown): TableAlign {
  return align === 'left' || align === 'center' || align === 'right' ? align : null
}

export function tableLinePipe(pipe: unknown, fallback: boolean): boolean {
  if (pipe === true || pipe === 'true' || pipe === '1') return true
  if (pipe === false || pipe === 'false' || pipe === '0') return false
  return fallback
}

export function tableSeparatorCellAlignment(cell: string): TableAlign | false {
  const value = cell.trim()
  if (!/^:?-{3,}:?$/.test(value)) return false
  const left = value.startsWith(':')
  const right = value.endsWith(':')
  if (left && right) return 'center'
  if (left) return 'left'
  if (right) return 'right'
  return null
}

export function markdownTableSeparatorCell(align: TableAlign | undefined): string {
  switch (align) {
    case 'left':
      return ':---'
    case 'center':
      return ':---:'
    case 'right':
      return '---:'
    default:
      return '---'
  }
}
