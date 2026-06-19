import type { NanoBlock } from '../../entities/document/nano-document-model'
import { defineNanoBlockCodec } from './prosemirror-block-codec-types'
import { nanoNodeNames } from './prosemirror-names'
import { nanoSchema } from './prosemirror-schema'
import {
  normalizeTableAlignments,
  normalizeTableLinePipes,
  normalizeTableRows,
  normalizeTableSeparatorCells,
  tableColumnCount,
  tableLineCount,
  tableLinePipesDiffer,
  tablePipe,
} from './prosemirror-table-normalize'

export const tableBlockCodec = defineNanoBlockCodec({
  nanoType: 'table',
  nodeName: nanoNodeNames.table,
  fromNano: (block) => nanoSchema.nodes[nanoNodeNames.table].create({
    id: block.id,
    rows: normalizeTableRows(block.rows),
    align: normalizeTableAlignments(block.align, tableColumnCount(block.rows)),
    leadingPipe: tablePipe(block.leadingPipe),
    leadingPipes: normalizeTableLinePipes(block.leadingPipes, tableLineCount(block.rows), tablePipe(block.leadingPipe)),
    separatorCells: normalizeTableSeparatorCells(block.separatorCells, block.align, tableColumnCount(block.rows)),
    trailingPipe: tablePipe(block.trailingPipe),
    trailingPipes: normalizeTableLinePipes(block.trailingPipes, tableLineCount(block.rows), tablePipe(block.trailingPipe)),
  }),
  toNano: (node, id) => {
    const rows = normalizeTableRows(node.attrs.rows)
    const align = normalizeTableAlignments(node.attrs.align, tableColumnCount(rows))
    const separatorCells = normalizeTableSeparatorCells(node.attrs.separatorCells, align, tableColumnCount(rows))
    const leadingPipe = tablePipe(node.attrs.leadingPipe)
    const trailingPipe = tablePipe(node.attrs.trailingPipe)
    const leadingPipes = normalizeTableLinePipes(node.attrs.leadingPipes, tableLineCount(rows), leadingPipe)
    const trailingPipes = normalizeTableLinePipes(node.attrs.trailingPipes, tableLineCount(rows), trailingPipe)
    const block: Extract<NanoBlock, { type: 'table' }> = {
      id,
      type: 'table',
      rows,
    }
    if (align.some((value) => value !== null)) block.align = align
    if (!leadingPipe) block.leadingPipe = false
    if (tableLinePipesDiffer(leadingPipes, leadingPipe)) block.leadingPipes = leadingPipes
    if (separatorCells) block.separatorCells = separatorCells
    if (!trailingPipe) block.trailingPipe = false
    if (tableLinePipesDiffer(trailingPipes, trailingPipe)) block.trailingPipes = trailingPipes
    return block
  },
})
