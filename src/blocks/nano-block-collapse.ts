import type { Node as ProseMirrorNode } from 'prosemirror-model'
import {
  blockId,
  headingLevel,
  isHeadingNode,
  isListLikeNode,
  nodeIndent,
} from './nano-block-node-kind'
import { topLevelBlockRanges } from './nano-block-ranges'
import type {
  ActiveBlockRange,
  BlockCollapseRange,
  CollapseDescriptor,
} from './nano-block-structure-types'

export function blockCollapseRanges(doc: ProseMirrorNode, collapsedBlockIds: ReadonlySet<string>): BlockCollapseRange[] {
  const ranges = topLevelBlockRanges(doc)
  const collapsibleIds = collapsibleBlockIdsFromRanges(ranges)
  const collapsedAncestors: CollapseDescriptor[] = []

  return ranges.map((range) => {
    pruneCollapseAncestors(collapsedAncestors, range)

    const id = blockId(range.node)
    const hidden = collapsedAncestors.length > 0
    const collapsible = id ? collapsibleIds.has(id) : false
    const collapsed = collapsible && collapsedBlockIds.has(id)
    if (!hidden && collapsed) {
      const descriptor = collapseDescriptorForRange(range)
      if (descriptor) collapsedAncestors.push(descriptor)
    }

    return { ...range, collapsible, collapsed, hidden }
  })
}

export function visibleTopLevelBlockRanges(
  doc: ProseMirrorNode,
  collapsedBlockIds: ReadonlySet<string>,
): ActiveBlockRange[] {
  return blockCollapseRanges(doc, collapsedBlockIds)
    .filter((range) => !range.hidden)
    .map(({ from, to, node }) => ({ from, to, node }))
}

export function collapsibleBlockIds(doc: ProseMirrorNode): Set<string> {
  return collapsibleBlockIdsFromRanges(topLevelBlockRanges(doc))
}

export function collapsibleBlockIdsFromRanges(ranges: readonly ActiveBlockRange[]): Set<string> {
  const ids = new Set<string>()

  for (let index = 0; index < ranges.length - 1; index += 1) {
    const range = ranges[index]!
    const next = ranges[index + 1]!

    if (isListLikeNode(range.node) && isListLikeNode(next.node) && nodeIndent(next.node) > nodeIndent(range.node)) {
      const id = blockId(range.node)
      if (id) ids.add(id)
      continue
    }

    if (!isHeadingNode(range.node)) continue
    const id = blockId(range.node)
    if (!id) continue

    const level = headingLevel(range.node)
    for (const candidate of ranges.slice(index + 1)) {
      if (isHeadingNode(candidate.node) && headingLevel(candidate.node) <= level) break

      ids.add(id)
      break
    }
  }

  return ids
}

export function collapseDescriptorForRange(range: ActiveBlockRange): CollapseDescriptor | null {
  const id = blockId(range.node)
  if (!id) return null

  if (isListLikeNode(range.node)) return { type: 'list', id, indent: nodeIndent(range.node) }
  if (isHeadingNode(range.node)) return { type: 'heading', id, level: headingLevel(range.node) }
  return null
}

export function pruneCollapseAncestors(ancestors: CollapseDescriptor[], range: ActiveBlockRange): void {
  while (ancestors.length > 0) {
    const ancestor = ancestors[ancestors.length - 1]!
    if (collapseDescriptorHidesRange(ancestor, range)) return

    ancestors.pop()
  }
}

export function collapseDescriptorHidesRange(descriptor: CollapseDescriptor, range: ActiveBlockRange): boolean {
  if (descriptor.type === 'list') {
    return isListLikeNode(range.node) && nodeIndent(range.node) > descriptor.indent
  }

  return !isHeadingNode(range.node) || headingLevel(range.node) > descriptor.level
}

export function collapsedAncestorIdsForBlockId(
  doc: ProseMirrorNode,
  id: string,
  collapsedBlockIds: ReadonlySet<string>,
): string[] {
  const ranges = topLevelBlockRanges(doc)
  const collapsibleIds = collapsibleBlockIdsFromRanges(ranges)
  const ancestors: CollapseDescriptor[] = []

  for (const range of ranges) {
    pruneCollapseAncestors(ancestors, range)
    if (blockId(range.node) === id) return ancestors.map((ancestor) => ancestor.id)

    const rangeId = blockId(range.node)
    if (!rangeId || !collapsibleIds.has(rangeId) || !collapsedBlockIds.has(rangeId)) continue

    const descriptor = collapseDescriptorForRange(range)
    if (descriptor) ancestors.push(descriptor)
  }

  return []
}
