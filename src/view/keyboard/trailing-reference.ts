import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, type Transaction } from 'prosemirror-state'
import { noteLinkTarget } from '../../core/nano-note-link'
import { tagTokenEndingAt } from '../../core/nano-tag'
import { nanoMarkNames } from '../../adapters/prosemirror/prosemirror-nano'

export function trailingReferenceMarkTransaction(state: EditorState): Transaction | null {
  const { selection } = state
  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  if (!block.isTextblock) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset) return null

  const tagTransaction = trailingTagMarkTransaction(state, block, textBefore)
  if (tagTransaction) return tagTransaction

  return trailingNoteLinkMarkTransaction(state, block, textBefore)
}

function trailingTagMarkTransaction(
  state: EditorState,
  block: ProseMirrorNode,
  textBefore: string,
): Transaction | null {
  const markType = state.schema.marks[nanoMarkNames.tag]
  if (!markType || !block.type.allowsMarkType(markType)) return null

  const tag = tagTokenEndingAt(textBefore)
  if (!tag) return null

  const from = state.selection.from - tag.token.length
  const to = state.selection.from
  if (state.doc.rangeHasMark(from, to, markType)) return null

  return state.tr.addMark(from, to, markType.create({ name: tag.name }))
}

function trailingNoteLinkMarkTransaction(
  state: EditorState,
  block: ProseMirrorNode,
  textBefore: string,
): Transaction | null {
  const markType = state.schema.marks[nanoMarkNames.noteLink]
  if (!markType || !block.type.allowsMarkType(markType)) return null
  if (!textBefore.endsWith(']]')) return null

  const openFrom = textBefore.lastIndexOf('[[', textBefore.length - 3)
  if (openFrom < 0) return null

  const token = textBefore.slice(openFrom)
  const target = noteLinkTarget(token)
  if (!target) return null

  const from = state.selection.from - token.length
  const to = state.selection.from
  if (state.doc.rangeHasMark(from, to, markType)) return null

  return state.tr.addMark(from, to, markType.create({ target }))
}
