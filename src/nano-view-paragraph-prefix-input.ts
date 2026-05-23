import type { ResolvedPos } from 'prosemirror-model'
import { EditorState, TextSelection, type Transaction } from 'prosemirror-state'
import {
  markdownIndentLevel,
  markdownIndentText,
  orderedStartTemplateAttrs,
} from './nano-block-option-list-values'
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

  const todoMatch = /^([ \t]*)([-*+]) \[([ xX])\] $/.exec(source)
  if (todoMatch) {
    const checkedMarker = todoMatch[3] === 'X' ? 'X' : 'x'
    return replaceParagraphPrefix(state, $from, nanoNodeNames.todo, {
      ...listIndentAttrs(todoMatch[1] ?? ''),
      checked: todoMatch[3]?.toLowerCase() === 'x',
      marker: todoMatch[2],
      checkedMarker,
    })
  }

  const bulletMatch = /^([ \t]*)([-*+]) $/.exec(source)
  if (bulletMatch) {
    return replaceParagraphPrefix(state, $from, nanoNodeNames.listItem, {
      ...listIndentAttrs(bulletMatch[1] ?? ''),
      kind: 'bullet',
      marker: bulletMatch[2],
    })
  }

  const orderedMatch = /^([ \t]*)(\d+)([.)]) $/.exec(source)
  if (orderedMatch) {
    return replaceParagraphPrefix(state, $from, nanoNodeNames.listItem, {
      ...listIndentAttrs(orderedMatch[1] ?? ''),
      kind: 'ordered',
      ...orderedStartTemplateAttrs(orderedMatch[2]),
      orderedMarker: orderedMatch[3],
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

function listIndentAttrs(rawIndent: string): { indent: number; indentText?: string } {
  const rawIndentText = markdownIndentText(rawIndent)
  return {
    indent: markdownIndentLevel(rawIndent),
    ...(rawIndentText ? { indentText: rawIndentText } : {}),
  }
}
