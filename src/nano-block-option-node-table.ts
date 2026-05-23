import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import type { BlockTemplate } from './assembly/capability'
import {
  blockWithTrailingParagraph,
  sourceBlockId,
} from './nano-block-option-node-helpers'
import { nanoNodeNames, nanoSchema } from './prosemirror-nano'

export function tableNodeForBlockTemplate(template: BlockTemplate, source: string | ProseMirrorNode): Fragment | ProseMirrorNode | null {
  if (template.type !== 'table') return null

  const id = sourceBlockId(source, 'table')
  const sourceTable = typeof source !== 'string' && source.type.name === nanoNodeNames.table ? source : null
  const table = nanoSchema.nodes[nanoNodeNames.table].create({
    id,
    rows: template.rows ?? sourceTable?.attrs.rows ?? defaultTableRows(),
    align: sourceTable?.attrs.align ?? null,
    leadingPipe: sourceTable?.attrs.leadingPipe ?? true,
    leadingPipes: sourceTable?.attrs.leadingPipes ?? [],
    separatorCells: sourceTable?.attrs.separatorCells ?? [],
    trailingPipe: sourceTable?.attrs.trailingPipe ?? true,
    trailingPipes: sourceTable?.attrs.trailingPipes ?? [],
  })
  if (sourceTable) return table

  return blockWithTrailingParagraph(table, id)
}

export function defaultTableRows(): string[][] {
  return [['Item', 'State'], ['Draft', 'Open']]
}

export function tableRowsForShortcut(source: string): string[][] {
  const cells = tableCellsForShortcut(source)
  if (!cells || cells.every((cell) => cell.length === 0)) return defaultTableRows()

  return [
    cells,
    cells.map(() => ''),
  ]
}

function tableCellsForShortcut(source: string): string[] | null {
  const trimmed = source.trim()
  if (trimmed === '| |') return ['', '']

  const withoutStart = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  const content = withoutStart.endsWith('|') ? withoutStart.slice(0, -1) : withoutStart
  const cells = splitShortcutTableCells(content).map((cell) => cell.trim())
  return cells.length >= 2 ? cells : null
}

function splitShortcutTableCells(source: string): string[] {
  const cells: string[] = []
  let cell = ''
  let escaped = false
  for (const char of source) {
    if (escaped) {
      cell += char
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '|') {
      cells.push(cell)
      cell = ''
      continue
    }
    cell += char
  }
  cells.push(cell)
  return cells
}
