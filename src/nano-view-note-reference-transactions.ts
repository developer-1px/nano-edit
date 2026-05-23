import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, NodeSelection, TextSelection, type Transaction } from 'prosemirror-state'
import { generatedBlockId, nextBlockId } from './nano-block-options'
import {
  topLevelBlockRanges,
  type ActiveBlockRange,
} from './nano-block-structure'
import { noteLinkNavigationTarget, noteLinkTarget } from './nano-note-link'
import { nanoNodeNames } from './prosemirror-nano'

export function noteReferenceTransaction(
  state: EditorState,
  rawTarget: string,
  originBlockId: string | null = null,
): Transaction | null {
  const target = noteLinkTarget(rawTarget)
  const destination = noteLinkNavigationTarget(rawTarget)
  if (!target) return null

  const existing = headingBlockRangeForText(state.doc, destination)
  if (existing) return state.tr.setSelection(NodeSelection.create(state.doc, existing.from))

  const headingType = state.schema.nodes[nanoNodeNames.heading]
  const paragraphType = state.schema.nodes[nanoNodeNames.paragraph]
  if (!headingType || !paragraphType) return null

  const id = noteReferenceBlockId(state.doc, destination)
  const heading = headingType.create({ id, level: 1 }, state.schema.text(destination))
  const paragraph = paragraphType.create({ id: generatedBlockId(id, 'body') })
  const from = noteReferenceInsertPosition(state.doc, originBlockId)
  const transaction = state.tr.replaceWith(from, from, Fragment.fromArray([heading, paragraph]))
  transaction.setSelection(TextSelection.create(transaction.doc, from + heading.nodeSize + 1))
  return transaction
}

function headingBlockRangeForText(doc: ProseMirrorNode, rawTarget: string): ActiveBlockRange | null {
  const target = noteLinkNavigationTarget(rawTarget).toLowerCase()
  if (!target) return null

  let position = 0
  for (let index = 0; index < doc.childCount; index += 1) {
    const node = doc.child(index)
    const from = position
    const to = from + node.nodeSize
    if (node.type.name === nanoNodeNames.heading && noteLinkNavigationTarget(node.textContent).toLowerCase() === target) {
      return { from, to, node }
    }
    position = to
  }

  return null
}

function noteReferenceInsertPosition(doc: ProseMirrorNode, originBlockId: string | null): number {
  if (!originBlockId) return doc.content.size

  const origin = topLevelBlockRanges(doc).find((range) => range.node.attrs.id === originBlockId)
  return origin?.to ?? doc.content.size
}

function noteReferenceBlockId(doc: ProseMirrorNode, target: string): string {
  return nextBlockId(doc, `note-${noteReferenceSlug(target)}`)
}

function noteReferenceSlug(target: string): string {
  return target
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled'
}
