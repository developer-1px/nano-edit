import type { TableAlign } from './nano-markdown-table-types'

export function parseTableSeparator(line: string): { align: TableAlign[]; cells: string[] } | null {
  const cells = parseTableCells(line)
  if (!cells || cells.length < 2) return null
  const alignments = cells.map(tableSeparatorCellAlignment)
  return alignments.every((align) => align !== false) ? { align: alignments as TableAlign[], cells } : null
}

export function parseTableRow(line: string): string[] | null {
  const cells = parseTableCells(line)
  if (!cells) return null
  if (cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))) return null
  return cells
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

export function hasTrailingTablePipe(source: string): boolean {
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
    const char = source[index]!
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

function backtickRunLength(source: string, from: number): number {
  let index = from
  while (source[index] === '`') index += 1
  return index - from
}
