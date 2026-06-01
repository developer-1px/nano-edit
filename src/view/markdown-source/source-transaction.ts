import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorState, Transaction } from 'prosemirror-state'
import {
  blockId,
  selectedBlockRangesWithCollapsedSubtree,
  topLevelBlockRanges,
  type ActiveBlockRange,
} from '../../blocks/nano-block-structure'
import { nanoDocumentFromMarkdown } from '../../codecs/markdown/nano-markdown'
import { prosemirrorDocFromNano } from '../../adapters/prosemirror/prosemirror-nano'
import { selectionAfterInsertedContent } from '../../core/nano-selection'
import { normalizedBlockChangeContent } from '../list/transforms'

export function markdownBlockSourceTransaction(
  state: EditorState,
  sourceBlockId: string,
  markdown: string,
  collapsedBlockIds: ReadonlySet<string> = new Set(),
): Transaction | null {
  const block = topLevelBlockRanges(state.doc).find((range) => range.node.attrs.id === sourceBlockId)
  if (!block) return null

  const parsed = prosemirrorDocFromNano(nanoDocumentFromMarkdown(markdown))
  const replaceRanges = selectedBlockRangesWithCollapsedSubtree(state.doc, block, collapsedBlockIds)
  const excludeIds = new Set(replaceRanges.map((range) => blockId(range.node)).filter(Boolean))
  const replacement = markdownBlockSourceReplacement(state.doc, block, parsed, excludeIds)
  if (!replacement || replacement.size === 0) return null

  const last = replaceRanges[replaceRanges.length - 1]
  const change = replaceRanges.length === 1
    ? normalizedBlockChangeContent(state.doc, block, replacement)
    : { to: last?.to ?? block.to, content: replacement }
  const transaction = state.tr.replaceWith(block.from, change.to, change.content)
  transaction.setSelection(selectionAfterInsertedContent(transaction.doc, block.from, change.content))
  return transaction
}

function markdownBlockSourceReplacement(
  doc: ProseMirrorNode,
  block: ActiveBlockRange,
  parsed: ProseMirrorNode,
  excludeIds: ReadonlySet<string> = new Set(),
): Fragment | null {
  const usedIds = new Set<string>()
  doc.forEach((node) => {
    const id = typeof node.attrs.id === 'string' ? node.attrs.id : ''
    if (id && !excludeIds.has(id)) usedIds.add(id)
  })

  const sourceId = typeof block.node.attrs.id === 'string' && block.node.attrs.id
    ? block.node.attrs.id
    : uniqueMarkdownSourceBlockId(usedIds, 'markdown-block')
  const nodes: ProseMirrorNode[] = []

  parsed.forEach((node, _offset, index) => {
    const id = index === 0
      ? sourceId
      : uniqueMarkdownSourceBlockId(usedIds, `${sourceId}-${index + 1}`)
    usedIds.add(id)
    nodes.push(node.type.create({ ...node.attrs, id }, node.content, node.marks))
  })

  return nodes.length > 0 ? Fragment.fromArray(nodes) : null
}

function uniqueMarkdownSourceBlockId(usedIds: Set<string>, base: string): string {
  if (!usedIds.has(base)) return base

  let suffix = 2
  while (usedIds.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}
