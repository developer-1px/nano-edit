import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorState } from 'prosemirror-state'
import {
  isListLikeNode,
  listSubtreeRanges,
  nodeIndent,
  selectedWholeBlockRanges,
  topLevelBlockRanges,
  type ActiveBlockRange,
} from '../blocks/nano-block-structure'
import { shiftedContinuationIndents, shiftedRawIndent } from '../core/nano-source-metadata'
import type { IndentDirection } from './nano-command-surface'

export function normalizedBlockChangeContent(
  doc: ProseMirrorNode,
  block: ActiveBlockRange,
  replacement: Fragment | ProseMirrorNode,
): { to: number; content: Fragment | ProseMirrorNode } {
  const subtree = listSubtreeRanges(doc, block)
  if (subtree.length <= 1 || firstContentNodeIsListLike(replacement)) {
    return { to: block.to, content: replacement }
  }

  const liftedChildren = liftedListSubtreeNodes(subtree.slice(1), nodeIndent(block.node) + 1)
  return {
    to: subtree[subtree.length - 1]!.to,
    content: Fragment.fromArray([...contentNodes(replacement), ...liftedChildren]),
  }
}

export function liftedListSubtreeNodes(
  ranges: readonly ActiveBlockRange[],
  liftBy: number,
): ProseMirrorNode[] {
  return ranges.map((range) => range.node.type.create({
    ...shiftedListAttrs(range.node.attrs, -liftBy),
  }, range.node.content, range.node.marks))
}

export function canShiftListSubtree(ranges: readonly ActiveBlockRange[], direction: IndentDirection): boolean {
  if (ranges.length === 0) return false

  return ranges.every((range) => {
    const indent = nodeIndent(range.node)
    return direction === 'in' ? indent < 6 : indent > 0
  })
}

export function canIndentActiveListSubtree(
  doc: ProseMirrorNode,
  ranges: readonly ActiveBlockRange[],
  direction: IndentDirection,
): boolean {
  if (!canShiftListSubtree(ranges, direction)) return false
  if (direction === 'out') return true

  const root = ranges[0]
  return root ? hasPreviousListSiblingAtIndent(doc, root.from, nodeIndent(root.node)) : false
}

export function shiftedListAttrs(attrs: Record<string, unknown>, delta: number): Record<string, unknown> {
  const indent = typeof attrs.indent === 'number' ? attrs.indent : Number(attrs.indent)
  const nextIndent = Math.max(0, Math.min(6, Number.isFinite(indent) ? Math.trunc(indent) + delta : delta))
  return {
    ...attrs,
    indent: nextIndent,
    indentText: shiftedRawIndent(attrs.indentText, delta),
    continuationIndents: shiftedContinuationIndents(attrs.continuationIndents, delta),
  }
}

export function selectedListIndentRanges(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string>,
): ActiveBlockRange[] {
  const ranges = selectedWholeBlockRanges(state, collapsedBlockIds)
  return ranges.length > 1 && ranges.every((range) => isListLikeNode(range.node)) ? ranges : []
}

function firstContentNodeIsListLike(content: Fragment | ProseMirrorNode): boolean {
  const first = content instanceof Fragment ? content.firstChild : content
  return first ? isListLikeNode(first) : false
}

function contentNodes(content: Fragment | ProseMirrorNode): ProseMirrorNode[] {
  if (!(content instanceof Fragment)) return [content]

  const nodes: ProseMirrorNode[] = []
  content.forEach((node) => nodes.push(node))
  return nodes
}

function hasPreviousListSiblingAtIndent(doc: ProseMirrorNode, from: number, indent: number): boolean {
  const ranges = topLevelBlockRanges(doc)
  const index = ranges.findIndex((range) => range.from === from)
  if (index <= 0) return false

  for (let rangeIndex = index - 1; rangeIndex >= 0; rangeIndex -= 1) {
    const range = ranges[rangeIndex]!
    if (!isListLikeNode(range.node)) return false

    const candidateIndent = nodeIndent(range.node)
    if (candidateIndent === indent) return true
    if (candidateIndent < indent) return false
  }

  return false
}
