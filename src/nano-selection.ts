import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import { type ActiveBlockRange } from './nano-block-structure'

export function movedBlockSelection(
  state: EditorState,
  doc: ProseMirrorNode,
  block: ActiveBlockRange,
  nextFrom: number,
): Selection {
  if (!block.node.isTextblock) return NodeSelection.create(doc, nextFrom)

  const offset = clampSelectionOffset(state.selection.from - block.from, block.node.nodeSize)
  return TextSelection.create(doc, nextFrom + offset)
}

export function selectionAfterInsertedContent(
  doc: ProseMirrorNode,
  from: number,
  content: Fragment | ProseMirrorNode,
): Selection {
  const textPosition = firstTextPositionInInsertedContent(from, content)
  if (textPosition !== null) return TextSelection.create(doc, textPosition)

  return NodeSelection.create(doc, Math.min(from, doc.content.size))
}

export function selectionAfterReplacementContent(
  doc: ProseMirrorNode,
  from: number,
  content: Fragment | ProseMirrorNode,
  selectionOffset: number,
): Selection {
  if (!(content instanceof Fragment) && content.isTextblock) {
    return TextSelection.create(doc, Math.min(from + 1 + selectionOffset, doc.content.size))
  }

  return selectionAfterInsertedContent(doc, from, content)
}

function clampSelectionOffset(offset: number, nodeSize: number): number {
  return Math.max(1, Math.min(offset, nodeSize - 1))
}

function firstTextPositionInInsertedContent(
  from: number,
  content: Fragment | ProseMirrorNode,
): number | null {
  if (!(content instanceof Fragment)) return content.isTextblock ? from + 1 : null

  let position: number | null = null
  let offset = 0
  content.forEach((node) => {
    if (position === null && node.isTextblock) position = from + offset + 1
    offset += node.nodeSize
  })
  return position
}
