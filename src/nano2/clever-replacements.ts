import { Plugin, TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import { nanoMarkNames } from '../adapters/prosemirror/prosemirror-names'
import { nanoSchema } from '../adapters/prosemirror/prosemirror-schema'

interface InlineReplacement {
  inputType: string
  replacement: string
  token: string
}

interface DelimitedReplacement {
  inputType: string
  markName: string
  open: string
}

export function nano2CleverReplacementPlugin(): Plugin {
  return new Plugin({
    props: {
      handleTextInput: (view, from, to, text) => {
        const transaction = nano2CleverReplacementTransaction(view.state, from, to, text)
        if (!transaction) return false
        view.dispatch(transaction.scrollIntoView())
        return true
      },
    },
  })
}

export function nano2CleverReplacementTransaction(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): Transaction | null {
  if (from !== to || text.length === 0) return null

  const transaction = state.tr.insertText(text, from, to)
  const cursor = from + text.length
  const $cursor = transaction.doc.resolve(cursor)
  if (!$cursor.parent.inlineContent) return null

  return applyInlineReplacement(transaction, $cursor)
    ?? applyDelimitedReplacement(transaction, $cursor)
}

function applyInlineReplacement(transaction: Transaction, $cursor: TextSelection['$from']): Transaction | null {
  const source = $cursor.parent.textBetween(0, $cursor.parentOffset, undefined, '\ufffc')
  const replacement = inlineReplacements.find((candidate) => source.endsWith(candidate.token))
  if (!replacement) return null

  const blockStart = $cursor.start()
  const from = blockStart + source.length - replacement.token.length
  const to = blockStart + source.length
  transaction.delete(from, to)
  transaction.insertText(replacement.replacement, from)
  transaction.setSelection(TextSelection.create(transaction.doc, from + replacement.replacement.length))
  transaction.setStoredMarks([])
  transaction.setMeta('inputType', replacement.inputType)
  return transaction
}

function applyDelimitedReplacement(transaction: Transaction, $cursor: TextSelection['$from']): Transaction | null {
  const source = $cursor.parent.textBetween(0, $cursor.parentOffset, undefined, '\ufffc')

  for (const replacement of delimitedReplacements) {
    const match = delimitedReplacementMatch(source, replacement)
    if (!match) continue

    const markType = nanoSchema.marks[replacement.markName]
    if (!markType) return null

    const blockStart = $cursor.start()
    transaction.delete(blockStart + match.contentTo, blockStart + match.contentTo + replacement.open.length)
    transaction.delete(blockStart + match.openFrom, blockStart + match.openFrom + replacement.open.length)

    const markFrom = blockStart + match.openFrom
    const markTo = markFrom + match.contentTo - match.contentFrom
    transaction.addMark(markFrom, markTo, markType.create())
    transaction.setSelection(TextSelection.create(transaction.doc, markTo))
    transaction.setStoredMarks([])
    transaction.setMeta('inputType', replacement.inputType)
    return transaction
  }

  return null
}

const inlineReplacements: readonly InlineReplacement[] = [
  { inputType: 'nano2CleverReplacement:emoji-smile', token: ':)', replacement: '🙂' },
  { inputType: 'nano2CleverReplacement:emoji-sparkles', token: ':sparkles:', replacement: '✨' },
  { inputType: 'nano2CleverReplacement:arrow-right', token: '->', replacement: '→' },
  { inputType: 'nano2CleverReplacement:arrow-left', token: '<-', replacement: '←' },
  { inputType: 'nano2CleverReplacement:copyright', token: '(c)', replacement: '©' },
  { inputType: 'nano2CleverReplacement:trademark', token: '(tm)', replacement: '™' },
]

const delimitedReplacements: readonly DelimitedReplacement[] = [
  { inputType: 'nano2CleverReplacement:highlight', markName: nanoMarkNames.highlight, open: '==' },
]

interface DelimitedReplacementMatch {
  contentFrom: number
  contentTo: number
  openFrom: number
}

function delimitedReplacementMatch(source: string, replacement: DelimitedReplacement): DelimitedReplacementMatch | null {
  if (!source.endsWith(replacement.open)) return null

  const contentTo = source.length - replacement.open.length
  const openFrom = source.lastIndexOf(replacement.open, contentTo - 1)
  if (openFrom < 0) return null

  const contentFrom = openFrom + replacement.open.length
  const content = source.slice(contentFrom, contentTo)
  if (!content.trim()) return null

  return { contentFrom, contentTo, openFrom }
}
