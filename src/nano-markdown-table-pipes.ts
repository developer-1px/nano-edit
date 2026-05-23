import { hasTrailingTablePipe } from './nano-markdown-table-cells'
import {
  markdownTableSeparatorCell,
  normalizeTableSeparatorCells,
  tableAlignment,
} from './nano-markdown-table-normalize'
import type { TableAlign } from './nano-markdown-table-types'

export function tableSeparatorCellsAttrs(cells: readonly string[], align: readonly TableAlign[], size: number): { separatorCells?: string[] } {
  const normalized = normalizeTableSeparatorCells(cells, align, size)
  return normalized?.some((cell, index) => cell !== markdownTableSeparatorCell(tableAlignment(align[index])))
    ? { separatorCells: normalized }
    : {}
}

export function tablePipeAttrs(line: string): { leadingPipe?: false; trailingPipe?: false } {
  const pipes = tableLinePipes(line)
  return {
    ...(pipes.leadingPipe ? {} : { leadingPipe: false as const }),
    ...(pipes.trailingPipe ? {} : { trailingPipe: false as const }),
  }
}

export function tableLinePipeAttrs(lines: readonly string[]): { leadingPipes?: boolean[]; trailingPipes?: boolean[] } {
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
