import {
  normalizeTableAlignments,
  normalizeTableLinePipes,
  normalizeTableSeparatorCells,
  tableAlignment,
  tableColumnCount,
  tableLineCount,
  tablePipe,
} from './prosemirror-table-normalize'
import type { TableAlign } from './prosemirror-table-types'

export function tableAttrsFromElement(element: HTMLElement): {
  align: TableAlign[]
  leadingPipe: boolean
  leadingPipes: boolean[]
  rows: string[][]
  separatorCells: string[] | null
  trailingPipe: boolean
  trailingPipes: boolean[]
} {
  const rows = tableRowsFromElement(element)
  const align = normalizeTableAlignments(tableAlignmentsFromElement(element), tableColumnCount(rows))
  const leadingPipe = tablePipe(element.dataset.leadingPipe)
  const trailingPipe = tablePipe(element.dataset.trailingPipe)
  return {
    align,
    leadingPipe,
    leadingPipes: tableLinePipesFromElement(element, 'leading', tableLineCount(rows), leadingPipe),
    rows,
    separatorCells: normalizeTableSeparatorCells(tableSeparatorCellsFromElement(element), align, tableColumnCount(rows)),
    trailingPipe,
    trailingPipes: tableLinePipesFromElement(element, 'trailing', tableLineCount(rows), trailingPipe),
  }
}

function tableRowsFromElement(element: HTMLElement): string[][] {
  return [...element.querySelectorAll('tr')].map((row) =>
    [...row.querySelectorAll('th,td')].map((cell) => cell.textContent ?? ''),
  )
}

function tableAlignmentsFromElement(element: HTMLElement): TableAlign[] {
  const dataAlign = element.dataset.align
  if (dataAlign) {
    return dataAlign.split('|').map((value) => value === '-' ? null : tableAlignment(value))
  }

  const table = element.matches('table') ? element : element.querySelector('table')
  const firstRow = table?.querySelector('tr')
  return firstRow
    ? [...firstRow.querySelectorAll<HTMLElement>('th,td')].map((cell) => tableAlignment(cell.dataset.align || cell.style.textAlign))
    : []
}

function tableSeparatorCellsFromElement(element: HTMLElement): string[] | null {
  const value = element.dataset.separatorCells
  return value ? value.split('|') : null
}

function tableLinePipesFromElement(
  element: HTMLElement,
  edge: 'leading' | 'trailing',
  size: number,
  fallback: boolean,
): boolean[] {
  const value = edge === 'leading' ? element.dataset.leadingPipes : element.dataset.trailingPipes
  return normalizeTableLinePipes(typeof value === 'string' ? value.split('|') : null, size, fallback)
}
