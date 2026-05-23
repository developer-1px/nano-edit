import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { attrsWithSlicedSourceLineAttrs } from '../nano-source-metadata'

export function splitContinuationContent(
  block: ProseMirrorNode,
  splitOffset: number,
  afterAttrs: Record<string, unknown>,
): {
  afterAttrs: Record<string, unknown>
  afterFrom: number
  beforeAttrs: Record<string, unknown>
  beforeTo: number
} {
  const text = block.textContent
  const split = text[splitOffset] === '\n' ? splitOffset + 1 : splitOffset
  const beforeText = text.slice(0, splitOffset)
  const afterText = text.slice(split)
  const beforeLineCount = lineCount(beforeText)
  const afterLineStart = lineBreakCount(text.slice(0, split))
  const afterLineCount = lineCount(afterText)
  const continuationIndents = stringIndents(block.attrs.continuationIndents)
  const footnoteContinuationIndents = stringIndents(block.attrs.footnoteContinuationIndents)

  return {
    beforeAttrs: attrsWithFootnoteContinuationIndents(
      attrsWithSlicedSourceLineAttrs(
        attrsWithContinuationIndents(block.attrs, continuationIndents.slice(0, lineBreakCount(beforeText))),
        0,
        beforeLineCount,
      ),
      footnoteContinuationIndents.slice(0, lineBreakCount(beforeText)),
    ),
    beforeTo: splitOffset,
    afterAttrs: attrsWithFootnoteContinuationIndents(
      attrsWithSlicedSourceLineAttrs(
        attrsWithContinuationIndents(afterAttrs, continuationIndents.slice(afterLineStart)),
        afterLineStart,
        afterLineCount,
      ),
      footnoteContinuationIndents.slice(afterLineStart),
    ),
    afterFrom: split,
  }
}

function stringIndents(indents: unknown): string[] {
  return Array.isArray(indents)
    ? indents.filter((indent): indent is string => typeof indent === 'string' && /^[\t ]+$/.test(indent))
    : []
}

function attrsWithFootnoteContinuationIndents(
  attrs: Record<string, unknown>,
  footnoteContinuationIndents: string[],
): Record<string, unknown> {
  const next = { ...attrs }
  if (!('name' in next) && !('footnoteTextSpacing' in next) && !('footnoteContinuationIndents' in next)) {
    delete next.footnoteContinuationIndents
    return next
  }

  if (footnoteContinuationIndents.length > 0) {
    next.footnoteContinuationIndents = footnoteContinuationIndents
  } else {
    delete next.footnoteContinuationIndents
  }
  return next
}

function attrsWithContinuationIndents(
  attrs: Record<string, unknown>,
  continuationIndents: string[],
): Record<string, unknown> {
  const next = { ...attrs }
  if (continuationIndents.length > 0) {
    next.continuationIndents = continuationIndents
  } else {
    delete next.continuationIndents
  }
  return next
}

function lineBreakCount(text: string): number {
  return [...text].filter((char) => char === '\n').length
}

function lineCount(text: string): number {
  return lineBreakCount(text) + 1
}
