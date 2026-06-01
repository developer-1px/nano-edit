import type { Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model'
import { Fragment } from 'prosemirror-model'
import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import type { BlockKeyboardContext } from '../../assembly/capability'
import { nextBlockId } from '../../blocks/nano-block-options'
import {
  bulletMarker,
  clampIndent,
  footnoteContinuationIndent,
  indentText,
  listContinuationDefaultIndent,
  listContinuationIndent,
  orderedMarker,
  orderedStartText,
} from '../../codecs/markdown/nano-markdown-block-attrs'
import {
  attrsWithSlicedSourceLineAttrs,
  quoteMarkerDepthsOrNull,
} from '../../core/nano-source-metadata'
import { nanoNodeNames } from '../../adapters/prosemirror/prosemirror-nano'

export function continuationMarkerInputTransaction(
  state: EditorState,
  $from: ResolvedPos,
  text: string,
): Transaction | null {
  const block = $from.parent
  const lineIndex = continuationLineIndex(block, $from.parentOffset)
  if (lineIndex === null) return null

  if (text === '>' && block.type.name === nanoNodeNames.quote) {
    return setQuoteLineDepth(state, $from, 'quoteMarkerDepths', lineIndex, 1)
  }

  if (text === '>' && block.type.name === nanoNodeNames.callout) {
    return setQuoteLineDepth(state, $from, 'calloutMarkerDepths', lineIndex, 1)
  }

  if (text === ' ' && (block.type.name === nanoNodeNames.listItem || block.type.name === nanoNodeNames.todo)) {
    return shiftListContinuationIndent(state, $from, lineIndex, 1)
  }

  if (text === ' ' && block.type.name === nanoNodeNames.footnote) {
    return shiftFootnoteContinuationIndent(state, $from, lineIndex, 1)
  }

  return null
}

export function continuationMarkerBackspaceTransaction(context: BlockKeyboardContext): Transaction | null {
  const lineIndex = continuationLineIndex(context.block, context.$from.parentOffset)
  if (lineIndex === null) return null

  if (context.block.type.name === nanoNodeNames.quote) {
    return decreaseQuoteContinuationLine(context, 'quoteMarkerDepths', lineIndex)
  }

  if (context.block.type.name === nanoNodeNames.callout) {
    return decreaseQuoteContinuationLine(context, 'calloutMarkerDepths', lineIndex)
  }

  if (context.block.type.name === nanoNodeNames.listItem || context.block.type.name === nanoNodeNames.todo) {
    return shiftListContinuationIndent(context.state, context.$from, lineIndex, -1)
  }

  if (context.block.type.name === nanoNodeNames.footnote) {
    return shiftFootnoteContinuationIndent(context.state, context.$from, lineIndex, -1)
  }

  return null
}

function continuationLineIndex(block: ProseMirrorNode, offset: number): number | null {
  if (offset <= 0) return null

  const before = block.textBetween(0, offset)
  if (!before.endsWith('\n')) return null

  return before.split('\n').length - 1
}

function setQuoteLineDepth(
  state: EditorState,
  $from: ResolvedPos,
  attrName: 'quoteMarkerDepths' | 'calloutMarkerDepths',
  lineIndex: number,
  delta: number,
): Transaction | null {
  const block = $from.parent
  const depths = normalizedDepths(block.attrs[attrName], block.textContent)
  depths[lineIndex] = Math.max(1, (depths[lineIndex] ?? 1) + delta)
  const attrs = { ...block.attrs, [attrName]: compactDepths(depths) }
  if (!attrs[attrName]) delete attrs[attrName]

  const transaction = state.tr.setNodeMarkup($from.before(), block.type, attrs)
  transaction.setSelection(TextSelection.create(transaction.doc, $from.pos))
  return transaction
}

function decreaseQuoteContinuationLine(
  context: BlockKeyboardContext,
  attrName: 'quoteMarkerDepths' | 'calloutMarkerDepths',
  lineIndex: number,
): Transaction | null {
  const depths = normalizedDepths(context.block.attrs[attrName], context.block.textContent)
  if ((depths[lineIndex] ?? 1) > 1) return setQuoteLineDepth(context.state, context.$from, attrName, lineIndex, -1)

  return splitContinuationLineToParagraph(context, lineIndex)
}

function splitContinuationLineToParagraph(context: BlockKeyboardContext, lineIndex: number): Transaction | null {
  const paragraphType = context.state.schema.nodes[nanoNodeNames.paragraph]
  if (!paragraphType) return null

  const offset = context.$from.parentOffset
  const beforeContent = context.block.content.cut(0, offset - 1)
  const afterContent = context.block.content.cut(offset)
  const before = context.block.type.create(
    attrsWithSlicedSourceLineAttrs(context.block.attrs, 0, lineIndex),
    beforeContent,
  )
  const paragraph = paragraphType.create(
    { id: nextBlockId(context.state.doc, `${String(context.block.attrs.id ?? 'block')}-line-${lineIndex + 1}`) },
    afterContent,
  )
  const replacement = before.textContent.length > 0
    ? Fragment.fromArray([before, paragraph])
    : Fragment.from(paragraph)
  const transaction = context.state.tr.replaceWith(
    context.blockPosition,
    context.blockPosition + context.block.nodeSize,
    replacement,
  )
  const paragraphPosition = before.textContent.length > 0 ? context.blockPosition + before.nodeSize : context.blockPosition
  transaction.setSelection(TextSelection.create(transaction.doc, paragraphPosition + 1))
  return transaction
}

function shiftListContinuationIndent(
  state: EditorState,
  $from: ResolvedPos,
  lineIndex: number,
  delta: 1 | -1,
): Transaction | null {
  const block = $from.parent
  const attrIndex = lineIndex - 1
  const defaultIndent = defaultListContinuationIndent(block)
  const indents = Array.from({ length: Math.max(0, block.textContent.split('\n').length - 1) }, (_value, index) =>
    listContinuationIndent(Array.isArray(block.attrs.continuationIndents) ? block.attrs.continuationIndents[index] : null, defaultIndent),
  )
  if (!indents[attrIndex]) return null

  const next = delta > 0 ? `${indents[attrIndex]} ` : removeOneHiddenSpace(indents[attrIndex])
  if (!next || next === indents[attrIndex]) return null

  indents[attrIndex] = next
  const attrs = { ...block.attrs }
  if (indents.some((indent) => indent !== defaultIndent)) attrs.continuationIndents = indents
  else delete attrs.continuationIndents

  const transaction = state.tr.setNodeMarkup($from.before(), block.type, attrs)
  transaction.setSelection(TextSelection.create(transaction.doc, $from.pos))
  return transaction
}

function shiftFootnoteContinuationIndent(
  state: EditorState,
  $from: ResolvedPos,
  lineIndex: number,
  delta: 1 | -1,
): Transaction | null {
  const block = $from.parent
  const attrIndex = lineIndex - 1
  const defaultIndent = '    '
  const indents = Array.from({ length: Math.max(0, block.textContent.split('\n').length - 1) }, (_value, index) =>
    footnoteContinuationIndent(Array.isArray(block.attrs.footnoteContinuationIndents) ? block.attrs.footnoteContinuationIndents[index] : null),
  )
  if (!indents[attrIndex]) return null

  const next = delta > 0 ? `${indents[attrIndex]} ` : removeOneHiddenSpace(indents[attrIndex], defaultIndent.length)
  if (!next || next === indents[attrIndex]) return null

  indents[attrIndex] = next
  const attrs = { ...block.attrs }
  if (indents.some((indent) => indent !== defaultIndent)) attrs.footnoteContinuationIndents = indents
  else delete attrs.footnoteContinuationIndents

  const transaction = state.tr.setNodeMarkup($from.before(), block.type, attrs)
  transaction.setSelection(TextSelection.create(transaction.doc, $from.pos))
  return transaction
}

function normalizedDepths(depths: unknown, text: string): number[] {
  const lineCount = Math.max(1, text.split('\n').length)
  const normalized = quoteMarkerDepthsOrNull(depths) ?? []
  return Array.from({ length: lineCount }, (_value, index) => normalized[index] ?? 1)
}

function compactDepths(depths: readonly number[]): number[] | null {
  return depths.some((depth) => depth !== 1) ? [...depths] : null
}

function defaultListContinuationIndent(block: ProseMirrorNode): string {
  const indent = indentText(block.attrs.indentText) ?? '  '.repeat(clampIndent(block.attrs.indent))
  if (block.type.name === nanoNodeNames.todo) {
    const checked = block.attrs.checked === true ? checkedMarker(block.attrs.checkedMarker) : ' '
    return listContinuationDefaultIndent(`${indent}${bulletMarker(block.attrs.marker)} [${checked}]`)
  }

  const marker = block.attrs.kind === 'ordered'
    ? `${orderedStartText(block.attrs.orderedStartText) ?? String(block.attrs.start ?? 1)}${orderedMarker(block.attrs.orderedMarker)}`
    : bulletMarker(block.attrs.marker)
  return listContinuationDefaultIndent(`${indent}${marker}`)
}

function checkedMarker(marker: unknown): 'x' | 'X' {
  return marker === 'X' ? 'X' : 'x'
}

function removeOneHiddenSpace(indent: string, minLength = 1): string | null {
  if (indent.length <= minLength) return null
  return indent.slice(0, -1)
}
