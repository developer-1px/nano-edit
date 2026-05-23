import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorState } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { blockOptions } from './nano-block-options'
import {
  activeBlockRange,
  blockCollapseRanges,
  blockId,
  isListLikeNode,
} from './nano-block-structure'
import {
  decorateHeadingNode,
  decorateListNode,
} from './nano-block-ui-decoration-nodes'
import { blockAddElement, blockHandleElement, blockInsertPickerElement } from './nano-block-ui-elements'
import type { GutterPickerAction } from './nano-block-ui-types'

export function blockOptionIdForBlockId(doc: ProseMirrorNode, id: string): string | null {
  let optionId: string | null = null
  doc.descendants((node) => {
    if (optionId) return false
    if (node.attrs.id !== id) return true

    optionId = blockOptions.find((option) => option.matches(node))?.id ?? null
    return false
  })
  return optionId
}

export function blockUiDecorations(
  state: EditorState,
  gutterPickerBlockId: string | null,
  gutterPickerOptionId: string | null,
  gutterPickerAction: GutterPickerAction | null,
  gutterPickerTypeahead: string,
  collapsedBlockIds: ReadonlySet<string>,
): DecorationSet {
  const decorations: Decoration[] = []
  const collapseRanges = blockCollapseRanges(state.doc, collapsedBlockIds)
  const hiddenBlockIds = new Set(collapseRanges
    .filter((range) => range.hidden)
    .map((range) => blockId(range.node))
    .filter(Boolean))
  const block = activeBlockRange(state)
  if (block) {
    const id = typeof block.node.attrs.id === 'string' ? block.node.attrs.id : ''
    if (!hiddenBlockIds.has(id)) {
      const blockAddWidget = id && id === gutterPickerBlockId
        ? blockInsertPickerElement(id, gutterPickerOptionId, gutterPickerAction ?? 'insert', gutterPickerTypeahead)
        : blockAddElement(id)
      decorations.push(
        Decoration.node(block.from, block.to, { class: 'nano-block-active' }),
        Decoration.widget(block.to, () => blockAddWidget, {
          key: id === gutterPickerBlockId
            ? `block-picker:${gutterPickerAction ?? 'insert'}:${id || block.to}:${gutterPickerOptionId ?? ''}:${gutterPickerTypeahead}`
            : `block-add:${id || block.to}`,
          side: 1,
        }),
      )
    }
  }

  const orderedListIndexes: number[] = []
  for (const range of collapseRanges) {
    const { node, from: offset } = range
    const id = blockId(node)
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
    decorations.push(Decoration.widget(offset, () => blockHandleElement(id), {
      key: `block-handle:${id || offset}`,
      side: -1,
    }))
  }

  return DecorationSet.create(state.doc, decorations)
}
