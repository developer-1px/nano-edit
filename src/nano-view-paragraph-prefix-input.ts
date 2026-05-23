import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import { nanoNodeNames } from './prosemirror-names'

export function paragraphPrefixInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  if (text !== ' ' || block.type.name !== nanoNodeNames.paragraph) return null

  const textBefore = block.textBetween(0, $from.parentOffset)
  if (textBefore.length !== $from.parentOffset || block.textContent.length <= textBefore.length) return null

  const source = textBefore + text
  const quoteMatch = /^> $/.exec(source)
  if (quoteMatch) {
    return replaceParagraphPrefix(state, $from, nanoNodeNames.quote, {
      quoteMarkerSpacing: ['space'],
    })
  }

  const todoMatch = /^([-*+]) \[([ xX])\] $/.exec(source)
  if (todoMatch) {
    const checkedMarker = todoMatch[2] === 'X' ? 'X' : 'x'
    return replaceParagraphPrefix(state, $from, nanoNodeNames.todo, {
      checked: todoMatch[2]?.toLowerCase() === 'x',
      marker: todoMatch[1],
      checkedMarker,
    })
  }

  const bulletMatch = /^([-*+]) $/.exec(source)
  if (bulletMatch) {
    return replaceParagraphPrefix(state, $from, nanoNodeNames.listItem, {
      kind: 'bullet',
      marker: bulletMatch[1],
    })
  }

  const orderedMatch = /^(\d+)([.)]) $/.exec(source)
  if (orderedMatch) {
    const orderedStartText = orderedMatch[1] ?? '1'
    const start = Math.max(1, Number(orderedStartText))
    return replaceParagraphPrefix(state, $from, nanoNodeNames.listItem, {
      kind: 'ordered',
      start,
      orderedStartText: orderedStartText === String(start) ? null : orderedStartText,
      orderedMarker: orderedMatch[2],
    })
  }

  return null
}

function replaceParagraphPrefix(
  state: EditorState,
  $from: ResolvedPos,
  nodeName: string,
  attrs: Record<string, unknown>,
): Transaction | null {
  const type = state.schema.nodes[nodeName]
  if (!type) return null

  const block = $from.parent
  const blockPosition = $from.before()
  const node = type.create({ id: block.attrs.id, ...attrs }, block.content.cut($from.parentOffset))
  const transaction = state.tr.replaceWith(blockPosition, blockPosition + block.nodeSize, node)
  transaction.setSelection(TextSelection.create(transaction.doc, blockPosition + 1))
  return transaction
}
