import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorState } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import {
  blockOptions,
  type BlockOptionRegistry,
} from '../../blocks/nano-block-options'
import {
  activeBlockRange,
  blockCollapseRanges,
  blockId,
  isListLikeNode,
  topLevelBlockRanges,
} from '../../blocks/nano-block-structure'
import type { ActiveBlockRange } from '../../blocks/nano-block-structure'
import {
  decorateHeadingNode,
  decorateListNode,
} from './decoration-nodes'

export function blockOptionIdForBlockId(
  doc: ProseMirrorNode,
  id: string,
  registry?: BlockOptionRegistry,
): string | null {
  let optionId: string | null = null
  const options = registry?.blockOptions ?? blockOptions
  doc.descendants((node) => {
    if (optionId) return false
    if (node.attrs.id !== id) return true

    optionId = options.find((option) => option.matches(node))?.id ?? null
    return false
  })
  return optionId
}

export function blockUiDecorations(
  state: EditorState,
  collapsedBlockIds: ReadonlySet<string>,
  activeBlockIdOverride: string | null = null,
): DecorationSet {
  const decorations: Decoration[] = []
  const collapseRanges = blockCollapseRanges(state.doc, collapsedBlockIds)
  const hiddenBlockIds = new Set(collapseRanges
    .filter((range) => range.hidden)
    .map((range) => blockId(range.node))
    .filter(Boolean))
  const block = activeBlockRangeForDecorations(state, activeBlockIdOverride)
  if (block) {
    const id = typeof block.node.attrs.id === 'string' ? block.node.attrs.id : ''
    if (!hiddenBlockIds.has(id)) {
      decorations.push(
        Decoration.node(block.from, block.to, { class: 'nano-block-active' }),
      )
    }
  }

  const orderedListIndexes: number[] = []
  for (const range of collapseRanges) {
    const { node, from: offset } = range
    if (range.hidden) {
      decorations.push(Decoration.node(offset, offset + node.nodeSize, { class: 'nano-block-collapsed-child' }))
      continue
    }
    if (isListLikeNode(node)) {
      decorateListNode(decorations, orderedListIndexes, node, offset, range.collapsible, range.collapsed)
    } else {
      orderedListIndexes.length = 0
      decorateHeadingNode(decorations, node, offset, range.collapsible, range.collapsed)
    }
  }

  return DecorationSet.create(state.doc, decorations)
}

function activeBlockRangeForDecorations(
  state: EditorState,
  activeBlockIdOverride: string | null,
): ActiveBlockRange | null {
  if (!activeBlockIdOverride) return activeBlockRange(state)

  return topLevelBlockRanges(state.doc)
    .find((range) => blockId(range.node) === activeBlockIdOverride)
    ?? activeBlockRange(state)
}
