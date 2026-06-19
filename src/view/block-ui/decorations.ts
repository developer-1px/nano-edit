import type { EditorState } from 'prosemirror-state'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { Decoration, DecorationSet } from 'prosemirror-view'
import {
  activeBlockRange,
  topLevelBlockRanges,
} from '../../entities/block/structure/nano-block-ranges'
import { blockCollapseRanges } from '../../entities/block/structure/nano-block-collapse'
import {
  blockId,
  isHeadingNode,
  isListLikeNode,
  nodeIndent,
  nodeOrderedStart,
  nodeOrderedStartText,
} from '../../entities/block/structure/nano-block-node-kind'
import type { ActiveBlockRange } from '../../entities/block/structure/nano-block-structure-types'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-names'
import { orderedMarker } from '../../codecs/markdown/nano-markdown-marker-attrs'

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
    const id = blockId(block.node)
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

function decorateListNode(
  decorations: Decoration[],
  orderedListIndexes: number[],
  node: ProseMirrorNode,
  offset: number,
  collapsible: boolean,
  collapsed: boolean,
): void {
  const indent = nodeIndent(node)
  const style = [`--nano-indent: ${indent};`]
  const classes: string[] = []
  if (node.type.name === nanoNodeNames.listItem && node.attrs.kind === 'ordered') {
    orderedListIndexes[indent] = nodeOrderedStart(node) ?? ((orderedListIndexes[indent] ?? 0) + 1)
    orderedListIndexes.length = indent + 1
    style.push(`--nano-list-index: "${nodeOrderedStartText(node) ?? String(orderedListIndexes[indent])}${orderedMarker(node.attrs.orderedMarker)}";`)
  } else {
    orderedListIndexes[indent] = 0
    orderedListIndexes.length = indent + 1
  }
  if (collapsible) classes.push('nano-list-collapsible')
  if (collapsed) classes.push('nano-list-collapsed')
  decorations.push(Decoration.node(offset, offset + node.nodeSize, {
    class: classes.join(' '),
    style: style.join(' '),
  }))
}

function decorateHeadingNode(
  decorations: Decoration[],
  node: ProseMirrorNode,
  offset: number,
  collapsible: boolean,
  collapsed: boolean,
): void {
  if (!isHeadingNode(node)) return
  const classes: string[] = []
  if (collapsible) classes.push('nano-heading-collapsible')
  if (collapsed) classes.push('nano-heading-collapsed')
  if (classes.length > 0) decorations.push(Decoration.node(offset, offset + node.nodeSize, { class: classes.join(' ') }))
}
