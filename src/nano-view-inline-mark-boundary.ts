import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'
import { TextSelection, type EditorState, type Transaction } from 'prosemirror-state'
import { footnoteName } from './nano-footnote'
import { normalizeTagName, tagDisplayLabel } from './nano-tag'
import { nanoMarkNames } from './prosemirror-names'

export type InlineBoundaryDirection = 'backward' | 'forward'

interface MarkRange {
  from: number
  mark: Mark
  to: number
}

export function inlineMarkBoundaryTransaction(
  state: EditorState,
  direction: InlineBoundaryDirection,
): Transaction | null {
  const { selection } = state
  if (!selection.empty) return null

  const $from = selection.$from
  const block = $from.parent
  if (!block.isTextblock) return null

  const offset = $from.parentOffset
  const range = textMarkRanges(block).find((candidate) =>
    candidate.mark.type.name !== nanoMarkNames.source
    && (direction === 'backward' ? candidate.from === offset : candidate.to === offset),
  )
  if (!range) return null

  const blockStart = selection.from - offset
  const from = blockStart + range.from
  const to = blockStart + range.to
  const sourceText = block.textBetween(range.from, range.to)
  const plainText = plainTextAfterRemovingSourceMark(range.mark, sourceText)
  const transaction = state.tr

  if (plainText !== sourceText) {
    if (plainText) transaction.replaceWith(from, to, state.schema.text(plainText))
    else transaction.delete(from, to)
  } else {
    transaction.removeMark(from, to, range.mark)
  }

  const position = direction === 'backward' ? from : from + plainText.length
  transaction.setSelection(TextSelection.create(transaction.doc, Math.min(position, transaction.doc.content.size)))
  return transaction
}

export function inlineSourceTokenTextInputTransaction(
  state: EditorState,
  from: number,
  to: number,
  text: string,
): Transaction | null {
  if (!text) return null

  const context = sourceTokenEditContext(state, from, to)
  if (!context) return null

  if (from !== to) {
    const ranges = intersectingVisualSourceMarkRanges(context, context.fromOffset, context.toOffset)
    if (ranges.length === 0) return null
    const expanded = expandedOffsets(context.fromOffset, context.toOffset, ranges)
    return replaceSourceTokenRange(state, context.blockStart, expanded.from, expanded.to, text, text.length)
  }

  const range = interiorVisualSourceMarkRange(context, context.fromOffset)
  if (!range) return null

  const sourceText = context.block.textBetween(range.from, range.to)
  const label = visualTextForSourceMark(range.mark, sourceText)
  const labelOffset = visualLabelOffset(range.mark, sourceText, context.fromOffset - range.from, label)
  const replacement = `${label.slice(0, labelOffset)}${text}${label.slice(labelOffset)}`
  return replaceSourceTokenRange(
    state,
    context.blockStart,
    range.from,
    range.to,
    replacement,
    labelOffset + text.length,
  )
}

export function inlineSourceTokenDeleteTransaction(
  state: EditorState,
  direction: InlineBoundaryDirection,
): Transaction | null {
  const { selection } = state
  const context = sourceTokenEditContext(state, selection.from, selection.to)
  if (!context) return null

  if (!selection.empty) {
    const ranges = intersectingVisualSourceMarkRanges(context, context.fromOffset, context.toOffset)
    if (ranges.length === 0) return null
    const expanded = expandedOffsets(context.fromOffset, context.toOffset, ranges)
    return replaceSourceTokenRange(state, context.blockStart, expanded.from, expanded.to, '', 0)
  }

  const range = interiorVisualSourceMarkRange(context, context.fromOffset)
    ?? edgeVisualSourceMarkRange(context, context.fromOffset, direction)
  if (!range) return null

  const sourceText = context.block.textBetween(range.from, range.to)
  const label = visualTextForSourceMark(range.mark, sourceText)
  const labelOffset = visualLabelOffset(range.mark, sourceText, context.fromOffset - range.from, label)
  const deleteFrom = direction === 'backward'
    ? Math.max(0, labelOffset - 1)
    : Math.min(label.length, labelOffset)
  const deleteTo = direction === 'backward'
    ? labelOffset
    : Math.min(label.length, labelOffset + 1)
  const replacement = `${label.slice(0, deleteFrom)}${label.slice(deleteTo)}`
  return replaceSourceTokenRange(state, context.blockStart, range.from, range.to, replacement, deleteFrom)
}

interface SourceTokenEditContext {
  block: ProseMirrorNode
  blockStart: number
  fromOffset: number
  toOffset: number
}

function sourceTokenEditContext(state: EditorState, from: number, to: number): SourceTokenEditContext | null {
  const $from = state.doc.resolve(from)
  const $to = state.doc.resolve(to)
  if ($from.start() !== $to.start()) return null

  const block = $from.parent
  if (!block.isTextblock) return null

  const blockStart = $from.start()
  return {
    block,
    blockStart,
    fromOffset: from - blockStart,
    toOffset: to - blockStart,
  }
}

