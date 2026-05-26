import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection } from 'prosemirror-state'
import {
  headingLevel,
  isHeadingNode,
  isListLikeNode,
  nodeIndent,
} from './nano-block-node-kind'
import type { ActiveBlockRange } from './nano-block-structure-types'

export function activeBlockRange(state: EditorState): ActiveBlockRange | null {
  const { selection } = state
  if (selection instanceof NodeSelection && selection.node.isBlock) {
    return { from: selection.from, to: selection.to, node: selection.node }
  }

  const $from = selection.$from
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.isBlock) return { from: $from.before(depth), to: $from.after(depth), node }
  }

  return null
}

export function topLevelBlockRanges(doc: ProseMirrorNode): ActiveBlockRange[] {
  const ranges: ActiveBlockRange[] = []
  doc.forEach((node, offset) => {
    ranges.push({ from: offset, to: offset + node.nodeSize, node })
  })
  return ranges
}

export function listSubtreeRanges(doc: ProseMirrorNode, block: ActiveBlockRange): ActiveBlockRange[] {
  if (!isListLikeNode(block.node)) return []

  const ranges = topLevelBlockRanges(doc)
  const index = ranges.findIndex((range) => range.from === block.from)
  const root = ranges[index]
  if (!root) return [block]

  const subtree = [root]
  const indent = nodeIndent(root.node)
  for (const range of ranges.slice(index + 1)) {
    if (!isListLikeNode(range.node) || nodeIndent(range.node) <= indent) break
    subtree.push(range)
  }

  return subtree
}

export function headingSectionRanges(doc: ProseMirrorNode, block: ActiveBlockRange): ActiveBlockRange[] {
  if (!isHeadingNode(block.node)) return []

  const ranges = topLevelBlockRanges(doc)
  const index = ranges.findIndex((range) => range.from === block.from)
  const root = ranges[index]
  if (!root) return [block]

  const section = [root]
  const level = headingLevel(root.node)
  for (const range of ranges.slice(index + 1)) {
    if (isHeadingNode(range.node) && headingLevel(range.node) <= level) break
    section.push(range)
  }

  return section
}

export function blockSubtreeRanges(doc: ProseMirrorNode, block: ActiveBlockRange): ActiveBlockRange[] {
  if (isListLikeNode(block.node)) return listSubtreeRanges(doc, block)
  if (isHeadingNode(block.node)) return headingSectionRanges(doc, block)
  return [block]
}

export function listSubtreeEndPosition(doc: ProseMirrorNode, block: ActiveBlockRange): number {
  return listSubtreeRanges(doc, block).at(-1)?.to ?? block.to
}
