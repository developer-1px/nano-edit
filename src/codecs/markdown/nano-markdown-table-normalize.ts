import {
  markdownTableSeparatorCell,
  tableAlignment,
  tableSeparatorCellAlignment,
  type TableAlign,
} from './nano-markdown-table-align'

export function normalizeTableRows(rows: readonly string[][]): string[][] {
  const normalized = rows.filter((row) => row.length > 0)
  const columnCount = Math.max(1, ...normalized.map((row) => row.length))
  return normalized.length > 0
    ? normalized.map((row) => padTableRow(row, columnCount))
    : [['', ''], ['', '']]
}

export function normalizeTableAlignments(align: readonly TableAlign[] | undefined, size: number): TableAlign[] {
  return Array.from({ length: size }, (_value, index) => tableAlignment(align?.[index]))
}

export function normalizeTableSeparatorCells(
  cells: readonly string[] | undefined,
  align: readonly TableAlign[],
  size: number,
): string[] | null {
  if (!cells || cells.length === 0) return null

  return Array.from({ length: size }, (_value, index) => {
    const fallback = markdownTableSeparatorCell(tableAlignment(align[index]))
    const value = cells[index]
    const cell = typeof value === 'string' ? value.trim() : ''
    return tableSeparatorCellAlignment(cell) === tableAlignment(align[index]) ? cell : fallback
  })
}

export function normalizeTableLinePipes(
  pipes: readonly boolean[] | undefined,
  size: number,
  fallback: boolean,
): boolean[] {
  return Array.from({ length: size }, (_value, index) => {
    const pipe = pipes?.[index]
    return typeof pipe === 'boolean' ? pipe : fallback
  })
}

export function padTableRow(row: readonly string[], size: number): string[] {
  return Array.from({ length: size }, (_value, index) => row[index] ?? '')
}