function textMarkRanges(block: ProseMirrorNode): MarkRange[] {
  const ranges: MarkRange[] = []
  let offset = 0

  for (let index = 0; index < block.childCount; index += 1) {
    const child = block.child(index)
    const from = offset
    const to = from + child.nodeSize
    offset = to
    if (!child.isText || from === to) continue

    for (const mark of child.marks) {
      const previous = ranges.findLast((range) => range.to === from && range.mark.eq(mark))
      if (previous) previous.to = to
      else ranges.push({ from, mark, to })
    }
  }

  return ranges
}

function intersectingVisualSourceMarkRanges(
  context: SourceTokenEditContext,
  fromOffset: number,
  toOffset: number,
): MarkRange[] {
  return textMarkRanges(context.block)
    .filter((range) => isVisualSourceMark(range.mark) && range.from < toOffset && range.to > fromOffset)
}

function interiorVisualSourceMarkRange(context: SourceTokenEditContext, offset: number): MarkRange | null {
  return textMarkRanges(context.block)
    .find((range) => isVisualSourceMark(range.mark) && range.from < offset && range.to > offset)
    ?? null
}

function edgeVisualSourceMarkRange(
  context: SourceTokenEditContext,
  offset: number,
  direction: InlineBoundaryDirection,
): MarkRange | null {
  return textMarkRanges(context.block)
    .find((range) =>
      isVisualSourceMark(range.mark)
      && (direction === 'backward' ? range.to === offset : range.from === offset),
    )
    ?? null
}

function expandedOffsets(fromOffset: number, toOffset: number, ranges: readonly MarkRange[]): { from: number; to: number } {
  return {
    from: Math.min(fromOffset, ...ranges.map((range) => range.from)),
    to: Math.max(toOffset, ...ranges.map((range) => range.to)),
  }
}

function replaceSourceTokenRange(
  state: EditorState,
  blockStart: number,
  fromOffset: number,
  toOffset: number,
  text: string,
  selectionOffset: number,
): Transaction {
  const from = blockStart + fromOffset
  const to = blockStart + toOffset
  const transaction = state.tr
  if (text) transaction.replaceWith(from, to, state.schema.text(text))
  else transaction.delete(from, to)
  transaction.setSelection(TextSelection.create(transaction.doc, from + selectionOffset))
  return transaction
}

function isVisualSourceMark(mark: Mark): boolean {
  switch (mark.type.name) {
    case nanoMarkNames.tag:
    case nanoMarkNames.noteLink:
    case nanoMarkNames.math:
    case nanoMarkNames.footnoteRef:
      return true
    case nanoMarkNames.link:
      return mark.attrs.syntax === 'autolink'
    default:
      return false
  }
}

function plainTextAfterRemovingSourceMark(mark: Mark, sourceText: string): string {
  if (isVisualSourceMark(mark)) return visualTextForSourceMark(mark, sourceText)
  return sourceText
}

function visualTextForSourceMark(mark: Mark, sourceText: string): string {
  switch (mark.type.name) {
    case nanoMarkNames.noteLink:
      return String(mark.attrs.alias || mark.attrs.target || '')
    case nanoMarkNames.math:
      return String(mark.attrs.formula ?? '')
    case nanoMarkNames.footnoteRef:
      return footnoteName(String(mark.attrs.name ?? '')) || ''
    case nanoMarkNames.link:
      return mark.attrs.syntax === 'autolink' ? String(mark.attrs.href ?? '') : sourceText
    case nanoMarkNames.tag: {
      const name = normalizeTagName(String(mark.attrs.name ?? ''))
      return tagDisplayLabel(name) ?? sourceText
    }
    default:
      return sourceText
  }
}

function visualLabelOffset(mark: Mark, sourceText: string, sourceOffset: number, label: string): number {
  switch (mark.type.name) {
    case nanoMarkNames.noteLink: {
      const aliasStart = sourceText.lastIndexOf('|')
      if (aliasStart >= 0) return clampOffset(sourceOffset - aliasStart - 1, label.length)
      return clampOffset(sourceOffset - 2, label.length)
    }
    case nanoMarkNames.math:
    case nanoMarkNames.link:
      return clampOffset(sourceOffset - 1, label.length)
    case nanoMarkNames.footnoteRef:
      return clampOffset(sourceOffset - 2, label.length)
    case nanoMarkNames.tag:
      return clampOffset(sourceOffset - 1, label.length)
    default:
      return clampOffset(sourceOffset, label.length)
  }
}

function clampOffset(value: number, length: number): number {
  return Math.max(0, Math.min(value, length))
}
