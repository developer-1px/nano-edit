import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import { markOptions } from './nano-mark-option-definitions'
import { markShortcutMatch } from './nano-mark-shortcuts'
import { markTypeForName } from './nano-mark-type'

export function markShortcutTransaction(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): Transaction | null {
  if (from !== to || text.length === 0) return null

  const $from = state.doc.resolve(from)
  const block = $from.parent
  if (!block.isTextblock) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset) return null

  const source = textBefore + text
  const blockTextStart = from - $from.parentOffset
  for (const option of markOptions) {
    const markType = markTypeForName(state, option.markName)
    if (!markType || !block.type.allowsMarkType(markType)) continue

    for (const shortcut of option.shortcuts ?? []) {
      const match = shortcut.match ? shortcut.match(source) : markShortcutMatch(source, shortcut)
      if (!match) continue

      const transaction = state.tr.insertText(text, from, to)
      const openFrom = blockTextStart + match.openFrom
      const openTo = blockTextStart + match.contentFrom
      const contentFrom = openTo
      const contentTo = blockTextStart + match.contentTo
      const closeFrom = contentTo
      const closeTo = blockTextStart + match.closeTo
      const contentLength = contentTo - contentFrom
      const markFrom = blockTextStart + (match.markFrom ?? (shortcut.preserveSyntax ? match.openFrom : match.contentFrom))
      const markTo = blockTextStart + (match.markTo ?? match.contentTo)

      transaction.addMark(markFrom, markTo, markType.create(shortcut.attrs?.(match, source) ?? match.attrs ?? null))
      if (shortcut.preserveSyntax) {
        transaction.setSelection(TextSelection.create(transaction.doc, from + text.length))
        return transaction
      }

      transaction.delete(closeFrom, closeTo)
      transaction.delete(openFrom, openTo)
      transaction.setSelection(TextSelection.create(transaction.doc, openFrom + contentLength))
      return transaction
    }
  }

  return null
}
