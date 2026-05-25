import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import { atxSpacing } from '../adapters/prosemirror/prosemirror-block-attrs'
import { blockShortcutTransactionForTemplate } from './nano-view-block-shortcut-template'
import { nanoNodeNames } from '../adapters/prosemirror/prosemirror-names'

export function headingMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== '#' || $from.parentOffset !== 0 || block.type.name !== nanoNodeNames.heading) return null

  const level = typeof block.attrs.level === 'number' ? block.attrs.level : 1
  if (level >= 6) return state.tr.setSelection(TextSelection.create(state.doc, $from.before() + 1))

  const blockPosition = $from.before()
  const transaction = state.tr.setNodeMarkup(blockPosition, block.type, {
    ...block.attrs,
    level: level + 1,
    headingStyle: 'atx',
    atxClosingLength: null,
    atxClosingSpacing: null,
  })
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

export function headingMarkerSpaceInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (
    text !== ' '
    || $from.parentOffset !== 0
    || block.type.name !== nanoNodeNames.heading
    || block.attrs.headingStyle === 'setext'
  ) {
    return null
  }

  const blockPosition = $from.before()
  const spacing = atxSpacing(block.attrs.atxTextSpacing)
  if (spacing <= 1) return state.tr.setSelection(TextSelection.create(state.doc, blockPosition + 1))

  const transaction = state.tr.setNodeMarkup(blockPosition, block.type, {
    ...block.attrs,
    atxTextSpacing: spacing + 1,
  })
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}

export function headingPrefixInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== '#' || block.type.name !== nanoNodeNames.paragraph) return null

  if ($from.parentOffset === 0 && block.textContent.length > 0) {
    const headingType = state.schema.nodes[nanoNodeNames.heading]
    if (!headingType) return null

    const blockPosition = $from.before()
    const transaction = state.tr.setNodeMarkup(blockPosition, headingType, {
      id: block.attrs.id,
      level: 1,
      headingStyle: 'atx',
    })
    transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
    return transaction
  }

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset || block.textContent.length !== textBefore.length) return null

  const source = textBefore + text
  if (!/^#{1,6}$/.test(source)) return null

  return blockShortcutTransactionForTemplate(state, $from, {
    type: 'heading',
    level: source.length,
    text: '',
  })
}
