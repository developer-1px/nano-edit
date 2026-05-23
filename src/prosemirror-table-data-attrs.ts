import type { TableAlign } from './prosemirror-table-types'
import {
  tableAlignment,
  tableLinePipesDiffer,
} from './prosemirror-table-normalize'

export function tableAlignDataAttrs(align: readonly TableAlign[]): Record<string, string> {
  return align.some((value) => value !== null)
    ? { 'data-align': align.map((value) => value ?? '-').join('|') }
    : {}
}

export function tableSeparatorCellDataAttrs(separatorCells: readonly string[] | null): Record<string, string> {
  return separatorCells ? { 'data-separator-cells': separatorCells.join('|') } : {}
}

export function tablePipeDataAttrs(leadingPipe: boolean, trailingPipe: boolean): Record<string, string> {
  return {
    ...(leadingPipe ? {} : { 'data-leading-pipe': 'false' }),
    ...(trailingPipe ? {} : { 'data-trailing-pipe': 'false' }),
  }
}

export function tableLinePipeDataAttrs(
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

export function tableCellAttrs(align: TableAlign | undefined): Record<string, string> {
  const value = tableAlignment(align)
  return value ? { 'data-align': value, style: `text-align: ${value};` } : {}
}
